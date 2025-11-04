import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { useRoute, useLocation, Link } from 'wouter';
import { 
  Download, Star, Calendar, Package, Shield, CheckCircle, 
  AlertCircle, FileText, Image, ChevronLeft, ChevronRight,
  ThumbsUp, MessageCircle, Share2, Copy, Check
} from 'lucide-react';
import Layout from '@/components/Layout';
import SEOHead from '@/components/SEOHead';
import DownloadCard from '@/components/DownloadCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { generateSoftwareApplicationSchema } from '@/lib/seo';

export default function DownloadDetail() {
  const [location] = useLocation();
  const [match, params] = useRoute('/download/:id');
  const id = params?.id;
  const { toast } = useToast();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(5);
  const [copied, setCopied] = useState(false);

  // Fetch download data
  const { data: download, isLoading } = useQuery({
    queryKey: ['/api/downloads', id],
    enabled: !!id,
    select: (data: any) => {
      // In a real app, this would fetch by ID
      const downloads = data?.data || [];
      return downloads.find((d: any) => d.id === id) || downloads[0];
    }
  });

  // Fetch related downloads
  const { data: relatedDownloads } = useQuery({
    queryKey: ['/api/downloads/related', download?.category],
    enabled: !!download,
    select: (data: any) => {
      const downloads = data?.data || [];
      return downloads.filter((d: any) => d.id !== download?.id).slice(0, 3);
    }
  });

  // Download mutation
  const downloadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/downloads/${id}/download`);
    },
    onSuccess: () => {
      toast({
        title: "Download started!",
        description: "Your download will begin shortly.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/downloads', id] });
    }
  });

  // Submit review mutation
  const reviewMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/downloads/${id}/reviews`, { review, rating });
    },
    onSuccess: () => {
      toast({
        title: "Review submitted!",
        description: "Thank you for your feedback.",
      });
      setReview('');
      setRating(5);
    }
  });

  // Handle download
  const handleDownload = () => {
    downloadMutation.mutate();
  };

  // Handle review submission
  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (review.trim()) {
      reviewMutation.mutate();
    }
  };

  // Copy link
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Link copied!",
      description: "The download link has been copied to your clipboard.",
    });
  };

  if (isLoading) {
    return (
      <HelmetProvider>
        <Layout>
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Skeleton className="h-12 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/2 mb-8" />
                <Skeleton className="h-64 w-full" />
              </div>
              <div>
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          </div>
        </Layout>
      </HelmetProvider>
    );
  }

  if (!download) {
    return (
      <HelmetProvider>
        <Layout>
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 text-center">
            <h1 className="text-2xl font-bold mb-4">Download not found</h1>
            <Link href="/downloads">
              <Button data-testid="button-back-to-downloads">
                Back to Downloads
              </Button>
            </Link>
          </div>
        </Layout>
      </HelmetProvider>
    );
  }

  // Mock data for demonstration
  const screenshots = [
    '/api/placeholder/800/450',
    '/api/placeholder/800/450',
    '/api/placeholder/800/450'
  ];

  const features = [
    'Automated trend detection algorithm',
    'Advanced risk management system',
    'Multi-timeframe analysis',
    'News filter integration',
    'Customizable trading parameters',
    'Detailed performance statistics'
  ];

  const requirements = [
    'MetaTrader 4 build 1350 or higher',
    'Minimum account balance: $100',
    'Recommended leverage: 1:100 to 1:500',
    'VPS recommended for 24/7 operation',
    'Stable internet connection'
  ];

  const softwareSchema = generateSoftwareApplicationSchema({
    name: download.name,
    description: download.description || 'Professional Forex Expert Advisor',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Windows',
    softwareVersion: download.version || '1.0',
    downloadUrl: `https://forexfactory.cc/download/${id}`,
    fileSize: download.fileSize || '2MB',
    datePublished: download.createdAt || new Date().toISOString(),
    dateModified: download.updatedAt || download.createdAt,
    aggregateRating: download.rating ? {
      ratingValue: download.rating,
      reviewCount: download.reviewCount || 100
    } : undefined
  });

  const breadcrumbs = [
    { name: 'Downloads', href: '/downloads' },
    { name: download.category || 'Expert Advisors', href: `/downloads?category=${download.category}` },
    { name: download.name }
  ];

  return (
    <HelmetProvider>
      <SEOHead
        title={`${download.name} - Free ${download.platform || 'MT4'} EA Download`}
        description={download.description || `Download ${download.name} Expert Advisor for automated Forex trading. Features advanced algorithms, risk management, and proven performance.`}
        keywords={`${download.name}, ${download.platform} EA, Forex robot download, automated trading, Expert Advisor`}
        path={location}
        ogType="product"
        ogImage={screenshots[0]}
        softwareSchema={softwareSchema}
        breadcrumbs={breadcrumbs.map((b, i) => ({
          name: b.name,
          url: `https://forexfactory.cc${b.href || location}`
        }))}
      />
      
      <Layout breadcrumbs={breadcrumbs}>
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Header */}
                <div>
                  <Link href="/downloads">
                    <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Back to Downloads
                    </Button>
                  </Link>
                  
                  <h1 className="text-3xl md:text-4xl font-bold mb-4">{download.name}</h1>
                  
                  <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i}
                          className={`h-5 w-5 ${i < (download.rating || 4) ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`}
                        />
                      ))}
                      <span className="ml-2 font-medium">{download.rating || 4.5}</span>
                      <span className="text-muted-foreground">({download.reviewCount || 127} reviews)</span>
                    </div>
                    <Badge variant="secondary">
                      <Download className="mr-1 h-3 w-3" />
                      {download.downloads || 5420} downloads
                    </Badge>
                    <Badge variant="outline">{download.platform || 'MT4'}</Badge>
                    <Badge variant="outline">v{download.version || '2.0'}</Badge>
                  </div>
                  
                  <p className="text-lg text-muted-foreground">
                    {download.description || 'Professional Expert Advisor with advanced trading algorithms and comprehensive risk management features.'}
                  </p>
                </div>
                
                {/* Screenshot Gallery */}
                <div>
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden mb-4">
                    <img 
                      src={screenshots[currentImageIndex]} 
                      alt={`${download.name} screenshot ${currentImageIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {screenshots.length > 1 && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute left-2 top-1/2 -translate-y-1/2"
                          onClick={() => setCurrentImageIndex(prev => (prev - 1 + screenshots.length) % screenshots.length)}
                          data-testid="button-prev-image"
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => setCurrentImageIndex(prev => (prev + 1) % screenshots.length)}
                          data-testid="button-next-image"
                        >
                          <ChevronRight className="h-6 w-6" />
                        </Button>
                      </>
                    )}
                  </div>
                  
                  {/* Thumbnail strip */}
                  {screenshots.length > 1 && (
                    <div className="flex gap-2">
                      {screenshots.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`flex-1 aspect-video rounded-md overflow-hidden border-2 transition-colors ${
                            idx === currentImageIndex ? 'border-primary' : 'border-transparent'
                          }`}
                          data-testid={`thumbnail-${idx}`}
                        >
                          <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Tabs */}
                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="description" data-testid="tab-description">Description</TabsTrigger>
                    <TabsTrigger value="features" data-testid="tab-features">Features</TabsTrigger>
                    <TabsTrigger value="setup" data-testid="tab-setup">Setup Guide</TabsTrigger>
                    <TabsTrigger value="reviews" data-testid="tab-reviews">Reviews</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="description" className="space-y-4">
                    <Card>
                      <CardContent className="pt-6">
                        <h3 className="font-bold mb-3">About this Expert Advisor</h3>
                        <p className="text-muted-foreground mb-4">
                          {download.name} is a sophisticated automated trading system designed for the MetaTrader platform. 
                          It combines multiple trading strategies with advanced risk management to deliver consistent results 
                          in various market conditions.
                        </p>
                        <p className="text-muted-foreground mb-4">
                          This EA uses proprietary algorithms to identify high-probability trading opportunities while 
                          maintaining strict risk control. It's suitable for both beginners and experienced traders 
                          looking to automate their Forex trading.
                        </p>
                        
                        <h4 className="font-semibold mb-2 mt-6">Trading Strategy</h4>
                        <p className="text-muted-foreground mb-4">
                          The EA employs a trend-following strategy combined with momentum indicators to enter trades 
                          in the direction of the prevailing market trend. It uses multiple timeframe analysis to 
                          confirm trade signals and avoid false breakouts.
                        </p>
                        
                        <h4 className="font-semibold mb-2 mt-6">Risk Management</h4>
                        <p className="text-muted-foreground">
                          Built-in risk management features include adjustable stop loss and take profit levels, 
                          automatic lot size calculation based on account balance, and maximum drawdown protection. 
                          The EA also includes a news filter to avoid trading during high-impact economic events.
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="features" className="space-y-4">
                    <Card>
                      <CardContent className="pt-6">
                        <h3 className="font-bold mb-4">Key Features</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {features.map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                              <span className="text-muted-foreground">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <h3 className="font-bold mb-4">Performance Metrics</h3>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm text-muted-foreground">Win Rate</span>
                              <span className="text-sm font-medium">68%</span>
                            </div>
                            <Progress value={68} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm text-muted-foreground">Profit Factor</span>
                              <span className="text-sm font-medium">1.85</span>
                            </div>
                            <Progress value={85} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm text-muted-foreground">Max Drawdown</span>
                              <span className="text-sm font-medium">12%</span>
                            </div>
                            <Progress value={12} className="h-2" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="setup" className="space-y-4">
                    <Card>
                      <CardContent className="pt-6">
                        <h3 className="font-bold mb-4">Installation Guide</h3>
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="step1">
                            <AccordionTrigger>Step 1: Download the EA files</AccordionTrigger>
                            <AccordionContent>
                              <p className="text-muted-foreground mb-2">
                                Click the download button to get the EA files. The package includes:
                              </p>
                              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                                <li>Main EA file (.ex4/.ex5)</li>
                                <li>Installation guide (PDF)</li>
                                <li>Recommended settings file (.set)</li>
                                <li>User manual documentation</li>
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                          
                          <AccordionItem value="step2">
                            <AccordionTrigger>Step 2: Install in MetaTrader</AccordionTrigger>
                            <AccordionContent>
                              <ol className="list-decimal pl-6 text-muted-foreground space-y-2">
                                <li>Open your MetaTrader platform</li>
                                <li>Go to File → Open Data Folder</li>
                                <li>Navigate to MQL4/Experts (or MQL5/Experts for MT5)</li>
                                <li>Copy the EA file into this folder</li>
                                <li>Restart MetaTrader or refresh the Navigator panel</li>
                              </ol>
                            </AccordionContent>
                          </AccordionItem>
                          
                          <AccordionItem value="step3">
                            <AccordionTrigger>Step 3: Configure Settings</AccordionTrigger>
                            <AccordionContent>
                              <p className="text-muted-foreground mb-2">
                                Attach the EA to a chart and configure these essential settings:
                              </p>
                              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                                <li>Lot Size: Start with 0.01 for testing</li>
                                <li>Risk Percentage: Recommended 1-2% per trade</li>
                                <li>Take Profit: 50-100 pips (adjust based on pair)</li>
                                <li>Stop Loss: 25-50 pips (maintain 1:2 risk-reward)</li>
                                <li>Enable AutoTrading in MetaTrader</li>
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                          
                          <AccordionItem value="step4">
                            <AccordionTrigger>Step 4: Testing & Optimization</AccordionTrigger>
                            <AccordionContent>
                              <p className="text-muted-foreground mb-2">
                                Before live trading, always test the EA:
                              </p>
                              <ol className="list-decimal pl-6 text-muted-foreground space-y-2">
                                <li>Run backtests on historical data (at least 1 year)</li>
                                <li>Test on a demo account for 2-4 weeks</li>
                                <li>Monitor performance and adjust settings as needed</li>
                                <li>Start with minimal lot size when going live</li>
                                <li>Gradually increase position size as confidence grows</li>
                              </ol>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <h3 className="font-bold mb-4">System Requirements</h3>
                        <div className="space-y-2">
                          {requirements.map((req, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                              <span className="text-muted-foreground">{req}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="reviews" className="space-y-4">
                    {/* Write Review */}
                    <Card>
                      <CardContent className="pt-6">
                        <h3 className="font-bold mb-4">Write a Review</h3>
                        <form onSubmit={handleReviewSubmit}>
                          <div className="mb-4">
                            <Label className="mb-2">Your Rating</Label>
                            <div className="flex gap-1">
                              {[...Array(5)].map((_, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setRating(i + 1)}
                                  data-testid={`star-${i + 1}`}
                                >
                                  <Star 
                                    className={`h-6 w-6 ${i < rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                          <Textarea
                            placeholder="Share your experience with this EA..."
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            className="mb-4"
                            rows={4}
                            data-testid="textarea-review"
                          />
                          <Button type="submit" data-testid="button-submit-review">
                            Submit Review
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                    
                    {/* Sample Reviews */}
                    <div className="space-y-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3">
                            <Avatar>
                              <AvatarImage src="https://api.dicebear.com/7.x/initials/svg?seed=MT" />
                              <AvatarFallback>MT</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium">Michael Thompson</span>
                                <div className="flex gap-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">2 weeks ago</p>
                              <p className="text-muted-foreground">
                                Excellent EA! Been using it for 3 months now with consistent profits. 
                                The risk management features are top-notch. Highly recommended for serious traders.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3">
                            <Avatar>
                              <AvatarImage src="https://api.dicebear.com/7.x/initials/svg?seed=SK" />
                              <AvatarFallback>SK</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium">Sarah Kim</span>
                                <div className="flex gap-0.5">
                                  {[...Array(4)].map((_, i) => (
                                    <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                  ))}
                                  <Star className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">1 month ago</p>
                              <p className="text-muted-foreground">
                                Good performance overall. The setup was straightforward and the documentation is comprehensive. 
                                Would give 5 stars if it had more currency pair options.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              {/* Sidebar - Download Info */}
              <div className="lg:col-span-1">
                <div className="sticky top-6 space-y-6">
                  {/* Download Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Download Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">File Size</span>
                          <span className="font-medium">{download.fileSize || '2.4 MB'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Version</span>
                          <span className="font-medium">v{download.version || '2.0'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Platform</span>
                          <span className="font-medium">{download.platform || 'MT4'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Updated</span>
                          <span className="font-medium">
                            {new Date(download.updatedAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Downloads</span>
                          <span className="font-medium">{download.downloads || 5420}</span>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-3">
                        <Button 
                          className="w-full" 
                          size="lg"
                          onClick={handleDownload}
                          disabled={downloadMutation.isPending}
                          data-testid="button-download"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          {downloadMutation.isPending ? 'Starting Download...' : 'Download Now'}
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={copyLink}
                          data-testid="button-share"
                        >
                          {copied ? (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Link Copied!
                            </>
                          ) : (
                            <>
                              <Share2 className="mr-2 h-4 w-4" />
                              Share Link
                            </>
                          )}
                        </Button>
                      </div>
                      
                      <Separator />
                      
                      {/* Trust Badges */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Shield className="h-4 w-4 text-green-600" />
                          <span className="text-muted-foreground">Virus-free & Safe</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          <span className="text-muted-foreground">Verified by Team</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-purple-600" />
                          <span className="text-muted-foreground">Documentation Included</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Support Card */}
                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-semibold mb-3">Need Help?</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Check our comprehensive documentation or contact support for assistance.
                      </p>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full" data-testid="button-documentation">
                          <FileText className="mr-2 h-4 w-4" />
                          View Documentation
                        </Button>
                        <Button variant="outline" size="sm" className="w-full" data-testid="button-support">
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Contact Support
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
            
            {/* Related Downloads */}
            {relatedDownloads && relatedDownloads.length > 0 && (
              <section className="mt-16">
                <h3 className="text-2xl font-bold mb-8">Related Expert Advisors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {relatedDownloads.map((related: any) => (
                    <DownloadCard key={related.id} {...related} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </section>
      </Layout>
    </HelmetProvider>
  );
}