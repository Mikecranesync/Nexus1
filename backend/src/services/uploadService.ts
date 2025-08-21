import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import crypto from 'crypto';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_S3_BUCKET_REGION || process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

const bucketName = process.env.AWS_S3_BUCKET_NAME || 'nexus-app-uploads';

// File type validation
const allowedImageTypes = (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/gif,image/webp').split(',');
const allowedFileTypes = (process.env.ALLOWED_FILE_TYPES || 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain').split(',');

// Generate unique filename
const generateFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, extension);
  
  // Sanitize filename
  const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  return `${timestamp}_${randomString}_${sanitizedName}${extension}`;
};

// File filter function
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const isImage = allowedImageTypes.includes(file.mimetype);
  const isFile = allowedFileTypes.includes(file.mimetype);
  
  if (isImage || isFile) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${[...allowedImageTypes, ...allowedFileTypes].join(', ')}`));
  }
};

// Configure multer with S3
export const uploadMiddleware = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: bucketName,
    metadata: (req: any, file: Express.Multer.File, cb: (error: any, metadata?: any) => void) => {
      cb(null, {
        fieldName: file.fieldname,
        originalName: file.originalname,
        uploadedBy: req.body.uploadedBy || 'unknown',
        uploadedAt: new Date().toISOString()
      });
    },
    key: (req: any, file: Express.Multer.File, cb: (error: any, key?: string) => void) => {
      const folder = allowedImageTypes.includes(file.mimetype) ? 'images' : 'files';
      const fileName = generateFileName(file.originalname);
      const organizationId = req.body.organizationId || 'default';
      const key = `${organizationId}/${folder}/${fileName}`;
      cb(null, key);
    }
  }),
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE?.replace('mb', '') || '50') * 1024 * 1024 // Default 50MB
  }
});

// Service functions
export class UploadService {
  
  // Upload single file directly to S3
  static async uploadFile(
    file: Buffer, 
    fileName: string, 
    mimeType: string, 
    organizationId: string = 'default'
  ): Promise<string> {
    try {
      const folder = allowedImageTypes.includes(mimeType) ? 'images' : 'files';
      const key = `${organizationId}/${folder}/${generateFileName(fileName)}`;
      
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: file,
        ContentType: mimeType,
        Metadata: {
          originalName: fileName,
          uploadedAt: new Date().toISOString()
        }
      });
      
      await s3Client.send(command);
      
      // Return public URL
      return `https://${bucketName}.s3.${process.env.AWS_S3_BUCKET_REGION || 'us-east-1'}.amazonaws.com/${key}`;
      
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new Error('Failed to upload file to S3');
    }
  }
  
  // Generate presigned URL for secure uploads
  static async generatePresignedUrl(
    fileName: string, 
    mimeType: string, 
    organizationId: string = 'default',
    expiresIn: number = 3600 // 1 hour
  ): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    try {
      const folder = allowedImageTypes.includes(mimeType) ? 'images' : 'files';
      const key = `${organizationId}/${folder}/${generateFileName(fileName)}`;
      
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: mimeType,
        Metadata: {
          originalName: fileName,
          uploadedAt: new Date().toISOString()
        }
      });
      
      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
      const fileUrl = `https://${bucketName}.s3.${process.env.AWS_S3_BUCKET_REGION || 'us-east-1'}.amazonaws.com/${key}`;
      
      return { uploadUrl, fileUrl, key };
      
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new Error('Failed to generate presigned URL');
    }
  }
  
  // Delete file from S3
  static async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract key from URL
      const url = new URL(fileUrl);
      const key = url.pathname.substring(1); // Remove leading slash
      
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key
      });
      
      await s3Client.send(command);
      
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      throw new Error('Failed to delete file from S3');
    }
  }
  
  // Generate presigned URL for downloading private files
  static async generateDownloadUrl(
    fileUrl: string, 
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      // Extract key from URL
      const url = new URL(fileUrl);
      const key = url.pathname.substring(1);
      
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key
      });
      
      return await getSignedUrl(s3Client, command, { expiresIn });
      
    } catch (error) {
      console.error('Error generating download URL:', error);
      throw new Error('Failed to generate download URL');
    }
  }
  
  // Validate file type
  static validateFileType(mimeType: string): { isValid: boolean; isImage: boolean; isFile: boolean } {
    const isImage = allowedImageTypes.includes(mimeType);
    const isFile = allowedFileTypes.includes(mimeType);
    
    return {
      isValid: isImage || isFile,
      isImage,
      isFile
    };
  }
  
  // Get file info from URL
  static getFileInfo(fileUrl: string): { key: string; fileName: string; folder: string } {
    try {
      const url = new URL(fileUrl);
      const key = url.pathname.substring(1);
      const parts = key.split('/');
      
      return {
        key,
        fileName: parts[parts.length - 1],
        folder: parts.length > 1 ? parts[parts.length - 2] : 'unknown'
      };
    } catch (error) {
      throw new Error('Invalid file URL');
    }
  }
  
  // Health check for S3 connection
  static async healthCheck(): Promise<boolean> {
    try {
      // Try to list objects in the bucket (without actually retrieving them)
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: 'health-check-dummy-key'
      });
      
      // This will fail, but if we get a specific error about the key not existing
      // rather than authentication/permission errors, then our connection is working
      try {
        await s3Client.send(command);
      } catch (error: any) {
        // If we get a NoSuchKey error, that means our credentials and bucket access are working
        if (error.name === 'NoSuchKey') {
          return true;
        }
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('S3 health check failed:', error);
      return false;
    }
  }
}

// Utility functions for frontend integration
export const uploadHelpers = {
  // Get file extension from filename
  getFileExtension: (fileName: string): string => {
    return path.extname(fileName).toLowerCase();
  },
  
  // Check if file is an image based on extension
  isImageFile: (fileName: string): boolean => {
    const ext = path.extname(fileName).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
  },
  
  // Format file size
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
  
  // Validate file size
  validateFileSize: (sizeInBytes: number): boolean => {
    const maxSize = parseInt(process.env.MAX_FILE_SIZE?.replace('mb', '') || '50') * 1024 * 1024;
    return sizeInBytes <= maxSize;
  }
};

export default UploadService;