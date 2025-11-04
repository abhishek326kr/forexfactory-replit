import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DownloadCard from '@/components/DownloadCard';
import CategoryFilter from '@/components/CategoryFilter';
import SearchBar from '@/components/SearchBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Import images
import mt4Image from '@assets/generated_images/MT4_EA_screenshot_01fda502.png';
import mt5Image from '@assets/generated_images/MT5_bot_performance_1cf76885.png';
import growthImage from '@assets/generated_images/Financial_growth_pattern_99cebd91.png';

export default function DownloadsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');

  const categories = [
    'Scalping',
    'Grid Trading',
    'News Trading',
    'Trend Following',
    'Martingale',
    'Hedging',
    'Price Action',
    'Multi-Currency',
  ];

  //todo: remove mock functionality
  const downloads = [
    {
      id: '1',
      name: 'Gold Scalper Pro EA',
      description: 'Advanced scalping EA optimized for XAUUSD with smart money management and news filter.',
      version: '2.5.1',
      compatibility: ['MT4', 'MT5'] as ('MT4' | 'MT5')[],
      downloads: 45230,
      rating: 4.8,
      lastUpdated: '2 days ago',
      image: mt4Image,
      fileSize: '2.3 MB',
      features: ['Auto lot sizing', 'News filter', 'All timeframes', 'Money management'],
    },
    {
      id: '2',
      name: 'Trend Master EA',
      description: 'Powerful trend following system with multi-currency support and auto-optimization.',
      version: '3.0.0',
      compatibility: ['MT5'] as ('MT4' | 'MT5')[],
      downloads: 38450,
      rating: 4.9,
      lastUpdated: '1 week ago',
      image: mt5Image,
      fileSize: '3.1 MB',
      isPremium: true,
      features: ['Multi-currency', 'Auto optimization', 'Risk control', 'Backtesting ready'],
    },
    {
      id: '3',
      name: 'News Trader Bot',
      description: 'Automated news trading with economic calendar integration and spike protection.',
      version: '1.8.2',
      compatibility: ['MT4'] as ('MT4' | 'MT5')[],
      downloads: 28900,
      rating: 4.7,
      lastUpdated: '3 days ago',
      image: growthImage,
      fileSize: '1.8 MB',
      features: ['News calendar', 'Auto stop loss', 'Spike protection', 'Low DD'],
    },
    {
      id: '4',
      name: 'Grid Master Pro',
      description: 'Intelligent grid trading system with dynamic spacing and drawdown control.',
      version: '4.2.0',
      compatibility: ['MT4', 'MT5'] as ('MT4' | 'MT5')[],
      downloads: 31200,
      rating: 4.6,
      lastUpdated: '5 days ago',
      image: mt5Image,
      fileSize: '2.7 MB',
      features: ['Dynamic grid', 'DD control', 'Auto recovery', 'Hedge mode'],
    },
    {
      id: '5',
      name: 'Scalping Indicator Suite',
      description: 'Complete set of indicators for scalping including entry signals and exit points.',
      version: '1.5.0',
      compatibility: ['MT4'] as ('MT4' | 'MT5')[],
      downloads: 22100,
      rating: 4.5,
      lastUpdated: '1 week ago',
      image: mt4Image,
      fileSize: '1.2 MB',
      features: ['Entry signals', 'Exit alerts', 'Multi-timeframe', 'No repaint'],
    },
    {
      id: '6',
      name: 'Martingale Recovery EA',
      description: 'Smart martingale system with advanced recovery algorithms and risk limitation.',
      version: '2.1.3',
      compatibility: ['MT5'] as ('MT4' | 'MT5')[],
      downloads: 18500,
      rating: 4.4,
      lastUpdated: '2 weeks ago',
      image: growthImage,
      fileSize: '2.0 MB',
      isPremium: true,
      features: ['Smart recovery', 'Risk limits', 'Anti-martingale', 'Stats panel'],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Page Header */}
        <section className="py-12 md:py-20 bg-card">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
                Free MT4/MT5 Expert Advisors
              </h1>
              <p className="text-lg text-muted-foreground">
                Download tested and verified trading robots for MetaTrader platforms
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

        {/* Downloads Section */}
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4 md:px-6">
            {/* Tabs for MT4/MT5 */}
            <Tabs defaultValue="all" className="space-y-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <TabsList className="grid w-full sm:w-auto grid-cols-3">
                  <TabsTrigger value="all">All EAs</TabsTrigger>
                  <TabsTrigger value="mt4">MT4 Only</TabsTrigger>
                  <TabsTrigger value="mt5">MT5 Only</TabsTrigger>
                </TabsList>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-sort">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="recent">Recently Updated</SelectItem>
                    <SelectItem value="downloads">Most Downloads</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />

              {/* Downloads Grid */}
              <TabsContent value="all" className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {downloads.map((download) => (
                    <DownloadCard key={download.id} {...download} />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="mt4" className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {downloads
                    .filter((d) => d.compatibility.includes('MT4'))
                    .map((download) => (
                      <DownloadCard key={download.id} {...download} />
                    ))}
                </div>
              </TabsContent>
              
              <TabsContent value="mt5" className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {downloads
                    .filter((d) => d.compatibility.includes('MT5'))
                    .map((download) => (
                      <DownloadCard key={download.id} {...download} />
                    ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}