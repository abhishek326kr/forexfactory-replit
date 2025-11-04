import { HelmetProvider } from 'react-helmet-async';
import { useLocation, Link } from 'wouter';
import { Users, Target, Award, Globe, TrendingUp, Shield } from 'lucide-react';
import Layout from '@/components/Layout';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { generateOrganizationSchema } from '@/lib/seo';

export default function About() {
  const [location] = useLocation();

  const organizationSchema = generateOrganizationSchema();

  const breadcrumbs = [{ name: 'About' }];

  const teamMembers = [
    {
      name: 'Michael Thompson',
      role: 'Founder & Lead Developer',
      description: 'Expert in MQL4/MQL5 programming with 10+ years of Forex trading experience.',
      image: 'https://api.dicebear.com/7.x/initials/svg?seed=MT'
    },
    {
      name: 'Sarah Chen',
      role: 'Trading Strategy Analyst',
      description: 'Specializes in algorithmic trading strategies and market analysis.',
      image: 'https://api.dicebear.com/7.x/initials/svg?seed=SC'
    },
    {
      name: 'David Rodriguez',
      role: 'Community Manager',
      description: 'Manages our community of 50,000+ traders and provides technical support.',
      image: 'https://api.dicebear.com/7.x/initials/svg?seed=DR'
    }
  ];

  const milestones = [
    { year: '2018', event: 'ForexFactory.cc founded', description: 'Started with a vision to democratize algorithmic trading' },
    { year: '2019', event: 'First 100 EAs released', description: 'Reached milestone of 100 verified Expert Advisors' },
    { year: '2020', event: '10,000 active users', description: 'Community grew to 10,000 active traders worldwide' },
    { year: '2021', event: 'MT5 support added', description: 'Expanded platform support to MetaTrader 5' },
    { year: '2022', event: '50,000+ users milestone', description: 'Became one of the largest EA communities' },
    { year: '2023', event: '500+ EAs available', description: 'Comprehensive library of trading strategies' },
    { year: '2024', event: 'AI-powered EAs launched', description: 'Introduced machine learning-based trading systems' }
  ];

  return (
    <HelmetProvider>
      <SEOHead
        title="About ForexFactory.cc - Leading Forex EA Provider"
        description="Learn about ForexFactory.cc, the leading provider of free Expert Advisors and automated trading solutions for MT4/MT5. Our mission is to empower traders worldwide."
        keywords="about ForexFactory, Forex EA provider, trading community, Expert Advisor developers"
        path={location}
        ogType="website"
        structuredData={organizationSchema}
        breadcrumbs={breadcrumbs.map((b) => ({
          name: b.name,
          url: `https://forexfactory.cc${location}`
        }))}
      />
      
      <Layout breadcrumbs={breadcrumbs}>
        {/* Hero Section */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About ForexFactory.cc
            </h1>
            <p className="text-xl text-muted-foreground">
              Empowering traders worldwide with professional Expert Advisors and 
              automated trading solutions since 2018.
            </p>
          </div>
        </section>
        
        {/* Mission & Vision */}
        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="hover-elevate">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Our Mission</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    To democratize algorithmic trading by providing free, high-quality Expert Advisors 
                    and educational resources to traders of all levels. We believe that automated trading 
                    tools should be accessible to everyone, not just institutional traders.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="hover-elevate">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Our Vision</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    To become the world's most trusted platform for Forex Expert Advisors, fostering 
                    a global community where traders can share strategies, learn from each other, 
                    and achieve consistent profitability through automated trading.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* Key Values */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Our Core Values
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle>Trust & Transparency</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Every EA is thoroughly tested with real backtest data. We provide complete 
                    transparency about performance metrics and potential risks.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle>Community First</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Our community of 50,000+ traders is at the heart of everything we do. 
                    We prioritize user feedback and continuously improve based on their needs.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-4">
                    <Award className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle>Quality Excellence</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    We maintain the highest standards for all Expert Advisors on our platform, 
                    ensuring reliable performance and professional-grade code quality.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* Timeline */}
        <section className="py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-4 md:px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Our Journey
            </h2>
            
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 md:left-1/2 transform md:-translate-x-px h-full w-0.5 bg-border" />
              
              {/* Timeline items */}
              <div className="space-y-8">
                {milestones.map((milestone, index) => (
                  <div 
                    key={milestone.year}
                    className={`relative flex items-center ${
                      index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                    }`}
                  >
                    {/* Content */}
                    <div className={`ml-16 md:ml-0 md:w-5/12 ${
                      index % 2 === 0 ? 'md:text-right md:pr-8' : 'md:text-left md:pl-8'
                    }`}>
                      <div className="p-4 bg-card rounded-lg border">
                        <div className="font-bold text-primary mb-1">{milestone.year}</div>
                        <h3 className="font-semibold mb-1">{milestone.event}</h3>
                        <p className="text-sm text-muted-foreground">{milestone.description}</p>
                      </div>
                    </div>
                    
                    {/* Timeline dot */}
                    <div className="absolute left-8 md:left-1/2 transform -translate-x-1/2 w-4 h-4 bg-primary rounded-full border-2 border-background" />
                    
                    {/* Spacer for opposite side */}
                    <div className="hidden md:block md:w-5/12" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        
        {/* Team Section */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Meet Our Team
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {teamMembers.map((member) => (
                <Card key={member.name} className="text-center hover-elevate">
                  <CardContent className="pt-6">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-24 h-24 rounded-full mx-auto mb-4"
                    />
                    <h3 className="font-semibold text-lg mb-1">{member.name}</h3>
                    <p className="text-sm text-primary mb-3">{member.role}</p>
                    <p className="text-sm text-muted-foreground">{member.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        {/* Stats Section */}
        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              ForexFactory.cc in Numbers
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">500+</div>
                  <p className="text-sm text-muted-foreground">Expert Advisors</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">50K+</div>
                  <p className="text-sm text-muted-foreground">Active Traders</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">1M+</div>
                  <p className="text-sm text-muted-foreground">Downloads</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">150+</div>
                  <p className="text-sm text-muted-foreground">Countries</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 md:py-20 bg-primary text-primary-foreground">
          <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Join Our Trading Community
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Start your automated trading journey with ForexFactory.cc today. 
              Access 500+ Expert Advisors and join 50,000+ successful traders.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/downloads">
                <Button size="lg" variant="secondary" data-testid="button-browse-eas">
                  Browse Expert Advisors
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="bg-transparent" data-testid="button-contact-us">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </Layout>
    </HelmetProvider>
  );
}