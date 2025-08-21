import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import machineService, { MachineFile } from '../services/machineService';

interface FileUploadProps {
  machineId: string;
  onUploadSuccess?: (uploadedFiles: MachineFile[]) => void;
  onUploadError?: (error: string) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  maxFiles?: number;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  machineId,
  onUploadSuccess,
  onUploadError,
  acceptedFileTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.txt'],
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 10
}) => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    
    // Initialize uploading files state
    const initialUploadingFiles: UploadingFile[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }));
    
    setUploadingFiles(initialUploadingFiles);

    try {
      // Upload files
      const uploadedFiles = await machineService.uploadFiles(
        machineId,
        acceptedFiles,
        (progress) => {
          // Update progress for all files (simplified - in real app you'd track individual file progress)
          setUploadingFiles(prev => prev.map(item => ({
            ...item,
            progress: item.status === 'uploading' ? progress : item.progress
          })));
        }
      );

      // Mark all files as successful
      setUploadingFiles(prev => prev.map(item => ({
        ...item,
        status: 'success',
        progress: 100
      })));

      // Call success callback
      if (onUploadSuccess) {
        onUploadSuccess(uploadedFiles);
      }

      // Clear uploading files after a delay
      setTimeout(() => {
        setUploadingFiles([]);
      }, 2000);

    } catch (error: any) {
      // Mark all files as failed
      setUploadingFiles(prev => prev.map(item => ({
        ...item,
        status: 'error',
        error: error.message
      })));

      // Call error callback
      if (onUploadError) {
        onUploadError(error.message);
      }

      // Clear uploading files after a delay
      setTimeout(() => {
        setUploadingFiles([]);
      }, 3000);
    } finally {
      setIsUploading(false);
    }
  }, [machineId, onUploadSuccess, onUploadError]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    fileRejections
  } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize: maxFileSize,
    maxFiles: maxFiles,
    disabled: isUploading
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDropzoneClassName = () => {
    let className = 'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-200 ';
    
    if (isUploading) {
      className += 'border-gray-300 bg-gray-50 cursor-not-allowed ';
    } else if (isDragAccept) {
      className += 'border-green-400 bg-green-50 ';
    } else if (isDragReject) {
      className += 'border-red-400 bg-red-50 ';
    } else if (isDragActive) {
      className += 'border-indigo-400 bg-indigo-50 ';
    } else {
      className += 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 ';
    }
    
    return className;
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div {...getRootProps()} className={getDropzoneClassName()}>
        <input {...getInputProps()} />
        <div className="space-y-2">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          
          {isUploading ? (
            <p className="text-sm text-gray-500">Uploading files...</p>
          ) : isDragActive ? (
            isDragAccept ? (
              <p className="text-sm text-green-600">Drop the files here...</p>
            ) : (
              <p className="text-sm text-red-600">Some files are not supported</p>
            )
          ) : (
            <div>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-indigo-600">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                Images, PDFs, Documents up to {formatFileSize(maxFileSize)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* File Rejections */}
      {fileRejections.length > 0 && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Some files could not be uploaded:
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {fileRejections.map(({ file, errors }) => (
                    <li key={file.name}>
                      {file.name}: {errors.map(e => e.message).join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Uploading Files Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Upload Progress</h4>
          {uploadingFiles.map((uploadingFile, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {uploadingFile.file.name}
                </span>
                <span className="text-xs text-gray-500">
                  {formatFileSize(uploadingFile.file.size)}
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        uploadingFile.status === 'success'
                          ? 'bg-green-500'
                          : uploadingFile.status === 'error'
                          ? 'bg-red-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${uploadingFile.progress}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  {uploadingFile.status === 'success' && (
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  
                  {uploadingFile.status === 'error' && (
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  
                  {uploadingFile.status === 'uploading' && (
                    <svg className="animate-spin w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  
                  <span className="text-xs text-gray-500">
                    {uploadingFile.progress}%
                  </span>
                </div>
              </div>
              
              {uploadingFile.error && (
                <p className="mt-2 text-xs text-red-600">{uploadingFile.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;