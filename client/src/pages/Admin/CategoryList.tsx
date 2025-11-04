import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FolderOpen,
  FolderPlus,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  ChevronRight,
  ChevronDown,
  Hash,
  Eye,
  EyeOff,
  Palette,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Folder
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name is too long'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  description: z.string().max(200, 'Description is too long').optional(),
  parentId: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  sortOrder: z.number().min(0).optional()
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  icon?: string;
  color?: string;
  status: 'active' | 'inactive';
  sortOrder: number;
  childCount: number;
  postCount: number;
  children?: Category[];
}

const iconOptions = [
  { value: 'folder', label: 'Folder', icon: Folder },
  { value: 'hash', label: 'Hash', icon: Hash },
  { value: 'palette', label: 'Palette', icon: Palette }
];

const colorOptions = [
  { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { value: 'green', label: 'Green', class: 'bg-green-500' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { value: 'red', label: 'Red', class: 'bg-red-500' },
  { value: 'yellow', label: 'Yellow', class: 'bg-yellow-500' },
  { value: 'gray', label: 'Gray', class: 'bg-gray-500' }
];

export default function CategoryList() {
  const { toast } = useToast();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showDialog, setShowDialog] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);

  // Fetch categories
  const { data: categoriesData, isLoading, error } = useQuery({
    queryKey: ['/api/admin/categories'],
    queryFn: async () => {
      // Mock data for now - replace with actual API call
      return {
        categories: [
          {
            id: '1',
            name: 'Expert Advisors',
            slug: 'expert-advisors',
            description: 'Automated trading systems for MT4/MT5',
            parentId: null,
            icon: 'folder',
            color: 'blue',
            status: 'active' as const,
            sortOrder: 1,
            childCount: 3,
            postCount: 45,
            children: [
              {
                id: '2',
                name: 'Grid Trading',
                slug: 'grid-trading',
                description: 'Grid-based trading strategies',
                parentId: '1',
                icon: 'hash',
                color: 'green',
                status: 'active' as const,
                sortOrder: 1,
                childCount: 0,
                postCount: 12
              },
              {
                id: '3',
                name: 'Scalping',
                slug: 'scalping',
                description: 'High-frequency scalping EAs',
                parentId: '1',
                icon: 'hash',
                color: 'purple',
                status: 'active' as const,
                sortOrder: 2,
                childCount: 0,
                postCount: 18
              },
              {
                id: '4',
                name: 'Trend Following',
                slug: 'trend-following',
                description: 'Trend-based strategies',
                parentId: '1',
                icon: 'hash',
                color: 'blue',
                status: 'active' as const,
                sortOrder: 3,
                childCount: 0,
                postCount: 15
              }
            ]
          },
          {
            id: '5',
            name: 'Indicators',
            slug: 'indicators',
            description: 'Custom indicators for technical analysis',
            parentId: null,
            icon: 'folder',
            color: 'purple',
            status: 'active' as const,
            sortOrder: 2,
            childCount: 2,
            postCount: 32,
            children: [
              {
                id: '6',
                name: 'Oscillators',
                slug: 'oscillators',
                description: 'RSI, MACD, Stochastic indicators',
                parentId: '5',
                icon: 'hash',
                color: 'red',
                status: 'active' as const,
                sortOrder: 1,
                childCount: 0,
                postCount: 20
              },
              {
                id: '7',
                name: 'Trend Indicators',
                slug: 'trend-indicators',
                description: 'Moving averages and trend lines',
                parentId: '5',
                icon: 'hash',
                color: 'green',
                status: 'active' as const,
                sortOrder: 2,
                childCount: 0,
                postCount: 12
              }
            ]
          },
          {
            id: '8',
            name: 'Trading Strategies',
            slug: 'trading-strategies',
            description: 'Educational content on trading strategies',
            parentId: null,
            icon: 'folder',
            color: 'green',
            status: 'active' as const,
            sortOrder: 3,
            childCount: 0,
            postCount: 28
          },
          {
            id: '9',
            name: 'Market Analysis',
            slug: 'market-analysis',
            description: 'Market news and analysis',
            parentId: null,
            icon: 'folder',
            color: 'yellow',
            status: 'inactive' as const,
            sortOrder: 4,
            childCount: 0,
            postCount: 5
          }
        ],
        total: 9
      };
    }
  });

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      parentId: '',
      icon: 'folder',
      color: 'blue',
      status: 'active',
      sortOrder: 0
    }
  });

  // Create/Update category mutation
  const saveMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const response = await apiRequest(
        editCategory ? 'PUT' : 'POST',
        editCategory ? `/api/admin/categories/${editCategory.id}` : '/api/admin/categories',
        data
      );
      if (!response.ok) throw new Error('Failed to save category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] });
      toast({
        title: editCategory ? 'Category updated' : 'Category created',
        description: 'The category has been successfully saved.'
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: 'Save failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/admin/categories/${id}`);
      if (!response.ok) throw new Error('Failed to delete category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] });
      toast({
        title: 'Category deleted',
        description: 'The category has been successfully deleted.'
      });
      setDeleteCategory(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Reorder category mutation
  const reorderMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: 'up' | 'down' }) => {
      const response = await apiRequest('PATCH', `/api/admin/categories/${id}/reorder`, { direction });
      if (!response.ok) throw new Error('Failed to reorder category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] });
      toast({
        title: 'Order updated',
        description: 'Category order has been updated.'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Reorder failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditCategory(category);
      form.reset({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        parentId: category.parentId || '',
        icon: category.icon || 'folder',
        color: category.color || 'blue',
        status: category.status,
        sortOrder: category.sortOrder
      });
    } else {
      setEditCategory(null);
      form.reset();
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditCategory(null);
    form.reset();
  };

  const handleSubmit = async (data: CategoryFormData) => {
    await saveMutation.mutateAsync(data);
  };

  const generateSlug = () => {
    const name = form.getValues('name');
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    form.setValue('slug', slug);
  };

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getColorClass = (color?: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      gray: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    return colorMap[color || 'gray'] || colorMap.gray;
  };

  const CategoryRow = ({ category, level = 0 }: { category: Category; level?: number }) => {
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = category.children && category.children.length > 0;

    return (
      <>
        <div 
          className="group flex items-center justify-between p-3 hover:bg-accent/50 rounded-lg transition-colors"
          style={{ paddingLeft: `${level * 2 + 0.75}rem` }}
          data-testid={`row-category-${category.id}`}
        >
          <div className="flex items-center gap-3 flex-1">
            {hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => toggleExpanded(category.id)}
                data-testid={`button-expand-${category.id}`}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
            {!hasChildren && <div className="w-6" />}
            
            <Badge className={`${getColorClass(category.color)} gap-1`}>
              <FolderOpen className="h-3 w-3" />
              {category.name}
            </Badge>
            
            <span className="text-sm text-muted-foreground">/{category.slug}</span>
            
            {category.status === 'inactive' && (
              <Badge variant="secondary" className="gap-1">
                <EyeOff className="h-3 w-3" />
                Inactive
              </Badge>
            )}
            
            {category.description && (
              <span className="text-sm text-muted-foreground hidden lg:inline">
                {category.description}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {category.postCount} posts
            </Badge>
            
            {hasChildren && (
              <Badge variant="outline" className="text-xs">
                {category.childCount} subcategories
              </Badge>
            )}

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => reorderMutation.mutate({ id: category.id, direction: 'up' })}
                disabled={category.sortOrder === 1}
                data-testid={`button-move-up-${category.id}`}
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => reorderMutation.mutate({ id: category.id, direction: 'down' })}
                data-testid={`button-move-down-${category.id}`}
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  data-testid={`button-actions-${category.id}`}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleOpenDialog(category)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                {!hasChildren && (
                  <DropdownMenuItem onClick={() => handleOpenDialog()}>
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Add Subcategory
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDeleteCategory(category)}
                  disabled={hasChildren}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {hasChildren && isExpanded && category.children?.map((child) => (
          <CategoryRow key={child.id} category={child} level={level + 1} />
        ))}
      </>
    );
  };

  const categories = categoriesData?.categories || [];

  return (
    <AdminLayout title="Category Management" description="Organize content with hierarchical categories">
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {categoriesData?.total || 0} Categories
          </Badge>
        </div>
        <Button onClick={() => handleOpenDialog()} data-testid="button-new-category">
          <Plus className="h-4 w-4 mr-2" />
          New Category
        </Button>
      </div>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            Manage your content categories and hierarchy
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <Folder className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-muted-foreground">Failed to load categories</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No categories found</p>
              <Button className="mt-4" onClick={() => handleOpenDialog()} data-testid="button-create-first-category">
                <Plus className="h-4 w-4 mr-2" />
                Create your first category
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {categories.filter(c => !c.parentId).map((category) => (
                <CategoryRow key={category.id} category={category} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editCategory ? 'Edit Category' : 'New Category'}
            </DialogTitle>
            <DialogDescription>
              {editCategory ? 'Update category details' : 'Create a new category for your content'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                {...form.register('name')}
                placeholder="e.g., Expert Advisors"
                data-testid="input-category-name"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>URL Slug</Label>
              <div className="flex gap-2">
                <Input
                  {...form.register('slug')}
                  placeholder="e.g., expert-advisors"
                  className="flex-1"
                  data-testid="input-category-slug"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateSlug}
                  data-testid="button-generate-slug"
                >
                  Generate
                </Button>
              </div>
              {form.formState.errors.slug && (
                <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                {...form.register('description')}
                placeholder="Brief description of this category..."
                className="resize-none"
                data-testid="textarea-category-description"
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
              )}
            </div>

            {!editCategory?.parentId && (
              <div className="space-y-2">
                <Label>Parent Category</Label>
                <Select 
                  value={form.watch('parentId')} 
                  onValueChange={(value) => form.setValue('parentId', value)}
                >
                  <SelectTrigger data-testid="select-parent-category">
                    <SelectValue placeholder="None (Top level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (Top level)</SelectItem>
                    {categories.filter(c => !c.parentId && c.id !== editCategory?.id).map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Color</Label>
                <Select 
                  value={form.watch('color')} 
                  onValueChange={(value) => form.setValue('color', value)}
                >
                  <SelectTrigger data-testid="select-color">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map(color => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded ${color.class}`} />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={form.watch('status')} 
                  onValueChange={(value) => form.setValue('status', value as 'active' | 'inactive')}
                >
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">
                      <div className="flex items-center gap-2">
                        <Eye className="h-3 w-3" />
                        Active
                      </div>
                    </SelectItem>
                    <SelectItem value="inactive">
                      <div className="flex items-center gap-2">
                        <EyeOff className="h-3 w-3" />
                        Inactive
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" data-testid="button-save-category">
                {editCategory ? 'Update' : 'Create'} Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteCategory} onOpenChange={() => setDeleteCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category "{deleteCategory?.name}".
              {deleteCategory?.postCount && deleteCategory.postCount > 0 && (
                <span className="block mt-2 font-semibold">
                  Warning: This category has {deleteCategory.postCount} posts that will need to be reassigned.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCategory && deleteMutation.mutate(deleteCategory.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}