import { Link } from 'wouter';
import { Github, Twitter, Linkedin, Mail, TrendingUp, Send } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Quick Links',
      links: [
        { href: '/blog', label: 'Latest Posts' },
        { href: '/downloads', label: 'Popular Downloads' },
        { href: '/category/indicators', label: 'MT4 Indicators' },
        { href: '/category/expert-advisors', label: 'Expert Advisors' },
      ],
    },
    {
      title: 'Categories',
      links: [
        { href: '/category/scalping', label: 'Scalping EAs' },
        { href: '/category/trend', label: 'Trend Indicators' },
        { href: '/category/news', label: 'News Trading' },
        { href: '/category/grid', label: 'Grid Systems' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { href: '/docs', label: 'Documentation' },
        { href: '/tutorials', label: 'Video Tutorials' },
        { href: '/faq', label: 'FAQ' },
        { href: '/support', label: 'Support' },
      ],
    },
  ];

  const socialLinks = [
    { icon: Send, href: 'https://t.me/forexfactorycc', label: 'Telegram' },
    { icon: Github, href: '#', label: 'GitHub' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Mail, href: '#', label: 'Email' },
  ];

  return (
    <footer className="w-full border-t bg-card">
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">ForexFactory.cc</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Your trusted source for MetaTrader Expert Advisors and indicators. 
              Helping traders automate their strategies since 2024.
            </p>
            <div className="flex space-x-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label={social.label}
                  data-testid={`link-social-${social.label.toLowerCase()}`}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Footer Sections */}
          {footerSections.map((section) => (
            <div key={section.title} className="space-y-4">
              <h3 className="font-semibold text-sm tracking-wider uppercase">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Section */}
        <div className="mt-12 pt-8 border-t">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <h3 className="font-semibold text-lg">Stay Updated</h3>
            <p className="text-sm text-muted-foreground">
              Join 50,000+ traders and get the latest EA releases and trading insights.
            </p>
            <form className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-lg border bg-background text-foreground"
                data-testid="input-newsletter-email"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover-elevate active-elevate-2"
                data-testid="button-newsletter-submit"
                onClick={(e) => {
                  e.preventDefault();
                }}
              >
                Subscribe
              </button>
            </form>
            <p className="text-xs text-muted-foreground">
              No spam, unsubscribe anytime. We respect your privacy.
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            © {currentYear} ForexFactory.cc. All rights reserved.
          </p>
          <div className="flex justify-center space-x-4 text-sm">
            <Link href="/privacy" className="text-muted-foreground hover:text-primary" data-testid="link-privacy">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-muted-foreground hover:text-primary" data-testid="link-terms">
              Terms of Service
            </Link>
            <Link href="/disclaimer" className="text-muted-foreground hover:text-primary" data-testid="link-disclaimer">
              Risk Disclaimer
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}