import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Save,
  Send,
  X,
  Plus,
  Upload,
  Loader2,
  FileCode,
  Image,
  DollarSign,
  Package,
  Bot,
  Settings,
  ListChecks,
  FileText,
  AlertCircle,
  Star
} from 'lucide-react';

const signalSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  version: z.string().min(1, 'Version is required').regex(/^\d+\.\d+\.\d+$/, 'Version must be in format X.Y.Z'),
  platform: z.enum(['MT4', 'MT5', 'Both']),
  strategyType: z.string().min(1, 'Strategy type is required'),
  status: z.enum(['active', 'inactive', 'beta']),
  
  // File uploads
  fileUrl: z.string().url().optional().or(z.literal('')),
  previewImage: z.string().url().optional().or(z.literal('')),
  
  // Features and requirements (stored as JSON arrays)
  features: z.string().optional(),
  requirements: z.string().optional(),
  
  // Installation instructions
  installInstructions: z.string().optional(),
  
  // Pricing
  isPaid: z.boolean(),
  price: z.number().min(0, 'Price must be positive').optional(),
  
  // Additional fields
  minBalance: z.number().min(0).optional(),
  recommendedBalance: z.number().min(0).optional(),
  supportedPairs: z.string().optional(),
  timeframe: z.string().optional(),
  
  // SEO
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  metaTitle: z.string().max(60, 'Meta title should be under 60 characters').optional(),
  metaDescription: z.string().max(160, 'Meta description should be under 160 characters').optional(),
  keywords: z.string().optional()
});

type SignalFormData = z.infer<typeof signalSchema>;

export default function SignalEditor() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const params = useParams() as { id?: string };
  const isEditMode = !!params.id;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [featuresList, setFeaturesList] = useState<string[]>([]);
  const [requirementsList, setRequirementsList] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');
  const [newRequirement, setNewRequirement] = useState('');

  const form = useForm<SignalFormData>({
    resolver: zodResolver(signalSchema),
    defaultValues: {
      name: '',
      description: '',
      version: '1.0.0',
      platform: 'MT4',
      strategyType: '',
      status: 'active',
      fileUrl: '',
      previewImage: '',
      features: '',
      requirements: '',
      installInstructions: '',
      isPaid: false,
      price: 0,
      minBalance: 100,
      recommendedBalance: 1000,
      supportedPairs: '',
      timeframe: '',
      slug: '',
      metaTitle: '',
      metaDescription: '',
      keywords: ''
    }
  });

  // Fetch existing signal data if in edit mode
  const { data: signalData } = useQuery({
    queryKey: ['/api/admin/signals', params.id],
    queryFn: async () => {
      if (!params.id) return null;
      const response = await fetch(`/api/admin/signals/${params.id}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch signal');
      return response.json();
    },
    enabled: isEditMode
  });

  // Load signal data into form
  useEffect(() => {
    if (signalData) {
      form.reset({
        ...signalData,
        features: JSON.stringify(signalData.features || []),
        requirements: JSON.stringify(signalData.requirements || [])
      });
      setFeaturesList(signalData.features || []);
      setRequirementsList(signalData.requirements || []);
    }
  }, [signalData, form]);

  // Create/Update signal mutation
  const saveMutation = useMutation({
    mutationFn: async (data: SignalFormData) => {
      const formattedData = {
        ...data,
        features: featuresList,
        requirements: requirementsList,
        price: data.isPaid ? data.price : 0
      };

      const response = await apiRequest(
        isEditMode ? 'PUT' : 'POST',
        isEditMode ? `/api/admin/signals/${params.id}` : '/api/admin/signals',
        formattedData
      );

      if (!response.ok) throw new Error('Failed to save signal');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/signals'] });
      toast({
        title: isEditMode ? 'Signal updated' : 'Signal created',
        description: 'The signal has been successfully saved.'
      });
      setLocation('/admin/signals');
    },
    onError: (error: Error) => {
      toast({
        title: 'Save failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const onSubmit = async (data: SignalFormData) => {
    setIsSubmitting(true);
    await saveMutation.mutateAsync(data);
    setIsSubmitting(false);
  };

  // Generate slug from name
  const generateSlug = () => {
    const name = form.getValues('name');
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    form.setValue('slug', slug);
  };

  // Add feature
  const addFeature = () => {
    if (newFeature.trim()) {
      setFeaturesList([...featuresList, newFeature.trim()]);
      setNewFeature('');
    }
  };

  // Remove feature
  const removeFeature = (index: number) => {
    setFeaturesList(featuresList.filter((_, i) => i !== index));
  };

  // Add requirement
  const addRequirement = () => {
    if (newRequirement.trim()) {
      setRequirementsList([...requirementsList, newRequirement.trim()]);
      setNewRequirement('');
    }
  };

  // Remove requirement
  const removeRequirement = (index: number) => {
    setRequirementsList(requirementsList.filter((_, i) => i !== index));
  };

  const isPaid = form.watch('isPaid');

  return (
    <AdminLayout 
      title={isEditMode ? 'Edit Signal/EA' : 'New Signal/EA'} 
      description={isEditMode ? 'Update signal details and configuration' : 'Create a new trading signal or expert advisor'}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>Core details about the signal or EA</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Signal/EA Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Grid Trading EA Pro" 
                        {...field} 
                        data-testid="input-signal-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what this signal/EA does, its strategy, and key benefits..." 
                        className="min-h-32"
                        {...field} 
                        data-testid="textarea-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="version"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Version</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="1.0.0" 
                          {...field} 
                          data-testid="input-version"
                        />
                      </FormControl>
                      <FormDescription>Use semantic versioning (X.Y.Z)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platform</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-platform">
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MT4">MetaTrader 4</SelectItem>
                          <SelectItem value="MT5">MetaTrader 5</SelectItem>
                          <SelectItem value="Both">Both MT4 & MT5</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="beta">Beta Testing</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="strategyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Strategy Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-strategy">
                          <SelectValue placeholder="Select strategy type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="grid">Grid Trading</SelectItem>
                        <SelectItem value="scalping">Scalping</SelectItem>
                        <SelectItem value="trend">Trend Following</SelectItem>
                        <SelectItem value="martingale">Martingale</SelectItem>
                        <SelectItem value="hedging">Hedging</SelectItem>
                        <SelectItem value="arbitrage">Arbitrage</SelectItem>
                        <SelectItem value="breakout">Breakout</SelectItem>
                        <SelectItem value="reversal">Mean Reversal</SelectItem>
                        <SelectItem value="news">News Trading</SelectItem>
                        <SelectItem value="custom">Custom Strategy</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Trading Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Trading Configuration
              </CardTitle>
              <CardDescription>Technical requirements and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="minBalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Balance ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="100" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          data-testid="input-min-balance"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recommendedBalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recommended Balance ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="1000" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          data-testid="input-recommended-balance"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="supportedPairs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supported Currency Pairs</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., EURUSD, GBPUSD, USDJPY" 
                        {...field} 
                        data-testid="input-supported-pairs"
                      />
                    </FormControl>
                    <FormDescription>Comma-separated list of supported pairs</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeframe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timeframe</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-timeframe">
                          <SelectValue placeholder="Select timeframe" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="M1">1 Minute</SelectItem>
                        <SelectItem value="M5">5 Minutes</SelectItem>
                        <SelectItem value="M15">15 Minutes</SelectItem>
                        <SelectItem value="M30">30 Minutes</SelectItem>
                        <SelectItem value="H1">1 Hour</SelectItem>
                        <SelectItem value="H4">4 Hours</SelectItem>
                        <SelectItem value="D1">Daily</SelectItem>
                        <SelectItem value="W1">Weekly</SelectItem>
                        <SelectItem value="ANY">Any Timeframe</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Features & Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-5 w-5" />
                Features & Requirements
              </CardTitle>
              <CardDescription>List key features and system requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Features */}
              <div className="space-y-2">
                <Label>Features</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a feature..."
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                    data-testid="input-new-feature"
                  />
                  <Button
                    type="button"
                    onClick={addFeature}
                    size="sm"
                    data-testid="button-add-feature"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {featuresList.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {feature}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeFeature(index)}
                        data-testid={`button-remove-feature-${index}`}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Requirements */}
              <div className="space-y-2">
                <Label>Requirements</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a requirement..."
                    value={newRequirement}
                    onChange={(e) => setNewRequirement(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                    data-testid="input-new-requirement"
                  />
                  <Button
                    type="button"
                    onClick={addRequirement}
                    size="sm"
                    data-testid="button-add-requirement"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {requirementsList.map((requirement, index) => (
                    <Badge key={index} variant="outline" className="gap-1">
                      {requirement}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeRequirement(index)}
                        data-testid={`button-remove-requirement-${index}`}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Installation Instructions */}
              <FormField
                control={form.control}
                name="installInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Installation Instructions</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Step-by-step installation guide..." 
                        className="min-h-32"
                        {...field} 
                        data-testid="textarea-install-instructions"
                      />
                    </FormControl>
                    <FormDescription>Provide clear installation steps</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Files & Media */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Files & Media
              </CardTitle>
              <CardDescription>Upload EA files and preview images</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="fileUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>EA File URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/files/ea.zip" 
                        {...field} 
                        data-testid="input-file-url"
                      />
                    </FormControl>
                    <FormDescription>Direct download link to the EA file</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="previewImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preview Image URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/images/preview.jpg" 
                        {...field} 
                        data-testid="input-preview-image"
                      />
                    </FormControl>
                    <FormDescription>Screenshot or chart showing the EA in action</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing
              </CardTitle>
              <CardDescription>Set pricing for this signal/EA</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="isPaid"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Paid Signal/EA</FormLabel>
                      <FormDescription>
                        Enable this if users need to pay to download
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-is-paid"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {isPaid && (
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="99.99" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          data-testid="input-price"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                SEO Settings
              </CardTitle>
              <CardDescription>Optimize for search engines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Slug</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input 
                          placeholder="grid-trading-ea-pro" 
                          {...field} 
                          data-testid="input-slug"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generateSlug}
                        data-testid="button-generate-slug"
                      >
                        Generate
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="metaTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Grid Trading EA Pro - Advanced Forex Robot" 
                        {...field} 
                        data-testid="input-meta-title"
                      />
                    </FormControl>
                    <FormDescription>
                      {field.value?.length || 0}/60 characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="metaDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Download Grid Trading EA Pro - Advanced forex robot with AI-powered risk management..." 
                        {...field} 
                        data-testid="textarea-meta-description"
                      />
                    </FormControl>
                    <FormDescription>
                      {field.value?.length || 0}/160 characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keywords</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="grid ea, forex robot, mt4 ea, automated trading" 
                        {...field} 
                        data-testid="input-keywords"
                      />
                    </FormControl>
                    <FormDescription>Comma-separated keywords</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation('/admin/signals')}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              data-testid="button-save-signal"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditMode ? 'Update Signal' : 'Create Signal'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </AdminLayout>
  );
}