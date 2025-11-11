import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bot, Download, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Signal | null>(null);
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
    const normalize = (url?: string | null) => {
      if (!url) return undefined;
      const u = url.trim();
      if (!u) return undefined;
      if (u.startsWith('http://') || u.startsWith('https://')) return u;
      if (u.startsWith('/')) return u;
      return `/${u}`;
    };

    let first: string | undefined = undefined;
    if (signal.screenshots) {
      try {
        const parsed = JSON.parse(signal.screenshots);
        if (Array.isArray(parsed) && parsed.length > 0) first = parsed[0];
        else if (parsed && typeof parsed === 'object') {
          const arr = (parsed.images || parsed.screenshots || []) as string[];
          if (Array.isArray(arr) && arr.length > 0) first = arr[0];
        } else if (typeof parsed === 'string') first = parsed;
      } catch {
        if (typeof signal.screenshots === 'string') {
          const parts = signal.screenshots.split(',').map(s => s.trim()).filter(Boolean);
          if (parts.length > 0) first = parts[0];
        }
      }
    }
    return normalize(first);
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
                  <div
                    className="text-xs text-muted-foreground line-clamp-2 mb-2"
                    dangerouslySetInnerHTML={{ __html: signal.description }}
                  />
                  
                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span className="truncate">{signal.platform || 'Signal'}</span>
                    {signal.strategy && (
                      <Badge variant="outline" className="text-xs py-0 px-1">
                        {signal.strategy}
                      </Badge>
                    )}
                  </div>
                  
                  {/* View Button */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => { setActive(signal); setOpen(true); }}
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

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setActive(null); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{active?.title || 'Signal'}</DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              {active?.platform && (
                <Badge variant="outline" className="text-xs">{active.platform}</Badge>
              )}
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Download className="h-3 w-3" /> {active?.downloadCount || 0}
              </span>
            </DialogDescription>
          </DialogHeader>

          {active && (
            <div className="space-y-4">
              {(() => {
                const src = getScreenshot(active);
                return src ? (
                  <div className="aspect-video rounded overflow-hidden bg-muted">
                    <img
                      src={src}
                      alt={active.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                ) : null;
              })()}
              <div
                className="prose max-w-none text-sm"
                dangerouslySetInnerHTML={{ __html: active.description }}
              />
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
            {active && (
              <Button onClick={() => { window.location.href = `/signals/${active.uuid || active.id}`; }}>Open Full Page</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}