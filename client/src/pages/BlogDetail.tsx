import { useQuery, useMutation } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { useParams, useLocation, Link } from 'wouter';
import { Calendar, Clock, Eye, User, Tag, ArrowLeft, Share2, Facebook, Twitter, Linkedin, Copy } from 'lucide-react';
import Layout from '@/components/Layout';
import SEOHead from '@/components/SEOHead';
import BlogCard from '@/components/BlogCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function BlogDetail() {
  const params = useParams();
  const slug = params.slug as string;
  const [location] = useLocation();
  const { toast } = useToast();

  // Fetch blog post by slug
  const { data: blog, isLoading: blogLoading, error: blogError } = useQuery({
    queryKey: ['/api/blogs/slug', slug],
    queryFn: async () => {
      const response = await fetch(`/api/blogs/slug/${slug}`);
      if (!response.ok) {
        throw new Error('Failed to fetch blog');
      }
      return response.json();
    },
    enabled: !!slug
  });

  // Track view
  const { mutate: trackView } = useMutation({
    mutationFn: async (blogId: string) => {
      return apiRequest(`/api/blogs/${blogId}/view`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      // Invalidate blog query to update view count
      queryClient.invalidateQueries({ queryKey: ['/api/blogs/slug', slug] });
    }
  });

  // Track view on mount
  useQuery({
    queryKey: ['track-view', blog?.id],
    queryFn: async () => {
      if (blog?.id) {
        trackView(blog.id);
      }
      return null;
    },
    enabled: !!blog?.id
  });

  // Copy link to clipboard
  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Link copied!',
      description: 'The blog post link has been copied to your clipboard.'
    });
  };

  // Social share
  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = blog?.title || '';
    
    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const breadcrumbs = [
    { name: 'Blog', href: '/blog' },
    { name: blog?.title || 'Loading...' }
  ];

  if (blogError) {
    return (
      <Layout breadcrumbs={breadcrumbs}>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Card className="p-12 text-center">
            <CardContent>
              <h2 className="text-2xl font-bold mb-4">Blog post not found</h2>
              <p className="text-muted-foreground mb-6">
                The blog post you're looking for doesn't exist or has been removed.
              </p>
              <Link href="/blog">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Blog
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <HelmetProvider>
      <SEOHead
        title={blog?.seoMeta?.seoTitle || blog?.title || 'Blog Post'}
        description={blog?.seoMeta?.seoDescription || blog?.excerpt || ''}
        keywords={blog?.seoMeta?.seoKeywords || ''}
        path={location}
        ogType="article"
        ogImage={blog?.featuredImage}
      />
      
      <Layout breadcrumbs={breadcrumbs}>
        <article className="py-12">
          <div className="max-w-4xl mx-auto px-4">
            {/* Back Button */}
            <Link href="/blog">
              <Button variant="ghost" className="mb-6" data-testid="button-back-to-blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Button>
            </Link>
            
            {blogLoading ? (
              <>
                {/* Loading State */}
                <Skeleton className="h-10 w-3/4 mb-4" />
                <div className="flex items-center gap-4 mb-6">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-64 w-full mb-8" />
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              </>
            ) : blog ? (
              <>
                {/* Blog Header */}
                <header className="mb-8">
                  <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="blog-title">
                    {blog.title}
                  </h1>
                  
                  {/* Meta Information */}
                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                    {blog.author && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span data-testid="blog-author">{blog.author}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span data-testid="blog-date">
                        {new Date(blog.createdAt || blog.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span data-testid="blog-read-time">
                        {Math.ceil((blog.content?.length || 0) / 1000)} min read
                      </span>
                    </div>
                    {blog.views !== undefined && (
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        <span data-testid="blog-views">{blog.views} views</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Category and Tags */}
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    {blog.category && (
                      <Link href={`/category/${blog.category.toLowerCase()}`}>
                        <Badge variant="default" className="cursor-pointer" data-testid="blog-category">
                          {blog.category}
                        </Badge>
                      </Link>
                    )}
                    {blog.tags && blog.tags.split(',').map((tag: string) => (
                      <Badge key={tag.trim()} variant="secondary" data-testid={`blog-tag-${tag.trim()}`}>
                        <Tag className="mr-1 h-3 w-3" />
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </header>
                
                {/* Featured Image */}
                {blog.featuredImage && (
                  <div className="mb-8 rounded-lg overflow-hidden">
                    <img
                      src={blog.featuredImage}
                      alt={blog.title}
                      className="w-full h-auto object-cover"
                      data-testid="blog-featured-image"
                    />
                  </div>
                )}
                
                {/* Blog Content */}
                <div 
                  className="prose prose-lg max-w-none mb-8"
                  dangerouslySetInnerHTML={{ __html: blog.content }}
                  data-testid="blog-content"
                />
                
                <Separator className="my-8" />
                
                {/* Social Share */}
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-semibold">Share this article</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare('facebook')}
                      data-testid="button-share-facebook"
                    >
                      <Facebook className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare('twitter')}
                      data-testid="button-share-twitter"
                    >
                      <Twitter className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare('linkedin')}
                      data-testid="button-share-linkedin"
                    >
                      <Linkedin className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      data-testid="button-copy-link"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Related Posts */}
                {blog.relatedPosts && blog.relatedPosts.length > 0 && (
                  <section className="mt-12">
                    <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {blog.relatedPosts.map((post: any) => (
                        <BlogCard key={post.id} {...post} />
                      ))}
                    </div>
                  </section>
                )}
              </>
            ) : null}
          </div>
        </article>
      </Layout>
    </HelmetProvider>
  );
}