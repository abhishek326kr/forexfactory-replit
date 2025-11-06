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
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Mail,
  Send,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Activity,
  Zap,
  TestTube,
  FileDown,
  Loader2,
  Inbox,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

interface EmailStats {
  totalSubscribers: number;
  subscribersToday: number;
  welcomeEmailsSentToday: number;
  newPostNotificationsSentToday: number;
  failedEmails: number;
  pendingEmails: number;
  emailsSentThisWeek: number;
  emailsSentLastWeek: number;
  weeklyTrend: 'up' | 'down' | 'neutral';
  weeklyChangePercent: number;
  recentActivity: EmailActivity[];
  emailQueueStatus: {
    pending: number;
    processing: number;
    failed: number;
    completed: number;
  };
  chartData: Array<{
    date: string;
    sent: number;
    failed: number;
    opened: number;
  }>;
}

interface EmailActivity {
  id: string;
  userId: number;
  userEmail: string;
  emailType: 'welcome' | 'new_post' | 'weekly_digest' | 'newsletter' | 'test';
  status: 'sent' | 'failed' | 'pending' | 'processing';
  sentAt: string;
  errorMessage?: string;
  postTitle?: string;
}

export default function EmailManagement() {
  const { toast } = useToast();
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [retryingEmail, setRetryingEmail] = useState<string | null>(null);

  // Fetch email statistics
  const { data: stats, isLoading, error, refetch } = useQuery<EmailStats>({
    queryKey: ['/api/admin/email-stats'],
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Test email configuration mutation
  const testEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/email/test');
      if (!response.ok) throw new Error('Failed to send test email');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Test Email Sent',
        description: 'Check your inbox for the test email.',
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: 'Test Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Send test newsletter mutation
  const testNewsletterMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/email/test-newsletter');
      if (!response.ok) throw new Error('Failed to send test newsletter');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Test Newsletter Sent',
        description: 'Check your inbox for the test newsletter.',
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: 'Newsletter Test Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Retry failed email mutation
  const retryEmailMutation = useMutation({
    mutationFn: async (emailId: string) => {
      const response = await apiRequest('POST', `/api/admin/email/retry/${emailId}`);
      if (!response.ok) throw new Error('Failed to retry email');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Email Retried',
        description: 'The email has been queued for retry.',
      });
      refetch();
      setRetryingEmail(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Retry Failed',
        description: error.message,
        variant: 'destructive',
      });
      setRetryingEmail(null);
    }
  });

  // Retry all failed emails mutation
  const retryAllFailedMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/email/retry-all');
      if (!response.ok) throw new Error('Failed to retry all emails');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Emails Queued for Retry',
        description: `${data.count} failed emails have been queued for retry.`,
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: 'Bulk Retry Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'processing':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getEmailTypeIcon = (type: string) => {
    switch (type) {
      case 'welcome':
        return <Users className="h-4 w-4" />;
      case 'new_post':
        return <FileDown className="h-4 w-4" />;
      case 'newsletter':
      case 'weekly_digest':
        return <Mail className="h-4 w-4" />;
      case 'test':
        return <TestTube className="h-4 w-4" />;
      default:
        return <Inbox className="h-4 w-4" />;
    }
  };

  return (
    <AdminLayout title="Email Management" description="Manage email notifications and newsletters">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Button 
          onClick={() => setShowTestDialog(true)}
          disabled={testEmailMutation.isPending}
          data-testid="button-test-email"
        >
          {testEmailMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <TestTube className="mr-2 h-4 w-4" />
          )}
          Test Email Configuration
        </Button>
        <Button 
          variant="outline"
          onClick={() => testNewsletterMutation.mutate()}
          disabled={testNewsletterMutation.isPending}
          data-testid="button-test-newsletter"
        >
          {testNewsletterMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Send Test Newsletter
        </Button>
        <Button 
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading}
          data-testid="button-refresh-stats"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </Button>
        {stats?.failedEmails > 0 && (
          <Button 
            variant="destructive"
            onClick={() => retryAllFailedMutation.mutate()}
            disabled={retryAllFailedMutation.isPending}
            data-testid="button-retry-failed"
          >
            {retryAllFailedMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Retry All Failed ({stats.failedEmails})
          </Button>
        )}
      </div>

      {/* Statistics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card data-testid="card-total-subscribers">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalSubscribers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats?.subscribersToday || 0} today
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-welcome-emails">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Welcome Emails Today</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.welcomeEmailsSentToday || 0}</div>
                <p className="text-xs text-muted-foreground">Sent to new users</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-post-notifications">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Post Notifications</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.newPostNotificationsSentToday || 0}</div>
                <p className="text-xs text-muted-foreground">Sent today</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-failed-emails">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Emails</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-destructive">{stats?.failedEmails || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.pendingEmails || 0} pending
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Email Queue Status */}
      <Card className="mb-6" data-testid="card-email-queue">
        <CardHeader>
          <CardTitle>Email Queue Status</CardTitle>
          <CardDescription>Current status of the email processing queue</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 flex-1" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-yellow-600">{stats?.emailQueueStatus?.pending || 0}</div>
                <p className="text-xs text-yellow-700">Pending</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <RefreshCw className="h-6 w-6 text-blue-600 mx-auto mb-2 animate-spin" />
                <div className="text-2xl font-bold text-blue-600">{stats?.emailQueueStatus?.processing || 0}</div>
                <p className="text-xs text-blue-700">Processing</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{stats?.emailQueueStatus?.completed || 0}</div>
                <p className="text-xs text-green-700">Completed</p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">{stats?.emailQueueStatus?.failed || 0}</div>
                <p className="text-xs text-red-700">Failed</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Sending Trend Chart */}
      <Card className="mb-6" data-testid="card-email-trend">
        <CardHeader>
          <CardTitle>Email Activity Trend</CardTitle>
          <CardDescription>Email sending activity over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : stats?.chartData?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="sent" 
                  stackId="1" 
                  stroke="#10b981" 
                  fill="#10b98150"
                  name="Sent"
                />
                <Area 
                  type="monotone" 
                  dataKey="failed" 
                  stackId="1" 
                  stroke="#ef4444" 
                  fill="#ef444450"
                  name="Failed"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No data available for the chart
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Email Activity */}
      <Card data-testid="card-recent-activity">
        <CardHeader>
          <CardTitle>Recent Email Activity</CardTitle>
          <CardDescription>Last 20 email notifications sent or attempted</CardDescription>
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
              <AlertDescription>Failed to load email activity</AlertDescription>
            </Alert>
          ) : stats?.recentActivity?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent email activity</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.recentActivity?.map((activity) => (
                    <TableRow key={activity.id} data-testid={`row-email-${activity.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getEmailTypeIcon(activity.emailType)}
                          <span className="capitalize">{activity.emailType.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{activity.userEmail}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary"
                          className={`gap-1 ${getStatusColor(activity.status)}`}
                        >
                          {getStatusIcon(activity.status)}
                          {activity.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(activity.sentAt), 'MMM dd, HH:mm')}
                      </TableCell>
                      <TableCell>
                        {activity.postTitle && (
                          <span className="text-sm text-muted-foreground">
                            Post: {activity.postTitle}
                          </span>
                        )}
                        {activity.errorMessage && (
                          <span className="text-sm text-destructive">
                            Error: {activity.errorMessage}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {activity.status === 'failed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRetryingEmail(activity.id);
                              retryEmailMutation.mutate(activity.id);
                            }}
                            disabled={retryingEmail === activity.id}
                            data-testid={`button-retry-${activity.id}`}
                          >
                            {retryingEmail === activity.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Email Confirmation Dialog */}
      <AlertDialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Test Email?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send a test email to your admin email address to verify that 
              email configuration is working correctly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-test">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                testEmailMutation.mutate();
                setShowTestDialog(false);
              }}
              data-testid="button-confirm-test"
            >
              Send Test Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}