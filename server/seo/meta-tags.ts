import type { Blog, Signal, Category, Page } from '@shared/schema';

interface MetaTagsOptions {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  robots?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  image?: string;
  imageAlt?: string;
  imageWidth?: string;
  imageHeight?: string;
  locale?: string;
  siteName?: string;
  twitterHandle?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  ogType?: 'website' | 'article' | 'product' | 'profile';
  noindex?: boolean;
  nofollow?: boolean;
}

export class MetaTagsGenerator {
  private baseUrl: string;
  private siteName: string;
  private defaultImage: string;
  private twitterHandle: string;
  private locale: string;

  constructor() {
    this.baseUrl = process.env.SITE_URL || 'https://forexfactory.cc';
    this.siteName = 'ForexFactory.cc';
    this.defaultImage = `${this.baseUrl}/og-image.jpg`;
    this.twitterHandle = '@forexfactory';
    this.locale = 'en_US';
  }

  /**
   * Truncate title to optimal length
   */
  private optimizeTitle(title: string, maxLength: number = 60): string {
    if (!title) return this.siteName;
    
    // Add site name if there's room
    const withSiteName = `${title} | ${this.siteName}`;
    if (withSiteName.length <= maxLength) {
      return withSiteName;
    }
    
    // Truncate if too long
    if (title.length > maxLength) {
      return title.substring(0, maxLength - 3) + '...';
    }
    
    return title;
  }

  /**
   * Truncate description to optimal length
   */
  private optimizeDescription(description: string, maxLength: number = 160): string {
    if (!description) return '';
    
    // Remove HTML tags
    const stripped = description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    
    if (stripped.length <= maxLength) {
      return stripped;
    }
    
    // Find last complete word before limit
    const truncated = stripped.substring(0, maxLength - 3);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return truncated.substring(0, lastSpace) + '...';
  }

  /**
   * Generate keywords from content
   */
  private generateKeywords(content: string, existingKeywords?: string[]): string[] {
    const keywords: Set<string> = new Set(existingKeywords || []);
    
    // Add forex-related keywords
    const defaultKeywords = [
      'forex', 'expert advisor', 'EA', 'MT4', 'MT5', 'MetaTrader',
      'trading robot', 'automated trading', 'forex robot'
    ];
    
    defaultKeywords.forEach(kw => keywords.add(kw));
    
    // Extract keywords from content (simple approach)
    const words = content.toLowerCase().split(/\W+/);
    const commonWords = new Set(['the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'as', 'are', 'was', 'were', 'to', 'of', 'for', 'with', 'in']);
    
    const wordFreq: Record<string, number> = {};
    words.forEach(word => {
      if (word.length > 3 && !commonWords.has(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    // Add top frequent words
    Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([word]) => keywords.add(word));
    
    return Array.from(keywords).slice(0, 15); // Limit to 15 keywords
  }

  /**
   * Generate all meta tags
   */
  generateMetaTags(options: MetaTagsOptions): string {
    const tags: string[] = [];
    
    // Optimize title and description
    const title = this.optimizeTitle(options.title);
    const description = this.optimizeDescription(options.description);
    
    // Basic meta tags
    tags.push(`<title>${this.escapeHtml(title)}</title>`);
    tags.push(`<meta name="description" content="${this.escapeHtml(description)}" />`);
    
    // Keywords
    const keywords = options.keywords || this.generateKeywords(options.title + ' ' + options.description);
    if (keywords.length > 0) {
      tags.push(`<meta name="keywords" content="${this.escapeHtml(keywords.join(', '))}" />`);
    }
    
    // Canonical URL
    const canonical = options.canonical || this.baseUrl;
    tags.push(`<link rel="canonical" href="${canonical}" />`);
    
    // Robots
    if (options.noindex || options.nofollow) {
      const robotsContent = [
        options.noindex ? 'noindex' : 'index',
        options.nofollow ? 'nofollow' : 'follow'
      ].join(', ');
      tags.push(`<meta name="robots" content="${robotsContent}" />`);
    } else {
      tags.push(`<meta name="robots" content="${options.robots || 'index, follow'}" />`);
    }
    
    // Author
    if (options.author) {
      tags.push(`<meta name="author" content="${this.escapeHtml(options.author)}" />`);
    }
    
    // Open Graph tags
    tags.push(`<meta property="og:title" content="${this.escapeHtml(title)}" />`);
    tags.push(`<meta property="og:description" content="${this.escapeHtml(description)}" />`);
    tags.push(`<meta property="og:url" content="${canonical}" />`);
    tags.push(`<meta property="og:type" content="${options.ogType || 'website'}" />`);
    tags.push(`<meta property="og:site_name" content="${this.escapeHtml(options.siteName || this.siteName)}" />`);
    tags.push(`<meta property="og:locale" content="${options.locale || this.locale}" />`);
    
    // Open Graph image
    const ogImage = options.image || this.defaultImage;
    tags.push(`<meta property="og:image" content="${ogImage}" />`);
    tags.push(`<meta property="og:image:secure_url" content="${ogImage}" />`);
    
    if (options.imageAlt) {
      tags.push(`<meta property="og:image:alt" content="${this.escapeHtml(options.imageAlt)}" />`);
    }
    
    if (options.imageWidth) {
      tags.push(`<meta property="og:image:width" content="${options.imageWidth}" />`);
    }
    
    if (options.imageHeight) {
      tags.push(`<meta property="og:image:height" content="${options.imageHeight}" />`);
    }
    
    // Article specific Open Graph tags
    if (options.ogType === 'article') {
      if (options.publishedTime) {
        tags.push(`<meta property="article:published_time" content="${options.publishedTime}" />`);
      }
      
      if (options.modifiedTime) {
        tags.push(`<meta property="article:modified_time" content="${options.modifiedTime}" />`);
      }
      
      if (options.author) {
        tags.push(`<meta property="article:author" content="${this.escapeHtml(options.author)}" />`);
      }
      
      if (options.section) {
        tags.push(`<meta property="article:section" content="${this.escapeHtml(options.section)}" />`);
      }
      
      if (options.tags && options.tags.length > 0) {
        options.tags.forEach(tag => {
          tags.push(`<meta property="article:tag" content="${this.escapeHtml(tag)}" />`);
        });
      }
    }
    
    // Twitter Card tags
    const twitterCard = options.twitterCard || (options.image ? 'summary_large_image' : 'summary');
    tags.push(`<meta name="twitter:card" content="${twitterCard}" />`);
    tags.push(`<meta name="twitter:title" content="${this.escapeHtml(title)}" />`);
    tags.push(`<meta name="twitter:description" content="${this.escapeHtml(description)}" />`);
    tags.push(`<meta name="twitter:image" content="${ogImage}" />`);
    
    if (options.imageAlt) {
      tags.push(`<meta name="twitter:image:alt" content="${this.escapeHtml(options.imageAlt)}" />`);
    }
    
    const twitterHandle = options.twitterHandle || this.twitterHandle;
    if (twitterHandle) {
      tags.push(`<meta name="twitter:site" content="${twitterHandle}" />`);
      tags.push(`<meta name="twitter:creator" content="${twitterHandle}" />`);
    }
    
    // Additional SEO tags
    tags.push(`<meta name="generator" content="ForexFactory SEO System" />`);
    tags.push(`<meta name="format-detection" content="telephone=no" />`);
    tags.push(`<meta name="apple-mobile-web-app-title" content="${this.escapeHtml(this.siteName)}" />`);
    tags.push(`<meta name="application-name" content="${this.escapeHtml(this.siteName)}" />`);
    
    // Favicon links
    tags.push(`<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />`);
    tags.push(`<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />`);
    tags.push(`<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />`);
    
    // RSS feed links
    tags.push(`<link rel="alternate" type="application/rss+xml" title="${this.escapeHtml(this.siteName)} RSS Feed" href="${this.baseUrl}/rss.xml" />`);
    tags.push(`<link rel="alternate" type="application/atom+xml" title="${this.escapeHtml(this.siteName)} Atom Feed" href="${this.baseUrl}/atom.xml" />`);
    
    return tags.join('\n');
  }

  /**
   * Generate meta tags for a blog post
   */
  generateBlogMetaTags(blog: Blog, categoryName?: string): string {
    const url = `${this.baseUrl}/blog/${blog.seoSlug}`;
    
    return this.generateMetaTags({
      title: blog.title,
      description: blog.content.substring(0, 300),
      keywords: blog.tags ? blog.tags.split(',').map(t => t.trim()) : undefined,
      canonical: url,
      author: blog.author,
      publishedTime: blog.createdAt.toISOString(),
      modifiedTime: blog.createdAt.toISOString(),
      section: categoryName || 'Forex Trading',
      tags: blog.tags ? blog.tags.split(',').map(t => t.trim()) : [],
      image: blog.featuredImage ? `${this.baseUrl}${blog.featuredImage}` : undefined,
      imageAlt: blog.title,
      imageWidth: '1200',
      imageHeight: '630',
      ogType: 'article',
      twitterCard: 'summary_large_image'
    });
  }

  /**
   * Generate meta tags for a signal/EA page
   */
  generateSignalMetaTags(signal: Signal): string {
    const url = `${this.baseUrl}/signals/${signal.uuid}`;
    let image: string | undefined;
    
    // Get first screenshot if available
    if (signal.screenshots) {
      try {
        const screenshots = JSON.parse(signal.screenshots);
        if (Array.isArray(screenshots) && screenshots.length > 0) {
          image = `${this.baseUrl}${screenshots[0]}`;
        }
      } catch (e) {
        // Invalid JSON
      }
    }
    
    const keywords = [
      signal.platform,
      signal.strategy,
      'expert advisor',
      'trading robot',
      'forex EA',
      'automated trading'
    ].filter(Boolean);
    
    return this.generateMetaTags({
      title: `${signal.title} - ${signal.platform} Expert Advisor`,
      description: signal.description,
      keywords,
      canonical: url,
      publishedTime: signal.createdAt.toISOString(),
      modifiedTime: signal.createdAt.toISOString(),
      image,
      imageAlt: `${signal.title} Screenshot`,
      imageWidth: '1200',
      imageHeight: '630',
      ogType: 'product',
      twitterCard: 'summary_large_image'
    });
  }

  /**
   * Generate meta tags for category page
   */
  generateCategoryMetaTags(category: Category, postCount?: number): string {
    const slug = category.slug || category.name.toLowerCase().replace(/\s+/g, '-');
    const url = `${this.baseUrl}/category/${slug}`;
    
    const description = category.description || 
      `Browse ${postCount || 'all'} ${category.name} articles, Expert Advisors, and trading strategies on ForexFactory.cc`;
    
    return this.generateMetaTags({
      title: `${category.name} - Forex Trading Resources`,
      description,
      keywords: [category.name.toLowerCase(), 'forex', 'trading', 'expert advisor'],
      canonical: url,
      ogType: 'website'
    });
  }

  /**
   * Generate meta tags for homepage
   */
  generateHomePageMetaTags(): string {
    return this.generateMetaTags({
      title: 'Best Forex Expert Advisors & MT4/MT5 Trading Robots',
      description: 'Download professional Forex Expert Advisors, trading robots, and automated systems for MetaTrader 4 and MetaTrader 5. Free and premium EAs with proven results.',
      keywords: [
        'forex expert advisor',
        'MT4 EA',
        'MT5 EA',
        'trading robot',
        'automated trading',
        'forex robot',
        'MetaTrader',
        'forex signals',
        'algorithmic trading'
      ],
      canonical: this.baseUrl,
      ogType: 'website',
      image: this.defaultImage,
      imageAlt: 'ForexFactory.cc - Expert Advisors & Trading Robots',
      imageWidth: '1200',
      imageHeight: '630'
    });
  }

  /**
   * Generate meta tags for static pages
   */
  generateStaticPageMetaTags(
    title: string,
    description: string,
    path: string,
    keywords?: string[]
  ): string {
    return this.generateMetaTags({
      title,
      description,
      keywords,
      canonical: `${this.baseUrl}${path}`,
      ogType: 'website'
    });
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Generate JSON-LD for better SEO
   */
  generateJSONLD(data: any): string {
    return `<script type="application/ld+json">${JSON.stringify(data, null, 2)}</script>`;
  }

  /**
   * Generate preconnect tags for performance
   */
  generatePreconnectTags(): string {
    const tags: string[] = [];
    
    // Preconnect to important domains
    tags.push('<link rel="preconnect" href="https://fonts.googleapis.com" />');
    tags.push('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />');
    tags.push('<link rel="dns-prefetch" href="https://www.google-analytics.com" />');
    tags.push('<link rel="dns-prefetch" href="https://www.googletagmanager.com" />');
    
    return tags.join('\n');
  }

  /**
   * Generate complete head section
   */
  generateCompleteHead(options: MetaTagsOptions, jsonLd?: any): string {
    const sections: string[] = [];
    
    // Meta tags
    sections.push(this.generateMetaTags(options));
    
    // Preconnect tags
    sections.push(this.generatePreconnectTags());
    
    // JSON-LD structured data
    if (jsonLd) {
      sections.push(this.generateJSONLD(jsonLd));
    }
    
    return sections.join('\n\n');
  }
}

// Export singleton instance
export const metaTagsGenerator = new MetaTagsGenerator();