import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateSitemap, generateSitemapIndex, generateNewsSitemap } from "./sitemap";
import { generateRobotsTxt, generateDynamicRobotsTxt } from "./robots";
import { generateRssFeed, generateDownloadsRssFeed, generateAtomFeed } from "./feed";
import { 
  insertPostSchema, 
  insertDownloadSchema, 
  insertCategorySchema, 
  insertTagSchema,
  insertCommentSchema, 
  insertNewsletterSchema, 
  insertAnalyticsSchema,
  insertReviewSchema,
  insertPageSchema,
  insertFaqSchema
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

// Helper function for admin authentication check (simplified for now)
const isAdmin = (req: Request): boolean => {
  // In production, this should check actual authentication/authorization
  // For now, we'll check for an admin header or session
  return req.headers['x-admin-key'] === 'admin' || req.query.admin === 'true';
};

// Helper function to parse pagination parameters
const parsePagination = (req: Request) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
  const sortBy = req.query.sortBy as string || 'createdAt';
  const sortOrder = (req.query.sortOrder as string || 'desc') as 'asc' | 'desc';
  return { page, limit, sortBy, sortOrder };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set CORS headers for all API routes
  app.use('/api', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-admin-key');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // SEO Routes - These should be at the root level, not under /api
  app.get("/robots.txt", generateDynamicRobotsTxt);
  app.get("/sitemap.xml", generateSitemap);
  app.get("/sitemap-index.xml", generateSitemapIndex);
  app.get("/sitemap-news.xml", generateNewsSitemap);
  app.get("/rss.xml", generateRssFeed);
  app.get("/feed.xml", generateRssFeed);
  app.get("/rss", generateRssFeed);
  app.get("/rss-downloads.xml", generateDownloadsRssFeed);
  app.get("/atom.xml", generateAtomFeed);
  app.get("/feed/atom", generateAtomFeed);

  // ==================== POSTS API ====================
  
  // GET /api/posts - Get all published posts with pagination
  app.get("/api/posts", async (req: Request, res: Response) => {
    try {
      const pagination = parsePagination(req);
      const { status, category, tag, author } = req.query;
      
      let result;
      if (status === 'all' && isAdmin(req)) {
        result = await storage.findAllPosts(pagination);
      } else {
        result = await storage.findPublishedPosts(pagination);
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  // GET /api/posts/search - Search posts by query
  app.get("/api/posts/search", async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ error: "Search query is required" });
      }
      
      const pagination = parsePagination(req);
      const allPosts = await storage.findPublishedPosts({ ...pagination, limit: 100 });
      
      // Simple search implementation - filter by title and content
      const searchTerm = q.toString().toLowerCase();
      const filtered = allPosts.data.filter(post => 
        post.title.toLowerCase().includes(searchTerm) ||
        post.content.toLowerCase().includes(searchTerm) ||
        (post.excerpt && post.excerpt.toLowerCase().includes(searchTerm))
      );
      
      // Track search analytics
      await storage.trackSearch(searchTerm, filtered.length);
      
      res.json({ 
        data: filtered.slice((pagination.page - 1) * pagination.limit, pagination.page * pagination.limit),
        total: filtered.length,
        page: pagination.page,
        totalPages: Math.ceil(filtered.length / pagination.limit),
        query: q 
      });
    } catch (error) {
      console.error("Error searching posts:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });

  // GET /api/posts/:slug - Get single post by slug
  app.get("/api/posts/:slug", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const post = await storage.findPostBySlug(slug);
      
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      // Increment view count
      await storage.incrementPostViews(post.id);
      
      // Get tags for the post
      const tags = await storage.getPostTags(post.id);
      
      res.json({ ...post, tags });
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ error: "Failed to fetch post" });
    }
  });

  // GET /api/posts/category/:categorySlug - Get posts by category
  app.get("/api/posts/category/:categorySlug", async (req: Request, res: Response) => {
    try {
      const { categorySlug } = req.params;
      const pagination = parsePagination(req);
      
      const category = await storage.findCategoryBySlug(categorySlug);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      const posts = await storage.getPostsByCategory(category.id, pagination);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts by category:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  // GET /api/posts/tag/:tagSlug - Get posts by tag
  app.get("/api/posts/tag/:tagSlug", async (req: Request, res: Response) => {
    try {
      const { tagSlug } = req.params;
      const pagination = parsePagination(req);
      
      const tag = await storage.findTagBySlug(tagSlug);
      if (!tag) {
        return res.status(404).json({ error: "Tag not found" });
      }
      
      // Get all posts and filter by tag (simplified implementation)
      const allPosts = await storage.findPublishedPosts({ ...pagination, limit: 1000 });
      const postsWithTag: any[] = [];
      
      for (const post of allPosts.data) {
        const tags = await storage.getPostTags(post.id);
        if (tags.some(t => t.id === tag.id)) {
          postsWithTag.push({ ...post, tags });
        }
      }
      
      res.json({
        data: postsWithTag.slice((pagination.page - 1) * pagination.limit, pagination.page * pagination.limit),
        total: postsWithTag.length,
        page: pagination.page,
        totalPages: Math.ceil(postsWithTag.length / pagination.limit)
      });
    } catch (error) {
      console.error("Error fetching posts by tag:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  // GET /api/posts/related/:id - Get related posts
  app.get("/api/posts/related/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const limit = Math.min(parseInt(req.query.limit as string) || 5, 10);
      
      const post = await storage.findPostById(id);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      // Get posts from same category
      const relatedPosts = post.categoryId 
        ? await storage.getPostsByCategory(post.categoryId, { page: 1, limit, sortBy: 'views', sortOrder: 'desc' })
        : await storage.findPublishedPosts({ page: 1, limit, sortBy: 'views', sortOrder: 'desc' });
      
      // Filter out the current post
      const filtered = relatedPosts.data.filter(p => p.id !== id);
      
      res.json(filtered.slice(0, limit));
    } catch (error) {
      console.error("Error fetching related posts:", error);
      res.status(500).json({ error: "Failed to fetch related posts" });
    }
  });

  // POST /api/posts - Create new post (admin only)
  app.post("/api/posts", async (req: Request, res: Response) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const validatedData = insertPostSchema.parse(req.body);
      const post = await storage.createPost(validatedData);
      
      // Add tags if provided
      if (req.body.tagIds && Array.isArray(req.body.tagIds)) {
        await storage.addTagsToPost(post.id, req.body.tagIds);
      }
      
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Error creating post:", error);
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  // PUT /api/posts/:id - Update post (admin only)
  app.put("/api/posts/:id", async (req: Request, res: Response) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { id } = req.params;
      const validatedData = insertPostSchema.partial().parse(req.body);
      const post = await storage.updatePost(id, validatedData);
      
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      res.json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Error updating post:", error);
      res.status(500).json({ error: "Failed to update post" });
    }
  });

  // DELETE /api/posts/:id - Delete post (admin only)
  app.delete("/api/posts/:id", async (req: Request, res: Response) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { id } = req.params;
      const success = await storage.deletePost(id);
      
      if (!success) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      res.json({ success: true, message: "Post deleted successfully" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  // POST /api/posts/:id/publish - Publish/unpublish post
  app.post("/api/posts/:id/publish", async (req: Request, res: Response) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { id } = req.params;
      const { published } = req.body;
      
      const post = await storage.updatePost(id, { 
        published: published !== false,
        publishedAt: published !== false ? new Date() : undefined,
        status: published !== false ? 'published' : 'draft'
      });
      
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      res.json(post);
    } catch (error) {
      console.error("Error publishing post:", error);
      res.status(500).json({ error: "Failed to publish post" });
    }
  });

  // ==================== DOWNLOADS API ====================
  
  // GET /api/downloads - Get all downloads with filtering
  app.get("/api/downloads", async (req: Request, res: Response) => {
    try {
      const pagination = parsePagination(req);
      const { platform, strategy, minRating, isPremium } = req.query;
      
      let downloads = await storage.findAllDownloads(pagination);
      
      // Apply filters
      if (platform) {
        downloads.data = downloads.data.filter(d => d.platform === platform || d.platform === 'Both');
      }
      if (strategy) {
        downloads.data = downloads.data.filter(d => d.strategy === strategy);
      }
      if (minRating) {
        downloads.data = downloads.data.filter(d => d.rating >= parseFloat(minRating as string));
      }
      if (isPremium !== undefined) {
        downloads.data = downloads.data.filter(d => d.isPremium === (isPremium === 'true'));
      }
      
      res.json(downloads);
    } catch (error) {
      console.error("Error fetching downloads:", error);
      res.status(500).json({ error: "Failed to fetch downloads" });
    }
  });

  // GET /api/downloads/featured - Get featured/popular downloads
  app.get("/api/downloads/featured", async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 6, 20);
      const featured = await storage.getFeaturedDownloads(limit);
      res.json(featured);
    } catch (error) {
      console.error("Error fetching featured downloads:", error);
      res.status(500).json({ error: "Failed to fetch featured downloads" });
    }
  });

  // GET /api/downloads/platform/:platform - Get downloads by platform
  app.get("/api/downloads/platform/:platform", async (req: Request, res: Response) => {
    try {
      const { platform } = req.params;
      const pagination = parsePagination(req);
      
      if (!['MT4', 'MT5', 'Both'].includes(platform)) {
        return res.status(400).json({ error: "Invalid platform. Must be MT4, MT5, or Both" });
      }
      
      const downloads = await storage.findDownloadsByPlatform(platform, pagination);
      res.json(downloads);
    } catch (error) {
      console.error("Error fetching downloads by platform:", error);
      res.status(500).json({ error: "Failed to fetch downloads" });
    }
  });

  // GET /api/downloads/strategy/:strategy - Get downloads by strategy
  app.get("/api/downloads/strategy/:strategy", async (req: Request, res: Response) => {
    try {
      const { strategy } = req.params;
      const pagination = parsePagination(req);
      const downloads = await storage.findDownloadsByStrategy(strategy, pagination);
      res.json(downloads);
    } catch (error) {
      console.error("Error fetching downloads by strategy:", error);
      res.status(500).json({ error: "Failed to fetch downloads" });
    }
  });

  // GET /api/downloads/:id - Get single download
  app.get("/api/downloads/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const download = await storage.findDownloadById(id);
      
      if (!download) {
        return res.status(404).json({ error: "Download not found" });
      }
      
      // Increment download view count (not actual download)
      await storage.trackPageView({
        eventType: 'pageView',
        pageUrl: `/downloads/${id}`,
        downloadId: id
      });
      
      res.json(download);
    } catch (error) {
      console.error("Error fetching download:", error);
      res.status(500).json({ error: "Failed to fetch download" });
    }
  });

  // POST /api/downloads - Create new download (admin only)
  app.post("/api/downloads", async (req: Request, res: Response) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const validatedData = insertDownloadSchema.parse(req.body);
      const download = await storage.createDownload(validatedData);
      res.status(201).json(download);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Error creating download:", error);
      res.status(500).json({ error: "Failed to create download" });
    }
  });

  // PUT /api/downloads/:id - Update download (admin only)
  app.put("/api/downloads/:id", async (req: Request, res: Response) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { id } = req.params;
      const validatedData = insertDownloadSchema.partial().parse(req.body);
      const download = await storage.updateDownload(id, validatedData);
      
      if (!download) {
        return res.status(404).json({ error: "Download not found" });
      }
      
      res.json(download);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Error updating download:", error);
      res.status(500).json({ error: "Failed to update download" });
    }
  });

  // DELETE /api/downloads/:id - Delete download (admin only)
  app.delete("/api/downloads/:id", async (req: Request, res: Response) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { id } = req.params;
      const success = await storage.deleteDownload(id);
      
      if (!success) {
        return res.status(404).json({ error: "Download not found" });
      }
      
      res.json({ success: true, message: "Download deleted successfully" });
    } catch (error) {
      console.error("Error deleting download:", error);
      res.status(500).json({ error: "Failed to delete download" });
    }
  });

  // POST /api/downloads/:id/download - Track download event
  app.post("/api/downloads/:id/download", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      
      const download = await storage.findDownloadById(id);
      if (!download) {
        return res.status(404).json({ error: "Download not found" });
      }
      
      // Increment download count
      await storage.incrementDownloadCount(id);
      
      // Track analytics
      await storage.trackDownload(id, userId);
      
      res.json({ success: true, fileUrl: download.fileUrl });
    } catch (error) {
      console.error("Error tracking download:", error);
      res.status(500).json({ error: "Failed to track download" });
    }
  });

  // POST /api/downloads/:id/review - Add review/rating
  app.post("/api/downloads/:id/review", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const reviewData = insertReviewSchema.parse({ ...req.body, downloadId: id });
      
      const review = await storage.createReview(reviewData);
      
      // Update download rating
      await storage.updateDownloadRating(id);
      
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Error creating review:", error);
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  // ==================== CATEGORIES API ====================
  
  // GET /api/categories - Get all categories with hierarchy
  app.get("/api/categories", async (req: Request, res: Response) => {
    try {
      const { tree } = req.query;
      const categories = tree === 'true' 
        ? await storage.getCategoryTree()
        : await storage.findAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // GET /api/categories/:slug - Get single category
  app.get("/api/categories/:slug", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const category = await storage.findCategoryBySlug(slug);
      
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ error: "Failed to fetch category" });
    }
  });

  // POST /api/categories - Create category (admin only)
  app.post("/api/categories", async (req: Request, res: Response) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Error creating category:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  // PUT /api/categories/:id - Update category (admin only)
  app.put("/api/categories/:id", async (req: Request, res: Response) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { id } = req.params;
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, validatedData);
      
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Error updating category:", error);
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  // DELETE /api/categories/:id - Delete category (admin only)
  app.delete("/api/categories/:id", async (req: Request, res: Response) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { id } = req.params;
      const success = await storage.deleteCategory(id);
      
      if (!success) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      res.json({ success: true, message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // ==================== TAGS API ====================
  
  // GET /api/tags - Get all tags
  app.get("/api/tags", async (req: Request, res: Response) => {
    try {
      const tags = await storage.findAllTags();
      res.json(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ error: "Failed to fetch tags" });
    }
  });

  // GET /api/tags/popular - Get popular tags by usage count
  app.get("/api/tags/popular", async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
      const tags = await storage.findPopularTags(limit);
      res.json(tags);
    } catch (error) {
      console.error("Error fetching popular tags:", error);
      res.status(500).json({ error: "Failed to fetch popular tags" });
    }
  });

  // POST /api/tags - Create tag (admin only)
  app.post("/api/tags", async (req: Request, res: Response) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const validatedData = insertTagSchema.parse(req.body);
      const tag = await storage.createTag(validatedData);
      res.status(201).json(tag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Error creating tag:", error);
      res.status(500).json({ error: "Failed to create tag" });
    }
  });

  // ==================== NEWSLETTER API ====================
  
  // POST /api/newsletter/subscribe - Subscribe to newsletter
  app.post("/api/newsletter/subscribe", async (req: Request, res: Response) => {
    try {
      const validatedData = insertNewsletterSchema.parse(req.body);
      const subscription = await storage.subscribeNewsletter(validatedData);
      res.status(201).json({ success: true, message: "Successfully subscribed to newsletter" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Error subscribing to newsletter:", error);
      res.status(500).json({ error: "Failed to subscribe" });
    }
  });

  // POST /api/newsletter/unsubscribe - Unsubscribe
  app.post("/api/newsletter/unsubscribe", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      const success = await storage.unsubscribeNewsletter(email);
      
      if (!success) {
        return res.status(404).json({ error: "Email not found in subscribers list" });
      }
      
      res.json({ success: true, message: "Successfully unsubscribed" });
    } catch (error) {
      console.error("Error unsubscribing from newsletter:", error);
      res.status(500).json({ error: "Failed to unsubscribe" });
    }
  });

  // GET /api/newsletter/subscribers - Get all subscribers (admin only)
  app.get("/api/newsletter/subscribers", async (req: Request, res: Response) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const activeOnly = req.query.active === 'true';
      const subscribers = await storage.findAllSubscribers(activeOnly);
      res.json(subscribers);
    } catch (error) {
      console.error("Error fetching subscribers:", error);
      res.status(500).json({ error: "Failed to fetch subscribers" });
    }
  });

  // ==================== COMMENTS API ====================
  
  // GET /api/comments/post/:postId - Get comments for a post
  app.get("/api/comments/post/:postId", async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;
      const onlyApproved = req.query.approved !== 'false';
      const comments = await storage.findCommentsByPost(postId, onlyApproved);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  // POST /api/comments - Add new comment
  app.post("/api/comments", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCommentSchema.parse(req.body);
      const comment = await storage.createComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Error creating comment:", error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  // PUT /api/comments/:id/approve - Approve comment (admin only)
  app.put("/api/comments/:id/approve", async (req: Request, res: Response) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { id } = req.params;
      const comment = await storage.approveComment(id);
      
      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }
      
      res.json(comment);
    } catch (error) {
      console.error("Error approving comment:", error);
      res.status(500).json({ error: "Failed to approve comment" });
    }
  });

  // DELETE /api/comments/:id - Delete comment (admin only)
  app.delete("/api/comments/:id", async (req: Request, res: Response) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { id } = req.params;
      const success = await storage.deleteComment(id);
      
      if (!success) {
        return res.status(404).json({ error: "Comment not found" });
      }
      
      res.json({ success: true, message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // ==================== ANALYTICS API ====================
  
  // POST /api/analytics/pageview - Track page view
  app.post("/api/analytics/pageview", async (req: Request, res: Response) => {
    try {
      const analyticsData = insertAnalyticsSchema.parse({
        ...req.body,
        eventType: 'pageView',
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        referrer: req.headers['referer']
      });
      
      const analytics = await storage.trackPageView(analyticsData);
      res.status(201).json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Error tracking page view:", error);
      res.status(500).json({ error: "Failed to track page view" });
    }
  });

  // POST /api/analytics/download - Track download
  app.post("/api/analytics/download", async (req: Request, res: Response) => {
    try {
      const { downloadId, userId, metadata } = req.body;
      
      if (!downloadId) {
        return res.status(400).json({ error: "Download ID is required" });
      }
      
      await storage.trackDownload(downloadId, userId, metadata);
      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Error tracking download:", error);
      res.status(500).json({ error: "Failed to track download" });
    }
  });

  // POST /api/analytics/search - Track search query
  app.post("/api/analytics/search", async (req: Request, res: Response) => {
    try {
      const { query, resultsCount, userId } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }
      
      await storage.trackSearch(query, resultsCount || 0, userId);
      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Error tracking search:", error);
      res.status(500).json({ error: "Failed to track search" });
    }
  });

  // GET /api/analytics/popular - Get popular content (admin only)
  app.get("/api/analytics/popular", async (req: Request, res: Response) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { type = 'pageView' } = req.query;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
      
      const popular = await storage.getPopularContent(type as string, limit);
      res.json(popular);
    } catch (error) {
      console.error("Error fetching popular content:", error);
      res.status(500).json({ error: "Failed to fetch popular content" });
    }
  });

  // ==================== SEARCH API ====================
  
  // GET /api/search - Global search across posts, downloads, pages
  app.get("/api/search", async (req: Request, res: Response) => {
    try {
      const { q, type = 'all' } = req.query;
      
      if (!q) {
        return res.status(400).json({ error: "Search query is required" });
      }
      
      const searchTerm = q.toString().toLowerCase();
      const results: any = { posts: [], downloads: [], pages: [], total: 0 };
      
      // Search posts
      if (type === 'all' || type === 'posts') {
        const posts = await storage.findPublishedPosts({ page: 1, limit: 100 });
        results.posts = posts.data.filter(p =>
          p.title.toLowerCase().includes(searchTerm) ||
          p.content.toLowerCase().includes(searchTerm)
        ).slice(0, 10);
      }
      
      // Search downloads
      if (type === 'all' || type === 'downloads') {
        const downloads = await storage.findAllDownloads({ page: 1, limit: 100 });
        results.downloads = downloads.data.filter(d =>
          d.name.toLowerCase().includes(searchTerm) ||
          d.description.toLowerCase().includes(searchTerm)
        ).slice(0, 10);
      }
      
      // Search pages
      if (type === 'all' || type === 'pages') {
        const pages = await storage.findAllPages();
        results.pages = pages.filter(p =>
          p.title.toLowerCase().includes(searchTerm) ||
          p.content.toLowerCase().includes(searchTerm)
        ).slice(0, 10);
      }
      
      results.total = results.posts.length + results.downloads.length + results.pages.length;
      
      // Track search
      await storage.trackSearch(searchTerm, results.total);
      
      res.json(results);
    } catch (error) {
      console.error("Error performing search:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });

  // GET /api/search/suggestions - Get search suggestions
  app.get("/api/search/suggestions", async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      
      if (!q) {
        return res.status(400).json({ error: "Search query is required" });
      }
      
      const searchTerm = q.toString().toLowerCase();
      const suggestions: string[] = [];
      
      // Get post titles as suggestions
      const posts = await storage.findPublishedPosts({ page: 1, limit: 50 });
      posts.data.forEach(p => {
        if (p.title.toLowerCase().includes(searchTerm)) {
          suggestions.push(p.title);
        }
      });
      
      // Get download names as suggestions
      const downloads = await storage.findAllDownloads({ page: 1, limit: 50 });
      downloads.data.forEach(d => {
        if (d.name.toLowerCase().includes(searchTerm)) {
          suggestions.push(d.name);
        }
      });
      
      // Get popular tags as suggestions
      const tags = await storage.findPopularTags(20);
      tags.forEach(t => {
        if (t.name.toLowerCase().includes(searchTerm)) {
          suggestions.push(t.name);
        }
      });
      
      // Return unique suggestions
      const uniqueSuggestions = Array.from(new Set(suggestions)).slice(0, 10);
      res.json(uniqueSuggestions);
    } catch (error) {
      console.error("Error fetching search suggestions:", error);
      res.status(500).json({ error: "Failed to fetch suggestions" });
    }
  });

  // ==================== PAGES API ====================
  
  // GET /api/pages/:slug - Get static page content
  app.get("/api/pages/:slug", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const page = await storage.findPageBySlug(slug);
      
      if (!page) {
        return res.status(404).json({ error: "Page not found" });
      }
      
      res.json(page);
    } catch (error) {
      console.error("Error fetching page:", error);
      res.status(500).json({ error: "Failed to fetch page" });
    }
  });

  // PUT /api/pages/:slug - Update page (admin only)
  app.put("/api/pages/:slug", async (req: Request, res: Response) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { slug } = req.params;
      const existingPage = await storage.findPageBySlug(slug);
      
      if (!existingPage) {
        // Create new page if it doesn't exist
        const validatedData = insertPageSchema.parse({ ...req.body, slug });
        const page = await storage.createPage(validatedData);
        return res.status(201).json(page);
      }
      
      // Update existing page
      const validatedData = insertPageSchema.partial().parse(req.body);
      const page = await storage.updatePage(existingPage.id, validatedData);
      res.json(page);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Error updating page:", error);
      res.status(500).json({ error: "Failed to update page" });
    }
  });

  // ==================== FAQs API ====================
  
  // GET /api/faqs - Get all FAQs
  app.get("/api/faqs", async (req: Request, res: Response) => {
    try {
      const faqs = await storage.getActiveFaqs();
      res.json(faqs);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      res.status(500).json({ error: "Failed to fetch FAQs" });
    }
  });

  // GET /api/faqs/category/:category - Get FAQs by category
  app.get("/api/faqs/category/:category", async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const faqs = await storage.getActiveFaqs();
      const filtered = faqs.filter(f => f.category === category);
      res.json(filtered);
    } catch (error) {
      console.error("Error fetching FAQs by category:", error);
      res.status(500).json({ error: "Failed to fetch FAQs" });
    }
  });

  // ==================== REVIEWS API ====================
  
  // GET /api/reviews/download/:downloadId - Get reviews for a download
  app.get("/api/reviews/download/:downloadId", async (req: Request, res: Response) => {
    try {
      const { downloadId } = req.params;
      const reviews = await storage.getReviewsByDownload(downloadId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  // POST /api/reviews - Add new review
  app.post("/api/reviews", async (req: Request, res: Response) => {
    try {
      const validatedData = insertReviewSchema.parse(req.body);
      const review = await storage.createReview(validatedData);
      
      // Update download rating if it's for a download
      if (review.downloadId) {
        await storage.updateDownloadRating(review.downloadId);
      }
      
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Error creating review:", error);
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}