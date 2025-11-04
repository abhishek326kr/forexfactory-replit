import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  FileText,
  Download,
  Users,
  Eye,
  TrendingUp,
  Plus,
  Activity,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Link } from 'wouter';
import { format } from 'date-fns';

// Mock data for charts - replace with actual API data
const trafficData = [
  { name: 'Mon', views: 4000, downloads: 240 },
  { name: 'Tue', views: 3000, downloads: 139 },
  { name: 'Wed', views: 2000, downloads: 980 },
  { name: 'Thu', views: 2780, downloads: 390 },
  { name: 'Fri', views: 1890, downloads: 480 },
  { name: 'Sat', views: 2390, downloads: 380 },
  { name: 'Sun', views: 3490, downloads: 430 }
];

const platformData = [
  { name: 'MT4', value: 60, color: '#0088FE' },
  { name: 'MT5', value: 40, color: '#00C49F' }
];

interface StatsData {
  posts: { total: number; published: number; draft: number };
  downloads: { total: number; today: number; week: number };
  users: { total: number; active: number; new: number };
  analytics: { pageViews: number; uniqueVisitors: number; avgSessionDuration: string };
}

interface RecentActivity {
  id: string;
  type: 'post' | 'download' | 'user' | 'comment';
  title: string;
  timestamp: Date;
  user?: string;
}

export default function AdminDashboard() {
  // Fetch statistics
  const { data: stats, isLoading: statsLoading } = useQuery<StatsData>({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      // Mock data - replace with actual API call
      return {
        posts: { total: 156, published: 142, draft: 14 },
        downloads: { total: 1234, today: 45, week: 312 },
        users: { total: 8567, active: 2341, new: 123 },
        analytics: { pageViews: 45678, uniqueVisitors: 12345, avgSessionDuration: '3:45' }
      };
    }
  });

  // Fetch recent activities
  const { data: activities, isLoading: activitiesLoading } = useQuery<RecentActivity[]>({
    queryKey: ['/api/admin/activities'],
    queryFn: async () => {
      // Mock data - replace with actual API call
      return [
        { id: '1', type: 'post', title: 'New blog post published: Advanced Trading Strategies', timestamp: new Date(), user: 'admin' },
        { id: '2', type: 'download', title: 'MT5 EA v2.0 uploaded', timestamp: new Date(Date.now() - 3600000), user: 'admin' },
        { id: '3', type: 'user', title: 'New user registered: trader123', timestamp: new Date(Date.now() - 7200000) },
        { id: '4', type: 'comment', title: 'New comment on: Grid Trading EA Review', timestamp: new Date(Date.now() - 10800000), user: 'user456' },
        { id: '5', type: 'download', title: 'Scalping Bot v1.5 downloaded 25 times', timestamp: new Date(Date.now() - 14400000) }
      ];
    }
  });

  const StatCard = ({ 
    title, 
    value, 
    description, 
    icon: Icon, 
    trend 
  }: { 
    title: string; 
    value: string | number; 
    description: string; 
    icon: React.ComponentType<{ className?: string }>; 
    trend?: 'up' | 'down' 
  }) => (
    <Card data-testid={`stat-${title.toLowerCase().replace(' ', '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center space-x-1">
          <p className="text-xs text-muted-foreground">{description}</p>
          {trend && (
            <span className={`flex items-center text-xs ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {trend === 'up' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            </span>
          )}
        </div>
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

      {/* Statistics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {statsLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : stats ? (
          <>
            <StatCard
              title="Total Posts"
              value={stats.posts.total}
              description={`${stats.posts.published} published, ${stats.posts.draft} drafts`}
              icon={FileText}
              trend="up"
            />
            <StatCard
              title="Downloads"
              value={stats.downloads.total}
              description={`${stats.downloads.today} today, ${stats.downloads.week} this week`}
              icon={Download}
              trend="up"
            />
            <StatCard
              title="Total Users"
              value={stats.users.total.toLocaleString()}
              description={`${stats.users.active.toLocaleString()} active, ${stats.users.new} new`}
              icon={Users}
              trend="up"
            />
            <StatCard
              title="Page Views"
              value={stats.analytics.pageViews.toLocaleString()}
              description={`${stats.analytics.uniqueVisitors.toLocaleString()} unique visitors`}
              icon={Eye}
              trend="down"
            />
          </>
        ) : null}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        {/* Traffic Chart */}
        <Card className="lg:col-span-2" data-testid="chart-traffic">
          <CardHeader>
            <CardTitle>Traffic Overview</CardTitle>
            <CardDescription>Page views and downloads over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="views" stroke="#8884d8" name="Page Views" />
                <Line type="monotone" dataKey="downloads" stroke="#82ca9d" name="Downloads" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Platform Distribution */}
        <Card data-testid="chart-platform">
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
            <CardDescription>Downloads by platform</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card data-testid="recent-activity">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions and events on your site</CardDescription>
        </CardHeader>
        <CardContent>
          {activitiesLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities ? (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4" data-testid={`activity-${activity.id}`}>
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    {activity.type === 'post' && <FileText className="h-5 w-5" />}
                    {activity.type === 'download' && <Download className="h-5 w-5" />}
                    {activity.type === 'user' && <Users className="h-5 w-5" />}
                    {activity.type === 'comment' && <Eye className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(activity.timestamp, 'PPp')}
                      {activity.user && ` by ${activity.user}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}