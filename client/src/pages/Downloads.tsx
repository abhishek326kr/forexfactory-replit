import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { useLocation } from 'wouter';
import { Download, Filter, Search, TrendingUp, Star, Package } from 'lucide-react';
import Layout from '@/components/Layout';
import SEOHead from '@/components/SEOHead';
import DownloadCard from '@/components/DownloadCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { generateOptimizedTitle, generateOptimizedMetaDescription, LONG_TAIL_KEYWORDS } from '@/lib/keywords';

export default function Downloads() {
  const [location] = useLocation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [platform, setPlatform] = useState('all');
  const [strategy, setStrategy] = useState('all');
  const [minRating, setMinRating] = useState([0]);
  const [sortBy, setSortBy] = useState('popular');
  const [page, setPage] = useState(1);
  const downloadsPerPage = 12;

  // Fetch downloads
  const { data: downloadsData, isLoading } = useQuery({
    queryKey: ['/api/downloads', searchQuery, platform, strategy, minRating, sortBy, page],
    select: (data: any) => {
      let downloads = data?.data || [];
      
      // Filter by search query
      if (searchQuery) {
        downloads = downloads.filter((d: any) => 
          d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Filter by platform
      if (platform !== 'all') {
        downloads = downloads.filter((d: any) => d.platform === platform);
      }
      
      // Filter by strategy
      if (strategy !== 'all') {
        downloads = downloads.filter((d: any) => d.strategy === strategy);
      }
      
      // Filter by minimum rating
      downloads = downloads.filter((d: any) => (d.rating || 0) >= minRating[0]);
      
      // Sort downloads
      switch (sortBy) {
        case 'newest':
          downloads = [...downloads].sort((a: any, b: any) => 
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          break;
        case 'rating':
          downloads = [...downloads].sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
          break;
        case 'downloads':
          downloads = [...downloads].sort((a: any, b: any) => (b.downloads || 0) - (a.downloads || 0));
          break;
        default: // popular
          downloads = [...downloads].sort((a: any, b: any) => 
            ((b.downloads || 0) + (b.rating || 0) * 100) - ((a.downloads || 0) + (a.rating || 0) * 100)
          );
      }
      
      // Pagination
      const startIndex = (page - 1) * downloadsPerPage;
      const paginatedDownloads = downloads.slice(startIndex, startIndex + downloadsPerPage);
      
      return {
        downloads: paginatedDownloads,
        total: downloads.length,
        totalPages: Math.ceil(downloads.length / downloadsPerPage)
      };
    }
  });

  // Fetch categories for filters
  const { data: categories } = useQuery({
    queryKey: ['/api/categories']
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const pageTitle = generateOptimizedTitle('DOWNLOAD', {
    name: 'Expert Advisors',
    version: '',
    type: 'EA',
    platform: 'MT4/MT5'
  });

  const metaDescription = generateOptimizedMetaDescription('DOWNLOAD', {
    name: 'Forex Expert Advisors',
    type: 'Trading Robots',
    platform: 'MT4/MT5',
    features: 'automated trading, backtested strategies, risk management',
    performance: 'Proven profitable with verified results'
  });

  const breadcrumbs = [{ name: 'Downloads' }];

  // Sample strategies for filter
  const strategies = [
    { value: 'all', label: 'All Strategies' },
    { value: 'scalping', label: 'Scalping' },
    { value: 'grid', label: 'Grid Trading' },
    { value: 'martingale', label: 'Martingale' },
    { value: 'hedging', label: 'Hedging' },
    { value: 'trend', label: 'Trend Following' },
    { value: 'breakout', label: 'Breakout' },
    { value: 'news', label: 'News Trading' }
  ];

  return (
    <HelmetProvider>
      <SEOHead
        title={pageTitle}
        description={metaDescription}
        keywords={LONG_TAIL_KEYWORDS.slice(0, 10).join(', ')}
        path={location}
        ogType="website"
      />
      
      <Layout breadcrumbs={breadcrumbs}>
        {/* Page Header */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Free Forex EA Downloads
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              Download professional Expert Advisors and automated trading systems for MT4/MT5. 
              All EAs are tested, verified, and include complete documentation.
            </p>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap gap-6 mt-8">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <span className="font-medium">{downloadsData?.total || 500}+ EAs Available</span>
              </div>
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-green-600" />
                <span className="font-medium">100% Free Downloads</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-600" />
                <span className="font-medium">Verified & Tested</span>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Filters Sidebar */}
              <aside className="lg:col-span-1 space-y-6">
                {/* Search */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Search Downloads
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSearch}>
                      <Input
                        type="text"
                        placeholder="Search EAs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="mb-3"
                        data-testid="input-search-downloads"
                      />
                      <Button type="submit" className="w-full" size="sm" data-testid="button-search">
                        Search
                      </Button>
                    </form>
                  </CardContent>
                </Card>
                
                {/* Platform Filter */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Platform</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger data-testid="select-platform">
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Platforms</SelectItem>
                        <SelectItem value="mt4">MetaTrader 4</SelectItem>
                        <SelectItem value="mt5">MetaTrader 5</SelectItem>
                        <SelectItem value="both">MT4 & MT5</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
                
                {/* Strategy Filter */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Strategy Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={strategy} onValueChange={setStrategy}>
                      <SelectTrigger data-testid="select-strategy">
                        <SelectValue placeholder="Select strategy" />
                      </SelectTrigger>
                      <SelectContent>
                        {strategies.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
                
                {/* Rating Filter */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Minimum Rating</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Rating: {minRating[0]}+</Label>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${i < minRating[0] ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <Slider
                        value={minRating}
                        onValueChange={setMinRating}
                        min={0}
                        max={5}
                        step={1}
                        className="w-full"
                        data-testid="slider-rating"
                      />
                    </div>
                  </CardContent>
                </Card>
                
                {/* Reset Filters */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSearchQuery('');
                    setPlatform('all');
                    setStrategy('all');
                    setMinRating([0]);
                    setPage(1);
                  }}
                  data-testid="button-reset-filters"
                >
                  Reset All Filters
                </Button>
              </aside>
              
              {/* Main Content */}
              <div className="lg:col-span-3">
                {/* Sort Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div className="text-muted-foreground">
                    <span className="font-medium">{downloadsData?.total || 0}</span> Expert Advisors found
                  </div>
                  
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]" data-testid="select-sort">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="downloads">Most Downloads</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Downloads Grid */}
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[...Array(9)].map((_, i) => (
                      <Card key={i} className="overflow-hidden">
                        <Skeleton className="h-48 w-full" />
                        <CardContent className="p-6">
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-full mb-4" />
                          <Skeleton className="h-10 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : downloadsData?.downloads?.length === 0 ? (
                  <Card className="py-12">
                    <CardContent className="text-center">
                      <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">No Expert Advisors found matching your criteria.</p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchQuery('');
                          setPlatform('all');
                          setStrategy('all');
                          setMinRating([0]);
                        }}
                        data-testid="button-clear-filters"
                      >
                        Clear Filters
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {downloadsData?.downloads?.map((download: any) => (
                      <DownloadCard key={download.id} {...download} />
                    ))}
                  </div>
                )}
                
                {/* Pagination */}
                {downloadsData && downloadsData.totalPages > 1 && (
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
                      {[...Array(Math.min(5, downloadsData.totalPages))].map((_, i) => {
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
                      {downloadsData.totalPages > 5 && (
                        <span className="mx-1">...</span>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(downloadsData.totalPages, p + 1))}
                      disabled={page === downloadsData.totalPages}
                      data-testid="button-next"
                    >
                      Next
                    </Button>
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