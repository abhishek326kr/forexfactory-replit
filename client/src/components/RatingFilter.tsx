import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

interface RatingFilterProps {
  value: number;
  onChange: (rating: number) => void;
  maxRating?: number;
  showLabel?: boolean;
  showClear?: boolean;
  className?: string;
  mode?: 'radio' | 'stars' | 'both';
}

export default function RatingFilter({
  value,
  onChange,
  maxRating = 5,
  showLabel = true,
  showClear = true,
  className,
  mode = 'both'
}: RatingFilterProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const renderStars = (rating: number, interactive: boolean = false) => {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxRating }, (_, i) => {
          const starValue = i + 1;
          const isFilled = interactive 
            ? (hoveredRating !== null ? starValue <= hoveredRating : starValue <= rating)
            : starValue <= rating;

          return (
            <Star
              key={i}
              className={cn(
                "h-4 w-4 transition-colors",
                isFilled 
                  ? "fill-yellow-500 text-yellow-500" 
                  : "text-muted-foreground",
                interactive && "cursor-pointer hover:text-yellow-500"
              )}
              onClick={() => interactive && onChange(starValue)}
              onMouseEnter={() => interactive && setHoveredRating(starValue)}
              onMouseLeave={() => interactive && setHoveredRating(null)}
              data-testid={`star-${starValue}`}
            />
          );
        })}
      </div>
    );
  };

  const ratingOptions = Array.from({ length: maxRating }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}+ star${i === 0 ? '' : 's'}`
  }));

  return (
    <div className={cn("space-y-3", className)}>
      {showLabel && (
        <Label className="text-sm font-medium">Minimum Rating</Label>
      )}

      {mode === 'stars' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {renderStars(value, true)}
            <span className="text-sm text-muted-foreground ml-1">
              {value > 0 ? `${value}+ stars` : 'Any rating'}
            </span>
          </div>
        </div>
      )}

      {mode === 'radio' && (
        <RadioGroup 
          value={value.toString()} 
          onValueChange={(v) => onChange(parseInt(v, 10))}
        >
          <div className="flex items-center space-x-2 py-1">
            <RadioGroupItem value="0" id="rating-0" />
            <Label htmlFor="rating-0" className="cursor-pointer text-sm">
              Any rating
            </Label>
          </div>
          {ratingOptions.map(option => (
            <div key={option.value} className="flex items-center space-x-2 py-1">
              <RadioGroupItem 
                value={option.value.toString()} 
                id={`rating-${option.value}`}
                data-testid={`radio-rating-${option.value}`}
              />
              <Label 
                htmlFor={`rating-${option.value}`} 
                className="cursor-pointer text-sm flex items-center gap-2"
              >
                {renderStars(option.value)}
                <span>{option.label}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}

      {mode === 'both' && (
        <div className="space-y-3">
          {/* Interactive Stars */}
          <div className="flex items-center gap-3">
            {renderStars(value, true)}
            <span className="text-sm text-muted-foreground">
              {value > 0 ? `${value}+ stars` : 'Any rating'}
            </span>
          </div>

          {/* Radio Options */}
          <div className="space-y-1">
            <Button
              variant={value === 0 ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              onClick={() => onChange(0)}
              data-testid="button-rating-any"
            >
              Any rating
            </Button>
            {ratingOptions.map(option => (
              <Button
                key={option.value}
                variant={value === option.value ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start"
                onClick={() => onChange(option.value)}
                data-testid={`button-rating-${option.value}`}
              >
                <span className="flex items-center gap-2">
                  {renderStars(option.value)}
                  <span>{option.label}</span>
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {showClear && value > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(0)}
          className="w-full"
          data-testid="button-clear-rating"
        >
          Clear rating filter
        </Button>
      )}
    </div>
  );
}

// Simplified star display component for use in cards/lists
export function StarRating({ 
  rating, 
  maxRating = 5,
  showCount = false,
  count,
  size = 'sm'
}: { 
  rating: number; 
  maxRating?: number;
  showCount?: boolean;
  count?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const starSize = sizeClasses[size];

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxRating }, (_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= Math.floor(rating);
        const isHalf = starValue === Math.ceil(rating) && rating % 1 !== 0;

        return (
          <div key={i} className="relative">
            <Star
              className={cn(
                starSize,
                "text-muted-foreground"
              )}
            />
            {(isFilled || isHalf) && (
              <Star
                className={cn(
                  starSize,
                  "absolute top-0 left-0 fill-yellow-500 text-yellow-500",
                  isHalf && "clip-path-half"
                )}
                style={isHalf ? { clipPath: 'inset(0 50% 0 0)' } : undefined}
              />
            )}
          </div>
        );
      })}
      <span className="text-sm text-muted-foreground ml-1">
        {rating.toFixed(1)}
      </span>
      {showCount && count !== undefined && (
        <span className="text-sm text-muted-foreground">
          ({count.toLocaleString()})
        </span>
      )}
    </div>
  );
}