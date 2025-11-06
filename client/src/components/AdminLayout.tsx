import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Home,
  FileText,
  Download,
  BarChart3,
  Settings,
  LogOut,
  User,
  ChevronRight,
  Menu,
  X,
  PenSquare,
  Package,
  Users,
  Tags,
  FolderOpen,
  Bot,
  Image,
  Search,
  Plus,
  List,
  Mail,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: Home
  },
  {
    title: 'Blogs',
    href: '/admin/blogs',
    icon: FileText
  },
  {
    title: 'Categories',
    href: '/admin/categories',
    icon: FolderOpen
  },
  {
    title: 'Add Signal',
    href: '/admin/signals/new',
    icon: Plus
  },
  {
    title: 'Manage Signals',
    href: '/admin/signals',
    icon: List
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users
  },
  {
    title: 'Media',
    href: '/admin/media',
    icon: Image
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3
  },
  {
    title: 'Email Management',
    href: '/admin/email-management',
    icon: Mail
  },
  {
    title: 'Download Analytics',
    href: '/admin/download-analytics',
    icon: Download
  },
  {
    title: 'SEO',
    href: '/admin/seo',
    icon: Search
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings
  }
];

export function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const isActive = (path: string) => {
    if (path === '/admin' && location === '/admin') return true;
    if (path !== '/admin' && location.startsWith(path)) return true;
    return false;
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold">ForexFactory</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  'group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
                data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon className={cn('mr-3 h-4 w-4', active ? 'text-primary-foreground' : '')} />
                <span className="flex-1">{item.title}</span>
                {item.badge && (
                  <span className="ml-auto inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium">
                    {item.badge}
                  </span>
                )}
              </a>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar || undefined} />
            <AvatarFallback>
              {user?.username?.slice(0, 2).toUpperCase() || 'AD'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.username || 'Admin'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r bg-card">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              data-testid="button-mobile-menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Page Title */}
            <div>
              <h1 className="text-xl font-semibold">{title || 'Admin Panel'}</h1>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full"
                data-testid="button-user-menu"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.avatar || undefined} />
                  <AvatarFallback>
                    {user?.username?.slice(0, 2).toUpperCase() || 'AD'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.username}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/profile">
                  <a className="flex items-center w-full" data-testid="menu-profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </a>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/settings">
                  <a className="flex items-center w-full" data-testid="menu-settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </a>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive cursor-pointer"
                onClick={handleLogout}
                data-testid="menu-logout"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}