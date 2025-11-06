import fetch from 'node-fetch';
import crypto from 'crypto';
import { storage } from '../storage';
import type { Blog, Signal } from '@shared/schema';

interface IndexingResult {
  url: string;
  success: boolean;
  engine: string;
  message?: string;
  timestamp: Date;
}

interface BatchIndexingResult {
  totalUrls: number;
  successful: number;
  failed: number;
  results: IndexingResult[];
}

interface IndexNowPayload {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}

export class IndexingService {
  private baseUrl: string;
  private indexNowKey: string;
  private dailySubmissionCount: Map<string, number> = new Map();
  private submissionHistory: IndexingResult[] = [];
  private maxHistorySize: number = 1000;
  private maxDailySubmissions: number = 10000;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000; // 1 second

  constructor() {
    this.baseUrl = process.env.SITE_URL || 'https://forexfactory.cc';
    this.indexNowKey = this.generateIndexNowKey();
    this.resetDailyCount();
  }

  /**
   * Generate unique IndexNow API key
   */
  private generateIndexNowKey(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Get IndexNow key for verification
   */
  getIndexNowKey(): string {
    return this.indexNowKey;
  }

  /**
   * Reset daily submission count (should be called daily)
   */
  private resetDailyCount(): void {
    const now = new Date();
    const dateKey = this.getDateKey(now);
    
    // Clear old date entries
    for (const [key] of this.dailySubmissionCount) {
      if (key !== dateKey) {
        this.dailySubmissionCount.delete(key);
      }
    }
    
    // Set timer for next reset
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilTomorrow = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => this.resetDailyCount(), msUntilTomorrow);
  }

  /**
   * Get date key for tracking daily submissions
   */
  private getDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Check if daily limit reached
   */
  private isDailyLimitReached(): boolean {
    const dateKey = this.getDateKey(new Date());
    const count = this.dailySubmissionCount.get(dateKey) || 0;
    return count >= this.maxDailySubmissions;
  }

  /**
   * Increment daily submission count
   */
  private incrementDailyCount(count: number = 1): void {
    const dateKey = this.getDateKey(new Date());
    const current = this.dailySubmissionCount.get(dateKey) || 0;
    this.dailySubmissionCount.set(dateKey, current + count);
  }

  /**
   * Log indexing result
   */
  private logResult(result: IndexingResult): void {
    this.submissionHistory.push(result);
    
    // Keep only the latest entries
    if (this.submissionHistory.length > this.maxHistorySize) {
      this.submissionHistory = this.submissionHistory.slice(-this.maxHistorySize);
    }
    
    console.log(`[IndexNow] ${result.engine}: ${result.url} - ${result.success ? 'SUCCESS' : 'FAILED'} ${result.message || ''}`);
  }

  /**
   * Submit URLs to IndexNow protocol (Bing, Yandex)
   */
  async submitToIndexNow(urls: string | string[]): Promise<IndexingResult[]> {
    const urlList = Array.isArray(urls) ? urls : [urls];
    const results: IndexingResult[] = [];

    // Check daily limit
    if (this.isDailyLimitReached()) {
      return urlList.map(url => ({
        url,
        success: false,
        engine: 'indexnow',
        message: 'Daily submission limit reached (10,000 URLs)',
        timestamp: new Date()
      }));
    }

    // Check remaining quota
    const dateKey = this.getDateKey(new Date());
    const currentCount = this.dailySubmissionCount.get(dateKey) || 0;
    const remainingQuota = this.maxDailySubmissions - currentCount;
    
    if (urlList.length > remainingQuota) {
      console.warn(`[IndexNow] Truncating URL list from ${urlList.length} to ${remainingQuota} due to daily limit`);
      urlList.splice(remainingQuota);
    }

    const hostname = new URL(this.baseUrl).hostname;
    const keyLocation = `${this.baseUrl}/indexnow-key.txt`;

    const payload: IndexNowPayload = {
      host: hostname,
      key: this.indexNowKey,
      keyLocation,
      urlList
    };

    // List of IndexNow endpoints to submit to
    const endpoints = [
      'https://api.indexnow.org/indexnow',
      'https://www.bing.com/indexnow',
      'https://yandex.com/indexnow'
    ];

    for (const endpoint of endpoints) {
      let attempt = 0;
      let success = false;
      let lastError = '';

      while (attempt < this.retryAttempts && !success) {
        attempt++;
        
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'ForexFactory SEO Bot/1.0'
            },
            body: JSON.stringify(payload),
            timeout: 10000 // 10 seconds timeout
          });

          // IndexNow returns 200 or 202 for success
          success = response.status === 200 || response.status === 202;

          if (!success) {
            lastError = `HTTP ${response.status}: ${response.statusText}`;
            
            // Don't retry on client errors (4xx)
            if (response.status >= 400 && response.status < 500) {
              break;
            }
            
            // Wait before retry
            if (attempt < this.retryAttempts) {
              await this.delay(this.retryDelay * attempt);
            }
          }
        } catch (error: any) {
          lastError = error.message;
          
          // Wait before retry
          if (attempt < this.retryAttempts) {
            await this.delay(this.retryDelay * attempt);
          }
        }
      }

      const engineName = endpoint.includes('bing') ? 'Bing' : 
                        endpoint.includes('yandex') ? 'Yandex' : 'IndexNow';

      // Log results for each URL
      for (const url of urlList) {
        const result: IndexingResult = {
          url,
          success,
          engine: engineName,
          message: success ? 
            `Successfully submitted to ${engineName}` : 
            `Failed after ${attempt} attempts: ${lastError}`,
          timestamp: new Date()
        };
        
        results.push(result);
        this.logResult(result);
      }
    }

    // Update daily count
    this.incrementDailyCount(urlList.length * endpoints.length);

    return results;
  }

  /**
   * Submit URL to Google Indexing API (requires service account)
   */
  async submitToGoogle(url: string, updateType: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED'): Promise<IndexingResult> {
    const result: IndexingResult = {
      url,
      success: false,
      engine: 'Google',
      timestamp: new Date()
    };

    // Check if Google service account credentials are configured
    if (!process.env.GOOGLE_INDEXING_API_KEY) {
      result.message = 'Google Indexing API credentials not configured';
      this.logResult(result);
      return result;
    }

    try {
      const response = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GOOGLE_INDEXING_API_KEY}`
        },
        body: JSON.stringify({
          url,
          type: updateType
        })
      });

      if (response.ok) {
        result.success = true;
        result.message = `Successfully submitted to Google (${updateType})`;
      } else {
        const errorData = await response.text();
        result.message = `Google API error: ${errorData}`;
      }
    } catch (error: any) {
      result.message = `Google submission failed: ${error.message}`;
    }

    this.logResult(result);
    this.incrementDailyCount(1);
    
    return result;
  }

  /**
   * Batch submit URLs
   */
  async batchSubmit(urls: string[]): Promise<BatchIndexingResult> {
    const results: IndexingResult[] = [];
    
    // Submit to IndexNow in batches of 100
    const batchSize = 100;
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchResults = await this.submitToIndexNow(batch);
      results.push(...batchResults);
      
      // Small delay between batches
      if (i + batchSize < urls.length) {
        await this.delay(500);
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      totalUrls: urls.length,
      successful,
      failed,
      results
    };
  }

  /**
   * Submit new blog post for indexing
   */
  async submitBlogPost(blog: Blog): Promise<IndexingResult[]> {
    const url = `${this.baseUrl}/blog/${blog.seoSlug}`;
    return this.submitToIndexNow(url);
  }

  /**
   * Submit new signal for indexing
   */
  async submitSignal(signal: Signal): Promise<IndexingResult[]> {
    const url = `${this.baseUrl}/signals/${signal.uuid}`;
    return this.submitToIndexNow(url);
  }

  /**
   * Submit updated content for reindexing
   */
  async submitUpdate(type: 'blog' | 'signal', id: number | string): Promise<IndexingResult[]> {
    let url = '';
    
    try {
      if (type === 'blog') {
        const blog = await storage.getBlogById(id as number);
        if (blog) {
          url = `${this.baseUrl}/blog/${blog.seoSlug}`;
        }
      } else if (type === 'signal') {
        const signal = await storage.getSignalByUuid(id as string);
        if (signal) {
          url = `${this.baseUrl}/signals/${signal.uuid}`;
        }
      }
      
      if (url) {
        return this.submitToIndexNow(url);
      }
    } catch (error) {
      console.error(`Error submitting ${type} for indexing:`, error);
    }

    return [{
      url: url || 'unknown',
      success: false,
      engine: 'indexnow',
      message: `Failed to find ${type} with id ${id}`,
      timestamp: new Date()
    }];
  }

  /**
   * Submit deletion notification
   */
  async submitDeletion(url: string): Promise<IndexingResult> {
    // IndexNow doesn't support deletion notifications directly
    // But we can notify Google if configured
    if (process.env.GOOGLE_INDEXING_API_KEY) {
      return this.submitToGoogle(url, 'URL_DELETED');
    }
    
    return {
      url,
      success: false,
      engine: 'indexnow',
      message: 'Deletion notifications not supported by IndexNow',
      timestamp: new Date()
    };
  }

  /**
   * Get submission history
   */
  getHistory(limit: number = 100): IndexingResult[] {
    return this.submissionHistory.slice(-limit);
  }

  /**
   * Get submission statistics
   */
  getStatistics(): {
    total: number;
    successful: number;
    failed: number;
    todayCount: number;
    remainingQuota: number;
    engines: Record<string, number>;
  } {
    const dateKey = this.getDateKey(new Date());
    const todayCount = this.dailySubmissionCount.get(dateKey) || 0;
    const remainingQuota = Math.max(0, this.maxDailySubmissions - todayCount);
    
    const total = this.submissionHistory.length;
    const successful = this.submissionHistory.filter(r => r.success).length;
    const failed = total - successful;
    
    const engines: Record<string, number> = {};
    this.submissionHistory.forEach(result => {
      engines[result.engine] = (engines[result.engine] || 0) + 1;
    });
    
    return {
      total,
      successful,
      failed,
      todayCount,
      remainingQuota,
      engines
    };
  }

  /**
   * Submit all published content for indexing
   */
  async submitAllContent(): Promise<BatchIndexingResult> {
    const urls: string[] = [];
    
    try {
      // Get all published blogs
      const blogs = await storage.getPublishedBlogs({
        page: 1,
        limit: 1000,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      blogs.data.forEach(blog => {
        urls.push(`${this.baseUrl}/blog/${blog.seoSlug}`);
      });
      
      // Get all signals
      const signals = await storage.getAllSignals({
        page: 1,
        limit: 1000,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      signals.data.forEach(signal => {
        urls.push(`${this.baseUrl}/signals/${signal.uuid}`);
      });
      
      // Get categories
      const categories = await storage.getActiveCategories();
      categories.forEach(category => {
        const slug = category.slug || category.name.toLowerCase().replace(/\s+/g, '-');
        urls.push(`${this.baseUrl}/category/${slug}`);
      });
      
      // Add static pages
      const staticPages = ['', '/blog', '/signals', '/about', '/contact'];
      staticPages.forEach(page => {
        urls.push(`${this.baseUrl}${page}`);
      });
      
    } catch (error) {
      console.error('Error fetching content for indexing:', error);
    }
    
    return this.batchSubmit(urls);
  }

  /**
   * Helper function to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const indexingService = new IndexingService();