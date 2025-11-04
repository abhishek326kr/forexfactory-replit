import {
  type User, type InsertUser,
  type Post, type InsertPost,
  type Download, type InsertDownload,
  type Category, type InsertCategory,
  type Tag, type InsertTag,
  type Comment, type InsertComment,
  type Analytics, type InsertAnalytics,
  type Newsletter, type InsertNewsletter,
  type Page, type InsertPage,
  type Review, type InsertReview,
  type Faq, type InsertFaq
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

// Pagination interface
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

// Main storage interface with all CRUD operations
export interface IStorage {
  // Users
  createUser(user: InsertUser): Promise<User>;
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  authenticate(username: string, password: string): Promise<User | undefined>;
  updateUserProfile(id: string, data: Partial<User>): Promise<User | undefined>;
  getAllUsers(options?: PaginationOptions): Promise<PaginatedResult<User>>;

  // Posts
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: string, post: Partial<InsertPost>): Promise<Post | undefined>;
  deletePost(id: string): Promise<boolean>;
  findPostById(id: string): Promise<Post | undefined>;
  findPostBySlug(slug: string): Promise<Post | undefined>;
  findAllPosts(options?: PaginationOptions): Promise<PaginatedResult<Post>>;
  findPublishedPosts(options?: PaginationOptions): Promise<PaginatedResult<Post>>;
  incrementPostViews(id: string): Promise<void>;
  getPostsByCategory(categoryId: string, options?: PaginationOptions): Promise<PaginatedResult<Post>>;
  getPostsByAuthor(authorId: string, options?: PaginationOptions): Promise<PaginatedResult<Post>>;

  // Downloads
  createDownload(download: InsertDownload): Promise<Download>;
  updateDownload(id: string, download: Partial<InsertDownload>): Promise<Download | undefined>;
  deleteDownload(id: string): Promise<boolean>;
  findDownloadById(id: string): Promise<Download | undefined>;
  findDownloadBySlug(slug: string): Promise<Download | undefined>;
  findAllDownloads(options?: PaginationOptions): Promise<PaginatedResult<Download>>;
  incrementDownloadCount(id: string): Promise<void>;
  findDownloadsByStrategy(strategy: string, options?: PaginationOptions): Promise<PaginatedResult<Download>>;
  findDownloadsByPlatform(platform: string, options?: PaginationOptions): Promise<PaginatedResult<Download>>;
  getFeaturedDownloads(limit?: number): Promise<Download[]>;

  // Categories
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;
  findAllCategories(): Promise<Category[]>;
  findCategoryBySlug(slug: string): Promise<Category | undefined>;
  findCategoryById(id: string): Promise<Category | undefined>;
  getCategoryTree(): Promise<Category[]>;

  // Tags
  createTag(tag: InsertTag): Promise<Tag>;
  findOrCreateTag(name: string): Promise<Tag>;
  findPopularTags(limit?: number): Promise<Tag[]>;
  incrementTagCount(id: string): Promise<void>;
  findAllTags(): Promise<Tag[]>;
  findTagBySlug(slug: string): Promise<Tag | undefined>;
  addTagsToPost(postId: string, tagIds: string[]): Promise<void>;
  getPostTags(postId: string): Promise<Tag[]>;

  // Comments
  createComment(comment: InsertComment): Promise<Comment>;
  approveComment(id: string): Promise<Comment | undefined>;
  deleteComment(id: string): Promise<boolean>;
  findCommentsByPost(postId: string, onlyApproved?: boolean): Promise<Comment[]>;
  findPendingComments(): Promise<Comment[]>;
  getCommentCount(postId: string): Promise<number>;

  // Analytics
  trackPageView(analytics: InsertAnalytics): Promise<Analytics>;
  trackDownload(downloadId: string, userId?: string, metadata?: any): Promise<Analytics>;
  trackSearch(query: string, resultsCount: number, userId?: string): Promise<Analytics>;
  getPopularContent(eventType: string, limit?: number): Promise<any[]>;
  getAnalyticsByDateRange(startDate: Date, endDate: Date): Promise<Analytics[]>;

  // Newsletter
  subscribeNewsletter(newsletter: InsertNewsletter): Promise<Newsletter>;
  unsubscribeNewsletter(email: string): Promise<boolean>;
  findAllSubscribers(activeOnly?: boolean): Promise<Newsletter[]>;
  findSubscriberByEmail(email: string): Promise<Newsletter | undefined>;
  updateSubscriberPreferences(email: string, preferences: any): Promise<Newsletter | undefined>;

  // Pages
  createPage(page: InsertPage): Promise<Page>;
  updatePage(id: string, page: Partial<InsertPage>): Promise<Page | undefined>;
  deletePage(id: string): Promise<boolean>;
  findPageBySlug(slug: string): Promise<Page | undefined>;
  findAllPages(): Promise<Page[]>;

  // Reviews
  createReview(review: InsertReview): Promise<Review>;
  getReviewsByDownload(downloadId: string): Promise<Review[]>;
  updateDownloadRating(downloadId: string): Promise<void>;

  // FAQs
  createFaq(faq: InsertFaq): Promise<Faq>;
  updateFaq(id: string, faq: Partial<InsertFaq>): Promise<Faq | undefined>;
  deleteFaq(id: string): Promise<boolean>;
  getActiveFaqs(): Promise<Faq[]>;

  // Initialization
  initialize(): Promise<void>;
}

// Helper functions for password hashing using bcrypt
const SALT_ROUNDS = 10;

const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private posts: Map<string, Post> = new Map();
  private downloads: Map<string, Download> = new Map();
  private categories: Map<string, Category> = new Map();
  private tags: Map<string, Tag> = new Map();
  private comments: Map<string, Comment> = new Map();
  private analytics: Map<string, Analytics> = new Map();
  private newsletter: Map<string, Newsletter> = new Map();
  private pages: Map<string, Page> = new Map();
  private reviews: Map<string, Review> = new Map();
  private faqs: Map<string, Faq> = new Map();
  private postTags: Map<string, Set<string>> = new Map(); // postId -> tagIds

  constructor() {
    // Initialize collections
  }

  // User methods
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = await hashPassword(insertUser.password);
    const user: User = { 
      id,
      email: insertUser.email,
      username: insertUser.username,
      password: hashedPassword,
      role: insertUser.role || 'user',
      avatar: insertUser.avatar || null,
      bio: insertUser.bio || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async authenticate(username: string, password: string): Promise<User | undefined> {
    const user = await this.getUserByUsername(username);
    if (!user) return undefined;
    const valid = await comparePassword(password, user.password);
    return valid ? user : undefined;
  }

  async updateUserProfile(id: string, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...data, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  async getAllUsers(options: PaginationOptions = {}): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 10 } = options;
    const users = Array.from(this.users.values());
    const total = users.length;
    const start = (page - 1) * limit;
    const data = users.slice(start, start + limit);
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Post methods
  async createPost(insertPost: InsertPost): Promise<Post> {
    const id = randomUUID();
    const post: Post = {
      id,
      ...insertPost,
      views: 0,
      published: insertPost.published || false,
      status: insertPost.status || 'draft',
      schemaType: insertPost.schemaType || 'Article',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.posts.set(id, post);
    return post;
  }

  async updatePost(id: string, data: Partial<InsertPost>): Promise<Post | undefined> {
    const post = this.posts.get(id);
    if (!post) return undefined;
    const updated = { ...post, ...data, updatedAt: new Date() };
    this.posts.set(id, updated);
    return updated;
  }

  async deletePost(id: string): Promise<boolean> {
    return this.posts.delete(id);
  }

  async findPostById(id: string): Promise<Post | undefined> {
    return this.posts.get(id);
  }

  async findPostBySlug(slug: string): Promise<Post | undefined> {
    return Array.from(this.posts.values()).find(p => p.slug === slug);
  }

  async findAllPosts(options: PaginationOptions = {}): Promise<PaginatedResult<Post>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    let posts = Array.from(this.posts.values());
    
    // Sort posts
    posts.sort((a, b) => {
      const aVal = a[sortBy as keyof Post];
      const bVal = b[sortBy as keyof Post];
      const order = sortOrder === 'asc' ? 1 : -1;
      return (aVal! > bVal! ? 1 : -1) * order;
    });

    const total = posts.length;
    const start = (page - 1) * limit;
    const data = posts.slice(start, start + limit);
    
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findPublishedPosts(options: PaginationOptions = {}): Promise<PaginatedResult<Post>> {
    const { page = 1, limit = 10, sortBy = 'publishedAt', sortOrder = 'desc' } = options;
    let posts = Array.from(this.posts.values()).filter(p => p.published && p.status === 'published');
    
    // Sort posts
    posts.sort((a, b) => {
      const aVal = a[sortBy as keyof Post];
      const bVal = b[sortBy as keyof Post];
      const order = sortOrder === 'asc' ? 1 : -1;
      return (aVal! > bVal! ? 1 : -1) * order;
    });

    const total = posts.length;
    const start = (page - 1) * limit;
    const data = posts.slice(start, start + limit);
    
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async incrementPostViews(id: string): Promise<void> {
    const post = this.posts.get(id);
    if (post) {
      post.views = (post.views || 0) + 1;
      this.posts.set(id, post);
    }
  }

  async getPostsByCategory(categoryId: string, options: PaginationOptions = {}): Promise<PaginatedResult<Post>> {
    const { page = 1, limit = 10 } = options;
    const posts = Array.from(this.posts.values()).filter(p => p.categoryId === categoryId);
    const total = posts.length;
    const start = (page - 1) * limit;
    const data = posts.slice(start, start + limit);
    
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getPostsByAuthor(authorId: string, options: PaginationOptions = {}): Promise<PaginatedResult<Post>> {
    const { page = 1, limit = 10 } = options;
    const posts = Array.from(this.posts.values()).filter(p => p.authorId === authorId);
    const total = posts.length;
    const start = (page - 1) * limit;
    const data = posts.slice(start, start + limit);
    
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Download methods
  async createDownload(insertDownload: InsertDownload): Promise<Download> {
    const id = randomUUID();
    const download: Download = {
      id,
      ...insertDownload,
      downloadCount: 0,
      rating: 0,
      isPremium: insertDownload.isPremium || false,
      status: insertDownload.status || 'active',
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.downloads.set(id, download);
    return download;
  }

  async updateDownload(id: string, data: Partial<InsertDownload>): Promise<Download | undefined> {
    const download = this.downloads.get(id);
    if (!download) return undefined;
    const updated = { ...download, ...data, updatedAt: new Date() };
    this.downloads.set(id, updated);
    return updated;
  }

  async deleteDownload(id: string): Promise<boolean> {
    return this.downloads.delete(id);
  }

  async findDownloadById(id: string): Promise<Download | undefined> {
    return this.downloads.get(id);
  }

  async findDownloadBySlug(slug: string): Promise<Download | undefined> {
    return Array.from(this.downloads.values()).find(d => d.slug === slug);
  }

  async findAllDownloads(options: PaginationOptions = {}): Promise<PaginatedResult<Download>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    let downloads = Array.from(this.downloads.values());
    
    // Sort downloads
    downloads.sort((a, b) => {
      const aVal = a[sortBy as keyof Download];
      const bVal = b[sortBy as keyof Download];
      const order = sortOrder === 'asc' ? 1 : -1;
      return (aVal! > bVal! ? 1 : -1) * order;
    });

    const total = downloads.length;
    const start = (page - 1) * limit;
    const data = downloads.slice(start, start + limit);
    
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async incrementDownloadCount(id: string): Promise<void> {
    const download = this.downloads.get(id);
    if (download) {
      download.downloadCount = (download.downloadCount || 0) + 1;
      this.downloads.set(id, download);
    }
  }

  async findDownloadsByStrategy(strategy: string, options: PaginationOptions = {}): Promise<PaginatedResult<Download>> {
    const { page = 1, limit = 10 } = options;
    const downloads = Array.from(this.downloads.values()).filter(d => d.strategy === strategy);
    const total = downloads.length;
    const start = (page - 1) * limit;
    const data = downloads.slice(start, start + limit);
    
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findDownloadsByPlatform(platform: string, options: PaginationOptions = {}): Promise<PaginatedResult<Download>> {
    const { page = 1, limit = 10 } = options;
    const downloads = Array.from(this.downloads.values()).filter(d => d.platform === platform);
    const total = downloads.length;
    const start = (page - 1) * limit;
    const data = downloads.slice(start, start + limit);
    
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getFeaturedDownloads(limit: number = 6): Promise<Download[]> {
    return Array.from(this.downloads.values())
      .sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0))
      .slice(0, limit);
  }

  // Category methods
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = {
      id,
      ...insertCategory,
      order: insertCategory.order || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: string, data: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    const updated = { ...category, ...data, updatedAt: new Date() };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    return this.categories.delete(id);
  }

  async findAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values()).sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  async findCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(c => c.slug === slug);
  }

  async findCategoryById(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async getCategoryTree(): Promise<Category[]> {
    const categories = Array.from(this.categories.values());
    const rootCategories = categories.filter(c => !c.parentId);
    
    const buildTree = (parentId: string | null): Category[] => {
      return categories
        .filter(c => c.parentId === parentId)
        .map(c => ({ ...c, children: buildTree(c.id) } as any));
    };

    return rootCategories.map(c => ({ ...c, children: buildTree(c.id) } as any));
  }

  // Tag methods
  async createTag(insertTag: InsertTag): Promise<Tag> {
    const id = randomUUID();
    const slug = insertTag.slug || insertTag.name.toLowerCase().replace(/\s+/g, '-');
    const tag: Tag = {
      id,
      ...insertTag,
      slug,
      count: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.tags.set(id, tag);
    return tag;
  }

  async findOrCreateTag(name: string): Promise<Tag> {
    const existing = Array.from(this.tags.values()).find(t => t.name === name);
    if (existing) return existing;
    
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    return this.createTag({ name, slug, description: null });
  }

  async findPopularTags(limit: number = 10): Promise<Tag[]> {
    return Array.from(this.tags.values())
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, limit);
  }

  async incrementTagCount(id: string): Promise<void> {
    const tag = this.tags.get(id);
    if (tag) {
      tag.count = (tag.count || 0) + 1;
      this.tags.set(id, tag);
    }
  }

  async findAllTags(): Promise<Tag[]> {
    return Array.from(this.tags.values());
  }

  async findTagBySlug(slug: string): Promise<Tag | undefined> {
    return Array.from(this.tags.values()).find(t => t.slug === slug);
  }

  async addTagsToPost(postId: string, tagIds: string[]): Promise<void> {
    this.postTags.set(postId, new Set(tagIds));
    // Increment tag counts
    for (const tagId of tagIds) {
      await this.incrementTagCount(tagId);
    }
  }

  async getPostTags(postId: string): Promise<Tag[]> {
    const tagIds = this.postTags.get(postId);
    if (!tagIds) return [];
    return Array.from(tagIds).map(id => this.tags.get(id)).filter(Boolean) as Tag[];
  }

  // Comment methods
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = randomUUID();
    const comment: Comment = {
      id,
      ...insertComment,
      approved: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.comments.set(id, comment);
    return comment;
  }

  async approveComment(id: string): Promise<Comment | undefined> {
    const comment = this.comments.get(id);
    if (!comment) return undefined;
    comment.approved = true;
    comment.updatedAt = new Date();
    this.comments.set(id, comment);
    return comment;
  }

  async deleteComment(id: string): Promise<boolean> {
    return this.comments.delete(id);
  }

  async findCommentsByPost(postId: string, onlyApproved: boolean = true): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(c => c.postId === postId && (!onlyApproved || c.approved))
      .sort((a, b) => (a.createdAt! > b.createdAt! ? -1 : 1));
  }

  async findPendingComments(): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(c => !c.approved)
      .sort((a, b) => (a.createdAt! > b.createdAt! ? -1 : 1));
  }

  async getCommentCount(postId: string): Promise<number> {
    return Array.from(this.comments.values())
      .filter(c => c.postId === postId && c.approved).length;
  }

  // Analytics methods
  async trackPageView(analytics: InsertAnalytics): Promise<Analytics> {
    const id = randomUUID();
    const record: Analytics = {
      id,
      ...analytics,
      createdAt: new Date()
    };
    this.analytics.set(id, record);
    return record;
  }

  async trackDownload(downloadId: string, userId?: string, metadata?: any): Promise<Analytics> {
    return this.trackPageView({
      eventType: 'downloadEvent',
      downloadId,
      userId,
      metadata,
      pageUrl: null,
      referrer: null,
      userAgent: null,
      ipAddress: null,
      sessionId: null,
      postId: null,
      searchQuery: null,
      searchResultsCount: null
    });
  }

  async trackSearch(query: string, resultsCount: number, userId?: string): Promise<Analytics> {
    return this.trackPageView({
      eventType: 'searchQuery',
      searchQuery: query,
      searchResultsCount: resultsCount,
      userId,
      pageUrl: null,
      referrer: null,
      userAgent: null,
      ipAddress: null,
      sessionId: null,
      downloadId: null,
      postId: null,
      metadata: null
    });
  }

  async getPopularContent(eventType: string, limit: number = 10): Promise<any[]> {
    const events = Array.from(this.analytics.values())
      .filter(a => a.eventType === eventType);
    
    // Group by content ID (postId or downloadId)
    const counts = new Map<string, number>();
    events.forEach(e => {
      const contentId = e.postId || e.downloadId;
      if (contentId) {
        counts.set(contentId, (counts.get(contentId) || 0) + 1);
      }
    });

    // Sort by count and return top items
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id, count]) => ({ id, count }));
  }

  async getAnalyticsByDateRange(startDate: Date, endDate: Date): Promise<Analytics[]> {
    return Array.from(this.analytics.values())
      .filter(a => a.createdAt! >= startDate && a.createdAt! <= endDate)
      .sort((a, b) => (a.createdAt! > b.createdAt! ? -1 : 1));
  }

  // Newsletter methods
  async subscribeNewsletter(insertNewsletter: InsertNewsletter): Promise<Newsletter> {
    const existing = await this.findSubscriberByEmail(insertNewsletter.email);
    if (existing && existing.isActive) {
      throw new Error('Email already subscribed');
    }
    
    const id = existing?.id || randomUUID();
    const newsletter: Newsletter = {
      id,
      ...insertNewsletter,
      isActive: true,
      confirmationToken: randomUUID(),
      confirmedAt: null,
      subscribedAt: new Date(),
      unsubscribedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.newsletter.set(id, newsletter);
    return newsletter;
  }

  async unsubscribeNewsletter(email: string): Promise<boolean> {
    const subscriber = await this.findSubscriberByEmail(email);
    if (!subscriber) return false;
    
    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    subscriber.updatedAt = new Date();
    this.newsletter.set(subscriber.id, subscriber);
    return true;
  }

  async findAllSubscribers(activeOnly: boolean = false): Promise<Newsletter[]> {
    return Array.from(this.newsletter.values())
      .filter(n => !activeOnly || n.isActive);
  }

  async findSubscriberByEmail(email: string): Promise<Newsletter | undefined> {
    return Array.from(this.newsletter.values()).find(n => n.email === email);
  }

  async updateSubscriberPreferences(email: string, preferences: any): Promise<Newsletter | undefined> {
    const subscriber = await this.findSubscriberByEmail(email);
    if (!subscriber) return undefined;
    
    subscriber.preferences = preferences;
    subscriber.updatedAt = new Date();
    this.newsletter.set(subscriber.id, subscriber);
    return subscriber;
  }

  // Page methods
  async createPage(insertPage: InsertPage): Promise<Page> {
    const id = randomUUID();
    const page: Page = {
      id,
      ...insertPage,
      template: insertPage.template || 'default',
      status: insertPage.status || 'published',
      priority: insertPage.priority || 0.5,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.pages.set(id, page);
    return page;
  }

  async updatePage(id: string, data: Partial<InsertPage>): Promise<Page | undefined> {
    const page = this.pages.get(id);
    if (!page) return undefined;
    const updated = { ...page, ...data, updatedAt: new Date() };
    this.pages.set(id, updated);
    return updated;
  }

  async deletePage(id: string): Promise<boolean> {
    return this.pages.delete(id);
  }

  async findPageBySlug(slug: string): Promise<Page | undefined> {
    return Array.from(this.pages.values()).find(p => p.slug === slug);
  }

  async findAllPages(): Promise<Page[]> {
    return Array.from(this.pages.values());
  }

  // Review methods
  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = randomUUID();
    const review: Review = {
      id,
      ...insertReview,
      helpful: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.reviews.set(id, review);
    
    // Update download rating
    if (insertReview.downloadId) {
      await this.updateDownloadRating(insertReview.downloadId);
    }
    
    return review;
  }

  async getReviewsByDownload(downloadId: string): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(r => r.downloadId === downloadId)
      .sort((a, b) => (a.createdAt! > b.createdAt! ? -1 : 1));
  }

  async updateDownloadRating(downloadId: string): Promise<void> {
    const reviews = await this.getReviewsByDownload(downloadId);
    if (reviews.length === 0) return;
    
    const avgRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
    const download = this.downloads.get(downloadId);
    if (download) {
      download.rating = avgRating;
      this.downloads.set(downloadId, download);
    }
  }

  // FAQ methods
  async createFaq(insertFaq: InsertFaq): Promise<Faq> {
    const id = randomUUID();
    const faq: Faq = {
      id,
      ...insertFaq,
      order: insertFaq.order || 0,
      isActive: insertFaq.isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.faqs.set(id, faq);
    return faq;
  }

  async updateFaq(id: string, data: Partial<InsertFaq>): Promise<Faq | undefined> {
    const faq = this.faqs.get(id);
    if (!faq) return undefined;
    const updated = { ...faq, ...data, updatedAt: new Date() };
    this.faqs.set(id, updated);
    return updated;
  }

  async deleteFaq(id: string): Promise<boolean> {
    return this.faqs.delete(id);
  }

  async getActiveFaqs(): Promise<Faq[]> {
    return Array.from(this.faqs.values())
      .filter(f => f.isActive)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  // Initialize database with sample data
  async initialize(): Promise<void> {
    // Create default admin user
    const adminUser = await this.createUser({
      email: 'admin@forexfactory.cc',
      username: 'admin',
      password: 'admin123456',
      role: 'admin',
      bio: 'System Administrator'
    });

    // Create default categories
    const categories = [
      { name: 'Expert Advisors', slug: 'expert-advisors', description: 'Automated trading robots for MT4/MT5', order: 1 },
      { name: 'Indicators', slug: 'indicators', description: 'Technical indicators and analysis tools', order: 2 },
      { name: 'Trading Strategies', slug: 'trading-strategies', description: 'Proven trading strategies and systems', order: 3 },
      { name: 'Market Analysis', slug: 'market-analysis', description: 'Forex market analysis and insights', order: 4 },
      { name: 'Education', slug: 'education', description: 'Trading education and tutorials', order: 5 }
    ];

    for (const cat of categories) {
      await this.createCategory({
        ...cat,
        metaTitle: `${cat.name} - ForexFactory.cc`,
        metaDescription: `Browse our collection of ${cat.name.toLowerCase()}. ${cat.description}`,
        seoKeywords: `forex, trading, ${cat.slug.replace('-', ' ')}, mt4, mt5`,
        parentId: null,
        canonicalUrl: null
      });
    }

    // Create default tags
    const tags = [
      'scalping', 'trend-following', 'grid-trading', 'hedging', 'news-trading',
      'mt4', 'mt5', 'free', 'premium', 'beginner-friendly',
      'advanced', 'backtested', 'profitable', 'low-risk', 'high-frequency'
    ];

    for (const tagName of tags) {
      await this.findOrCreateTag(tagName);
    }

    // Get category IDs for sample content
    const eaCategory = await this.findCategoryBySlug('expert-advisors');
    const indicatorCategory = await this.findCategoryBySlug('indicators');
    const strategyCategory = await this.findCategoryBySlug('trading-strategies');

    // Create sample downloads
    const sampleDownloads = [
      {
        name: 'Trend Master EA',
        slug: 'trend-master-ea',
        description: 'Advanced trend-following expert advisor with dynamic stop loss and take profit management.',
        version: '2.5.0',
        fileUrl: '/downloads/trend-master-ea-v2.5.0.ex4',
        fileSize: '256 KB',
        platform: 'MT4' as const,
        strategy: 'Trend Following',
        compatibility: 'MT4 Build 1090+',
        categoryId: eaCategory?.id || null,
        features: ['Auto lot sizing', 'News filter', 'Trailing stop', 'Multi-timeframe analysis'],
        requirements: 'Minimum balance: $500, Recommended leverage: 1:100',
        metaTitle: 'Trend Master EA - Professional Trend Following Robot',
        metaDescription: 'Download Trend Master EA v2.5.0 - Advanced trend-following expert advisor for MT4 with proven profitability.',
        seoKeywords: 'trend ea, forex robot, mt4 ea, trend following, automated trading',
        winRate: 68.5,
        profitFactor: 1.85,
        maxDrawdown: 12.3,
        canonicalUrl: null,
        ogImage: null,
        screenshots: null,
        structuredData: null,
        status: 'active',
        isPremium: false
      },
      {
        name: 'Scalper Pro EA',
        slug: 'scalper-pro-ea',
        description: 'High-frequency scalping robot designed for low spread pairs during Asian session.',
        version: '1.3.2',
        fileUrl: '/downloads/scalper-pro-ea-v1.3.2.ex5',
        fileSize: '312 KB',
        platform: 'MT5' as const,
        strategy: 'Scalping',
        compatibility: 'MT5 Build 2560+',
        categoryId: eaCategory?.id || null,
        features: ['1-5 minute trades', 'Spread filter', 'Time filter', 'Risk management'],
        requirements: 'ECN broker recommended, Minimum balance: $1000',
        metaTitle: 'Scalper Pro EA - High-Frequency Trading Robot for MT5',
        metaDescription: 'Professional scalping EA for MT5. Fast execution, low drawdown, consistent profits.',
        seoKeywords: 'scalping ea, mt5 robot, high frequency trading, asian session ea',
        winRate: 82.3,
        profitFactor: 1.42,
        maxDrawdown: 8.7,
        canonicalUrl: null,
        ogImage: null,
        screenshots: null,
        structuredData: null,
        status: 'active',
        isPremium: false
      },
      {
        name: 'Support Resistance Indicator',
        slug: 'support-resistance-indicator',
        description: 'Automatically identifies and draws support and resistance levels on any timeframe.',
        version: '3.0.1',
        fileUrl: '/downloads/support-resistance-v3.0.1.ex4',
        fileSize: '128 KB',
        platform: 'Both' as const,
        categoryId: indicatorCategory?.id || null,
        features: ['Auto level detection', 'Multi-timeframe', 'Alert system', 'Customizable colors'],
        metaTitle: 'Support Resistance Indicator - Auto Level Detection for MT4/MT5',
        metaDescription: 'Professional support and resistance indicator with automatic level detection and alerts.',
        seoKeywords: 'support resistance, forex indicator, mt4 indicator, technical analysis',
        strategy: null,
        compatibility: null,
        requirements: null,
        winRate: null,
        profitFactor: null,
        maxDrawdown: null,
        canonicalUrl: null,
        ogImage: null,
        screenshots: null,
        structuredData: null,
        status: 'active',
        isPremium: false
      }
    ];

    for (const download of sampleDownloads) {
      await this.createDownload(download);
    }

    // Create sample blog posts
    const samplePosts = [
      {
        title: 'Complete Guide to Forex Expert Advisors in 2025',
        slug: 'complete-guide-forex-expert-advisors-2025',
        content: `# Complete Guide to Forex Expert Advisors in 2025

Forex Expert Advisors (EAs) have revolutionized the way traders approach the forex market. In this comprehensive guide, we'll explore everything you need to know about using EAs effectively in 2025.

## What are Expert Advisors?

Expert Advisors are automated trading programs that execute trades on your behalf based on pre-programmed strategies...

## Benefits of Using EAs

1. **24/7 Trading**: EAs can monitor markets and execute trades round the clock
2. **Emotion-free Trading**: Removes psychological factors from trading decisions
3. **Backtesting Capabilities**: Test strategies on historical data before risking real money

## Choosing the Right EA

When selecting an EA, consider:
- Trading strategy alignment
- Risk management features
- Broker compatibility
- Historical performance metrics

## Best Practices for EA Trading

- Always test on demo accounts first
- Use appropriate risk management
- Monitor performance regularly
- Keep your EA updated`,
        excerpt: 'Discover everything you need to know about Forex Expert Advisors in 2025, from selection to optimization.',
        categoryId: strategyCategory?.id || null,
        authorId: adminUser.id,
        status: 'published',
        published: true,
        publishedAt: new Date(),
        readingTime: 8,
        metaTitle: 'Complete Guide to Forex Expert Advisors in 2025 | ForexFactory.cc',
        metaDescription: 'Learn how to use Forex Expert Advisors effectively in 2025. Comprehensive guide covering selection, setup, optimization, and risk management.',
        seoKeywords: 'forex expert advisors, ea trading, automated forex trading, forex robots 2025',
        featuredImage: '/images/blog/ea-guide-2025.jpg',
        canonicalUrl: null,
        ogImage: null,
        schemaType: 'Article',
        structuredData: null,
        views: 0
      }
    ];

    for (const post of samplePosts) {
      const createdPost = await this.createPost(post);
      
      // Add some tags to posts
      const postTags = await Promise.all([
        this.findOrCreateTag('mt4'),
        this.findOrCreateTag('scalping'),
        this.findOrCreateTag('backtested')
      ]);
      
      await this.addTagsToPost(createdPost.id, postTags.map(t => t.id));
    }

    // Create sample pages
    const samplePages = [
      {
        title: 'About ForexFactory.cc',
        slug: 'about',
        content: `# About ForexFactory.cc

Welcome to ForexFactory.cc, your premier destination for professional forex trading tools and resources.

## Our Mission

We provide traders with high-quality Expert Advisors, indicators, and educational content to help them succeed in the forex market.

## What We Offer

- Thoroughly tested Expert Advisors
- Custom indicators for MT4/MT5
- Educational content and tutorials
- Trading strategies and market analysis

## Why Choose Us?

- All EAs are backtested and forward tested
- Regular updates and improvements
- Dedicated customer support
- Active trading community`,
        metaTitle: 'About ForexFactory.cc - Professional Forex Trading Tools',
        metaDescription: 'Learn about ForexFactory.cc, your trusted source for forex Expert Advisors, indicators, and trading education.',
        seoKeywords: 'about forexfactory, forex tools, trading resources',
        canonicalUrl: null,
        ogImage: null,
        robots: null,
        priority: null,
        structuredData: null,
        template: 'default',
        status: 'published'
      }
    ];

    for (const page of samplePages) {
      await this.createPage(page);
    }

    // Create sample FAQs
    const sampleFaqs = [
      {
        question: 'What is an Expert Advisor (EA)?',
        answer: 'An Expert Advisor is an automated trading program that executes trades on your behalf based on pre-programmed trading strategies. EAs can monitor markets 24/7 and execute trades without human intervention.',
        category: 'General',
        order: 1
      },
      {
        question: 'Which platform do your EAs work on?',
        answer: 'Our EAs are available for both MetaTrader 4 (MT4) and MetaTrader 5 (MT5) platforms. Each product page clearly indicates platform compatibility.',
        category: 'Compatibility',
        order: 2
      }
    ];

    for (const faq of sampleFaqs) {
      await this.createFaq(faq);
    }

    console.log('Database initialized with sample data');
  }
}

// Create and export storage instance
export const storage = new MemStorage();

// Initialize storage with sample data on startup
storage.initialize().catch(console.error);
