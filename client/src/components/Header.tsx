import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, Download, TrendingUp, BookOpen, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from './ThemeToggle';
import GlobalSearch from './GlobalSearch';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [location] = useLocation();

  const navLinks = [
    { href: '/', label: 'Home', icon: null },
    { href: '/blog', label: 'Blog', icon: BookOpen },
    { href: '/downloads', label: 'Downloads', icon: Download },
    { href: '/category/indicators', label: 'Indicators', icon: TrendingUp },
    { href: '/category/expert-advisors', label: 'Expert Advisors', icon: null },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4 md:px-6">
        <div className="flex h-16 md:h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <a className="flex items-center space-x-2 hover-elevate active-elevate-2 px-3 py-1.5 rounded-lg -ml-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl tracking-tight">ForexFactory.cc</span>
              </div>
            </a>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <a
                  data-testid={`link-nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary ${
                    location === link.href ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {link.icon && <link.icon className="w-4 h-4" />}
                  <span>{link.label}</span>
                </a>
              </Link>
            ))}
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
                <Link href="/admin">
                  <a>
                    <Button variant="default" size="sm" data-testid="button-admin">
                      Admin Panel
                    </Button>
                  </a>
                </Link>
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
                <Link key={link.href} href={link.href}>
                  <a
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
                  </a>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}