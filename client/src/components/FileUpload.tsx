import { useState, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  X, 
  FileCode, 
  Image as ImageIcon,
  File,
  Check,
  AlertCircle,
  Loader2,
  Download,
  Eye
} from 'lucide-react';
import { formatFileSize } from '@/lib/utils';

interface FileUploadProps {
  type: 'ea' | 'image' | 'media';
  accept?: string;
  maxSize?: number;
  value?: string;
  onChange: (fileUrl: string, fileInfo?: any) => void;
  onDelete?: () => void;
  disabled?: boolean;
  className?: string;
}

interface UploadedFile {
  filename: string;
  originalName: string;
  size: string;
  sizeBytes: number;
  path: string;
  uploadedAt: Date;
  mimeType: string;
  extension: string;
}

export default function FileUpload({
  type,
  accept,
  maxSize,
  value,
  onChange,
  onDelete,
  disabled = false,
  className = ''
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine accepted file types based on type prop
  const getAcceptedTypes = () => {
    switch (type) {
      case 'ea':
        return accept || '.ex4,.ex5,.mq4,.mq5';
      case 'image':
        return accept || 'image/jpeg,image/png,image/gif,image/webp';
      case 'media':
        return accept || 'image/*,application/pdf,.doc,.docx,.txt';
      default:
        return '*';
    }
  };

  // Determine max file size based on type prop
  const getMaxSize = () => {
    switch (type) {
      case 'ea':
        return maxSize || 50 * 1024 * 1024; // 50MB
      case 'image':
        return maxSize || 5 * 1024 * 1024; // 5MB
      case 'media':
        return maxSize || 10 * 1024 * 1024; // 10MB
      default:
        return maxSize || 10 * 1024 * 1024;
    }
  };

  // Get upload endpoint based on type
  const getUploadEndpoint = () => {
    switch (type) {
      case 'ea':
        return '/api/admin/signals/upload';
      case 'image':
        return '/api/admin/signals/upload-preview';
      case 'media':
        return '/api/admin/media/upload';
      default:
        return '/api/admin/media/upload';
    }
  };

  // Get field name for FormData
  const getFieldName = () => {
    switch (type) {
      case 'ea':
        return 'file';
      case 'image':
        return 'image';
      case 'media':
        return 'files';
      default:
        return 'file';
    }
  };

  // Handle file selection
  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setError(null);

    // Validate file size
    const maxSizeBytes = getMaxSize();
    if (file.size > maxSizeBytes) {
      setError(`File size exceeds ${formatFileSize(maxSizeBytes)} limit`);
      return;
    }

    // Upload file
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append(getFieldName(), file);

    try {
      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      });

      // Handle response
      const response = await new Promise<any>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (e) {
              reject(new Error('Invalid response format'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error || 'Upload failed'));
            } catch (e) {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error('Network error'));
        
        // Send request
        xhr.open('POST', getUploadEndpoint());
        xhr.withCredentials = true; // Include cookies for authentication
        xhr.send(formData);
      });

      if (response.success) {
        const fileInfo = response.file || response.image || (response.files && response.files[0]);
        setUploadedFile(fileInfo);
        onChange(fileInfo.path, fileInfo);
        setUploadProgress(100);
      } else {
        throw new Error(response.error || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.message || 'Failed to upload file');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  }, [onChange]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (!disabled) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [disabled, handleFileSelect]);

  // Handle file input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  }, [handleFileSelect]);

  // Handle click to select file
  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  // Handle file deletion
  const handleDelete = useCallback(() => {
    setUploadedFile(null);
    setUploadProgress(0);
    setError(null);
    if (onDelete) {
      onDelete();
    }
    onChange('', null);
  }, [onChange, onDelete]);

  // Get icon based on file type
  const getFileIcon = () => {
    switch (type) {
      case 'ea':
        return <FileCode className="h-12 w-12 text-muted-foreground" />;
      case 'image':
        return <ImageIcon className="h-12 w-12 text-muted-foreground" />;
      default:
        return <File className="h-12 w-12 text-muted-foreground" />;
    }
  };

  // Render preview for uploaded file
  const renderPreview = () => {
    if (!value && !uploadedFile) return null;

    const isImage = type === 'image' || (uploadedFile?.mimeType?.startsWith('image/'));
    const filePath = value || uploadedFile?.path;
    const fileName = uploadedFile?.originalName || filePath?.split('/').pop();

    return (
      <Card className="relative">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {isImage && filePath ? (
              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted">
                <img 
                  src={filePath} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                {getFileIcon()}
              </div>
            )}
            
            <div className="flex-1">
              <p className="font-medium text-sm truncate">{fileName}</p>
              {uploadedFile && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {uploadedFile.extension}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {uploadedFile.size}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {isImage && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => window.open(filePath, '_blank')}
                  data-testid="button-preview"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={handleDelete}
                disabled={disabled}
                data-testid="button-delete"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // If file is already uploaded or value exists, show preview
  if ((value || uploadedFile) && !isUploading) {
    return renderPreview();
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={getAcceptedTypes()}
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden"
        data-testid="input-file"
      />
      
      <Card
        className={`
          border-2 border-dashed transition-colors cursor-pointer
          ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50'}
          ${error ? 'border-destructive' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            {isUploading ? (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div className="w-full max-w-xs">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              </>
            ) : uploadProgress === 100 ? (
              <>
                <Check className="h-12 w-12 text-green-500" />
                <p className="text-sm font-medium">Upload complete!</p>
              </>
            ) : (
              <>
                {getFileIcon()}
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {isDragging ? 'Drop file here' : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {type === 'ea' && 'EA files: .ex4, .ex5, .mq4, .mq5 (max 50MB)'}
                    {type === 'image' && 'Images: JPG, PNG, GIF, WebP (max 5MB)'}
                    {type === 'media' && 'Images or documents (max 10MB)'}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

