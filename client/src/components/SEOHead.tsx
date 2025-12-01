import { Helmet } from 'react-helmet-async';
import { 
  generateMetaTags,
  generateCanonicalUrl,
  generateOrganizationSchema,
  generateArticleSchema,
  generateSoftwareApplicationSchema,
  generateFAQPageSchema,
  generateBreadcrumbSchema,
  generateWebsiteSchema,
  type MetaTags,
  type ArticleSchemaProps,
  type SoftwareAppSchemaProps,
  type FAQItem,
  type BreadcrumbItem
} from '@/lib/seo';

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  path?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  structuredData?: any;
  noIndex?: boolean;
  articleSchema?: ArticleSchemaProps;
  softwareSchema?: SoftwareAppSchemaProps;
  faqItems?: FAQItem[];
  breadcrumbs?: BreadcrumbItem[];
  publisherName?: string;
  publisherUrl?: string;
}

export default function SEOHead({
  title,
  description,
  keywords,
  canonical,
  path = '',
  ogImage,
  ogType = 'website',
  author = 'ForexFactory.cc',
  publishedTime,
  modifiedTime,
  structuredData,
  noIndex = false,
  articleSchema,
  softwareSchema,
  faqItems,
  breadcrumbs,
  publisherName,
  publisherUrl
}: SEOHeadProps) {
  const siteUrl = 'https://forexfactory.cc';
  const siteName = 'ForexFactory.cc';
  const defaultOgImage = `${siteUrl}/og-image.png`;
  const resolvedPublisherName = publisherName || siteName;
  const resolvedPublisherUrl = publisherUrl || siteUrl;
  
  const resolvedPath = path || (typeof window !== 'undefined' ? window.location.pathname : '');
  const canonicalUrl = canonical || (resolvedPath ? generateCanonicalUrl(resolvedPath) : siteUrl);
  const metaDescription = description?.trim() || 'Download 500+ free Expert Advisors for MT4/MT5. Professional Forex robots updated daily.';
  const fullTitle = `${title} | ${siteName}`;
  
  // Generate structured data
  const jsonLdData = [];
  
  // Always include website schema
  jsonLdData.push(generateWebsiteSchema());
  
  // Add organization schema on homepage
  if (resolvedPath === '/' || resolvedPath === '') {
    jsonLdData.push(generateOrganizationSchema());
  }
  
  // Add article schema if provided
  if (articleSchema) {
    jsonLdData.push(generateArticleSchema(articleSchema));
  }
  
  // Add software application schema if provided
  if (softwareSchema) {
    jsonLdData.push(generateSoftwareApplicationSchema(softwareSchema));
  }
  
  // Add FAQ schema if provided
  if (faqItems && faqItems.length > 0) {
    jsonLdData.push(generateFAQPageSchema(faqItems));
  }
  
  // Add breadcrumb schema if provided
  if (breadcrumbs && breadcrumbs.length > 0) {
    jsonLdData.push(generateBreadcrumbSchema(breadcrumbs));
  }
  
  // Add custom structured data if provided
  if (structuredData) {
    jsonLdData.push(structuredData);
  }
  
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={metaDescription} />
      
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      <link rel="alternate" hrefLang="en" href={canonicalUrl} />
      
      {/* Robots Meta Tag */}
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
      <meta name="googlebot" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
      
      {/* Author and Publisher */}
      <meta name="author" content={author} />
      <meta name="publisher" content={resolvedPublisherName} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={ogImage || defaultOgImage} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_US" />
      
      {/* Article specific Open Graph tags */}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && ogType === 'article' && <meta property="article:author" content={author} />}
      {ogType === 'article' && (
        <meta property="article:publisher" content={resolvedPublisherUrl} />
      )}
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={metaDescription} />
      <meta property="twitter:image" content={ogImage || defaultOgImage} />
      <meta property="twitter:site" content="@forexfactorycc" />
      <meta property="twitter:creator" content="@forexfactorycc" />
      
      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="English" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      
      {/* JSON-LD Structured Data */}
      {jsonLdData.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLdData.length === 1 ? jsonLdData[0] : jsonLdData)}
        </script>
      )}
    </Helmet>
  );
}