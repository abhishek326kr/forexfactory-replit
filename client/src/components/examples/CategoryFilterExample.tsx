import { useState } from 'react';
import CategoryFilter from '../CategoryFilter';

export default function CategoryFilterExample() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const categories = [
    'Expert Advisors',
    'Indicators',
    'Scalping',
    'Grid Trading',
    'News Trading',
    'Trend Following',
    'Martingale',
    'Hedging',
    'Price Action',
  ];

  return (
    <div className="p-4">
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />
      <p className="mt-4 text-sm text-muted-foreground">
        Selected: {selectedCategory}
      </p>
    </div>
  );
}