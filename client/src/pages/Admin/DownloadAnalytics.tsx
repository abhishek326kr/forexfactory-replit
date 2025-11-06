import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import DateRangePicker from '@/components/DateRangePicker';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Download,
  FileDown,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Calendar,
  Users,
  FileText,
  BarChart3,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  Globe,
  Clock,
  Award,
  Activity,
  Package,
  Loader2,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { format } from 'date-fns';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface DownloadStats {
  totalDownloads: number;
  downloadsToday: number;
  downloadsThisWeek: number;
  downloadsThisMonth: number;
  uniqueUsers: number;
  averageDownloadsPerUser: number;
  weeklyTrend: 'up' | 'down' | 'neutral';
  weeklyChangePercent: number;
  monthlyTrend: 'up' | 'down' | 'neutral';
  monthlyChangePercent: number;
  topDownloads: Array<{
    id: number;
    title: string;
    fileName: string;
    downloadCount: number;
    lastDownloaded: string;
    category: string;
    fileType: string;
  }>;
  recentDownloads: Array<{
    id: string;
    userId: number;
    userName: string;
    userEmail: string;
    postTitle: string;
    fileName: string;
    downloadedAt: string;
    ipAddress: string;
    userAgent: string;
  }>;
  chartData: Array<{
    date: string;
    downloads: number;
    uniqueUsers: number;
  }>;
  downloadsByType: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  downloadsByCountry: Array<{
    country: string;
    count: number;
  }>;
  peakDownloadHour: number;
  mostActiveDay: string;
}

const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

export default function DownloadAnalytics() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>();
  const [filterType, setFilterType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch download statistics
  const { data: stats, isLoading, error, refetch } = useQuery<DownloadStats>({
    queryKey: ['/api/admin/download-stats', { dateRange, filterType }],
    refetchInterval: 60000 // Refetch every minute
  });

  // Export downloads to CSV mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams();
      if (dateRange?.from) params.append('from', dateRange.from.toISOString());
      if (dateRange?.to) params.append('to', dateRange.to.toISOString());
      
      const response = await fetch(`/api/admin/downloads/export?${params}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to export downloads');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `downloads-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Export Successful',
        description: 'Download data has been exported to CSV.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Export Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const getTrendIcon = (trend: string, percent: number) => {
    if (trend === 'up') {
      return (
        <div className="flex items-center text-green-600">
          <ArrowUp className="h-4 w-4" />
          <span className="text-sm font-medium">+{Math.abs(percent)}%</span>
        </div>
      );
    } else if (trend === 'down') {
      return (
        <div className="flex items-center text-red-600">
          <ArrowDown className="h-4 w-4" />
          <span className="text-sm font-medium">-{Math.abs(percent)}%</span>
        </div>
      );
    }
    return (
      <div className="flex items-center text-gray-600">
        <span className="text-sm">0%</span>
      </div>
    );
  };

  const getFileTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'ea':
      case 'expert advisor':
        return <FileDown className="h-4 w-4" />;
      case 'indicator':
        return <BarChart3 className="h-4 w-4" />;
      case 'template':
        return <FileText className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const formatUserAgent = (ua: string) => {
    // Extract browser name from user agent
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Other';
  };

  const paginatedDownloads = stats?.recentDownloads?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ) || [];
  
  const totalPages = Math.ceil((stats?.recentDownloads?.length || 0) / itemsPerPage);

  return (
    <AdminLayout title="Download Analytics" description="Track and analyze file download activity">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            className="w-full sm:w-auto"
          />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-40" data-testid="select-filter-type">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="ea">Expert Advisors</SelectItem>
              <SelectItem value="indicator">Indicators</SelectItem>
              <SelectItem value="template">Templates</SelectItem>
              <SelectItem value="tool">Tools</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
            data-testid="button-refresh"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            data-testid="button-export-csv"
          >
            {exportMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 mr-2" />
            )}
            Export to CSV
          </Button>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card data-testid="card-total-downloads">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalDownloads || 0}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-downloads-today">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.downloadsToday || 0}</div>
                {stats?.weeklyTrend && getTrendIcon(stats.weeklyTrend, stats.weeklyChangePercent)}
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-unique-users">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.uniqueUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Avg {stats?.averageDownloadsPerUser?.toFixed(1) || 0} per user
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-monthly-downloads">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.downloadsThisMonth || 0}</div>
                {stats?.monthlyTrend && getTrendIcon(stats.monthlyTrend, stats.monthlyChangePercent)}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Downloads Trend Chart */}
        <Card data-testid="card-downloads-trend">
          <CardHeader>
            <CardTitle>Download Trend</CardTitle>
            <CardDescription>Downloads over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : stats?.chartData?.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="downloads" 
                    stroke="#3b82f6"
                    name="Downloads"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="uniqueUsers" 
                    stroke="#10b981"
                    name="Unique Users"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Downloads by Type Chart */}
        <Card data-testid="card-downloads-by-type">
          <CardHeader>
            <CardTitle>Downloads by Type</CardTitle>
            <CardDescription>Distribution of file types downloaded</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : stats?.downloadsByType?.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.downloadsByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, percentage }) => `${type}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {stats.downloadsByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Downloads Table */}
      <Card className="mb-6" data-testid="card-top-downloads">
        <CardHeader>
          <CardTitle>Most Downloaded Files</CardTitle>
          <CardDescription>Top 10 files by download count</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : stats?.topDownloads?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No downloads yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Downloads</TableHead>
                    <TableHead>Last Downloaded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.topDownloads?.map((file, index) => (
                    <TableRow key={file.id} data-testid={`row-top-download-${file.id}`}>
                      <TableCell>
                        {index === 0 && (
                          <Award className="h-5 w-5 text-yellow-500" />
                        )}
                        {index === 1 && (
                          <Award className="h-5 w-5 text-gray-400" />
                        )}
                        {index === 2 && (
                          <Award className="h-5 w-5 text-amber-600" />
                        )}
                        {index > 2 && (
                          <span className="text-muted-foreground">{index + 1}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{file.title}</p>
                          <p className="text-xs text-muted-foreground">{file.fileName}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getFileTypeIcon(file.fileType)}
                          <span className="text-sm">{file.fileType}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{file.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Download className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{file.downloadCount}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(file.lastDownloaded), 'MMM dd, HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Downloads Table */}
      <Card data-testid="card-recent-downloads">
        <CardHeader>
          <CardTitle>Recent Downloads</CardTitle>
          <CardDescription>Latest download activity with user details</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Failed to load download data</AlertDescription>
            </Alert>
          ) : paginatedDownloads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent downloads</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>File</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Browser</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDownloads.map((download) => (
                      <TableRow key={download.id} data-testid={`row-download-${download.id}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{download.userName}</p>
                            <p className="text-xs text-muted-foreground">{download.userEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{download.postTitle}</p>
                            <p className="text-xs text-muted-foreground">{download.fileName}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(download.downloadedAt), 'MMM dd, HH:mm')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-mono">{download.ipAddress}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatUserAgent(download.userAgent)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                    {Math.min(currentPage * itemsPerPage, stats?.recentDownloads?.length || 0)} of{' '}
                    {stats?.recentDownloads?.length || 0} downloads
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                      data-testid="button-prev-page"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                      data-testid="button-next-page"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Additional Insights */}
      <div className="grid gap-4 md:grid-cols-2 mt-6">
        <Card data-testid="card-peak-activity">
          <CardHeader>
            <CardTitle>Peak Activity</CardTitle>
            <CardDescription>Most active download periods</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Peak Hour</span>
                  <Badge variant="secondary">
                    {stats?.peakDownloadHour !== undefined 
                      ? `${stats.peakDownloadHour}:00 - ${stats.peakDownloadHour + 1}:00`
                      : 'N/A'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Most Active Day</span>
                  <Badge variant="secondary">{stats?.mostActiveDay || 'N/A'}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">This Week</span>
                  <span className="font-medium">{stats?.downloadsThisWeek || 0} downloads</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-geographic-distribution">
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
            <CardDescription>Downloads by country</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : stats?.downloadsByCountry?.length > 0 ? (
              <div className="space-y-2">
                {stats.downloadsByCountry.slice(0, 5).map((country) => (
                  <div key={country.country} className="flex justify-between items-center">
                    <span className="text-sm">{country.country}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ 
                            width: `${(country.count / stats.totalDownloads) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {country.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No geographic data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}