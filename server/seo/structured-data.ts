import type { 
  Article,
  BlogPosting, 
  Organization, 
  FAQPage, 
  BreadcrumbList,
  WebPage,
  SoftwareApplication,
  Product,
  Review,
  AggregateRating,
  Thing,
  WithContext,
  ListItem,
  Question,
  Answer,
  Person,
  ImageObject,
  Offer
} from 'schema-dts';
import { storage } from '../storage';
import type { Blog, Signal, Category } from '@shared/schema';

interface StructuredDataOptions {
  baseUrl?: string;
  organizationName?: string;
  organizationLogo?: string;
  defaultImage?: string;
}

export class StructuredDataGenerator {
  private baseUrl: string;
  private organizationName: string;
  private organizationLogo: string;
  private defaultImage: string;
  private organizationData: WithContext<Organization>;

  constructor(options: StructuredDataOptions = {}) {
    this.baseUrl = options.baseUrl || process.env.SITE_URL || 'https://forexfactory.cc';
    this.organizationName = options.organizationName || 'ForexFactory.cc';
    this.organizationLogo = options.organizationLogo || `${this.baseUrl}/logo.png`;
    this.defaultImage = options.defaultImage || `${this.baseUrl}/og-image.jpg`;
    
    // Initialize organization schema
    this.organizationData = this.generateOrganizationSchema();
  }

  /**
   * Generate Organization schema
   */
  generateOrganizationSchema(): WithContext<Organization> {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${this.baseUrl}#organization`,
      name: this.organizationName,
      url: this.baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: this.organizationLogo,
        width: '600',
        height: '60'
      },
      description: 'Leading provider of Forex Expert Advisors, MT4/MT5 trading robots, and automated trading systems',
      sameAs: [
        'https://twitter.com/forexfactory',
        'https://facebook.com/forexfactory',
        'https://linkedin.com/company/forexfactory',
        'https://youtube.com/forexfactory'
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+1-555-0123',
        contactType: 'customer service',
        email: 'support@forexfactory.cc',
        areaServed: 'Worldwide',
        availableLanguage: ['English', 'Spanish', 'German', 'French']
      },
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'US'
      },
      founder: {
        '@type': 'Person',
        name: 'ForexFactory Team'
      }
    };
  }

  /**
   * Generate BlogPosting schema for blog posts
   */
  generateBlogPostingSchema(blog: Blog, author?: string, categoryName?: string): WithContext<BlogPosting> {
    const schema: WithContext<BlogPosting> = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      '@id': `${this.baseUrl}/blog/${blog.seoSlug}#article`,
      headline: blog.title,
      name: blog.title,
      description: this.truncateText(blog.content, 160),
      url: `${this.baseUrl}/blog/${blog.seoSlug}`,
      datePublished: blog.createdAt.toISOString(),
      dateModified: blog.createdAt.toISOString(),
      author: {
        '@type': 'Person',
        name: author || blog.author,
        url: `${this.baseUrl}/author/${(author || blog.author).toLowerCase().replace(/\s+/g, '-')}`
      },
      publisher: {
        '@type': 'Organization',
        '@id': `${this.baseUrl}#organization`,
        name: this.organizationName,
        logo: {
          '@type': 'ImageObject',
          url: this.organizationLogo
        }
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${this.baseUrl}/blog/${blog.seoSlug}`
      },
      image: blog.featuredImage ? {
        '@type': 'ImageObject',
        url: `${this.baseUrl}${blog.featuredImage}`,
        width: '1200',
        height: '630'
      } : {
        '@type': 'ImageObject',
        url: this.defaultImage,
        width: '1200',
        height: '630'
      },
      articleBody: blog.content,
      wordCount: blog.content.split(/\s+/).length,
      keywords: blog.tags,
      articleSection: categoryName || 'Forex Trading',
      inLanguage: 'en-US'
    };

    // Add comments count if available
    if (blog.views && blog.views > 0) {
      schema.interactionStatistic = {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/ViewAction',
        userInteractionCount: blog.views.toString()
      };
    }

    return schema;
  }

  /**
   * Generate BreadcrumbList schema
   */
  generateBreadcrumbSchema(items: Array<{ name: string; url: string }>): WithContext<BreadcrumbList> {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      '@id': `${this.baseUrl}#breadcrumb`,
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url.startsWith('http') ? item.url : `${this.baseUrl}${item.url}`
      } as ListItem))
    };
  }

  /**
   * Generate FAQPage schema
   */
  generateFAQSchema(faqs: Array<{ question: string; answer: string }>): WithContext<FAQPage> {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${this.baseUrl}#faq`,
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      } as Question))
    };
  }

  /**
   * Generate SoftwareApplication schema for EA/indicators
   */
  generateSoftwareApplicationSchema(signal: Signal): WithContext<SoftwareApplication> {
    const schema: WithContext<SoftwareApplication> = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      '@id': `${this.baseUrl}/signals/${signal.uuid}#software`,
      name: signal.title,
      description: signal.description,
      applicationCategory: 'FinanceApplication',
      applicationSubCategory: 'Trading Robot',
      operatingSystem: `MetaTrader ${signal.platform}`,
      softwareVersion: signal.version || '1.0',
      datePublished: signal.createdAt.toISOString(),
      dateModified: signal.createdAt.toISOString(),
      publisher: {
        '@type': 'Organization',
        '@id': `${this.baseUrl}#organization`
      },
      offers: {
        '@type': 'Offer',
        price: signal.isPremium && signal.price ? signal.price.toString() : '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: `${this.baseUrl}/signals/${signal.uuid}`,
        seller: {
          '@type': 'Organization',
          '@id': `${this.baseUrl}#organization`
        }
      },
      softwareRequirements: signal.requirements || `MetaTrader ${signal.platform} platform`,
      downloadUrl: signal.filePath ? `${this.baseUrl}/download/${signal.uuid}` : undefined,
      fileSize: signal.sizeBytes ? `${(signal.sizeBytes / 1024 / 1024).toFixed(2)}MB` : undefined
    };

    // Add aggregate rating if available
    if (signal.rating && Number(signal.rating) > 0) {
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: signal.rating.toString(),
        bestRating: '5',
        worstRating: '1',
        ratingCount: signal.downloadCount || 1
      };
    }

    // Add screenshots if available
    if (signal.screenshots) {
      try {
        const screenshots = JSON.parse(signal.screenshots);
        if (Array.isArray(screenshots) && screenshots.length > 0) {
          schema.screenshot = screenshots.slice(0, 3).map(screenshot => ({
            '@type': 'ImageObject',
            url: `${this.baseUrl}${screenshot}`,
            caption: `${signal.title} Screenshot`
          }));
        }
      } catch (e) {
        // Invalid JSON, skip
      }
    }

    // Add feature list if available
    if (signal.features) {
      try {
        const features = JSON.parse(signal.features);
        if (Array.isArray(features)) {
          schema.featureList = features.join(', ');
        }
      } catch (e) {
        // Invalid JSON, skip
      }
    }

    // Add performance metrics as additional properties
    const additionalProperties: any = {};
    if (signal.winRate) additionalProperties.winRate = `${signal.winRate}%`;
    if (signal.profitFactor) additionalProperties.profitFactor = signal.profitFactor.toString();
    if (signal.maxDrawdown) additionalProperties.maxDrawdown = `${signal.maxDrawdown}%`;
    
    if (Object.keys(additionalProperties).length > 0) {
      schema.additionalProperty = Object.entries(additionalProperties).map(([name, value]) => ({
        '@type': 'PropertyValue',
        name,
        value
      }));
    }

    return schema;
  }

  /**
   * Generate Product schema (alternative for signals)
   */
  generateProductSchema(signal: Signal): WithContext<Product> {
    const schema: WithContext<Product> = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': `${this.baseUrl}/signals/${signal.uuid}#product`,
      name: signal.title,
      description: signal.description,
      category: 'Trading Software',
      brand: {
        '@type': 'Brand',
        name: this.organizationName
      },
      manufacturer: {
        '@type': 'Organization',
        '@id': `${this.baseUrl}#organization`
      },
      offers: {
        '@type': 'Offer',
        price: signal.isPremium && signal.price ? signal.price.toString() : '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: `${this.baseUrl}/signals/${signal.uuid}`,
        priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        seller: {
          '@type': 'Organization',
          '@id': `${this.baseUrl}#organization`
        }
      },
      sku: signal.uuid,
      mpn: signal.uuid
    };

    // Add image if screenshots available
    if (signal.screenshots) {
      try {
        const screenshots = JSON.parse(signal.screenshots);
        if (Array.isArray(screenshots) && screenshots.length > 0) {
          schema.image = screenshots.slice(0, 3).map(screenshot => 
            `${this.baseUrl}${screenshot}`
          );
        }
      } catch (e) {
        // Invalid JSON, skip
      }
    }

    // Add aggregate rating if available
    if (signal.rating && Number(signal.rating) > 0) {
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: signal.rating.toString(),
        bestRating: '5',
        worstRating: '1',
        reviewCount: signal.downloadCount || 1
      };
    }

    // Add review schema if rating exists
    if (signal.rating && Number(signal.rating) > 0 && signal.downloadCount && signal.downloadCount > 0) {
      schema.review = [{
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: signal.rating.toString(),
          bestRating: '5'
        },
        author: {
          '@type': 'Organization',
          name: 'ForexFactory Users'
        }
      }];
    }

    return schema;
  }

  /**
   * Generate WebPage schema
   */
  generateWebPageSchema(
    title: string,
    description: string,
    url: string,
    breadcrumbs?: Array<{ name: string; url: string }>
  ): WithContext<WebPage> {
    const schema: WithContext<WebPage> = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url: url,
      name: title,
      description: description,
      publisher: {
        '@type': 'Organization',
        '@id': `${this.baseUrl}#organization`
      },
      inLanguage: 'en-US',
      datePublished: new Date().toISOString(),
      dateModified: new Date().toISOString()
    };

    // Add breadcrumbs if provided
    if (breadcrumbs && breadcrumbs.length > 0) {
      schema.breadcrumb = {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`
      };
    }

    return schema;
  }

  /**
   * Generate collection page schema (for category/archive pages)
   */
  generateCollectionPageSchema(
    title: string,
    description: string,
    url: string,
    items: Array<{ name: string; url: string; description?: string }>
  ): WithContext<Thing> {
    return {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': `${url}#collection`,
      name: title,
      description: description,
      url: url,
      publisher: {
        '@type': 'Organization',
        '@id': `${this.baseUrl}#organization`
      },
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          url: item.url.startsWith('http') ? item.url : `${this.baseUrl}${item.url}`,
          description: item.description
        }))
      }
    };
  }

  /**
   * Generate JSON-LD script tag
   */
  generateScriptTag(schema: WithContext<Thing>): string {
    return `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`;
  }

  /**
   * Generate multiple schemas for a page
   */
  generateMultipleSchemas(schemas: WithContext<Thing>[]): string {
    return schemas
      .map(schema => this.generateScriptTag(schema))
      .join('\n');
  }

  /**
   * Generate schema for blog post page
   */
  async generateBlogPageSchemas(blog: Blog): Promise<string> {
    const schemas: WithContext<Thing>[] = [];
    
    // Get category name if available
    let categoryName = 'Forex Trading';
    if (blog.categoryId) {
      try {
        const category = await storage.getCategoryById(blog.categoryId);
        if (category) {
          categoryName = category.name;
        }
      } catch (error) {
        console.error('Error fetching category:', error);
      }
    }

    // Add BlogPosting schema
    schemas.push(this.generateBlogPostingSchema(blog, blog.author, categoryName));

    // Add BreadcrumbList schema
    schemas.push(this.generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Blog', url: '/blog' },
      { name: categoryName, url: `/category/${categoryName.toLowerCase().replace(/\s+/g, '-')}` },
      { name: blog.title, url: `/blog/${blog.seoSlug}` }
    ]));

    // Add Organization schema
    schemas.push(this.organizationData);

    return this.generateMultipleSchemas(schemas);
  }

  /**
   * Generate schema for signal/EA page
   */
  async generateSignalPageSchemas(signal: Signal): Promise<string> {
    const schemas: WithContext<Thing>[] = [];

    // Add SoftwareApplication schema
    schemas.push(this.generateSoftwareApplicationSchema(signal));

    // Also add Product schema for better e-commerce visibility
    schemas.push(this.generateProductSchema(signal));

    // Add BreadcrumbList schema
    schemas.push(this.generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Signals', url: '/signals' },
      { name: signal.platform || 'MT4/MT5', url: `/signals?platform=${signal.platform}` },
      { name: signal.title, url: `/signals/${signal.uuid}` }
    ]));

    // Add Organization schema
    schemas.push(this.organizationData);

    return this.generateMultipleSchemas(schemas);
  }

  /**
   * Generate schema for homepage
   */
  generateHomePageSchemas(): string {
    const schemas: WithContext<Thing>[] = [];

    // Add Organization schema
    schemas.push(this.organizationData);

    // Add WebPage schema
    schemas.push(this.generateWebPageSchema(
      'ForexFactory.cc - Best Forex Expert Advisors & Trading Robots',
      'Download professional MT4/MT5 Expert Advisors, trading robots, and automated trading systems. Boost your forex trading with our tested EAs.',
      this.baseUrl
    ));

    // Add FAQ schema for common questions
    schemas.push(this.generateFAQSchema([
      {
        question: 'What is a Forex Expert Advisor (EA)?',
        answer: 'A Forex Expert Advisor is an automated trading program that runs on MetaTrader platforms (MT4/MT5) and executes trades automatically based on programmed strategies.'
      },
      {
        question: 'How do I install an Expert Advisor?',
        answer: 'Download the EA file, open your MetaTrader platform, go to File > Open Data Folder, navigate to MQL4/Experts (or MQL5/Experts), paste the EA file, restart MetaTrader, and attach the EA to a chart.'
      },
      {
        question: 'Are the Expert Advisors free?',
        answer: 'We offer both free and premium Expert Advisors. Free EAs can be downloaded immediately, while premium EAs require a one-time purchase for lifetime access.'
      },
      {
        question: 'Do Expert Advisors work on demo accounts?',
        answer: 'Yes, all our Expert Advisors work on both demo and live accounts. We recommend testing on a demo account first before using on a live account.'
      },
      {
        question: 'What is the minimum deposit required?',
        answer: 'The minimum deposit varies by EA and broker, but most of our EAs can work with as little as $100-$500. Check each EA description for specific requirements.'
      }
    ]));

    return this.generateMultipleSchemas(schemas);
  }

  /**
   * Helper function to truncate text
   */
  private truncateText(text: string, maxLength: number): string {
    const stripped = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (stripped.length <= maxLength) return stripped;
    return stripped.substring(0, maxLength - 3) + '...';
  }
}

// Export singleton instance
export const structuredDataGenerator = new StructuredDataGenerator();