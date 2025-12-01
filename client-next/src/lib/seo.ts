export const SITE_URL = "https://forexfactory.cc";
export const SITE_NAME = "ForexFactory.cc";
export const SITE_TAGLINE = "Best Forex Robots, EA Trading & MT4/MT5 Expert Advisors";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export interface MetaTags {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  robots?: string;
  author?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  ogUrl?: string;
  twitterCard?: string;
  twitterSite?: string;
  twitterCreator?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  structuredData?: any;
}

export interface ArticleSchemaProps {
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  author: string;
  image?: string;
  url: string;
}

export interface SoftwareAppSchemaProps {
  name: string;
  description: string;
  applicationCategory: string;
  operatingSystem: string;
  softwareVersion: string;
  downloadUrl: string;
  fileSize?: string;
  datePublished: string;
  dateModified?: string;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface SEOScore {
  score: number;
  issues: string[];
  suggestions: string[];
}

export function generateCanonicalUrl(path: string): string {
  if (!path) return SITE_URL;
  const cleanPath = path.replace(/\/$/, '').split('?')[0];
  return `${SITE_URL}${cleanPath}`;
}

export function generateMetaTags({
  title,
  description,
  keywords,
  canonical,
  robots = 'index, follow',
  author = SITE_NAME,
  ogTitle,
  ogDescription,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  ogUrl,
  twitterCard = 'summary_large_image',
  twitterSite = '@forexfactorycc',
  twitterCreator = '@forexfactorycc',
  twitterTitle,
  twitterDescription,
  twitterImage,
  structuredData
}: MetaTags): string[] {
  const tags: string[] = [];
  tags.push(`<title>${title}</title>`);
  tags.push(`<meta name="description" content="${description}" />`);
  if (keywords) tags.push(`<meta name="keywords" content="${keywords}" />`);
  tags.push(`<meta name="robots" content="${robots}" />`);
  tags.push(`<meta name="author" content="${author}" />`);
  if (canonical) tags.push(`<link rel="canonical" href="${canonical}" />`);
  tags.push(`<meta property="og:title" content="${ogTitle || title}" />`);
  tags.push(`<meta property="og:description" content="${ogDescription || description}" />`);
  tags.push(`<meta property="og:image" content="${ogImage}" />`);
  tags.push(`<meta property="og:type" content="${ogType}" />`);
  tags.push(`<meta property="og:site_name" content="${SITE_NAME}" />`);
  if (ogUrl) tags.push(`<meta property="og:url" content="${ogUrl}" />`);
  tags.push(`<meta name="twitter:card" content="${twitterCard}" />`);
  tags.push(`<meta name="twitter:site" content="${twitterSite}" />`);
  tags.push(`<meta name="twitter:creator" content="${twitterCreator}" />`);
  tags.push(`<meta name="twitter:title" content="${twitterTitle || title}" />`);
  tags.push(`<meta name="twitter:description" content="${twitterDescription || description}" />`);
  tags.push(`<meta name="twitter:image" content="${twitterImage || ogImage}" />`);
  if (structuredData) {
    tags.push(`<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`);
  }
  return tags;
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: 'Leading provider of free Forex Expert Advisors (EA), MT4/MT5 indicators, and automated trading solutions',
    sameAs: [
      'https://twitter.com/forexfactorycc',
      'https://facebook.com/forexfactorycc',
      'https://linkedin.com/company/forexfactorycc'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@forexfactory.cc',
      availableLanguage: ['English']
    }
  };
}

export function generateArticleSchema({
  title,
  description,
  datePublished,
  dateModified,
  author,
  image,
  url
}: ArticleSchemaProps) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Person',
      name: author
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`
      }
    },
    image: image || DEFAULT_OG_IMAGE,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url
    }
  };
}

export function generateSoftwareApplicationSchema({
  name,
  description,
  applicationCategory,
  operatingSystem,
  softwareVersion,
  downloadUrl,
  fileSize,
  datePublished,
  dateModified,
  aggregateRating
}: SoftwareAppSchemaProps) {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    description,
    applicationCategory,
    operatingSystem,
    softwareVersion,
    downloadUrl,
    datePublished,
    dateModified: dateModified || datePublished,
    provider: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    }
  };
  if (fileSize) schema.fileSize = fileSize;
  if (aggregateRating) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: aggregateRating.ratingValue,
      reviewCount: aggregateRating.reviewCount,
      bestRating: 5,
      worstRating: 1
    };
  }
  return schema;
}

export function generateFAQPageSchema(faqItems: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  };
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
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

export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_TAGLINE,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };
}

export function calculateKeywordDensity(text: string, keyword: string): number {
  const words = text.toLowerCase().split(/\s+/);
  const keywordCount = words.filter(word => word === keyword.toLowerCase()).length;
  const density = (keywordCount / words.length) * 100;
  return parseFloat(density.toFixed(2));
}

export function optimizeKeywordDensity(text: string, keyword: string, targetDensity: number = 2.5): string {
  const currentDensity = calculateKeywordDensity(text, keyword);
  if (currentDensity >= targetDensity - 0.5 && currentDensity <= targetDensity + 0.5) {
    return text;
  }
  return text;
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function optimizeTitle(title: string, keyword: string, maxLength: number = 60): string {
  if (!title.toLowerCase().includes(keyword.toLowerCase())) {
    title = `${keyword} - ${title}`;
  }
  if (title.length > maxLength) {
    title = title.substring(0, maxLength - 3) + '...';
  }
  return title;
}

export function optimizeMetaDescription(description: string, keyword: string, maxLength: number = 160): string {
  if (!description.toLowerCase().includes(keyword.toLowerCase())) {
    description = `${keyword} - ${description}`;
  }
  if (description.length > maxLength) {
    description = description.substring(0, maxLength - 3) + '...';
  }
  return description;
}

export function generateSemanticKeywords(primaryKeyword: string): string[] {
  const semanticMap: Record<string, string[]> = {
    'forex ea': ['expert advisor', 'automated trading', 'trading robot', 'MT4 EA', 'MT5 EA', 'forex bot'],
    mt4: ['metatrader 4', 'MT4 platform', 'MT4 terminal', 'MT4 indicators', 'MT4 trading'],
    mt5: ['metatrader 5', 'MT5 platform', 'MT5 terminal', 'MT5 indicators', 'MT5 trading'],
    'forex trading': ['currency trading', 'FX trading', 'foreign exchange', 'forex market', 'trading strategies'],
    'expert advisor': ['EA trading', 'automated strategy', 'trading algorithm', 'forex automation', 'trading bot'],
    'forex robot': ['trading robot', 'automated forex', 'algo trading', 'forex bot', 'robotic trading'],
    mql5: ['MQL5 programming', 'MQL5 code', 'MQL5 development', 'MQL5 scripts', 'MQL5 indicators'],
    'automated trading': ['algorithmic trading', 'algo trading', 'systematic trading', 'bot trading', 'auto trading']
  };
  const lower = primaryKeyword.toLowerCase();
  return semanticMap[lower] || [];
}

export function extractKeywords(text: string, limit: number = 10): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
  ]);
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));
  const freq: Record<string, number> = {};
  words.forEach(word => {
    freq[word] = (freq[word] || 0) + 1;
  });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

export function analyzeSEO(content: {
  title: string;
  description: string;
  body: string;
  keyword: string;
}): SEOScore {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;
  if (content.title.length < 30) {
    issues.push('Title is too short (< 30 characters)');
    score -= 10;
  }
  if (content.title.length > 60) {
    issues.push('Title is too long (> 60 characters)');
    score -= 10;
  }
  if (!content.title.toLowerCase().includes(content.keyword.toLowerCase())) {
    issues.push('Primary keyword not in title');
    score -= 15;
  }
  if (content.description.length < 120) {
    issues.push('Meta description is too short (< 120 characters)');
    score -= 10;
  }
  if (content.description.length > 160) {
    issues.push('Meta description is too long (> 160 characters)');
    score -= 10;
  }
  if (!content.description.toLowerCase().includes(content.keyword.toLowerCase())) {
    issues.push('Primary keyword not in meta description');
    score -= 10;
  }
  const wordCount = content.body.split(/\s+/).length;
  if (wordCount < 300) {
    issues.push('Content is too short (< 300 words)');
    score -= 15;
  }
  const density = calculateKeywordDensity(content.body, content.keyword);
  if (density < 1) {
    issues.push('Keyword density too low (< 1%)');
    suggestions.push('Add more instances of your primary keyword naturally');
    score -= 10;
  } else if (density > 3) {
    issues.push('Keyword density too high (> 3%)');
    suggestions.push('Reduce keyword stuffing for better readability');
    score -= 15;
  }
  if (score >= 90) {
    suggestions.push('Your content is well-optimized!');
  } else if (score >= 70) {
    suggestions.push('Good SEO foundation, minor improvements needed');
  } else {
    suggestions.push('Consider reviewing SEO best practices');
  }
  return { score: Math.max(0, score), issues, suggestions };
}
