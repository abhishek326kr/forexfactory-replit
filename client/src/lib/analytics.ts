// Analytics tracking utilities for search and filter usage

interface SearchEvent {
  query: string;
  resultsCount?: number;
  searchType?: 'global' | 'blog' | 'downloads';
  filters?: Record<string, any>;
}

interface FilterEvent {
  filterType: string;
  filterValue: any;
  page?: string;
}

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: string;
}

class Analytics {
  private events: AnalyticsEvent[] = [];
  private searchHistory: string[] = [];
  private popularSearches: Map<string, number> = new Map();

  // Track search events
  trackSearch(event: SearchEvent) {
    const analyticsEvent: AnalyticsEvent = {
      event: 'search',
      properties: {
        query: event.query,
        resultsCount: event.resultsCount,
        searchType: event.searchType || 'global',
        filters: event.filters
      },
      timestamp: new Date().toISOString()
    };

    this.events.push(analyticsEvent);
    this.searchHistory.push(event.query);
    
    // Update popular searches
    const count = this.popularSearches.get(event.query) || 0;
    this.popularSearches.set(event.query, count + 1);

    // Send to backend
    this.sendAnalytics(analyticsEvent);
  }

  // Track filter usage
  trackFilter(event: FilterEvent) {
    const analyticsEvent: AnalyticsEvent = {
      event: 'filter_applied',
      properties: {
        filterType: event.filterType,
        filterValue: event.filterValue,
        page: event.page || window.location.pathname
      },
      timestamp: new Date().toISOString()
    };

    this.events.push(analyticsEvent);
    this.sendAnalytics(analyticsEvent);
  }

  // Track page views
  trackPageView(page: string, properties?: Record<string, any>) {
    const analyticsEvent: AnalyticsEvent = {
      event: 'page_view',
      properties: {
        page,
        ...properties
      },
      timestamp: new Date().toISOString()
    };

    this.events.push(analyticsEvent);
    this.sendAnalytics(analyticsEvent);
  }

  // Track pagination
  trackPagination(page: number, itemsPerPage: number, totalItems: number) {
    const analyticsEvent: AnalyticsEvent = {
      event: 'pagination',
      properties: {
        page,
        itemsPerPage,
        totalItems,
        url: window.location.href
      },
      timestamp: new Date().toISOString()
    };

    this.events.push(analyticsEvent);
    this.sendAnalytics(analyticsEvent);
  }

  // Track download clicks
  trackDownload(downloadId: string, downloadName: string) {
    const analyticsEvent: AnalyticsEvent = {
      event: 'download_click',
      properties: {
        downloadId,
        downloadName
      },
      timestamp: new Date().toISOString()
    };

    this.events.push(analyticsEvent);
    this.sendAnalytics(analyticsEvent);
  }

  // Get search history
  getSearchHistory(limit: number = 10): string[] {
    return this.searchHistory.slice(-limit);
  }

  // Get popular searches
  getPopularSearches(limit: number = 10): Array<{ query: string; count: number }> {
    return Array.from(this.popularSearches.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([query, count]) => ({ query, count }));
  }

  // Get filter usage stats
  getFilterUsageStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    
    this.events
      .filter(e => e.event === 'filter_applied')
      .forEach(event => {
        const filterType = event.properties?.filterType;
        if (filterType) {
          stats[filterType] = (stats[filterType] || 0) + 1;
        }
      });
    
    return stats;
  }

  // Send analytics to backend
  private async sendAnalytics(event: AnalyticsEvent) {
    try {
      // Send to backend analytics endpoint
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });

      if (!response.ok) {
        console.error('Failed to send analytics:', response.statusText);
      }
    } catch (error) {
      // Silently fail - analytics should not break the app
      console.debug('Analytics error:', error);
    }
  }

  // Batch send analytics (for performance)
  private batchedEvents: AnalyticsEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;

  private batchSendAnalytics(event: AnalyticsEvent) {
    this.batchedEvents.push(event);
    
    // Clear existing timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    
    // Set new timer to send batch after 5 seconds
    this.batchTimer = setTimeout(() => {
      if (this.batchedEvents.length > 0) {
        this.sendBatch();
      }
    }, 5000);
    
    // Send immediately if batch is large
    if (this.batchedEvents.length >= 10) {
      this.sendBatch();
    }
  }

  private async sendBatch() {
    if (this.batchedEvents.length === 0) return;
    
    const eventsToSend = [...this.batchedEvents];
    this.batchedEvents = [];
    
    try {
      await fetch('/api/analytics/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: eventsToSend })
      });
    } catch (error) {
      console.debug('Analytics batch error:', error);
    }
  }
}

// Create singleton instance
export const analytics = new Analytics();

// React hooks for analytics
export function useSearchAnalytics() {
  const trackSearch = (query: string, resultsCount?: number, filters?: Record<string, any>) => {
    analytics.trackSearch({
      query,
      resultsCount,
      filters,
      searchType: window.location.pathname.includes('/blog') ? 'blog' 
        : window.location.pathname.includes('/downloads') ? 'downloads' 
        : 'global'
    });
  };

  return { trackSearch };
}

export function useFilterAnalytics() {
  const trackFilter = (filterType: string, filterValue: any) => {
    analytics.trackFilter({
      filterType,
      filterValue,
      page: window.location.pathname
    });
  };

  return { trackFilter };
}

export function usePaginationAnalytics() {
  const trackPagination = (page: number, itemsPerPage: number, totalItems: number) => {
    analytics.trackPagination(page, itemsPerPage, totalItems);
  };

  return { trackPagination };
}

// Performance monitoring
export function measureSearchPerformance(searchFunction: () => Promise<any>) {
  return async () => {
    const startTime = performance.now();
    
    try {
      const result = await searchFunction();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      analytics.trackSearch({
        query: 'performance_measure',
        resultsCount: result?.total || 0,
        filters: { duration: Math.round(duration) }
      });
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      analytics.trackSearch({
        query: 'performance_error',
        resultsCount: 0,
        filters: { duration: Math.round(duration), error: String(error) }
      });
      
      throw error;
    }
  };
}

// Export analytics functions
export default analytics;