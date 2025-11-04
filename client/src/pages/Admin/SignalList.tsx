import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Eye,
  Download,
  DollarSign,
  Star,
  Package,
  Filter,
  TrendingUp,
  Bot
} from 'lucide-react';
import { format } from 'date-fns';

interface Signal {
  id: string;
  name: string;
  description: string;
  version: string;
  platform: 'MT4' | 'MT5' | 'Both';
  strategyType: string;
  status: 'active' | 'inactive' | 'beta';
  fileUrl?: string;
  previewImage?: string;
  features: string[];
  requirements: string[];
  installInstructions?: string;
  price: number;
  isPaid: boolean;
  rating: number;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
  author?: string;
}

export default function SignalList() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [strategyFilter, setStrategyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Fetch signals with filters
  const { data: signalsData, isLoading, error } = useQuery({
    queryKey: ['/api/admin/signals', { 
      search: searchTerm, 
      platform: platformFilter,
      strategy: strategyFilter,
      status: statusFilter,
      page: currentPage, 
      limit: itemsPerPage 
    }],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(platformFilter !== 'all' && { platform: platformFilter }),
        ...(strategyFilter !== 'all' && { strategy: strategyFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });
      
      // Mock data for now - replace with actual API call
      return {
        signals: [
          {
            id: '1',
            name: 'Grid Trading EA Pro',
            description: 'Advanced grid trading expert advisor with AI-powered risk management',
            version: '2.5.0',
            platform: 'Both' as const,
            strategyType: 'Grid Trading',
            status: 'active' as const,
            fileUrl: '/downloads/grid-ea-pro.zip',
            previewImage: '/images/grid-ea-preview.jpg',
            features: ['Auto lot sizing', 'News filter', 'Multi-pair support'],
            requirements: ['MT4/MT5 build 1350+', 'VPS recommended', 'Min balance $1000'],
            installInstructions: 'Copy to Experts folder and enable auto trading',
            price: 0,
            isPaid: false,
            rating: 4.8,
            downloadCount: 3456,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-02-01T14:30:00Z',
            author: 'Admin'
          },
          {
            id: '2',
            name: 'Scalping Bot Ultra',
            description: 'High-frequency scalping EA optimized for low spreads',
            version: '1.2.0',
            platform: 'MT5' as const,
            strategyType: 'Scalping',
            status: 'active' as const,
            price: 99.99,
            isPaid: true,
            rating: 4.5,
            downloadCount: 2134,
            createdAt: '2024-01-20T12:00:00Z',
            updatedAt: '2024-02-05T09:15:00Z',
            author: 'Admin',
            features: ['1-5 pip targets', 'Spread filter', 'Session control'],
            requirements: ['Low spread broker', 'Fast execution', 'Min balance $500']
          },
          {
            id: '3',
            name: 'Trend Following System',
            description: 'Momentum-based trend following strategy',
            version: '3.0.1',
            platform: 'MT4' as const,
            strategyType: 'Trend Following',
            status: 'beta' as const,
            price: 0,
            isPaid: false,
            rating: 4.2,
            downloadCount: 987,
            createdAt: '2024-02-01T08:00:00Z',
            updatedAt: '2024-02-10T16:45:00Z',
            author: 'Admin',
            features: ['Multiple timeframe analysis', 'Dynamic stop loss', 'Trail profit'],
            requirements: ['MT4 build 1090+', 'Trending market conditions']
          }
        ],
        total: 3,
        stats: {
          total: 3,
          active: 2,
          inactive: 0,
          beta: 1,
          totalDownloads: 6577,
          averageRating: 4.5
        }
      };
    }
  });

  // Delete signal mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/admin/signals/${id}`);
      if (!response.ok) throw new Error('Failed to delete signal');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/signals'] });
      toast({
        title: 'Signal deleted',
        description: 'The signal has been successfully deleted.'
      });
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/signals/${id}/status`, { status });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/signals'] });
      toast({
        title: 'Status updated',
        description: 'Signal status has been updated.'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default' as const;
      case 'inactive':
        return 'secondary' as const;
      case 'beta':
        return 'outline' as const;
      default:
        return 'outline' as const;
    }
  };

  const getPlatformBadge = (platform: string) => {
    const colors = {
      MT4: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      MT5: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      Both: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    };
    return colors[platform as keyof typeof colors] || '';
  };

  const signals = signalsData?.signals || [];
  const totalPages = Math.ceil((signalsData?.total || 0) / itemsPerPage);

  return (
    <AdminLayout title="Signal/EA Management" description="Manage Expert Advisors and trading signals">
      {/* Header Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search signals..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-signals"
            />
          </div>
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-full sm:w-32" data-testid="select-platform-filter">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="MT4">MT4</SelectItem>
              <SelectItem value="MT5">MT5</SelectItem>
              <SelectItem value="Both">Both</SelectItem>
            </SelectContent>
          </Select>
          <Select value={strategyFilter} onValueChange={setStrategyFilter}>
            <SelectTrigger className="w-full sm:w-40" data-testid="select-strategy-filter">
              <SelectValue placeholder="Strategy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Strategies</SelectItem>
              <SelectItem value="grid">Grid Trading</SelectItem>
              <SelectItem value="scalping">Scalping</SelectItem>
              <SelectItem value="trend">Trend Following</SelectItem>
              <SelectItem value="martingale">Martingale</SelectItem>
              <SelectItem value="hedging">Hedging</SelectItem>
              <SelectItem value="arbitrage">Arbitrage</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-32" data-testid="select-status-filter">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="beta">Beta</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Link href="/admin/signals/new">
          <Button data-testid="button-new-signal">
            <Plus className="h-4 w-4 mr-2" />
            New Signal/EA
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6 mb-6">
        <Card data-testid="stat-total-signals">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Signals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{signalsData?.stats?.total || 0}</span>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-active-signals">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold text-green-600">
                {signalsData?.stats?.active || 0}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-beta-signals">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Beta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">
                {signalsData?.stats?.beta || 0}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-total-downloads">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {signalsData?.stats?.totalDownloads || 0}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-average-rating">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold">
                {signalsData?.stats?.averageRating?.toFixed(1) || '0.0'}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-inactive-signals">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-gray-400" />
              <span className="text-2xl font-bold text-gray-600">
                {signalsData?.stats?.inactive || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Signals List Table */}
      <Card>
        <CardHeader>
          <CardTitle>Signals & Expert Advisors</CardTitle>
          <CardDescription>
            Manage trading signals and automated strategies
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-muted-foreground">Failed to load signals</p>
            </div>
          ) : signals.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No signals found</p>
              <Link href="/admin/signals/new">
                <Button className="mt-4" data-testid="button-create-first-signal">
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first signal
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Strategy</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Downloads</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {signals.map((signal: Signal) => (
                      <TableRow key={signal.id} data-testid={`row-signal-${signal.id}`}>
                        <TableCell>
                          <div className="font-medium">{signal.name}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-xs">
                            {signal.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPlatformBadge(signal.platform)}>
                            {signal.platform}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {signal.strategyType}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">v{signal.version}</Badge>
                        </TableCell>
                        <TableCell>
                          {signal.isPaid ? (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              <span className="font-medium">{signal.price}</span>
                            </div>
                          ) : (
                            <Badge variant="secondary">Free</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm">{signal.rating}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Download className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{signal.downloadCount}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(signal.status)}>
                            {signal.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(signal.updatedAt), 'MMM dd')}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                data-testid={`button-actions-${signal.id}`}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <Link href={`/download/${signal.id}`}>
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                              </Link>
                              <Link href={`/admin/signals/edit/${signal.id}`}>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              </Link>
                              <DropdownMenuSeparator />
                              {signal.status !== 'active' && (
                                <DropdownMenuItem 
                                  onClick={() => toggleStatusMutation.mutate({ 
                                    id: signal.id, 
                                    status: 'active' 
                                  })}
                                >
                                  <Bot className="h-4 w-4 mr-2" />
                                  Activate
                                </DropdownMenuItem>
                              )}
                              {signal.status !== 'inactive' && (
                                <DropdownMenuItem 
                                  onClick={() => toggleStatusMutation.mutate({ 
                                    id: signal.id, 
                                    status: 'inactive' 
                                  })}
                                >
                                  <Bot className="h-4 w-4 mr-2" />
                                  Deactivate
                                </DropdownMenuItem>
                              )}
                              {signal.status !== 'beta' && (
                                <DropdownMenuItem 
                                  onClick={() => toggleStatusMutation.mutate({ 
                                    id: signal.id, 
                                    status: 'beta' 
                                  })}
                                >
                                  <TrendingUp className="h-4 w-4 mr-2" />
                                  Set as Beta
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => setDeleteId(signal.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                    {Math.min(currentPage * itemsPerPage, signalsData?.total || 0)} of{' '}
                    {signalsData?.total || 0} signals
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
                    {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          data-testid={`button-page-${page}`}
                        >
                          {page}
                        </Button>
                      );
                    })}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the signal/EA
              and all associated data including download history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}