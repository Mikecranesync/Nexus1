import multer from 'multer';
export declare const uploadMiddleware: multer.Multer;
export declare class UploadService {
    static uploadFile(file: Buffer, fileName: string, mimeType: string, organizationId?: string): Promise<string>;
    static generatePresignedUrl(fileName: string, mimeType: string, organizationId?: string, expiresIn?: number): Promise<{
        uploadUrl: string;
        fileUrl: string;
        key: string;
    }>;
    static deleteFile(fileUrl: string): Promise<void>;
    static generateDownloadUrl(fileUrl: string, expiresIn?: number): Promise<string>;
    static validateFileType(mimeType: string): {
        isValid: boolean;
        isImage: boolean;
        isFile: boolean;
    };
    static getFileInfo(fileUrl: string): {
        key: string;
        fileName: string;
        folder: string;
    };
    static healthCheck(): Promise<boolean>;
}
export declare const uploadHelpers: {
    getFileExtension: (fileName: string) => string;
    isImageFile: (fileName: string) => boolean;
    formatFileSize: (bytes: number) => string;
    validateFileSize: (sizeInBytes: number) => boolean;
};
export default UploadService;
//# sourceMappingURL=uploadService.d.ts.map