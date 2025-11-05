import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
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
  Settings as SettingsIcon,
  Users,
  Shield,
  Mail,
  Globe,
  Database,
  FileText,
  Key,
  Bell,
  Search,
  Edit,
  Trash2,
  UserPlus,
  Save,
  AlertCircle,
  Crown,
  UserCheck,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'editor';
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
  avatar?: string;
}

interface SiteSettings {
  siteName: string;
  siteUrl: string;
  siteDescription: string;
  adminEmail: string;
  supportEmail: string;
  timezone: string;
  dateFormat: string;
  postsPerPage: number;
  enableComments: boolean;
  enableRegistration: boolean;
  enableNewsletter: boolean;
  maintenanceMode: boolean;
}

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TeamMember | null>(null);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // New team member form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'editor' as 'admin' | 'editor',
    password: ''
  });

  // Mock data for team members
  const teamMembers: TeamMember[] = [
    {
      id: 1,
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
      status: 'active',
      createdAt: '2024-01-01',
      lastLogin: '2024-12-28',
      avatar: ''
    },
    {
      id: 2,
      name: 'SEO Editor',
      email: 'editor@example.com',
      role: 'editor',
      status: 'active',
      createdAt: '2024-01-15',
      lastLogin: '2024-12-27'
    }
  ];

  // Site settings state
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteName: 'ForexFactory.cc',
    siteUrl: 'https://forexfactory.cc',
    siteDescription: 'Best Forex EA Hub - Expert Advisors & Trading Tools',
    adminEmail: 'admin@forexfactory.cc',
    supportEmail: 'support@forexfactory.cc',
    timezone: 'UTC',
    dateFormat: 'MM/dd/yyyy',
    postsPerPage: 12,
    enableComments: true,
    enableRegistration: false,
    enableNewsletter: true,
    maintenanceMode: false
  });

  // Filter team members based on search
  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Here you would make an API call to create the user
    toast({
      title: "User Added",
      description: `${newUser.name} has been added as ${newUser.role}`,
    });

    setNewUser({ name: '', email: '', role: 'editor', password: '' });
    setAddUserOpen(false);
  };

  const handleDeleteUser = (user: TeamMember) => {
    setSelectedUser(user);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      // Here you would make an API call to delete the user
      toast({
        title: "User Removed",
        description: `${selectedUser.name} has been removed from the team`,
      });
    }
    setDeleteConfirmOpen(false);
    setSelectedUser(null);
  };

  const handleSaveSettings = () => {
    // Here you would make an API call to save settings
    toast({
      title: "Settings Saved",
      description: "Your settings have been updated successfully",
    });
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: 'Admin', variant: 'default' as const, icon: Crown },
      editor: { label: 'Editor', variant: 'secondary' as const, icon: UserCheck }
    };
    const config = roleConfig[role as keyof typeof roleConfig];
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <AdminLayout 
      title="Settings" 
      description="Manage your website settings and team members"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Site Information</CardTitle>
              <CardDescription>Basic settings for your website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={siteSettings.siteName}
                    onChange={(e) => setSiteSettings({...siteSettings, siteName: e.target.value})}
                    data-testid="input-site-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteUrl">Site URL</Label>
                  <Input
                    id="siteUrl"
                    value={siteSettings.siteUrl}
                    onChange={(e) => setSiteSettings({...siteSettings, siteUrl: e.target.value})}
                    data-testid="input-site-url"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={siteSettings.siteDescription}
                  onChange={(e) => setSiteSettings({...siteSettings, siteDescription: e.target.value})}
                  rows={3}
                  data-testid="input-site-description"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Comments</Label>
                    <p className="text-sm text-muted-foreground">Allow users to comment on posts</p>
                  </div>
                  <Switch
                    checked={siteSettings.enableComments}
                    onCheckedChange={(checked) => setSiteSettings({...siteSettings, enableComments: checked})}
                    data-testid="switch-enable-comments"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Registration</Label>
                    <p className="text-sm text-muted-foreground">Allow new users to register</p>
                  </div>
                  <Switch
                    checked={siteSettings.enableRegistration}
                    onCheckedChange={(checked) => setSiteSettings({...siteSettings, enableRegistration: checked})}
                    data-testid="switch-enable-registration"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Newsletter Signup</Label>
                    <p className="text-sm text-muted-foreground">Show newsletter subscription form</p>
                  </div>
                  <Switch
                    checked={siteSettings.enableNewsletter}
                    onCheckedChange={(checked) => setSiteSettings({...siteSettings, enableNewsletter: checked})}
                    data-testid="switch-enable-newsletter"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveSettings} data-testid="button-save-general">
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Management Tab */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Management</CardTitle>
                  <CardDescription>Manage admins and editors for your website</CardDescription>
                </div>
                <Button onClick={() => setAddUserOpen(true)} data-testid="button-add-user">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Team Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search team members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-team"
                  />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            {member.name}
                          </div>
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>{getRoleBadge(member.role)}</TableCell>
                        <TableCell>
                          <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {member.lastLogin ? format(new Date(member.lastLogin), 'MMM dd, yyyy') : 'Never'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              data-testid={`button-edit-${member.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteUser(member)}
                              data-testid={`button-delete-${member.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-6 p-4 rounded-lg bg-muted">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Role Permissions</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• <strong>Admins:</strong> Full access to all features, can manage users and settings</li>
                      <li>• <strong>Editors:</strong> Can create, edit, and publish content, manage SEO</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Settings Tab */}
        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO Configuration</CardTitle>
              <CardDescription>Optimize your website for search engines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default Meta Description</Label>
                <Textarea
                  placeholder="Default description for pages without custom descriptions"
                  rows={3}
                  data-testid="input-default-meta-description"
                />
              </div>

              <div className="space-y-2">
                <Label>Google Analytics ID</Label>
                <Input placeholder="UA-XXXXXXXXX-X" data-testid="input-google-analytics" />
              </div>

              <div className="space-y-2">
                <Label>Google Search Console Verification</Label>
                <Input placeholder="Verification code" data-testid="input-google-search-console" />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Generate Sitemap</Label>
                    <p className="text-sm text-muted-foreground">Automatically create XML sitemap</p>
                  </div>
                  <Switch defaultChecked data-testid="switch-generate-sitemap" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Schema Markup</Label>
                    <p className="text-sm text-muted-foreground">Add structured data to pages</p>
                  </div>
                  <Switch defaultChecked data-testid="switch-enable-schema" />
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveSettings} data-testid="button-save-seo">
                  <Save className="mr-2 h-4 w-4" />
                  Save SEO Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings Tab */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>Configure email notifications and SMTP settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Admin Email</Label>
                  <Input 
                    type="email" 
                    value={siteSettings.adminEmail}
                    onChange={(e) => setSiteSettings({...siteSettings, adminEmail: e.target.value})}
                    data-testid="input-admin-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Support Email</Label>
                  <Input 
                    type="email" 
                    value={siteSettings.supportEmail}
                    onChange={(e) => setSiteSettings({...siteSettings, supportEmail: e.target.value})}
                    data-testid="input-support-email"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Email Notifications</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>New User Registration</Label>
                      <p className="text-sm text-muted-foreground">Receive email when new user registers</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-email-new-user" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>New Comment</Label>
                      <p className="text-sm text-muted-foreground">Receive email for new comments</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-email-new-comment" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Newsletter Subscription</Label>
                      <p className="text-sm text-muted-foreground">Receive email for new subscribers</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-email-newsletter" />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveSettings} data-testid="button-save-email">
                  <Save className="mr-2 h-4 w-4" />
                  Save Email Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Technical configuration and maintenance options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Posts Per Page</Label>
                  <Input 
                    type="number" 
                    value={siteSettings.postsPerPage}
                    onChange={(e) => setSiteSettings({...siteSettings, postsPerPage: parseInt(e.target.value)})}
                    data-testid="input-posts-per-page"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select value={siteSettings.timezone} onValueChange={(value) => setSiteSettings({...siteSettings, timezone: value})}>
                    <SelectTrigger data-testid="select-timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/50 bg-destructive/10">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">Show maintenance page to visitors</p>
                  </div>
                  <Switch 
                    checked={siteSettings.maintenanceMode}
                    onCheckedChange={(checked) => setSiteSettings({...siteSettings, maintenanceMode: checked})}
                    data-testid="switch-maintenance-mode"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="font-medium">Cache Management</h3>
                <div className="flex gap-2">
                  <Button variant="outline" data-testid="button-clear-page-cache">
                    Clear Page Cache
                  </Button>
                  <Button variant="outline" data-testid="button-clear-image-cache">
                    Clear Image Cache
                  </Button>
                  <Button variant="outline" data-testid="button-rebuild-search-index">
                    Rebuild Search Index
                  </Button>
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveSettings} data-testid="button-save-advanced">
                  <Save className="mr-2 h-4 w-4" />
                  Save Advanced Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add User Dialog */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a new admin or editor to manage your website
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Full Name</Label>
              <Input
                id="new-name"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                placeholder="John Doe"
                data-testid="input-new-user-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-email">Email Address</Label>
              <Input
                id="new-email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                placeholder="john@example.com"
                data-testid="input-new-user-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                placeholder="Enter a secure password"
                data-testid="input-new-user-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-role">Role</Label>
              <Select value={newUser.role} onValueChange={(value: 'admin' | 'editor') => setNewUser({...newUser, role: value})}>
                <SelectTrigger id="new-role" data-testid="select-new-user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin - Full Access</SelectItem>
                  <SelectItem value="editor">Editor - Content Management</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddUserOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser} data-testid="button-confirm-add-user">
              <Plus className="mr-2 h-4 w-4" />
              Add Team Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedUser?.name} from the team? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Remove User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}