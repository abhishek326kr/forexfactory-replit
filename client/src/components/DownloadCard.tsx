import { Link } from 'wouter';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Star, Users, Calendar, CheckCircle } from 'lucide-react';

interface DownloadCardProps {
  id: string;
  name: string;
  description: string;
  version: string;
  compatibility: ('MT4' | 'MT5')[];
  downloads: number;
  rating: number;
  lastUpdated: string;
  image: string;
  fileSize: string;
  isPremium?: boolean;
  features?: string[];
}

export default function DownloadCard({
  id,
  name,
  description,
  version,
  compatibility,
  downloads,
  rating,
  lastUpdated,
  image,
  fileSize,
  isPremium = false,
  features = [],
}: DownloadCardProps) {
  const formatDownloads = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card className="h-full flex flex-col hover-elevate active-elevate-2 transition-all duration-200" data-testid={`card-download-${id}`}>
      {/* Image */}
      <div className="aspect-[4/3] relative overflow-hidden rounded-t-lg">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
        />
        {isPremium && (
          <Badge className="absolute top-4 right-4" variant="default">
            Premium
          </Badge>
        )}
        <div className="absolute top-4 left-4 flex gap-2">
          {compatibility.map((platform) => (
            <Badge key={platform} variant="secondary">
              {platform}
            </Badge>
          ))}
        </div>
      </div>

      <CardHeader>
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">{name}</h3>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              v{version}
            </Badge>
            <span className="text-xs text-muted-foreground">{fileSize}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-grow space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center space-x-1.5">
            <Download className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{formatDownloads(downloads)}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-medium">{rating.toFixed(1)}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{lastUpdated}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Active</span>
          </div>
        </div>

        {/* Features */}
        {features.length > 0 && (
          <div className="space-y-1">
            {features.slice(0, 3).map((feature, index) => (
              <div key={index} className="flex items-center space-x-1.5">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span className="text-xs text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        <Link href={`/download/${id}`}>
          <a className="flex-1">
            <Button className="w-full" size="sm" data-testid={`button-download-${id}`}>
              <Download className="w-4 h-4 mr-2" />
              Download EA
            </Button>
          </a>
        </Link>
        <Link href={`/download/${id}`}>
          <a>
            <Button variant="outline" size="sm" data-testid={`button-details-${id}`}>
              Details
            </Button>
          </a>
        </Link>
      </CardFooter>
    </Card>
  );
}