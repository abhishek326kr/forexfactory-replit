import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, Download, TrendingUp, BookOpen, Search, ChevronDown, Folder, BarChart3, FileCode, Zap, Layout, Bot, User, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from './ThemeToggle';
import GlobalSearch from './GlobalSearch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  // Fetch categories from API
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  // Define category icons
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('indicator')) return BarChart3;
    if (name.includes('expert') || name.includes('ea')) return TrendingUp;
    if (name.includes('script')) return FileCode;
    if (name.includes('strateg')) return Zap;
    if (name.includes('template')) return Layout;
    return Folder;
  };

  const navLinks = [
    { href: '/', label: 'Home', icon: null },
    { href: '/blog', label: 'Blog', icon: BookOpen },
    { href: '/signals', label: 'Signals', icon: Bot },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4 md:px-6">
        <div className="flex h-16 md:h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 hover-elevate active-elevate-2 px-3 py-1.5 rounded-lg -ml-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl tracking-tight">ForexFactory.cc</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                data-testid={`link-nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                className={`flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary ${
                  location === link.href ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {link.icon && <link.icon className="w-4 h-4" />}
                <span>{link.label}</span>
              </Link>
            ))}
            
            {/* Categories Dropdown */}
            {categories.length > 0 && (
              <>
                {/* Individual category dropdowns for main categories */}
                {categories.slice(0, 5).map((category) => {
                  const Icon = getCategoryIcon(category.name);
                  return (
                    <DropdownMenu key={category.id}>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={`flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary ${
                            location.includes(`/category/${category.slug}`) ? 'text-primary' : 'text-muted-foreground'
                          }`}
                          data-testid={`dropdown-category-${category.slug}`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{category.name}</span>
                          <ChevronDown className="w-3 h-3 ml-1" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuItem asChild>
                          <Link href={`/category/${category.slug}`}>
                            <Icon className="w-4 h-4 mr-2" />
                            All {category.name}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/category/${category.slug}?filter=popular`}>
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Popular {category.name}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/category/${category.slug}?filter=latest`}>
                            <BookOpen className="w-4 h-4 mr-2" />
                            Latest {category.name}
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                })}
                
                {/* More dropdown for additional categories */}
                {categories.length > 5 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary text-muted-foreground"
                        data-testid="dropdown-more-categories"
                      >
                        <Folder className="w-4 h-4" />
                        <span>More</span>
                        <ChevronDown className="w-3 h-3 ml-1" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      {categories.slice(5).map((category) => {
                        const Icon = getCategoryIcon(category.name);
                        return (
                          <Link key={category.id} href={`/category/${category.slug}`}>
                            <DropdownMenuItem>
                              <Icon className="w-4 h-4 mr-2" />
                              {category.name}
                            </DropdownMenuItem>
                          </Link>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Desktop Search */}
            <div className="hidden md:block">
              {showSearch ? (
                <div className="absolute left-0 right-0 top-0 h-full bg-background flex items-center px-4 z-10">
                  <GlobalSearch 
                    className="flex-1 max-w-2xl mx-auto" 
                    autoFocus={true}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSearch(false)}
                    className="ml-2"
                    data-testid="button-close-search"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="hidden lg:block">
                    <GlobalSearch className="w-64" />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    data-testid="button-search"
                    onClick={() => setShowSearch(true)}
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                </>
              )}
            </div>
            
            {!showSearch && (
              <>
                <ThemeToggle />
                
                {/* User Menu / Auth Buttons */}
                {isAuthenticated && user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="relative h-10 w-10 rounded-full"
                        data-testid="button-user-menu"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar || undefined} alt={user.username} />
                          <AvatarFallback>
                            {user.username ? user.username.slice(0, 2).toUpperCase() : 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1 leading-none">
                          {user.username && (
                            <p className="text-sm font-medium">{user.username}</p>
                          )}
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      
                      {user.role === 'admin' && (
                        <>
                          <Link href="/admin">
                            <DropdownMenuItem data-testid="menu-admin-panel">
                              <Layout className="mr-2 h-4 w-4" />
                              Admin Panel
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      
                      <Link href="/settings">
                        <DropdownMenuItem data-testid="menu-settings">
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </DropdownMenuItem>
                      </Link>
                      
                      <Link href="/settings#downloads">
                        <DropdownMenuItem data-testid="menu-downloads">
                          <Download className="mr-2 h-4 w-4" />
                          Downloads
                        </DropdownMenuItem>
                      </Link>
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem 
                        onClick={() => logout()}
                        data-testid="menu-logout"
                        className="text-destructive focus:text-destructive"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link href="/login">
                    <Button variant="default" size="sm" data-testid="button-login">
                      Login
                    </Button>
                  </Link>
                )}
              </>
            )}
            
            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t py-4">
            <div className="flex flex-col space-y-3">
              {/* Mobile Search */}
              <div className="px-3 pb-2">
                <GlobalSearch />
              </div>
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  data-testid={`link-mobile-nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover-elevate active-elevate-2 ${
                    location === link.href
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.icon && <link.icon className="w-4 h-4" />}
                  <span>{link.label}</span>
                </Link>
              ))}
              
              {/* Mobile Categories */}
              {categories.length > 0 && (
                <>
                  <div className="px-3 pt-2 pb-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Categories</p>
                  </div>
                  {categories.map((category) => {
                    const Icon = getCategoryIcon(category.name);
                    return (
                      <Link 
                        key={category.id}
                        href={`/category/${category.slug}`}
                        data-testid={`link-mobile-category-${category.slug}`}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover-elevate active-elevate-2 ${
                          location.includes(`/category/${category.slug}`)
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{category.name}</span>
                      </Link>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}