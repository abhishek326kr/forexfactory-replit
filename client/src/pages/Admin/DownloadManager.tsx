import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Download,
  Plus,
  Edit,
  Trash2,
  Upload,
  FileText,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';

const downloadSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().min(1, 'Description is required'),
  version: z.string().min(1, 'Version is required'),
  platform: z.enum(['MT4', 'MT5', 'Both']),
  category: z.enum(['Expert Advisor', 'Indicator', 'Script', 'Library']),
  fileUrl: z.string().url('Must be a valid URL').min(1, 'File URL is required'),
  downloadSize: z.string().min(1, 'File size is required'),
  requirements: z.string().optional(),
  featured: z.boolean().optional(),
  price: z.number().min(0, 'Price must be positive').optional(),
  tags: z.array(z.string()).optional()
});

type DownloadFormData = z.infer<typeof downloadSchema>;

interface DownloadItem {
  id: string;
  title: string;
  description: string;
  version: string;
  platform: 'MT4' | 'MT5' | 'Both';
  category: string;
  fileUrl: string;
  downloadSize: string;
  downloadCount: number;
  featured: boolean;
  price?: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function DownloadManager() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [editingDownload, setEditingDownload] = useState<DownloadItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<DownloadFormData>({
    resolver: zodResolver(downloadSchema),
    defaultValues: {
      title: '',
      description: '',
      version: '1.0.0',
      platform: 'MT4',
      category: 'Expert Advisor',
      fileUrl: '',
      downloadSize: '',
      requirements: '',
      featured: false,
      price: 0,
      tags: []
    }
  });

  // Fetch downloads
  const { data: downloads, isLoading } = useQuery<DownloadItem[]>({
    queryKey: ['/api/downloads'],
    queryFn: async () => {
      // Mock data - replace with actual API call
      return [
        {
          id: '1',
          title: 'Grid Trading EA Pro',
          description: 'Advanced grid trading Expert Advisor with smart money management',
          version: '2.5.0',
          platform: 'MT5',
          category: 'Expert Advisor',
          fileUrl: 'https://example.com/downloads/grid-ea.ex5',
          downloadSize: '2.3 MB',
          downloadCount: 1234,
          featured: true,
          price: 99,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          title: 'Support & Resistance Indicator',
          description: 'Automatically identifies key support and resistance levels',
          version: '1.2.0',
          platform: 'Both',
          category: 'Indicator',
          fileUrl: 'https://example.com/downloads/sr-indicator.ex4',
          downloadSize: '450 KB',
          downloadCount: 567,
          featured: false,
          price: 0,
          createdAt: new Date(Date.now() - 86400000),
          updatedAt: new Date(Date.now() - 86400000)
        },
        {
          id: '3',
          title: 'Scalping Bot Ultra',
          description: 'High-frequency scalping Expert Advisor for volatile markets',
          version: '3.0.1',
          platform: 'MT4',
          category: 'Expert Advisor',
          fileUrl: 'https://example.com/downloads/scalping-bot.ex4',
          downloadSize: '1.8 MB',
          downloadCount: 890,
          featured: true,
          price: 149,
          createdAt: new Date(Date.now() - 172800000),
          updatedAt: new Date(Date.now() - 172800000)
        }
      ];
    }
  });

  // Create/Update download mutation
  const saveMutation = useMutation({
    mutationFn: async (data: DownloadFormData) => {
      const url = editingDownload 
        ? `/api/downloads/${editingDownload.id}`
        : '/api/downloads';
      const method = editingDownload ? 'PUT' : 'POST';
      
      return await apiRequest(url, {
        method,
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/downloads'] });
      toast({
        title: editingDownload ? 'Download updated' : 'Download created',
        description: 'The download has been saved successfully'
      });
      setIsDialogOpen(false);
      form.reset();
      setEditingDownload(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error saving download',
        description: error.message || 'Failed to save download',
        variant: 'destructive'
      });
    }
  });

  // Delete download mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/downloads/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/downloads'] });
      toast({
        title: 'Download deleted',
        description: 'The download has been removed successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting download',
        description: error.message || 'Failed to delete download',
        variant: 'destructive'
      });
    }
  });

  const onSubmit = async (data: DownloadFormData) => {
    await saveMutation.mutateAsync(data);
  };

  const handleEdit = (download: DownloadItem) => {
    setEditingDownload(download);
    form.reset({
      title: download.title,
      description: download.description,
      version: download.version,
      platform: download.platform,
      category: download.category as any,
      fileUrl: download.fileUrl,
      downloadSize: download.downloadSize,
      requirements: '',
      featured: download.featured,
      price: download.price || 0,
      tags: []
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this download?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleUploadFile = () => {
    // Placeholder for file upload functionality
    toast({
      title: 'File upload',
      description: 'File upload functionality would be implemented here'
    });
  };

  // Filter downloads based on search and filters
  const filteredDownloads = downloads?.filter(download => {
    const matchesSearch = download.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         download.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || download.category === filterCategory;
    const matchesPlatform = filterPlatform === 'all' || 
                           download.platform === filterPlatform || 
                           download.platform === 'Both';
    
    return matchesSearch && matchesCategory && matchesPlatform;
  });

  return (
    <AdminLayout title="Download Manager" description="Manage Expert Advisors, indicators, and other downloads">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search downloads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full sm:w-64"
              data-testid="input-search"
            />
          </div>

          {/* Category Filter */}
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-40" data-testid="select-category-filter">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Expert Advisor">Expert Advisor</SelectItem>
              <SelectItem value="Indicator">Indicator</SelectItem>
              <SelectItem value="Script">Script</SelectItem>
              <SelectItem value="Library">Library</SelectItem>
            </SelectContent>
          </Select>

          {/* Platform Filter */}
          <Select value={filterPlatform} onValueChange={setFilterPlatform}>
            <SelectTrigger className="w-full sm:w-32" data-testid="select-platform-filter">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="MT4">MT4</SelectItem>
              <SelectItem value="MT5">MT5</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Add New Download */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingDownload(null);
                form.reset();
              }}
              data-testid="button-add-download"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Download
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingDownload ? 'Edit Download' : 'Add New Download'}
              </DialogTitle>
              <DialogDescription>
                {editingDownload ? 'Update the download details' : 'Add a new Expert Advisor, indicator, or other download'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Grid Trading EA Pro"
                          data-testid="input-download-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Detailed description of the download..."
                          rows={3}
                          data-testid="input-download-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="version"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Version</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="1.0.0"
                            data-testid="input-version"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="downloadSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>File Size</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="2.3 MB"
                            data-testid="input-file-size"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="platform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-platform">
                              <SelectValue placeholder="Select platform" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="MT4">MT4</SelectItem>
                            <SelectItem value="MT5">MT5</SelectItem>
                            <SelectItem value="Both">Both</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-download-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Expert Advisor">Expert Advisor</SelectItem>
                            <SelectItem value="Indicator">Indicator</SelectItem>
                            <SelectItem value="Script">Script</SelectItem>
                            <SelectItem value="Library">Library</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="fileUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File URL</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Input
                            {...field}
                            placeholder="https://example.com/file.ex4"
                            data-testid="input-file-url"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleUploadFile}
                            data-testid="button-upload-file"
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>Direct link to the download file</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (USD)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-price"
                        />
                      </FormControl>
                      <FormDescription>Set to 0 for free downloads</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requirements (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Minimum balance, broker requirements, etc."
                          rows={2}
                          data-testid="input-requirements"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4"
                          data-testid="checkbox-featured"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Mark as featured download
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      form.reset();
                      setEditingDownload(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        {editingDownload ? 'Update' : 'Create'} Download
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Downloads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Downloads</CardTitle>
          <CardDescription>
            Manage Expert Advisors, indicators, scripts, and libraries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : filteredDownloads && filteredDownloads.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDownloads.map((download) => (
                  <TableRow key={download.id} data-testid={`download-${download.id}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{download.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {download.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{download.platform}</Badge>
                    </TableCell>
                    <TableCell>{download.category}</TableCell>
                    <TableCell>{download.version}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Download className="h-3 w-3" />
                        <span>{download.downloadCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {download.price && download.price > 0 ? (
                        <span className="font-medium">${download.price}</span>
                      ) : (
                        <Badge variant="secondary">Free</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {download.featured && (
                        <Badge className="bg-yellow-500">Featured</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(download)}
                          data-testid={`button-edit-${download.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(download.id)}
                          data-testid={`button-delete-${download.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No downloads found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}