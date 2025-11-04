import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Save,
  Edit,
  AlertCircle,
  Globe,
  FileCode,
  FileText,
  Settings,
  Code,
  ExternalLink,
  Copy,
  CheckCircle,
  XCircle,
  TrendingUp,
  Link,
  Hash,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

interface SeoContent {
  id: string;
  type: 'blog' | 'signal' | 'page';
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  indexable: boolean;
  lastModified: string;
  status: 'good' | 'warning' | 'error';
  issues: string[];
}

interface SeoTemplate {
  id: string;
  name: string;
  contentType: 'blog' | 'signal' | 'page';
  titleTemplate: string;
  descriptionTemplate: string;
  keywordsTemplate: string;
}

export default function SeoManager() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContent, setSelectedContent] = useState<SeoContent | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<SeoTemplate | null>(null);
  const [robotsTxtContent, setRobotsTxtContent] = useState('');
  const [sitemapPreview, setSitemapPreview] = useState('');
  const [bulkEditIds, setBulkEditIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('content');

  // Fetch SEO content
  const { data: seoData, isLoading, error } = useQuery({
    queryKey: ['/api/admin/seo/content', { search: searchTerm }],
    queryFn: async () => {
      // Mock data for now - replace with actual API call
      return {
        content: [
          {
            id: '1',
            type: 'blog' as const,
            title: 'Getting Started with Forex Trading',
            slug: 'getting-started-forex-trading',
            metaTitle: 'Forex Trading Guide for Beginners | ForexHub',
            metaDescription: 'Learn forex trading basics with our comprehensive guide. Discover strategies, tools, and expert tips.',
            keywords: 'forex trading, beginner guide, trading strategies',
            canonicalUrl: 'https://forexhub.com/blog/getting-started-forex-trading',
            ogTitle: 'Forex Trading Guide for Beginners',
            ogDescription: 'Start your forex trading journey with our expert guide',
            ogImage: '/images/forex-guide.jpg',
            indexable: true,
            lastModified: '2025-01-02T10:00:00Z',
            status: 'good' as const,
            issues: []
          },
          {
            id: '2',
            type: 'signal' as const,
            title: 'Grid Trading EA Pro',
            slug: 'grid-trading-ea-pro',
            metaTitle: 'Grid Trading EA - Automated Forex Robot',
            metaDescription: 'Advanced grid trading expert advisor with AI risk management.',
            keywords: 'grid ea, forex robot, mt4 ea',
            indexable: true,
            lastModified: '2025-01-01T14:00:00Z',
            status: 'warning' as const,
            issues: ['Meta description too short (45 characters)']
          },
          {
            id: '3',
            type: 'page' as const,
            title: 'About Us',
            slug: 'about',
            metaTitle: 'About ForexHub - Leading Forex Trading Platform',
            metaDescription: 'ForexHub provides advanced trading tools, expert advisors, and educational resources for forex traders worldwide.',
            keywords: 'forex platform, trading tools, about forexhub',
            indexable: true,
            lastModified: '2024-12-28T09:00:00Z',
            status: 'good' as const,
            issues: []
          },
          {
            id: '4',
            type: 'blog' as const,
            title: 'Market Analysis Q1 2025',
            slug: 'market-analysis-q1-2025',
            metaTitle: '',
            metaDescription: '',
            keywords: '',
            indexable: true,
            lastModified: '2025-01-03T11:00:00Z',
            status: 'error' as const,
            issues: ['Missing meta title', 'Missing meta description', 'No keywords defined']
          }
        ],
        stats: {
          total: 4,
          good: 2,
          warning: 1,
          error: 1,
          avgTitleLength: 45,
          avgDescriptionLength: 120
        }
      };
    }
  });

  // Fetch SEO templates
  const { data: templatesData } = useQuery({
    queryKey: ['/api/admin/seo/templates'],
    queryFn: async () => {
      // Mock data for now
      return {
        templates: [
          {
            id: '1',
            name: 'Blog Post Template',
            contentType: 'blog' as const,
            titleTemplate: '{title} | ForexHub Blog',
            descriptionTemplate: '{excerpt} Read more on ForexHub.',
            keywordsTemplate: 'forex, trading, {category}, {tags}'
          },
          {
            id: '2',
            name: 'Signal/EA Template',
            contentType: 'signal' as const,
            titleTemplate: '{name} - {platform} Expert Advisor | ForexHub',
            descriptionTemplate: 'Download {name} EA for {platform}. {description}',
            keywordsTemplate: '{name}, {platform} ea, forex robot, {strategy}'
          }
        ]
      };
    }
  });

  // Fetch robots.txt
  const { data: robotsData } = useQuery({
    queryKey: ['/api/admin/seo/robots'],
    queryFn: async () => {
      // Mock data
      return {
        content: `User-agent: *
Disallow: /admin/
Disallow: /api/
Disallow: /private/
Allow: /

Sitemap: https://forexhub.com/sitemap.xml`
      };
    }
  });

  // Fetch sitemap preview
  const { data: sitemapData } = useQuery({
    queryKey: ['/api/admin/seo/sitemap'],
    queryFn: async () => {
      // Mock data
      return {
        preview: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://forexhub.com/</loc>
    <lastmod>2025-01-03</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://forexhub.com/blog/getting-started-forex-trading</loc>
    <lastmod>2025-01-02</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://forexhub.com/signals/grid-trading-ea-pro</loc>
    <lastmod>2025-01-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`,
        urls: 15,
        lastGenerated: '2025-01-03T12:00:00Z'
      };
    }
  });

  // Update SEO content mutation
  const updateSeoMutation = useMutation({
    mutationFn: async (data: Partial<SeoContent>) => {
      const response = await apiRequest('PUT', `/api/admin/seo/content/${data.id}`, data);
      if (!response.ok) throw new Error('Failed to update SEO');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/seo/content'] });
      toast({
        title: 'SEO updated',
        description: 'SEO settings have been updated successfully.'
      });
      setSelectedContent(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async (data: { ids: string[]; updates: Partial<SeoContent> }) => {
      const response = await apiRequest('POST', '/api/admin/seo/bulk-update', data);
      if (!response.ok) throw new Error('Failed to bulk update');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/seo/content'] });
      toast({
        title: 'Bulk update complete',
        description: `${bulkEditIds.size} items have been updated.`
      });
      setBulkEditIds(new Set());
    },
    onError: (error: Error) => {
      toast({
        title: 'Bulk update failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Save robots.txt mutation
  const saveRobotsMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('PUT', '/api/admin/seo/robots', { content });
      if (!response.ok) throw new Error('Failed to save robots.txt');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'robots.txt saved',
        description: 'The robots.txt file has been updated.'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Save failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Regenerate sitemap mutation
  const regenerateSitemapMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/seo/sitemap/regenerate', {});
      if (!response.ok) throw new Error('Failed to regenerate sitemap');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/seo/sitemap'] });
      toast({
        title: 'Sitemap regenerated',
        description: 'The sitemap has been successfully regenerated.'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Regeneration failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Content copied to clipboard'
    });
  };

  const toggleBulkSelect = (id: string) => {
    const newSelection = new Set(bulkEditIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setBulkEditIds(newSelection);
  };

  const content = seoData?.content || [];

  return (
    <AdminLayout title="SEO Manager" description="Manage SEO settings and optimize for search engines">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card data-testid="stat-total-pages">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{seoData?.stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-good-seo">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Good SEO</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold text-green-600">
                {seoData?.stats?.good || 0}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-warnings">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-2xl font-bold text-yellow-600">
                {seoData?.stats?.warning || 0}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-errors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-2xl font-bold text-red-600">
                {seoData?.stats?.error || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEO Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="content" data-testid="tab-content">
            <FileText className="h-4 w-4 mr-2" />
            Content SEO
          </TabsTrigger>
          <TabsTrigger value="templates" data-testid="tab-templates">
            <Code className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="robots" data-testid="tab-robots">
            <Settings className="h-4 w-4 mr-2" />
            robots.txt
          </TabsTrigger>
          <TabsTrigger value="sitemap" data-testid="tab-sitemap">
            <Globe className="h-4 w-4 mr-2" />
            Sitemap
          </TabsTrigger>
        </TabsList>

        {/* Content SEO Tab */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Content SEO</CardTitle>
              <CardDescription>
                Manage SEO settings for all your content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Actions */}
              <div className="flex justify-between items-center mb-4">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-content"
                  />
                </div>
                {bulkEditIds.size > 0 && (
                  <Button
                    onClick={() => {
                      // Open bulk edit dialog
                    }}
                    data-testid="button-bulk-edit"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit {bulkEditIds.size} selected
                  </Button>
                )}
              </div>

              {/* SEO Content Table */}
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                  <p className="text-muted-foreground">Failed to load SEO data</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <input
                            type="checkbox"
                            checked={bulkEditIds.size === content.length && content.length > 0}
                            onChange={() => {
                              if (bulkEditIds.size === content.length) {
                                setBulkEditIds(new Set());
                              } else {
                                setBulkEditIds(new Set(content.map(c => c.id)));
                              }
                            }}
                            data-testid="checkbox-select-all"
                          />
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Meta Title</TableHead>
                        <TableHead>Meta Description</TableHead>
                        <TableHead>Issues</TableHead>
                        <TableHead>Modified</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {content.map((item: SeoContent) => (
                        <TableRow key={item.id} data-testid={`row-seo-${item.id}`}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={bulkEditIds.has(item.id)}
                              onChange={() => toggleBulkSelect(item.id)}
                              data-testid={`checkbox-${item.id}`}
                            />
                          </TableCell>
                          <TableCell>{getStatusIcon(item.status)}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.title}</p>
                              <p className="text-xs text-muted-foreground">/{item.slug}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.type}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <p className="truncate text-sm">
                              {item.metaTitle || <span className="text-muted-foreground">Not set</span>}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.metaTitle?.length || 0}/60 chars
                            </p>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <p className="truncate text-sm">
                              {item.metaDescription || <span className="text-muted-foreground">Not set</span>}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.metaDescription?.length || 0}/160 chars
                            </p>
                          </TableCell>
                          <TableCell>
                            {item.issues.length > 0 ? (
                              <div className="space-y-1">
                                {item.issues.slice(0, 2).map((issue, index) => (
                                  <Badge key={index} variant="destructive" className="text-xs">
                                    {issue}
                                  </Badge>
                                ))}
                                {item.issues.length > 2 && (
                                  <Badge variant="destructive" className="text-xs">
                                    +{item.issues.length - 2} more
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <Badge variant="secondary">All good</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(item.lastModified), 'MMM dd')}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedContent(item)}
                              data-testid={`button-edit-${item.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>SEO Templates</CardTitle>
              <CardDescription>
                Define templates for automatic SEO generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {templatesData?.templates.map((template: SeoTemplate) => (
                <Card key={template.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription>
                          For {template.contentType} content
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingTemplate(template)}
                        data-testid={`button-edit-template-${template.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Title Template:</span>
                      <code className="ml-2 px-2 py-1 bg-muted rounded">
                        {template.titleTemplate}
                      </code>
                    </div>
                    <div>
                      <span className="font-medium">Description Template:</span>
                      <code className="ml-2 px-2 py-1 bg-muted rounded">
                        {template.descriptionTemplate}
                      </code>
                    </div>
                    <div>
                      <span className="font-medium">Keywords Template:</span>
                      <code className="ml-2 px-2 py-1 bg-muted rounded">
                        {template.keywordsTemplate}
                      </code>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Template Variables</AlertTitle>
                <AlertDescription>
                  Use variables like {'{title}'}, {'{excerpt}'}, {'{category}'}, {'{tags}'} in your templates.
                  These will be automatically replaced with actual content values.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* robots.txt Tab */}
        <TabsContent value="robots">
          <Card>
            <CardHeader>
              <CardTitle>robots.txt Configuration</CardTitle>
              <CardDescription>
                Control how search engines crawl your site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>robots.txt Content</Label>
                <Textarea
                  value={robotsTxtContent || robotsData?.content || ''}
                  onChange={(e) => setRobotsTxtContent(e.target.value)}
                  className="font-mono text-sm h-64"
                  placeholder="User-agent: *"
                  data-testid="textarea-robots"
                />
              </div>
              
              <div className="flex justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => window.open('/robots.txt', '_blank')}
                    data-testid="button-view-robots"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Live
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(robotsTxtContent || robotsData?.content || '')}
                    data-testid="button-copy-robots"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <Button
                  onClick={() => saveRobotsMutation.mutate(robotsTxtContent || robotsData?.content || '')}
                  disabled={saveRobotsMutation.isPending}
                  data-testid="button-save-robots"
                >
                  {saveRobotsMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save robots.txt
                    </>
                  )}
                </Button>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Changes to robots.txt can affect how search engines index your site.
                  Be careful not to block important content from being crawled.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sitemap Tab */}
        <TabsContent value="sitemap">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>XML Sitemap</CardTitle>
                  <CardDescription>
                    Help search engines discover your content
                  </CardDescription>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="mb-2">
                    {sitemapData?.urls || 0} URLs
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    Last generated: {sitemapData?.lastGenerated 
                      ? format(new Date(sitemapData.lastGenerated), 'MMM dd, HH:mm')
                      : 'Never'}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Sitemap Preview</Label>
                <Textarea
                  value={sitemapData?.preview || ''}
                  readOnly
                  className="font-mono text-xs h-64"
                  data-testid="textarea-sitemap"
                />
              </div>
              
              <div className="flex justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => window.open('/sitemap.xml', '_blank')}
                    data-testid="button-view-sitemap"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Live
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(sitemapData?.preview || '')}
                    data-testid="button-copy-sitemap"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy URL
                  </Button>
                </div>
                <Button
                  onClick={() => regenerateSitemapMutation.mutate()}
                  disabled={regenerateSitemapMutation.isPending}
                  data-testid="button-regenerate-sitemap"
                >
                  {regenerateSitemapMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate Sitemap
                    </>
                  )}
                </Button>
              </div>
              
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertTitle>Automatic Updates</AlertTitle>
                <AlertDescription>
                  The sitemap is automatically updated when content is added or modified.
                  Manual regeneration is only needed if you notice missing pages.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit SEO Dialog */}
      <Dialog open={!!selectedContent} onOpenChange={() => setSelectedContent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit SEO Settings</DialogTitle>
            <DialogDescription>
              {selectedContent?.title} - {selectedContent?.type}
            </DialogDescription>
          </DialogHeader>
          
          {selectedContent && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateSeoMutation.mutate({
                  id: selectedContent.id,
                  metaTitle: formData.get('metaTitle') as string,
                  metaDescription: formData.get('metaDescription') as string,
                  keywords: formData.get('keywords') as string,
                  canonicalUrl: formData.get('canonicalUrl') as string,
                  ogTitle: formData.get('ogTitle') as string,
                  ogDescription: formData.get('ogDescription') as string,
                  ogImage: formData.get('ogImage') as string
                });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Meta Title</Label>
                <Input
                  name="metaTitle"
                  defaultValue={selectedContent.metaTitle}
                  maxLength={60}
                  data-testid="input-meta-title"
                />
                <p className="text-xs text-muted-foreground">
                  {selectedContent.metaTitle?.length || 0}/60 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea
                  name="metaDescription"
                  defaultValue={selectedContent.metaDescription}
                  maxLength={160}
                  className="resize-none"
                  data-testid="textarea-meta-description"
                />
                <p className="text-xs text-muted-foreground">
                  {selectedContent.metaDescription?.length || 0}/160 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label>Keywords</Label>
                <Input
                  name="keywords"
                  defaultValue={selectedContent.keywords}
                  placeholder="forex, trading, ea, signals"
                  data-testid="input-keywords"
                />
              </div>

              <div className="space-y-2">
                <Label>Canonical URL</Label>
                <Input
                  name="canonicalUrl"
                  type="url"
                  defaultValue={selectedContent.canonicalUrl}
                  placeholder="https://forexhub.com/..."
                  data-testid="input-canonical-url"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Open Graph Title</Label>
                <Input
                  name="ogTitle"
                  defaultValue={selectedContent.ogTitle}
                  data-testid="input-og-title"
                />
              </div>

              <div className="space-y-2">
                <Label>Open Graph Description</Label>
                <Textarea
                  name="ogDescription"
                  defaultValue={selectedContent.ogDescription}
                  className="resize-none"
                  data-testid="textarea-og-description"
                />
              </div>

              <div className="space-y-2">
                <Label>Open Graph Image</Label>
                <Input
                  name="ogImage"
                  type="url"
                  defaultValue={selectedContent.ogImage}
                  placeholder="https://forexhub.com/images/..."
                  data-testid="input-og-image"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSelectedContent(null)}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-save-seo">
                  Save SEO Settings
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}