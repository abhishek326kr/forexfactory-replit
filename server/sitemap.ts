import { Request, Response } from 'express';
import { posts, downloads, categories, pages } from '../shared/schema';
import { db } from './db';
import { eq } from 'drizzle-orm';

const SITE_URL = 'https://forexfactory.cc';

// Helper to format date for sitemap
function formatSitemapDate(date: Date | string | null): string {
  if (!date) return new Date().toISOString().split('T')[0];
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

// Helper to escape XML special characters
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Generate URL entry for sitemap
function generateUrlEntry(
  loc: string,
  lastmod?: string,
  changefreq?: string,
  priority?: number,
  images?: Array<{ loc: string; title?: string; caption?: string }>
): string {
  let entry = '  <url>\n';
  entry += `    <loc>${escapeXml(loc)}</loc>\n`;
  
  if (lastmod) {
    entry += `    <lastmod>${lastmod}</lastmod>\n`;
  }
  
  if (changefreq) {
    entry += `    <changefreq>${changefreq}</changefreq>\n`;
  }
  
  if (priority !== undefined) {
    entry += `    <priority>${priority}</priority>\n`;
  }
  
  // Add image entries if present
  if (images && images.length > 0) {
    images.forEach(image => {
      entry += '    <image:image>\n';
      entry += `      <image:loc>${escapeXml(image.loc)}</image:loc>\n`;
      if (image.title) {
        entry += `      <image:title>${escapeXml(image.title)}</image:title>\n`;
      }
      if (image.caption) {
        entry += `      <image:caption>${escapeXml(image.caption)}</image:caption>\n`;
      }
      entry += '    </image:image>\n';
    });
  }
  
  entry += '  </url>\n';
  return entry;
}

export async function generateSitemap(_req: Request, res: Response) {
  try {
    // Start XML sitemap
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    sitemap += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n';
    sitemap += '        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"\n';
    sitemap += '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n';
    
    // Add homepage
    sitemap += generateUrlEntry(
      SITE_URL,
      formatSitemapDate(new Date()),
      'daily',
      1.0
    );
    
    // Add static pages with high priority
    const staticPages = [
      { path: '/downloads', changefreq: 'daily', priority: 0.9 },
      { path: '/blog', changefreq: 'daily', priority: 0.8 },
      { path: '/about', changefreq: 'monthly', priority: 0.7 },
      { path: '/contact', changefreq: 'monthly', priority: 0.6 },
      { path: '/privacy', changefreq: 'yearly', priority: 0.3 },
      { path: '/terms', changefreq: 'yearly', priority: 0.3 },
    ];
    
    staticPages.forEach(page => {
      sitemap += generateUrlEntry(
        `${SITE_URL}${page.path}`,
        formatSitemapDate(new Date()),
        page.changefreq,
        page.priority
      );
    });
    
    // Fetch and add all published blog posts
    const blogPosts = await db
      .select()
      .from(posts)
      .where(eq(posts.status, 'published'));
    
    blogPosts.forEach(post => {
      const images: Array<{ loc: string; title?: string; caption?: string }> = [];
      if (post.featuredImage) {
        images.push({
          loc: `${SITE_URL}${post.featuredImage}`,
          title: post.title,
          caption: post.excerpt || undefined
        });
      }
      if (post.ogImage && post.ogImage !== post.featuredImage) {
        images.push({
          loc: `${SITE_URL}${post.ogImage}`,
          title: post.title
        });
      }
      
      sitemap += generateUrlEntry(
        `${SITE_URL}/blog/${post.slug}`,
        formatSitemapDate(post.updatedAt || post.publishedAt),
        'weekly',
        0.7,
        images
      );
    });
    
    // Fetch and add all active downloads (Expert Advisors)
    const downloadItems = await db
      .select()
      .from(downloads)
      .where(eq(downloads.status, 'active'));
    
    downloadItems.forEach(download => {
      const images: Array<{ loc: string; title?: string; caption?: string }> = [];
      
      // Add featured image
      if (download.featuredImage) {
        images.push({
          loc: `${SITE_URL}${download.featuredImage}`,
          title: `${download.name} v${download.version}`,
          caption: download.description.substring(0, 200)
        });
      }
      
      // Add screenshots
      if (download.screenshots && download.screenshots.length > 0) {
        download.screenshots.forEach((screenshot, index) => {
          images.push({
            loc: `${SITE_URL}${screenshot}`,
            title: `${download.name} Screenshot ${index + 1}`
          });
        });
      }
      
      sitemap += generateUrlEntry(
        `${SITE_URL}/downloads/${download.slug}`,
        formatSitemapDate(download.updatedAt || download.publishedAt),
        'weekly',
        0.8, // High priority for downloads
        images
      );
    });
    
    // Fetch and add all categories
    const categoryList = await db.select().from(categories);
    
    categoryList.forEach(category => {
      sitemap += generateUrlEntry(
        `${SITE_URL}/category/${category.slug}`,
        formatSitemapDate(new Date()),
        'weekly',
        0.6
      );
    });
    
    // Fetch and add custom pages if they exist
    const customPages = await db
      .select()
      .from(pages)
      .where(eq(pages.status, 'published'));
    
    customPages.forEach(page => {
      const images: Array<{ loc: string; title?: string }> = [];
      if (page.ogImage) {
        images.push({
          loc: `${SITE_URL}${page.ogImage}`,
          title: page.title
        });
      }
      
      sitemap += generateUrlEntry(
        `${SITE_URL}/${page.slug}`,
        formatSitemapDate(new Date()),
        'monthly',
        page.priority || 0.5,
        images
      );
    });
    
    // Add special pages for different EA types/strategies (SEO landing pages)
    const eaStrategies = [
      'scalping-ea',
      'grid-trading-ea',
      'martingale-ea',
      'hedging-ea',
      'news-trading-ea',
      'trend-following-ea',
      'arbitrage-ea',
      'high-frequency-ea'
    ];
    
    eaStrategies.forEach(strategy => {
      sitemap += generateUrlEntry(
        `${SITE_URL}/strategy/${strategy}`,
        formatSitemapDate(new Date()),
        'weekly',
        0.7
      );
    });
    
    // Add platform-specific pages
    const platforms = ['mt4', 'mt5', 'mql4', 'mql5'];
    
    platforms.forEach(platform => {
      sitemap += generateUrlEntry(
        `${SITE_URL}/platform/${platform}`,
        formatSitemapDate(new Date()),
        'weekly',
        0.7
      );
    });
    
    // Add comparison and review pages
    const comparisonPages = [
      'best-forex-robots',
      'top-mt4-expert-advisors',
      'mt5-trading-robots',
      'free-forex-ea',
      'profitable-expert-advisors'
    ];
    
    comparisonPages.forEach(page => {
      sitemap += generateUrlEntry(
        `${SITE_URL}/reviews/${page}`,
        formatSitemapDate(new Date()),
        'weekly',
        0.8
      );
    });
    
    // Close sitemap
    sitemap += '</urlset>';
    
    // Set proper content type and send response
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.status(200).send(sitemap);
    
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
}

// Generate sitemap index if we have multiple sitemaps
export async function generateSitemapIndex(_req: Request, res: Response) {
  let sitemapIndex = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemapIndex += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Main sitemap
  sitemapIndex += '  <sitemap>\n';
  sitemapIndex += `    <loc>${SITE_URL}/sitemap.xml</loc>\n`;
  sitemapIndex += `    <lastmod>${formatSitemapDate(new Date())}</lastmod>\n`;
  sitemapIndex += '  </sitemap>\n';
  
  // You can add more sitemaps here if needed (e.g., for different languages or sections)
  // sitemapIndex += '  <sitemap>\n';
  // sitemapIndex += `    <loc>${SITE_URL}/sitemap-images.xml</loc>\n`;
  // sitemapIndex += `    <lastmod>${formatSitemapDate(new Date())}</lastmod>\n`;
  // sitemapIndex += '  </sitemap>\n';
  
  sitemapIndex += '</sitemapindex>';
  
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).send(sitemapIndex);
}

// Generate news sitemap for Google News (if applicable)
export async function generateNewsSitemap(_req: Request, res: Response) {
  try {
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    sitemap += '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n';
    
    // Get recent posts (last 2 days for Google News)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const recentPosts = await db
      .select()
      .from(posts)
      .where(eq(posts.status, 'published'));
    
    const newsItems = recentPosts.filter(post => {
      if (!post.publishedAt) return false;
      const publishDate = new Date(post.publishedAt);
      return publishDate >= twoDaysAgo;
    });
    
    newsItems.forEach(post => {
      sitemap += '  <url>\n';
      sitemap += `    <loc>${SITE_URL}/blog/${post.slug}</loc>\n`;
      sitemap += '    <news:news>\n';
      sitemap += '      <news:publication>\n';
      sitemap += `        <news:name>ForexFactory.cc</news:name>\n`;
      sitemap += `        <news:language>en</news:language>\n`;
      sitemap += '      </news:publication>\n';
      
      if (post.publishedAt) {
        const pubDate = new Date(post.publishedAt).toISOString();
        sitemap += `      <news:publication_date>${pubDate}</news:publication_date>\n`;
      }
      
      sitemap += `      <news:title>${escapeXml(post.title)}</news:title>\n`;
      
      // Add keywords/tags if available
      if (post.seoKeywords) {
        const keywords = post.seoKeywords.split(',').map(k => k.trim()).slice(0, 10).join(', ');
        sitemap += `      <news:keywords>${escapeXml(keywords)}</news:keywords>\n`;
      }
      
      sitemap += '    </news:news>\n';
      sitemap += '  </url>\n';
    });
    
    sitemap += '</urlset>';
    
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=1800'); // Cache for 30 minutes
    res.status(200).send(sitemap);
    
  } catch (error) {
    console.error('Error generating news sitemap:', error);
    res.status(500).send('Error generating news sitemap');
  }
}