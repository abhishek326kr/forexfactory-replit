import { useQuery } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Link } from 'wouter';
import { Download, TrendingUp, Star, ArrowRight, CheckCircle2, Users } from 'lucide-react';
import Layout from '@/components/Layout';
import SEOHead from '@/components/SEOHead';
import BlogCard from '@/components/BlogCard';
import DownloadCard from '@/components/DownloadCard';
import NewsletterSection from '@/components/NewsletterSection';
import HeroSection from '@/components/HeroSection';
import StatsSection from '@/components/StatsSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { generateOptimizedTitle, generateOptimizedMetaDescription, PRIMARY_KEYWORDS } from '@/lib/keywords';

export default function Home() {
  // Fetch featured downloads
  const { data: downloads, isLoading: downloadsLoading } = useQuery({
    queryKey: ['/api/downloads'],
    select: (data: any) => data?.data?.slice(0, 6) || []
  });
  
  // Fetch latest blog posts
  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['/api/posts'],
    select: (data: any) => data?.data?.slice(0, 3) || []
  });
  
  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    select: (data) => data || {
      totalDownloads: 500000,
      totalEAs: 500,
      totalUsers: 50000,
      successRate: 92
    }
  });

  const pageTitle = generateOptimizedTitle('HOME', {
    primary: 'Forex Factory',
    secondary: 'Expert Advisors'
  });

  const metaDescription = generateOptimizedMetaDescription('HOME', {
    primary: 'Expert Advisors',
    count: '500',
    year: '2024'
  });

  const keywords = PRIMARY_KEYWORDS.join(', ');

  return (
    <HelmetProvider>
      <SEOHead
        title="Forex Factory - Best Expert Advisors & MT4/MT5 Trading Bots"
        description={metaDescription}
        keywords={keywords}
        path="/"
        ogType="website"
      />
      
      <Layout>
        {/* Hero Section */}
        <HeroSection />
        
        {/* Trust Badges */}
        <section className="py-8 border-b bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-medium">100% Free Downloads</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Updated Weekly</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-5 w-5 text-purple-600" />
                <span className="font-medium">50k+ Active Traders</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Star className="h-5 w-5 text-yellow-600" />
                <span className="font-medium">Verified & Tested EAs</span>
              </div>
            </div>
          </div>
        </section>
        
        {/* Featured Downloads Section */}
        <section className="py-12 md:py-20">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Featured Expert Advisors & Trading Robots
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Download the best Forex EA and automated trading solutions for MT4/MT5. 
                All Expert Advisors are tested and verified for performance.
              </p>
            </div>
            
            {downloadsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {downloads?.map((download: any) => (
                  <DownloadCard key={download.id} {...download} />
                ))}
              </div>
            )}
            
            <div className="text-center mt-10">
              <Link href="/downloads">
                <Button size="lg" className="gap-2" data-testid="button-view-all-downloads">
                  View All Downloads
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        {/* Stats Section */}
        <StatsSection />
        
        {/* Latest Blog Posts */}
        <section className="py-12 md:py-20 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Latest Trading Insights & Tutorials
                </h2>
                <p className="text-lg text-muted-foreground">
                  Learn Forex trading strategies, EA optimization, and market analysis
                </p>
              </div>
              <Link href="/blog">
                <Button variant="outline" className="mt-4 md:mt-0" data-testid="button-view-all-posts">
                  View All Posts
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            {postsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-5/6" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {posts?.map((post: any) => (
                  <BlogCard key={post.id} {...post} />
                ))}
              </div>
            )}
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-12 md:py-20">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Why Choose ForexFactory.cc?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="hover-elevate">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Download className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Free Expert Advisors</CardTitle>
                  <CardDescription>
                    Access 500+ professional Forex EAs and trading robots for MT4/MT5 platforms. 
                    All downloads are 100% free with no hidden costs.
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="hover-elevate">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Verified Performance</CardTitle>
                  <CardDescription>
                    Every Expert Advisor is thoroughly tested with real backtest results and 
                    forward testing data to ensure reliability.
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="hover-elevate">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Active Community</CardTitle>
                  <CardDescription>
                    Join 50,000+ traders sharing strategies, optimizations, and trading insights. 
                    Get support from experienced EA developers.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>
        
        {/* Newsletter Section */}
        <NewsletterSection />
      </Layout>
    </HelmetProvider>
  );
}