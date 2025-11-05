import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { useLocation } from 'wouter';
import { Download, Filter, Search, TrendingUp, Star, Package, DollarSign, HardDrive, Calendar, Zap, SlidersHorizontal } from 'lucide-react';
import Layout from '@/components/Layout';
import SEOHead from '@/components/SEOHead';
import DownloadCard from '@/components/DownloadCard';
import Pagination from '@/components/Pagination';
import FilterSidebar from '@/components/FilterSidebar';
import FilterChips, { FilterChip } from '@/components/FilterChips';
import RatingFilter from '@/components/RatingFilter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { generateOptimizedTitle, generateOptimizedMetaDescription, LONG_TAIL_KEYWORDS } from '@/lib/keywords';

// Helper to sync filters with URL
function useUrlFilters() {
  const [location, setLocation] = useLocation();
  const params = new URLSearchParams(location ? location.split('?')[1] || '' : '');

  const getFilters = () => {
    return {
      search: params.get('search') || '',
      platform: params.get('platform') || 'all',
      strategy: params.getAll('strategy'),
      minRating: parseInt(params.get('rating') || '0', 10),
      price: params.get('price') || 'all',
      version: params.get('version') || '',
      sortBy: params.get('sortBy') || 'popular',
      page: parseInt(params.get('page') || '1', 10),
      limit: parseInt(params.get('limit') || '12', 10),
    };
  };

  const setFilters = (newFilters: any) => {
    const params = new URLSearchParams();
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '' || value === 'all' || value === 0 ||
          (Array.isArray(value) && value.length === 0)) {
        return;
      }
      
      if (Array.isArray(value)) {
        value.forEach(item => params.append(key, item));
      } else {
        params.append(key, String(value));
      }
    });

    const basePath = location ? location.split('?')[0] : '/downloads';
    const queryString = params.toString();
    setLocation(queryString ? `${basePath}?${queryString}` : basePath);
  };

  return [getFilters(), setFilters] as const;
}

export default function DownloadsEnhanced() {
  const [location] = useLocation();
  const [filters, setFilters] = useUrlFilters();
  const [searchInput, setSearchInput] = useState(filters.search);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>(filters.strategy);
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Update URL when filters change
  useEffect(() => {
    setFilters({
      ...filters,
      search: debouncedSearch,
      strategy: selectedStrategies,
    });
  }, [debouncedSearch, selectedStrategies]);

  // Fetch signals/downloads with all filters
  const { data: downloadsData, isLoading } = useQuery({
    queryKey: ['/api/signals', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', filters.page.toString());
      params.append('limit', filters.limit.toString());
      
      // Sort parameters
      const sortMap: Record<string, string[]> = {
        'newest': ['createdAt', 'desc'],
        'popular': ['downloadCount', 'desc'],
        'rating': ['rating', 'desc'],
        'name': ['name', 'asc']
      };
      const [sortBy, sortOrder] = sortMap[filters.sortBy] || ['downloadCount', 'desc'];
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      
      // Filters
      if (filters.search) params.append('search', filters.search);
      
      if (filters.platform !== 'all') {
        params.append('platform', filters.platform.toUpperCase());
      }
      
      selectedStrategies.forEach(strategy => params.append('strategy', strategy));
      
      if (filters.minRating > 0) {
        params.append('minRating', filters.minRating.toString());
      }
      
      if (filters.price !== 'all') {
        params.append('price', filters.price);
      }
      
      if (filters.version) {
        params.append('version', filters.version);
      }
      
      const response = await fetch(`/api/signals?${params.toString()}`);
      if (!response.ok) {
        // Mock data for demonstration
        return {
          data: [
            {
              id: 1,
              name: 'Grid Master EA v3.0',
              description: 'Professional grid trading EA with advanced risk management',
              platform: 'MT4',
              strategy: 'Grid',
              rating: 4.5,
              downloads: 2500,
              version: '3.0',
              file_size: '2.5 MB',
              price: 0,
              createdAt: '2024-01-10',
              preview_image: '/api/placeholder/400/300'
            },
            {
              id: 2,
              name: 'Scalping Pro Indicator',
              description: 'Advanced scalping indicator for quick trades',
              platform: 'MT5',
              strategy: 'Scalping',
              rating: 4.8,
              downloads: 3200,
              version: '2.1',
              file_size: '1.8 MB',
              price: 0,
              createdAt: '2024-01-08',
              preview_image: '/api/placeholder/400/300'
            }
          ],
          total: 50,
          totalPages: 5,
          page: filters.page
        };
      }
      return response.json();
    }
  });

  // Available strategies
  const strategies = [
    { value: 'scalping', label: 'Scalping', count: 15 },
    { value: 'grid', label: 'Grid Trading', count: 12 },
    { value: 'martingale', label: 'Martingale', count: 8 },
    { value: 'hedging', label: 'Hedging', count: 10 },
    { value: 'trend', label: 'Trend Following', count: 20 },
    { value: 'breakout', label: 'Breakout', count: 7 },
    { value: 'news', label: 'News Trading', count: 5 },
    { value: 'arbitrage', label: 'Arbitrage', count: 3 }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, search: searchInput, page: 1 });
  };

  const handlePlatformChange = (platform: string) => {
    setFilters({ ...filters, platform, page: 1 });
  };

  const handleStrategyToggle = (strategy: string) => {
    setSelectedStrategies(prev =>
      prev.includes(strategy) 
        ? prev.filter(s => s !== strategy)
        : [...prev, strategy]
    );
    setFilters({ ...filters, page: 1 });
  };

  const handleRatingChange = (rating: number) => {
    setFilters({ ...filters, minRating: rating, page: 1 });
  };

  const handlePriceChange = (price: string) => {
    setFilters({ ...filters, price, page: 1 });
  };

  const handleVersionChange = (version: string) => {
    setFilters({ ...filters, version, page: 1 });
  };

  const handleSortChange = (sortBy: string) => {
    setFilters({ ...filters, sortBy, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (limit: number) => {
    setFilters({ ...filters, limit, page: 1 });
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSelectedStrategies([]);
    setFilters({
      search: '',
      platform: 'all',
      strategy: [],
      minRating: 0,
      price: 'all',
      version: '',
      sortBy: 'popular',
      page: 1,
      limit: 12
    });
  };

  // Create filter chips
  const activeFilters = useMemo(() => {
    const chips: FilterChip[] = [];
    
    if (filters.search) {
      chips.push({
        id: 'search',
        label: `Search: ${filters.search}`,
        value: filters.search,
        category: 'Search'
      });
    }
    
    if (filters.platform !== 'all') {
      chips.push({
        id: 'platform',
        label: filters.platform.toUpperCase(),
        value: filters.platform,
        category: 'Platform'
      });
    }
    
    selectedStrategies.forEach(strategy => {
      const strategyLabel = strategies.find(s => s.value === strategy)?.label || strategy;
      chips.push({
        id: `strategy-${strategy}`,
        label: strategyLabel,
        value: strategy,
        category: 'Strategy'
      });
    });
    
    if (filters.minRating > 0) {
      chips.push({
        id: 'rating',
        label: `${filters.minRating}+ stars`,
        value: filters.minRating,
        category: 'Rating'
      });
    }
    
    if (filters.price !== 'all') {
      chips.push({
        id: 'price',
        label: filters.price === 'free' ? 'Free' : 'Paid',
        value: filters.price,
        category: 'Price'
      });
    }
    
    if (filters.version) {
      chips.push({
        id: 'version',
        label: `v${filters.version}`,
        value: filters.version,
        category: 'Version'
      });
    }
    
    return chips;
  }, [filters, selectedStrategies, strategies]);

  const handleRemoveFilter = (filterId: string) => {
    if (filterId === 'search') {
      setSearchInput('');
    } else if (filterId === 'platform') {
      setFilters({ ...filters, platform: 'all' });
    } else if (filterId.startsWith('strategy-')) {
      const strategy = filterId.replace('strategy-', '');
      setSelectedStrategies(prev => prev.filter(s => s !== strategy));
    } else if (filterId === 'rating') {
      setFilters({ ...filters, minRating: 0 });
    } else if (filterId === 'price') {
      setFilters({ ...filters, price: 'all' });
    } else if (filterId === 'version') {
      setFilters({ ...filters, version: '' });
    }
  };

  const hasActiveFilters = activeFilters.length > 0;

  // Filter sidebar sections
  const filterSections = [
    {
      id: 'platform',
      title: 'Platform',
      icon: Package,
      content: (
        <RadioGroup value={filters.platform} onValueChange={handlePlatformChange}>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="platform-all" />
              <Label htmlFor="platform-all" className="cursor-pointer">All Platforms</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mt4" id="platform-mt4" />
              <Label htmlFor="platform-mt4" className="cursor-pointer">MetaTrader 4</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mt5" id="platform-mt5" />
              <Label htmlFor="platform-mt5" className="cursor-pointer">MetaTrader 5</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="both" id="platform-both" />
              <Label htmlFor="platform-both" className="cursor-pointer">MT4 & MT5</Label>
            </div>
          </div>
        </RadioGroup>
      )
    },
    {
      id: 'strategy',
      title: 'Trading Strategy',
      icon: TrendingUp,
      content: (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {strategies.map(strategy => (
            <div key={strategy.value} className="flex items-center space-x-2">
              <Checkbox
                id={`strategy-${strategy.value}`}
                checked={selectedStrategies.includes(strategy.value)}
                onCheckedChange={() => handleStrategyToggle(strategy.value)}
                data-testid={`checkbox-strategy-${strategy.value}`}
              />
              <Label 
                htmlFor={`strategy-${strategy.value}`} 
                className="text-sm cursor-pointer flex-1"
              >
                {strategy.label} ({strategy.count})
              </Label>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'rating',
      title: 'Minimum Rating',
      icon: Star,
      content: (
        <RatingFilter
          value={filters.minRating}
          onChange={handleRatingChange}
          showLabel={false}
          mode="radio"
        />
      )
    },
    {
      id: 'price',
      title: 'Price',
      icon: DollarSign,
      content: (
        <RadioGroup value={filters.price} onValueChange={handlePriceChange}>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="price-all" />
              <Label htmlFor="price-all" className="cursor-pointer">All</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="free" id="price-free" />
              <Label htmlFor="price-free" className="cursor-pointer">Free Only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="paid" id="price-paid" />
              <Label htmlFor="price-paid" className="cursor-pointer">Premium</Label>
            </div>
          </div>
        </RadioGroup>
      )
    },
    {
      id: 'version',
      title: 'Version',
      icon: HardDrive,
      content: (
        <Select value={filters.version} onValueChange={handleVersionChange}>
          <SelectTrigger data-testid="select-version">
            <SelectValue placeholder="Any version" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any version</SelectItem>
            <SelectItem value="1.0">v1.0+</SelectItem>
            <SelectItem value="2.0">v2.0+</SelectItem>
            <SelectItem value="3.0">v3.0+</SelectItem>
            <SelectItem value="latest">Latest only</SelectItem>
          </SelectContent>
        </Select>
      )
    }
  ];

  const sortOptions = [
    { value: 'popular', label: 'Most Popular', icon: TrendingUp },
    { value: 'newest', label: 'Newest First', icon: Calendar },
    { value: 'rating', label: 'Highest Rated', icon: Star },
    { value: 'name', label: 'Name (A-Z)', icon: Zap }
  ];

  const pageTitle = generateOptimizedTitle('DOWNLOAD', {
    name: 'Expert Advisors',
    version: '',
    type: 'EA',
    platform: filters.platform !== 'all' ? filters.platform.toUpperCase() : 'MT4/MT5'
  });

  const metaDescription = generateOptimizedMetaDescription('DOWNLOAD', {
    name: 'Forex Expert Advisors',
    type: 'Trading Robots',
    platform: filters.platform !== 'all' ? filters.platform.toUpperCase() : 'MT4/MT5',
    features: 'automated trading, backtested strategies, risk management',
    performance: 'Proven profitable with verified results'
  });

  const breadcrumbs = [{ name: 'Downloads' }];

  return (
    <HelmetProvider>
      <SEOHead
        title={pageTitle}
        description={metaDescription}
        keywords={LONG_TAIL_KEYWORDS.slice(0, 10).join(', ')}
        path={location || '/downloads'}
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
            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="mb-6">
                <FilterChips
                  filters={activeFilters}
                  onRemove={handleRemoveFilter}
                  onClearAll={clearAllFilters}
                />
              </div>
            )}
            
            {/* Search and Sort Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search EAs, indicators..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-10"
                    data-testid="input-downloads-search"
                  />
                </div>
                <Button type="submit" data-testid="button-downloads-search">
                  Search
                </Button>
              </form>
              
              <div className="flex gap-2">
                <Select value={filters.sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-48" data-testid="select-sort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="flex items-center gap-2">
                          <option.icon className="h-4 w-4" />
                          {option.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Mobile Filter Toggle */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden" data-testid="button-mobile-filters">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterSidebar
                        sections={filterSections}
                        onClearAll={clearAllFilters}
                        hasActiveFilters={hasActiveFilters}
                        collapsible={false}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Desktop Sidebar */}
              <aside className="hidden lg:block lg:col-span-1">
                <FilterSidebar
                  sections={filterSections}
                  onClearAll={clearAllFilters}
                  hasActiveFilters={hasActiveFilters}
                />
              </aside>
              
              {/* Main Content */}
              <div className="lg:col-span-3">
                {/* Results Info */}
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm text-muted-foreground">
                    {downloadsData?.total || 0} downloads found
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Show:</span>
                    <Select 
                      value={filters.limit.toString()} 
                      onValueChange={(v) => handleItemsPerPageChange(parseInt(v, 10))}
                    >
                      <SelectTrigger className="h-8 w-16" data-testid="select-page-size">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[12, 24, 48, 96].map(size => (
                          <SelectItem key={size} value={size.toString()}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span>per page</span>
                  </div>
                </div>
                
                {/* Downloads Grid */}
                {isLoading ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <Card key={i}>
                        <Skeleton className="h-48 w-full rounded-t-lg" />
                        <CardHeader>
                          <Skeleton className="h-6 w-3/4" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-20" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : downloadsData?.data?.length > 0 ? (
                  <>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {downloadsData.data.map((signal: any) => (
                        <DownloadCard 
                          key={signal.id}
                          id={signal.id || signal.uuid}
                          name={signal.title || 'Unnamed EA'}
                          description={signal.description || 'No description available'}
                          version={signal.version || '1.0.0'}
                          compatibility={signal.platform || 'MT4'}
                          downloads={signal.downloadCount || 0}
                          rating={signal.rating || 4.5}
                          lastUpdated={signal.createdAt || new Date().toISOString()}
                          image={signal.image || '/default-ea-image.jpg'}
                          fileSize={signal.sizeBytes ? `${(signal.sizeBytes / 1024 / 1024).toFixed(2)} MB` : '0 MB'}
                          isPremium={signal.isPremium || false}
                          features={signal.features || []}
                        />
                      ))}
                    </div>
                    
                    {/* Pagination */}
                    {downloadsData.totalPages > 1 && (
                      <div className="mt-8">
                        <Pagination
                          currentPage={filters.page}
                          totalPages={downloadsData.totalPages}
                          totalItems={downloadsData.total}
                          itemsPerPage={filters.limit}
                          onPageChange={handlePageChange}
                          onItemsPerPageChange={handleItemsPerPageChange}
                          showItemsPerPage={false}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Download className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-lg font-medium mb-2">No downloads found</p>
                      <p className="text-muted-foreground">
                        Try adjusting your filters or search terms.
                      </p>
                      {hasActiveFilters && (
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={clearAllFilters}
                        >
                          Clear all filters
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </section>
      </Layout>
    </HelmetProvider>
  );
}