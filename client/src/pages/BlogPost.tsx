import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { useRoute, useLocation, Link } from 'wouter';
import { 
  Calendar, Clock, User, ArrowLeft, Share2, Facebook, Twitter, 
  Linkedin, BookOpen, ChevronRight, MessageCircle, ThumbsUp,
  Copy, Check
} from 'lucide-react';
import Layout from '@/components/Layout';
import SEOHead from '@/components/SEOHead';
import BlogCard from '@/components/BlogCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { generateArticleSchema } from '@/lib/seo';
import { LONG_TAIL_KEYWORDS } from '@/lib/keywords';

export default function BlogPost() {
  const [location] = useLocation();
  const [match, params] = useRoute('/blog/:slug');
  const slug = params?.slug;
  const { toast } = useToast();
  
  const [comment, setComment] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  // Fetch post data
  const { data: post, isLoading } = useQuery({
    queryKey: ['/api/posts', slug],
    enabled: !!slug,
    select: (data) => {
      // In a real app, this would fetch by slug
      // For now, we'll simulate finding a post
      const posts = (data as any)?.data || [];
      return posts.find((p: any) => p.slug === slug) || posts[0];
    }
  });

  // Fetch related posts
  const { data: relatedPosts } = useQuery({
    queryKey: ['/api/posts/related', post?.category],
    enabled: !!post,
    select: (data) => {
      const posts = (data as any)?.data || [];
      return posts.filter((p: any) => p.id !== post?.id).slice(0, 3);
    }
  });

  // Generate table of contents
  const toc = post ? [
    { id: 'introduction', title: 'Introduction' },
    { id: 'key-features', title: 'Key Features' },
    { id: 'implementation', title: 'Implementation Guide' },
    { id: 'best-practices', title: 'Best Practices' },
    { id: 'performance', title: 'Performance Analysis' },
    { id: 'conclusion', title: 'Conclusion' }
  ] : [];

  // Handle comment submission
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      toast({
        title: "Comment posted!",
        description: "Your comment has been submitted for review.",
      });
      setComment('');
    }
  };

  // Copy link to clipboard
  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Link copied!",
      description: "The article link has been copied to your clipboard.",
    });
  };

  // Social share functions
  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
  };

  const shareOnTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post?.title || '')}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank');
  };

  // Scroll spy for TOC
  useEffect(() => {
    const handleScroll = () => {
      const sections = toc.map(item => document.getElementById(item.id));
      const scrollPosition = window.scrollY + 100;
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(toc[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [toc]);

  if (isLoading) {
    return (
      <HelmetProvider>
        <Layout>
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-8" />
            <Skeleton className="h-64 w-full mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </Layout>
      </HelmetProvider>
    );
  }

  if (!post) {
    return (
      <HelmetProvider>
        <Layout>
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 text-center">
            <h1 className="text-2xl font-bold mb-4">Post not found</h1>
            <Link href="/blog">
              <Button data-testid="button-back-to-blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Button>
            </Link>
          </div>
        </Layout>
      </HelmetProvider>
    );
  }

  const articleSchema = generateArticleSchema({
    title: post.title,
    description: post.excerpt || post.content?.substring(0, 160),
    datePublished: post.createdAt || new Date().toISOString(),
    dateModified: post.updatedAt || post.createdAt || new Date().toISOString(),
    author: post.author || 'ForexFactory.cc Team',
    image: post.image,
    url: `https://forexfactory.cc/blog/${slug}`
  });

  const breadcrumbs = [
    { name: 'Blog', href: '/blog' },
    { name: post.category || 'Articles', href: `/category/${post.category?.toLowerCase()}` },
    { name: post.title }
  ];

  return (
    <HelmetProvider>
      <SEOHead
        title={post.title}
        description={post.excerpt || post.content?.substring(0, 160)}
        keywords={post.tags?.join(', ') || LONG_TAIL_KEYWORDS.slice(0, 5).join(', ')}
        path={location}
        ogType="article"
        ogImage={post.image}
        author={post.author}
        publishedTime={post.createdAt}
        modifiedTime={post.updatedAt}
        articleSchema={articleSchema}
        breadcrumbs={breadcrumbs.map((b, i) => ({
          name: b.name,
          url: `https://forexfactory.cc${b.href || location}`
        }))}
      />
      
      <Layout breadcrumbs={breadcrumbs}>
        <article className="py-12">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-3">
                <div className="max-w-3xl">
                  {/* Article Header */}
                  <header className="mb-8">
                    <Link href="/blog">
                      <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Blog
                      </Button>
                    </Link>
                    
                    <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
                      {post.title}
                    </h1>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${post.author}`} />
                          <AvatarFallback>{post.author?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{post.author || 'ForexFactory Team'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(post.createdAt || Date.now()).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{post.readTime || '5 min read'}</span>
                      </div>
                    </div>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {post.tags?.map((tag: string) => (
                        <Badge key={tag} variant="secondary" data-testid={`tag-${tag.toLowerCase()}`}>
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    {/* Share Buttons */}
                    <div className="flex items-center gap-2 mb-8">
                      <span className="text-sm text-muted-foreground">Share:</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={shareOnFacebook}
                        data-testid="button-share-facebook"
                      >
                        <Facebook className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={shareOnTwitter}
                        data-testid="button-share-twitter"
                      >
                        <Twitter className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={shareOnLinkedIn}
                        data-testid="button-share-linkedin"
                      >
                        <Linkedin className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={copyLink}
                        data-testid="button-copy-link"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </header>
                  
                  {/* Featured Image */}
                  {post.image && (
                    <div className="mb-8">
                      <img 
                        src={post.image} 
                        alt={post.title}
                        className="w-full rounded-lg aspect-video object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Article Content */}
                  <div className="prose prose-lg max-w-none">
                    <section id="introduction">
                      <h2>Introduction</h2>
                      <p>{post.content || post.excerpt || 'Content coming soon...'}</p>
                    </section>
                    
                    <section id="key-features">
                      <h2>Key Features</h2>
                      <p>This Expert Advisor offers several powerful features for automated trading:</p>
                      <ul>
                        <li>Advanced trend detection algorithm</li>
                        <li>Risk management with customizable stop loss and take profit</li>
                        <li>Multi-timeframe analysis</li>
                        <li>News filter to avoid high volatility periods</li>
                        <li>Automatic lot size calculation based on account balance</li>
                      </ul>
                    </section>
                    
                    <section id="implementation">
                      <h2>Implementation Guide</h2>
                      <p>Follow these steps to implement this strategy in your trading:</p>
                      <ol>
                        <li>Download the EA from our downloads section</li>
                        <li>Install it in your MT4/MT5 platform</li>
                        <li>Configure the settings according to your risk tolerance</li>
                        <li>Run backtests to verify performance</li>
                        <li>Start with a demo account before going live</li>
                      </ol>
                    </section>
                    
                    <section id="best-practices">
                      <h2>Best Practices</h2>
                      <p>To maximize the effectiveness of this trading strategy:</p>
                      <ul>
                        <li>Always use proper risk management (risk only 1-2% per trade)</li>
                        <li>Monitor performance regularly and adjust settings as needed</li>
                        <li>Keep your EA updated with the latest version</li>
                        <li>Diversify across multiple currency pairs</li>
                        <li>Stay informed about market conditions and major news events</li>
                      </ul>
                    </section>
                    
                    <section id="performance">
                      <h2>Performance Analysis</h2>
                      <p>Our extensive backtesting shows promising results:</p>
                      <ul>
                        <li>Average monthly return: 8-12%</li>
                        <li>Maximum drawdown: 15%</li>
                        <li>Win rate: 65%</li>
                        <li>Risk-reward ratio: 1:2</li>
                      </ul>
                      <p>Remember that past performance does not guarantee future results. Always trade responsibly.</p>
                    </section>
                    
                    <section id="conclusion">
                      <h2>Conclusion</h2>
                      <p>This Expert Advisor provides a solid foundation for automated Forex trading. With proper configuration and risk management, it can be a valuable tool in your trading arsenal.</p>
                    </section>
                  </div>
                  
                  <Separator className="my-12" />
                  
                  {/* Comments Section */}
                  <section className="mt-12">
                    <h3 className="text-2xl font-bold mb-6">Comments</h3>
                    
                    {/* Comment Form */}
                    <Card className="mb-6">
                      <CardContent className="pt-6">
                        <form onSubmit={handleCommentSubmit}>
                          <Textarea
                            placeholder="Share your thoughts..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="mb-4"
                            rows={4}
                            data-testid="textarea-comment"
                          />
                          <Button type="submit" data-testid="button-post-comment">
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Post Comment
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                    
                    {/* Sample Comments */}
                    <div className="space-y-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3">
                            <Avatar>
                              <AvatarImage src="https://api.dicebear.com/7.x/initials/svg?seed=JD" />
                              <AvatarFallback>JD</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium">John Doe</span>
                                <span className="text-sm text-muted-foreground">2 days ago</span>
                              </div>
                              <p className="text-muted-foreground">
                                Great article! The implementation guide was very helpful. I've been using this EA for a month now with good results.
                              </p>
                              <Button variant="ghost" size="sm" className="mt-2" data-testid="button-like-comment">
                                <ThumbsUp className="mr-1 h-3 w-3" />
                                12
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </section>
                </div>
              </div>
              
              {/* Sidebar - Table of Contents */}
              <aside className="lg:col-span-1">
                <div className="sticky top-24 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Table of Contents
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <nav className="space-y-2">
                        {toc.map((item) => (
                          <a
                            key={item.id}
                            href={`#${item.id}`}
                            className={`block py-1 px-3 rounded-md text-sm transition-colors ${
                              activeSection === item.id
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                            data-testid={`toc-${item.id}`}
                          >
                            {item.title}
                          </a>
                        ))}
                      </nav>
                    </CardContent>
                  </Card>
                  
                  {/* Download CTA */}
                  <Card className="bg-primary text-primary-foreground">
                    <CardContent className="pt-6">
                      <h4 className="font-bold mb-2">Get the EA</h4>
                      <p className="text-sm mb-4 opacity-90">
                        Download the Expert Advisor mentioned in this article
                      </p>
                      <Link href="/downloads">
                        <Button variant="secondary" className="w-full" data-testid="button-download-ea">
                          Browse Downloads
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              </aside>
            </div>
            
            {/* Related Posts */}
            {relatedPosts && relatedPosts.length > 0 && (
              <section className="mt-16">
                <h3 className="text-2xl font-bold mb-8">Related Articles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {relatedPosts.map((relatedPost: any) => (
                    <BlogCard key={relatedPost.id} {...relatedPost} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </article>
      </Layout>
    </HelmetProvider>
  );
}