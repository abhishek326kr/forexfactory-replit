import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { useLocation } from 'wouter';
import { Search, Bot, TrendingUp, Activity, Filter, Download } from 'lucide-react';
import Layout from '@/components/Layout';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateOptimizedTitle, generateOptimizedMetaDescription, LONG_TAIL_KEYWORDS } from '@/lib/keywords';

interface Signal {
  id: string;
  uuid: string;
  title: string;
  description: string;
  filePath?: string;
  screenshots?: string;
  platform?: string;
  strategy?: string;
  downloadCount: number;
  rating?: number;
  createdAt: string;
}

export default function Signals() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [strategyFilter, setStrategyFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const signalsPerPage = 12;

  // Fetch signals from API
  const { data: signalsData, isLoading: signalsLoading } = useQuery({
    queryKey: ['/api/signals', searchQuery, platformFilter, strategyFilter, sortBy, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', signalsPerPage.toString());
      params.append('sortBy', 'createdAt');
      params.append('sortOrder', sortBy === 'oldest' ? 'asc' : 'desc');
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      if (platformFilter !== 'all') {
        params.append('platform', platformFilter);
      }
      
      if (strategyFilter !== 'all') {
        params.append('strategy', strategyFilter);
      }
      
      const response = await fetch(`/api/signals?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch signals');
      return response.json();
    },
    select: (data: any) => {
      return {
        signals: data?.data || data?.signals || [],
        total: data?.total || 0,
        totalPages: data?.totalPages || Math.ceil((data?.total || 0) / signalsPerPage)
      };
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const getScreenshot = (signal: Signal) => {
    if (signal.screenshots) {
      try {
        const screenshots = JSON.parse(signal.screenshots);
        return screenshots[0] || signal.filePath;
      } catch {
        return signal.filePath;
      }
    }
    return signal.filePath;
  };

  const pageTitle = 'Forex Trading Signals & Expert Advisors - Free MT4/MT5 EAs';
  const metaDescription = generateOptimizedMetaDescription('SIGNAL', {
    topic: 'Expert Advisors and trading signals',
    benefit: 'automated trading strategies',
    outcome: 'consistent profits'
  });

  const breadcrumbs = [{ name: 'Signals' }];

  return (
    <HelmetProvider>
      <SEOHead
        title={pageTitle}
        description={metaDescription}
        keywords={LONG_TAIL_KEYWORDS.slice(10, 20).join(', ')}
        path={location}
        ogType="website"
      />
      
      <Layout breadcrumbs={breadcrumbs}>
        {/* Page Header */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Trading Signals & Expert Advisors
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              Discover proven trading strategies and Expert Advisors for MetaTrader 4 & 5. 
              Download free EAs and automated trading systems tested by professionals.
            </p>
          </div>
        </section>
        
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Sidebar */}
              <aside className="lg:col-span-1 space-y-6">
                {/* Search */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Search Signals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSearch} className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Search signals..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                          data-testid="input-signal-search"
                        />
                      </div>
                      <Button type="submit" className="w-full" size="sm" data-testid="button-signal-search">
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
                    <Select value={platformFilter} onValueChange={(value) => { setPlatformFilter(value); setPage(1); }}>
                      <SelectTrigger data-testid="select-platform">
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Platforms</SelectItem>
                        <SelectItem value="MT4">MetaTrader 4</SelectItem>
                        <SelectItem value="MT5">MetaTrader 5</SelectItem>
                        <SelectItem value="Both">Both MT4 & MT5</SelectItem>
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
                    <Select value={strategyFilter} onValueChange={(value) => { setStrategyFilter(value); setPage(1); }}>
                      <SelectTrigger data-testid="select-strategy">
                        <SelectValue placeholder="Select strategy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Strategies</SelectItem>
                        <SelectItem value="scalping">Scalping</SelectItem>
                        <SelectItem value="grid">Grid Trading</SelectItem>
                        <SelectItem value="trend">Trend Following</SelectItem>
                        <SelectItem value="martingale">Martingale</SelectItem>
                        <SelectItem value="hedging">Hedging</SelectItem>
                        <SelectItem value="arbitrage">Arbitrage</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              </aside>
              
              {/* Main Content */}
              <div className="lg:col-span-3">
                {/* Sort and Filter Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-sm font-medium">
                      {signalsData?.total || 0} signals found
                    </span>
                    {(searchQuery || platformFilter !== 'all' || strategyFilter !== 'all') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchQuery('');
                          setPlatformFilter('all');
                          setStrategyFilter('all');
                          setPage(1);
                        }}
                        data-testid="button-clear-filters"
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                  
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]" data-testid="select-sort-by">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="popular">Most Downloads</SelectItem>
                      <SelectItem value="rated">Highest Rated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Signals Grid */}
                {signalsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <Card key={i}>
                        <Skeleton className="h-48 w-full" />
                        <CardContent className="pt-4">
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-full mt-1" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : signalsData?.signals.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No signals found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your filters or search query
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {signalsData?.signals.map((signal: Signal) => (
                      <Card key={signal.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        {/* Screenshot */}
                        <div className="aspect-video bg-muted relative">
                          {getScreenshot(signal) ? (
                            <img 
                              src={getScreenshot(signal)} 
                              alt={signal.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<div class="flex items-center justify-center h-full"><svg class="h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg></div>';
                                }
                              }}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Bot className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                          {signal.platform && (
                            <Badge className="absolute top-2 right-2">
                              {signal.platform}
                            </Badge>
                          )}
                        </div>

                        <CardContent className="pt-4">
                          {/* Title */}
                          <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                            {signal.title}
                          </h3>
                          
                          {/* Description */}
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                            {signal.description}
                          </p>

                          {/* Stats */}
                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <Download className="h-4 w-4" />
                              <span>{signal.downloadCount || 0} downloads</span>
                            </div>
                            {signal.strategy && (
                              <Badge variant="outline" className="text-xs">
                                {signal.strategy}
                              </Badge>
                            )}
                          </div>

                          {/* View Button */}
                          <Button 
                            className="w-full" 
                            size="sm"
                            onClick={() => window.location.href = `/signal/${signal.uuid || signal.id}`}
                          >
                            View Details
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                
                {/* Pagination */}
                {signalsData && signalsData.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      data-testid="button-prev-page"
                    >
                      Previous
                    </Button>
                    <span className="px-4 text-sm text-muted-foreground">
                      Page {page} of {signalsData.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.min(signalsData.totalPages, page + 1))}
                      disabled={page === signalsData.totalPages}
                      data-testid="button-next-page"
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