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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
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
  Save,
  Send,
  Eye,
  X,
  Plus,
  Image,
  AlertCircle,
  Loader2
} from 'lucide-react';

const postSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().max(500, 'Excerpt is too long').optional(),
  categoryId: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']),
  featuredImage: z.string().url().optional().or(z.literal('')),
  metaTitle: z.string().max(60, 'Meta title should be under 60 characters').optional(),
  metaDescription: z.string().max(160, 'Meta description should be under 160 characters').optional(),
  seoKeywords: z.string().optional(),
  canonicalUrl: z.string().url().optional().or(z.literal('')),
  tags: z.array(z.string()).optional()
});

type PostFormData = z.infer<typeof postSchema>;

export default function PostEditor() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const isEditMode = !!id;
  const [previewMode, setPreviewMode] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      categoryId: '',
      status: 'draft',
      featuredImage: '',
      metaTitle: '',
      metaDescription: '',
      seoKeywords: '',
      canonicalUrl: '',
      tags: []
    }
  });

  // Fetch post data if editing
  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: [`/api/posts/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${id}`);
      if (!response.ok) throw new Error('Failed to fetch post');
      return response.json();
    },
    enabled: isEditMode
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  // Fetch tags
  const { data: availableTags } = useQuery({
    queryKey: ['/api/tags'],
    queryFn: async () => {
      const response = await fetch('/api/tags');
      if (!response.ok) throw new Error('Failed to fetch tags');
      return response.json();
    }
  });

  // Save post mutation
  const saveMutation = useMutation({
    mutationFn: async (data: PostFormData) => {
      const url = isEditMode ? `/api/posts/${id}` : '/api/posts';
      const method = isEditMode ? 'PUT' : 'POST';
      
      return await apiRequest(url, {
        method,
        body: JSON.stringify({
          ...data,
          tagIds: selectedTags,
          published: data.status === 'published',
          publishedAt: data.status === 'published' ? new Date() : undefined
        })
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
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
      form.reset({
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt || '',
        categoryId: post.categoryId || '',
        status: post.status,
        featuredImage: post.featuredImage || '',
        metaTitle: post.metaTitle || '',
        metaDescription: post.metaDescription || '',
        seoKeywords: post.seoKeywords || '',
        canonicalUrl: post.canonicalUrl || '',
        tags: post.tags?.map((t: any) => t.name) || []
      });
      setSelectedTags(post.tags?.map((t: any) => t.id) || []);
    }
  }, [post, isEditMode, form]);

  // Generate slug from title
  const generateSlug = (title: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    form.setValue('slug', slug);
  };

  const onSubmit = async (data: PostFormData) => {
    await saveMutation.mutateAsync(data);
  };

  const addTag = () => {
    if (tagInput && !selectedTags.includes(tagInput)) {
      setSelectedTags([...selectedTags, tagInput]);
      setTagInput('');
    }
  };

  const removeTag = (tagId: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tagId));
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
                data-testid="button-preview"
              >
                <Eye className="mr-2 h-4 w-4" />
                {previewMode ? 'Edit' : 'Preview'}
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                type="submit"
                variant="outline"
                onClick={() => form.setValue('status', 'draft')}
                disabled={saveMutation.isPending}
                data-testid="button-save-draft"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
              <Button
                type="submit"
                onClick={() => form.setValue('status', 'published')}
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
                    Publish
                  </>
                )}
              </Button>
            </div>
          </div>

          {previewMode ? (
            // Preview Mode
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">{form.watch('title')}</CardTitle>
                {form.watch('excerpt') && (
                  <CardDescription className="text-lg">{form.watch('excerpt')}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: form.watch('content') }} />
              </CardContent>
            </Card>
          ) : (
            // Edit Mode
            <Tabs defaultValue="content" className="space-y-4">
              <TabsList>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Post Content</CardTitle>
                    <CardDescription>Write your blog post content</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                              data-testid="input-title"
                              onBlur={(e) => {
                                field.onBlur();
                                if (!form.getValues('slug')) {
                                  generateSlug(e.target.value);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="post-url-slug"
                              data-testid="input-slug"
                            />
                          </FormControl>
                          <FormDescription>URL-friendly version of the title</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="excerpt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Excerpt</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Brief description of your post"
                              rows={3}
                              data-testid="input-excerpt"
                            />
                          </FormControl>
                          <FormDescription>A short summary of your post</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Write your post content here..."
                              rows={15}
                              className="font-mono"
                              data-testid="input-content"
                            />
                          </FormControl>
                          <FormDescription>You can use Markdown for formatting</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="featuredImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Featured Image</FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <Input
                                {...field}
                                placeholder="https://example.com/image.jpg"
                                data-testid="input-featured-image"
                              />
                              <Button type="button" variant="outline" size="icon">
                                <Image className="h-4 w-4" />
                              </Button>
                            </div>
                          </FormControl>
                          <FormDescription>URL of the featured image</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="seo" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>SEO Settings</CardTitle>
                    <CardDescription>Optimize your post for search engines</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="metaTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meta Title</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="SEO optimized title"
                              maxLength={60}
                              data-testid="input-meta-title"
                            />
                          </FormControl>
                          <FormDescription>
                            {field.value?.length || 0}/60 characters
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="metaDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meta Description</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="SEO optimized description"
                              rows={3}
                              maxLength={160}
                              data-testid="input-meta-description"
                            />
                          </FormControl>
                          <FormDescription>
                            {field.value?.length || 0}/160 characters
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="seoKeywords"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Keywords</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="forex, trading, mt4, expert advisor"
                              data-testid="input-keywords"
                            />
                          </FormControl>
                          <FormDescription>Comma-separated keywords</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                              data-testid="input-canonical"
                            />
                          </FormControl>
                          <FormDescription>Optional: Original URL if this is republished content</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Post Settings</CardTitle>
                    <CardDescription>Configure post category and tags</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-category">
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {categories?.map((category: any) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <Label>Tags</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          placeholder="Add tag"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addTag();
                            }
                          }}
                          data-testid="input-tag"
                        />
                        <Button type="button" onClick={addTag} variant="outline">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedTags.map((tagId) => {
                          const tag = availableTags?.find((t: any) => t.id === tagId);
                          return (
                            <Badge key={tagId} variant="secondary" data-testid={`tag-${tagId}`}>
                              {tag?.name || tagId}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 ml-2 p-0"
                                onClick={() => removeTag(tagId)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          );
                        })}
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-status">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="published">Published</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </form>
      </Form>
    </AdminLayout>
  );
}