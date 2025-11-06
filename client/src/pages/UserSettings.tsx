import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';
import { User, Settings, Lock, Mail, Download, AlertTriangle, Calendar, FileCode, Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';
import { format } from 'date-fns';

// Form schemas
const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address')
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function UserSettings() {
  const { user, checkAuth } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('account');
  const [emailPreferences, setEmailPreferences] = useState({
    subscribeToNewPosts: false,
    subscribeToWeeklyDigest: false
  });
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  // Fetch user profile data
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['/api/user/profile'],
    queryFn: async () => {
      const response = await fetch('/api/user/profile', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      // Set email preferences from fetched data
      setEmailPreferences({
        subscribeToNewPosts: data.subscribeToNewPosts || false,
        subscribeToWeeklyDigest: data.subscribeToWeeklyDigest || false
      });
      return data;
    },
    enabled: !!user
  });

  // Fetch download history
  const { data: downloads, isLoading: downloadsLoading } = useQuery({
    queryKey: ['/api/user/downloads'],
    queryFn: async () => {
      const response = await fetch('/api/user/downloads', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch downloads');
      return response.json();
    },
    enabled: !!user && activeTab === 'downloads'
  });

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profileData?.name || '',
      email: profileData?.email || ''
    },
    values: {
      name: profileData?.name || '',
      email: profileData?.email || ''
    }
  });

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await apiRequest('PUT', '/api/user/profile', data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
      checkAuth(); // Refresh auth data
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update profile',
        variant: 'destructive'
      });
    }
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      const response = await apiRequest('PUT', '/api/user/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update password');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Password Updated',
        description: 'Your password has been changed successfully'
      });
      passwordForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update password',
        variant: 'destructive'
      });
    }
  });

  // Update email preferences mutation
  const updateEmailPreferencesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/email/preferences', emailPreferences);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update preferences');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Preferences Updated',
        description: 'Your email preferences have been saved'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update email preferences',
        variant: 'destructive'
      });
    }
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await apiRequest('DELETE', '/api/user/account', { password });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete account');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Account Deleted',
        description: 'Your account has been permanently deleted'
      });
      // Redirect to home after deletion
      window.location.href = '/';
    },
    onError: (error: any) => {
      toast({
        title: 'Deletion Failed',
        description: error.message || 'Failed to delete account',
        variant: 'destructive'
      });
    }
  });

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto py-8">
          <Card>
            <CardHeader>
              <CardTitle>Please Login</CardTitle>
              <CardDescription>You need to be logged in to access settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/login">
                <Button>Go to Login</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="w-8 h-8" />
            User Settings
          </h1>
          <p className="text-muted-foreground mt-2">Manage your account and preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 lg:grid-cols-5 w-full">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Password</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Email</span>
            </TabsTrigger>
            <TabsTrigger value="downloads" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Downloads</span>
            </TabsTrigger>
            <TabsTrigger value="danger" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Danger Zone</span>
            </TabsTrigger>
          </TabsList>

          {/* Account Information Tab */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileLoading ? (
                  <>
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </>
                ) : (
                  <form onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        data-testid="input-profile-name"
                        {...profileForm.register('name')}
                        placeholder="Enter your name"
                      />
                      {profileForm.formState.errors.name && (
                        <p className="text-sm text-destructive">{profileForm.formState.errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        data-testid="input-profile-email"
                        {...profileForm.register('email')}
                        placeholder="Enter your email"
                      />
                      {profileForm.formState.errors.email && (
                        <p className="text-sm text-destructive">{profileForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      data-testid="button-update-profile"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Update Profile
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Password Tab */}
          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={passwordForm.handleSubmit((data) => updatePasswordMutation.mutate(data))} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      data-testid="input-current-password"
                      {...passwordForm.register('currentPassword')}
                      placeholder="Enter current password"
                    />
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="text-sm text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      data-testid="input-new-password"
                      {...passwordForm.register('newPassword')}
                      placeholder="Enter new password"
                    />
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      data-testid="input-confirm-password"
                      {...passwordForm.register('confirmPassword')}
                      placeholder="Confirm new password"
                    />
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <Button 
                    type="submit"
                    data-testid="button-change-password"
                    disabled={updatePasswordMutation.isPending}
                  >
                    {updatePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Change Password
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Preferences Tab */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Email Preferences</CardTitle>
                <CardDescription>Control what emails you receive from us</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="newPosts">New Blog Posts</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications when new blog posts are published
                    </p>
                  </div>
                  <Switch
                    id="newPosts"
                    data-testid="switch-new-posts"
                    checked={emailPreferences.subscribeToNewPosts}
                    onCheckedChange={(checked) => 
                      setEmailPreferences(prev => ({ ...prev, subscribeToNewPosts: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="weeklyDigest">Weekly Digest</Label>
                    <p className="text-sm text-muted-foreground">
                      Get a weekly summary of the top posts and downloads
                    </p>
                  </div>
                  <Switch
                    id="weeklyDigest"
                    data-testid="switch-weekly-digest"
                    checked={emailPreferences.subscribeToWeeklyDigest}
                    onCheckedChange={(checked) => 
                      setEmailPreferences(prev => ({ ...prev, subscribeToWeeklyDigest: checked }))
                    }
                  />
                </div>

                <Button 
                  onClick={() => updateEmailPreferencesMutation.mutate()}
                  data-testid="button-save-preferences"
                  disabled={updateEmailPreferencesMutation.isPending}
                >
                  {updateEmailPreferencesMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Download History Tab */}
          <TabsContent value="downloads" id="downloads">
            <Card>
              <CardHeader>
                <CardTitle>Download History</CardTitle>
                <CardDescription>View your recent downloads and accessed files</CardDescription>
              </CardHeader>
              <CardContent>
                {downloadsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : downloads?.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>File</TableHead>
                          <TableHead>Blog Post</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Version</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {downloads.map((download: any) => (
                          <TableRow key={download.id} data-testid={`row-download-${download.id}`}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <FileCode className="w-4 h-4 text-muted-foreground" />
                                <span>{download.fileName || 'Unknown File'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Link 
                                href={`/blog/${download.blog?.slug}`}
                                className="text-primary hover:underline"
                                data-testid={`link-blog-${download.id}`}
                              >
                                {download.blog?.title || 'Unknown Post'}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                <span className="text-sm">
                                  {format(new Date(download.downloadedAt), 'MMM d, yyyy')}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {download.version || '1.0'}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Download className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No downloads yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Your download history will appear here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Danger Zone Tab */}
          <TabsContent value="danger">
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible and destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Delete Account</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Once you delete your account, there is no going back. 
                      All your data will be permanently removed.
                    </p>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" data-testid="button-delete-account">
                          Delete Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your
                            account and remove all your data from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="my-4">
                          <Label htmlFor="deletePassword">Enter your password to confirm</Label>
                          <Input
                            id="deletePassword"
                            type="password"
                            data-testid="input-delete-password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder="Enter your password"
                          />
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel 
                            onClick={() => setDeletePassword('')}
                            data-testid="button-cancel-delete"
                          >
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              if (deletePassword) {
                                deleteAccountMutation.mutate(deletePassword);
                              } else {
                                toast({
                                  title: 'Password Required',
                                  description: 'Please enter your password to confirm deletion',
                                  variant: 'destructive'
                                });
                              }
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            data-testid="button-confirm-delete"
                            disabled={deleteAccountMutation.isPending}
                          >
                            {deleteAccountMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete Account
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}