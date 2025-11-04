import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { useRoute, useLocation } from 'wouter';
import { Search, Calendar, Clock, Tag } from 'lucide-react';
import Layout from '@/components/Layout';
import SEOHead from '@/components/SEOHead';
import BlogCard from '@/components/BlogCard';
import CategoryFilter from '@/components/CategoryFilter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateOptimizedTitle, generateOptimizedMetaDescription, LONG_TAIL_KEYWORDS } from '@/lib/keywords';

export default function Blog() {
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute('/category/:category');
  const category = params?.category;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const postsPerPage = 9;

  // Fetch posts
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['/api/posts', category, searchQuery, selectedTag, sortBy, page],
    select: (data: any) => {
      let posts = data?.data || [];
      
      // Filter by category if provided
      if (category) {
        posts = posts.filter((p: any) => p.category?.toLowerCase() === category.toLowerCase());
      }
      
      // Filter by search query
      if (searchQuery) {
        posts = posts.filter((p: any) => 
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Filter by tag
      if (selectedTag) {
        posts = posts.filter((p: any) => p.tags?.includes(selectedTag));
      }
      
      // Sort posts
      if (sortBy === 'oldest') {
        posts = [...posts].reverse();
      }
      
      // Pagination
      const startIndex = (page - 1) * postsPerPage;
      const paginatedPosts = posts.slice(startIndex, startIndex + postsPerPage);
      
      return {
        posts: paginatedPosts,
        total: posts.length,
        totalPages: Math.ceil(posts.length / postsPerPage)
      };
    }
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['/api/categories']
  });

  // Fetch popular tags
  const { data: popularTags } = useQuery({
    queryKey: ['/api/tags/popular']
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const pageTitle = category 
    ? `${category.charAt(0).toUpperCase() + category.slice(1)} Articles - Forex Trading Insights`
    : 'Forex Trading Blog - Expert Tips & EA Strategies';

  const metaDescription = generateOptimizedMetaDescription('BLOG_POST', {
    topic: category || 'Forex trading strategies',
    benefit: 'expert insights and proven techniques',
    outcome: 'trading performance'
  });

  const breadcrumbs = category ? [
    { name: 'Blog', href: '/blog' },
    { name: category.charAt(0).toUpperCase() + category.slice(1) }
  ] : [{ name: 'Blog' }];

  return (
    <HelmetProvider>
      <SEOHead
        title={pageTitle}
        description={metaDescription}
        keywords={LONG_TAIL_KEYWORDS.slice(0, 10).join(', ')}
        path={location}
        ogType="website"
      />
      
      <Layout breadcrumbs={breadcrumbs}>
        {/* Page Header */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              {category 
                ? `${category.charAt(0).toUpperCase() + category.slice(1)} Articles`
                : 'Trading Insights & EA Tutorials'}
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              {category
                ? `Explore our collection of ${category} articles, tutorials, and expert analysis.`
                : 'Learn Forex trading strategies, Expert Advisor optimization, and market analysis from industry professionals.'}
            </p>
          </div>
        </section>
        
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Sidebar */}
              <aside className="lg:col-span-1 space-y-6">
                {/* Search */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Search Articles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSearch} className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Search posts..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                          data-testid="input-blog-search"
                        />
                      </div>
                      <Button type="submit" className="w-full" size="sm" data-testid="button-blog-search">
                        Search
                      </Button>
                    </form>
                  </CardContent>
                </Card>
                
                {/* Categories */}
                {categories && (
                  <CategoryFilter 
                    categories={categories as any} 
                    selectedCategory={category}
                  />
                )}
                
                {/* Popular Tags */}
                {popularTags && (popularTags as any[]).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Popular Tags</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {(popularTags as any[]).map((tag: any) => (
                          <Badge
                            key={tag.id}
                            variant={selectedTag === tag.name ? "default" : "secondary"}
                            className="cursor-pointer hover-elevate"
                            onClick={() => {
                              setSelectedTag(selectedTag === tag.name ? null : tag.name);
                              setPage(1);
                            }}
                            data-testid={`tag-${tag.name.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <Tag className="mr-1 h-3 w-3" />
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </aside>
              
              {/* Main Content */}
              <div className="lg:col-span-3">
                {/* Sort and Filter Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-sm font-medium">
                      {postsData?.total || 0} articles found
                    </span>
                    {(searchQuery || selectedTag || category) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedTag(null);
                          if (category) setLocation('/blog');
                        }}
                        data-testid="button-clear-filters"
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                  
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]" data-testid="select-sort-by">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Posts Grid */}
                {postsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <Card key={i} className="overflow-hidden">
                        <Skeleton className="h-48 w-full" />
                        <CardContent className="p-6">
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-5/6" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : postsData?.posts?.length === 0 ? (
                  <Card className="py-12">
                    <CardContent className="text-center">
                      <p className="text-muted-foreground">No articles found matching your criteria.</p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedTag(null);
                        }}
                        data-testid="button-reset-filters"
                      >
                        Reset Filters
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {postsData?.posts?.map((post: any) => (
                      <BlogCard key={post.id} {...post} />
                    ))}
                  </div>
                )}
                
                {/* Pagination */}
                {postsData && postsData.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      data-testid="button-prev-page"
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {[...Array(postsData.totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        if (
                          pageNum === 1 ||
                          pageNum === postsData.totalPages ||
                          Math.abs(pageNum - page) <= 1
                        ) {
                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPage(pageNum)}
                              className="w-9"
                              data-testid={`button-page-${pageNum}`}
                            >
                              {pageNum}
                            </Button>
                          );
                        } else if (Math.abs(pageNum - page) === 2) {
                          return <span key={pageNum}>...</span>;
                        }
                        return null;
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(postsData.totalPages, p + 1))}
                      disabled={page === postsData.totalPages}
                      data-testid="button-next-page"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </Layout>
    </HelmetProvider>
  );
}