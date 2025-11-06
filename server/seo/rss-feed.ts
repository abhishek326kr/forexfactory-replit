import { Request, Response } from 'express';
import { storage } from '../storage';
import type { Blog, Signal, Category } from '@shared/schema';

interface FeedOptions {
  title: string;
  description: string;
  link: string;
  language?: string;
  copyright?: string;
  managingEditor?: string;
  webMaster?: string;
  ttl?: number;
  limit?: number;
}

export class RSSFeedGenerator {
  private baseUrl: string;
  private siteName: string;
  private siteDescription: string;
  private cache: Map<string, { data: string; timestamp: number }> = new Map();
  private cacheTime: number = 1800000; // 30 minutes

  constructor() {
    this.baseUrl = process.env.SITE_URL || 'https://forexfactory.cc';
    this.siteName = 'ForexFactory.cc';
    this.siteDescription = 'Best Forex Expert Advisors, MT4/MT5 Trading Robots & Automated Trading Systems';
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
   * Strip HTML tags from content
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Truncate text to specified length
   */
  private truncateText(text: string, maxLength: number = 280): string {
    const stripped = this.stripHtml(text);
    if (stripped.length <= maxLength) return stripped;
    return stripped.substring(0, maxLength - 3) + '...';
  }

  /**
   * Format date for RSS
   */
  private formatRssDate(date: Date | string | null): string {
    if (!date) return new Date().toUTCString();
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toUTCString();
  }

  /**
   * Format date for Atom
   */
  private formatAtomDate(date: Date | string | null): string {
    if (!date) return new Date().toISOString();
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString();
  }

  /**
   * Check cache
   */
  private checkCache(key: string): string | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTime) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set cache
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
   * Generate RSS 2.0 feed header
   */
  private generateRssHeader(options: FeedOptions): string {
    let header = '<?xml version="1.0" encoding="UTF-8"?>\n';
    header += '<rss version="2.0"\n';
    header += '  xmlns:content="http://purl.org/rss/1.0/modules/content/"\n';
    header += '  xmlns:dc="http://purl.org/dc/elements/1.1/"\n';
    header += '  xmlns:atom="http://www.w3.org/2005/Atom"\n';
    header += '  xmlns:media="http://search.yahoo.com/mrss/">\n';
    header += '<channel>\n';
    
    // Channel metadata
    header += `  <title>${this.escapeXml(options.title)}</title>\n`;
    header += `  <link>${options.link}</link>\n`;
    header += `  <description>${this.escapeXml(options.description)}</description>\n`;
    header += `  <language>${options.language || 'en-us'}</language>\n`;
    header += `  <copyright>${this.escapeXml(options.copyright || `© ${new Date().getFullYear()} ${this.siteName}`)}</copyright>\n`;
    header += `  <lastBuildDate>${this.formatRssDate(new Date())}</lastBuildDate>\n`;
    header += `  <generator>ForexFactory RSS Generator</generator>\n`;
    
    if (options.managingEditor) {
      header += `  <managingEditor>${this.escapeXml(options.managingEditor)}</managingEditor>\n`;
    }
    
    if (options.webMaster) {
      header += `  <webMaster>${this.escapeXml(options.webMaster)}</webMaster>\n`;
    }
    
    if (options.ttl) {
      header += `  <ttl>${options.ttl}</ttl>\n`;
    }
    
    // Atom self link
    header += `  <atom:link href="${options.link}/rss.xml" rel="self" type="application/rss+xml" />\n`;
    
    // Channel image
    header += '  <image>\n';
    header += `    <url>${this.baseUrl}/logo.png</url>\n`;
    header += `    <title>${this.escapeXml(options.title)}</title>\n`;
    header += `    <link>${options.link}</link>\n`;
    header += '    <width>144</width>\n';
    header += '    <height>144</height>\n';
    header += '  </image>\n';
    
    return header;
  }

  /**
   * Generate RSS 2.0 footer
   */
  private generateRssFooter(): string {
    return '</channel>\n</rss>';
  }

  /**
   * Generate RSS item for blog post
   */
  private generateBlogRssItem(blog: Blog, categoryName?: string): string {
    let item = '  <item>\n';
    
    // Title
    item += `    <title>${this.escapeXml(blog.title)}</title>\n`;
    
    // Link
    const postUrl = `${this.baseUrl}/blog/${blog.seoSlug}`;
    item += `    <link>${postUrl}</link>\n`;
    
    // GUID
    item += `    <guid isPermaLink="true">${postUrl}</guid>\n`;
    
    // Description
    const description = this.truncateText(blog.content, 280);
    item += `    <description>${this.escapeXml(description)}</description>\n`;
    
    // Full content in CDATA
    item += `    <content:encoded><![CDATA[${blog.content}]]></content:encoded>\n`;
    
    // Author/Creator
    item += `    <dc:creator>${this.escapeXml(blog.author)}</dc:creator>\n`;
    item += `    <author>editor@${new URL(this.baseUrl).hostname} (${this.escapeXml(blog.author)})</author>\n`;
    
    // Category
    if (categoryName) {
      item += `    <category>${this.escapeXml(categoryName)}</category>\n`;
    }
    
    // Tags as categories
    if (blog.tags) {
      const tags = blog.tags.split(',').map(t => t.trim());
      tags.slice(0, 5).forEach(tag => {
        item += `    <category>${this.escapeXml(tag)}</category>\n`;
      });
    }
    
    // Publication date
    item += `    <pubDate>${this.formatRssDate(blog.createdAt)}</pubDate>\n`;
    
    // Featured image
    if (blog.featuredImage) {
      item += '    <media:content\n';
      item += `      url="${this.baseUrl}${blog.featuredImage}"\n`;
      item += '      medium="image"\n';
      item += '      type="image/jpeg">\n';
      item += `      <media:title>${this.escapeXml(blog.title)}</media:title>\n`;
      item += `      <media:description>${this.escapeXml(description)}</media:description>\n`;
      item += '    </media:content>\n';
      
      // Enclosure for compatibility
      item += `    <enclosure url="${this.baseUrl}${blog.featuredImage}" type="image/jpeg" length="0" />\n`;
    }
    
    // Comments link
    item += `    <comments>${postUrl}#comments</comments>\n`;
    
    item += '  </item>\n';
    
    return item;
  }

  /**
   * Generate RSS item for signal/EA
   */
  private generateSignalRssItem(signal: Signal, categoryName?: string): string {
    let item = '  <item>\n';
    
    // Title with version
    const title = `${signal.title} v${signal.version || '1.0'} - ${signal.platform} Expert Advisor`;
    item += `    <title>${this.escapeXml(title)}</title>\n`;
    
    // Link
    const signalUrl = `${this.baseUrl}/signals/${signal.uuid}`;
    item += `    <link>${signalUrl}</link>\n`;
    
    // GUID
    item += `    <guid isPermaLink="true">${signalUrl}</guid>\n`;
    
    // Description with performance metrics
    let description = this.truncateText(signal.description, 200);
    if (signal.winRate || signal.profitFactor) {
      description += ' | Performance: ';
      if (signal.winRate) description += `Win Rate: ${signal.winRate}%`;
      if (signal.profitFactor) description += `, Profit Factor: ${signal.profitFactor}`;
    }
    item += `    <description>${this.escapeXml(description)}</description>\n`;
    
    // Full content
    let fullContent = signal.description;
    if (signal.features) {
      try {
        const features = JSON.parse(signal.features);
        if (Array.isArray(features)) {
          fullContent += '\n\nFeatures:\n';
          features.forEach(feature => {
            fullContent += `• ${feature}\n`;
          });
        }
      } catch (e) {
        // Invalid JSON
      }
    }
    if (signal.requirements) {
      fullContent += `\n\nRequirements:\n${signal.requirements}`;
    }
    item += `    <content:encoded><![CDATA[${fullContent}]]></content:encoded>\n`;
    
    // Category
    if (categoryName) {
      item += `    <category>${this.escapeXml(categoryName)}</category>\n`;
    }
    
    // Platform and strategy as categories
    item += `    <category>${this.escapeXml(signal.platform || 'MT4/MT5')}</category>\n`;
    if (signal.strategy) {
      item += `    <category>${this.escapeXml(signal.strategy)}</category>\n`;
    }
    
    // Publication date
    item += `    <pubDate>${this.formatRssDate(signal.createdAt)}</pubDate>\n`;
    
    // Screenshots as media
    if (signal.screenshots) {
      try {
        const screenshots = JSON.parse(signal.screenshots);
        if (Array.isArray(screenshots) && screenshots.length > 0) {
          screenshots.slice(0, 3).forEach((screenshot, index) => {
            item += '    <media:content\n';
            item += `      url="${this.baseUrl}${screenshot}"\n`;
            item += '      medium="image"\n';
            item += '      type="image/jpeg">\n';
            item += `      <media:title>${this.escapeXml(signal.title)} - Screenshot ${index + 1}</media:title>\n`;
            item += '    </media:content>\n';
          });
        }
      } catch (e) {
        // Invalid JSON
      }
    }
    
    // Download link as enclosure
    if (signal.filePath) {
      item += `    <enclosure url="${this.baseUrl}/download/${signal.uuid}" type="application/octet-stream" length="${signal.sizeBytes || 0}" />\n`;
    }
    
    item += '  </item>\n';
    
    return item;
  }

  /**
   * Generate main RSS feed
   */
  async generateMainRssFeed(req: Request, res: Response): Promise<void> {
    const cacheKey = 'rss-main';
    const cached = this.checkCache(cacheKey);
    
    if (cached) {
      res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=1800');
      res.send(cached);
      return;
    }

    try {
      let feed = this.generateRssHeader({
        title: `${this.siteName} - Forex Trading Blog`,
        description: this.siteDescription,
        link: this.baseUrl,
        managingEditor: 'editor@forexfactory.cc (ForexFactory Editor)',
        webMaster: 'webmaster@forexfactory.cc (ForexFactory Webmaster)',
        ttl: 60,
        limit: 50
      });

      // Fetch latest blog posts
      const blogs = await storage.getPublishedBlogs({
        page: 1,
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      // Add blog items
      for (const blog of blogs.data) {
        let categoryName = 'Forex Trading';
        
        // Try to get category name
        if (blog.categoryId) {
          try {
            const category = await storage.getCategoryById(blog.categoryId);
            if (category) {
              categoryName = category.name;
            }
          } catch (e) {
            // Category not found
          }
        }
        
        feed += this.generateBlogRssItem(blog, categoryName);
      }

      feed += this.generateRssFooter();

      this.setCache(cacheKey, feed);
      
      res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=1800');
      res.send(feed);
    } catch (error) {
      console.error('Error generating RSS feed:', error);
      res.status(500).send('Error generating RSS feed');
    }
  }

  /**
   * Generate signals RSS feed
   */
  async generateSignalsRssFeed(req: Request, res: Response): Promise<void> {
    const cacheKey = 'rss-signals';
    const cached = this.checkCache(cacheKey);
    
    if (cached) {
      res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=1800');
      res.send(cached);
      return;
    }

    try {
      let feed = this.generateRssHeader({
        title: `${this.siteName} - Latest Expert Advisors & Trading Robots`,
        description: 'Latest MT4/MT5 Expert Advisors, Forex Robots, and Automated Trading Systems',
        link: `${this.baseUrl}/signals`,
        ttl: 60,
        limit: 30
      });

      // Fetch latest signals
      const signals = await storage.getAllSignals({
        page: 1,
        limit: 30,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      // Add signal items
      for (const signal of signals.data) {
        let categoryName = 'Expert Advisors';
        
        // Try to get category name
        if (signal.categoryId) {
          try {
            const category = await storage.getCategoryById(signal.categoryId);
            if (category) {
              categoryName = category.name;
            }
          } catch (e) {
            // Category not found
          }
        }
        
        feed += this.generateSignalRssItem(signal, categoryName);
      }

      feed += this.generateRssFooter();

      this.setCache(cacheKey, feed);
      
      res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=1800');
      res.send(feed);
    } catch (error) {
      console.error('Error generating signals RSS feed:', error);
      res.status(500).send('Error generating RSS feed');
    }
  }

  /**
   * Generate Atom feed header
   */
  private generateAtomHeader(options: FeedOptions): string {
    let header = '<?xml version="1.0" encoding="UTF-8"?>\n';
    header += '<feed xmlns="http://www.w3.org/2005/Atom">\n';
    
    header += `  <title>${this.escapeXml(options.title)}</title>\n`;
    header += `  <subtitle>${this.escapeXml(options.description)}</subtitle>\n`;
    header += `  <link href="${options.link}/atom.xml" rel="self" type="application/atom+xml" />\n`;
    header += `  <link href="${options.link}" rel="alternate" type="text/html" />\n`;
    header += `  <id>${options.link}/</id>\n`;
    header += `  <updated>${this.formatAtomDate(new Date())}</updated>\n`;
    header += `  <rights>${this.escapeXml(options.copyright || `© ${new Date().getFullYear()} ${this.siteName}`)}</rights>\n`;
    header += '  <author>\n';
    header += `    <name>${this.escapeXml(this.siteName)}</name>\n`;
    header += `    <email>support@${new URL(this.baseUrl).hostname}</email>\n`;
    header += `    <uri>${this.baseUrl}</uri>\n`;
    header += '  </author>\n';
    header += `  <generator>ForexFactory Atom Generator</generator>\n`;
    
    return header;
  }

  /**
   * Generate Atom feed footer
   */
  private generateAtomFooter(): string {
    return '</feed>';
  }

  /**
   * Generate Atom entry for blog post
   */
  private generateBlogAtomEntry(blog: Blog, categoryName?: string): string {
    let entry = '  <entry>\n';
    
    // Title
    entry += `    <title>${this.escapeXml(blog.title)}</title>\n`;
    
    // Link
    const postUrl = `${this.baseUrl}/blog/${blog.seoSlug}`;
    entry += `    <link href="${postUrl}" rel="alternate" type="text/html" />\n`;
    
    // ID
    entry += `    <id>${postUrl}</id>\n`;
    
    // Dates
    entry += `    <updated>${this.formatAtomDate(blog.createdAt)}</updated>\n`;
    entry += `    <published>${this.formatAtomDate(blog.createdAt)}</published>\n`;
    
    // Author
    entry += '    <author>\n';
    entry += `      <name>${this.escapeXml(blog.author)}</name>\n`;
    entry += '    </author>\n';
    
    // Summary
    const summary = this.truncateText(blog.content, 280);
    entry += `    <summary type="text">${this.escapeXml(summary)}</summary>\n`;
    
    // Content
    entry += `    <content type="html"><![CDATA[${blog.content}]]></content>\n`;
    
    // Category
    if (categoryName) {
      entry += `    <category term="${this.escapeXml(categoryName)}" />\n`;
    }
    
    // Tags
    if (blog.tags) {
      const tags = blog.tags.split(',').map(t => t.trim());
      tags.slice(0, 5).forEach(tag => {
        entry += `    <category term="${this.escapeXml(tag)}" />\n`;
      });
    }
    
    entry += '  </entry>\n';
    
    return entry;
  }

  /**
   * Generate Atom feed
   */
  async generateAtomFeed(req: Request, res: Response): Promise<void> {
    const cacheKey = 'atom-main';
    const cached = this.checkCache(cacheKey);
    
    if (cached) {
      res.setHeader('Content-Type', 'application/atom+xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=1800');
      res.send(cached);
      return;
    }

    try {
      let feed = this.generateAtomHeader({
        title: this.siteName,
        description: this.siteDescription,
        link: this.baseUrl,
        limit: 30
      });

      // Fetch latest blog posts
      const blogs = await storage.getPublishedBlogs({
        page: 1,
        limit: 30,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      // Add blog entries
      for (const blog of blogs.data) {
        let categoryName = 'Forex Trading';
        
        // Try to get category name
        if (blog.categoryId) {
          try {
            const category = await storage.getCategoryById(blog.categoryId);
            if (category) {
              categoryName = category.name;
            }
          } catch (e) {
            // Category not found
          }
        }
        
        feed += this.generateBlogAtomEntry(blog, categoryName);
      }

      feed += this.generateAtomFooter();

      this.setCache(cacheKey, feed);
      
      res.setHeader('Content-Type', 'application/atom+xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=1800');
      res.send(feed);
    } catch (error) {
      console.error('Error generating Atom feed:', error);
      res.status(500).send('Error generating Atom feed');
    }
  }

  /**
   * Update feeds when content changes
   */
  async updateFeeds(): Promise<void> {
    console.log('Clearing feed cache for regeneration...');
    this.clearCache();
  }
}

// Export singleton instance
export const rssFeedGenerator = new RSSFeedGenerator();