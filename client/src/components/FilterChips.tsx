import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface FilterChip {
  id: string;
  label: string;
  value: any;
  category?: string;
}

interface FilterChipsProps {
  filters: FilterChip[];
  onRemove: (filterId: string) => void;
  onClearAll?: () => void;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

export default function FilterChips({
  filters,
  onRemove,
  onClearAll,
  className,
  size = 'default'
}: FilterChipsProps) {
  if (filters.length === 0) return null;

  // Group filters by category
  const groupedFilters = filters.reduce((acc, filter) => {
    const category = filter.category || 'default';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(filter);
    return acc;
  }, {} as Record<string, FilterChip[]>);

  const badgeSize = size === 'sm' ? 'text-xs px-2 py-0.5' : size === 'lg' ? 'text-base px-3 py-1' : '';

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Active Filters Label */}
      <span className="text-sm font-medium text-muted-foreground">
        Active filters:
      </span>

      {/* Filter Chips */}
      {Object.entries(groupedFilters).map(([category, categoryFilters]) => (
        <div key={category} className="flex flex-wrap items-center gap-2">
          {category !== 'default' && (
            <span className="text-xs text-muted-foreground">
              {category}:
            </span>
          )}
          {categoryFilters.map(filter => (
            <Badge
              key={filter.id}
              variant="secondary"
              className={cn(
                "pr-1 gap-1 hover-elevate cursor-pointer",
                badgeSize
              )}
              onClick={() => onRemove(filter.id)}
              data-testid={`chip-${filter.id}`}
            >
              <span>{filter.label}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(filter.id);
                }}
                data-testid={`remove-chip-${filter.id}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      ))}

      {/* Clear All Button */}
      {filters.length > 1 && onClearAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-6 px-2"
          data-testid="button-clear-all-chips"
        >
          Clear all
        </Button>
      )}
    </div>
  );
}

// Utility function to create filter chips from various filter states
export function createFilterChips(filters: Record<string, any>): FilterChip[] {
  const chips: FilterChip[] = [];

  Object.entries(filters).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '' || 
        (Array.isArray(value) && value.length === 0)) {
      return;
    }

    // Handle different filter types
    if (Array.isArray(value)) {
      // Array filters (e.g., tags, categories)
      value.forEach(item => {
        chips.push({
          id: `${key}-${item}`,
          label: item,
          value: item,
          category: key
        });
      });
    } else if (typeof value === 'object' && value.from && value.to) {
      // Date range filters
      chips.push({
        id: key,
        label: `${formatDate(value.from)} - ${formatDate(value.to)}`,
        value: value,
        category: key
      });
    } else if (typeof value === 'boolean') {
      // Boolean filters
      chips.push({
        id: key,
        label: formatFilterLabel(key),
        value: value,
        category: 'Options'
      });
    } else {
      // Simple value filters
      chips.push({
        id: key,
        label: formatFilterValue(key, value),
        value: value,
        category: formatFilterLabel(key)
      });
    }
  });

  return chips;
}

// Helper functions
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatFilterLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
}

function formatFilterValue(key: string, value: any): string {
  // Special formatting for certain filter types
  switch (key) {
    case 'rating':
      return `${value}+ stars`;
    case 'price':
      return value === 'free' ? 'Free' : value === 'paid' ? 'Paid' : value;
    case 'sortBy':
      return formatSortLabel(value);
    default:
      return String(value);
  }
}

function formatSortLabel(sort: string): string {
  const sortLabels: Record<string, string> = {
    'newest': 'Newest First',
    'oldest': 'Oldest First',
    'popular': 'Most Popular',
    'rating': 'Highest Rated',
    'downloads': 'Most Downloaded',
    'views': 'Most Viewed',
    'comments': 'Most Commented'
  };
  return sortLabels[sort] || sort;
}