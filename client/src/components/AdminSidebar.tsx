import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  FileText, 
  Upload, 
  BarChart3, 
  Settings, 
  Users,
  Download,
  Plus,
  LogOut,
  Signal,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminSidebar() {
  const [location] = useLocation();

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/posts', label: 'Blog Posts', icon: FileText },
    { href: '/admin/add-signal', label: 'Add Signal', icon: Plus },
    { href: '/admin/signals', label: 'Manage Signals', icon: Signal },
    { href: '/admin/downloads', label: 'Downloads', icon: Download },
    { href: '/admin/upload', label: 'Upload EA', icon: Upload },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 h-full bg-card border-r">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Admin Panel</h2>
          <p className="text-sm text-muted-foreground">Manage your content</p>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b">
          <Link href="/admin/posts/new">
            <a>
              <Button className="w-full" size="sm" data-testid="button-new-post">
                <Plus className="w-4 h-4 mr-2" />
                New Post
              </Button>
            </a>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>
                  <a
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover-elevate active-elevate-2 ${
                      location === item.href
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    data-testid={`link-admin-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t">
          <Button 
            variant="ghost" 
            className="w-full justify-start" 
            size="sm"
            onClick={() => console.log('Logout clicked')}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </aside>
  );
}