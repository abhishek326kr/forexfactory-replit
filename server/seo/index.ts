/**
 * Main SEO Service
 * Coordinates all SEO modules and provides a unified interface
 */

import { Request, Response } from 'express';
import { sitemapGenerator } from './sitemap-generator';
import { indexingService } from './indexing-service';
import { structuredDataGenerator } from './structured-data';
import { metaTagsGenerator } from './meta-tags';
import { rssFeedGenerator } from './rss-feed';
import type { Blog, Signal, Category } from '@shared/schema';

export class SEOService {
  /**
   * Initialize SEO service
   */
  constructor() {
    console.log('🚀 SEO Service initialized');
  }

  /**
   * Handle content creation - trigger all SEO updates
   */
  async onContentCreated(type: 'blog' | 'signal', data: Blog | Signal): Promise<void> {
    console.log(`[SEO] Processing new ${type} content: ${type === 'blog' ? (data as Blog).title : (data as Signal).title}`);
    
    try {
      // Clear sitemap cache to regenerate on next request
      sitemapGenerator.clearCache();
      
      // Clear RSS feed cache
      rssFeedGenerator.clearCache();
      
      // Submit to search engines for indexing
      if (type === 'blog') {
        await indexingService.submitBlogPost(data as Blog);
      } else {
        await indexingService.submitSignal(data as Signal);
      }
      
      console.log(`[SEO] Successfully processed ${type} content`);
    } catch (error) {
      console.error(`[SEO] Error processing ${type} content:`, error);
    }
  }

  /**
   * Handle content update - trigger SEO updates
   */
  async onContentUpdated(type: 'blog' | 'signal', data: Blog | Signal): Promise<void> {
    console.log(`[SEO] Processing updated ${type} content`);
    
    try {
      // Clear caches
      sitemapGenerator.clearCache();
      rssFeedGenerator.clearCache();
      
      // Submit update to search engines
      const id = type === 'blog' ? (data as Blog).id : (data as Signal).uuid;
      await indexingService.submitUpdate(type, id);
      
      console.log(`[SEO] Successfully processed ${type} update`);
    } catch (error) {
      console.error(`[SEO] Error processing ${type} update:`, error);
    }
  }

  /**
   * Handle content deletion
   */
  async onContentDeleted(type: 'blog' | 'signal', url: string): Promise<void> {
    console.log(`[SEO] Processing deleted ${type} content: ${url}`);
    
    try {
      // Clear caches
      sitemapGenerator.clearCache();
      rssFeedGenerator.clearCache();
      
      // Notify search engines of deletion
      await indexingService.submitDeletion(url);
      
      console.log(`[SEO] Successfully processed ${type} deletion`);
    } catch (error) {
      console.error(`[SEO] Error processing ${type} deletion:`, error);
    }
  }

  /**
   * Generate complete SEO meta tags for a blog post
   */
  generateBlogSEO(blog: Blog, categoryName?: string): {
    metaTags: string;
    structuredData: string;
  } {
    const metaTags = metaTagsGenerator.generateBlogMetaTags(blog, categoryName);
    const structuredData = structuredDataGenerator.generateScriptTag(
      structuredDataGenerator.generateBlogPostingSchema(blog, blog.author, categoryName)
    );
    
    return { metaTags, structuredData };
  }

  /**
   * Generate complete SEO meta tags for a signal/EA
   */
  generateSignalSEO(signal: Signal): {
    metaTags: string;
    structuredData: string;
  } {
    const metaTags = metaTagsGenerator.generateSignalMetaTags(signal);
    const structuredData = structuredDataGenerator.generateMultipleSchemas([
      structuredDataGenerator.generateSoftwareApplicationSchema(signal),
      structuredDataGenerator.generateProductSchema(signal)
    ]);
    
    return { metaTags, structuredData };
  }

  /**
   * Generate complete SEO meta tags for homepage
   */
  generateHomeSEO(): {
    metaTags: string;
    structuredData: string;
  } {
    const metaTags = metaTagsGenerator.generateHomePageMetaTags();
    const structuredData = structuredDataGenerator.generateHomePageSchemas();
    
    return { metaTags, structuredData };
  }

  /**
   * Generate complete SEO meta tags for category page
   */
  generateCategorySEO(category: Category, postCount?: number): {
    metaTags: string;
    structuredData: string;
  } {
    const metaTags = metaTagsGenerator.generateCategoryMetaTags(category, postCount);
    
    const slug = category.slug || category.name.toLowerCase().replace(/\s+/g, '-');
    const structuredData = structuredDataGenerator.generateScriptTag(
      structuredDataGenerator.generateWebPageSchema(
        `${category.name} - Forex Trading Resources`,
        category.description || `Browse ${category.name} articles and resources`,
        `https://forexfactory.cc/category/${slug}`
      )
    );
    
    return { metaTags, structuredData };
  }

  /**
   * Manually trigger full SEO regeneration
   */
  async regenerateAllSEO(): Promise<void> {
    console.log('[SEO] Starting full SEO regeneration...');
    
    try {
      // Regenerate sitemaps
      await sitemapGenerator.regenerateAllSitemaps();
      
      // Clear RSS feed cache
      rssFeedGenerator.clearCache();
      
      // Submit all content to search engines
      const result = await indexingService.submitAllContent();
      
      console.log(`[SEO] Full regeneration complete. Submitted ${result.totalUrls} URLs (${result.successful} successful, ${result.failed} failed)`);
    } catch (error) {
      console.error('[SEO] Error during full regeneration:', error);
      throw error;
    }
  }

  /**
   * Get SEO statistics and health status
   */
  async getSEOStatus(): Promise<{
    indexing: any;
    sitemaps: {
      cacheStatus: string;
    };
    feeds: {
      cacheStatus: string;
    };
  }> {
    const indexingStats = indexingService.getStatistics();
    
    return {
      indexing: indexingStats,
      sitemaps: {
        cacheStatus: 'Active'
      },
      feeds: {
        cacheStatus: 'Active'
      }
    };
  }

  /**
   * Serve IndexNow key for verification
   */
  serveIndexNowKey(req: Request, res: Response): void {
    const key = sitemapGenerator.getIndexNowKey();
    res.setHeader('Content-Type', 'text/plain');
    res.send(key);
  }

  // Export route handlers
  handlers = {
    // Sitemap handlers
    sitemapIndex: (req: Request, res: Response) => sitemapGenerator.generateSitemapIndex(req, res),
    sitemapPosts: (req: Request, res: Response) => sitemapGenerator.generatePostsSitemap(req, res),
    sitemapSignals: (req: Request, res: Response) => sitemapGenerator.generateSignalsSitemap(req, res),
    sitemapCategories: (req: Request, res: Response) => sitemapGenerator.generateCategoriesSitemap(req, res),
    sitemapPages: (req: Request, res: Response) => sitemapGenerator.generatePagesSitemap(req, res),
    sitemapImages: (req: Request, res: Response) => sitemapGenerator.generateImagesSitemap(req, res),
    
    // RSS feed handlers
    rssFeed: (req: Request, res: Response) => rssFeedGenerator.generateMainRssFeed(req, res),
    signalsRssFeed: (req: Request, res: Response) => rssFeedGenerator.generateSignalsRssFeed(req, res),
    atomFeed: (req: Request, res: Response) => rssFeedGenerator.generateAtomFeed(req, res),
    
    // IndexNow key
    indexNowKey: (req: Request, res: Response) => this.serveIndexNowKey(req, res),
    
    // Admin endpoints
    regenerateSEO: async (req: Request, res: Response) => {
      try {
        await this.regenerateAllSEO();
        res.json({ success: true, message: 'SEO regeneration complete' });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    },
    
    seoStatus: async (req: Request, res: Response) => {
      try {
        const status = await this.getSEOStatus();
        res.json(status);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    }
  };
}

// Export singleton instance
export const seoService = new SEOService();

// Export individual modules for direct access if needed
export {
  sitemapGenerator,
  indexingService,
  structuredDataGenerator,
  metaTagsGenerator,
  rssFeedGenerator
};