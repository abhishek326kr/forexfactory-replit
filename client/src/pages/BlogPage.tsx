import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BlogCard from '@/components/BlogCard';
import CategoryFilter from '@/components/CategoryFilter';
import SearchBar from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Import images
import mt4Image from '@assets/generated_images/MT4_EA_screenshot_01fda502.png';
import mt5Image from '@assets/generated_images/MT5_bot_performance_1cf76885.png';
import growthImage from '@assets/generated_images/Financial_growth_pattern_99cebd91.png';

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const categories = [
    'Trading Strategies',
    'Expert Advisors',
    'Indicators',
    'Market Analysis',
    'Risk Management',
    'Tutorials',
    'News Trading',
    'Scalping',
  ];

  //todo: remove mock functionality
  const blogPosts = [
    {
      id: '1',
      title: 'How to Optimize Your Expert Advisor for Maximum Profit',
      excerpt: 'Learn the essential techniques for fine-tuning your EA parameters, backtesting strategies, and implementing risk management.',
      category: 'Trading Strategies',
      author: 'John Smith',
      date: 'Dec 15, 2024',
      readTime: 8,
      image: mt5Image,
      slug: 'optimize-expert-advisor',
      tags: ['EA Optimization', 'Backtesting', 'Risk Management'],
    },
    {
      id: '2',
      title: 'Top 5 MT4 Indicators for Day Trading in 2025',
      excerpt: 'Discover the most effective indicators that professional day traders use to identify profitable trading opportunities.',
      category: 'Indicators',
      author: 'Sarah Johnson',
      date: 'Dec 14, 2024',
      readTime: 6,
      image: mt4Image,
      slug: 'top-mt4-indicators',
      tags: ['Indicators', 'Day Trading', 'MT4'],
    },
    {
      id: '3',
      title: 'Understanding Grid Trading Systems: Complete Guide',
      excerpt: 'A comprehensive guide to grid trading strategies, including setup, risk management, and optimization tips.',
      category: 'Trading Strategies',
      author: 'Mike Wilson',
      date: 'Dec 13, 2024',
      readTime: 12,
      image: growthImage,
      slug: 'grid-trading-guide',
      tags: ['Grid Trading', 'Strategy', 'Advanced'],
    },
    {
      id: '4',
      title: 'News Trading with Expert Advisors: Best Practices',
      excerpt: 'Master the art of news trading using automated systems. Learn how to avoid slippage and manage high volatility.',
      category: 'News Trading',
      author: 'Emma Davis',
      date: 'Dec 12, 2024',
      readTime: 10,
      image: mt5Image,
      slug: 'news-trading-ea',
      tags: ['News Trading', 'Volatility', 'EA'],
    },
    {
      id: '5',
      title: 'Scalping Strategy: Building Your First MT5 Robot',
      excerpt: 'Step-by-step guide to creating a scalping robot for MetaTrader 5 with code examples and optimization tips.',
      category: 'Scalping',
      author: 'Alex Chen',
      date: 'Dec 11, 2024',
      readTime: 15,
      image: mt4Image,
      slug: 'scalping-mt5-robot',
      tags: ['Scalping', 'MT5', 'Programming'],
    },
    {
      id: '6',
      title: 'Risk Management for Automated Trading Systems',
      excerpt: 'Essential risk management techniques every algo trader must know to protect capital and ensure long-term success.',
      category: 'Risk Management',
      author: 'David Brown',
      date: 'Dec 10, 2024',
      readTime: 9,
      image: growthImage,
      slug: 'risk-management-algo',
      tags: ['Risk Management', 'Money Management', 'Safety'],
    },
  ];

  const filteredPosts = selectedCategory === 'all' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  const postsPerPage = 6;
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Page Header */}
        <section className="py-12 md:py-20 bg-card">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
                Trading Insights & Tutorials
              </h1>
              <p className="text-lg text-muted-foreground">
                Expert analysis, strategy guides, and the latest forex trading insights
              </p>
              
              <div className="pt-4">
                <SearchBar 
                  onSearch={(query) => console.log('Searching:', query)}
                  className="max-w-2xl mx-auto"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Filter & Posts */}
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4 md:px-6">
            {/* Category Filter */}
            <div className="mb-8">
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
            </div>

            {/* Blog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {paginatedPosts.map((post) => (
                <BlogCard key={post.id} {...post} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-12">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  data-testid="button-prev-page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setCurrentPage(page)}
                    data-testid={`button-page-${page}`}
                  >
                    {page}
                  </Button>
                ))}
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  data-testid="button-next-page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}