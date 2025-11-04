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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
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
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Quote,
  Code,
  ChevronDown,
  Settings2,
  FileText,
  User
} from 'lucide-react';

const postSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  content: z.string().min(1, 'Content is required'),
  author: z.string().min(1, 'Author is required'),
  featuredImage: z.string().url().optional().or(z.literal('')),
  categoryId: z.string().optional(),
  tags: z.string().optional(),
  downloadLink: z.string().url().optional().or(z.literal('')),
  status: z.enum(['draft', 'published']),
  
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
    queryKey: ['/api/categories']
  });

  // Save post mutation
  const saveMutation = useMutation({
    mutationFn: async (data: PostFormData) => {
      const url = isEditMode ? `/api/admin/blogs/${id}` : '/api/admin/blogs';
      const method = isEditMode ? 'PUT' : 'POST';
      
      return await apiRequest(url, {
        method,
        body: JSON.stringify(data)
      });
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
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    form.setValue('seoSlug', slug);
  };

  const onSubmit = async (data: PostFormData, status: 'draft' | 'published') => {
    await saveMutation.mutateAsync({ ...data, status });
  };

  // Apply formatting to content
  const applyFormatting = (format: string) => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);

    let formattedText = selectedText;
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `<u>${selectedText}</u>`;
        break;
      case 'list':
        formattedText = selectedText.split('\n').map(line => `- ${line}`).join('\n');
        break;
      case 'ordered':
        formattedText = selectedText.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n');
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        break;
      case 'quote':
        formattedText = `> ${selectedText}`;
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        break;
    }

    const newContent = beforeText + formattedText + afterText;
    form.setValue('content', newContent);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.selectionStart = start;
      textarea.selectionEnd = start + formattedText.length;
      textarea.focus();
    }, 0);
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
                              if (!form.getValues('seoSlug')) {
                                generateSlug(e.target.value);
                              }
                              if (!form.getValues('seoTitle')) {
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

                  {/* Formatting Toolbar */}
                  <div className="border rounded-md p-2 bg-muted/30">
                    <div className="flex flex-wrap gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applyFormatting('bold')}
                        data-testid="button-bold"
                      >
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applyFormatting('italic')}
                        data-testid="button-italic"
                      >
                        <Italic className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applyFormatting('underline')}
                        data-testid="button-underline"
                      >
                        <Underline className="h-4 w-4" />
                      </Button>
                      <Separator orientation="vertical" className="h-6" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applyFormatting('list')}
                        data-testid="button-list"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applyFormatting('ordered')}
                        data-testid="button-ordered-list"
                      >
                        <ListOrdered className="h-4 w-4" />
                      </Button>
                      <Separator orientation="vertical" className="h-6" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applyFormatting('link')}
                        data-testid="button-link"
                      >
                        <Link className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applyFormatting('quote')}
                        data-testid="button-quote"
                      >
                        <Quote className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applyFormatting('code')}
                        data-testid="button-code"
                      >
                        <Code className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Content Editor */}
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            id="content-editor"
                            placeholder="Write your post content here. You can use Markdown for formatting..."
                            rows={20}
                            className="font-mono text-sm"
                            data-testid="input-content"
                          />
                        </FormControl>
                        <FormDescription>Supports Markdown formatting</FormDescription>
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
                            <Button type="button" variant="outline" size="sm" className="w-full">
                              <Image className="mr-2 h-4 w-4" />
                              Upload Image
                            </Button>
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