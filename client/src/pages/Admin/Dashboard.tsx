import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import {
  FileText,
  CheckCircle,
  Edit,
  Eye,
  TrendingUp,
  Plus,
  Activity,
  ArrowUp,
  ArrowDown,
  Search,
  MousePointerClick,
  Target,
  BarChart3,
  Clock,
  Download
} from 'lucide-react';
import { Link } from 'wouter';
import { format } from 'date-fns';

interface StatsData {
  posts: { total: number; published: number; draft: number };
  signals: { total: number; active: number; inactive: number };
  downloads: { total: number; today: number; week: number };
  users: { total: number; active: number; new: number };
  analytics: { pageViews: number; totalViews: number; uniqueVisitors: number; avgSessionDuration: string };
  comments: { total: number; pending: number };
  categories: { total: number };
}

interface RecentActivity {
  recentPosts: Array<{ id: number; title: string; slug: string; status: string; author: string; createdAt: string; type: string }>;
  recentSignals: Array<{ id: number; name: string; platform: string; strategy: string; createdAt: string; type: string }>;
  recentComments: Array<{ id: number; name: string; email: string; comment: string; postTitle: string; postSlug: string; createdAt: string; type: string }>;
  allActivity: Array<{ id: number; createdAt: string; type: string; displayName: string; [key: string]: any }>;
}

interface SeoPerformance {
  searchTraffic: { value: number; period: string; change: string };
  impressions: { value: number; period: string; change: string };
  keywordsRanking: { value: number; total: number; percentage: number };
  avgPosition: { value: number; change: string };
  weeklyTraffic: Array<{ name: string; views: number; downloads: number }>;
}

interface BlogData {
  id: number;
  title: string;
  slug: string;
  author: string;
  status: string;
  views: number;
  createdAt: string;
  category: string | null;
  commentsCount: number;
  featuredImage: string;
}

export default function AdminDashboard() {
  // Fetch statistics from real API
  const { data: stats, isLoading: statsLoading } = useQuery<StatsData>({
    queryKey: ['/api/admin/stats']
  });

  // Fetch SEO performance data
  const { data: seoPerformance, isLoading: seoLoading } = useQuery<SeoPerformance>({
    queryKey: ['/api/admin/seo-performance']
  });

  // Fetch recent blogs
  const { data: recentBlogs, isLoading: blogsLoading } = useQuery<{ data: BlogData[] }>({
    queryKey: ['/api/admin/blogs', { limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }]
  });

  // Fetch recent activity
  const { data: recentActivity, isLoading: activityLoading } = useQuery<RecentActivity>({
    queryKey: ['/api/admin/recent-activity', { limit: 10 }]
  });

  const StatCard = ({ 
    title, 
    value, 
    description, 
    icon: Icon, 
    trend,
    loading = false 
  }: { 
    title: string; 
    value: string | number; 
    description?: string; 
    icon: React.ComponentType<{ className?: string }>; 
    trend?: 'up' | 'down';
    loading?: boolean;
  }) => (
    <Card data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <>
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-3 w-32" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && (
              <div className="flex items-center space-x-1">
                <p className="text-xs text-muted-foreground">{description}</p>
                {trend && (
                  <span className={`flex items-center text-xs ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                    {trend === 'up' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  const SeoCard = ({ 
    title, 
    value, 
    period, 
    change,
    icon: Icon,
    loading = false
  }: { 
    title: string; 
    value: string | number; 
    period?: string; 
    change?: string;
    icon: React.ComponentType<{ className?: string }>;
    loading?: boolean;
  }) => (
    <Card data-testid={`seo-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <>
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-3 w-28" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <div className="flex items-center justify-between">
              {period && <p className="text-xs text-muted-foreground">{period}</p>}
              {change && (
                <span className={`text-xs font-medium ${change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                  {change}
                </span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout title="Dashboard" description="Overview of your site's performance">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Link href="/admin/editor">
          <Button data-testid="button-new-post">
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </Link>
        <Link href="/admin/downloads">
          <Button variant="outline" data-testid="button-upload-download">
            <Plus className="mr-2 h-4 w-4" />
            Upload Download
          </Button>
        </Link>
        <Link href="/admin/analytics">
          <Button variant="outline" data-testid="button-view-analytics">
            <Activity className="mr-2 h-4 w-4" />
            View Analytics
          </Button>
        </Link>
      </div>

      {/* Top Stats Cards - 4 in a row */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title="Total Blogs"
          value={stats?.posts.total || 0}
          description={`${stats?.posts.published || 0} published, ${stats?.posts.draft || 0} drafts`}
          icon={FileText}
          loading={statsLoading}
        />
        <StatCard
          title="Total Signals"
          value={stats?.signals?.total || 0}
          description={`${stats?.signals?.active || 0} active, ${stats?.signals?.inactive || 0} inactive`}
          icon={Activity}
          loading={statsLoading}
        />
        <StatCard
          title="Downloads"
          value={stats?.downloads?.total?.toLocaleString() || 0}
          description="Total downloads"
          icon={Download}
          loading={statsLoading}
        />
        <StatCard
          title="Total Views"
          value={stats?.analytics.totalViews?.toLocaleString() || 0}
          description="All-time page views"
          icon={Eye}
          loading={statsLoading}
        />
      </div>

      {/* SEO Performance Section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">SEO Performance</h2>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <SeoCard
            title="Search Traffic"
            value={seoPerformance?.searchTraffic.value?.toLocaleString() || 0}
            period={seoPerformance?.searchTraffic.period}
            change={seoPerformance?.searchTraffic.change}
            icon={Search}
            loading={seoLoading}
          />
          <SeoCard
            title="Impressions"
            value={seoPerformance?.impressions.value?.toLocaleString() || 0}
            period={seoPerformance?.impressions.period}
            change={seoPerformance?.impressions.change}
            icon={MousePointerClick}
            loading={seoLoading}
          />
          <SeoCard
            title="Keywords Ranking"
            value={seoPerformance?.keywordsRanking.value || 0}
            period={`${seoPerformance?.keywordsRanking.percentage || 0}% coverage`}
            icon={Target}
            loading={seoLoading}
          />
          <SeoCard
            title="Avg Position"
            value={seoPerformance?.avgPosition.value || 0}
            change={seoPerformance?.avgPosition.change}
            icon={BarChart3}
            loading={seoLoading}
          />
        </div>
      </div>

      {/* Weekly Traffic Chart */}
      <Card className="mb-6" data-testid="chart-weekly-traffic">
        <CardHeader>
          <CardTitle>Weekly Traffic</CardTitle>
          <CardDescription>Page views and downloads over the past week</CardDescription>
        </CardHeader>
        <CardContent>
          {seoLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={seoPerformance?.weeklyTraffic || []}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#8884d8" 
                  fillOpacity={1} 
                  fill="url(#colorViews)" 
                  name="Page Views"
                />
                <Area 
                  type="monotone" 
                  dataKey="downloads" 
                  stroke="#82ca9d" 
                  fillOpacity={1} 
                  fill="url(#colorDownloads)" 
                  name="Downloads"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Recent Blogs Table */}
      <Card data-testid="recent-blogs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Blogs</CardTitle>
              <CardDescription>Latest blog posts and their performance</CardDescription>
            </div>
            <Link href="/admin/blogs">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {blogsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : recentBlogs?.data && recentBlogs.data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBlogs.data.map((blog) => (
                  <TableRow key={blog.id} data-testid={`blog-row-${blog.id}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        {blog.featuredImage && (
                          <div className="h-10 w-10 rounded overflow-hidden bg-muted">
                            <img 
                              src={blog.featuredImage} 
                              alt="" 
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div>
                          <p className="line-clamp-1">{blog.title}</p>
                          {blog.category && (
                            <p className="text-xs text-muted-foreground">{blog.category}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{blog.author}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={blog.status === 'published' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {blog.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Eye className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{blog.views.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(blog.createdAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/editor/${blog.id}`}>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No blogs found</p>
              <Link href="/admin/editor">
                <Button variant="outline" className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Blog
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}