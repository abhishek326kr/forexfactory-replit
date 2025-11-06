import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Editor } from '@/components/Editor';
import { Checkbox } from '@/components/ui/checkbox';
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
  Save,
  Send,
  X,
  Plus,
  Image,
  Loader2,
  ChevronDown,
  Settings2,
  FileText,
  User,
  Upload,
  Download,
  FileDown
} from 'lucide-react';
import { ObjectUploader } from '@/components/ObjectUploader';
import type { UploadResult } from '@uppy/core';

const postSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  content: z.string().min(1, 'Content is required'),
  author: z.string().min(1, 'Author is required'),
  featuredImage: z.string().optional(),
  categoryId: z.string().optional(),
  tags: z.string().optional(),
  downloadLink: z.string().url().optional().or(z.literal('')),
  status: z.enum(['draft', 'published']),
  
  // Download Configuration Fields
  hasDownload: z.boolean().optional(),
  downloadTitle: z.string().optional(),
  downloadDescription: z.string().optional(),
  downloadType: z.enum(['EA', 'Indicator', 'Template', 'Tool', 'Other']).optional(),
  downloadVersion: z.string().optional(),
  downloadFileUrl: z.string().optional(),
  downloadFileName: z.string().optional(),
  downloadFileSize: z.string().optional(),
  requiresLogin: z.boolean().optional(),
  
  // SEO Fields
  seoSlug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  seoTitle: z.string().max(60, 'SEO title should be under 60 characters').optional(),
  seoDescription: z.string().max(160, 'SEO description should be under 160 characters').optional(),
  seoKeywords: z.string().optional(),
  canonicalUrl: z.string().url().optional().or(z.literal('')),
  metaRobots: z.enum(['index_follow', 'noindex_follow', 'index_nofollow', 'noindex_nofollow']).optional(),
  ogTitle: z.string().max(60, 'OG title should be under 60 characters').optional(),
  ogDescription: z.string().max(160, 'OG description should be under 160 characters').optional()
});

type PostFormData = z.infer<typeof postSchema>;

export default function PostEditor() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const isEditMode = !!id;
  const [seoExpanded, setSeoExpanded] = useState(false);
  const [downloadExpanded, setDownloadExpanded] = useState(false);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);

  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      content: '',
      author: 'Admin', // Default author, should be from session
      featuredImage: '',
      categoryId: '',
      tags: '',
      downloadLink: '',
      status: 'draft',
      // Download fields
      hasDownload: false,
      downloadTitle: '',
      downloadDescription: '',
      downloadType: 'EA',
      downloadVersion: '',
      downloadFileUrl: '',
      downloadFileName: '',
      downloadFileSize: '',
      requiresLogin: true,
      // SEO fields
      seoSlug: '',
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
      canonicalUrl: '',
      metaRobots: 'index_follow',
      ogTitle: '',
      ogDescription: ''
    }
  });

  // Fetch post data if editing
  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: [`/api/admin/blogs/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/admin/blogs/${id}`);
      if (!response.ok) throw new Error('Failed to fetch post');
      return response.json();
    },
    enabled: isEditMode
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['/api/admin/categories'],
    queryFn: async () => {
      const response = await fetch('/api/admin/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      return data.categories || data.data || data;
    }
  });

  // Save post mutation
  const saveMutation = useMutation({
    mutationFn: async (data: PostFormData) => {
      const url = isEditMode ? `/api/admin/blogs/${id}` : '/api/admin/blogs';
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await apiRequest(method, url, data);
      return await response.json();
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blogs'] });
      toast({
        title: isEditMode ? 'Post updated' : 'Post created',
        description: 'Your post has been saved successfully'
      });
      
      if (!isEditMode && response.id) {
        setLocation(`/admin/editor/${response.id}`);
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error saving post',
        description: error.message || 'Failed to save post',
        variant: 'destructive'
      });
    }
  });

  // Load post data when editing
  useEffect(() => {
    if (post && isEditMode) {
      const seoMeta = post.seoMeta || {};
      form.reset({
        title: post.title,
        content: post.content,
        author: post.author,
        featuredImage: post.featuredImage || '',
        categoryId: post.categoryId?.toString() || '',
        tags: post.tags || '',
        downloadLink: post.downloadLink || '',
        status: post.status,
        // Download fields
        hasDownload: post.hasDownload || false,
        downloadTitle: post.downloadTitle || '',
        downloadDescription: post.downloadDescription || '',
        downloadType: post.downloadType || 'EA',
        downloadVersion: post.downloadVersion || '',
        downloadFileUrl: post.downloadFileUrl || '',
        downloadFileName: post.downloadFileName || '',
        downloadFileSize: post.downloadFileSize || '',
        requiresLogin: post.requiresLogin !== false, // Default to true
        // SEO fields
        seoSlug: post.slug || post.seoSlug || '',
        seoTitle: seoMeta.seoTitle || '',
        seoDescription: seoMeta.seoDescription || '',
        seoKeywords: seoMeta.seoKeywords || '',
        canonicalUrl: seoMeta.canonicalUrl || '',
        metaRobots: seoMeta.metaRobots || 'index_follow',
        ogTitle: seoMeta.ogTitle || '',
        ogDescription: seoMeta.ogDescription || ''
      });
    }
  }, [post, isEditMode, form]);

  // Generate slug from title
  const generateSlug = (title: string) => {
    if (!title) return '';
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return slug;
  };

  const onSubmit = async (data: PostFormData, status: 'draft' | 'published') => {
    // Ensure slug is set
    let submitData = { ...data, status };
    if (!submitData.seoSlug && submitData.title) {
      submitData.seoSlug = generateSlug(submitData.title);
    }
    
    // Ensure metaRobots has a default value
    if (!submitData.metaRobots) {
      submitData.metaRobots = 'index_follow';
    }
    
    // Ensure featuredImage is a string, not an array
    if (Array.isArray(submitData.featuredImage)) {
      submitData.featuredImage = submitData.featuredImage[0] || '';
    }
    
    await saveMutation.mutateAsync(submitData);
  };

  if (postLoading) {
    return (
      <AdminLayout title="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title={isEditMode ? 'Edit Post' : 'Create New Post'}
      description={isEditMode ? 'Edit your blog post' : 'Create a new blog post'}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => onSubmit(data, 'published'))} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Post Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Title Field */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter post title"
                            className="text-lg"
                            data-testid="input-title"
                            onBlur={(e) => {
                              field.onBlur();
                              if (!form.getValues('seoSlug') && e.target.value) {
                                const slug = generateSlug(e.target.value);
                                form.setValue('seoSlug', slug);
                              }
                              if (!form.getValues('seoTitle') && e.target.value) {
                                form.setValue('seoTitle', e.target.value.substring(0, 60));
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Author Field */}
                  <FormField
                    control={form.control}
                    name="author"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Author</FormLabel>
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              placeholder="Author name"
                              data-testid="input-author"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Content Editor with TipTap */}
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                          <Editor
                            content={field.value}
                            onChange={field.onChange}
                            placeholder="Write your post content here..."
                          />
                        </FormControl>
                        <FormDescription>Rich text editor with formatting options</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* SEO Settings Section (Expandable) */}
              <Collapsible open={seoExpanded} onOpenChange={setSeoExpanded}>
                <Card>
                  <CardHeader>
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-between p-0 hover:bg-transparent"
                        type="button"
                      >
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Settings2 className="h-4 w-4" />
                            SEO Settings
                          </CardTitle>
                          <CardDescription>Optimize your post for search engines</CardDescription>
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform ${seoExpanded ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      {/* SEO Title */}
                      <FormField
                        control={form.control}
                        name="seoTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SEO Title</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="SEO optimized title"
                                maxLength={60}
                                data-testid="input-seo-title"
                              />
                            </FormControl>
                            <FormDescription>
                              {field.value?.length || 0}/60 characters
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* SEO Description */}
                      <FormField
                        control={form.control}
                        name="seoDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SEO Description</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Brief description for search engines"
                                rows={3}
                                maxLength={160}
                                data-testid="input-seo-description"
                              />
                            </FormControl>
                            <FormDescription>
                              {field.value?.length || 0}/160 characters
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* SEO Keywords */}
                      <FormField
                        control={form.control}
                        name="seoKeywords"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SEO Keywords</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="keyword1, keyword2, keyword3"
                                data-testid="input-seo-keywords"
                              />
                            </FormControl>
                            <FormDescription>Comma-separated keywords</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* SEO Slug */}
                      <FormField
                        control={form.control}
                        name="seoSlug"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SEO Slug</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="post-url-slug"
                                data-testid="input-seo-slug"
                              />
                            </FormControl>
                            <FormDescription>URL-friendly version of the title</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Canonical URL */}
                      <FormField
                        control={form.control}
                        name="canonicalUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Canonical URL</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="https://example.com/original-post"
                                data-testid="input-canonical-url"
                              />
                            </FormControl>
                            <FormDescription>Optional: Original URL if republished</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Download Configuration Section (Expandable) */}
              <Collapsible open={downloadExpanded} onOpenChange={setDownloadExpanded}>
                <Card>
                  <CardHeader>
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-between p-0 hover:bg-transparent"
                        type="button"
                      >
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            📥 Download Configuration
                          </CardTitle>
                          <CardDescription>Add downloadable files to your post</CardDescription>
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform ${downloadExpanded ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      {/* Main checkbox to enable download */}
                      <FormField
                        control={form.control}
                        name="hasDownload"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-has-download"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                This post includes a downloadable file
                              </FormLabel>
                              <FormDescription>
                                Enable this to add download configuration to your post
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      {/* Show download fields only when hasDownload is checked */}
                      {form.watch('hasDownload') && (
                        <>
                          {/* Download Title */}
                          <FormField
                            control={form.control}
                            name="downloadTitle"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Download Title *</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="e.g., Advanced Scalping EA v2.0"
                                    data-testid="input-download-title"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Download Description */}
                          <FormField
                            control={form.control}
                            name="downloadDescription"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Download Description</FormLabel>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    placeholder="Brief description of the download"
                                    rows={3}
                                    data-testid="textarea-download-description"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Download Type */}
                          <FormField
                            control={form.control}
                            name="downloadType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Download Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-download-type">
                                      <SelectValue placeholder="Select download type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="EA">Expert Advisor (EA)</SelectItem>
                                    <SelectItem value="Indicator">Indicator</SelectItem>
                                    <SelectItem value="Template">Template</SelectItem>
                                    <SelectItem value="Tool">Trading Tool</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Version */}
                          <FormField
                            control={form.control}
                            name="downloadVersion"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Version</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="e.g., v2.0.1"
                                    data-testid="input-download-version"
                                  />
                                </FormControl>
                                <FormDescription>Version number of the file</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* File Upload */}
                          <div>
                            <Label>Upload File</Label>
                            <div className="mt-2 space-y-2">
                              {form.watch('downloadFileUrl') && (
                                <div className="flex items-center gap-2 p-2 bg-muted rounded">
                                  <FileDown className="h-4 w-4" />
                                  <span className="text-sm">{form.watch('downloadFileName') || 'File uploaded'}</span>
                                  {form.watch('downloadFileSize') && (
                                    <Badge variant="secondary">{form.watch('downloadFileSize')}</Badge>
                                  )}
                                </div>
                              )}
                              <ObjectUploader
                                maxFileSize={52428800} // 50MB
                                onGetUploadParameters={async () => {
                                  const response = await fetch('/api/admin/upload/presigned', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    credentials: 'include'
                                  });
                                  if (!response.ok) throw new Error('Failed to get upload URL');
                                  const data = await response.json();
                                  return {
                                    method: 'PUT' as const,
                                    url: data.uploadUrl,
                                    isLocalUpload: data.isLocalUpload
                                  };
                                }}
                                onComplete={(result) => {
                                  const file = result.successful[0];
                                  if (file) {
                                    const fileUrl = file.response?.body?.url || '';
                                    form.setValue('downloadFileUrl', fileUrl);
                                    
                                    // Extract filename from URL or use a default
                                    const urlParts = fileUrl.split('/');
                                    const fileName = urlParts[urlParts.length - 1] || 'download-file';
                                    form.setValue('downloadFileName', fileName);
                                    
                                    // For now, we'll set a placeholder file size
                                    // In production, this should come from the server
                                    form.setValue('downloadFileSize', 'Calculating...');
                                    
                                    toast({
                                      title: 'File uploaded successfully',
                                      description: `File "${fileName}" has been uploaded.`
                                    });
                                  }
                                }}
                              >
                                <Upload className="mr-2 h-4 w-4" />
                                Upload File
                              </ObjectUploader>
                              <p className="text-xs text-muted-foreground">
                                Accept: .ex4, .ex5, .mq4, .mq5, .zip, .rar, .tpl (Max: 50MB)
                              </p>
                            </div>
                          </div>

                          {/* Require Login to Download */}
                          <FormField
                            control={form.control}
                            name="requiresLogin"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid="checkbox-requires-login"
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>
                                    Require Login to Download
                                  </FormLabel>
                                  <FormDescription>
                                    Users must be logged in to download this file
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Publishing Options */}
              <Card>
                <CardHeader>
                  <CardTitle>Publishing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        form.setValue('status', 'draft');
                        form.handleSubmit((data) => onSubmit(data, 'draft'))();
                      }}
                      disabled={saveMutation.isPending}
                      data-testid="button-save-draft"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Draft
                    </Button>
                    <Button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700"
                      disabled={saveMutation.isPending}
                      data-testid="button-publish"
                    >
                      {saveMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Publish Post
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Category & Tags */}
              <Card>
                <CardHeader>
                  <CardTitle>Organization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Category Selector */}
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories?.map((category: any) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Tags Input */}
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="tag1, tag2, tag3"
                            data-testid="input-tags"
                          />
                        </FormControl>
                        <FormDescription>Comma-separated tags</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Media & Links */}
              <Card>
                <CardHeader>
                  <CardTitle>Media & Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Featured Image */}
                  <FormField
                    control={form.control}
                    name="featuredImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Featured Image</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Input
                              {...field}
                              placeholder="https://example.com/image.jpg"
                              data-testid="input-featured-image"
                            />
                            <ObjectUploader
                              maxNumberOfFiles={1}
                              maxFileSize={5242880} // 5MB
                              handleCompletionExternally={true} // Handle completion ourselves
                              onGetUploadParameters={async () => {
                                const response = await fetch('/api/admin/upload', {
                                  method: 'POST',
                                  credentials: 'include'
                                });
                                
                                if (!response.ok) {
                                  throw new Error('Failed to get upload URL');
                                }
                                
                                const { uploadURL } = await response.json();
                                return {
                                  method: 'PUT' as const,
                                  url: uploadURL
                                };
                              }}
                              onComplete={async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
                                if (result.successful && result.successful.length > 0) {
                                  const uploadedFile = result.successful[0];
                                  const uploadURL = uploadedFile.uploadURL;
                                  
                                  // Set ACL and get the normalized path
                                  const completeResponse = await fetch('/api/admin/upload/complete', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json'
                                    },
                                    credentials: 'include',
                                    body: JSON.stringify({ uploadURL })
                                  });
                                  
                                  if (!completeResponse.ok) {
                                    toast({
                                      title: 'Error',
                                      description: 'Failed to complete upload',
                                      variant: 'destructive'
                                    });
                                    return;
                                  }
                                  
                                  const { objectPath } = await completeResponse.json();
                                  
                                  // Update the form field with the uploaded image URL
                                  field.onChange(objectPath);
                                  
                                  toast({
                                    title: 'Success',
                                    description: 'Image uploaded successfully'
                                  });
                                }
                              }}
                              buttonClassName="w-full"
                            >
                              <div className="flex items-center justify-center gap-2">
                                <Upload className="h-4 w-4" />
                                <span>Upload Image</span>
                              </div>
                            </ObjectUploader>
                            
                            {/* Image Preview */}
                            {field.value && (
                              <div className="relative rounded-lg border overflow-hidden">
                                <img
                                  src={field.value}
                                  alt="Featured image preview"
                                  className="w-full h-32 object-cover"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-2 right-2"
                                  onClick={() => field.onChange('')}
                                  data-testid="button-remove-image"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Download Link */}
                  <FormField
                    control={form.control}
                    name="downloadLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Download Link</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://example.com/download.zip"
                            data-testid="input-download-link"
                          />
                        </FormControl>
                        <FormDescription>Optional download URL</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Open Graph & Meta */}
              <Card>
                <CardHeader>
                  <CardTitle>Social Media</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Meta Robots */}
                  <FormField
                    control={form.control}
                    name="metaRobots"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Robots</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-meta-robots">
                              <SelectValue placeholder="Select indexing option" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="index_follow">Index, Follow</SelectItem>
                            <SelectItem value="noindex_follow">No Index, Follow</SelectItem>
                            <SelectItem value="index_nofollow">Index, No Follow</SelectItem>
                            <SelectItem value="noindex_nofollow">No Index, No Follow</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* OG Title */}
                  <FormField
                    control={form.control}
                    name="ogTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OG Title</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Social media title"
                            maxLength={60}
                            data-testid="input-og-title"
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value?.length || 0}/60
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* OG Description */}
                  <FormField
                    control={form.control}
                    name="ogDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OG Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Social media description"
                            rows={2}
                            maxLength={160}
                            data-testid="input-og-description"
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value?.length || 0}/160
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </AdminLayout>
  );
}