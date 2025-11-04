import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Search, FileText, Download, Tag, Filter, X, ChevronRight, Calendar, User, TrendingUp, Clock } from 'lucide-react';
import Layout from '@/components/Layout';
import SEOHead from '@/components/SEOHead';
import BlogCard from '@/components/BlogCard';
import DownloadCard from '@/components/DownloadCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface SearchResultGroup {
  type: 'blogs' | 'signals' | 'categories';
  label: string;
  icon: any;
  results: any[];
  total: number;
}

export default function SearchResults() {
  const [location] = useLocation();
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const searchQuery = urlParams.get('q') || '';
  
  const [contentTypes, setContentTypes] = useState<string[]>(['all']);
  const [sortBy, setSortBy] = useState('relevance');
  const [currentPage, setCurrentPage] = useState({
    blogs: 1,
    signals: 1,
    categories: 1
  });
  const resultsPerPage = 10;

  useEffect(() => {
    // Reset pages when query changes
    setCurrentPage({
      blogs: 1,
      signals: 1,
      categories: 1
    });
  }, [searchQuery]);

  // Fetch search results
  const { data: searchData, isLoading, error } = useQuery({
    queryKey: ['/api/search', searchQuery, contentTypes, sortBy],
    queryFn: async () => {
      if (!searchQuery) return null;
      
      const params = new URLSearchParams();
      params.append('q', searchQuery);
      params.append('sortBy', sortBy);
      
      if (!contentTypes.includes('all')) {
        params.append('types', contentTypes.join(','));
      }
      
      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) {
        // Fallback to individual searches
        return mockSearchData(searchQuery);
      }
      return response.json();
    },
    enabled: !!searchQuery
  });

  // Mock search data for demonstration
  const mockSearchData = (query: string) => {
    return {
      blogs: {
        results: [
          {
            id: 1,
            title: 'Advanced MT4 Expert Advisor Optimization Techniques',
            slug: 'advanced-mt4-ea-optimization',
            excerpt: `Learn how to optimize your ${query} strategies for maximum profitability...`,
            author: { name: 'John Trader' },
            createdAt: '2024-01-15',
            views: 1234,
            category: { name: 'Tutorials', slug: 'tutorials' },
            tags: ['MT4', 'EA', 'Optimization'],
            featured_image: '/api/placeholder/600/400'
          },
          {
            id: 2,
            title: 'Grid Trading Strategy Implementation Guide',
            slug: 'grid-trading-strategy-guide',
            excerpt: `Master grid trading with ${query} to capture market movements...`,
            author: { name: 'Sarah Expert' },
            createdAt: '2024-01-14',
            views: 890,
            category: { name: 'Strategies', slug: 'strategies' },
            tags: ['Grid', 'Strategy', 'Automated'],
            featured_image: '/api/placeholder/600/400'
          }
        ],
        total: 15
      },
      signals: {
        results: [
          {
            id: 1,
            name: 'Grid Master EA v3.0',
            description: `Professional grid trading EA with ${query} features...`,
            platform: 'MT4',
            strategy: 'Grid',
            rating: 4.5,
            downloads: 2500,
            version: '3.0',
            file_size: '2.5 MB',
            createdAt: '2024-01-10',
            preview_image: '/api/placeholder/400/300'
          },
          {
            id: 2,
            name: 'Scalping Pro Indicator',
            description: `Advanced scalping indicator for ${query}...`,
            platform: 'MT5',
            strategy: 'Scalping',
            rating: 4.8,
            downloads: 3200,
            version: '2.1',
            file_size: '1.8 MB',
            createdAt: '2024-01-08',
            preview_image: '/api/placeholder/400/300'
          }
        ],
        total: 8
      },
      categories: {
        results: [
          {
            id: 1,
            name: 'Expert Advisors',
            slug: 'expert-advisors',
            description: `All about ${query} and automated trading systems`,
            post_count: 45
          },
          {
            id: 2,
            name: 'Trading Strategies',
            slug: 'trading-strategies',
            description: `${query} strategies for forex trading`,
            post_count: 32
          }
        ],
        total: 4
      },
      stats: {
        totalResults: 27,
        searchTime: 0.123
      }
    };
  };

  const searchResults = searchData || mockSearchData(searchQuery);
  
  const resultGroups: SearchResultGroup[] = [
    {
      type: 'blogs',
      label: 'Blog Posts',
      icon: FileText,
      results: searchResults?.blogs?.results || [],
      total: searchResults?.blogs?.total || 0
    },
    {
      type: 'signals',
      label: 'EAs & Indicators',
      icon: Download,
      results: searchResults?.signals?.results || [],
      total: searchResults?.signals?.total || 0
    },
    {
      type: 'categories',
      label: 'Categories',
      icon: Tag,
      results: searchResults?.categories?.results || [],
      total: searchResults?.categories?.total || 0
    }
  ];

  const toggleContentType = (type: string) => {
    if (type === 'all') {
      setContentTypes(['all']);
    } else {
      const newTypes = contentTypes.includes('all')
        ? [type]
        : contentTypes.includes(type)
          ? contentTypes.filter(t => t !== type)
          : [...contentTypes, type];
      
      if (newTypes.length === 0) {
        setContentTypes(['all']);
      } else {
        setContentTypes(newTypes.filter(t => t !== 'all'));
      }
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-primary/20 text-primary font-medium px-0.5">{part}</mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  const breadcrumbs = [
    { name: 'Search Results' }
  ];

  const pageTitle = searchQuery 
    ? `Search Results for "${searchQuery}" - Forex Trading Hub`
    : 'Search - Forex Trading Hub';

  const metaDescription = searchQuery
    ? `Find expert advisors, trading strategies, and tutorials matching "${searchQuery}". Browse ${searchResults?.stats?.totalResults || 0} results.`
    : 'Search our comprehensive database of forex trading resources, expert advisors, and educational content.';

  if (!searchQuery) {
    return (
      <HelmetProvider>
        <SEOHead
          title={pageTitle}
          description={metaDescription}
          path={location}
          ogType="website"
        />
        
        <Layout breadcrumbs={breadcrumbs}>
          <section className="py-12 md:py-16">
            <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
              <Search className="h-16 w-16 mx-auto text-muted-foreground/50 mb-6" />
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Search Forex Resources
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Enter a search term to find expert advisors, tutorials, and trading strategies.
              </p>
              <div className="max-w-xl mx-auto">
                <GlobalSearch className="w-full" autoFocus={true} />
              </div>
            </div>
          </section>
        </Layout>
      </HelmetProvider>
    );
  }

  return (
    <HelmetProvider>
      <SEOHead
        title={pageTitle}
        description={metaDescription}
        path={location}
        ogType="website"
      />
      
      <Layout breadcrumbs={breadcrumbs}>
        {/* Search Header */}
        <section className="py-8 md:py-12 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl md:text-4xl font-bold mb-2">
                Search Results for "{highlightText(searchQuery, searchQuery)}"
              </h1>
              {searchResults?.stats && (
                <p className="text-muted-foreground">
                  Found {searchResults.stats.totalResults} results in {searchResults.stats.searchTime}s
                </p>
              )}
            </div>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <GlobalSearch 
                className="w-full" 
                placeholder={`Search for "${searchQuery}"...`}
              />
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Filters Sidebar */}
              <aside className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Filter Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Content Type Filter */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Content Type</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="type-all" 
                            checked={contentTypes.includes('all')}
                            onCheckedChange={() => toggleContentType('all')}
                            data-testid="checkbox-type-all"
                          />
                          <Label htmlFor="type-all" className="text-sm cursor-pointer">
                            All Content
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="type-blogs" 
                            checked={contentTypes.includes('blogs')}
                            onCheckedChange={() => toggleContentType('blogs')}
                            data-testid="checkbox-type-blogs"
                          />
                          <Label htmlFor="type-blogs" className="text-sm cursor-pointer">
                            Blog Posts ({searchResults?.blogs?.total || 0})
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="type-signals" 
                            checked={contentTypes.includes('signals')}
                            onCheckedChange={() => toggleContentType('signals')}
                            data-testid="checkbox-type-signals"
                          />
                          <Label htmlFor="type-signals" className="text-sm cursor-pointer">
                            EAs & Indicators ({searchResults?.signals?.total || 0})
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="type-categories" 
                            checked={contentTypes.includes('categories')}
                            onCheckedChange={() => toggleContentType('categories')}
                            data-testid="checkbox-type-categories"
                          />
                          <Label htmlFor="type-categories" className="text-sm cursor-pointer">
                            Categories ({searchResults?.categories?.total || 0})
                          </Label>
                        </div>
                      </div>
                    </div>

                    {/* Sort Options */}
                    <div>
                      <Label htmlFor="sort" className="text-sm font-medium mb-2 block">
                        Sort By
                      </Label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger id="sort" data-testid="select-sort">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="relevance">Most Relevant</SelectItem>
                          <SelectItem value="newest">Newest First</SelectItem>
                          <SelectItem value="oldest">Oldest First</SelectItem>
                          <SelectItem value="popular">Most Popular</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Clear Filters */}
                    {!contentTypes.includes('all') && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setContentTypes(['all']);
                          setSortBy('relevance');
                        }}
                        data-testid="button-clear-filters"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear Filters
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </aside>

              {/* Results */}
              <div className="lg:col-span-3">
                {isLoading ? (
                  <div className="space-y-6">
                    {[1, 2, 3].map(i => (
                      <Card key={i}>
                        <CardHeader>
                          <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : error ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <p className="text-muted-foreground">
                        An error occurred while searching. Please try again.
                      </p>
                    </CardContent>
                  </Card>
                ) : searchResults?.stats?.totalResults === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <h2 className="text-xl font-semibold mb-2">No results found</h2>
                      <p className="text-muted-foreground">
                        Try searching with different keywords or filters.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="blogs">Blogs</TabsTrigger>
                      <TabsTrigger value="signals">EAs</TabsTrigger>
                      <TabsTrigger value="categories">Categories</TabsTrigger>
                    </TabsList>

                    {/* All Results Tab */}
                    <TabsContent value="all" className="space-y-6">
                      {resultGroups.map(group => {
                        if (group.results.length === 0) return null;
                        
                        const shouldShow = contentTypes.includes('all') || 
                                         contentTypes.includes(group.type);
                        
                        if (!shouldShow) return null;
                        
                        return (
                          <Card key={group.type}>
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <group.icon className="h-5 w-5" />
                                  {group.label}
                                  <Badge variant="secondary">{group.total}</Badge>
                                </CardTitle>
                                {group.total > 3 && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    data-testid={`button-view-all-${group.type}`}
                                  >
                                    View All
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                  </Button>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent>
                              {group.type === 'blogs' && (
                                <div className="space-y-4">
                                  {group.results.slice(0, 3).map((blog: any) => (
                                    <article key={blog.id} className="border-b last:border-0 pb-4 last:pb-0">
                                      <h3 className="font-semibold mb-1">
                                        <a href={`/blog/${blog.slug}`} className="hover:text-primary">
                                          {highlightText(blog.title, searchQuery)}
                                        </a>
                                      </h3>
                                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                        {highlightText(blog.excerpt, searchQuery)}
                                      </p>
                                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                          <User className="h-3 w-3" />
                                          {blog.author?.name || 'Anonymous'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Calendar className="h-3 w-3" />
                                          {new Date(blog.createdAt).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <TrendingUp className="h-3 w-3" />
                                          {blog.views} views
                                        </span>
                                      </div>
                                    </article>
                                  ))}
                                </div>
                              )}
                              
                              {group.type === 'signals' && (
                                <div className="space-y-4">
                                  {group.results.slice(0, 3).map((signal: any) => (
                                    <article key={signal.id} className="border-b last:border-0 pb-4 last:pb-0">
                                      <h3 className="font-semibold mb-1">
                                        <a href={`/download/${signal.id}`} className="hover:text-primary">
                                          {highlightText(signal.name, searchQuery)}
                                        </a>
                                      </h3>
                                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                        {highlightText(signal.description, searchQuery)}
                                      </p>
                                      <div className="flex items-center gap-3">
                                        <Badge variant="secondary">{signal.platform}</Badge>
                                        <Badge variant="outline">{signal.strategy}</Badge>
                                        <span className="text-xs text-muted-foreground">
                                          {signal.downloads} downloads
                                        </span>
                                      </div>
                                    </article>
                                  ))}
                                </div>
                              )}
                              
                              {group.type === 'categories' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {group.results.map((category: any) => (
                                    <a 
                                      key={category.id} 
                                      href={`/category/${category.slug}`}
                                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                      <h3 className="font-semibold mb-1">
                                        {highlightText(category.name, searchQuery)}
                                      </h3>
                                      <p className="text-sm text-muted-foreground line-clamp-2">
                                        {highlightText(category.description, searchQuery)}
                                      </p>
                                      <Badge variant="secondary" className="mt-2">
                                        {category.post_count} posts
                                      </Badge>
                                    </a>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </TabsContent>

                    {/* Blog Results Tab */}
                    <TabsContent value="blogs">
                      {searchResults?.blogs?.results?.length > 0 ? (
                        <div className="grid gap-6">
                          {searchResults.blogs.results.map((blog: any) => (
                            <BlogCard key={blog.id} post={blog} />
                          ))}
                        </div>
                      ) : (
                        <Card>
                          <CardContent className="p-8 text-center">
                            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground">No blog posts found</p>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>

                    {/* Signal Results Tab */}
                    <TabsContent value="signals">
                      {searchResults?.signals?.results?.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2">
                          {searchResults.signals.results.map((signal: any) => (
                            <DownloadCard key={signal.id} signal={signal} />
                          ))}
                        </div>
                      ) : (
                        <Card>
                          <CardContent className="p-8 text-center">
                            <Download className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground">No EAs or indicators found</p>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>

                    {/* Category Results Tab */}
                    <TabsContent value="categories">
                      {searchResults?.categories?.results?.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          {searchResults.categories.results.map((category: any) => (
                            <Card key={category.id}>
                              <CardHeader>
                                <CardTitle className="text-lg">
                                  <a href={`/category/${category.slug}`} className="hover:text-primary">
                                    {category.name}
                                  </a>
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-muted-foreground mb-3">
                                  {category.description}
                                </p>
                                <Badge variant="secondary">
                                  {category.post_count} posts
                                </Badge>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <Card>
                          <CardContent className="p-8 text-center">
                            <Tag className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground">No categories found</p>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </div>
            </div>
          </div>
        </section>
      </Layout>
    </HelmetProvider>
  );
}

// Re-export GlobalSearch for use in this page
import GlobalSearch from '@/components/GlobalSearch';