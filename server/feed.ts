import { Request, Response } from 'express';
import { posts, downloads, categories, users } from '../shared/schema';
import { db } from './db';
import { eq, desc, and, sql } from 'drizzle-orm';

const SITE_URL = 'https://forexfactory.cc';
const SITE_NAME = 'ForexFactory.cc';
const SITE_DESCRIPTION = 'Best Forex Expert Advisors, MT4/MT5 Trading Robots & Automated Trading Systems';

// Helper to escape XML special characters
function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Helper to format date for RSS
function formatRssDate(date: Date | string | null): string {
  if (!date) return new Date().toUTCString();
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toUTCString();
}

// Helper to strip HTML tags from content for description
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '');
}

// Helper to truncate text to specified length
function truncateText(text: string, maxLength: number = 280): string {
  const stripped = stripHtml(text);
  if (stripped.length <= maxLength) return stripped;
  return stripped.substring(0, maxLength - 3) + '...';
}

// Generate main RSS feed (blog posts)
export async function generateRssFeed(_req: Request, res: Response) {
  try {
    // Start RSS feed
    let rssFeed = '<?xml version="1.0" encoding="UTF-8"?>\n';
    rssFeed += '<rss version="2.0" \n';
    rssFeed += '  xmlns:content="http://purl.org/rss/1.0/modules/content/"\n';
    rssFeed += '  xmlns:dc="http://purl.org/dc/elements/1.1/"\n';
    rssFeed += '  xmlns:atom="http://www.w3.org/2005/Atom"\n';
    rssFeed += '  xmlns:media="http://search.yahoo.com/mrss/">\n';
    rssFeed += '<channel>\n';
    
    // Channel information
    rssFeed += `  <title>${SITE_NAME} - Forex Trading Blog</title>\n`;
    rssFeed += `  <link>${SITE_URL}</link>\n`;
    rssFeed += `  <description>${escapeXml(SITE_DESCRIPTION)}</description>\n`;
    rssFeed += `  <language>en-us</language>\n`;
    rssFeed += `  <copyright>Copyright © ${new Date().getFullYear()} ${SITE_NAME}</copyright>\n`;
    rssFeed += `  <lastBuildDate>${formatRssDate(new Date())}</lastBuildDate>\n`;
    rssFeed += `  <generator>ForexFactory RSS Generator</generator>\n`;
    rssFeed += `  <webMaster>support@forexfactory.cc (ForexFactory Support)</webMaster>\n`;
    rssFeed += `  <managingEditor>editor@forexfactory.cc (ForexFactory Editor)</managingEditor>\n`;
    rssFeed += `  <ttl>60</ttl>\n`; // Time to live in minutes
    
    // Atom link for feed autodiscovery
    rssFeed += `  <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />\n`;
    
    // Channel image
    rssFeed += '  <image>\n';
    rssFeed += `    <url>${SITE_URL}/logo.png</url>\n`;
    rssFeed += `    <title>${SITE_NAME}</title>\n`;
    rssFeed += `    <link>${SITE_URL}</link>\n`;
    rssFeed += '    <width>144</width>\n';
    rssFeed += '    <height>144</height>\n';
    rssFeed += '  </image>\n';
    
    // Fetch latest blog posts (limit to 50 most recent)
    const blogPosts = await db
      .select({
        post: posts,
        category: categories,
        author: users
      })
      .from(posts)
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.status, 'published'))
      .orderBy(desc(posts.publishedAt))
      .limit(50);
    
    // Add posts as items
    for (const { post, category, author } of blogPosts) {
      rssFeed += '  <item>\n';
      
      // Title
      rssFeed += `    <title>${escapeXml(post.title)}</title>\n`;
      
      // Link
      const postUrl = `${SITE_URL}/blog/${post.slug}`;
      rssFeed += `    <link>${postUrl}</link>\n`;
      
      // GUID (globally unique identifier)
      rssFeed += `    <guid isPermaLink="true">${postUrl}</guid>\n`;
      
      // Description (excerpt or truncated content)
      const description = post.excerpt || truncateText(post.content, 280);
      rssFeed += `    <description>${escapeXml(description)}</description>\n`;
      
      // Full content (if you want to include it)
      rssFeed += `    <content:encoded><![CDATA[${post.content}]]></content:encoded>\n`;
      
      // Author
      if (author) {
        rssFeed += `    <dc:creator>${escapeXml(author.username)}</dc:creator>\n`;
        rssFeed += `    <author>editor@forexfactory.cc (${escapeXml(author.username)})</author>\n`;
      }
      
      // Category
      if (category) {
        rssFeed += `    <category>${escapeXml(category.name)}</category>\n`;
      }
      
      // Add SEO keywords as additional categories
      if (post.seoKeywords) {
        const keywords = post.seoKeywords.split(',').map(k => k.trim());
        keywords.slice(0, 5).forEach(keyword => {
          rssFeed += `    <category>${escapeXml(keyword)}</category>\n`;
        });
      }
      
      // Publication date
      if (post.publishedAt) {
        rssFeed += `    <pubDate>${formatRssDate(post.publishedAt)}</pubDate>\n`;
      }
      
      // Featured image
      if (post.featuredImage) {
        rssFeed += '    <media:content \n';
        rssFeed += `      url="${SITE_URL}${post.featuredImage}"\n`;
        rssFeed += '      medium="image"\n';
        rssFeed += '      type="image/jpeg">\n';
        rssFeed += `      <media:title>${escapeXml(post.title)}</media:title>\n`;
        if (post.excerpt) {
          rssFeed += `      <media:description>${escapeXml(post.excerpt)}</media:description>\n`;
        }
        rssFeed += '    </media:content>\n';
        
        // Alternative enclosure tag
        rssFeed += `    <enclosure url="${SITE_URL}${post.featuredImage}" type="image/jpeg" length="0" />\n`;
      }
      
      // Comments link (if you have a comments system)
      rssFeed += `    <comments>${postUrl}#comments</comments>\n`;
      
      rssFeed += '  </item>\n';
    }
    
    // Close channel and RSS
    rssFeed += '</channel>\n';
    rssFeed += '</rss>';
    
    // Set proper content type and send response
    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=1800'); // Cache for 30 minutes
    res.status(200).send(rssFeed);
    
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    res.status(500).send('Error generating RSS feed');
  }
}

// Generate RSS feed for Expert Advisors/Downloads
export async function generateDownloadsRssFeed(_req: Request, res: Response) {
  try {
    let rssFeed = '<?xml version="1.0" encoding="UTF-8"?>\n';
    rssFeed += '<rss version="2.0" \n';
    rssFeed += '  xmlns:content="http://purl.org/rss/1.0/modules/content/"\n';
    rssFeed += '  xmlns:dc="http://purl.org/dc/elements/1.1/"\n';
    rssFeed += '  xmlns:atom="http://www.w3.org/2005/Atom"\n';
    rssFeed += '  xmlns:media="http://search.yahoo.com/mrss/">\n';
    rssFeed += '<channel>\n';
    
    // Channel information
    rssFeed += `  <title>${SITE_NAME} - Latest Expert Advisors & Trading Robots</title>\n`;
    rssFeed += `  <link>${SITE_URL}/downloads</link>\n`;
    rssFeed += `  <description>Latest MT4/MT5 Expert Advisors, Forex Robots, and Automated Trading Systems</description>\n`;
    rssFeed += `  <language>en-us</language>\n`;
    rssFeed += `  <copyright>Copyright © ${new Date().getFullYear()} ${SITE_NAME}</copyright>\n`;
    rssFeed += `  <lastBuildDate>${formatRssDate(new Date())}</lastBuildDate>\n`;
    rssFeed += `  <generator>ForexFactory RSS Generator</generator>\n`;
    rssFeed += `  <ttl>60</ttl>\n`;
    
    // Atom link
    rssFeed += `  <atom:link href="${SITE_URL}/rss-downloads.xml" rel="self" type="application/rss+xml" />\n`;
    
    // Fetch latest downloads (limit to 30 most recent)
    const downloadItems = await db
      .select({
        download: downloads,
        category: categories
      })
      .from(downloads)
      .leftJoin(categories, eq(downloads.categoryId, categories.id))
      .where(eq(downloads.status, 'active'))
      .orderBy(desc(downloads.publishedAt))
      .limit(30);
    
    // Add downloads as items
    for (const { download, category } of downloadItems) {
      rssFeed += '  <item>\n';
      
      // Title with version
      const title = `${download.name} v${download.version} - ${download.platform} Expert Advisor`;
      rssFeed += `    <title>${escapeXml(title)}</title>\n`;
      
      // Link
      const downloadUrl = `${SITE_URL}/downloads/${download.slug}`;
      rssFeed += `    <link>${downloadUrl}</link>\n`;
      
      // GUID
      rssFeed += `    <guid isPermaLink="true">${downloadUrl}</guid>\n`;
      
      // Description
      let description = truncateText(download.description, 280);
      
      // Add performance metrics to description if available
      if (download.winRate || download.profitFactor) {
        description += ' | Performance: ';
        if (download.winRate) description += `Win Rate: ${download.winRate}%`;
        if (download.profitFactor) description += `, Profit Factor: ${download.profitFactor}`;
      }
      
      rssFeed += `    <description>${escapeXml(description)}</description>\n`;
      
      // Full description in content
      let fullContent = download.description;
      if (download.features && download.features.length > 0) {
        fullContent += '\n\nFeatures:\n';
        download.features.forEach(feature => {
          fullContent += `• ${feature}\n`;
        });
      }
      if (download.requirements) {
        fullContent += `\n\nRequirements:\n${download.requirements}`;
      }
      
      rssFeed += `    <content:encoded><![CDATA[${fullContent}]]></content:encoded>\n`;
      
      // Category
      if (category) {
        rssFeed += `    <category>${escapeXml(category.name)}</category>\n`;
      }
      
      // Platform as category
      rssFeed += `    <category>${escapeXml(download.platform)}</category>\n`;
      
      // SEO keywords as categories
      if (download.seoKeywords) {
        const keywords = download.seoKeywords.split(',').map(k => k.trim());
        keywords.slice(0, 3).forEach(keyword => {
          rssFeed += `    <category>${escapeXml(keyword)}</category>\n`;
        });
      }
      
      // Publication date
      if (download.publishedAt) {
        rssFeed += `    <pubDate>${formatRssDate(download.publishedAt)}</pubDate>\n`;
      }
      
      // Featured image
      if (download.featuredImage) {
        rssFeed += '    <media:content \n';
        rssFeed += `      url="${SITE_URL}${download.featuredImage}"\n`;
        rssFeed += '      medium="image"\n';
        rssFeed += '      type="image/jpeg">\n';
        rssFeed += `      <media:title>${escapeXml(download.name)}</media:title>\n`;
        rssFeed += `      <media:description>Screenshot of ${escapeXml(download.name)}</media:description>\n`;
        rssFeed += '    </media:content>\n';
      }
      
      // Additional screenshots as media
      if (download.screenshots && download.screenshots.length > 0) {
        download.screenshots.slice(0, 3).forEach((screenshot, index) => {
          rssFeed += '    <media:content \n';
          rssFeed += `      url="${SITE_URL}${screenshot}"\n`;
          rssFeed += '      medium="image"\n';
          rssFeed += '      type="image/jpeg">\n';
          rssFeed += `      <media:title>${escapeXml(download.name)} - Screenshot ${index + 1}</media:title>\n`;
          rssFeed += '    </media:content>\n';
        });
      }
      
      // Download link as enclosure
      if (download.fileUrl) {
        rssFeed += `    <enclosure url="${SITE_URL}${download.fileUrl}" type="application/octet-stream" length="0" />\n`;
      }
      
      rssFeed += '  </item>\n';
    }
    
    rssFeed += '</channel>\n';
    rssFeed += '</rss>';
    
    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=1800'); // Cache for 30 minutes
    res.status(200).send(rssFeed);
    
  } catch (error) {
    console.error('Error generating downloads RSS feed:', error);
    res.status(500).send('Error generating downloads RSS feed');
  }
}

// Generate Atom feed (alternative to RSS)
export async function generateAtomFeed(_req: Request, res: Response) {
  try {
    let atomFeed = '<?xml version="1.0" encoding="UTF-8"?>\n';
    atomFeed += '<feed xmlns="http://www.w3.org/2005/Atom">\n';
    
    // Feed metadata
    atomFeed += `  <title>${SITE_NAME}</title>\n`;
    atomFeed += `  <subtitle>${escapeXml(SITE_DESCRIPTION)}</subtitle>\n`;
    atomFeed += `  <link href="${SITE_URL}/atom.xml" rel="self" type="application/atom+xml" />\n`;
    atomFeed += `  <link href="${SITE_URL}" rel="alternate" type="text/html" />\n`;
    atomFeed += `  <id>${SITE_URL}/</id>\n`;
    atomFeed += `  <updated>${new Date().toISOString()}</updated>\n`;
    atomFeed += `  <rights>Copyright © ${new Date().getFullYear()} ${SITE_NAME}</rights>\n`;
    atomFeed += '  <author>\n';
    atomFeed += `    <name>${SITE_NAME}</name>\n`;
    atomFeed += `    <email>support@forexfactory.cc</email>\n`;
    atomFeed += `    <uri>${SITE_URL}</uri>\n`;
    atomFeed += '  </author>\n';
    
    // Fetch latest posts
    const blogPosts = await db
      .select({
        post: posts,
        category: categories,
        author: users
      })
      .from(posts)
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.status, 'published'))
      .orderBy(desc(posts.publishedAt))
      .limit(30);
    
    // Add posts as entries
    for (const { post, category, author } of blogPosts) {
      atomFeed += '  <entry>\n';
      
      // Title
      atomFeed += `    <title>${escapeXml(post.title)}</title>\n`;
      
      // Link
      const postUrl = `${SITE_URL}/blog/${post.slug}`;
      atomFeed += `    <link href="${postUrl}" rel="alternate" type="text/html" />\n`;
      
      // ID
      atomFeed += `    <id>${postUrl}</id>\n`;
      
      // Updated date
      const updated = post.updatedAt || post.publishedAt || new Date();
      atomFeed += `    <updated>${new Date(updated).toISOString()}</updated>\n`;
      
      // Published date
      if (post.publishedAt) {
        atomFeed += `    <published>${new Date(post.publishedAt).toISOString()}</published>\n`;
      }
      
      // Author
      if (author) {
        atomFeed += '    <author>\n';
        atomFeed += `      <name>${escapeXml(author.username)}</name>\n`;
        atomFeed += '    </author>\n';
      }
      
      // Summary (excerpt)
      if (post.excerpt) {
        atomFeed += `    <summary type="text">${escapeXml(post.excerpt)}</summary>\n`;
      }
      
      // Content
      atomFeed += `    <content type="html"><![CDATA[${post.content}]]></content>\n`;
      
      // Category
      if (category) {
        atomFeed += `    <category term="${escapeXml(category.name)}" />\n`;
      }
      
      atomFeed += '  </entry>\n';
    }
    
    atomFeed += '</feed>';
    
    res.setHeader('Content-Type', 'application/atom+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=1800');
    res.status(200).send(atomFeed);
    
  } catch (error) {
    console.error('Error generating Atom feed:', error);
    res.status(500).send('Error generating Atom feed');
  }
}