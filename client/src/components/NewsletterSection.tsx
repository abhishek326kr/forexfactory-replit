import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, CheckCircle } from 'lucide-react';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Newsletter signup:', email);
    setIsSubscribed(true);
    //todo: remove mock functionality
    setTimeout(() => setIsSubscribed(false), 3000);
  };

  return (
    <section className="w-full py-16 md:py-24 bg-card">
      <div className="container mx-auto px-4 md:px-6">
        <Card className="max-w-3xl mx-auto">
          <CardContent className="p-8 md:p-12 text-center space-y-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold">
                Get Trading Insights Weekly
              </h2>
              <p className="text-muted-foreground">
                Join 50,000+ traders receiving exclusive EA releases, market analysis, and trading strategies
              </p>
            </div>

            {!isSubscribed ? (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="flex-1 px-4 py-3 rounded-lg border bg-background"
                  data-testid="input-newsletter"
                />
                <Button type="submit" size="lg" data-testid="button-subscribe">
                  Subscribe Free
                </Button>
              </form>
            ) : (
              <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Successfully subscribed!</span>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              No spam, unsubscribe anytime. We value your privacy.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}