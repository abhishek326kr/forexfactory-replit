import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { useRoute, useLocation, Link } from 'wouter';
import { Grid, List, Filter, TrendingUp, Star } from 'lucide-react';
import Layout from '@/components/Layout';
import SEOHead from '@/components/SEOHead';
import BlogCard from '@/components/BlogCard';
import DownloadCard from '@/components/DownloadCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { generateOptimizedTitle, generateOptimizedMetaDescription, KEYWORD_CATEGORIES } from '@/lib/keywords';

export default function Category() {
  const [location] = useLocation();
  const [match, params] = useRoute('/category/:category');
  const categorySlug = params?.category;
  
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [contentType, setContentType] = useState<'all' | 'posts' | 'downloads'>('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  // Fetch category info
  const { data: category } = useQuery({
    queryKey: ['/api/categories', categorySlug],
    enabled: !!categorySlug,
    select: (data: any) => {
      const categories = data?.data || [];
      return categories.find((c: any) => c.slug === categorySlug) || {
        id: categorySlug,
        name: categorySlug?.charAt(0).toUpperCase() + categorySlug?.slice(1),
        slug: categorySlug,
        description: `Explore our collection of ${categorySlug} content, including expert articles, tutorials, and downloads.`
      };
    }
  });

  // Fetch posts in category
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['/api/posts', categorySlug],
    enabled: !!categorySlug && contentType !== 'downloads',
    select: (data: any) => {
      const posts = data?.data || [];
      return posts.filter((p: any) => p.category?.toLowerCase() === categorySlug?.toLowerCase());
    }
  });

  // Fetch downloads in category
  const { data: downloadsData, isLoading: downloadsLoading } = useQuery({
    queryKey: ['/api/downloads', categorySlug],
    enabled: !!categorySlug && contentType !== 'posts',
    select: (data: any) => {
      const downloads = data?.data || [];
      return downloads.filter((d: any) => d.category?.toLowerCase() === categorySlug?.toLowerCase());
    }
  });

  // Combine and sort content
  const getCombinedContent = () => {
    let items: any[] = [];
    
    if (contentType === 'posts' || contentType === 'all') {
      items = [...(postsData || [])].map(p => ({ ...p, type: 'post' }));
    }
    
    if (contentType === 'downloads' || contentType === 'all') {
      items = [...items, ...(downloadsData || []).map(d => ({ ...d, type: 'download' }))];
    }
    
    // Sort items
    switch (sortBy) {
      case 'oldest':
        items.sort((a, b) => 
          new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        );
        break;
      case 'popular':
        items.sort((a, b) => {
          const aScore = (a.views || 0) + (a.downloads || 0) + (a.rating || 0) * 100;
          const bScore = (b.views || 0) + (b.downloads || 0) + (b.rating || 0) * 100;
          return bScore - aScore;
        });
        break;
      default: // newest
        items.sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
    }
    
    // Pagination
    const startIndex = (page - 1) * itemsPerPage;
    const paginatedItems = items.slice(startIndex, startIndex + itemsPerPage);
    
    return {
      items: paginatedItems,
      total: items.length,
      totalPages: Math.ceil(items.length / itemsPerPage)
    };
  };

  const content = getCombinedContent();
  const isLoading = postsLoading || downloadsLoading;

  if (!categorySlug) {
    return (
      <HelmetProvider>
        <Layout>
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 text-center">
            <h1 className="text-2xl font-bold mb-4">Category not found</h1>
            <Link href="/blog">
              <Button data-testid="button-back-to-blog">
                Back to Blog
              </Button>
            </Link>
          </div>
        </Layout>
      </HelmetProvider>
    );
  }

  const pageTitle = generateOptimizedTitle('CATEGORY', {
    name: category?.name || categorySlug || '',
    count: content.total || '50'
  });

  const metaDescription = generateOptimizedMetaDescription('CATEGORY', {
    count: content.total || '50',
    category: category?.name || categorySlug,
    platforms: 'MT4/MT5',
    date: 'daily'
  });

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Categories', href: '/blog' },
    { name: category?.name || categorySlug }
  ];

  // Category-specific stats
  const stats = {
    posts: postsData?.length || 0,
    downloads: downloadsData?.length || 0,
    total: (postsData?.length || 0) + (downloadsData?.length || 0)
  };

  return (
    <HelmetProvider>
      <SEOHead
        title={pageTitle}
        description={metaDescription}
        keywords={`${categorySlug}, Forex ${categorySlug}, ${categorySlug} EA, ${categorySlug} trading, MT4 ${categorySlug}`}
        path={location}
        ogType="website"
        breadcrumbs={breadcrumbs.map((b, i) => ({
          name: b.name,
          url: `https://forexfactory.cc${b.href || location}`
        }))}
      />
      
      <Layout breadcrumbs={breadcrumbs}>
        {/* Category Header */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="max-w-3xl">
              <Badge className="mb-4" variant="outline">
                Category
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold mb-4">
                {category?.name || categorySlug}
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                {category?.description}
              </p>
              
              {/* Category Stats */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full" />
                  <span className="text-sm font-medium">{stats.posts} Articles</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-600 rounded-full" />
                  <span className="text-sm font-medium">{stats.downloads} Downloads</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-blue-600 rounded-full" />
                  <span className="text-sm font-medium">{stats.total} Total Items</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Content Section */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              {/* Content Type Tabs */}
              <Tabs value={contentType} onValueChange={(v) => setContentType(v as any)}>
                <TabsList>
                  <TabsTrigger value="all" data-testid="tab-all">
                    All Content ({stats.total})
                  </TabsTrigger>
                  <TabsTrigger value="posts" data-testid="tab-posts">
                    Articles ({stats.posts})
                  </TabsTrigger>
                  <TabsTrigger value="downloads" data-testid="tab-downloads">
                    Downloads ({stats.downloads})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              {/* View and Sort Controls */}
              <div className="flex items-center gap-3">
                {/* View Type Toggle */}
                <div className="flex items-center gap-1 border rounded-md">
                  <Button
                    variant={viewType === 'grid' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => setViewType('grid')}
                    data-testid="button-grid-view"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewType === 'list' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => setViewType('list')}
                    data-testid="button-list-view"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Sort Dropdown */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[150px]" data-testid="select-sort">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Content Display */}
            {isLoading ? (
              <div className={viewType === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                : "space-y-4"
              }>
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-5/6" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : content.items.length === 0 ? (
              <Card className="py-12">
                <CardContent className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    No content found in this category yet.
                  </p>
                  <div className="flex justify-center gap-3">
                    <Link href="/blog">
                      <Button variant="outline" data-testid="button-browse-articles">
                        Browse Articles
                      </Button>
                    </Link>
                    <Link href="/downloads">
                      <Button variant="outline" data-testid="button-browse-downloads">
                        Browse Downloads
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : viewType === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {content.items.map((item: any) => 
                  item.type === 'post' ? (
                    <BlogCard key={`post-${item.id}`} {...item} />
                  ) : (
                    <DownloadCard key={`download-${item.id}`} {...item} />
                  )
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {content.items.map((item: any) => (
                  <Card key={`${item.type}-${item.id}`} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Badge variant="outline" className="mb-2">
                            {item.type === 'post' ? 'Article' : 'Download'}
                          </Badge>
                          <h3 className="text-xl font-semibold mb-2">
                            <Link href={item.type === 'post' ? `/blog/${item.slug}` : `/download/${item.id}`}>
                              <a className="hover:underline" data-testid={`link-${item.type}-${item.id}`}>
                                {item.title || item.name}
                              </a>
                            </Link>
                          </h3>
                          <p className="text-muted-foreground mb-4 line-clamp-2">
                            {item.excerpt || item.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {item.type === 'post' ? (
                              <>
                                <span>{item.readTime || '5 min read'}</span>
                                <span>{new Date(item.createdAt || Date.now()).toLocaleDateString()}</span>
                              </>
                            ) : (
                              <>
                                <span>{item.platform || 'MT4'}</span>
                                <span>{item.downloads || 0} downloads</span>
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                  <span>{item.rating || 4.5}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        {item.image && (
                          <img 
                            src={item.image} 
                            alt={item.title || item.name}
                            className="w-24 h-24 rounded-md object-cover ml-4"
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {content.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  data-testid="button-prev"
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, content.totalPages))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className="w-9"
                        data-testid={`button-page-${pageNum}`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(content.totalPages, p + 1))}
                  disabled={page === content.totalPages}
                  data-testid="button-next"
                >
                  Next
                </Button>
              </div>
            )}
            
            {/* Related Categories */}
            <div className="mt-16">
              <h3 className="text-2xl font-bold mb-6">Browse Other Categories</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Trading', 'Scalping', 'Grid', 'News', 'Technical', 'Fundamental', 'Risk', 'Psychology']
                  .filter(c => c.toLowerCase() !== categorySlug?.toLowerCase())
                  .slice(0, 4)
                  .map(cat => (
                    <Link key={cat} href={`/category/${cat.toLowerCase()}`}>
                      <Card className="hover-elevate cursor-pointer">
                        <CardContent className="p-4 text-center">
                          <h4 className="font-medium">{cat}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {Math.floor(Math.random() * 50) + 10} items
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        </section>
      </Layout>
    </HelmetProvider>
  );
}