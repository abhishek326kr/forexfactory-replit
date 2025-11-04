import { useState } from 'react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  MoreVertical,
  Edit,
  Trash2,
  ShieldCheck,
  ShieldOff,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  Activity,
  Crown,
  Shield,
  User,
  Filter,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface UserData {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'editor' | 'admin';
  status: 'active' | 'banned' | 'suspended';
  isSubscribed: boolean;
  avatar?: string;
  bio?: string;
  createdAt: string;
  lastLoginAt?: string;
  postCount: number;
  downloadCount: number;
  lastActivity?: string;
}

export default function UserList() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteUser, setDeleteUser] = useState<UserData | null>(null);
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [editRole, setEditRole] = useState<string>('user');
  const [editSubscription, setEditSubscription] = useState(false);
  const itemsPerPage = 10;

  // Fetch users with filters
  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['/api/admin/users', { 
      search: searchTerm, 
      role: roleFilter,
      status: statusFilter,
      page: currentPage, 
      limit: itemsPerPage 
    }],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });
      
      // Mock data for now - replace with actual API call
      return {
        users: [
          {
            id: '1',
            email: 'admin@forex.com',
            username: 'admin',
            role: 'admin' as const,
            status: 'active' as const,
            isSubscribed: true,
            avatar: '/avatars/admin.jpg',
            bio: 'Platform administrator',
            createdAt: '2024-01-01T00:00:00Z',
            lastLoginAt: '2025-01-03T14:30:00Z',
            postCount: 45,
            downloadCount: 0,
            lastActivity: '2025-01-03T14:35:00Z'
          },
          {
            id: '2',
            email: 'editor@forex.com',
            username: 'editor_john',
            role: 'editor' as const,
            status: 'active' as const,
            isSubscribed: true,
            avatar: '/avatars/john.jpg',
            bio: 'Content editor and trader',
            createdAt: '2024-01-15T00:00:00Z',
            lastLoginAt: '2025-01-03T10:00:00Z',
            postCount: 32,
            downloadCount: 12,
            lastActivity: '2025-01-03T11:20:00Z'
          },
          {
            id: '3',
            email: 'user1@example.com',
            username: 'trader_mike',
            role: 'user' as const,
            status: 'active' as const,
            isSubscribed: true,
            createdAt: '2024-02-01T00:00:00Z',
            lastLoginAt: '2025-01-02T18:00:00Z',
            postCount: 0,
            downloadCount: 45,
            lastActivity: '2025-01-02T18:30:00Z'
          },
          {
            id: '4',
            email: 'user2@example.com',
            username: 'fx_master',
            role: 'user' as const,
            status: 'active' as const,
            isSubscribed: false,
            createdAt: '2024-02-15T00:00:00Z',
            lastLoginAt: '2025-01-01T12:00:00Z',
            postCount: 0,
            downloadCount: 23,
            lastActivity: '2025-01-01T12:45:00Z'
          },
          {
            id: '5',
            email: 'banned@example.com',
            username: 'spam_user',
            role: 'user' as const,
            status: 'banned' as const,
            isSubscribed: false,
            createdAt: '2024-03-01T00:00:00Z',
            lastLoginAt: '2024-12-15T08:00:00Z',
            postCount: 0,
            downloadCount: 2,
            lastActivity: '2024-12-15T08:00:00Z'
          }
        ],
        total: 5,
        stats: {
          total: 5,
          active: 4,
          banned: 1,
          suspended: 0,
          admins: 1,
          editors: 1,
          subscribers: 3
        }
      };
    }
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/admin/users/${id}`);
      if (!response.ok) throw new Error('Failed to delete user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'User deleted',
        description: 'The user account has been permanently deleted.'
      });
      setDeleteUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: string; role: string; isSubscribed: boolean }) => {
      const response = await apiRequest('PATCH', `/api/admin/users/${data.id}`, {
        role: data.role,
        isSubscribed: data.isSubscribed
      });
      if (!response.ok) throw new Error('Failed to update user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'User updated',
        description: 'User details have been updated successfully.'
      });
      setEditUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Ban/Unban user mutation
  const toggleBanMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'ban' | 'unban' | 'suspend' }) => {
      const response = await apiRequest('PATCH', `/api/admin/users/${id}/${action}`, {});
      if (!response.ok) throw new Error(`Failed to ${action} user`);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: `User ${variables.action === 'ban' ? 'banned' : variables.action === 'unban' ? 'unbanned' : 'suspended'}`,
        description: `The user has been ${variables.action}ned successfully.`
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Action failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleEditUser = (user: UserData) => {
    setEditUser(user);
    setEditRole(user.role);
    setEditSubscription(user.isSubscribed);
  };

  const handleSaveUser = () => {
    if (editUser) {
      updateUserMutation.mutate({
        id: editUser.id,
        role: editRole,
        isSubscribed: editSubscription
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4" />;
      case 'editor':
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default' as const;
      case 'editor':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default' as const;
      case 'banned':
        return 'destructive' as const;
      case 'suspended':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  const users = usersData?.users || [];
  const totalPages = Math.ceil((usersData?.total || 0) / itemsPerPage);

  return (
    <AdminLayout title="User Management" description="Manage user accounts and permissions">
      {/* Header Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-users"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-32" data-testid="select-role-filter">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="editor">Editors</SelectItem>
              <SelectItem value="user">Users</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-32" data-testid="select-status-filter">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6 mb-6">
        <Card data-testid="stat-total-users">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersData?.stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-active-users">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {usersData?.stats?.active || 0}
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-subscribers">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {usersData?.stats?.subscribers || 0}
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-admins">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersData?.stats?.admins || 0}</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-editors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Editors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersData?.stats?.editors || 0}</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-banned-users">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Banned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {usersData?.stats?.banned || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage user accounts, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <UserX className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-muted-foreground">Failed to load users</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user: UserData) => (
                      <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar} alt={user.username} />
                              <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.username}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)} className="gap-1">
                            {getRoleIcon(user.role)}
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(user.status)}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.isSubscribed ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Subscribed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Free
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3 text-muted-foreground" />
                              {user.postCount} posts
                            </div>
                            <div className="flex items-center gap-1">
                              <Download className="h-3 w-3 text-muted-foreground" />
                              {user.downloadCount} downloads
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-sm">
                          {user.lastLoginAt ? format(new Date(user.lastLoginAt), 'MMM dd, HH:mm') : 'Never'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                data-testid={`button-actions-${user.id}`}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Activity className="h-4 w-4 mr-2" />
                                View Activity
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.status === 'active' && (
                                <>
                                  <DropdownMenuItem 
                                    onClick={() => toggleBanMutation.mutate({ id: user.id, action: 'suspend' })}
                                  >
                                    <ShieldOff className="h-4 w-4 mr-2" />
                                    Suspend User
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => toggleBanMutation.mutate({ id: user.id, action: 'ban' })}
                                  >
                                    <UserX className="h-4 w-4 mr-2" />
                                    Ban User
                                  </DropdownMenuItem>
                                </>
                              )}
                              {user.status === 'banned' && (
                                <DropdownMenuItem 
                                  onClick={() => toggleBanMutation.mutate({ id: user.id, action: 'unban' })}
                                >
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Unban User
                                </DropdownMenuItem>
                              )}
                              {user.status === 'suspended' && (
                                <DropdownMenuItem 
                                  onClick={() => toggleBanMutation.mutate({ id: user.id, action: 'unban' })}
                                >
                                  <ShieldCheck className="h-4 w-4 mr-2" />
                                  Unsuspend User
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => setDeleteUser(user)}
                                disabled={user.role === 'admin'}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete User
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
                    {Math.min(currentPage * itemsPerPage, usersData?.total || 0)} of{' '}
                    {usersData?.total || 0} users
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

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user role and subscription status
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={editUser?.avatar} alt={editUser?.username} />
                <AvatarFallback>{editUser?.username ? getInitials(editUser.username) : ''}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{editUser?.username}</p>
                <p className="text-sm text-muted-foreground">{editUser?.email}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger data-testid="select-user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Subscription Status</Label>
                <p className="text-sm text-muted-foreground">
                  Grant or revoke subscription access
                </p>
              </div>
              <Switch
                checked={editSubscription}
                onCheckedChange={setEditSubscription}
                data-testid="switch-subscription"
              />
            </div>

            {editUser && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="text-sm font-medium">
                    {format(new Date(editUser.createdAt), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Login</p>
                  <p className="text-sm font-medium">
                    {editUser.lastLoginAt 
                      ? format(new Date(editUser.lastLoginAt), 'MMM dd, yyyy HH:mm') 
                      : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Posts</p>
                  <p className="text-sm font-medium">{editUser.postCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Downloads</p>
                  <p className="text-sm font-medium">{editUser.downloadCount}</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser} data-testid="button-save-user">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user account for "{deleteUser?.username}" ({deleteUser?.email}).
              All associated data including posts and activity will be removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUser && deleteMutation.mutate(deleteUser.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}