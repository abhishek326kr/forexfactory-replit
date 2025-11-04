import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/components/HeroSection';
import BlogCard from '@/components/BlogCard';
import DownloadCard from '@/components/DownloadCard';
import StatsSection from '@/components/StatsSection';
import NewsletterSection from '@/components/NewsletterSection';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';

// Import generated images
import mt4Image from '@assets/generated_images/MT4_EA_screenshot_01fda502.png';
import mt5Image from '@assets/generated_images/MT5_bot_performance_1cf76885.png';
import growthImage from '@assets/generated_images/Financial_growth_pattern_99cebd91.png';

export default function HomePage() {
  //todo: remove mock functionality - replace with real data
  const featuredEAs = [
    {
      id: '1',
      name: 'Gold Scalper Pro EA',
      description: 'Advanced scalping EA optimized for XAUUSD with smart money management.',
      version: '2.5.1',
      compatibility: ['MT4', 'MT5'] as ('MT4' | 'MT5')[],
      downloads: 45230,
      rating: 4.8,
      lastUpdated: '2 days ago',
      image: mt4Image,
      fileSize: '2.3 MB',
      features: ['Auto lot sizing', 'News filter', 'All timeframes'],
    },
    {
      id: '2',
      name: 'Trend Master EA',
      description: 'Powerful trend following system with multi-currency support.',
      version: '3.0.0',
      compatibility: ['MT5'] as ('MT4' | 'MT5')[],
      downloads: 38450,
      rating: 4.9,
      lastUpdated: '1 week ago',
      image: mt5Image,
      fileSize: '3.1 MB',
      isPremium: true,
      features: ['Multi-currency', 'Auto optimization', 'Risk control'],
    },
    {
      id: '3',
      name: 'News Trader Bot',
      description: 'Automated news trading with economic calendar integration.',
      version: '1.8.2',
      compatibility: ['MT4'] as ('MT4' | 'MT5')[],
      downloads: 28900,
      rating: 4.7,
      lastUpdated: '3 days ago',
      image: growthImage,
      fileSize: '1.8 MB',
      features: ['News calendar', 'Auto stop loss', 'Spike protection'],
    },
  ];

  const latestPosts = [
    {
      id: '1',
      title: 'How to Optimize Your Expert Advisor for Maximum Profit',
      excerpt: 'Learn the essential techniques for fine-tuning your EA parameters and implementing proper risk management.',
      category: 'Trading Strategies',
      author: 'John Smith',
      date: 'Dec 15, 2024',
      readTime: 8,
      image: mt5Image,
      slug: 'optimize-expert-advisor',
      tags: ['EA Optimization', 'Backtesting'],
    },
    {
      id: '2',
      title: 'Top 5 MT4 Indicators for Day Trading in 2025',
      excerpt: 'Discover the most effective indicators that professional day traders use to identify profitable opportunities.',
      category: 'Indicators',
      author: 'Sarah Johnson',
      date: 'Dec 14, 2024',
      readTime: 6,
      image: mt4Image,
      slug: 'top-mt4-indicators-2025',
      tags: ['Indicators', 'Day Trading'],
    },
    {
      id: '3',
      title: 'Understanding Grid Trading Systems: Complete Guide',
      excerpt: 'A comprehensive guide to grid trading strategies, including setup, risk management, and optimization tips.',
      category: 'Trading Systems',
      author: 'Mike Wilson',
      date: 'Dec 13, 2024',
      readTime: 12,
      image: growthImage,
      slug: 'grid-trading-guide',
      tags: ['Grid Trading', 'Strategy'],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <HeroSection />

        {/* Featured EAs Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-2">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Featured Expert Advisors
                </h2>
                <p className="text-lg text-muted-foreground">
                  Most popular and highly-rated trading bots
                </p>
              </div>
              <Link href="/downloads">
                <a>
                  <Button variant="outline" data-testid="button-view-all-eas">
                    View All EAs
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {featuredEAs.map((ea) => (
                <DownloadCard key={ea.id} {...ea} />
              ))}
            </div>
          </div>
        </section>

        {/* Trust Stats */}
        <StatsSection />

        {/* Latest Blog Posts */}
        <section className="py-16 md:py-24 bg-card">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-2">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Latest Trading Insights
                </h2>
                <p className="text-lg text-muted-foreground">
                  Expert analysis and trading strategies
                </p>
              </div>
              <Link href="/blog">
                <a>
                  <Button variant="outline" data-testid="button-view-all-posts">
                    All Posts
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {latestPosts.map((post) => (
                <BlogCard key={post.id} {...post} />
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <NewsletterSection />
      </main>

      <Footer />
    </div>
  );
}