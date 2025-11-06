// Primary Keywords (High Search Volume)
export const PRIMARY_KEYWORDS = [
  "Forex Factory",
  "MQL5",
  "MT5",
  "MT4",
  "Forex EA",
  "Expert Advisor",
  "Forex Trading",
  "Forex AI EA",
  "Forex Robot",
  "Automated Trading",
  "Best forex robots 2024",
  "MetaTrader 4",
  "MetaTrader 5"
] as const;

// Long-tail Keywords (Lower Competition, Higher Intent)
export const LONG_TAIL_KEYWORDS = [
  // EA-specific
  "free forex expert advisor download",
  "best mt4 expert advisor 2024",
  "profitable forex ea free download",
  "mt5 expert advisor programming",
  "forex robot trading software",
  "automated forex trading system",
  "forex ea generator online",
  "scalping ea mt4 free download",
  "grid trading ea mt5",
  "martingale ea forex factory",
  "hedging ea expert advisor",
  "news trading ea mt4",
  
  // Indicator-specific
  "mt4 indicators free download",
  "mt5 custom indicators",
  "forex factory calendar indicator",
  "best forex indicators 2024",
  "trend following indicators mt4",
  "volume profile indicator mt5",
  "support resistance indicator",
  "price action indicators",
  
  // Platform-specific
  "metatrader 4 expert advisor tutorial",
  "metatrader 5 automated trading",
  "mql5 programming tutorial",
  "mql4 expert advisor development",
  "forex factory market data",
  "mt4 backtesting tutorial",
  "mt5 strategy tester optimization",
  
  // Strategy-specific
  "forex scalping robot",
  "swing trading expert advisor",
  "day trading forex robot",
  "position trading ea",
  "arbitrage trading bot mt4",
  "high frequency trading ea",
  
  // Comparison/Review
  "forex robot comparison 2024",
  "expert advisor reviews",
  "best free forex ea 2024",
  "top 10 forex robots",
  "forex ea performance results",
  "profitable expert advisors list"
] as const;

// Semantic Keywords (LSI - Latent Semantic Indexing)
export const SEMANTIC_KEYWORDS: { [key: string]: string[] } = {
  "Forex EA": [
    "trading algorithm",
    "automated strategy",
    "trading bot",
    "forex automation",
    "algorithmic trading",
    "robotic trading system"
  ],
  "MT4": [
    "MetaTrader 4 platform",
    "MT4 terminal",
    "forex trading platform",
    "retail trading software",
    "MT4 broker",
    "trading charts"
  ],
  "MT5": [
    "MetaTrader 5 platform",
    "MT5 terminal",
    "multi-asset platform",
    "advanced trading platform",
    "MT5 broker",
    "trading analytics"
  ],
  "Expert Advisor": [
    "EA programming",
    "automated trading system",
    "trading robot development",
    "MQL programming",
    "forex algorithm",
    "trading strategy automation"
  ],
  "Forex Trading": [
    "currency trading",
    "foreign exchange",
    "FX market",
    "currency pairs",
    "forex market analysis",
    "trading strategies"
  ],
  "MQL5": [
    "MQL5 code",
    "MetaQuotes Language",
    "MT5 programming",
    "trading script",
    "custom indicator development",
    "strategy coding"
  ]
};

// Keyword Categories
export const KEYWORD_CATEGORIES = {
  PRODUCTS: [
    "Forex EA",
    "Expert Advisor",
    "Forex Robot",
    "Trading Bot",
    "MT4 EA",
    "MT5 EA"
  ],
  PLATFORMS: [
    "MT4",
    "MT5",
    "MetaTrader 4",
    "MetaTrader 5",
    "MQL4",
    "MQL5"
  ],
  STRATEGIES: [
    "Scalping",
    "Grid Trading",
    "Martingale",
    "Hedging",
    "News Trading",
    "Trend Following"
  ],
  FEATURES: [
    "Automated Trading",
    "Backtesting",
    "Optimization",
    "Risk Management",
    "Money Management",
    "Trade Management"
  ],
  COMPARISON: [
    "Best Forex EA",
    "Top Trading Robots",
    "EA Reviews",
    "Performance Results",
    "Profitable EA",
    "Free Download"
  ]
} as const;

// Page-specific keyword targeting
export const PAGE_KEYWORDS = {
  HOME: {
    primary: "Forex Factory",
    secondary: ["Expert Advisor", "MT4", "MT5", "Automated Trading"],
    density: 2.5
  },
  BLOG: {
    primary: "Forex Trading",
    secondary: ["Trading Strategies", "Market Analysis", "Expert Tips"],
    density: 2.0
  },
  DOWNLOADS: {
    primary: "Forex EA Download",
    secondary: ["Free Expert Advisor", "MT4 EA", "MT5 Robot"],
    density: 2.8
  },
  PRODUCT: {
    primary: "Expert Advisor",
    secondary: ["Trading Robot", "Automated System", "MQL5"],
    density: 3.0
  },
  CATEGORY: {
    primary: "Forex Robot",
    secondary: ["Trading Bot", "EA Collection", "Best Forex EA"],
    density: 2.2
  }
} as const;

// Title Templates (SEO-optimized, under 60 chars)
export const TITLE_TEMPLATES = {
  HOME: {
    template: "{primary} - Best {secondary} & MT4/MT5 Trading Bots",
    examples: [
      "Forex Factory - Best Expert Advisors & MT4/MT5 Trading Bots",
      "ForexFactory.cc | Free Forex EA Downloads & Trading Robots"
    ]
  },
  BLOG_POST: {
    template: "{title} | {category} - {site}",
    examples: [
      "Top 10 Scalping EAs for MT4 | Expert Advisors - ForexFactory",
      "Grid Trading Strategy Guide | Forex Trading - ForexFactory.cc"
    ]
  },
  DOWNLOAD: {
    template: "{name} {version} - Free {type} Download | {platform}",
    examples: [
      "Gold Scalper EA v2.0 - Free MT4 Download | ForexFactory",
      "Trend Master Robot - Free Expert Advisor | MT5 Trading"
    ]
  },
  CATEGORY: {
    template: "Best {category} {year} - {count}+ Free Downloads",
    examples: [
      "Best Scalping EAs 2024 - 50+ Free Downloads",
      "Top Grid Trading Robots 2024 - Free MT4/MT5 EAs"
    ]
  },
  SEARCH: {
    template: "Search: {query} - {results} Expert Advisors Found",
    examples: [
      "Search: Martingale - 23 Expert Advisors Found",
      "Search: EURUSD - 45 Trading Robots Available"
    ]
  }
} as const;

// Meta Description Templates (SEO-optimized, 150-160 chars)
export const META_DESCRIPTION_TEMPLATES = {
  HOME: {
    template: "Download free {primary} for MT4/MT5. Access {count}+ professional trading robots, indicators & automated strategies. Updated {year}.",
    examples: [
      "Download free Expert Advisors for MT4/MT5. Access 500+ professional trading robots, indicators & automated strategies. Updated 2024.",
      "Best Forex EA collection - 500+ free trading robots for MetaTrader. Scalping, grid, martingale & trend following strategies available."
    ]
  },
  BLOG_POST: {
    template: "Learn about {topic} with our comprehensive guide. Discover {benefit} and improve your {outcome}. Expert tips included.",
    examples: [
      "Learn about scalping strategies with our comprehensive guide. Discover profitable techniques and improve your trading results. Expert tips included.",
      "Master grid trading with this detailed tutorial. Step-by-step EA setup, risk management strategies & real performance results."
    ]
  },
  DOWNLOAD: {
    template: "Download {name} - {type} for {platform}. Features: {features}. {performance}. Free download with setup guide.",
    examples: [
      "Download Gold Scalper EA - Expert Advisor for MT4. Features: auto lot sizing, news filter, trailing stop. 75% win rate. Free download with setup guide.",
      "Get Trend Master Robot for MT5. Advanced trend following EA with risk management, multi-timeframe analysis. Proven profitable results."
    ]
  },
  SIGNAL: {
    template: "Browse {topic} for MT4/MT5. Get {benefit} and achieve {outcome}. Download free trading robots today.",
    examples: [
      "Browse Expert Advisors and trading signals for MT4/MT5. Get automated trading strategies and achieve consistent profits. Download free trading robots today.",
      "Explore professional Forex signals for MetaTrader. Access proven EA strategies and boost your trading performance. Free downloads available."
    ]
  },
  CATEGORY: {
    template: "Browse {count}+ free {category} for {platforms}. Compare features, download instantly & get setup guides. Updated {date}.",
    examples: [
      "Browse 50+ free scalping EAs for MT4/MT5. Compare features, download instantly & get setup guides. Updated daily.",
      "Discover 30+ grid trading robots. Professional Expert Advisors with backtests, live results & optimization settings."
    ]
  }
} as const;

// Keyword Density Calculator
export function calculateKeywordDensity(text: string, keyword: string): number {
  const normalizedText = text.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase();
  
  // Count exact keyword matches
  const regex = new RegExp(`\\b${normalizedKeyword}\\b`, 'g');
  const matches = normalizedText.match(regex);
  const keywordCount = matches ? matches.length : 0;
  
  // Count total words
  const words = normalizedText.split(/\s+/).filter(word => word.length > 0);
  const totalWords = words.length;
  
  if (totalWords === 0) return 0;
  
  const density = (keywordCount / totalWords) * 100;
  return parseFloat(density.toFixed(2));
}

// Calculate multi-keyword density
export function calculateMultiKeywordDensity(text: string, keywords: string[]): { [key: string]: number } {
  const densities: { [key: string]: number } = {};
  
  keywords.forEach(keyword => {
    densities[keyword] = calculateKeywordDensity(text, keyword);
  });
  
  return densities;
}

// Check if keyword density is optimal (between 1-3%)
export function isKeywordDensityOptimal(density: number): boolean {
  return density >= 1.0 && density <= 3.0;
}

// Get keyword suggestions based on content type
export function getKeywordSuggestions(contentType: keyof typeof PAGE_KEYWORDS): {
  primary: string;
  secondary: string[];
  targetDensity: number;
  semanticKeywords: string[];
} {
  const pageConfig = PAGE_KEYWORDS[contentType];
  const semanticKws: string[] = [];
  
  // Add semantic keywords for primary keyword
  if (SEMANTIC_KEYWORDS[pageConfig.primary]) {
    semanticKws.push(...SEMANTIC_KEYWORDS[pageConfig.primary]);
  }
  
  // Add semantic keywords for secondary keywords
  pageConfig.secondary.forEach(kw => {
    if (SEMANTIC_KEYWORDS[kw]) {
      semanticKws.push(...SEMANTIC_KEYWORDS[kw]);
    }
  });
  
  return {
    primary: pageConfig.primary,
    secondary: [...pageConfig.secondary] as string[], // Create mutable copy
    targetDensity: pageConfig.density,
    semanticKeywords: Array.from(new Set(semanticKws)) // Remove duplicates
  };
}

// Generate optimized title
export function generateOptimizedTitle(
  template: keyof typeof TITLE_TEMPLATES,
  variables: { [key: string]: string }
): string {
  const titleTemplate = TITLE_TEMPLATES[template];
  let title: string = titleTemplate.template;
  
  // Replace variables
  Object.entries(variables).forEach(([key, value]) => {
    title = title.replace(`{${key}}`, value);
  });
  
  // Ensure title is under 60 characters
  if (title.length > 60) {
    title = title.substring(0, 57) + "...";
  }
  
  return title;
}

// Generate optimized meta description
export function generateOptimizedMetaDescription(
  template: keyof typeof META_DESCRIPTION_TEMPLATES,
  variables: { [key: string]: string }
): string {
  const descTemplate = META_DESCRIPTION_TEMPLATES[template];
  let description: string = descTemplate.template;
  
  // Replace variables
  Object.entries(variables).forEach(([key, value]) => {
    description = description.replace(`{${key}}`, value);
  });
  
  // Ensure description is between 150-160 characters
  if (description.length > 160) {
    description = description.substring(0, 157) + "...";
  } else if (description.length < 150) {
    // Add call-to-action if too short
    description += " Start trading smarter today.";
  }
  
  return description;
}

// Extract focus keywords from URL/slug
export function extractKeywordsFromSlug(slug: string): string[] {
  return slug
    .split(/[-_]/)
    .filter(word => word.length > 2)
    .filter(word => !['the', 'and', 'for', 'with', 'from'].includes(word));
}

// Check content for keyword stuffing
export function checkKeywordStuffing(text: string, keyword: string): {
  isStuffed: boolean;
  density: number;
  recommendation: string;
} {
  const density = calculateKeywordDensity(text, keyword);
  const isStuffed = density > 3.5;
  
  let recommendation = "";
  if (isStuffed) {
    recommendation = `Keyword density (${density}%) is too high. Reduce usage of "${keyword}" for better readability and SEO.`;
  } else if (density < 0.5) {
    recommendation = `Keyword density (${density}%) is too low. Add more natural mentions of "${keyword}".`;
  } else {
    recommendation = `Keyword density (${density}%) is optimal.`;
  }
  
  return { isStuffed, density, recommendation };
}

// Generate keyword-rich excerpt
export function generateKeywordRichExcerpt(
  content: string,
  keyword: string,
  length: number = 160
): string {
  const sentences = content.split(/[.!?]+/);
  
  // Find sentences containing the keyword
  const keywordSentences = sentences.filter(s => 
    s.toLowerCase().includes(keyword.toLowerCase())
  );
  
  if (keywordSentences.length > 0) {
    // Use the first sentence with keyword
    let excerpt = keywordSentences[0].trim();
    
    if (excerpt.length > length) {
      excerpt = excerpt.substring(0, length - 3) + "...";
    } else if (excerpt.length < length && sentences.length > 1) {
      // Add next sentence if space allows
      excerpt += ". " + sentences[1].trim();
      if (excerpt.length > length) {
        excerpt = excerpt.substring(0, length - 3) + "...";
      }
    }
    
    return excerpt;
  }
  
  // Fallback to first sentence if no keyword found
  let excerpt = sentences[0]?.trim() || "";
  if (excerpt.length > length) {
    excerpt = excerpt.substring(0, length - 3) + "...";
  }
  
  return excerpt;
}

// Analyze keyword competition (simplified scoring)
export function analyzeKeywordCompetition(keyword: string): {
  keyword: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  searchVolume: 'Low' | 'Medium' | 'High';
  recommendation: string;
} {
  const lowCompetition = LONG_TAIL_KEYWORDS.includes(keyword as any);
  const highVolume = PRIMARY_KEYWORDS.includes(keyword as any);
  
  let difficulty: 'Easy' | 'Medium' | 'Hard';
  let searchVolume: 'Low' | 'Medium' | 'High';
  let recommendation: string;
  
  if (lowCompetition) {
    difficulty = 'Easy';
    searchVolume = 'Low';
    recommendation = "Good long-tail keyword with lower competition. Easier to rank for.";
  } else if (highVolume) {
    difficulty = 'Hard';
    searchVolume = 'High';
    recommendation = "High-value keyword but very competitive. Focus on quality content and backlinks.";
  } else {
    difficulty = 'Medium';
    searchVolume = 'Medium';
    recommendation = "Moderate competition. Create comprehensive content with good on-page SEO.";
  }
  
  return { keyword, difficulty, searchVolume, recommendation };
}

// Get related keywords for content expansion
export function getRelatedKeywords(primaryKeyword: string): string[] {
  const related: string[] = [];
  
  // Add semantic keywords
  if (SEMANTIC_KEYWORDS[primaryKeyword]) {
    related.push(...SEMANTIC_KEYWORDS[primaryKeyword]);
  }
  
  // Add keywords from same category
  Object.values(KEYWORD_CATEGORIES).forEach(category => {
    if ((category as readonly string[]).includes(primaryKeyword)) {
      related.push(...category.filter(kw => kw !== primaryKeyword));
    }
  });
  
  // Remove duplicates
  return Array.from(new Set(related));
}