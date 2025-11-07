import { Link } from 'wouter';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, ArrowRight } from 'lucide-react';

interface BlogCardProps {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  readTime: number;
  image: string;
  slug: string;
  tags?: string[] | string;
}

export default function BlogCard({
  id,
  title,
  excerpt,
  category,
  author,
  date,
  readTime,
  image,
  slug,
  tags = [],
}: BlogCardProps) {
  // Parse tags if it's a string (from database) or use as array
  const tagsArray = typeof tags === 'string' 
    ? tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
    : Array.isArray(tags) 
    ? tags 
    : [];
  return (
    <Card className="h-full flex flex-col hover-elevate active-elevate-2 transition-all duration-200" data-testid={`card-blog-${id}`}>
      <Link href={`/blog/${slug}`}>
        <div className="aspect-video relative overflow-hidden rounded-t-lg cursor-pointer">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
          <Badge className="absolute top-4 left-4" variant="secondary">
            {category}
          </Badge>
        </div>
      </Link>
      
      <CardHeader>
        <Link href={`/blog/${slug}`}>
          <h3 className="font-semibold text-lg line-clamp-2 hover:text-primary transition-colors cursor-pointer">{title}</h3>
        </Link>
      </CardHeader>
      
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3">{excerpt}</p>
        
        {tagsArray.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {tagsArray.slice(0, 3).map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
          <span className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            {date}
          </span>
          <span className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {readTime} min read
          </span>
        </div>
        <Link href={`/blog/${slug}`}>
          <span className="text-primary flex items-center text-sm font-medium hover:underline cursor-pointer" data-testid={`link-read-more-${id}`}>
            Read more
            <ArrowRight className="w-3 h-3 ml-1" />
          </span>
        </Link>
      </CardFooter>
    </Card>
  );
}