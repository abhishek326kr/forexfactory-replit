import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Search, X, FileText, Download, Tag, TrendingUp, Clock, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string | number;
  title: string;
  description?: string;
  type: 'blog' | 'signal' | 'category';
  url: string;
  date?: string;
  count?: number;
}

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function GlobalSearch({ 
  className, 
  placeholder = "Search blogs, EAs, strategies...",
  autoFocus = false 
}: GlobalSearchProps) {
  const [location, setLocation] = useLocation();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch search suggestions
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['/api/search/suggestions', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return null;
      
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(debouncedQuery)}&limit=8`);
      if (!response.ok) {
        // Fallback to client-side search
        return mockSearchResults(debouncedQuery);
      }
      return response.json();
    },
    enabled: debouncedQuery.length >= 2
  });

  // Mock search results for demonstration
  const mockSearchResults = (q: string): SearchResult[] => {
    const mockData: SearchResult[] = [
      {
        id: 1,
        title: 'Best MT4 Expert Advisors for Scalping',
        type: 'blog',
        url: '/blog/best-mt4-expert-advisors-scalping',
        date: '2 days ago'
      },
      {
        id: 2,
        title: 'Grid Trading EA v2.5',
        description: 'Advanced grid trading system with risk management',
        type: 'signal',
        url: '/download/grid-trading-ea-v25',
        count: 1245
      },
      {
        id: 3,
        title: 'Scalping Strategies',
        type: 'category',
        url: '/category/scalping',
        count: 45
      }
    ];
    
    return mockData.filter(item => 
      item.title.toLowerCase().includes(q.toLowerCase())
    );
  };

  const results = searchResults?.results || searchResults || [];
  const hasResults = results.length > 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || !hasResults) {
      if (e.key === 'Enter' && query.trim()) {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleResultClick(results[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSearch = () => {
    if (!query.trim()) return;
    setLocation(`/search?q=${encodeURIComponent(query)}`);
    setIsOpen(false);
    setQuery('');
  };

  const handleResultClick = (result: SearchResult) => {
    setLocation(result.url);
    setIsOpen(false);
    setQuery('');
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'blog':
        return <FileText className="h-4 w-4" />;
      case 'signal':
        return <Download className="h-4 w-4" />;
      case 'category':
        return <Tag className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'blog':
        return 'Article';
      case 'signal':
        return 'EA/Signal';
      case 'category':
        return 'Category';
      default:
        return type;
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-primary/20 text-primary font-medium">{part}</mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(e.target.value.length >= 2);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className="pl-10 pr-10"
          autoFocus={autoFocus}
          data-testid="input-global-search"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            data-testid="button-clear-search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Dropdown */}
      {isOpen && (
        <Card className="absolute top-full mt-2 w-full z-50 max-h-96 overflow-auto">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span>Searching...</span>
              </div>
            </div>
          ) : hasResults ? (
            <div className="py-2">
              {/* Quick Stats */}
              {searchResults?.stats && (
                <div className="px-4 py-2 border-b text-sm text-muted-foreground">
                  Found {searchResults.stats.total} results
                </div>
              )}
              
              {/* Results */}
              {results.map((result: SearchResult, index: number) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "w-full px-4 py-3 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left",
                    selectedIndex === index && "bg-muted"
                  )}
                  data-testid={`search-result-${index}`}
                >
                  <div className="mt-0.5 text-muted-foreground">
                    {getResultIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">
                        {highlightMatch(result.title, query)}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {getTypeLabel(result.type)}
                      </Badge>
                    </div>
                    {result.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {highlightMatch(result.description, query)}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {result.date && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {result.date}
                        </span>
                      )}
                      {result.count && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {result.count.toLocaleString()} {result.type === 'signal' ? 'downloads' : 'posts'}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground mt-2" />
                </button>
              ))}
              
              {/* View All Results */}
              <div className="border-t mt-2 pt-2 px-4 pb-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-between"
                  onClick={handleSearch}
                  data-testid="button-view-all-results"
                >
                  <span>View all results for "{query}"</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : query.length >= 2 ? (
            <div className="p-8 text-center">
              <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                No results found for "{query}"
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={handleSearch}
              >
                Search all content
              </Button>
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );
}