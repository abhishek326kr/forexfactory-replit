import { useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import PostEditor from '@/components/PostEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Download,
  Eye,
  FileText,
  TrendingUp,
  Users,
  BarChart3,
  Calendar,
  Edit,
  Trash2,
  Plus,
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeView, setActiveView] = useState<'dashboard' | 'editor'>('dashboard');

  //todo: remove mock functionality
  const stats = {
    totalPosts: 156,
    totalDownloads: 89,
    totalUsers: 100420,
    monthlyViews: 2840000,
  };

  const recentPosts = [
    {
      id: '1',
      title: 'How to Optimize Your Expert Advisor',
      status: 'published',
      views: 12450,
      date: '2024-12-15',
    },
    {
      id: '2',
      title: 'Top 5 MT4 Indicators for 2025',
      status: 'draft',
      views: 0,
      date: '2024-12-14',
    },
    {
      id: '3',
      title: 'Grid Trading Systems Guide',
      status: 'published',
      views: 8920,
      date: '2024-12-13',
    },
  ];

  const popularDownloads = [
    { name: 'Gold Scalper Pro EA', downloads: 45230, rating: 4.8 },
    { name: 'Trend Master EA', downloads: 38450, rating: 4.9 },
    { name: 'News Trader Bot', downloads: 28900, rating: 4.7 },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your blog content and monitor performance
            </p>
          </div>

          {activeView === 'dashboard' ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalPosts}</div>
                    <p className="text-xs text-muted-foreground">+12 this month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Downloads</CardTitle>
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalDownloads}</div>
                    <p className="text-xs text-muted-foreground">+5 new EAs</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(stats.totalUsers / 1000).toFixed(1)}k
                    </div>
                    <p className="text-xs text-muted-foreground">+2.5k this week</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Views</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(stats.monthlyViews / 1000000).toFixed(1)}M
                    </div>
                    <p className="text-xs text-muted-foreground">+15% from last month</p>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="posts" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="posts">Recent Posts</TabsTrigger>
                  <TabsTrigger value="downloads">Popular Downloads</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="posts">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Recent Blog Posts</CardTitle>
                      <Button
                        size="sm"
                        onClick={() => setActiveView('editor')}
                        data-testid="button-create-post"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        New Post
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recentPosts.map((post) => (
                          <div
                            key={post.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover-elevate active-elevate-2"
                          >
                            <div className="space-y-1">
                              <p className="font-medium">{post.title}</p>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <span className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {post.date}
                                </span>
                                <span className="flex items-center">
                                  <Eye className="h-3 w-3 mr-1" />
                                  {post.views.toLocaleString()} views
                                </span>
                                <Badge
                                  variant={post.status === 'published' ? 'default' : 'outline'}
                                >
                                  {post.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                data-testid={`button-edit-post-${post.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                data-testid={`button-delete-post-${post.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="downloads">
                  <Card>
                    <CardHeader>
                      <CardTitle>Popular Downloads</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {popularDownloads.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="space-y-1">
                              <p className="font-medium">{item.name}</p>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <span className="flex items-center">
                                  <Download className="h-3 w-3 mr-1" />
                                  {item.downloads.toLocaleString()} downloads
                                </span>
                                <span className="flex items-center">
                                  ⭐ {item.rating}
                                </span>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="analytics">
                  <Card>
                    <CardHeader>
                      <CardTitle>Traffic Analytics</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[400px] flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground" />
                        <p className="text-muted-foreground">
                          Analytics chart will be displayed here
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div>
              <Button
                variant="ghost"
                className="mb-6"
                onClick={() => setActiveView('dashboard')}
                data-testid="button-back-to-dashboard"
              >
                ← Back to Dashboard
              </Button>
              <PostEditor onSave={(data) => console.log('Saving:', data)} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}