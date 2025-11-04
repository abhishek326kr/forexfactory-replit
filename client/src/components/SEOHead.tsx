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
  breadcrumbs
}: SEOHeadProps) {
  const siteUrl = 'https://forexfactory.cc';
  const siteName = 'ForexFactory.cc';
  const defaultOgImage = `${siteUrl}/og-image.png`;
  
  const canonicalUrl = canonical || (path ? generateCanonicalUrl(path) : siteUrl);
  const fullTitle = `${title} | ${siteName}`;
  
  // Generate structured data
  const jsonLdData = [];
  
  // Always include website schema
  jsonLdData.push(generateWebsiteSchema());
  
  // Add organization schema on homepage
  if (path === '/' || path === '') {
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
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Robots Meta Tag */}
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
      <meta name="googlebot" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
      
      {/* Author and Publisher */}
      <meta name="author" content={author} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage || defaultOgImage} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_US" />
      
      {/* Article specific Open Graph tags */}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && ogType === 'article' && <meta property="article:author" content={author} />}
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImage || defaultOgImage} />
      <meta property="twitter:site" content="@forexfactorycc" />
      <meta property="twitter:creator" content="@forexfactorycc" />
      
      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="English" />
      
      {/* JSON-LD Structured Data */}
      {jsonLdData.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLdData.length === 1 ? jsonLdData[0] : jsonLdData)}
        </script>
      )}
    </Helmet>
  );
}