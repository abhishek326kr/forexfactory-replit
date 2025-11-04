import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BlogCard from '@/components/BlogCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Calendar, 
  Clock, 
  User, 
  Share2, 
  BookOpen, 
  ChevronRight,
  Twitter,
  Facebook,
  Linkedin,
} from 'lucide-react';
import { Link } from 'wouter';

// Import images
import mt5Image from '@assets/generated_images/MT5_bot_performance_1cf76885.png';
import mt4Image from '@assets/generated_images/MT4_EA_screenshot_01fda502.png';
import maleAvatar from '@assets/generated_images/Male_trader_avatar_bc54c0e7.png';

export default function BlogPostPage() {
  //todo: remove mock functionality
  const post = {
    title: 'How to Optimize Your Expert Advisor for Maximum Profit',
    category: 'Trading Strategies',
    author: {
      name: 'John Smith',
      avatar: maleAvatar,
      bio: 'Professional trader with 10+ years of experience in algorithmic trading',
    },
    date: 'December 15, 2024',
    readTime: 8,
    image: mt5Image,
    content: `
# Introduction

Expert Advisors (EAs) are powerful tools that can automate your trading strategies on MetaTrader platforms. However, to achieve consistent profitability, proper optimization is crucial. In this comprehensive guide, we'll explore the essential techniques for fine-tuning your EA parameters.

## Understanding EA Optimization

Optimization is the process of finding the best combination of parameters for your Expert Advisor. This involves:

1. **Parameter Selection**: Identifying which variables to optimize
2. **Backtesting**: Testing historical performance
3. **Forward Testing**: Validating results on unseen data
4. **Risk Management**: Implementing proper money management rules

## Key Optimization Strategies

### 1. Define Clear Objectives

Before starting optimization, establish clear goals:
- Maximum profit factor
- Minimum drawdown threshold
- Risk-reward ratio targets
- Win rate expectations

### 2. Use Proper Backtesting Periods

Always use sufficient historical data:
- Minimum 2-3 years of data
- Include different market conditions
- Test across multiple timeframes
- Consider major economic events

### 3. Avoid Over-Optimization

Over-optimization (curve fitting) is a common mistake that leads to poor real-world performance. To avoid this:
- Use out-of-sample testing
- Implement walk-forward analysis
- Keep parameters simple and logical
- Validate on multiple currency pairs

## Implementation Example

Here's a practical approach to EA optimization:

\`\`\`mql4
// Example optimization parameters
input double StopLoss = 50;      // Range: 20-100
input double TakeProfit = 100;   // Range: 50-200
input int MAPeriod = 20;         // Range: 10-50
input double LotSize = 0.01;     // Fixed or dynamic
\`\`\`

## Risk Management Best Practices

Proper risk management is essential for long-term success:

- **Position Sizing**: Never risk more than 1-2% per trade
- **Drawdown Limits**: Set maximum acceptable drawdown
- **Diversification**: Run multiple EAs on different pairs
- **Regular Monitoring**: Review performance weekly

## Conclusion

Optimizing your Expert Advisor is an ongoing process that requires patience and discipline. By following these guidelines and continuously refining your approach, you can develop robust automated trading systems that perform well in various market conditions.

Remember: Past performance doesn't guarantee future results. Always test your optimized EA on a demo account before going live.
    `,
    tags: ['EA Optimization', 'Backtesting', 'Risk Management', 'MetaTrader', 'Algorithmic Trading'],
  };

  const relatedPosts = [
    {
      id: '2',
      title: 'Top 5 MT4 Indicators for Day Trading',
      excerpt: 'Discover the most effective indicators for day trading.',
      category: 'Indicators',
      author: 'Sarah Johnson',
      date: 'Dec 14, 2024',
      readTime: 6,
      image: mt4Image,
      slug: 'top-mt4-indicators',
      tags: ['Indicators', 'MT4'],
    },
    {
      id: '3',
      title: 'Grid Trading Systems Guide',
      excerpt: 'Complete guide to grid trading strategies.',
      category: 'Trading Systems',
      author: 'Mike Wilson',
      date: 'Dec 13, 2024',
      readTime: 12,
      image: mt5Image,
      slug: 'grid-trading-guide',
      tags: ['Grid Trading'],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 md:px-6 py-4">
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Link href="/"><a className="hover:text-primary">Home</a></Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/blog"><a className="hover:text-primary">Blog</a></Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">{post.category}</span>
          </nav>
        </div>

        {/* Article */}
        <article className="container mx-auto px-4 md:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Header */}
              <div className="space-y-6 mb-8">
                <Badge variant="secondary" className="w-fit">
                  {post.category}
                </Badge>
                
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                  {post.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {post.date}
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {post.readTime} min read
                  </span>
                  <span className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-1" />
                    1,234 views
                  </span>
                </div>

                {/* Author */}
                <div className="flex items-center space-x-3 p-4 bg-card rounded-lg border">
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="font-medium">{post.author.name}</p>
                    <p className="text-sm text-muted-foreground">{post.author.bio}</p>
                  </div>
                </div>
              </div>

              {/* Featured Image */}
              <img
                src={post.image}
                alt={post.title}
                className="w-full aspect-video object-cover rounded-lg mb-8"
              />

              {/* Content */}
              <div className="prose prose-lg max-w-none dark:prose-invert">
                <div dangerouslySetInnerHTML={{ __html: post.content }} />
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-8">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Share Buttons */}
              <Card className="mt-8">
                <CardContent className="flex items-center justify-between p-6">
                  <p className="font-medium">Share this article:</p>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="icon" data-testid="button-share-twitter">
                      <Twitter className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" data-testid="button-share-facebook">
                      <Facebook className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" data-testid="button-share-linkedin">
                      <Linkedin className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" data-testid="button-share-link">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <aside className="space-y-8">
              {/* Download CTA */}
              <Card className="border-primary">
                <CardContent className="p-6 space-y-4 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Download className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Get Free EA Template</h3>
                  <p className="text-sm text-muted-foreground">
                    Download our optimized EA template with built-in risk management
                  </p>
                  <Button className="w-full" data-testid="button-download-template">
                    Download Now
                  </Button>
                </CardContent>
              </Card>

              {/* Table of Contents */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Table of Contents</h3>
                  <nav className="space-y-2 text-sm">
                    <a href="#" className="block text-muted-foreground hover:text-primary">
                      1. Introduction
                    </a>
                    <a href="#" className="block text-muted-foreground hover:text-primary">
                      2. Understanding EA Optimization
                    </a>
                    <a href="#" className="block text-muted-foreground hover:text-primary">
                      3. Key Optimization Strategies
                    </a>
                    <a href="#" className="block text-muted-foreground hover:text-primary">
                      4. Implementation Example
                    </a>
                    <a href="#" className="block text-muted-foreground hover:text-primary">
                      5. Risk Management
                    </a>
                    <a href="#" className="block text-muted-foreground hover:text-primary">
                      6. Conclusion
                    </a>
                  </nav>
                </CardContent>
              </Card>
            </aside>
          </div>

          {/* Related Posts */}
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-8">You May Also Like</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedPosts.map((relatedPost) => (
                <BlogCard key={relatedPost.id} {...relatedPost} />
              ))}
            </div>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  );
}

// Import necessary Lucide icon
import { Download } from 'lucide-react';