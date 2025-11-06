import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';
import {
  Search,
  Globe,
  RefreshCcw,
  Send,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  FileText,
  Rss,
  Link as LinkIcon,
  Code,
  Eye,
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  Activity,
  TrendingUp,
  Database,
  Zap,
  Shield,
  Target,
  FileCode,
  ExternalLink,
  Copy,
  Filter,
  ChevronDown
} from 'lucide-react';

interface SEOStatus {
  indexNow: {
    enabled: boolean;
    submissions: {
      today: number;
      dailyLimit: number;
      totalSubmissions: number;
      lastSubmission?: string;
    };
    keyGenerated: boolean;
  };
  sitemaps: {
    lastGenerated: string;
    types: {
      main: boolean;
      posts: boolean;
      signals: boolean;
      categories: boolean;
      pages: boolean;
      images: boolean;
      news: boolean;
    };
    totalUrls: number;
  };
  indexedPages: {
    google: number;
    bing: number;
    total: number;
    lastCheck: string;
  };
  rssFeed: {
    enabled: boolean;
    lastGenerated: string;
    subscriberCount: number;
  };
  structuredData: {
    schemas: number;
    validationErrors: number;
  };
}

interface IndexNowSubmission {
  id: string;
  url: string;
  status: 'success' | 'failed' | 'pending';
  engine: string;
  message?: string;
  submittedAt: string;
  retries: number;
}

interface SitemapInfo {
  type: string;
  url: string;
  urlCount: number;
  lastModified: string;
  size: string;
  status: 'active' | 'generating' | 'error';
}

interface MetaPreview {
  title: string;
  description: string;
  url: string;
  image?: string;
}

interface StructuredDataResult {
  url: string;
  schemas: Array<{
    type: string;
    valid: boolean;
    errors: string[];
    warnings: string[];
  }>;
  rawData: string;
}

export default function SEODashboard() {
  const { toast } = useToast();
  const [testUrl, setTestUrl] = useState('');
  const [submitUrl, setSubmitUrl] = useState('');
  const [selectedPreviewType, setSelectedPreviewType] = useState<'google' | 'facebook' | 'twitter'>('google');
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Fetch SEO status
  const { data: seoStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery<SEOStatus>({
    queryKey: ['/api/admin/seo/status'],
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Fetch recent IndexNow submissions
  const { data: submissions, isLoading: submissionsLoading, refetch: refetchSubmissions } = useQuery<{ 
    data: IndexNowSubmission[] 
  }>({
    queryKey: ['/api/admin/seo/submissions', { limit: 50 }],
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Fetch sitemap information
  const { data: sitemaps, isLoading: sitemapsLoading, refetch: refetchSitemaps } = useQuery<{ 
    data: SitemapInfo[] 
  }>({
    queryKey: ['/api/admin/seo/sitemaps'],
  });

  // Mutation for regenerating sitemaps
  const regenerateSitemaps = useMutation({
    mutationFn: (type?: string) => 
      apiRequest('/api/admin/seo/regenerate-sitemap', {
        method: 'POST',
        body: JSON.stringify({ type }),
      }),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Sitemaps regeneration started',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/seo/sitemaps'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/seo/status'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to regenerate sitemaps',
        variant: 'destructive',
      });
    },
  });

  // Mutation for submitting URL to IndexNow
  const submitToIndexNow = useMutation({
    mutationFn: (url: string) => 
      apiRequest('/api/admin/seo/submit-url', {
        method: 'POST',
        body: JSON.stringify({ url }),
      }),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'URL submitted to IndexNow',
      });
      setSubmitUrl('');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/seo/submissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/seo/status'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to submit URL',
        variant: 'destructive',
      });
    },
  });

  // Mutation for retrying failed submissions
  const retryFailedSubmissions = useMutation({
    mutationFn: () => 
      apiRequest('/api/admin/seo/retry-failed', {
        method: 'POST',
      }),
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: `Retried ${data.retried} failed submissions`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/seo/submissions'] });
    },
  });

  // Mutation for clearing SEO cache
  const clearCache = useMutation({
    mutationFn: () => 
      apiRequest('/api/admin/seo/clear-cache', {
        method: 'POST',
      }),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'SEO cache cleared',
      });
      refetchStatus();
      refetchSitemaps();
    },
  });

  // Query for meta preview
  const { data: metaPreview, isLoading: previewLoading, refetch: refetchPreview } = useQuery<MetaPreview>({
    queryKey: ['/api/admin/seo/preview', testUrl],
    enabled: !!testUrl,
  });

  // Query for structured data validation
  const { data: structuredData, isLoading: structuredLoading, refetch: refetchStructured } = useQuery<StructuredDataResult>({
    queryKey: ['/api/admin/seo/validate-structured-data', testUrl],
    enabled: !!testUrl,
  });

  // Download IndexNow key
  const handleDownloadKey = async () => {
    try {
      const response = await apiRequest('/api/admin/seo/indexnow-key');
      const blob = new Blob([response.key], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${response.filename}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: 'Success',
        description: 'IndexNow key downloaded',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download IndexNow key',
        variant: 'destructive',
      });
    }
  };

  // Export submissions to CSV
  const handleExportSubmissions = () => {
    if (!submissions?.data) return;

    const csv = [
      ['URL', 'Status', 'Engine', 'Message', 'Submitted At', 'Retries'].join(','),
      ...submissions.data.map(s => [
        s.url,
        s.status,
        s.engine,
        s.message || '',
        s.submittedAt,
        s.retries.toString()
      ].map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `indexnow-submissions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      description: 'Copied to clipboard',
    });
  };

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refetchStatus();
        refetchSubmissions();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refetchStatus, refetchSubmissions]);

  return (
    <AdminLayout 
      title="SEO Dashboard" 
      description="Monitor and manage your site's search engine optimization"
    >
      {/* Top Actions */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          onClick={() => setAutoRefresh(!autoRefresh)}
          data-testid="button-auto-refresh"
        >
          <RefreshCcw className={`mr-2 h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
          {autoRefresh ? 'Auto-refreshing' : 'Auto-refresh'}
        </Button>
        <Button 
          variant="outline"
          onClick={() => {
            refetchStatus();
            refetchSubmissions();
            refetchSitemaps();
          }}
          data-testid="button-manual-refresh"
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh All
        </Button>
      </div>

      {/* SEO Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card data-testid="card-indexnow-status">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IndexNow Status</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <>
                <Skeleton className="h-7 w-16 mb-2" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  {seoStatus?.indexNow.enabled ? (
                    <Badge variant="default">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {seoStatus?.indexNow.submissions.today}/{seoStatus?.indexNow.submissions.dailyLimit} today
                </p>
                {seoStatus?.indexNow.submissions.lastSubmission && (
                  <p className="text-xs text-muted-foreground">
                    Last: {format(new Date(seoStatus.indexNow.submissions.lastSubmission), 'h:mm a')}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-indexed-pages">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Indexed Pages</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <>
                <Skeleton className="h-7 w-20 mb-2" />
                <Skeleton className="h-4 w-28" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {seoStatus?.indexedPages.total.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Google: {seoStatus?.indexedPages.google || 0} | Bing: {seoStatus?.indexedPages.bing || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  Checked: {seoStatus?.indexedPages.lastCheck ? format(new Date(seoStatus.indexedPages.lastCheck), 'MMM d') : 'Never'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-sitemap-status">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sitemap Status</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <>
                <Skeleton className="h-7 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {seoStatus?.sitemaps.totalUrls.toLocaleString() || 0} URLs
                </div>
                <p className="text-xs text-muted-foreground">
                  Updated: {seoStatus?.sitemaps.lastGenerated ? 
                    format(new Date(seoStatus.sitemaps.lastGenerated), 'MMM d, h:mm a') : 
                    'Never'
                  }
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-rss-feed">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RSS Feed</CardTitle>
            <Rss className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <>
                <Skeleton className="h-7 w-16 mb-2" />
                <Skeleton className="h-4 w-28" />
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  {seoStatus?.rssFeed.enabled ? (
                    <Badge variant="default">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {seoStatus?.rssFeed.subscriberCount || 0} subscribers
                </p>
                <p className="text-xs text-muted-foreground">
                  Updated: {seoStatus?.rssFeed.lastGenerated ? 
                    format(new Date(seoStatus.rssFeed.lastGenerated), 'h:mm a') : 
                    'Never'
                  }
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sitemaps" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="sitemaps">Sitemaps</TabsTrigger>
          <TabsTrigger value="indexnow">IndexNow</TabsTrigger>
          <TabsTrigger value="preview">Meta Preview</TabsTrigger>
          <TabsTrigger value="structured">Structured Data</TabsTrigger>
          <TabsTrigger value="actions">Quick Actions</TabsTrigger>
        </TabsList>

        {/* Sitemap Management */}
        <TabsContent value="sitemaps" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sitemap Management</CardTitle>
                  <CardDescription>Manage and regenerate your XML sitemaps</CardDescription>
                </div>
                <Button 
                  onClick={() => regenerateSitemaps.mutate()}
                  disabled={regenerateSitemaps.isPending}
                  data-testid="button-regenerate-all"
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Regenerate All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sitemapsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {sitemaps?.data?.map((sitemap) => (
                    <div 
                      key={sitemap.type}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      data-testid={`sitemap-${sitemap.type}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FileCode className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{sitemap.type}</span>
                          <Badge variant={sitemap.status === 'active' ? 'default' : 'secondary'}>
                            {sitemap.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>{sitemap.urlCount} URLs</span>
                          <span>{sitemap.size}</span>
                          <span>Updated: {format(new Date(sitemap.lastModified), 'MMM d, h:mm a')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(sitemap.url)}
                          data-testid={`button-copy-${sitemap.type}`}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(sitemap.url, '_blank')}
                          data-testid={`button-view-${sitemap.type}`}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => regenerateSitemaps.mutate(sitemap.type)}
                          disabled={regenerateSitemaps.isPending}
                          data-testid={`button-regenerate-${sitemap.type}`}
                        >
                          <RefreshCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* IndexNow Monitoring */}
        <TabsContent value="indexnow" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>IndexNow Monitoring</CardTitle>
                  <CardDescription>Track URL submissions to search engines</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {seoStatus && (
                    <div className="text-sm text-muted-foreground mr-4">
                      Daily Limit: {seoStatus.indexNow.submissions.today}/{seoStatus.indexNow.submissions.dailyLimit}
                    </div>
                  )}
                  <Progress 
                    value={seoStatus ? (seoStatus.indexNow.submissions.today / seoStatus.indexNow.submissions.dailyLimit) * 100 : 0} 
                    className="w-32"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Input
                  placeholder="Enter URL to submit to IndexNow..."
                  value={submitUrl}
                  onChange={(e) => setSubmitUrl(e.target.value)}
                  className="flex-1"
                  data-testid="input-submit-url"
                />
                <Button
                  onClick={() => submitUrl && submitToIndexNow.mutate(submitUrl)}
                  disabled={!submitUrl || submitToIndexNow.isPending}
                  data-testid="button-submit-url"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Submit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => retryFailedSubmissions.mutate()}
                  disabled={retryFailedSubmissions.isPending}
                  data-testid="button-retry-failed"
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Retry Failed
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExportSubmissions}
                  disabled={!submissions?.data?.length}
                  data-testid="button-export-csv"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>

              <ScrollArea className="h-[400px] w-full rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>URL</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Engine</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Retries</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissionsLoading ? (
                      [...Array(10)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                        </TableRow>
                      ))
                    ) : submissions?.data?.length ? (
                      submissions.data.map((submission) => (
                        <TableRow key={submission.id} data-testid={`submission-${submission.id}`}>
                          <TableCell className="font-mono text-xs max-w-[300px] truncate">
                            {submission.url}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              submission.status === 'success' ? 'default' : 
                              submission.status === 'failed' ? 'destructive' : 
                              'secondary'
                            }>
                              {submission.status === 'success' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {submission.status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                              {submission.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                              {submission.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{submission.engine}</TableCell>
                          <TableCell className="text-xs">
                            {format(new Date(submission.submittedAt), 'MMM d, h:mm a')}
                          </TableCell>
                          <TableCell>{submission.retries}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No submissions found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meta Tags Preview */}
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Meta Tags Preview</CardTitle>
              <CardDescription>Preview how your pages appear in search results and social media</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Enter URL to preview (e.g., /blog/your-post-slug)..."
                    value={testUrl}
                    onChange={(e) => setTestUrl(e.target.value)}
                    className="flex-1"
                    data-testid="input-test-url"
                  />
                  <Button
                    onClick={() => {
                      refetchPreview();
                      refetchStructured();
                    }}
                    disabled={!testUrl || previewLoading}
                    data-testid="button-preview"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                </div>

                {metaPreview && (
                  <Tabs defaultValue="google" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="google">
                        <Search className="mr-2 h-4 w-4" />
                        Google
                      </TabsTrigger>
                      <TabsTrigger value="facebook">
                        <Facebook className="mr-2 h-4 w-4" />
                        Facebook
                      </TabsTrigger>
                      <TabsTrigger value="twitter">
                        <Twitter className="mr-2 h-4 w-4" />
                        Twitter
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="google">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="space-y-2">
                            <div className="text-blue-700 text-xl hover:underline cursor-pointer">
                              {metaPreview.title}
                            </div>
                            <div className="text-green-700 text-sm">
                              {metaPreview.url}
                            </div>
                            <div className="text-gray-600 text-sm">
                              {metaPreview.description}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="facebook">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="border rounded-lg overflow-hidden">
                            {metaPreview.image && (
                              <img 
                                src={metaPreview.image} 
                                alt="Preview" 
                                className="w-full h-48 object-cover"
                              />
                            )}
                            <div className="p-3 bg-gray-50">
                              <div className="text-xs text-gray-500 uppercase">
                                {new URL(metaPreview.url, window.location.origin).hostname}
                              </div>
                              <div className="font-semibold text-sm mt-1">
                                {metaPreview.title}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {metaPreview.description}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="twitter">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="border rounded-lg overflow-hidden">
                            {metaPreview.image && (
                              <img 
                                src={metaPreview.image} 
                                alt="Preview" 
                                className="w-full h-40 object-cover"
                              />
                            )}
                            <div className="p-3">
                              <div className="font-semibold text-sm">
                                {metaPreview.title}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {metaPreview.description}
                              </div>
                              <div className="text-xs text-gray-500 mt-2">
                                {new URL(metaPreview.url, window.location.origin).hostname}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Structured Data Validator */}
        <TabsContent value="structured" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Structured Data Validator</CardTitle>
              <CardDescription>Validate JSON-LD structured data on your pages</CardDescription>
            </CardHeader>
            <CardContent>
              {structuredData && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Code className="h-5 w-5" />
                    <span className="font-medium">Detected Schemas</span>
                    <Badge>{structuredData.schemas.length} schemas found</Badge>
                  </div>

                  {structuredData.schemas.map((schema, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{schema.type}</CardTitle>
                          <Badge variant={schema.valid ? 'default' : 'destructive'}>
                            {schema.valid ? 'Valid' : 'Invalid'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {schema.errors.length > 0 && (
                          <Alert variant="destructive" className="mb-3">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Errors</AlertTitle>
                            <AlertDescription>
                              <ul className="list-disc list-inside mt-2">
                                {schema.errors.map((error, i) => (
                                  <li key={i} className="text-sm">{error}</li>
                                ))}
                              </ul>
                            </AlertDescription>
                          </Alert>
                        )}

                        {schema.warnings.length > 0 && (
                          <Alert className="mb-3">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Warnings</AlertTitle>
                            <AlertDescription>
                              <ul className="list-disc list-inside mt-2">
                                {schema.warnings.map((warning, i) => (
                                  <li key={i} className="text-sm">{warning}</li>
                                ))}
                              </ul>
                            </AlertDescription>
                          </Alert>
                        )}

                        {schema.valid && schema.errors.length === 0 && schema.warnings.length === 0 && (
                          <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>
                              Schema is valid with no issues detected
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {structuredData.rawData && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Raw JSON-LD Data</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[300px] w-full rounded-md border bg-muted/30">
                          <pre className="p-4 text-xs">
                            <code>{JSON.stringify(JSON.parse(structuredData.rawData), null, 2)}</code>
                          </pre>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quick Actions */}
        <TabsContent value="actions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>SEO Operations</CardTitle>
                <CardDescription>Manage SEO-related operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start"
                  onClick={() => regenerateSitemaps.mutate()}
                  disabled={regenerateSitemaps.isPending}
                  data-testid="button-action-regenerate"
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Regenerate All Sitemaps
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => clearCache.mutate()}
                  disabled={clearCache.isPending}
                  data-testid="button-action-clear-cache"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Clear SEO Cache
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleDownloadKey}
                  data-testid="button-action-download-key"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download IndexNow Key
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open('/robots.txt', '_blank')}
                  data-testid="button-action-robots"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  View robots.txt
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>External Tools</CardTitle>
                <CardDescription>Access external SEO tools and validators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open(`https://search.google.com/search-console/index?resource=${encodeURIComponent(window.location.origin)}`, '_blank')}
                  data-testid="button-google-console"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Google Search Console
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open('https://www.bing.com/webmasters', '_blank')}
                  data-testid="button-bing-webmaster"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Bing Webmaster Tools
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open(`https://search.google.com/test/rich-results?url=${encodeURIComponent(window.location.origin)}`, '_blank')}
                  data-testid="button-rich-results"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Rich Results Test
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open(`https://pagespeed.web.dev/report?url=${encodeURIComponent(window.location.origin)}`, '_blank')}
                  data-testid="button-pagespeed"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  PageSpeed Insights
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* SEO Tips */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Best Practices</CardTitle>
              <CardDescription>Quick tips to improve your search engine rankings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                <Alert>
                  <Target className="h-4 w-4" />
                  <AlertDescription>
                    Keep meta titles under 60 characters and descriptions under 160 characters for optimal display in search results.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Activity className="h-4 w-4" />
                  <AlertDescription>
                    Submit new content to IndexNow immediately after publishing for faster indexing.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Code className="h-4 w-4" />
                  <AlertDescription>
                    Use structured data to help search engines understand your content better and enable rich snippets.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    Regularly update your content and sitemaps to maintain fresh signals for search engines.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}