import { useLocation } from 'wouter';
import { Link } from 'wouter';
import { ChevronRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface LayoutProps {
  children: React.ReactNode;
  breadcrumbs?: Array<{
    name: string;
    href?: string;
  }>;
}

export default function Layout({ children, breadcrumbs }: LayoutProps) {
  const [location] = useLocation();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
            <nav className="flex items-center text-sm" aria-label="Breadcrumb">
              <Link href="/">
                <a className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-breadcrumb-home">
                  Home
                </a>
              </Link>
              {breadcrumbs.map((crumb, index) => (
                <span key={index} className="flex items-center">
                  <ChevronRight className="mx-2 h-4 w-4 text-muted-foreground" />
                  {crumb.href ? (
                    <Link href={crumb.href}>
                      <a 
                        className="text-muted-foreground hover:text-foreground transition-colors" 
                        data-testid={`link-breadcrumb-${crumb.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {crumb.name}
                      </a>
                    </Link>
                  ) : (
                    <span className="text-foreground font-medium">{crumb.name}</span>
                  )}
                </span>
              ))}
            </nav>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
      
      <Footer />
    </div>
  );
}