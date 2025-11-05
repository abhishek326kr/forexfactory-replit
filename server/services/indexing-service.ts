import { google } from 'googleapis';
import fetch from 'node-fetch';
import { prisma } from '../db';
import type { Blog, Signal } from '@shared/schema';

interface IndexingStatus {
  url: string;
  success: boolean;
  engine: 'google' | 'bing' | 'yandex' | 'yahoo';
  message?: string;
  submittedAt: Date;
  responseData?: any;
}

interface IndexingOptions {
  priority?: 'high' | 'normal' | 'low';
  updateType?: 'URL_UPDATED' | 'URL_DELETED';
  engines?: Array<'google' | 'bing' | 'yandex' | 'yahoo'>;
}

interface BatchIndexingResult {
  totalUrls: number;
  successful: number;
  failed: number;
  results: IndexingStatus[];
}

class IndexingService {
  private googleAuth: any;
  private googleIndexingApi: any;
  private bingApiKey: string;
  private yandexUserId: string;
  private yandexHostId: string;
  
  constructor() {
    // Initialize Google authentication if credentials are available
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      try {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        this.googleAuth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/indexing']
        });
        this.googleIndexingApi = google.indexing({ version: 'v3', auth: this.googleAuth });
      } catch (error) {
        console.error('Failed to initialize Google Indexing API:', error);
      }
    }
    
    // Initialize Bing IndexNow API key
    this.bingApiKey = process.env.BING_INDEXNOW_KEY || '';
    
    // Initialize Yandex Webmaster credentials
    this.yandexUserId = process.env.YANDEX_USER_ID || '';
    this.yandexHostId = process.env.YANDEX_HOST_ID || '';
  }

  /**
   * Submit a URL to Google Indexing API
   */
  async submitToGoogle(
    url: string, 
    updateType: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED'
  ): Promise<IndexingStatus> {
    const status: IndexingStatus = {
      url,
      success: false,
      engine: 'google',
      submittedAt: new Date()
    };

    if (!this.googleIndexingApi) {
      status.message = 'Google Indexing API not configured';
      return status;
    }

    try {
      const response = await this.googleIndexingApi.urlNotifications.publish({
        requestBody: {
          url,
          type: updateType
        }
      });

      status.success = true;
      status.message = `Successfully submitted to Google (${updateType})`;
      status.responseData = response.data;

      // Log to database
      await this.logIndexingStatus(status);

      return status;
    } catch (error: any) {
      status.message = `Google indexing failed: ${error.message}`;
      await this.logIndexingStatus(status);
      return status;
    }
  }

  /**
   * Submit URLs to Bing IndexNow API
   */
  async submitToBing(urls: string | string[]): Promise<IndexingStatus[]> {
    const urlList = Array.isArray(urls) ? urls : [urls];
    const results: IndexingStatus[] = [];

    if (!this.bingApiKey) {
      return urlList.map(url => ({
        url,
        success: false,
        engine: 'bing' as const,
        message: 'Bing IndexNow API key not configured',
        submittedAt: new Date()
      }));
    }

    try {
      const hostname = new URL(urlList[0]).hostname;
      const keyLocation = `https://${hostname}/${this.bingApiKey}.txt`;

      const response = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          host: hostname,
          key: this.bingApiKey,
          keyLocation,
          urlList
        })
      });

      const success = response.status === 200 || response.status === 202;

      for (const url of urlList) {
        const status: IndexingStatus = {
          url,
          success,
          engine: 'bing',
          message: success ? 
            'Successfully submitted to Bing IndexNow' : 
            `Bing submission failed with status ${response.status}`,
          submittedAt: new Date(),
          responseData: {
            status: response.status,
            statusText: response.statusText
          }
        };

        results.push(status);
        await this.logIndexingStatus(status);
      }

      return results;
    } catch (error: any) {
      return urlList.map(url => {
        const status: IndexingStatus = {
          url,
          success: false,
          engine: 'bing',
          message: `Bing IndexNow submission failed: ${error.message}`,
          submittedAt: new Date()
        };
        this.logIndexingStatus(status);
        return status;
      });
    }
  }

  /**
   * Submit URL to Yandex Webmaster
   */
  async submitToYandex(url: string): Promise<IndexingStatus> {
    const status: IndexingStatus = {
      url,
      success: false,
      engine: 'yandex' as const,
      submittedAt: new Date()
    };

    if (!this.yandexUserId || !this.yandexHostId) {
      status.message = 'Yandex Webmaster credentials not configured';
      return status;
    }

    try {
      const response = await fetch(
        `https://api.webmaster.yandex.net/v4/user/${this.yandexUserId}/hosts/${this.yandexHostId}/recrawl/queue`,
        {
          method: 'POST',
          headers: {
            'Authorization': `OAuth ${process.env.YANDEX_OAUTH_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ url })
        }
      );

      if (response.ok) {
        status.success = true;
        status.message = 'Successfully submitted to Yandex';
        status.responseData = await response.json();
      } else {
        status.message = `Yandex submission failed with status ${response.status}`;
      }

      await this.logIndexingStatus(status);
      return status;
    } catch (error: any) {
      status.message = `Yandex submission failed: ${error.message}`;
      await this.logIndexingStatus(status);
      return status;
    }
  }

  /**
   * Submit URL to Yahoo (via Bing IndexNow since Yahoo uses Bing)
   */
  async submitToYahoo(url: string): Promise<IndexingStatus> {
    // Yahoo now uses Bing's index, so we submit to Bing
    const bingResult = await this.submitToBing(url);
    const status = bingResult[0];
    
    return {
      ...status,
      engine: 'yahoo' as const,
      message: status.message?.replace('Bing', 'Yahoo (via Bing)')
    };
  }

  /**
   * Submit a single URL to multiple search engines
   */
  async submitUrl(
    url: string, 
    options: IndexingOptions = {}
  ): Promise<IndexingStatus[]> {
    const engines = options.engines || ['google', 'bing', 'yahoo'];
    const results: IndexingStatus[] = [];

    // Submit to each engine in parallel
    const promises = engines.map(engine => {
      switch (engine) {
        case 'google':
          return this.submitToGoogle(url, options.updateType);
        case 'bing':
          return this.submitToBing(url);
        case 'yandex':
          return this.submitToYandex(url);
        case 'yahoo':
          return this.submitToYahoo(url);
        default:
          return Promise.resolve({
            url,
            success: false,
            engine: engine as any,
            message: `Unknown engine: ${engine}`,
            submittedAt: new Date()
          });
      }
    });

    const engineResults = await Promise.all(promises);
    
    // Flatten results (Bing returns an array)
    for (const result of engineResults) {
      if (Array.isArray(result)) {
        results.push(...result);
      } else {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Batch submit multiple URLs
   */
  async batchSubmit(
    urls: string[], 
    options: IndexingOptions = {}
  ): Promise<BatchIndexingResult> {
    const engines = options.engines || ['google', 'bing'];
    const allResults: IndexingStatus[] = [];

    // Bing IndexNow supports batch submission
    if (engines.includes('bing')) {
      const bingResults = await this.submitToBing(urls);
      allResults.push(...bingResults);
    }

    // Google requires individual submissions
    if (engines.includes('google')) {
      const googlePromises = urls.map(url => 
        this.submitToGoogle(url, options.updateType)
      );
      const googleResults = await Promise.all(googlePromises);
      allResults.push(...googleResults);
    }

    // Calculate summary
    const successful = allResults.filter(r => r.success).length;
    const failed = allResults.filter(r => !r.success).length;

    return {
      totalUrls: urls.length * engines.length,
      successful,
      failed,
      results: allResults
    };
  }

  /**
   * Submit all published blog posts
   */
  async submitAllBlogs(options: IndexingOptions = {}): Promise<BatchIndexingResult> {
    const blogs = await prisma.blog.findMany({
      where: { status: 'published' as any },
      select: { seoSlug: true }
    });

    const baseUrl = process.env.SITE_URL || 'https://forexeahub.com';
    const urls = blogs.map(blog => `${baseUrl}/blog/${blog.seoSlug}`);

    return this.batchSubmit(urls, options);
  }

  /**
   * Submit all active signals/downloads
   */
  async submitAllSignals(options: IndexingOptions = {}): Promise<BatchIndexingResult> {
    const signals = await prisma.signal.findMany({
      where: {},  // Remove status filter as it doesn't exist in schema
      select: { uuid: true }
    });

    const baseUrl = process.env.SITE_URL || 'https://forexeahub.com';
    const urls = signals.map(signal => `${baseUrl}/download/${signal.uuid}`);

    return this.batchSubmit(urls, options);
  }

  /**
   * Submit sitemap to search engines
   */
  async submitSitemap(sitemapUrl?: string): Promise<IndexingStatus[]> {
    const baseUrl = process.env.SITE_URL || 'https://forexeahub.com';
    const sitemap = sitemapUrl || `${baseUrl}/sitemap.xml`;
    const results: IndexingStatus[] = [];

    // Submit to Google Search Console
    if (this.googleAuth) {
      try {
        const searchConsole = google.searchconsole({ 
          version: 'v1', 
          auth: this.googleAuth 
        });
        
        await searchConsole.sitemaps.submit({
          siteUrl: baseUrl,
          feedpath: sitemap
        });

        results.push({
          url: sitemap,
          success: true,
          engine: 'google',
          message: 'Sitemap submitted to Google Search Console',
          submittedAt: new Date()
        });
      } catch (error: any) {
        results.push({
          url: sitemap,
          success: false,
          engine: 'google',
          message: `Google sitemap submission failed: ${error.message}`,
          submittedAt: new Date()
        });
      }
    }

    // Submit to Bing Webmaster Tools
    const bingSubmitUrl = `https://www.bing.com/webmaster/ping.aspx?siteMap=${encodeURIComponent(sitemap)}`;
    try {
      const response = await fetch(bingSubmitUrl);
      results.push({
        url: sitemap,
        success: response.ok,
        engine: 'bing',
        message: response.ok ? 
          'Sitemap submitted to Bing Webmaster' : 
          `Bing sitemap submission failed with status ${response.status}`,
        submittedAt: new Date()
      });
    } catch (error: any) {
      results.push({
        url: sitemap,
        success: false,
        engine: 'bing',
        message: `Bing sitemap submission failed: ${error.message}`,
        submittedAt: new Date()
      });
    }

    return results;
  }

  /**
   * Log indexing status to in-memory storage
   */
  private indexingHistory: IndexingStatus[] = [];
  private maxHistorySize = 1000;
  
  private async logIndexingStatus(status: IndexingStatus): Promise<void> {
    try {
      // Store in memory instead of database
      this.indexingHistory.push(status);
      
      // Keep only the last N entries
      if (this.indexingHistory.length > this.maxHistorySize) {
        this.indexingHistory = this.indexingHistory.slice(-this.maxHistorySize);
      }
      
      // Log to console for debugging
      console.log(`Indexing ${status.engine}: ${status.url} - ${status.success ? 'Success' : 'Failed'}`);
    } catch (error) {
      console.error('Failed to log indexing status:', error);
    }
  }

  /**
   * Get indexing history for a URL
   */
  async getIndexingHistory(
    url?: string, 
    engine?: string
  ): Promise<IndexingStatus[]> {
    let history = [...this.indexingHistory];
    
    if (url) {
      history = history.filter(h => h.url === url);
    }
    
    if (engine) {
      history = history.filter(h => h.engine === engine);
    }
    
    // Sort by date descending and limit to 100
    return history
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
      .slice(0, 100);
  }

  /**
   * Get indexing statistics
   */
  async getIndexingStats(): Promise<any> {
    const history = this.indexingHistory;
    const total = history.length;
    const successful = history.filter(h => h.success).length;
    
    // Group by engine
    const byEngine: Record<string, number> = {};
    history.forEach(h => {
      byEngine[h.engine] = (byEngine[h.engine] || 0) + 1;
    });
    
    // Get recent submissions
    const recentSubmissions = history
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
      .slice(0, 10);
    
    return {
      total,
      successful,
      failed: total - successful,
      successRate: total > 0 ? (successful / total * 100).toFixed(2) : 0,
      byEngine,
      recentSubmissions
    };
  }
}

// Export singleton instance
export const indexingService = new IndexingService();