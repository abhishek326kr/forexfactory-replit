import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { useLocation } from 'wouter';
import { DateRange } from 'react-day-picker';
import { Search, Calendar, Clock, Tag, User, TrendingUp, Eye, MessageSquare, SlidersHorizontal } from 'lucide-react';
import Layout from '@/components/Layout';
import SEOHead from '@/components/SEOHead';
import BlogCard from '@/components/BlogCard';
import CategoryFilter from '@/components/CategoryFilter';
import Pagination from '@/components/Pagination';
import FilterSidebar from '@/components/FilterSidebar';
import FilterChips, { createFilterChips, FilterChip } from '@/components/FilterChips';
import DateRangePicker from '@/components/DateRangePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { generateOptimizedTitle, generateOptimizedMetaDescription, LONG_TAIL_KEYWORDS } from '@/lib/keywords';

// Helper to sync filters with URL
function useUrlFilters() {
  const [location, setLocation] = useLocation();
  const params = new URLSearchParams(location.split('?')[1] || '');

  const getFilters = () => {
    const category = location.includes('/category/') 
      ? location.split('/category/')[1]?.split('?')[0] 
      : params.get('category');

    return {
      search: params.get('search') || '',
      category,
      tags: params.getAll('tags'),
      author: params.get('author') || '',
      sortBy: params.get('sortBy') || 'newest',
      page: parseInt(params.get('page') || '1', 10),
      limit: parseInt(params.get('limit') || '12', 10),
      dateFrom: params.get('dateFrom') ? new Date(params.get('dateFrom')!) : undefined,
      dateTo: params.get('dateTo') ? new Date(params.get('dateTo')!) : undefined,
    };
  };

  const setFilters = (newFilters: any) => {
    const params = new URLSearchParams();
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '' || 
          (Array.isArray(value) && value.length === 0)) {
        return;
      }
      
      if (key === 'dateFrom' || key === 'dateTo') {
        if (value) {
          params.append(key, (value as Date).toISOString().split('T')[0]);
        }
      } else if (Array.isArray(value)) {
        value.forEach(item => params.append(key, item));
      } else if (key !== 'category') {
        params.append(key, String(value));
      }
    });

    const basePath = newFilters.category && !location.includes('/category/')
      ? `/category/${newFilters.category}`
      : location.split('?')[0].replace(/\/category\/[^/?]+/, '/blog');
    
    const queryString = params.toString();
    setLocation(queryString ? `${basePath}?${queryString}` : basePath);
  };

  return [getFilters(), setFilters] as const;
}

export default function BlogEnhanced() {
  const [filters, setFilters] = useUrlFilters();
  const [searchInput, setSearchInput] = useState(filters.search);
  const [selectedTags, setSelectedTags] = useState<string[]>(filters.tags);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    filters.dateFrom && filters.dateTo
      ? { from: filters.dateFrom, to: filters.dateTo }
      : undefined
  );
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
      tags: selectedTags,
      dateFrom: dateRange?.from,
      dateTo: dateRange?.to,
    });
  }, [debouncedSearch, selectedTags, dateRange]);

  // Fetch posts with all filters
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['/api/blogs', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', filters.page.toString());
      params.append('limit', filters.limit.toString());
      
      // Sort parameters
      const sortMap: Record<string, string[]> = {
        'newest': ['createdAt', 'desc'],
        'oldest': ['createdAt', 'asc'],
        'views': ['views', 'desc'],
        'comments': ['comment_count', 'desc']
      };
      const [sortBy, sortOrder] = sortMap[filters.sortBy] || ['createdAt', 'desc'];
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      
      // Other filters
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.author) params.append('author', filters.author);
      
      filters.tags.forEach(tag => params.append('tags', tag));
      
      if (filters.dateFrom) {
        params.append('dateFrom', filters.dateFrom.toISOString().split('T')[0]);
      }
      if (filters.dateTo) {
        params.append('dateTo', filters.dateTo.toISOString().split('T')[0]);
      }
      
      const response = await fetch(`/api/blogs?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch blogs');
      return response.json();
    }
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['/api/categories']
  });

  // Fetch tags
  const { data: allTags } = useQuery({
    queryKey: ['/api/tags']
  });

  // Fetch authors
  const { data: authors } = useQuery({
    queryKey: ['/api/authors'],
    queryFn: async () => {
      // Mock data for demonstration
      return [
        { id: 1, name: 'John Trader', post_count: 45 },
        { id: 2, name: 'Sarah Expert', post_count: 38 },
        { id: 3, name: 'Mike Analyst', post_count: 27 },
        { id: 4, name: 'Emma Strategist', post_count: 31 },
      ];
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, search: searchInput, page: 1 });
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
    setFilters({ ...filters, page: 1 });
  };

  const handleSortChange = (sortBy: string) => {
    setFilters({ ...filters, sortBy, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handleItemsPerPageChange = (limit: number) => {
    setFilters({ ...filters, limit, page: 1 });
  };

  const handleAuthorChange = (author: string) => {
    setFilters({ ...filters, author: author === 'all' ? '' : author, page: 1 });
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setFilters({ 
      ...filters, 
      dateFrom: range?.from,
      dateTo: range?.to,
      page: 1 
    });
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSelectedTags([]);
    setDateRange(undefined);
    setFilters({
      search: '',
      category: '',
      tags: [],
      author: '',
      sortBy: 'newest',
      page: 1,
      limit: 12,
      dateFrom: undefined,
      dateTo: undefined
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
    
    if (filters.category) {
      chips.push({
        id: 'category',
        label: filters.category,
        value: filters.category,
        category: 'Category'
      });
    }
    
    selectedTags.forEach(tag => {
      chips.push({
        id: `tag-${tag}`,
        label: tag,
        value: tag,
        category: 'Tags'
      });
    });
    
    if (filters.author) {
      const authorName = authors?.find(a => a.id.toString() === filters.author)?.name || filters.author;
      chips.push({
        id: 'author',
        label: authorName,
        value: filters.author,
        category: 'Author'
      });
    }
    
    if (dateRange?.from && dateRange?.to) {
      chips.push({
        id: 'dateRange',
        label: `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`,
        value: dateRange,
        category: 'Date'
      });
    }
    
    return chips;
  }, [filters, selectedTags, dateRange, authors]);

  const handleRemoveFilter = (filterId: string) => {
    if (filterId === 'search') {
      setSearchInput('');
    } else if (filterId === 'category') {
      setFilters({ ...filters, category: '' });
    } else if (filterId.startsWith('tag-')) {
      const tag = filterId.replace('tag-', '');
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else if (filterId === 'author') {
      setFilters({ ...filters, author: '' });
    } else if (filterId === 'dateRange') {
      setDateRange(undefined);
    }
  };

  const hasActiveFilters = activeFilters.length > 0;

  // Filter sidebar sections
  const filterSections = [
    {
      id: 'date',
      title: 'Date Range',
      icon: Calendar,
      content: (
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
        />
      )
    },
    {
      id: 'tags',
      title: 'Tags',
      icon: Tag,
      content: (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {(allTags as any[] || []).map(tag => (
            <div key={tag.id} className="flex items-center space-x-2">
              <Checkbox
                id={`tag-${tag.id}`}
                checked={selectedTags.includes(tag.name)}
                onCheckedChange={() => handleTagToggle(tag.name)}
                data-testid={`checkbox-tag-${tag.name}`}
              />
              <Label 
                htmlFor={`tag-${tag.id}`} 
                className="text-sm cursor-pointer flex-1"
              >
                {tag.name} ({tag.post_count || 0})
              </Label>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'author',
      title: 'Author',
      icon: User,
      content: (
        <Select value={filters.author || 'all'} onValueChange={handleAuthorChange}>
          <SelectTrigger data-testid="select-author">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Authors</SelectItem>
            {authors?.map((author: any) => (
              <SelectItem key={author.id} value={author.id.toString()}>
                {author.name} ({author.post_count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First', icon: Clock },
    { value: 'oldest', label: 'Oldest First', icon: Clock },
    { value: 'views', label: 'Most Viewed', icon: Eye },
    { value: 'comments', label: 'Most Commented', icon: MessageSquare }
  ];

  const pageTitle = filters.category 
    ? `${filters.category} Articles - Forex Trading Insights`
    : 'Forex Trading Blog - Expert Tips & EA Strategies';

  const metaDescription = generateOptimizedMetaDescription('BLOG_POST', {
    topic: filters.category || 'Forex trading strategies',
    benefit: 'expert insights and proven techniques',
    outcome: 'trading performance'
  });

  const breadcrumbs = filters.category ? [
    { name: 'Blog', href: '/blog' },
    { name: filters.category }
  ] : [{ name: 'Blog' }];

  return (
    <HelmetProvider>
      <SEOHead
        title={pageTitle}
        description={metaDescription}
        keywords={LONG_TAIL_KEYWORDS.slice(0, 10).join(', ')}
        path={String(location)}
        ogType="website"
      />
      
      <Layout breadcrumbs={breadcrumbs}>
        {/* Page Header */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              {filters.category 
                ? `${filters.category} Articles`
                : 'Trading Insights & EA Tutorials'}
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              {filters.category
                ? `Explore our collection of ${filters.category} articles, tutorials, and expert analysis.`
                : 'Learn Forex trading strategies, Expert Advisor optimization, and market analysis from industry professionals.'}
            </p>
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
                    placeholder="Search articles..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-10"
                    data-testid="input-blog-search"
                  />
                </div>
                <Button type="submit" data-testid="button-blog-search">
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
              <aside className="hidden lg:block lg:col-span-1 space-y-6">
                {/* Categories */}
                {categories && (
                  <CategoryFilter 
                    categories={Array.isArray(categories) 
                      ? categories.map((cat: any) => cat.name || cat)
                      : []
                    } 
                    selectedCategory={filters.category || ''}
                  />
                )}
                
                {/* Other Filters */}
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
                    {postsData?.total || 0} articles found
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
                
                {/* Posts Grid */}
                {postsLoading ? (
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
                ) : postsData?.data?.length > 0 ? (
                  <>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {postsData.data.map((post: any) => {
                        // Strip HTML from content to create excerpt
                        const stripHtml = (html: string) => {
                          if (!html) return '';
                          return html
                            .replace(/<[^>]*>/g, '') // Remove HTML tags
                            .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
                            .replace(/&amp;/g, '&') // Replace &amp; with &
                            .replace(/&lt;/g, '<') // Replace &lt; with <
                            .replace(/&gt;/g, '>') // Replace &gt; with >
                            .replace(/&quot;/g, '"') // Replace &quot; with "
                            .replace(/&#39;/g, "'") // Replace &#39; with '
                            .replace(/\s+/g, ' ') // Collapse multiple spaces
                            .trim(); // Trim leading/trailing whitespace
                        };
                        
                        const cleanContent = stripHtml(post.content || '');
                        const excerpt = cleanContent.length > 150 ? cleanContent.substring(0, 150) + '...' : cleanContent;
                        
                        return (
                          <BlogCard 
                            key={post.id} 
                            id={post.id}
                            title={post.title || ''}
                            excerpt={excerpt}
                            category={post.category || 'General'}
                            author={post.author || 'Admin'}
                            date={post.createdAt || new Date().toISOString()}
                            readTime={5}
                            image={post.featuredImage || '/default-blog-image.jpg'}
                            slug={post.seoSlug || post.id}
                            tags={post.tags ? (typeof post.tags === 'string' ? post.tags.split(',') : post.tags) : []}
                          />
                        );
                      })}
                    </div>
                    
                    {/* Pagination */}
                    {postsData.totalPages > 1 && (
                      <div className="mt-8">
                        <Pagination
                          currentPage={filters.page}
                          totalPages={postsData.totalPages}
                          totalItems={postsData.total}
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
                      <p className="text-lg font-medium mb-2">No articles found</p>
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