import { useQuery } from '@tanstack/react-query';

import { HelmetProvider } from 'react-helmet-async';
import { useParams, useLocation, Link } from 'wouter';
import { 
  Star, Clock, FileText, CheckCircle2, 
  ArrowLeft, TrendingUp, AlertCircle,
  Monitor, Cpu, HardDrive, Users
} from 'lucide-react';

import Layout from '@/components/Layout';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SignalDetail() {
  const params = useParams();
  const id = params.id as string;
  const [location] = useLocation();

  // Fetch signal details
  const { data: signal, isLoading: signalLoading, error: signalError } = useQuery({
    queryKey: ['/api/signals', id],
    queryFn: async () => {
      const response = await fetch(`/api/signals/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch signal');
      }
      return response.json();
    },
    enabled: !!id
  });

  const breadcrumbs = [
    { name: 'Signals', href: '/signals' },
    { name: signal?.name || signal?.title || 'Loading...' }
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
              <h2 className="text-2xl font-bold mb-4">Signal not found</h2>
              <p className="text-muted-foreground mb-6">
                The signal you're looking for doesn't exist or has been removed.
              </p>
              <Link href="/signals">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Signals
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
        title={signal?.title || signal?.name || 'Trading Signal'}
        description={typeof signal?.description === 'string' ? signal.description.replace(/<[^>]*>/g, '').slice(0, 160) : ''}
        keywords={`${signal?.title || signal?.name}, ${signal?.platform || ''}, ${signal?.strategy || ''}, trading signal`}
        path={location}
        ogType="website"
      />
      
      <Layout breadcrumbs={breadcrumbs}>
        <div className="py-12">
          <div className="max-w-7xl mx-auto px-4">
            {/* Back Button */}
            <Link href="/signals">
              <Button variant="ghost" className="mb-6" data-testid="button-back-to-signals">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Signals
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
                    
                    {/* Screenshot */}
                    {(() => {
                      const getPrimaryImage = () => {
                        const s = (signal as any).screenshots || (signal as any).filePath || '';
                        const normalize = (u?: string) => {
                          if (!u) return undefined; const t = u.trim();
                          if (!t) return undefined; if (t.startsWith('http')) return t; if (t.startsWith('/')) return t; return `/${t}`;
                        };
                        try {
                          const parsed = typeof s === 'string' ? JSON.parse(s) : s;
                          if (Array.isArray(parsed) && parsed.length) return normalize(parsed[0]);
                          if (parsed && typeof parsed === 'object') {
                            const arr = parsed.images || parsed.screenshots || [];
                            if (Array.isArray(arr) && arr.length) return normalize(arr[0]);
                          }
                          if (typeof s === 'string') {
                            const parts = s.split(',').map((x: string) => x.trim()).filter(Boolean);
                            if (parts.length) return normalize(parts[0]);
                            return normalize(s);
                          }
                        } catch { /* ignore */ }
                        return undefined;
                      };
                      const src = getPrimaryImage();
                      return src ? (
                        <div className="mb-6 aspect-video rounded overflow-hidden bg-muted">
                          <img src={src} alt={signal.title || signal.name} className="w-full h-full object-cover" />
                        </div>
                      ) : null;
                    })()}

                    {/* Description */}
                    <Card className="mb-8">
                      <CardHeader>
                        <CardTitle>Signal Description</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div
                          className="text-muted-foreground"
                          data-testid="signal-description"
                          dangerouslySetInnerHTML={{ __html: signal.description || '' }}
                        />
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
                {/* Snapshot Card */}
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle>Signal Snapshot</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {signalLoading ? (
                      <>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-40 w-full" />
                      </>
                    ) : signal ? (
                      <>
                        {(() => {
                          const primary = (() => {
                            const s = (signal as any).screenshots || (signal as any).filePath || '';
                            try {
                              const parsed = typeof s === 'string' ? JSON.parse(s) : s;
                              if (Array.isArray(parsed) && parsed.length) return parsed[0];
                              if (parsed && typeof parsed === 'object') {
                                const arr = parsed.images || parsed.screenshots || [];
                                if (Array.isArray(arr) && arr.length) return arr[0];
                              }
                              if (typeof s === 'string') return s.split(',')[0];
                            } catch { return (signal as any).filePath; }
                            return (signal as any).filePath;
                          })();
                          const normalize = (u?: string) => u ? (u.startsWith('http') || u.startsWith('/') ? u : `/${u}`) : undefined;
                          const src = normalize(primary);
                          return src ? (
                            <div className="aspect-video rounded overflow-hidden bg-muted">
                              <img src={src} alt={signal.title || signal.name} className="w-full h-full object-cover" />
                            </div>
                          ) : null;
                        })()}
                        <div className="space-y-2 text-sm">
                          {signal.platform && (
                            <div className="flex justify-between"><span className="text-muted-foreground">Platform</span><span className="font-medium">{signal.platform}</span></div>
                          )}
                          {signal.strategy && (
                            <div className="flex justify-between"><span className="text-muted-foreground">Strategy</span><span className="font-medium">{signal.strategy}</span></div>
                          )}
                          {signal.updatedAt && (
                            <div className="flex justify-between"><span className="text-muted-foreground">Updated</span><span className="font-medium">{new Date(signal.updatedAt).toLocaleDateString()}</span></div>
                          )}
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