import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  TrendingUp,
  Users,
  Eye,
  Download,
  Search,
  Monitor,
  Smartphone,
  Globe,
  Calendar,
  FileText,
  Clock,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';

// Mock data - replace with actual API calls
const pageViewsData = [
  { date: 'Jan 1', views: 4500, uniqueVisitors: 2300 },
  { date: 'Jan 2', views: 5200, uniqueVisitors: 2800 },
  { date: 'Jan 3', views: 4800, uniqueVisitors: 2500 },
  { date: 'Jan 4', views: 6100, uniqueVisitors: 3200 },
  { date: 'Jan 5', views: 5900, uniqueVisitors: 3100 },
  { date: 'Jan 6', views: 7200, uniqueVisitors: 3800 },
  { date: 'Jan 7', views: 6800, uniqueVisitors: 3500 }
];

const downloadsByCategory = [
  { category: 'Expert Advisors', downloads: 3450, percentage: 45 },
  { category: 'Indicators', downloads: 2100, percentage: 27 },
  { category: 'Scripts', downloads: 1200, percentage: 16 },
  { category: 'Libraries', downloads: 950, percentage: 12 }
];

const topPages = [
  { page: '/downloads/grid-trading-ea', views: 12450, bounceRate: 23 },
  { page: '/blog/forex-trading-strategies', views: 10230, bounceRate: 35 },
  { page: '/downloads/scalping-bot', views: 8900, bounceRate: 28 },
  { page: '/blog/mt5-vs-mt4-comparison', views: 7650, bounceRate: 42 },
  { page: '/downloads/support-resistance', views: 6320, bounceRate: 31 }
];

const searchQueries = [
  { query: 'grid trading ea', count: 2345, trend: 'up' },
  { query: 'mt5 expert advisor', count: 1890, trend: 'up' },
  { query: 'scalping indicator', count: 1567, trend: 'down' },
  { query: 'forex robot', count: 1234, trend: 'stable' },
  { query: 'free ea download', count: 987, trend: 'up' }
];

const deviceData = [
  { name: 'Desktop', value: 65, color: '#0088FE' },
  { name: 'Mobile', value: 30, color: '#00C49F' },
  { name: 'Tablet', value: 5, color: '#FFBB28' }
];

const countryData = [
  { country: 'United States', users: 3456, percentage: 28 },
  { country: 'United Kingdom', users: 2134, percentage: 17 },
  { country: 'Germany', users: 1890, percentage: 15 },
  { country: 'Canada', users: 1234, percentage: 10 },
  { country: 'Australia', users: 987, percentage: 8 }
];

const engagementMetrics = {
  avgSessionDuration: '4:32',
  pagesPerSession: 3.8,
  bounceRate: 32.5,
  returnVisitorRate: 45.2
};

export default function Analytics() {
  const [dateRange, setDateRange] = useState('7days');
  const [selectedMetric, setSelectedMetric] = useState('pageviews');

  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/analytics', dateRange],
    queryFn: async () => {
      // Mock data - replace with actual API call
      return {
        pageViews: pageViewsData,
        downloads: downloadsByCategory,
        topPages,
        searchQueries,
        devices: deviceData,
        countries: countryData,
        engagement: engagementMetrics,
        summary: {
          totalPageViews: 42500,
          uniqueVisitors: 18900,
          totalDownloads: 7700,
          avgLoadTime: 1.8
        }
      };
    }
  });

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon 
  }: { 
    title: string; 
    value: string | number; 
    change: number; 
    icon: React.ComponentType<{ className?: string }> 
  }) => (
    <Card data-testid={`stat-${title.toLowerCase().replace(' ', '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center text-xs text-muted-foreground">
          <TrendingUp className={`mr-1 h-3 w-3 ${change >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          <span className={change >= 0 ? 'text-green-500' : 'text-red-500'}>
            {change >= 0 ? '+' : ''}{change}%
          </span>
          <span className="ml-1">from last period</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout title="Analytics" description="Track your website performance and user engagement">
      {/* Date Range Selector */}
      <div className="flex justify-between items-center mb-6">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-40" data-testid="select-date-range">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24hours">Last 24 Hours</SelectItem>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="90days">Last 90 Days</SelectItem>
            <SelectItem value="12months">Last 12 Months</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" data-testid="button-export">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard
              title="Page Views"
              value={analytics?.summary.totalPageViews.toLocaleString() || '0'}
              change={12.5}
              icon={Eye}
            />
            <StatCard
              title="Unique Visitors"
              value={analytics?.summary.uniqueVisitors.toLocaleString() || '0'}
              change={8.2}
              icon={Users}
            />
            <StatCard
              title="Total Downloads"
              value={analytics?.summary.totalDownloads.toLocaleString() || '0'}
              change={15.7}
              icon={Download}
            />
            <StatCard
              title="Avg Load Time"
              value={`${analytics?.summary.avgLoadTime || '0'}s`}
              change={-5.3}
              icon={Activity}
            />
          </>
        )}
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="traffic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="downloads">Downloads</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="traffic" className="space-y-4">
          {/* Page Views Chart */}
          <Card data-testid="chart-page-views">
            <CardHeader>
              <CardTitle>Page Views & Unique Visitors</CardTitle>
              <CardDescription>Traffic overview for the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={pageViewsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    name="Page Views"
                  />
                  <Area
                    type="monotone"
                    dataKey="uniqueVisitors"
                    stackId="1"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    name="Unique Visitors"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Top Pages */}
            <Card data-testid="top-pages">
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
                <CardDescription>Most visited pages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topPages.map((page, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{page.page}</p>
                        <p className="text-xs text-muted-foreground">
                          {page.views.toLocaleString()} views • {page.bounceRate}% bounce rate
                        </p>
                      </div>
                      <Badge variant="outline">{index + 1}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Device Distribution */}
            <Card data-testid="chart-devices">
              <CardHeader>
                <CardTitle>Device Distribution</CardTitle>
                <CardDescription>Traffic by device type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {deviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Geographic Distribution */}
          <Card data-testid="geographic-distribution">
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
              <CardDescription>Users by country</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {countryData.map((country) => (
                  <div key={country.country} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{country.country}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {country.users.toLocaleString()} ({country.percentage}%)
                      </span>
                    </div>
                    <Progress value={country.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="downloads" className="space-y-4">
          {/* Downloads by Category */}
          <Card data-testid="chart-downloads">
            <CardHeader>
              <CardTitle>Downloads by Category</CardTitle>
              <CardDescription>Distribution of downloads across different categories</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={downloadsByCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="downloads" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Download Statistics */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Download Trends</CardTitle>
                <CardDescription>Performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {downloadsByCategory.map((item) => (
                    <div key={item.category} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{item.category}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.downloads.toLocaleString()} downloads
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={item.percentage > 30 ? 'default' : 'secondary'}>
                          {item.percentage}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Popular Downloads</CardTitle>
                <CardDescription>Most downloaded files this period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Grid Trading EA Pro', 'Scalping Bot Ultra', 'Support & Resistance Indicator', 'Trend Following EA'].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm truncate flex-1">{item}</span>
                      <Badge variant="outline">{345 - index * 50} downloads</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          {/* Search Queries */}
          <Card data-testid="search-queries">
            <CardHeader>
              <CardTitle>Top Search Queries</CardTitle>
              <CardDescription>Most searched terms on your site</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {searchQueries.map((query, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{query.query}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{query.count} searches</Badge>
                      {query.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                      {query.trend === 'down' && <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Search Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Search Performance</CardTitle>
              <CardDescription>Search metrics and effectiveness</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Search Results</p>
                  <p className="text-2xl font-bold">23.4</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Click-Through Rate</p>
                  <p className="text-2xl font-bold">68.5%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Zero Results Rate</p>
                  <p className="text-2xl font-bold">2.1%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Search Time</p>
                  <p className="text-2xl font-bold">0.8s</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          {/* Engagement Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card data-testid="engagement-session-duration">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{engagementMetrics.avgSessionDuration}</span>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="engagement-pages-per-session">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pages per Session</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{engagementMetrics.pagesPerSession}</span>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="engagement-bounce-rate">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{engagementMetrics.bounceRate}%</span>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="engagement-return-rate">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Return Visitor Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{engagementMetrics.returnVisitorRate}%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Flow */}
          <Card>
            <CardHeader>
              <CardTitle>User Flow</CardTitle>
              <CardDescription>Common user journeys through your site</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { path: 'Home → Downloads → Grid Trading EA → Download', users: 1234 },
                  { path: 'Blog → Trading Strategies → Downloads', users: 987 },
                  { path: 'Home → Blog → About Us', users: 765 },
                  { path: 'Downloads → Category: EA → Specific Product', users: 543 }
                ].map((flow, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{flow.path}</span>
                    <Badge variant="outline">{flow.users} users</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}