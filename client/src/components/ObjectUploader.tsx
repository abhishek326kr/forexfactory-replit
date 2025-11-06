import { useState } from "react";
import type { ReactNode, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Upload, X, CheckCircle2, AlertCircle } from "lucide-react";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (result: { 
    successful: Array<{ 
      uploadURL: string; 
      response?: { body: { url: string } } 
    }> 
  }) => void;
  buttonClassName?: string;
  children: ReactNode;
  disabled?: boolean;
  completeEndpoint?: string;  // Allow customizing the completion endpoint
  handleCompletionExternally?: boolean; // When true, skip internal completion call
}

/**
 * A simple file upload component that provides a clean interface for image uploads
 * without external dependencies that cause issues.
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
  disabled = false,
  completeEndpoint = '/api/upload/complete', // Default to non-admin endpoint
  handleCompletionExternally = false, // Default to handling completion internally
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string>("");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxFileSize) {
      setError(`File size must be less than ${(maxFileSize / 1048576).toFixed(1)}MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setError("");
    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    setError("");

    try {
      // Step 1: Get upload parameters from the server
      const params = await onGetUploadParameters();
      
      // Step 2: Upload file directly to object storage using presigned URL
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgress(Math.round(percentComplete));
        }
      });

      // Handle completion
      xhr.onload = async function() {
        if (xhr.status === 200 || xhr.status === 204) {
          try {
            if (handleCompletionExternally) {
              // Parent component handles completion - just pass the upload URL
              setUploadSuccess(true);
              
              const result = {
                successful: [{
                  uploadURL: params.url,
                  response: { body: { url: params.url } }
                }]
              };
              onComplete?.(result);
              
              // Close modal after short delay
              setTimeout(() => {
                setShowModal(false);
                resetState();
              }, 1000);
            } else {
              // Step 3: Notify server that upload is complete and get public URL
              const response = await fetch(completeEndpoint, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include', // Include credentials for admin endpoints
                body: JSON.stringify({
                  uploadURL: params.url
                })
              });

              if (response.ok) {
                const data = await response.json();
                setUploadSuccess(true);
                
                // Return the result in the expected format
                const result = {
                  successful: [{
                    uploadURL: params.url,
                    response: { body: { url: data.publicUrl || data.objectPath } }
                  }]
                };
                onComplete?.(result);
                
                // Close modal after short delay
                setTimeout(() => {
                  setShowModal(false);
                  resetState();
                }, 1000);
              } else {
                setError('Failed to finalize upload. Please try again.');
              }
            }
          } catch (err) {
            setError('Failed to complete upload process.');
          }
        } else {
          setError('Upload failed. Please try again.');
        }
        setUploading(false);
      };

      xhr.onerror = function() {
        setError('Upload failed. Please check your connection and try again.');
        setUploading(false);
      };

      // Send the file to object storage
      xhr.open(params.method, params.url);
      xhr.setRequestHeader('Content-Type', selectedFile.type);
      xhr.send(selectedFile);
      
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload file. Please try again.');
      setUploading(false);
    }
  };

  const resetState = () => {
    setSelectedFile(null);
    setPreview("");
    setUploadProgress(0);
    setError("");
    setUploadSuccess(false);
  };

  const handleClose = () => {
    setShowModal(false);
    resetState();
  };

  return (
    <div>
      <Button 
        type="button"
        variant="outline"
        onClick={() => setShowModal(true)} 
        className={buttonClassName}
        disabled={disabled}
        data-testid="button-upload-image"
      >
        {children}
      </Button>

      <Dialog open={showModal} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Image</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* File Input */}
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              {!selectedFile ? (
                <div>
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-primary hover:underline">Choose an image</span>
                    <span className="text-muted-foreground"> or drag and drop</span>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    data-testid="input-file-upload"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    PNG, JPG, GIF up to {(maxFileSize / 1048576).toFixed(0)}MB
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Preview */}
                  {preview && (
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="mx-auto max-h-64 rounded"
                    />
                  )}
                  
                  {/* File info */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm truncate flex-1">
                      {selectedFile.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetState}
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Upload progress */}
                  {uploading && (
                    <div className="space-y-2">
                      <Progress value={uploadProgress} />
                      <p className="text-xs text-center text-muted-foreground">
                        Uploading... {uploadProgress}%
                      </p>
                    </div>
                  )}

                  {/* Success message */}
                  {uploadSuccess && (
                    <div className="flex items-center justify-center text-green-600">
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      <span>Upload successful!</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span>{error}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || uploading || uploadSuccess}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}