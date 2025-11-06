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

  // Fetch signals with filters - using actual API endpoint
  const { data: signalsData, isLoading, error } = useQuery<{
    signals: Signal[];
    total: number;
    stats?: {
      total: number;
      active: number;
      inactive: number;
      beta: number;
      totalDownloads: number;
      averageRating: number;
    };
  }>({
    queryKey: ['/api/admin/signals'],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (platformFilter && platformFilter !== 'all') params.append('platform', platformFilter);
      if (strategyFilter && strategyFilter !== 'all') params.append('strategy', strategyFilter);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      
      const response = await fetch(`/api/admin/signals?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch signals');
      }
      
      return response.json();
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

      {/* Signals List - Card View */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Signals & Expert Advisors</h2>
            <p className="text-muted-foreground">
              Manage trading signals and automated strategies
            </p>
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-48 w-full" />
                <CardContent className="pt-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full mt-1" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="text-center py-8">
              <Bot className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-muted-foreground">Failed to load signals</p>
            </CardContent>
          </Card>
        ) : signals.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No signals found</h3>
              <p className="text-muted-foreground mb-4">Get started by uploading your first signal</p>
              <Link href="/admin/signals/new">
                <Button data-testid="button-create-first-signal">
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Signal
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {signals.map((signal: Signal) => (
              <Card key={signal.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`card-signal-${signal.id}`}>
                {/* Screenshot */}
                <div className="aspect-video bg-muted relative">
                  {signal.previewImage ? (
                    <img 
                      src={signal.previewImage} 
                      alt={signal.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="flex items-center justify-center h-full"><svg class="h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                        }
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Bot className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <CardContent className="pt-4">
                  {/* Title */}
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                    {signal.name}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {signal.description}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center pt-3 border-t">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          data-testid={`button-actions-${signal.id}`}
                        >
                          Actions
                          <MoreVertical className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <Link href={`/download/${signal.id}`}>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                        </Link>
                        <Link href={`/admin/signals/edit/${signal.id}`}>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Signal
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
      </div>

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