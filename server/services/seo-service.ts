import type { 
  Article, 
  Organization, 
  FAQPage, 
  BreadcrumbList,
  WebPage,
  Product,
  Review,
  AggregateRating,
  Thing,
  WithContext
} from 'schema-dts';
import compromise from 'compromise';
import { unified } from 'unified';
import retext from 'retext-english';
import retextReadability from 'retext-readability';
import type { Blog, Signal } from '@shared/schema';

interface SeoMetadata {
  title: string;
  description: string;
  keywords: string[];
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterCreator?: string;
  robots?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

interface SchemaOptions {
  type: 'article' | 'organization' | 'faq' | 'breadcrumb' | 'product' | 'webpage' | 'review';
  data: any;
}

interface ContentAnalysis {
  readabilityScore: number;
  readingTime: number;
  sentenceCount: number;
  wordCount: number;
  keywordDensity: Record<string, number>;
  suggestions: string[];
}

class SeoService {
  private organizationData: WithContext<Organization> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Forex EA Hub',
    url: 'https://forexeahub.com',
    logo: 'https://forexeahub.com/logo.png',
    sameAs: [
      'https://twitter.com/forexeahub',
      'https://facebook.com/forexeahub',
      'https://linkedin.com/company/forexeahub'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-555-123-4567',
      contactType: 'customer service',
      areaServed: 'Worldwide',
      availableLanguage: ['English']
    }
  };

  /**
   * Generate Article schema markup
   */
  generateArticleSchema(blog: Blog, author?: string): WithContext<Article> {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: blog.title,
      description: blog.content.substring(0, 160),
      image: blog.featuredImage || undefined,
      author: {
        '@type': 'Person',
        name: author || blog.author
      },
      publisher: this.organizationData as Organization,
      datePublished: blog.createdAt.toISOString(),
      dateModified: blog.createdAt.toISOString(),
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://forexeahub.com/blog/${blog.seoSlug}`
      }
    };
  }

  /**
   * Generate Organization schema markup
   */
  generateOrganizationSchema(): WithContext<Organization> {
    return this.organizationData;
  }

  /**
   * Generate FAQ schema markup
   */
  generateFAQSchema(faqs: Array<{ question: string; answer: string }>): WithContext<FAQPage> {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    };
  }

  /**
   * Generate BreadcrumbList schema markup
   */
  generateBreadcrumbSchema(
    items: Array<{ name: string; url: string }>
  ): WithContext<BreadcrumbList> {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url
      }))
    };
  }

  /**
   * Generate Product schema markup for EA/Indicator downloads
   */
  generateProductSchema(signal: Signal): WithContext<Product> {
    // Parse screenshots JSON if available for image
    let productImage: string | undefined;
    if (signal.screenshots) {
      try {
        const screenshots = JSON.parse(signal.screenshots);
        productImage = Array.isArray(screenshots) ? screenshots[0] : undefined;
      } catch {
        productImage = undefined;
      }
    }

    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: signal.title,
      description: signal.description,
      image: productImage,
      brand: {
        '@type': 'Brand',
        name: 'Forex EA Hub'
      },
      offers: {
        '@type': 'Offer',
        price: signal.isPremium ? signal.price?.toString() || '0' : '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: `https://forexeahub.com/download/${signal.uuid}`,
        seller: this.organizationData as Organization
      },
      aggregateRating: signal.rating && Number(signal.rating) > 0 ? {
        '@type': 'AggregateRating',
        ratingValue: signal.rating.toString(),
        reviewCount: signal.downloadCount || 0
      } : undefined
    };
  }

  /**
   * Dynamic JSON-LD builder based on content type
   */
  buildJSONLD(options: SchemaOptions): string {
    let schema: WithContext<Thing>;

    switch (options.type) {
      case 'article':
        schema = this.generateArticleSchema(options.data.blog, options.data.author);
        break;
      case 'organization':
        schema = this.generateOrganizationSchema();
        break;
      case 'faq':
        schema = this.generateFAQSchema(options.data.faqs);
        break;
      case 'breadcrumb':
        schema = this.generateBreadcrumbSchema(options.data.items);
        break;
      case 'product':
        schema = this.generateProductSchema(options.data.signal);
        break;
      case 'webpage':
        schema = {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: options.data.title,
          description: options.data.description,
          url: options.data.url,
          publisher: this.organizationData as Organization
        };
        break;
      default:
        schema = this.generateOrganizationSchema();
    }

    return `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`;
  }

  /**
   * Generate SEO metadata for a page
   */
  generateMetadata(options: {
    title: string;
    description: string;
    image?: string;
    type?: string;
    author?: string;
    publishedTime?: string;
    modifiedTime?: string;
    canonical?: string;
    keywords?: string[];
  }): SeoMetadata {
    const baseUrl = process.env.SITE_URL || 'https://forexeahub.com';
    
    return {
      title: this.optimizeTitle(options.title),
      description: this.optimizeDescription(options.description),
      keywords: options.keywords || this.extractKeywords(options.description),
      canonical: options.canonical || `${baseUrl}${options.canonical}`,
      ogTitle: options.title,
      ogDescription: options.description,
      ogImage: options.image || `${baseUrl}/og-default.jpg`,
      ogType: options.type || 'website',
      twitterCard: options.image ? 'summary_large_image' : 'summary',
      twitterTitle: options.title,
      twitterDescription: options.description,
      twitterImage: options.image || `${baseUrl}/og-default.jpg`,
      twitterCreator: '@forexeahub',
      robots: 'index, follow',
      author: options.author,
      publishedTime: options.publishedTime,
      modifiedTime: options.modifiedTime
    };
  }

  /**
   * Optimize title for SEO (60-70 characters)
   */
  private optimizeTitle(title: string): string {
    const suffix = ' | Forex EA Hub';
    const maxLength = 60;
    
    if (title.length + suffix.length <= maxLength) {
      return title + suffix;
    }
    
    const truncatedTitle = title.substring(0, maxLength - suffix.length - 3) + '...';
    return truncatedTitle + suffix;
  }

  /**
   * Optimize description for SEO (150-160 characters)
   */
  private optimizeDescription(description: string): string {
    const maxLength = 160;
    
    if (description.length <= maxLength) {
      return description;
    }
    
    const truncated = description.substring(0, maxLength - 3);
    const lastSpace = truncated.lastIndexOf(' ');
    return truncated.substring(0, lastSpace) + '...';
  }

  /**
   * Extract keywords from content using NLP
   */
  extractKeywords(content: string, maxKeywords: number = 10): string[] {
    const doc = compromise(content);
    
    // Extract nouns and noun phrases
    const nouns = doc.nouns().out('array');
    const nounPhrases = doc.match('#Adjective+ #Noun+').out('array');
    
    // Combine and count frequency
    const allTerms = [...nouns, ...nounPhrases];
    const termFrequency: Record<string, number> = {};
    
    allTerms.forEach(term => {
      const normalized = term.toLowerCase().trim();
      if (normalized.length > 2) {
        termFrequency[normalized] = (termFrequency[normalized] || 0) + 1;
      }
    });
    
    // Sort by frequency and return top keywords
    return Object.entries(termFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxKeywords)
      .map(([term]) => term);
  }

  /**
   * Analyze content readability and provide suggestions
   */
  async analyzeContent(content: string): Promise<ContentAnalysis> {
    const doc = compromise(content);
    const sentences = doc.sentences().out('array');
    const words = (doc as any).terms().out('array');
    
    // Calculate reading time (200 words per minute average)
    const readingTime = Math.ceil(words.length / 200);
    
    // Extract keywords for density analysis
    const keywords = this.extractKeywords(content, 20);
    const keywordDensity: Record<string, number> = {};
    
    keywords.forEach(keyword => {
      const occurrences = content.toLowerCase().split(keyword.toLowerCase()).length - 1;
      keywordDensity[keyword] = (occurrences / words.length) * 100;
    });
    
    // Analyze readability
    let readabilityScore = 0;
    const suggestions: string[] = [];
    
    try {
      const file = await unified()
        .use(retext)
        .use(retextReadability, {
          age: 16,
          minWords: 6,
          severity: 'suggestion'
        })
        .process(content);
      
      // Calculate readability score based on messages
      const messages = file.messages;
      readabilityScore = Math.max(0, 100 - (messages.length * 5));
      
      // Add readability suggestions
      messages.forEach((message: any) => {
        if (message.reason) {
          suggestions.push(message.reason);
        }
      });
    } catch (error) {
      console.error('Readability analysis error:', error);
      readabilityScore = 75; // Default score
    }
    
    // Add custom suggestions
    if (sentences.length > 0) {
      const avgWordsPerSentence = words.length / sentences.length;
      if (avgWordsPerSentence > 25) {
        suggestions.push('Consider breaking up long sentences for better readability');
      }
    }
    
    if (words.length < 300) {
      suggestions.push('Consider adding more content for better SEO performance (aim for 300+ words)');
    }
    
    // Check keyword density
    Object.entries(keywordDensity).forEach(([keyword, density]) => {
      if (density > 3) {
        suggestions.push(`Keyword "${keyword}" appears too frequently (${density.toFixed(1)}% density)`);
      }
    });
    
    return {
      readabilityScore,
      readingTime,
      sentenceCount: sentences.length,
      wordCount: words.length,
      keywordDensity,
      suggestions
    };
  }

  /**
   * Generate meta tags HTML string
   */
  generateMetaTags(metadata: SeoMetadata): string {
    const tags: string[] = [];
    
    // Basic meta tags
    tags.push(`<title>${metadata.title}</title>`);
    tags.push(`<meta name="description" content="${metadata.description}" />`);
    
    if (metadata.keywords.length > 0) {
      tags.push(`<meta name="keywords" content="${metadata.keywords.join(', ')}" />`);
    }
    
    if (metadata.author) {
      tags.push(`<meta name="author" content="${metadata.author}" />`);
    }
    
    if (metadata.robots) {
      tags.push(`<meta name="robots" content="${metadata.robots}" />`);
    }
    
    // Canonical URL
    if (metadata.canonical) {
      tags.push(`<link rel="canonical" href="${metadata.canonical}" />`);
    }
    
    // Open Graph tags
    if (metadata.ogTitle) {
      tags.push(`<meta property="og:title" content="${metadata.ogTitle}" />`);
    }
    
    if (metadata.ogDescription) {
      tags.push(`<meta property="og:description" content="${metadata.ogDescription}" />`);
    }
    
    if (metadata.ogImage) {
      tags.push(`<meta property="og:image" content="${metadata.ogImage}" />`);
    }
    
    if (metadata.ogType) {
      tags.push(`<meta property="og:type" content="${metadata.ogType}" />`);
    }
    
    // Twitter Card tags
    if (metadata.twitterCard) {
      tags.push(`<meta name="twitter:card" content="${metadata.twitterCard}" />`);
    }
    
    if (metadata.twitterTitle) {
      tags.push(`<meta name="twitter:title" content="${metadata.twitterTitle}" />`);
    }
    
    if (metadata.twitterDescription) {
      tags.push(`<meta name="twitter:description" content="${metadata.twitterDescription}" />`);
    }
    
    if (metadata.twitterImage) {
      tags.push(`<meta name="twitter:image" content="${metadata.twitterImage}" />`);
    }
    
    if (metadata.twitterCreator) {
      tags.push(`<meta name="twitter:creator" content="${metadata.twitterCreator}" />`);
    }
    
    // Article tags
    if (metadata.publishedTime) {
      tags.push(`<meta property="article:published_time" content="${metadata.publishedTime}" />`);
    }
    
    if (metadata.modifiedTime) {
      tags.push(`<meta property="article:modified_time" content="${metadata.modifiedTime}" />`);
    }
    
    return tags.join('\n');
  }
}

// Export singleton instance and class
export const seoService = new SeoService();
export { SeoService };

// Export types for use in other modules
export type { SeoMetadata, SchemaOptions, ContentAnalysis };