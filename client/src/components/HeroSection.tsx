import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, TrendingUp, Users, Shield } from 'lucide-react';
import heroImage from '@assets/generated_images/Forex_trading_dashboard_hero_3de3f762.png';

export default function HeroSection() {
  const trustBadges = [
    { icon: Download, value: '500k+', label: 'Downloads' },
    { icon: Users, value: '100k+', label: 'Active Traders' },
    { icon: Shield, value: '100%', label: 'Secure & Free' },
  ];

  return (
    <section className="relative w-full min-h-[600px] md:min-h-[700px] flex items-center">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Forex Trading Dashboard"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 md:px-6 py-16 md:py-28">
        <div className="max-w-3xl space-y-8">
          {/* Badge */}
          <Badge variant="secondary" className="px-4 py-1.5">
            <TrendingUp className="w-3 h-3 mr-1" />
            #1 Source for MT4/MT5 Expert Advisors
          </Badge>

          {/* Headline */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Professional Forex EAs & Indicators for{' '}
            <span className="text-primary">MetaTrader</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
            Download free, tested Expert Advisors and custom indicators. 
            Join thousands of traders automating their strategies with our proven trading tools.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/downloads">
              <Button size="lg" className="w-full sm:w-auto" data-testid="button-browse-eas">
                <Download className="mr-2 h-4 w-4" />
                Browse Free EAs
              </Button>
            </Link>
            <Link href="/blog">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto backdrop-blur-sm bg-background/30"
                data-testid="button-latest-posts"
              >
                Latest Trading Insights
              </Button>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap gap-6 pt-4">
            {trustBadges.map((badge) => (
              <div key={badge.label} className="flex items-center space-x-2">
                <badge.icon className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-bold text-lg">{badge.value}</p>
                  <p className="text-xs text-muted-foreground">{badge.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}