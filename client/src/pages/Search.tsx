import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { useLocation } from 'wouter';
import { Search as SearchIcon, FileText, Download, Filter, X } from 'lucide-react';
import Layout from '@/components/Layout';
import SEOHead from '@/components/SEOHead';
import BlogCard from '@/components/BlogCard';
import DownloadCard from '@/components/DownloadCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Search() {
  const [location] = useLocation();
  
  // Get search query from URL params
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const initialQuery = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [searchType, setSearchType] = useState<'all' | 'posts' | 'downloads'>('all');
  const [filters, setFilters] = useState({
    categories: [] as string[],
    platforms: [] as string[],
    dateRange: 'all'
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch search results
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['/api/search', debouncedQuery, searchType, filters],
    enabled: debouncedQuery.length > 0,
    select: (data: any) => {
      const results = {
        posts: [] as any[],
        downloads: [] as any[],
        total: 0
      };

      if (data?.posts && (searchType === 'posts' || searchType === 'all')) {
        let posts = data.posts.filter((p: any) => 
          p.title?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          p.content?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          p.excerpt?.toLowerCase().includes(debouncedQuery.toLowerCase())
        );

        // Apply category filter
        if (filters.categories.length > 0) {
          posts = posts.filter((p: any) => 
            filters.categories.includes(p.category?.toLowerCase())
          );
        }

        // Apply date filter
        if (filters.dateRange !== 'all') {
          const now = new Date();
          const cutoffDate = new Date();
          
          switch (filters.dateRange) {
            case 'week':
              cutoffDate.setDate(now.getDate() - 7);
              break;
            case 'month':
              cutoffDate.setMonth(now.getMonth() - 1);
              break;
            case 'year':
              cutoffDate.setFullYear(now.getFullYear() - 1);
              break;
          }
          
          posts = posts.filter((p: any) => 
            new Date(p.createdAt || 0) >= cutoffDate
          );
        }

        results.posts = posts;
      }

      if (data?.downloads && (searchType === 'downloads' || searchType === 'all')) {
        let downloads = data.downloads.filter((d: any) => 
          d.name?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          d.description?.toLowerCase().includes(debouncedQuery.toLowerCase())
        );

        // Apply platform filter
        if (filters.platforms.length > 0) {
          downloads = downloads.filter((d: any) => 
            filters.platforms.includes(d.platform?.toLowerCase())
          );
        }

        results.downloads = downloads;
      }

      results.total = results.posts.length + results.downloads.length;
      return results;
    }
  });

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Update URL with search query
    window.history.replaceState(null, '', `/search?q=${encodeURIComponent(searchQuery)}`);
  };

  // Handle filter changes
  const handleCategoryToggle = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handlePlatformToggle = (platform: string) => {
    setFilters(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      platforms: [],
      dateRange: 'all'
    });
  };

  const hasActiveFilters = filters.categories.length > 0 || 
                          filters.platforms.length > 0 || 
                          filters.dateRange !== 'all';

  const pageTitle = searchQuery 
    ? `Search: ${searchQuery} - ForexFactory.cc`
    : 'Search Expert Advisors & Trading Articles - ForexFactory.cc';

  const metaDescription = searchQuery
    ? `Search results for "${searchQuery}". Find Expert Advisors, trading robots, and Forex articles matching your query.`
    : 'Search our comprehensive database of Expert Advisors, MT4/MT5 indicators, and Forex trading articles.';

  const breadcrumbs = searchQuery 
    ? [{ name: 'Search', href: '/search' }, { name: `"${searchQuery}"` }]
    : [{ name: 'Search' }];

  // Sample categories and platforms
  const categories = ['Trading', 'Scalping', 'Grid', 'News', 'Technical', 'Risk Management'];
  const platforms = ['MT4', 'MT5', 'Both'];

  return (
    <HelmetProvider>
      <SEOHead
        title={pageTitle}
        description={metaDescription}
        keywords="search, find EA, expert advisor search, MT4 search, MT5 search, trading articles"
        path={location}
        ogType="website"
        breadcrumbs={breadcrumbs.map((b, i) => ({
          name: b.name,
          url: `https://forexfactory.cc${b.href || location}`
        }))}
      />
      
      <Layout breadcrumbs={breadcrumbs}>
        {/* Search Header */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 md:px-6">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">
              Search ForexFactory.cc
            </h1>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative">
              <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for Expert Advisors, indicators, articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-24 h-14 text-lg"
                autoFocus
                data-testid="input-global-search"
              />
              <Button 
                type="submit" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                data-testid="button-search"
              >
                Search
              </Button>
            </form>
            
            {/* Quick Search Suggestions */}
            {!searchQuery && (
              <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-3">Popular searches:</p>
                <div className="flex flex-wrap gap-2">
                  {['Scalping EA', 'Grid Trading', 'MT5 Robot', 'News Filter', 'EURUSD Expert'].map(term => (
                    <Badge 
                      key={term} 
                      variant="secondary" 
                      className="cursor-pointer hover-elevate"
                      onClick={() => setSearchQuery(term)}
                      data-testid={`suggestion-${term.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
        
        {/* Search Results */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Filters Sidebar */}
              {searchQuery && (
                <aside className="lg:col-span-1">
                  <Card className="sticky top-6">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Filter className="h-4 w-4" />
                          Filters
                        </CardTitle>
                        {hasActiveFilters && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={clearFilters}
                            data-testid="button-clear-filters"
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-6">
                          {/* Content Type */}
                          <div>
                            <Label className="text-sm font-medium mb-3 block">Content Type</Label>
                            <Tabs value={searchType} onValueChange={(v) => setSearchType(v as any)}>
                              <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
                                <TabsTrigger value="posts" data-testid="tab-posts">Articles</TabsTrigger>
                                <TabsTrigger value="downloads" data-testid="tab-downloads">Downloads</TabsTrigger>
                              </TabsList>
                            </Tabs>
                          </div>
                          
                          {/* Categories */}
                          {(searchType === 'all' || searchType === 'posts') && (
                            <div>
                              <Label className="text-sm font-medium mb-3 block">Categories</Label>
                              <div className="space-y-2">
                                {categories.map(category => (
                                  <div key={category} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`cat-${category}`}
                                      checked={filters.categories.includes(category.toLowerCase())}
                                      onCheckedChange={() => handleCategoryToggle(category.toLowerCase())}
                                      data-testid={`checkbox-category-${category.toLowerCase()}`}
                                    />
                                    <Label 
                                      htmlFor={`cat-${category}`} 
                                      className="text-sm font-normal cursor-pointer"
                                    >
                                      {category}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Platforms */}
                          {(searchType === 'all' || searchType === 'downloads') && (
                            <div>
                              <Label className="text-sm font-medium mb-3 block">Platform</Label>
                              <div className="space-y-2">
                                {platforms.map(platform => (
                                  <div key={platform} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`plat-${platform}`}
                                      checked={filters.platforms.includes(platform.toLowerCase())}
                                      onCheckedChange={() => handlePlatformToggle(platform.toLowerCase())}
                                      data-testid={`checkbox-platform-${platform.toLowerCase()}`}
                                    />
                                    <Label 
                                      htmlFor={`plat-${platform}`} 
                                      className="text-sm font-normal cursor-pointer"
                                    >
                                      {platform}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Date Range */}
                          <div>
                            <Label className="text-sm font-medium mb-3 block">Date Range</Label>
                            <select 
                              value={filters.dateRange}
                              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                              className="w-full px-3 py-2 rounded-md border bg-background"
                              data-testid="select-date-range"
                            >
                              <option value="all">All Time</option>
                              <option value="week">Past Week</option>
                              <option value="month">Past Month</option>
                              <option value="year">Past Year</option>
                            </select>
                          </div>
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </aside>
              )}
              
              {/* Results */}
              <div className={searchQuery ? "lg:col-span-3" : "lg:col-span-4"}>
                {!searchQuery ? (
                  <Card className="py-16">
                    <CardContent className="text-center">
                      <SearchIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg text-muted-foreground mb-2">
                        Enter a search term to find Expert Advisors and articles
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Try searching for "scalping", "MT5", or "grid trading"
                      </p>
                    </CardContent>
                  </Card>
                ) : isLoading ? (
                  <div>
                    <Skeleton className="h-8 w-48 mb-6" />
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <Card key={i}>
                          <CardContent className="p-6">
                            <Skeleton className="h-6 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-2/3" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : !searchResults || searchResults.total === 0 ? (
                  <Card className="py-12">
                    <CardContent className="text-center">
                      <SearchIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2">No results found</p>
                      <p className="text-muted-foreground mb-4">
                        No Expert Advisors or articles match "{searchQuery}"
                      </p>
                      <div className="flex justify-center gap-3">
                        <Button variant="outline" onClick={() => setSearchQuery('')} data-testid="button-clear-search">
                          Clear Search
                        </Button>
                        {hasActiveFilters && (
                          <Button variant="outline" onClick={clearFilters} data-testid="button-reset-filters">
                            Reset Filters
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div>
                    {/* Results Header */}
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-medium">
                        {searchResults.total} results for "{searchQuery}"
                      </h2>
                      {hasActiveFilters && (
                        <div className="flex items-center gap-2">
                          {filters.categories.map(cat => (
                            <Badge key={cat} variant="secondary" className="gap-1">
                              {cat}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => handleCategoryToggle(cat)}
                                data-testid={`remove-category-${cat}`}
                              />
                            </Badge>
                          ))}
                          {filters.platforms.map(plat => (
                            <Badge key={plat} variant="secondary" className="gap-1">
                              {plat}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => handlePlatformToggle(plat)}
                                data-testid={`remove-platform-${plat}`}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Results Tabs */}
                    <Tabs defaultValue="all" className="w-full">
                      <TabsList className="mb-6">
                        <TabsTrigger value="all" data-testid="results-tab-all">
                          All ({searchResults.total})
                        </TabsTrigger>
                        {searchResults.posts.length > 0 && (
                          <TabsTrigger value="posts" data-testid="results-tab-posts">
                            <FileText className="mr-2 h-4 w-4" />
                            Articles ({searchResults.posts.length})
                          </TabsTrigger>
                        )}
                        {searchResults.downloads.length > 0 && (
                          <TabsTrigger value="downloads" data-testid="results-tab-downloads">
                            <Download className="mr-2 h-4 w-4" />
                            Downloads ({searchResults.downloads.length})
                          </TabsTrigger>
                        )}
                      </TabsList>
                      
                      {/* All Results */}
                      <TabsContent value="all" className="space-y-6">
                        {searchResults.posts.length > 0 && (
                          <div>
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                              <FileText className="h-5 w-5" />
                              Articles
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                              {searchResults.posts.slice(0, 3).map((post: any) => (
                                <BlogCard key={post.id} {...post} />
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {searchResults.downloads.length > 0 && (
                          <div>
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                              <Download className="h-5 w-5" />
                              Expert Advisors
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                              {searchResults.downloads.slice(0, 3).map((download: any) => (
                                <DownloadCard key={download.id} {...download} />
                              ))}
                            </div>
                          </div>
                        )}
                      </TabsContent>
                      
                      {/* Posts Tab */}
                      {searchResults.posts.length > 0 && (
                        <TabsContent value="posts">
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {searchResults.posts.map((post: any) => (
                              <BlogCard key={post.id} {...post} />
                            ))}
                          </div>
                        </TabsContent>
                      )}
                      
                      {/* Downloads Tab */}
                      {searchResults.downloads.length > 0 && (
                        <TabsContent value="downloads">
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {searchResults.downloads.map((download: any) => (
                              <DownloadCard key={download.id} {...download} />
                            ))}
                          </div>
                        </TabsContent>
                      )}
                    </Tabs>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </Layout>
    </HelmetProvider>
  );
}