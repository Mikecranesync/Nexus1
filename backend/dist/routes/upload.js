"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uploadService_1 = require("../services/uploadService");
const db_1 = require("../db");
const router = express_1.default.Router();
// POST /api/upload - Upload files to S3
router.post('/', uploadService_1.uploadMiddleware.array('files', 10), async (req, res) => {
    try {
        const files = req.files;
        const { organizationId, assetId, uploadedBy, fileType } = req.body;
        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }
        // Validate required fields
        if (!organizationId || !uploadedBy) {
            // Clean up uploaded files if validation fails
            for (const file of files) {
                try {
                    await uploadService_1.UploadService.deleteFile(file.location);
                }
                catch (deleteError) {
                    console.error('Error cleaning up file:', deleteError);
                }
            }
            return res.status(400).json({
                success: false,
                message: 'organizationId and uploadedBy are required'
            });
        }
        // Process uploaded files
        const uploadedFiles = files.map(file => ({
            originalName: file.originalname,
            fileName: file.key.split('/').pop() || file.originalname,
            url: file.location,
            size: file.size,
            mimeType: file.mimetype,
            key: file.key,
            isImage: uploadService_1.uploadHelpers.isImageFile(file.originalname),
            formattedSize: uploadService_1.uploadHelpers.formatFileSize(file.size)
        }));
        // Separate images and files
        const images = uploadedFiles.filter(file => file.isImage);
        const documents = uploadedFiles.filter(file => !file.isImage);
        // If assetId is provided, update the asset with new file URLs
        if (assetId) {
            try {
                const asset = await db_1.prisma.asset.findUnique({
                    where: { id: assetId }
                });
                if (!asset) {
                    return res.status(404).json({
                        success: false,
                        message: 'Asset not found'
                    });
                }
                // Update asset with new file URLs
                const updatedAsset = await db_1.prisma.asset.update({
                    where: { id: assetId },
                    data: {
                        imageUrls: [
                            ...asset.imageUrls,
                            ...images.map(img => img.url)
                        ],
                        fileUrls: [
                            ...asset.fileUrls,
                            ...documents.map(doc => doc.url)
                        ]
                    }
                });
                // Log activity
                await db_1.prisma.activityLog.create({
                    data: {
                        action: 'files_uploaded',
                        entityType: 'Asset',
                        entityId: assetId,
                        description: `${uploadedFiles.length} file(s) uploaded to asset "${asset.name}"`,
                        newValues: {
                            uploadedFiles: uploadedFiles.map(f => ({
                                name: f.originalName,
                                url: f.url,
                                type: f.mimeType,
                                size: f.formattedSize
                            }))
                        },
                        organizationId,
                        userId: uploadedBy
                    }
                });
                return res.status(201).json({
                    success: true,
                    message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
                    data: {
                        files: uploadedFiles,
                        asset: updatedAsset,
                        summary: {
                            totalFiles: uploadedFiles.length,
                            images: images.length,
                            documents: documents.length,
                            totalSize: uploadedFiles.reduce((sum, file) => sum + file.size, 0)
                        }
                    }
                });
            }
            catch (error) {
                console.error('Error updating asset with file URLs:', error);
                // Clean up uploaded files if database operation fails
                for (const file of files) {
                    try {
                        await uploadService_1.UploadService.deleteFile(file.location);
                    }
                    catch (deleteError) {
                        console.error('Error cleaning up file:', deleteError);
                    }
                }
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update asset with uploaded files'
                });
            }
        }
        // If no assetId, just return the uploaded file information
        res.status(201).json({
            success: true,
            message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
            data: {
                files: uploadedFiles,
                summary: {
                    totalFiles: uploadedFiles.length,
                    images: images.length,
                    documents: documents.length,
                    totalSize: uploadedFiles.reduce((sum, file) => sum + file.size, 0)
                }
            }
        });
    }
    catch (error) {
        console.error('Error uploading files:', error);
        // Clean up any uploaded files on error
        if (req.files) {
            const files = req.files;
            for (const file of files) {
                try {
                    await uploadService_1.UploadService.deleteFile(file.location);
                }
                catch (deleteError) {
                    console.error('Error cleaning up file:', deleteError);
                }
            }
        }
        res.status(500).json({
            success: false,
            message: 'File upload failed',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});
// POST /api/upload/presigned - Generate presigned URL for direct uploads
router.post('/presigned', async (req, res) => {
    try {
        const { fileName, mimeType, organizationId } = req.body;
        if (!fileName || !mimeType || !organizationId) {
            return res.status(400).json({
                success: false,
                message: 'fileName, mimeType, and organizationId are required'
            });
        }
        // Validate file type
        const validation = uploadService_1.UploadService.validateFileType(mimeType);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: `File type ${mimeType} is not allowed`
            });
        }
        const { uploadUrl, fileUrl, key } = await uploadService_1.UploadService.generatePresignedUrl(fileName, mimeType, organizationId);
        res.json({
            success: true,
            data: {
                uploadUrl,
                fileUrl,
                key,
                isImage: validation.isImage,
                expiresIn: 3600 // 1 hour
            }
        });
    }
    catch (error) {
        console.error('Error generating presigned URL:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate presigned URL',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});
// DELETE /api/upload/:assetId/file - Remove file from asset and S3
router.delete('/:assetId/file', async (req, res) => {
    try {
        const { assetId } = req.params;
        const { fileUrl, deletedBy } = req.body;
        if (!fileUrl) {
            return res.status(400).json({
                success: false,
                message: 'fileUrl is required'
            });
        }
        // Get asset
        const asset = await db_1.prisma.asset.findUnique({
            where: { id: assetId }
        });
        if (!asset) {
            return res.status(404).json({
                success: false,
                message: 'Asset not found'
            });
        }
        // Check if file exists in asset
        const isImage = asset.imageUrls.includes(fileUrl);
        const isFile = asset.fileUrls.includes(fileUrl);
        if (!isImage && !isFile) {
            return res.status(404).json({
                success: false,
                message: 'File not found in asset'
            });
        }
        // Remove file from S3
        try {
            await uploadService_1.UploadService.deleteFile(fileUrl);
        }
        catch (s3Error) {
            console.error('Error deleting from S3:', s3Error);
            // Continue with database update even if S3 deletion fails
        }
        // Update asset to remove file URL
        const updatedAsset = await db_1.prisma.asset.update({
            where: { id: assetId },
            data: {
                imageUrls: isImage ? asset.imageUrls.filter(url => url !== fileUrl) : asset.imageUrls,
                fileUrls: isFile ? asset.fileUrls.filter(url => url !== fileUrl) : asset.fileUrls
            }
        });
        // Log activity
        if (deletedBy) {
            await db_1.prisma.activityLog.create({
                data: {
                    action: 'file_deleted',
                    entityType: 'Asset',
                    entityId: assetId,
                    description: `File deleted from asset "${asset.name}"`,
                    oldValues: { deletedFileUrl: fileUrl },
                    organizationId: asset.organizationId,
                    userId: deletedBy
                }
            });
        }
        res.json({
            success: true,
            message: 'File deleted successfully',
            data: {
                deletedFileUrl: fileUrl,
                asset: updatedAsset
            }
        });
    }
    catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete file',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});
// GET /api/upload/download - Generate secure download URL
router.get('/download', async (req, res) => {
    try {
        const { fileUrl, expiresIn } = req.query;
        if (!fileUrl) {
            return res.status(400).json({
                success: false,
                message: 'fileUrl is required'
            });
        }
        const downloadUrl = await uploadService_1.UploadService.generateDownloadUrl(fileUrl, expiresIn ? parseInt(expiresIn) : 3600);
        res.json({
            success: true,
            data: {
                downloadUrl,
                expiresIn: expiresIn ? parseInt(expiresIn) : 3600
            }
        });
    }
    catch (error) {
        console.error('Error generating download URL:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate download URL',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});
// GET /api/upload/health - Check S3 connection health
router.get('/health', async (req, res) => {
    try {
        const isHealthy = await uploadService_1.UploadService.healthCheck();
        res.json({
            success: true,
            data: {
                s3Connected: isHealthy,
                bucketName: process.env.AWS_S3_BUCKET_NAME,
                region: process.env.AWS_S3_BUCKET_REGION,
                maxFileSize: process.env.MAX_FILE_SIZE,
                allowedImageTypes: process.env.ALLOWED_IMAGE_TYPES?.split(','),
                allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',')
            }
        });
    }
    catch (error) {
        console.error('Upload service health check failed:', error);
        res.status(500).json({
            success: false,
            message: 'Upload service health check failed',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});
exports.default = router;
//# sourceMappingURL=upload.js.map