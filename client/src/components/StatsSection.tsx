import { Download, Users, TrendingUp, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function StatsSection() {
  const stats = [
    {
      icon: Download,
      value: '500K+',
      label: 'Total Downloads',
      description: 'EAs & Indicators downloaded',
    },
    {
      icon: Users,
      value: '100K+',
      label: 'Active Traders',
      description: 'Using our tools daily',
    },
    {
      icon: TrendingUp,
      value: '2,500+',
      label: 'Trading Tools',
      description: 'Available for free',
    },
    {
      icon: Award,
      value: '98%',
      label: 'Success Rate',
      description: 'Positive user feedback',
    },
  ];

  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Trusted by Traders Worldwide
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of successful traders using our Expert Advisors and indicators
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="text-center hover-elevate active-elevate-2">
              <CardContent className="p-6 space-y-2">
                <stat.icon className="w-10 h-10 mx-auto text-primary mb-3" />
                <div className="space-y-1">
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-sm font-medium">{stat.label}</p>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}