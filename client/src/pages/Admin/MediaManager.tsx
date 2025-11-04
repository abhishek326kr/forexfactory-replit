import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Upload,
  Filter,
  MoreVertical,
  Eye,
  Trash2,
  Copy,
  Download,
  Image,
  FileVideo,
  FileText,
  File,
  X,
  CheckCircle,
  CloudUpload,
  Grid,
  List
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface MediaFile {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'document' | 'other';
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  uploadedBy: string;
  uploadedAt: string;
  usedIn: string[];
}

export default function MediaManager() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteFile, setDeleteFile] = useState<MediaFile | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  // Fetch media files
  const { data: mediaData, isLoading, error } = useQuery({
    queryKey: ['/api/admin/media', { search: searchTerm, type: typeFilter }],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(typeFilter !== 'all' && { type: typeFilter })
      });
      
      // Mock data for now - replace with actual API call
      return {
        files: [
          {
            id: '1',
            name: 'forex-hero-banner.jpg',
            url: '/media/forex-hero-banner.jpg',
            type: 'image' as const,
            size: 245678,
            mimeType: 'image/jpeg',
            width: 1920,
            height: 1080,
            uploadedBy: 'admin',
            uploadedAt: '2025-01-02T10:00:00Z',
            usedIn: ['Home Page Hero']
          },
          {
            id: '2',
            name: 'grid-ea-screenshot.png',
            url: '/media/grid-ea-screenshot.png',
            type: 'image' as const,
            size: 189456,
            mimeType: 'image/png',
            width: 1280,
            height: 720,
            uploadedBy: 'admin',
            uploadedAt: '2025-01-02T11:30:00Z',
            usedIn: ['Grid Trading EA Product Page']
          },
          {
            id: '3',
            name: 'trading-tutorial.mp4',
            url: '/media/trading-tutorial.mp4',
            type: 'video' as const,
            size: 5456789,
            mimeType: 'video/mp4',
            uploadedBy: 'editor_john',
            uploadedAt: '2025-01-01T14:00:00Z',
            usedIn: ['Tutorial: Getting Started']
          },
          {
            id: '4',
            name: 'ea-documentation.pdf',
            url: '/media/ea-documentation.pdf',
            type: 'document' as const,
            size: 1234567,
            mimeType: 'application/pdf',
            uploadedBy: 'admin',
            uploadedAt: '2024-12-28T09:00:00Z',
            usedIn: ['Grid Trading EA Download']
          },
          {
            id: '5',
            name: 'market-analysis-chart.svg',
            url: '/media/market-analysis-chart.svg',
            type: 'image' as const,
            size: 45678,
            mimeType: 'image/svg+xml',
            width: 800,
            height: 600,
            uploadedBy: 'editor_john',
            uploadedAt: '2024-12-25T16:20:00Z',
            usedIn: ['Blog: Market Analysis Q1 2025']
          }
        ],
        total: 5,
        stats: {
          totalSize: 7125978,
          images: 3,
          videos: 1,
          documents: 1,
          other: 0
        }
      };
    }
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/admin/media/${id}`);
      if (!response.ok) throw new Error('Failed to delete file');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/media'] });
      toast({
        title: 'File deleted',
        description: 'The file has been successfully deleted.'
      });
      setDeleteFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await apiRequest('POST', '/api/admin/media/bulk-delete', { ids });
      if (!response.ok) throw new Error('Failed to delete files');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/media'] });
      toast({
        title: 'Files deleted',
        description: `${selectedFiles.size} files have been deleted.`
      });
      setSelectedFiles(new Set());
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Upload file mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      // Simulate upload progress
      files.forEach((file, index) => {
        const fileId = `${file.name}-${index}`;
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
        
        // Simulate progress updates
        const interval = setInterval(() => {
          setUploadProgress(prev => {
            const current = prev[fileId] || 0;
            if (current >= 100) {
              clearInterval(interval);
              return prev;
            }
            return { ...prev, [fileId]: Math.min(current + 20, 100) };
          });
        }, 200);
      });

      const response = await apiRequest('POST', '/api/admin/media/upload', formData);
      if (!response.ok) throw new Error('Failed to upload files');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/media'] });
      toast({
        title: 'Upload complete',
        description: 'Files have been successfully uploaded.'
      });
      setUploadProgress({});
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive'
      });
      setUploadProgress({});
    }
  });

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadMutation.mutate(files);
    }
  }, [uploadMutation]);

  // Handle file input change
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      uploadMutation.mutate(files);
    }
  };

  // Copy URL to clipboard
  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: 'Copied',
      description: 'URL copied to clipboard'
    });
  };

  // Toggle file selection
  const toggleFileSelection = (fileId: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }
    setSelectedFiles(newSelection);
  };

  // Get file icon
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="h-5 w-5" />;
      case 'video':
        return <FileVideo className="h-5 w-5" />;
      case 'document':
        return <FileText className="h-5 w-5" />;
      default:
        return <File className="h-5 w-5" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const files = mediaData?.files || [];
  const totalSize = mediaData?.stats?.totalSize || 0;

  return (
    <AdminLayout title="Media Manager" description="Upload and manage media files">
      {/* Header Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search-media"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-40" data-testid="select-type-filter">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              data-testid="button-view-grid"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              data-testid="button-view-list"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          {selectedFiles.size > 0 && (
            <Button
              variant="destructive"
              onClick={() => bulkDeleteMutation.mutate(Array.from(selectedFiles))}
              data-testid="button-bulk-delete"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete {selectedFiles.size} files
            </Button>
          )}
          <Button asChild data-testid="button-upload">
            <label>
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                data-testid="input-file-upload"
              />
            </label>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5 mb-6">
        <Card data-testid="stat-total-files">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mediaData?.total || 0}</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-total-size">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(totalSize)}</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-images">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mediaData?.stats?.images || 0}</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-videos">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mediaData?.stats?.videos || 0}</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-documents">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mediaData?.stats?.documents || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">Uploading Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(uploadProgress).map(([fileId, progress]) => (
              <div key={fileId} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{fileId.split('-').slice(0, -1).join('-')}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Media Files */}
      <Card>
        <CardHeader>
          <CardTitle>Media Library</CardTitle>
          <CardDescription>
            Drag and drop files to upload, or click the upload button
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "min-h-[400px] rounded-lg border-2 border-dashed transition-colors",
              isDragging ? "border-primary bg-accent/50" : "border-border",
              "relative"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-96">
                <FileText className="h-12 w-12 text-destructive mb-4" />
                <p className="text-muted-foreground">Failed to load media files</p>
              </div>
            ) : files.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96">
                <CloudUpload className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No media files yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop files here or click the upload button
                </p>
                <Button asChild data-testid="button-upload-first">
                  <label>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload your first file
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </label>
                </Button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
                {files.map((file: MediaFile) => (
                  <div
                    key={file.id}
                    className={cn(
                      "relative group rounded-lg overflow-hidden border cursor-pointer transition-all",
                      selectedFiles.has(file.id) ? "ring-2 ring-primary" : "hover:shadow-lg"
                    )}
                    onClick={() => toggleFileSelection(file.id)}
                    data-testid={`media-item-${file.id}`}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-square bg-muted flex items-center justify-center">
                      {file.type === 'image' ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          {getFileIcon(file.type)}
                          <span className="text-xs text-muted-foreground text-center px-2">
                            {file.name}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Selection indicator */}
                    {selectedFiles.has(file.id) && (
                      <div className="absolute top-2 left-2">
                        <CheckCircle className="h-5 w-5 text-primary bg-white rounded-full" />
                      </div>
                    )}
                    
                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(file.url);
                        }}
                        data-testid={`button-copy-${file.id}`}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(file.url, '_blank');
                        }}
                        data-testid={`button-view-${file.id}`}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteFile(file);
                        }}
                        data-testid={`button-delete-${file.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {/* File info */}
                    <div className="p-2 bg-background">
                      <p className="text-xs font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left pb-2">
                        <input
                          type="checkbox"
                          checked={selectedFiles.size === files.length && files.length > 0}
                          onChange={() => {
                            if (selectedFiles.size === files.length) {
                              setSelectedFiles(new Set());
                            } else {
                              setSelectedFiles(new Set(files.map(f => f.id)));
                            }
                          }}
                          className="mr-2"
                          data-testid="checkbox-select-all"
                        />
                      </th>
                      <th className="text-left pb-2">Name</th>
                      <th className="text-left pb-2">Type</th>
                      <th className="text-left pb-2">Size</th>
                      <th className="text-left pb-2">Uploaded</th>
                      <th className="text-left pb-2">Used In</th>
                      <th className="text-right pb-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((file: MediaFile) => (
                      <tr key={file.id} className="border-b hover:bg-accent/50">
                        <td className="py-2">
                          <input
                            type="checkbox"
                            checked={selectedFiles.has(file.id)}
                            onChange={() => toggleFileSelection(file.id)}
                            data-testid={`checkbox-${file.id}`}
                          />
                        </td>
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            {getFileIcon(file.type)}
                            <span className="font-medium">{file.name}</span>
                          </div>
                        </td>
                        <td className="py-2">
                          <Badge variant="outline">{file.type}</Badge>
                        </td>
                        <td className="py-2 text-sm">
                          {formatFileSize(file.size)}
                        </td>
                        <td className="py-2 text-sm">
                          {format(new Date(file.uploadedAt), 'MMM dd, yyyy')}
                        </td>
                        <td className="py-2">
                          <div className="flex flex-wrap gap-1">
                            {file.usedIn.slice(0, 2).map((usage, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {usage}
                              </Badge>
                            ))}
                            {file.usedIn.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{file.usedIn.length - 2}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-2 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                data-testid={`button-actions-${file.id}`}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => window.open(file.url, '_blank')}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => copyToClipboard(file.url)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy URL
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => setDeleteFile(file)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Drag overlay */}
            {isDragging && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <div className="text-center">
                  <CloudUpload className="h-16 w-16 text-primary mx-auto mb-4" />
                  <p className="text-lg font-medium">Drop files to upload</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteFile} onOpenChange={() => setDeleteFile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteFile?.name}".
              {deleteFile?.usedIn && deleteFile.usedIn.length > 0 && (
                <span className="block mt-2 font-semibold">
                  Warning: This file is used in {deleteFile.usedIn.length} location(s).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteFile && deleteFileMutation.mutate(deleteFile.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete File
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}