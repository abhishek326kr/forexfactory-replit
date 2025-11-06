import { Request, Response } from 'express';
import { createGzip } from 'zlib';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { storage } from '../storage';
import type { Blog, Signal, Category, Page } from '@shared/schema';

const pipelineAsync = promisify(pipeline);

interface SitemapEntry {
  url: string;
  lastmod?: Date;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  images?: Array<{
    loc: string;
    title?: string;
    caption?: string;
    geo_location?: string;
    license?: string;
  }>;
}

interface SitemapGeneratorOptions {
  baseUrl?: string;
  maxUrlsPerSitemap?: number;
  gzip?: boolean;
  cacheTime?: number;
}

export class SitemapGenerator {
  private baseUrl: string;
  private maxUrlsPerSitemap: number;
  private cache: Map<string, { data: string; timestamp: number }> = new Map();
  private cacheTime: number;
  private indexNowKey: string;

  constructor(options: SitemapGeneratorOptions = {}) {
    this.baseUrl = options.baseUrl || process.env.SITE_URL || 'https://forexfactory.cc';
    this.maxUrlsPerSitemap = options.maxUrlsPerSitemap || 50000;
    this.cacheTime = options.cacheTime || 3600000; // 1 hour default
    this.indexNowKey = this.generateIndexNowKey();
  }

  /**
   * Generate unique IndexNow API key
   */
  private generateIndexNowKey(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Get IndexNow key for verification
   */
  getIndexNowKey(): string {
    return this.indexNowKey;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(str: string): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Format date for sitemap
   */
  private formatDate(date: Date | string | null): string {
    if (!date) return new Date().toISOString();
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString();
  }

  /**
   * Generate XML for a single URL entry
   */
  private generateUrlXml(entry: SitemapEntry): string {
    let xml = '  <url>\n';
    xml += `    <loc>${this.escapeXml(entry.url)}</loc>\n`;
    
    if (entry.lastmod) {
      xml += `    <lastmod>${this.formatDate(entry.lastmod)}</lastmod>\n`;
    }
    
    if (entry.changefreq) {
      xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
    }
    
    if (entry.priority !== undefined) {
      xml += `    <priority>${entry.priority.toFixed(1)}</priority>\n`;
    }
    
    // Add image entries if present
    if (entry.images && entry.images.length > 0) {
      entry.images.forEach(image => {
        xml += '    <image:image>\n';
        xml += `      <image:loc>${this.escapeXml(image.loc)}</image:loc>\n`;
        
        if (image.title) {
          xml += `      <image:title>${this.escapeXml(image.title)}</image:title>\n`;
        }
        
        if (image.caption) {
          xml += `      <image:caption>${this.escapeXml(image.caption)}</image:caption>\n`;
        }
        
        if (image.geo_location) {
          xml += `      <image:geo_location>${this.escapeXml(image.geo_location)}</image:geo_location>\n`;
        }
        
        if (image.license) {
          xml += `      <image:license>${this.escapeXml(image.license)}</image:license>\n`;
        }
        
        xml += '    </image:image>\n';
      });
    }
    
    xml += '  </url>\n';
    return xml;
  }

  /**
   * Generate sitemap header
   */
  private generateSitemapHeader(includeImages: boolean = false): string {
    let header = '<?xml version="1.0" encoding="UTF-8"?>\n';
    header += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';
    
    if (includeImages) {
      header += '\n        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"';
    }
    
    header += '>\n';
    return header;
  }

  /**
   * Generate sitemap footer
   */
  private generateSitemapFooter(): string {
    return '</urlset>';
  }

  /**
   * Check cache for sitemap
   */
  private checkCache(key: string): string | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTime) {
      return cached.data;
    }
    return null;
  }

  /**
   * Store sitemap in cache
   */
  private setCache(key: string, data: string): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Generate main sitemap index
   */
  async generateSitemapIndex(req: Request, res: Response): Promise<void> {
    const cacheKey = 'sitemap-index';
    const cached = this.checkCache(cacheKey);
    
    if (cached) {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(cached);
      return;
    }

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // List of available sitemaps
    const sitemaps = [
      { loc: '/sitemap-posts.xml', name: 'Blog Posts' },
      { loc: '/sitemap-signals.xml', name: 'Trading Signals' },
      { loc: '/sitemap-categories.xml', name: 'Categories' },
      { loc: '/sitemap-pages.xml', name: 'Static Pages' },
      { loc: '/sitemap-images.xml', name: 'Images' }
    ];

    for (const sitemap of sitemaps) {
      xml += '  <sitemap>\n';
      xml += `    <loc>${this.baseUrl}${sitemap.loc}</loc>\n`;
      xml += `    <lastmod>${this.formatDate(new Date())}</lastmod>\n`;
      xml += '  </sitemap>\n';
    }

    xml += '</sitemapindex>';

    this.setCache(cacheKey, xml);
    
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  }

  /**
   * Generate posts/blogs sitemap with pagination support
   */
  async generatePostsSitemap(req: Request, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const cacheKey = `sitemap-posts-${page}`;
    const cached = this.checkCache(cacheKey);
    
    if (cached) {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(cached);
      return;
    }

    try {
      // Fetch blogs with pagination
      const blogs = await storage.getPublishedBlogs({
        page,
        limit: this.maxUrlsPerSitemap,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      let xml = this.generateSitemapHeader(true);

      // Add blog entries
      for (const blog of blogs.data) {
        const entry: SitemapEntry = {
          url: `${this.baseUrl}/blog/${blog.seoSlug}`,
          lastmod: blog.createdAt,
          changefreq: 'weekly',
          priority: 0.8,
          images: []
        };

        // Add featured image if available
        if (blog.featuredImage) {
          entry.images!.push({
            loc: `${this.baseUrl}${blog.featuredImage}`,
            title: blog.title,
            caption: blog.title
          });
        }

        xml += this.generateUrlXml(entry);
      }

      xml += this.generateSitemapFooter();

      this.setCache(cacheKey, xml);
      
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(xml);
    } catch (error) {
      console.error('Error generating posts sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  }

  /**
   * Generate signals/downloads sitemap
   */
  async generateSignalsSitemap(req: Request, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const cacheKey = `sitemap-signals-${page}`;
    const cached = this.checkCache(cacheKey);
    
    if (cached) {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(cached);
      return;
    }

    try {
      // Fetch signals with pagination
      const signals = await storage.getAllSignals({
        page,
        limit: this.maxUrlsPerSitemap,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      let xml = this.generateSitemapHeader(true);

      // Add signal entries
      for (const signal of signals.data) {
        const entry: SitemapEntry = {
          url: `${this.baseUrl}/signals/${signal.uuid}`,
          lastmod: signal.createdAt,
          changefreq: 'weekly',
          priority: 0.7,
          images: []
        };

        // Add screenshots if available
        if (signal.screenshots) {
          try {
            const screenshots = JSON.parse(signal.screenshots);
            if (Array.isArray(screenshots)) {
              screenshots.slice(0, 5).forEach(screenshot => {
                entry.images!.push({
                  loc: `${this.baseUrl}${screenshot}`,
                  title: signal.title,
                  caption: signal.description.substring(0, 200)
                });
              });
            }
          } catch (e) {
            // Invalid JSON, skip
          }
        }

        xml += this.generateUrlXml(entry);
      }

      xml += this.generateSitemapFooter();

      this.setCache(cacheKey, xml);
      
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(xml);
    } catch (error) {
      console.error('Error generating signals sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  }

  /**
   * Generate categories sitemap
   */
  async generateCategoriesSitemap(req: Request, res: Response): Promise<void> {
    const cacheKey = 'sitemap-categories';
    const cached = this.checkCache(cacheKey);
    
    if (cached) {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(cached);
      return;
    }

    try {
      const categories = await storage.getActiveCategories();
      
      let xml = this.generateSitemapHeader();

      // Add category entries
      for (const category of categories) {
        const entry: SitemapEntry = {
          url: `${this.baseUrl}/category/${category.slug || category.name.toLowerCase().replace(/\s+/g, '-')}`,
          lastmod: new Date(),
          changefreq: 'weekly',
          priority: 0.6
        };

        xml += this.generateUrlXml(entry);
      }

      xml += this.generateSitemapFooter();

      this.setCache(cacheKey, xml);
      
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(xml);
    } catch (error) {
      console.error('Error generating categories sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  }

  /**
   * Generate pages sitemap
   */
  async generatePagesSitemap(req: Request, res: Response): Promise<void> {
    const cacheKey = 'sitemap-pages';
    const cached = this.checkCache(cacheKey);
    
    if (cached) {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(cached);
      return;
    }

    let xml = this.generateSitemapHeader();

    // Static pages
    const staticPages: SitemapEntry[] = [
      { url: this.baseUrl, changefreq: 'daily', priority: 1.0 },
      { url: `${this.baseUrl}/blog`, changefreq: 'daily', priority: 0.9 },
      { url: `${this.baseUrl}/signals`, changefreq: 'daily', priority: 0.9 },
      { url: `${this.baseUrl}/downloads`, changefreq: 'daily', priority: 0.9 },
      { url: `${this.baseUrl}/about`, changefreq: 'monthly', priority: 0.5 },
      { url: `${this.baseUrl}/contact`, changefreq: 'monthly', priority: 0.5 },
      { url: `${this.baseUrl}/privacy`, changefreq: 'yearly', priority: 0.3 },
      { url: `${this.baseUrl}/terms`, changefreq: 'yearly', priority: 0.3 }
    ];

    // Add static pages
    for (const page of staticPages) {
      page.lastmod = new Date();
      xml += this.generateUrlXml(page);
    }

    try {
      // Add dynamic pages if any
      const pages = await storage.getAllPages();
      for (const page of pages) {
        const entry: SitemapEntry = {
          url: `${this.baseUrl}/${page.slug}`,
          lastmod: new Date(),
          changefreq: 'monthly',
          priority: 0.5
        };
        xml += this.generateUrlXml(entry);
      }
    } catch (error) {
      console.error('Error fetching dynamic pages:', error);
    }

    xml += this.generateSitemapFooter();

    this.setCache(cacheKey, xml);
    
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  }

  /**
   * Generate images sitemap
   */
  async generateImagesSitemap(req: Request, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const cacheKey = `sitemap-images-${page}`;
    const cached = this.checkCache(cacheKey);
    
    if (cached) {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(cached);
      return;
    }

    try {
      let xml = this.generateSitemapHeader(true);
      
      // Get all content with images
      const blogs = await storage.getPublishedBlogs({
        page,
        limit: Math.floor(this.maxUrlsPerSitemap / 2),
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      // Add blog images
      for (const blog of blogs.data) {
        if (blog.featuredImage) {
          const entry: SitemapEntry = {
            url: `${this.baseUrl}/blog/${blog.seoSlug}`,
            images: [{
              loc: `${this.baseUrl}${blog.featuredImage}`,
              title: blog.title,
              caption: blog.title
            }]
          };
          xml += this.generateUrlXml(entry);
        }
      }

      // Get signals with images
      const signals = await storage.getAllSignals({
        page,
        limit: Math.floor(this.maxUrlsPerSitemap / 2),
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      // Add signal images
      for (const signal of signals.data) {
        if (signal.screenshots) {
          try {
            const screenshots = JSON.parse(signal.screenshots);
            if (Array.isArray(screenshots) && screenshots.length > 0) {
              const entry: SitemapEntry = {
                url: `${this.baseUrl}/signals/${signal.uuid}`,
                images: screenshots.slice(0, 5).map(screenshot => ({
                  loc: `${this.baseUrl}${screenshot}`,
                  title: signal.title,
                  caption: signal.description.substring(0, 200)
                }))
              };
              xml += this.generateUrlXml(entry);
            }
          } catch (e) {
            // Invalid JSON, skip
          }
        }
      }

      xml += this.generateSitemapFooter();

      this.setCache(cacheKey, xml);
      
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');

      // Apply gzip compression if requested
      if (req.headers['accept-encoding']?.includes('gzip')) {
        res.setHeader('Content-Encoding', 'gzip');
        const gzip = createGzip();
        gzip.pipe(res);
        gzip.write(xml);
        gzip.end();
      } else {
        res.send(xml);
      }
    } catch (error) {
      console.error('Error generating images sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  }

  /**
   * Manually regenerate all sitemaps
   */
  async regenerateAllSitemaps(): Promise<void> {
    console.log('Regenerating all sitemaps...');
    this.clearCache();
    console.log('Sitemap cache cleared. New sitemaps will be generated on next request.');
  }
}

// Export singleton instance
export const sitemapGenerator = new SitemapGenerator();