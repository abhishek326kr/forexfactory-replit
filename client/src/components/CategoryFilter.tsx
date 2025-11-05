import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  const [showAll, setShowAll] = useState(false);
  
  const displayCategories = showAll ? categories : categories.slice(0, 6);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge
        variant={selectedCategory === 'all' ? 'default' : 'outline'}
        className="cursor-pointer px-4 py-1.5 hover-elevate active-elevate-2"
        onClick={() => onCategoryChange('all')}
        data-testid="badge-category-all"
      >
        All Categories
      </Badge>
      
      {displayCategories.map((category) => (
        <Badge
          key={category}
          variant={selectedCategory === category ? 'default' : 'outline'}
          className="cursor-pointer px-4 py-1.5 hover-elevate active-elevate-2"
          onClick={() => onCategoryChange(category)}
          data-testid={`badge-category-${typeof category === 'string' ? category.toLowerCase().replace(/\s+/g, '-') : 'category'}`}
        >
          {category}
        </Badge>
      ))}
      
      {categories.length > 6 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(!showAll)}
          data-testid="button-show-more-categories"
        >
          {showAll ? 'Show Less' : `Show ${categories.length - 6} More`}
          <ChevronDown className={`ml-1 h-3 w-3 transition-transform ${showAll ? 'rotate-180' : ''}`} />
        </Button>
      )}
    </div>
  );
}