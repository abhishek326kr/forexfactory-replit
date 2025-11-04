import BlogCard from '../BlogCard';
import mt5Image from '@assets/generated_images/MT5_bot_performance_1cf76885.png';

export default function BlogCardExample() {
  const mockBlogPost = {
    id: '1',
    title: 'How to Optimize Your Expert Advisor for Maximum Profit',
    excerpt: 'Learn the essential techniques for fine-tuning your EA parameters, backtesting strategies, and implementing risk management to maximize your trading profits.',
    category: 'Trading Strategies',
    author: 'John Smith',
    date: 'Dec 15, 2024',
    readTime: 8,
    image: mt5Image,
    slug: 'optimize-expert-advisor-profit',
    tags: ['EA Optimization', 'Backtesting', 'Risk Management'],
  };

  return (
    <div className="max-w-md">
      <BlogCard {...mockBlogPost} />
    </div>
  );
}