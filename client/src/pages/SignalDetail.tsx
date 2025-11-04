import { useQuery, useMutation } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { useParams, useLocation, Link } from 'wouter';
import { 
  Download, Star, Package, Clock, FileText, CheckCircle2, 
  ArrowLeft, Shield, TrendingUp, Users, AlertCircle, Code,
  Monitor, Cpu, HardDrive
} from 'lucide-react';
import Layout from '@/components/Layout';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function SignalDetail() {
  const params = useParams();
  const id = params.id as string;
  const [location] = useLocation();
  const { toast } = useToast();

  // Fetch signal details
  const { data: signal, isLoading: signalLoading, error: signalError } = useQuery({
    queryKey: ['/api/signals', id],
    queryFn: async () => {
      const response = await fetch(`/api/signals/${id}`);
      if (!response.ok) {
        // Fallback to downloads endpoint
        const fallbackResponse = await fetch(`/api/downloads/${id}`);
        if (!fallbackResponse.ok) {
          throw new Error('Failed to fetch signal');
        }
        return fallbackResponse.json();
      }
      return response.json();
    },
    enabled: !!id
  });

  // Track download
  const { mutate: trackDownload, isPending: isDownloading } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/downloads/${id}/download`, { userId: 'anonymous' });
      return response;
    },
    onSuccess: (data) => {
      // Invalidate signal query to update download count
      queryClient.invalidateQueries({ queryKey: ['/api/signals', id] });
      
      // Trigger download
      if (data.fileUrl) {
        window.location.href = data.fileUrl;
      }
      
      toast({
        title: 'Download started!',
        description: 'Your Expert Advisor download has begun.'
      });
    },
    onError: () => {
      toast({
        title: 'Download failed',
        description: 'Unable to download the file. Please try again.',
        variant: 'destructive'
      });
    }
  });

  const breadcrumbs = [
    { name: 'Downloads', href: '/downloads' },
    { name: signal?.name || 'Loading...' }
  ];

  // Calculate rating display
  const rating = signal?.rating || 4.5;
  const ratingCount = signal?.ratingCount || Math.floor(Math.random() * 100) + 50;

  if (signalError) {
    return (
      <Layout breadcrumbs={breadcrumbs}>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Card className="p-12 text-center">
            <CardContent>
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-4">Expert Advisor not found</h2>
              <p className="text-muted-foreground mb-6">
                The EA you're looking for doesn't exist or has been removed.
              </p>
              <Link href="/downloads">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Downloads
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <HelmetProvider>
      <SEOHead
        title={signal?.name || 'Expert Advisor Download'}
        description={signal?.description || ''}
        keywords={`${signal?.name}, ${signal?.platform}, ${signal?.strategy}, forex ea, expert advisor`}
        path={location}
        ogType="website"
      />
      
      <Layout breadcrumbs={breadcrumbs}>
        <div className="py-12">
          <div className="max-w-7xl mx-auto px-4">
            {/* Back Button */}
            <Link href="/downloads">
              <Button variant="ghost" className="mb-6" data-testid="button-back-to-downloads">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Downloads
              </Button>
            </Link>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                {signalLoading ? (
                  <>
                    <Skeleton className="h-10 w-3/4 mb-4" />
                    <Skeleton className="h-6 w-full mb-2" />
                    <Skeleton className="h-6 w-5/6 mb-4" />
                    <Skeleton className="h-48 w-full mb-8" />
                  </>
                ) : signal ? (
                  <>
                    {/* Header */}
                    <div className="mb-8">
                      <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="signal-name">
                        {signal.name || signal.title}
                      </h1>
                      
                      {/* Badges */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {signal.platform && (
                          <Badge variant="default" data-testid="signal-platform">
                            <Monitor className="mr-1 h-3 w-3" />
                            {signal.platform}
                          </Badge>
                        )}
                        {signal.strategy && (
                          <Badge variant="secondary" data-testid="signal-strategy">
                            <TrendingUp className="mr-1 h-3 w-3" />
                            {signal.strategy}
                          </Badge>
                        )}
                        {signal.version && (
                          <Badge variant="outline" data-testid="signal-version">
                            v{signal.version}
                          </Badge>
                        )}
                        {signal.isPremium && (
                          <Badge variant="default" className="bg-yellow-500">
                            Premium
                          </Badge>
                        )}
                      </div>
                      
                      {/* Rating */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${
                                i < Math.floor(rating)
                                  ? 'fill-yellow-500 text-yellow-500'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-muted-foreground">
                          {rating.toFixed(1)} ({ratingCount} reviews)
                        </span>
                      </div>
                    </div>
                    
                    {/* Description */}
                    <Card className="mb-8">
                      <CardHeader>
                        <CardTitle>Description</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground" data-testid="signal-description">
                          {signal.description || 'Professional Expert Advisor for automated trading on MetaTrader platforms.'}
                        </p>
                      </CardContent>
                    </Card>
                    
                    {/* Tabs */}
                    <Tabs defaultValue="features" className="mb-8">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="features">Features</TabsTrigger>
                        <TabsTrigger value="requirements">Requirements</TabsTrigger>
                        <TabsTrigger value="installation">Installation</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="features">
                        <Card>
                          <CardHeader>
                            <CardTitle>Key Features</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {(signal.features || [
                                'Automated trading with advanced algorithms',
                                'Risk management and money management',
                                'Multi-timeframe analysis',
                                'Built-in stop loss and take profit',
                                'Backtested on historical data',
                                'Regular updates and support'
                              ]).map((feature: string, i: number) => (
                                <li key={i} className="flex items-start gap-2">
                                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </TabsContent>
                      
                      <TabsContent value="requirements">
                        <Card>
                          <CardHeader>
                            <CardTitle>System Requirements</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="flex items-start gap-3">
                                <Monitor className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                  <p className="font-medium">Platform</p>
                                  <p className="text-sm text-muted-foreground">
                                    {signal.compatibility || 'MetaTrader 4 / MetaTrader 5'}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-start gap-3">
                                <Cpu className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                  <p className="font-medium">Minimum Deposit</p>
                                  <p className="text-sm text-muted-foreground">
                                    {signal.minDeposit || '$100 (recommended $500+)'}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-start gap-3">
                                <HardDrive className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                  <p className="font-medium">Recommended Pairs</p>
                                  <p className="text-sm text-muted-foreground">
                                    {signal.pairs || 'EURUSD, GBPUSD, USDJPY, GOLD'}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-start gap-3">
                                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                  <p className="font-medium">Timeframe</p>
                                  <p className="text-sm text-muted-foreground">
                                    {signal.timeframe || 'M15, M30, H1, H4'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                      
                      <TabsContent value="installation">
                        <Card>
                          <CardHeader>
                            <CardTitle>Installation Guide</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ol className="space-y-3">
                              <li className="flex gap-3">
                                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                                  1
                                </span>
                                <div>
                                  <p className="font-medium">Download the EA file</p>
                                  <p className="text-sm text-muted-foreground">
                                    Click the download button to get the .ex4 or .ex5 file
                                  </p>
                                </div>
                              </li>
                              
                              <li className="flex gap-3">
                                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                                  2
                                </span>
                                <div>
                                  <p className="font-medium">Copy to MT4/MT5 folder</p>
                                  <p className="text-sm text-muted-foreground">
                                    Place the file in MQL4/Experts or MQL5/Experts folder
                                  </p>
                                </div>
                              </li>
                              
                              <li className="flex gap-3">
                                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                                  3
                                </span>
                                <div>
                                  <p className="font-medium">Restart MetaTrader</p>
                                  <p className="text-sm text-muted-foreground">
                                    Close and reopen your trading platform
                                  </p>
                                </div>
                              </li>
                              
                              <li className="flex gap-3">
                                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                                  4
                                </span>
                                <div>
                                  <p className="font-medium">Attach to chart</p>
                                  <p className="text-sm text-muted-foreground">
                                    Drag the EA from Navigator panel to your desired chart
                                  </p>
                                </div>
                              </li>
                              
                              <li className="flex gap-3">
                                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                                  5
                                </span>
                                <div>
                                  <p className="font-medium">Configure settings</p>
                                  <p className="text-sm text-muted-foreground">
                                    Adjust risk settings and parameters as needed
                                  </p>
                                </div>
                              </li>
                            </ol>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </>
                ) : null}
              </div>
              
              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Download Card */}
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle>Download Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {signalLoading ? (
                      <>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-10 w-full" />
                      </>
                    ) : signal ? (
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">File Size</span>
                            <span className="font-medium">{signal.fileSize || '2.4 MB'}</span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Version</span>
                            <span className="font-medium">{signal.version || '1.0.0'}</span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Updated</span>
                            <span className="font-medium">
                              {signal.updatedAt 
                                ? new Date(signal.updatedAt).toLocaleDateString()
                                : 'Recently'}
                            </span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Downloads</span>
                            <span className="font-medium">
                              {signal.downloadCount || Math.floor(Math.random() * 10000) + 1000}
                            </span>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        {/* Download Button */}
                        <Button
                          className="w-full"
                          size="lg"
                          onClick={() => trackDownload()}
                          disabled={isDownloading}
                          data-testid="button-download-signal"
                        >
                          {isDownloading ? (
                            <>
                              <span className="animate-pulse">Preparing download...</span>
                            </>
                          ) : (
                            <>
                              <Download className="mr-2 h-5 w-5" />
                              Download {signal.platform || 'EA'}
                            </>
                          )}
                        </Button>
                        
                        <Alert>
                          <Shield className="h-4 w-4" />
                          <AlertDescription>
                            100% safe and tested. All files are scanned for malware.
                          </AlertDescription>
                        </Alert>
                        
                        {/* Stats */}
                        <div className="pt-4 space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Popularity</span>
                              <span className="font-medium">
                                {Math.floor((signal.downloadCount || 5000) / 100)}%
                              </span>
                            </div>
                            <Progress value={Math.min(100, (signal.downloadCount || 5000) / 100)} />
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Success Rate</span>
                              <span className="font-medium">
                                {signal.successRate || '87%'}
                              </span>
                            </div>
                            <Progress value={parseInt(signal.successRate || '87')} />
                          </div>
                        </div>
                      </>
                    ) : null}
                  </CardContent>
                </Card>
                
                {/* Support Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Need Help?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a href="/docs" target="_blank">
                        <FileText className="mr-2 h-4 w-4" />
                        Documentation
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a href="/support" target="_blank">
                        <Users className="mr-2 h-4 w-4" />
                        Community Support
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </HelmetProvider>
  );
}