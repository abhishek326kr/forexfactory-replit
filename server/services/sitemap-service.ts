import { SitemapStream, streamToPromise, SitemapIndexStream, EnumChangefreq } from 'sitemap';
import { createWriteStream, createReadStream } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';
import type { Blog, Signal, Category } from '@shared/schema';
import { prisma } from '../db';
import { prismaStorage } from '../prisma-storage';

interface SitemapEntry {
  url: string;
  changefreq?: EnumChangefreq;
  priority?: number;
  lastmod?: Date;
  img?: Array<{
    url: string;
    caption?: string;
    title?: string;
    geoLocation?: string;
    license?: string;
  }>;
  news?: {
    publication: {
      name: string;
      language: string;
    };
    publicationDate: Date;
    title: string;
    keywords?: string;
  };
}

interface SitemapOptions {
  hostname?: string;
  cacheTime?: number;
  includeImages?: boolean;
  includeNews?: boolean;
}

class SitemapService {
  private hostname: string;
  private sitemapDir: string;
  private cacheTime: number;
  private lastGenerated: Map<string, Date>;

  constructor() {
    this.hostname = process.env.SITE_URL || 'https://forexeahub.com';
    this.sitemapDir = path.join(process.cwd(), 'public', 'sitemaps');
    this.cacheTime = 3600000; // 1 hour cache
    this.lastGenerated = new Map();
  }

  /**
   * Initialize sitemap directory
   */
  private async ensureSitemapDirectory(): Promise<void> {
    try {
      await mkdir(this.sitemapDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create sitemap directory:', error);
    }
  }

  /**
   * Generate main XML sitemap
   */
  async generateMainSitemap(options: SitemapOptions = {}): Promise<string> {
    const hostname = options.hostname || this.hostname;
    const cacheKey = 'main-sitemap';
    
    // Check cache
    if (this.isCacheValid(cacheKey, options.cacheTime)) {
      return path.join(this.sitemapDir, 'sitemap.xml');
    }

    await this.ensureSitemapDirectory();

    const stream = new SitemapStream({ hostname });
    const entries: SitemapEntry[] = [];

    // Add static pages
    entries.push(
      { url: '/', changefreq: EnumChangefreq.DAILY, priority: 1.0 },
      { url: '/blog', changefreq: EnumChangefreq.DAILY, priority: 0.9 },
      { url: '/downloads', changefreq: EnumChangefreq.DAILY, priority: 0.9 },
      { url: '/signals', changefreq: EnumChangefreq.DAILY, priority: 0.9 },
      { url: '/about', changefreq: EnumChangefreq.WEEKLY, priority: 0.5 },
      { url: '/contact', changefreq: EnumChangefreq.MONTHLY, priority: 0.5 }
    );

    try {
      // Add blog posts
      const blogs = await prismaStorage.getPublishedBlogs({ page: 1, limit: 1000 });
      for (const blog of blogs.data) {
        const entry: SitemapEntry = {
          url: `/blog/${blog.seoSlug}`,
          changefreq: EnumChangefreq.WEEKLY,
          priority: 0.8,
          lastmod: blog.createdAt
        };

        // Add featured image if requested
        if (options.includeImages && blog.featuredImage) {
          entry.img = [{
            url: blog.featuredImage,
            title: blog.title,
            caption: blog.title
          }];
        }

        entries.push(entry);
      }

      // Add signals/EAs
      const signals = await prismaStorage.getAllSignals({ page: 1, limit: 1000 });
      for (const signal of signals.data) {
        const entry: SitemapEntry = {
          url: `/download/${signal.uuid}`,
          changefreq: EnumChangefreq.WEEKLY,
          priority: 0.7,
          lastmod: signal.createdAt
        };

        // Add preview image if available from screenshots
        if (options.includeImages && signal.screenshots) {
          try {
            const screenshots = JSON.parse(signal.screenshots);
            if (Array.isArray(screenshots) && screenshots.length > 0) {
              entry.img = [{
                url: screenshots[0],
                title: signal.title,
                caption: signal.description.substring(0, 100)
              }];
            }
          } catch {
            // Invalid JSON, skip adding image
          }
        }

        entries.push(entry);
      }

      // Add categories
      const categories = await prismaStorage.getActiveCategories();
      for (const category of categories) {
        entries.push({
          url: `/category/${category.slug}`,
          changefreq: EnumChangefreq.WEEKLY,
          priority: 0.6
        });
      }
    } catch (error) {
      console.error('Error fetching data for sitemap:', error);
    }

    // Write entries to stream
    for (const entry of entries) {
      stream.write(entry);
    }

    stream.end();

    // Save to file
    const data = await streamToPromise(stream);
    const filepath = path.join(this.sitemapDir, 'sitemap.xml');
    const writeStream = createWriteStream(filepath);
    writeStream.write(data.toString());
    writeStream.end();

    // Update cache
    this.lastGenerated.set(cacheKey, new Date());

    return filepath;
  }

  /**
   * Generate news sitemap for blog posts
   */
  async generateNewsSitemap(options: SitemapOptions = {}): Promise<string> {
    const hostname = options.hostname || this.hostname;
    const cacheKey = 'news-sitemap';
    
    // Check cache
    if (this.isCacheValid(cacheKey, options.cacheTime)) {
      return path.join(this.sitemapDir, 'news-sitemap.xml');
    }

    await this.ensureSitemapDirectory();

    const stream = new SitemapStream({ hostname });
    const entries: SitemapEntry[] = [];

    try {
      // Get recent blog posts (last 2 days for Google News)
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const blogs = await prismaStorage.getPublishedBlogs({ page: 1, limit: 1000 });
      const recentBlogs = blogs.data.filter((blog: Blog) => blog.createdAt > twoDaysAgo);

      for (const blog of recentBlogs) {
        entries.push({
          url: `/blog/${blog.seoSlug}`,
          news: {
            publication: {
              name: 'Forex EA Hub',
              language: 'en'
            },
            publicationDate: blog.createdAt,
            title: blog.title,
            keywords: blog.tags
          }
        });
      }
    } catch (error) {
      console.error('Error fetching news data for sitemap:', error);
    }

    // Write entries to stream
    for (const entry of entries) {
      stream.write(entry);
    }

    stream.end();

    // Save to file
    const data = await streamToPromise(stream);
    const filepath = path.join(this.sitemapDir, 'news-sitemap.xml');
    const writeStream = createWriteStream(filepath);
    writeStream.write(data.toString());
    writeStream.end();

    // Update cache
    this.lastGenerated.set(cacheKey, new Date());

    return filepath;
  }

  /**
   * Generate image sitemap
   */
  async generateImageSitemap(options: SitemapOptions = {}): Promise<string> {
    const hostname = options.hostname || this.hostname;
    const cacheKey = 'image-sitemap';
    
    // Check cache
    if (this.isCacheValid(cacheKey, options.cacheTime)) {
      return path.join(this.sitemapDir, 'image-sitemap.xml');
    }

    await this.ensureSitemapDirectory();

    const stream = new SitemapStream({ hostname });
    const entries: SitemapEntry[] = [];

    try {
      // Get all blogs with featured images
      const blogs = await prismaStorage.getPublishedBlogs({ page: 1, limit: 1000 });
      for (const blog of blogs.data) {
        if (blog.featuredImage) {
          entries.push({
            url: `/blog/${blog.seoSlug}`,
            img: [{
              url: blog.featuredImage,
              title: blog.title,
              caption: blog.title
            }]
          });
        }
      }

      // Get all signals with preview images
      const signals = await prismaStorage.getAllSignals({ page: 1, limit: 1000 });
      for (const signal of signals.data) {
        if (signal.screenshots) {
          try {
            const screenshots = JSON.parse(signal.screenshots);
            if (Array.isArray(screenshots) && screenshots.length > 0) {
              entries.push({
                url: `/download/${signal.uuid}`,
                img: [{
                  url: screenshots[0],
                  title: signal.title,
                  caption: signal.description.substring(0, 100)
                }]
              });
            }
          } catch {
            // Invalid JSON, skip adding image
          }
        }
      }
    } catch (error) {
      console.error('Error fetching image data for sitemap:', error);
    }

    // Write entries to stream
    for (const entry of entries) {
      stream.write(entry);
    }

    stream.end();

    // Save to file
    const data = await streamToPromise(stream);
    const filepath = path.join(this.sitemapDir, 'image-sitemap.xml');
    const writeStream = createWriteStream(filepath);
    writeStream.write(data.toString());
    writeStream.end();

    // Update cache
    this.lastGenerated.set(cacheKey, new Date());

    return filepath;
  }

  /**
   * Generate sitemap index file
   */
  async generateSitemapIndex(): Promise<string> {
    await this.ensureSitemapDirectory();

    const stream = new SitemapIndexStream();
    const hostname = this.hostname;

    // Generate individual sitemaps
    await this.generateMainSitemap();
    await this.generateNewsSitemap();
    await this.generateImageSitemap();

    // Add sitemaps to index
    const sitemaps = [
      { url: `${hostname}/sitemaps/sitemap.xml`, lastmod: new Date() },
      { url: `${hostname}/sitemaps/news-sitemap.xml`, lastmod: new Date() },
      { url: `${hostname}/sitemaps/image-sitemap.xml`, lastmod: new Date() }
    ];

    for (const sitemap of sitemaps) {
      stream.write(sitemap);
    }

    stream.end();

    // Save to file
    const data = await streamToPromise(stream);
    const filepath = path.join(this.sitemapDir, 'sitemap-index.xml');
    const writeStream = createWriteStream(filepath);
    writeStream.write(data.toString());
    writeStream.end();

    return filepath;
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(key: string, customCacheTime?: number): boolean {
    const lastGen = this.lastGenerated.get(key);
    if (!lastGen) return false;

    const cacheTime = customCacheTime || this.cacheTime;
    return Date.now() - lastGen.getTime() < cacheTime;
  }

  /**
   * Force regenerate all sitemaps
   */
  async regenerateAll(): Promise<void> {
    console.log('Regenerating all sitemaps...');
    
    // Clear cache
    this.lastGenerated.clear();

    // Generate all sitemaps
    await this.generateMainSitemap();
    await this.generateNewsSitemap();
    await this.generateImageSitemap();
    await this.generateSitemapIndex();

    console.log('All sitemaps regenerated successfully');
  }

  /**
   * Schedule automatic sitemap updates
   */
  scheduleAutoUpdate(intervalMs: number = 86400000): void { // Default: 24 hours
    setInterval(async () => {
      try {
        await this.regenerateAll();
      } catch (error) {
        console.error('Failed to auto-update sitemaps:', error);
      }
    }, intervalMs);

    console.log(`Sitemap auto-update scheduled every ${intervalMs / 1000 / 60} minutes`);
  }

  /**
   * Ping search engines about sitemap updates
   */
  async pingSearchEngines(): Promise<void> {
    const sitemapUrl = `${this.hostname}/sitemaps/sitemap-index.xml`;
    const engines = [
      `http://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
      `http://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
    ];

    for (const url of engines) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          console.log(`Successfully pinged: ${url}`);
        }
      } catch (error) {
        console.error(`Failed to ping: ${url}`, error);
      }
    }
  }

  /**
   * Generate sitemap for specific content type
   */
  async generateContentTypeSitemap(
    contentType: 'blogs' | 'signals' | 'categories',
    options: SitemapOptions = {}
  ): Promise<string> {
    const hostname = options.hostname || this.hostname;
    const cacheKey = `${contentType}-sitemap`;
    
    // Check cache
    if (this.isCacheValid(cacheKey, options.cacheTime)) {
      return path.join(this.sitemapDir, `${contentType}-sitemap.xml`);
    }

    await this.ensureSitemapDirectory();

    const stream = new SitemapStream({ hostname });
    const entries: SitemapEntry[] = [];

    try {
      switch (contentType) {
        case 'blogs':
          const blogs = await prismaStorage.getPublishedBlogs({ page: 1, limit: 1000 });
          for (const blog of blogs.data) {
            entries.push({
              url: `/blog/${blog.seoSlug}`,
              changefreq: EnumChangefreq.WEEKLY,
              priority: 0.8,
              lastmod: blog.createdAt
            });
          }
          break;

        case 'signals':
          const signals = await prismaStorage.getAllSignals({ page: 1, limit: 1000 });
          for (const signal of signals.data) {
            entries.push({
              url: `/download/${signal.uuid}`,
              changefreq: EnumChangefreq.WEEKLY,
              priority: 0.7,
              lastmod: signal.createdAt
            });
          }
          break;

        case 'categories':
          const categories = await prismaStorage.getActiveCategories();
          for (const category of categories) {
            entries.push({
              url: `/category/${category.slug}`,
              changefreq: EnumChangefreq.WEEKLY,
              priority: 0.6
            });
          }
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${contentType} for sitemap:`, error);
    }

    // Write entries to stream
    for (const entry of entries) {
      stream.write(entry);
    }

    stream.end();

    // Save to file
    const data = await streamToPromise(stream);
    const filepath = path.join(this.sitemapDir, `${contentType}-sitemap.xml`);
    const writeStream = createWriteStream(filepath);
    writeStream.write(data.toString());
    writeStream.end();

    // Update cache
    this.lastGenerated.set(cacheKey, new Date());

    return filepath;
  }
}

// Export singleton instance
export const sitemapService = new SitemapService();

// Export types
export type { SitemapEntry, SitemapOptions };