import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Eye, Upload, X } from 'lucide-react';

interface PostEditorProps {
  initialData?: {
    title: string;
    content: string;
    category: string;
    tags: string[];
    excerpt: string;
  };
  onSave: (data: any) => void;
}

export default function PostEditor({ initialData, onSave }: PostEditorProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [category, setCategory] = useState(initialData?.category || 'uncategorized');
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState('');

  const categories = [
    'Expert Advisors',
    'Indicators',
    'Trading Strategies',
    'Market Analysis',
    'Tutorials',
    'News Trading',
  ];

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSave = (status: 'draft' | 'published') => {
    const data = {
      title,
      content,
      excerpt,
      category,
      tags,
      status,
    };
    onSave(data);
    console.log('Saving post:', data);
    //todo: remove mock functionality
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Editor */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Post Title</Label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter post title..."
                className="w-full px-4 py-2 border rounded-lg bg-background"
                data-testid="input-post-title"
              />
            </div>

            {/* Content Editor */}
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Tabs defaultValue="write" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="write">Write</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="write">
                  <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your post content in Markdown..."
                    className="w-full min-h-[400px] px-4 py-3 border rounded-lg bg-background font-mono text-sm"
                    data-testid="textarea-content"
                  />
                </TabsContent>
                <TabsContent value="preview">
                  <div className="min-h-[400px] px-4 py-3 border rounded-lg prose prose-sm max-w-none">
                    <p className="text-muted-foreground">
                      {content || 'Preview will appear here...'}
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief description of your post..."
                className="w-full px-4 py-2 border rounded-lg bg-background h-24"
                data-testid="textarea-excerpt"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Publish Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Publish Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={() => handleSave('draft')}
                variant="outline"
                className="flex-1"
                data-testid="button-save-draft"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button
                onClick={() => handleSave('published')}
                className="flex-1"
                data-testid="button-publish"
              >
                Publish
              </Button>
            </div>
            <Button
              variant="ghost"
              className="w-full"
              data-testid="button-preview"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          </CardContent>
        </Card>

        {/* Category */}
        <Card>
          <CardHeader>
            <CardTitle>Category</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background"
              data-testid="select-category"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="px-2 py-1">
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-destructive"
                    data-testid={`button-remove-tag-${tag}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Add tag and press Enter..."
              className="w-full px-3 py-2 border rounded-lg bg-background"
              data-testid="input-add-tag"
            />
          </CardContent>
        </Card>

        {/* Featured Image */}
        <Card>
          <CardHeader>
            <CardTitle>Featured Image</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" data-testid="button-upload-image">
              <Upload className="w-4 h-4 mr-2" />
              Upload Image
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}