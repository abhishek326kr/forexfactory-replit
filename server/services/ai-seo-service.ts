import OpenAI from 'openai';
import { SeoService } from './seo-service';
// Note: htmlparser2 not needed for current implementation
import type { Blog, Signal } from '@shared/schema';

interface MetaGenerationOptions {
  content: string;
  title?: string;
  targetKeywords?: string[];
  contentType?: 'blog' | 'product' | 'page';
  tone?: 'professional' | 'casual' | 'technical';
  maxLength?: {
    title?: number;
    description?: number;
  };
}

interface SEOAnalysis {
  score: number;
  suggestions: Array<{
    category: 'critical' | 'important' | 'nice-to-have';
    issue: string;
    recommendation: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  keywordAnalysis: {
    primaryKeywords: string[];
    semanticKeywords: string[];
    density: Record<string, number>;
    recommendations: string[];
  };
  contentQuality: {
    readabilityScore: number;
    wordCount: number;
    averageSentenceLength: number;
    paragraphCount: number;
    headingStructure: string[];
  };
  technicalSEO: {
    metaTitle: boolean;
    metaDescription: boolean;
    headings: boolean;
    images: number;
    imagesWithAlt: number;
    internalLinks: number;
    externalLinks: number;
  };
}

interface ContentOptimizationSuggestion {
  type: 'structure' | 'keyword' | 'readability' | 'technical';
  priority: 'high' | 'medium' | 'low';
  currentValue?: string;
  suggestedValue?: string;
  explanation: string;
}

class AISeoService {
  private openai: OpenAI | null = null;
  private seoService: SeoService;
  private initialized = false;

  constructor() {
    this.seoService = new SeoService();
    this.initialize();
  }

  /**
   * Initialize OpenAI client
   */
  private initialize(): void {
    if (this.initialized) return;

    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.initialized = true;
      console.log('✅ AI SEO Service initialized with OpenAI');
    } else {
      console.warn('⚠️ OpenAI API key not configured. AI features will be unavailable.');
    }
  }

  /**
   * Generate SEO-optimized meta tags using AI
   */
  async generateMetaTags(options: MetaGenerationOptions): Promise<{
    title: string;
    description: string;
    keywords: string[];
    ogTitle?: string;
    ogDescription?: string;
  }> {
    // Fallback to non-AI generation if OpenAI is not available
    if (!this.openai) {
      return this.generateMetaTagsFallback(options);
    }

    try {
      const prompt = this.buildMetaGenerationPrompt(options);
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert SEO specialist specializing in forex trading, Expert Advisors (EAs), and financial technology content. Generate optimized meta tags that improve search rankings and click-through rates.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      });

      const response = JSON.parse(completion.choices[0].message.content || '{}');

      // Validate and format response
      return {
        title: this.truncateTitle(response.title || options.title || 'Untitled', options.maxLength?.title),
        description: this.truncateDescription(response.description || '', options.maxLength?.description),
        keywords: response.keywords || [],
        ogTitle: response.ogTitle || response.title,
        ogDescription: response.ogDescription || response.description
      };
    } catch (error) {
      console.error('AI meta generation failed:', error);
      return this.generateMetaTagsFallback(options);
    }
  }

  /**
   * Generate alt text for images using AI
   */
  async generateAltText(
    imageContext: {
      surroundingText?: string;
      pageTitle?: string;
      imageUrl?: string;
      currentAlt?: string;
    }
  ): Promise<string> {
    if (!this.openai) {
      return this.generateAltTextFallback(imageContext);
    }

    try {
      const prompt = `Generate descriptive, SEO-friendly alt text for an image in a forex trading/EA context.
      
      Context:
      - Page title: ${imageContext.pageTitle || 'Forex EA page'}
      - Surrounding text: ${imageContext.surroundingText?.substring(0, 200) || 'N/A'}
      - Current alt (if any): ${imageContext.currentAlt || 'None'}
      
      Requirements:
      - Be descriptive but concise (under 125 characters)
      - Include relevant keywords naturally
      - Describe what's in the image (assume it's related to forex/trading)
      - Don't start with "Image of" or "Picture of"
      
      Return only the alt text, nothing else.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 50
      });

      return completion.choices[0].message.content?.trim() || 
             this.generateAltTextFallback(imageContext);
    } catch (error) {
      console.error('AI alt text generation failed:', error);
      return this.generateAltTextFallback(imageContext);
    }
  }

  /**
   * Analyze content and provide SEO recommendations
   */
  async analyzeContentSEO(
    content: string,
    metadata?: {
      title?: string;
      description?: string;
      keywords?: string[];
      url?: string;
    }
  ): Promise<SEOAnalysis> {
    const baseAnalysis = await this.performBasicAnalysis(content, metadata);

    if (!this.openai) {
      return baseAnalysis;
    }

    try {
      // Use AI to enhance analysis with deeper insights
      const aiPrompt = `Analyze this forex/EA content for SEO optimization:

      Content (first 1000 chars): ${content.substring(0, 1000)}
      Title: ${metadata?.title || 'No title'}
      Description: ${metadata?.description || 'No description'}
      Target Keywords: ${metadata?.keywords?.join(', ') || 'No keywords specified'}
      
      Provide a JSON response with:
      1. Top 5 SEO improvements (with category: critical/important/nice-to-have)
      2. Keyword recommendations (primary and semantic)
      3. Content structure suggestions
      4. Technical SEO issues
      
      Focus on forex trading and EA-specific optimizations.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an SEO expert for forex trading and Expert Advisor content.'
          },
          {
            role: 'user',
            content: aiPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: 'json_object' }
      });

      const aiInsights = JSON.parse(completion.choices[0].message.content || '{}');

      // Merge AI insights with base analysis
      return {
        ...baseAnalysis,
        suggestions: [
          ...baseAnalysis.suggestions,
          ...(aiInsights.improvements || []).map((imp: any) => ({
            category: imp.category || 'nice-to-have',
            issue: imp.issue,
            recommendation: imp.recommendation,
            impact: imp.impact || 'medium'
          }))
        ],
        keywordAnalysis: {
          ...baseAnalysis.keywordAnalysis,
          primaryKeywords: aiInsights.primaryKeywords || baseAnalysis.keywordAnalysis.primaryKeywords,
          semanticKeywords: aiInsights.semanticKeywords || []
        }
      };
    } catch (error) {
      console.error('AI content analysis failed:', error);
      return baseAnalysis;
    }
  }

  /**
   * Generate keyword recommendations
   */
  async generateKeywordRecommendations(
    content: string,
    currentKeywords?: string[],
    competitorKeywords?: string[]
  ): Promise<{
    primary: string[];
    secondary: string[];
    longTail: string[];
    semantic: string[];
    trending: string[];
  }> {
    const baseKeywords = this.seoService.extractKeywords(content, 20);

    if (!this.openai) {
      return {
        primary: baseKeywords.slice(0, 5),
        secondary: baseKeywords.slice(5, 10),
        longTail: [],
        semantic: [],
        trending: []
      };
    }

    try {
      const prompt = `Generate keyword recommendations for forex/EA content:
      
      Content excerpt: ${content.substring(0, 500)}
      Current keywords: ${currentKeywords?.join(', ') || 'None'}
      Competitor keywords: ${competitorKeywords?.join(', ') || 'None'}
      
      Provide a JSON response with:
      - primary: 5 main keywords
      - secondary: 5 supporting keywords
      - longTail: 5 long-tail keywords (3-5 words)
      - semantic: 5 semantically related keywords
      - trending: 5 trending keywords in forex/EA space
      
      Focus on high-value, low-competition keywords relevant to forex trading and Expert Advisors.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 400,
        response_format: { type: 'json_object' }
      });

      const keywords = JSON.parse(completion.choices[0].message.content || '{}');

      return {
        primary: keywords.primary || baseKeywords.slice(0, 5),
        secondary: keywords.secondary || baseKeywords.slice(5, 10),
        longTail: keywords.longTail || [],
        semantic: keywords.semantic || [],
        trending: keywords.trending || []
      };
    } catch (error) {
      console.error('AI keyword generation failed:', error);
      return {
        primary: baseKeywords.slice(0, 5),
        secondary: baseKeywords.slice(5, 10),
        longTail: [],
        semantic: [],
        trending: []
      };
    }
  }

  /**
   * Optimize title for SEO
   */
  async optimizeTitle(
    currentTitle: string,
    options: {
      targetKeywords?: string[];
      maxLength?: number;
      contentType?: 'blog' | 'product' | 'category';
    } = {}
  ): Promise<{
    original: string;
    optimized: string;
    variations: string[];
    score: number;
  }> {
    const maxLength = options.maxLength || 60;
    const fallbackTitle = this.optimizeTitleFallback(currentTitle, options);

    if (!this.openai) {
      return fallbackTitle;
    }

    try {
      const prompt = `Optimize this title for SEO:
      
      Current title: "${currentTitle}"
      Target keywords: ${options.targetKeywords?.join(', ') || 'forex, EA, trading'}
      Content type: ${options.contentType || 'general'}
      Max length: ${maxLength} characters
      
      Provide a JSON response with:
      - optimized: The best optimized version
      - variations: 3 alternative versions
      - improvements: What was improved
      
      Requirements:
      - Include target keywords naturally
      - Make it compelling for click-through
      - Keep under ${maxLength} characters
      - Focus on forex/EA audience`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 300,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');

      return {
        original: currentTitle,
        optimized: this.truncateTitle(result.optimized || currentTitle, maxLength),
        variations: (result.variations || []).map((v: string) => 
          this.truncateTitle(v, maxLength)
        ),
        score: this.calculateTitleScore(result.optimized || currentTitle, options)
      };
    } catch (error) {
      console.error('AI title optimization failed:', error);
      return fallbackTitle;
    }
  }

  /**
   * Generate content optimization suggestions
   */
  async generateOptimizationSuggestions(
    content: string,
    currentMetadata?: {
      title?: string;
      description?: string;
      keywords?: string[];
    }
  ): Promise<ContentOptimizationSuggestion[]> {
    const suggestions: ContentOptimizationSuggestion[] = [];
    
    // Basic analysis without AI
    const wordCount = content.split(/\s+/).length;
    const hasH1 = /<h1/i.test(content) || /^#\s/m.test(content);
    const imageCount = (content.match(/<img/gi) || []).length;
    
    // Word count optimization
    if (wordCount < 300) {
      suggestions.push({
        type: 'structure',
        priority: 'high',
        currentValue: `${wordCount} words`,
        suggestedValue: '300+ words',
        explanation: 'Content should be at least 300 words for better SEO performance'
      });
    }

    // Heading structure
    if (!hasH1) {
      suggestions.push({
        type: 'structure',
        priority: 'high',
        explanation: 'Add an H1 heading to improve content structure and SEO'
      });
    }

    // Image optimization
    if (imageCount === 0) {
      suggestions.push({
        type: 'technical',
        priority: 'medium',
        explanation: 'Add relevant images to improve engagement and SEO'
      });
    }

    if (!this.openai) {
      return suggestions;
    }

    try {
      // Get AI-powered suggestions
      const prompt = `Analyze this forex/EA content and provide optimization suggestions:
      
      Content (first 1000 chars): ${content.substring(0, 1000)}
      Word count: ${wordCount}
      Current title: ${currentMetadata?.title || 'No title'}
      
      Provide 5 specific, actionable optimization suggestions in JSON format.
      Each suggestion should have:
      - type: structure/keyword/readability/technical
      - priority: high/medium/low
      - explanation: Clear explanation
      - suggestedValue: Specific recommendation (optional)
      
      Focus on forex trading and EA-specific optimizations.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      });

      const aiSuggestions = JSON.parse(completion.choices[0].message.content || '{}');
      
      if (Array.isArray(aiSuggestions.suggestions)) {
        suggestions.push(...aiSuggestions.suggestions);
      }
    } catch (error) {
      console.error('AI optimization suggestions failed:', error);
    }

    return suggestions;
  }

  // Helper methods

  private buildMetaGenerationPrompt(options: MetaGenerationOptions): string {
    return `Generate SEO-optimized meta tags for the following content:

    Content excerpt: ${options.content.substring(0, 500)}
    Current title: ${options.title || 'No title provided'}
    Target keywords: ${options.targetKeywords?.join(', ') || 'forex, EA, trading'}
    Content type: ${options.contentType || 'general'}
    Tone: ${options.tone || 'professional'}
    
    Generate a JSON response with:
    - title: SEO-optimized title (max ${options.maxLength?.title || 60} chars)
    - description: Meta description (max ${options.maxLength?.description || 160} chars)
    - keywords: Array of 5-10 relevant keywords
    - ogTitle: Open Graph title
    - ogDescription: Open Graph description
    
    Focus on forex trading, Expert Advisors, and include relevant keywords naturally.`;
  }

  private generateMetaTagsFallback(options: MetaGenerationOptions) {
    const keywords = this.seoService.extractKeywords(options.content, 10);
    const title = options.title || 'Forex EA Hub - Expert Advisors & Trading Tools';
    const description = options.content.substring(0, 160).replace(/\s+/g, ' ').trim();

    return {
      title: this.truncateTitle(title, options.maxLength?.title),
      description: this.truncateDescription(description, options.maxLength?.description),
      keywords,
      ogTitle: title,
      ogDescription: description
    };
  }

  private generateAltTextFallback(imageContext: any): string {
    if (imageContext.currentAlt) {
      return imageContext.currentAlt;
    }
    
    if (imageContext.pageTitle) {
      return `Image related to ${imageContext.pageTitle}`.substring(0, 125);
    }
    
    return 'Forex trading Expert Advisor visualization';
  }

  private async performBasicAnalysis(content: string, metadata?: any): Promise<SEOAnalysis> {
    const contentAnalysis = await this.seoService.analyzeContent(content);
    const words = content.split(/\s+/);
    const sentences = content.split(/[.!?]+/);
    const paragraphs = content.split(/\n\n+/);
    
    // Extract headings
    const headingMatches = content.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi) || [];
    const headings = headingMatches.map(h => h.replace(/<[^>]+>/g, ''));

    // Count images and links
    const images = (content.match(/<img/gi) || []).length;
    const imagesWithAlt = (content.match(/<img[^>]+alt="[^"]+"/gi) || []).length;
    const internalLinks = (content.match(/href="\/[^"]*"/gi) || []).length;
    const externalLinks = (content.match(/href="https?:\/\/[^"]*"/gi) || []).length;

    const score = this.calculateSEOScore({
      wordCount: words.length,
      hasTitle: !!metadata?.title,
      hasDescription: !!metadata?.description,
      hasKeywords: !!(metadata?.keywords?.length > 0),
      headingCount: headings.length,
      imageAltRatio: images > 0 ? imagesWithAlt / images : 0,
      readabilityScore: contentAnalysis.readabilityScore
    });

    const suggestions = [];
    
    if (words.length < 300) {
      suggestions.push({
        category: 'critical' as const,
        issue: 'Content too short',
        recommendation: 'Expand content to at least 300 words for better SEO',
        impact: 'high' as const
      });
    }

    if (!metadata?.description) {
      suggestions.push({
        category: 'critical' as const,
        issue: 'Missing meta description',
        recommendation: 'Add a compelling meta description (150-160 characters)',
        impact: 'high' as const
      });
    }

    if (images > 0 && imagesWithAlt < images) {
      suggestions.push({
        category: 'important' as const,
        issue: `${images - imagesWithAlt} images missing alt text`,
        recommendation: 'Add descriptive alt text to all images',
        impact: 'medium' as const
      });
    }

    return {
      score,
      suggestions,
      keywordAnalysis: {
        primaryKeywords: contentAnalysis.keywordDensity 
          ? Object.keys(contentAnalysis.keywordDensity).slice(0, 5) 
          : [],
        semanticKeywords: [],
        density: contentAnalysis.keywordDensity || {},
        recommendations: contentAnalysis.suggestions || []
      },
      contentQuality: {
        readabilityScore: contentAnalysis.readabilityScore,
        wordCount: words.length,
        averageSentenceLength: sentences.length > 0 ? words.length / sentences.length : 0,
        paragraphCount: paragraphs.length,
        headingStructure: headings
      },
      technicalSEO: {
        metaTitle: !!metadata?.title,
        metaDescription: !!metadata?.description,
        headings: headings.length > 0,
        images,
        imagesWithAlt,
        internalLinks,
        externalLinks
      }
    };
  }

  private calculateSEOScore(factors: any): number {
    let score = 0;
    
    // Content factors (40 points)
    if (factors.wordCount >= 300) score += 20;
    else if (factors.wordCount >= 150) score += 10;
    
    if (factors.readabilityScore >= 70) score += 20;
    else if (factors.readabilityScore >= 50) score += 10;

    // Meta factors (30 points)
    if (factors.hasTitle) score += 10;
    if (factors.hasDescription) score += 10;
    if (factors.hasKeywords) score += 10;

    // Structure factors (20 points)
    if (factors.headingCount > 0) score += 10;
    if (factors.headingCount >= 3) score += 10;

    // Technical factors (10 points)
    if (factors.imageAltRatio >= 1) score += 10;
    else if (factors.imageAltRatio >= 0.5) score += 5;

    return Math.min(100, score);
  }

  private truncateTitle(title: string, maxLength: number = 60): string {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength - 3) + '...';
  }

  private truncateDescription(description: string, maxLength: number = 160): string {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength - 3) + '...';
  }

  private optimizeTitleFallback(
    currentTitle: string, 
    options: any
  ): any {
    const optimized = this.truncateTitle(currentTitle, options.maxLength || 60);
    return {
      original: currentTitle,
      optimized,
      variations: [optimized],
      score: this.calculateTitleScore(optimized, options)
    };
  }

  private calculateTitleScore(title: string, options: any): number {
    let score = 50; // Base score
    
    // Length score
    if (title.length >= 30 && title.length <= 60) score += 20;
    else if (title.length >= 20 && title.length <= 70) score += 10;
    
    // Keyword inclusion
    if (options.targetKeywords) {
      const titleLower = title.toLowerCase();
      const keywordMatches = options.targetKeywords.filter((kw: string) => 
        titleLower.includes(kw.toLowerCase())
      );
      score += Math.min(30, keywordMatches.length * 10);
    }

    return Math.min(100, score);
  }
}

// Export singleton instance
export const aiSeoService = new AISeoService();