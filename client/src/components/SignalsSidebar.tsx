import { useQuery } from '@tanstack/react-query';
import { Bot, Download, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Signal {
  id: string;
  uuid: string;
  title: string;
  description: string;
  screenshots?: string;
  platform?: string;
  strategy?: string;
  downloadCount: number;
  createdAt: string;
}

export default function SignalsSidebar() {
  // Fetch latest signals
  const { data: signals, isLoading } = useQuery({
    queryKey: ['/api/signals', 'sidebar'],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('limit', '5');
      params.append('sortBy', 'createdAt');
      params.append('sortOrder', 'desc');
      
      const response = await fetch(`/api/signals?${params.toString()}`);
      if (!response.ok) return { data: [] };
      const result = await response.json();
      return result.data || result.signals || [];
    }
  });

  const getScreenshot = (signal: Signal) => {
    if (signal.screenshots) {
      try {
        const screenshots = JSON.parse(signal.screenshots);
        return screenshots[0];
      } catch {
        return null;
      }
    }
    return null;
  };

  return (
    <div className="sticky top-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Latest Trading Signals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </>
          ) : signals && signals.length > 0 ? (
            <>
              {signals.slice(0, 5).map((signal: Signal) => (
                <div key={signal.id} className="border-b last:border-0 pb-4 last:pb-0">
                  {/* Screenshot Thumbnail */}
                  {getScreenshot(signal) && (
                    <div className="aspect-video mb-3 rounded overflow-hidden bg-muted">
                      <img 
                        src={getScreenshot(signal)} 
                        alt={signal.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Title */}
                  <h4 className="font-medium text-sm mb-1 line-clamp-2">
                    {signal.title}
                  </h4>
                  
                  {/* Description */}
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {signal.description}
                  </p>
                  
                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      <span>{signal.downloadCount || 0}</span>
                    </div>
                    {signal.platform && (
                      <Badge variant="outline" className="text-xs py-0 px-1">
                        {signal.platform}
                      </Badge>
                    )}
                  </div>
                  
                  {/* View Button */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => window.location.href = `/signal/${signal.uuid || signal.id}`}
                  >
                    View Signal
                  </Button>
                </div>
              ))}
              
              {/* View All Button */}
              <Button 
                className="w-full" 
                size="sm"
                onClick={() => window.location.href = '/signals'}
              >
                View All Signals
              </Button>
            </>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No signals available</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Trading Tips Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-5 w-5" />
            Trading Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Always test EAs on demo accounts first</li>
            <li>• Use proper risk management (1-2% per trade)</li>
            <li>• Keep your MT4/MT5 platform updated</li>
            <li>• Monitor EA performance regularly</li>
            <li>• Diversify your trading strategies</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}