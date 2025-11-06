import {
  type User, type InsertUser,
  type Admin, type InsertAdmin,
  type Blog, type InsertBlog,
  type Category, type InsertCategory,
  type Comment, type InsertComment,
  type Media, type InsertMedia,
  type SeoMeta, type InsertSeoMeta,
  type Signal, type InsertSignal,
  type Post, type InsertPost,
  type Page, type InsertPage,
  type Download, type InsertDownload,
  type EmailNotification, type InsertEmailNotification,
  type BlogStatus,
  type UserRole,
  type AdminRole,
  type SignalPlatform,
  type SignalStrategy,
  type CommentStatus,
  type CategoryStatus,
  type PaginationOptions as SchemaPaginationOptions,
  type PaginatedResult as SchemaPaginatedResult,
  type BlogFilters,
  type SignalFilters,
  type UserFilters
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

// Re-export pagination types from schema  
export type PaginationOptions = SchemaPaginationOptions;
export type PaginatedResult<T> = SchemaPaginatedResult<T>;

// Main storage interface with all CRUD operations
export interface IStorage {
  // ============================================
  // ADMIN MANAGEMENT
  // ============================================
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  getAdmin(id: number): Promise<Admin | undefined>;
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  authenticateAdmin(username: string, password: string): Promise<Admin | undefined>;
  updateAdmin(id: number, data: Partial<InsertAdmin>): Promise<Admin | undefined>;
  deleteAdmin(id: number): Promise<boolean>;
  getAllAdmins(options?: PaginationOptions): Promise<PaginatedResult<Admin>>;
  getAdminsByRole(role: AdminRole, options?: PaginationOptions): Promise<PaginatedResult<Admin>>;

  // ============================================
  // USER MANAGEMENT
  // ============================================
  createUser(user: InsertUser): Promise<User>;
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  authenticateUser(email: string, password: string): Promise<User | undefined>;
  updateUserProfile(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(options?: PaginationOptions, filters?: UserFilters): Promise<PaginatedResult<User>>;
  getUsersByRole(role: UserRole, options?: PaginationOptions): Promise<PaginatedResult<User>>;
  updateUserSubscription(id: number, status: string, endDate?: Date): Promise<User | undefined>;
  updateLastLogin(id: number): Promise<void>;
  verifyUserEmail(id: number): Promise<boolean>;

  // ============================================
  // BLOG MANAGEMENT
  // ============================================
  createBlog(blog: InsertBlog): Promise<Blog>;
  updateBlog(id: number, blog: Partial<InsertBlog>): Promise<Blog | undefined>;
  deleteBlog(id: number): Promise<boolean>;
  getBlogById(id: number): Promise<Blog | undefined>;
  getBlogBySlug(slug: string): Promise<Blog | undefined>;
  getAllBlogs(options?: PaginationOptions, filters?: BlogFilters): Promise<PaginatedResult<Blog>>;
  getPublishedBlogs(options?: PaginationOptions): Promise<PaginatedResult<Blog>>;
  getBlogsByStatus(status: BlogStatus, options?: PaginationOptions): Promise<PaginatedResult<Blog>>;
  getBlogsByCategory(categoryId: number, options?: PaginationOptions): Promise<PaginatedResult<Blog>>;
  getBlogsByAuthor(author: string, options?: PaginationOptions): Promise<PaginatedResult<Blog>>;
  incrementBlogViews(id: number): Promise<void>;
  searchBlogs(query: string, options?: PaginationOptions): Promise<PaginatedResult<Blog>>;
  getRelatedBlogs(blogId: number, limit?: number): Promise<Blog[]>;
  getFeaturedBlogs(limit?: number): Promise<Blog[]>;
  findAllTags(): Promise<string[]>;

  // ============================================
  // SIGNAL/EA MANAGEMENT
  // ============================================
  createSignal(signal: InsertSignal): Promise<Signal>;
  updateSignal(id: number, signal: Partial<InsertSignal>): Promise<Signal | undefined>;
  deleteSignal(id: number): Promise<boolean>;
  getSignalById(id: number): Promise<Signal | undefined>;
  getSignalByUuid(uuid: string): Promise<Signal | undefined>;
  getAllSignals(options?: PaginationOptions, filters?: SignalFilters): Promise<PaginatedResult<Signal>>;
  getSignalsByPlatform(platform: SignalPlatform, options?: PaginationOptions): Promise<PaginatedResult<Signal>>;
  getSignalsByStrategy(strategy: SignalStrategy, options?: PaginationOptions): Promise<PaginatedResult<Signal>>;
  getPremiumSignals(options?: PaginationOptions): Promise<PaginatedResult<Signal>>;
  getFreeSignals(options?: PaginationOptions): Promise<PaginatedResult<Signal>>;
  incrementSignalDownloadCount(id: number): Promise<void>;
  updateSignalRating(id: number, rating: number): Promise<void>;
  getTopRatedSignals(limit?: number): Promise<Signal[]>;
  getMostDownloadedSignals(limit?: number): Promise<Signal[]>;
  getSignalsByCategory(categoryId: number, options?: PaginationOptions): Promise<PaginatedResult<Signal>>;
  searchSignals(query: string, options?: PaginationOptions): Promise<PaginatedResult<Signal>>;
  
  // File management for signals
  deleteSignalFiles(signalId: number): Promise<void>;
  updateSignalFileInfo(id: number, fileInfo: { fileUrl?: string; previewImage?: string; fileSize?: number; uploadedAt?: Date }): Promise<Signal | undefined>;

  // ============================================
  // CATEGORY MANAGEMENT
  // ============================================
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  getCategoryById(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  getAllCategories(): Promise<Category[]>;
  getActiveCategories(): Promise<Category[]>;
  getCategoryTree(): Promise<Category[]>;
  getCategoriesByParent(parentId: number | null): Promise<Category[]>;
  updateCategoryStatus(id: number, status: CategoryStatus): Promise<boolean>;

  // ============================================
  // COMMENT MANAGEMENT
  // ============================================
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: number, comment: Partial<InsertComment>): Promise<Comment | undefined>;
  deleteComment(id: number): Promise<boolean>;
  getCommentById(id: number): Promise<Comment | undefined>;
  getCommentsByPost(postId: number, onlyApproved?: boolean): Promise<Comment[]>;
  getCommentsByStatus(status: CommentStatus): Promise<Comment[]>;
  getPendingComments(): Promise<Comment[]>;
  approveComment(id: number): Promise<Comment | undefined>;
  markCommentAsSpam(id: number): Promise<Comment | undefined>;
  getCommentReplies(parentId: number): Promise<Comment[]>;
  getCommentCount(postId: number): Promise<number>;
  getRecentComments(limit?: number): Promise<Comment[]>;

  // ============================================
  // SEO META MANAGEMENT
  // ============================================
  createSeoMeta(seoMeta: InsertSeoMeta): Promise<SeoMeta>;
  updateSeoMeta(id: number, seoMeta: Partial<InsertSeoMeta>): Promise<SeoMeta | undefined>;
  deleteSeoMeta(id: number): Promise<boolean>;
  getSeoMetaById(id: number): Promise<SeoMeta | undefined>;
  getSeoMetaByPostId(postId: number): Promise<SeoMeta | undefined>;
  updateOrCreateSeoMeta(postId: number, seoMeta: InsertSeoMeta): Promise<SeoMeta>;
  generateSitemap(): Promise<Array<{ url: string; lastmod: Date; priority: number }>>;

  // ============================================
  // MEDIA MANAGEMENT
  // ============================================
  createMedia(media: InsertMedia): Promise<Media>;
  updateMedia(id: number, media: Partial<InsertMedia>): Promise<Media | undefined>;
  deleteMedia(id: number): Promise<boolean>;
  getMediaById(id: number): Promise<Media | undefined>;
  getMediaByUser(userId: number, options?: PaginationOptions): Promise<PaginatedResult<Media>>;
  getAllMedia(options?: PaginationOptions): Promise<PaginatedResult<Media>>;
  getMediaByType(fileType: string, options?: PaginationOptions): Promise<PaginatedResult<Media>>;
  searchMedia(query: string, options?: PaginationOptions): Promise<PaginatedResult<Media>>;
  uploadFile(file: { filename: string; filepath: string; size: number; mimetype: string; uploadedBy: number }): Promise<Media>;

  // ============================================
  // POST MANAGEMENT (separate from blogs)
  // ============================================
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, post: Partial<InsertPost>): Promise<Post | undefined>;
  deletePost(id: number): Promise<boolean>;
  getPostById(id: number): Promise<Post | undefined>;
  getPostBySlug(slug: string): Promise<Post | undefined>;
  getAllPosts(options?: PaginationOptions): Promise<PaginatedResult<Post>>;
  getPublishedPosts(options?: PaginationOptions): Promise<PaginatedResult<Post>>;
  getPostsByAuthor(authorId: number, options?: PaginationOptions): Promise<PaginatedResult<Post>>;
  getPostsByCategory(category: string, options?: PaginationOptions): Promise<PaginatedResult<Post>>;

  // ============================================
  // PAGE MANAGEMENT
  // ============================================
  createPage(page: InsertPage): Promise<Page>;
  updatePage(id: number, page: Partial<InsertPage>): Promise<Page | undefined>;
  deletePage(id: number): Promise<boolean>;
  getPageById(id: number): Promise<Page | undefined>;
  getPageBySlug(slug: string): Promise<Page | undefined>;
  getAllPages(): Promise<Page[]>;
  getPagesByTemplate(template: string): Promise<Page[]>;
  getPageTree(): Promise<Page[]>;

  // ============================================
  // DOWNLOAD MANAGEMENT
  // ============================================
  createDownload(download: InsertDownload): Promise<Download>;
  getDownloadById(id: number): Promise<Download | undefined>;
  getDownloadsByUser(userId: number, options?: PaginationOptions): Promise<PaginatedResult<Download>>;
  getDownloadsByPost(postId: number, options?: PaginationOptions): Promise<PaginatedResult<Download>>;
  getTotalDownloadsForPost(postId: number): Promise<number>;
  getRecentDownloads(limit?: number): Promise<Download[]>;
  getUserDownloadHistory(userId: number, postId: number): Promise<Download[]>;
  checkUserHasDownloaded(userId: number, postId: number): Promise<boolean>;
  getDownloadStats(startDate?: Date, endDate?: Date): Promise<{ totalDownloads: number; uniqueUsers: number; topPosts: Array<{postId: number; downloads: number}> }>;
  incrementPostDownloadCount(postId: number): Promise<void>;
  
  // ============================================
  // EMAIL NOTIFICATION MANAGEMENT
  // ============================================
  createEmailNotification(notification: InsertEmailNotification): Promise<EmailNotification>;
  updateEmailNotificationStatus(id: number, status: 'sent' | 'failed', errorMessage?: string): Promise<EmailNotification | undefined>;
  getEmailNotificationById(id: number): Promise<EmailNotification | undefined>;
  getEmailNotificationsByUser(userId: number, options?: PaginationOptions): Promise<PaginatedResult<EmailNotification>>;
  getPendingEmailNotifications(limit?: number): Promise<EmailNotification[]>;
  getFailedEmailNotifications(limit?: number): Promise<EmailNotification[]>;
  markEmailAsSent(id: number): Promise<boolean>;
  markEmailAsFailed(id: number, errorMessage: string): Promise<boolean>;
  getLastEmailSentToUser(userId: number, emailType?: string): Promise<EmailNotification | undefined>;
  getUsersWithEmailPreference(preference: 'subscribeToNewPosts' | 'subscribeToWeeklyDigest'): Promise<User[]>;
  updateUserEmailPreferences(userId: number, preferences: { subscribeToNewPosts?: boolean; subscribeToWeeklyDigest?: boolean }): Promise<User | undefined>;
  updateUserLastEmailSentAt(userId: number): Promise<void>;
  getUsersForWeeklyDigest(): Promise<User[]>;
  getUsersForNewPostNotification(): Promise<User[]>;
  setEmailVerificationToken(userId: number, token: string): Promise<void>;
  clearEmailVerificationToken(userId: number): Promise<void>;
  getUserByEmailVerificationToken(token: string): Promise<User | undefined>;

  // ============================================
  // UTILITY METHODS
  // ============================================
  initialize(): Promise<void>;
  generateUuid(): string;
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hash: string): Promise<boolean>;
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
  private admins: Map<number, Admin> = new Map();
  private users: Map<number, User> = new Map();
  private blogs: Map<number, Blog> = new Map();
  private signals: Map<number, Signal> = new Map();
  private categories: Map<number, Category> = new Map();
  private comments: Map<number, Comment> = new Map();
  private seoMeta: Map<number, SeoMeta> = new Map();
  private media: Map<number, Media> = new Map();
  private posts: Map<number, Post> = new Map();
  private pages: Map<number, Page> = new Map();
  private blogCategories: Map<string, { blogId: number; categoryId: number }> = new Map();
  private downloads: Map<number, Download> = new Map();
  private emailNotifications: Map<number, EmailNotification> = new Map();
  
  private nextAdminId = 1;
  private nextUserId = 1;
  private nextBlogId = 1;
  private nextSignalId = 1;
  private nextCategoryId = 1;
  private nextCommentId = 1;
  private nextSeoMetaId = 1;
  private nextMediaId = 1;
  private nextPostId = 1;
  private nextPageId = 1;
  private nextDownloadId = 1;
  private nextEmailNotificationId = 1;

  constructor() {
    // Initialize collections
  }

  // ============================================
  // ADMIN MANAGEMENT IMPLEMENTATION
  // ============================================
  async createAdmin(insertAdmin: InsertAdmin): Promise<Admin> {
    const id = this.nextAdminId++;
    const hashedPassword = await hashPassword(insertAdmin.password);
    const admin: Admin = {
      id,
      ...insertAdmin,
      password: hashedPassword,
      role: insertAdmin.role || 'editor',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.admins.set(id, admin);
    return admin;
  }

  async getAdmin(id: number): Promise<Admin | undefined> {
    return this.admins.get(id);
  }

  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    return Array.from(this.admins.values()).find(a => a.email === email);
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    return Array.from(this.admins.values()).find(a => a.username === username);
  }

  async authenticateAdmin(username: string, password: string): Promise<Admin | undefined> {
    const admin = await this.getAdminByUsername(username);
    if (!admin) return undefined;
    const valid = await comparePassword(password, admin.password);
    return valid ? admin : undefined;
  }

  async updateAdmin(id: number, data: Partial<InsertAdmin>): Promise<Admin | undefined> {
    const admin = this.admins.get(id);
    if (!admin) return undefined;
    const updated = { ...admin, ...data, updatedAt: new Date() };
    if (data.password) {
      updated.password = await hashPassword(data.password);
    }
    this.admins.set(id, updated);
    return updated;
  }

  async deleteAdmin(id: number): Promise<boolean> {
    return this.admins.delete(id);
  }

  async getAllAdmins(options: PaginationOptions = {}): Promise<PaginatedResult<Admin>> {
    const { page = 1, limit = 10 } = options;
    const admins = Array.from(this.admins.values());
    const total = admins.length;
    const start = (page - 1) * limit;
    const data = admins.slice(start, start + limit);
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1
    };
  }

  async getAdminsByRole(role: AdminRole, options: PaginationOptions = {}): Promise<PaginatedResult<Admin>> {
    const { page = 1, limit = 10 } = options;
    const filtered = Array.from(this.admins.values()).filter(a => a.role === role);
    const total = filtered.length;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1
    };
  }

  // ============================================
  // USER MANAGEMENT IMPLEMENTATION
  // ============================================
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.nextUserId++;
    const hashedPassword = await hashPassword(insertUser.password);
    const user: User = {
      id,
      ...insertUser,
      password: hashedPassword,
      role: insertUser.role || 'viewer',
      createdAt: new Date(),
      emailVerified: false,
      twoFactorEnabled: false
    };
    this.users.set(id, user);
    return user;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async authenticateUser(email: string, password: string): Promise<User | undefined> {
    const user = await this.getUserByEmail(email);
    if (!user) return undefined;
    const valid = await comparePassword(password, user.password);
    if (valid) {
      await this.updateLastLogin(user.id);
    }
    return valid ? user : undefined;
  }

  async updateUserProfile(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...data };
    if (data.password) {
      updated.password = await hashPassword(data.password);
    }
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(options: PaginationOptions = {}, filters?: UserFilters): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 10 } = options;
    let users = Array.from(this.users.values());
    
    // Apply filters
    if (filters) {
      if (filters.role) users = users.filter(u => u.role === filters.role);
      if (filters.subscriptionStatus) users = users.filter(u => u.subscriptionStatus === filters.subscriptionStatus);
      if (filters.country) users = users.filter(u => u.country === filters.country);
      if (filters.emailVerified !== undefined) users = users.filter(u => u.emailVerified === filters.emailVerified);
    }
    
    const total = users.length;
    const start = (page - 1) * limit;
    const data = users.slice(start, start + limit);
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1
    };
  }

  async getUsersByRole(role: UserRole, options: PaginationOptions = {}): Promise<PaginatedResult<User>> {
    return this.getAllUsers(options, { role });
  }

  async updateUserSubscription(id: number, status: string, endDate?: Date): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    user.subscriptionStatus = status;
    user.subscriptionEndDate = endDate || null;
    this.users.set(id, user);
    return user;
  }

  async updateLastLogin(id: number): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.lastLogin = new Date();
      this.users.set(id, user);
    }
  }

  async verifyUserEmail(id: number): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    user.emailVerified = true;
    this.users.set(id, user);
    return true;
  }

  // ============================================
  // BLOG MANAGEMENT IMPLEMENTATION
  // ============================================
  async createBlog(insertBlog: InsertBlog): Promise<Blog> {
    const id = this.nextBlogId++;
    const blog: Blog = {
      id,
      ...insertBlog,
      status: insertBlog.status || 'draft',
      views: 0,
      createdAt: new Date()
    };
    this.blogs.set(id, blog);
    return blog;
  }

  async updateBlog(id: number, data: Partial<InsertBlog>): Promise<Blog | undefined> {
    const blog = this.blogs.get(id);
    if (!blog) return undefined;
    const updated = { ...blog, ...data };
    this.blogs.set(id, updated);
    return updated;
  }

  async deleteBlog(id: number): Promise<boolean> {
    return this.blogs.delete(id);
  }

  async getBlogById(id: number): Promise<Blog | undefined> {
    return this.blogs.get(id);
  }

  async getBlogBySlug(slug: string): Promise<Blog | undefined> {
    return Array.from(this.blogs.values()).find(b => b.seoSlug === slug);
  }

  async getAllBlogs(options: PaginationOptions = {}, filters?: BlogFilters): Promise<PaginatedResult<Blog>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    let blogs = Array.from(this.blogs.values());
    
    // Apply filters
    if (filters) {
      if (filters.status) blogs = blogs.filter(b => b.status === filters.status);
      if (filters.categoryId) blogs = blogs.filter(b => b.categoryId === filters.categoryId);
      if (filters.tags && filters.tags.length > 0) {
        blogs = blogs.filter(b => {
          const blogTags = b.tags.split(',').map(t => t.trim());
          return filters.tags!.some(tag => blogTags.includes(tag));
        });
      }
    }
    
    // Sort
    blogs.sort((a, b) => {
      const aVal = (a as any)[sortBy];
      const bVal = (b as any)[sortBy];
      const comparison = aVal > bVal ? 1 : -1;
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    const total = blogs.length;
    const start = (page - 1) * limit;
    const data = blogs.slice(start, start + limit);
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1
    };
  }

  async getPublishedBlogs(options: PaginationOptions = {}): Promise<PaginatedResult<Blog>> {
    return this.getAllBlogs(options, { status: 'published' });
  }

  async getBlogsByStatus(status: BlogStatus, options: PaginationOptions = {}): Promise<PaginatedResult<Blog>> {
    return this.getAllBlogs(options, { status });
  }

  async getBlogsByCategory(categoryId: number, options: PaginationOptions = {}): Promise<PaginatedResult<Blog>> {
    return this.getAllBlogs(options, { categoryId });
  }

  async getBlogsByAuthor(author: string, options: PaginationOptions = {}): Promise<PaginatedResult<Blog>> {
    const { page = 1, limit = 10 } = options;
    const filtered = Array.from(this.blogs.values()).filter(b => b.author === author);
    const total = filtered.length;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1
    };
  }

  async incrementBlogViews(id: number): Promise<void> {
    const blog = this.blogs.get(id);
    if (blog && blog.views !== null) {
      blog.views = (blog.views || 0) + 1;
      this.blogs.set(id, blog);
    }
  }

  async searchBlogs(query: string, options: PaginationOptions = {}): Promise<PaginatedResult<Blog>> {
    const { page = 1, limit = 10 } = options;
    const lowerQuery = query.toLowerCase();
    const filtered = Array.from(this.blogs.values()).filter(b => 
      b.title.toLowerCase().includes(lowerQuery) ||
      b.content.toLowerCase().includes(lowerQuery) ||
      b.tags.toLowerCase().includes(lowerQuery)
    );
    const total = filtered.length;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1
    };
  }

  async getRelatedBlogs(blogId: number, limit: number = 5): Promise<Blog[]> {
    const blog = this.blogs.get(blogId);
    if (!blog) return [];
    
    const related = Array.from(this.blogs.values())
      .filter(b => b.id !== blogId && b.categoryId === blog.categoryId && b.status === 'published')
      .slice(0, limit);
    
    return related;
  }

  async getFeaturedBlogs(limit: number = 5): Promise<Blog[]> {
    return Array.from(this.blogs.values())
      .filter(b => b.status === 'published')
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, limit);
  }

  async findAllTags(): Promise<string[]> {
    // Get all published blogs
    const publishedBlogs = Array.from(this.blogs.values())
      .filter(b => b.status === 'published');
    
    // Extract unique tags from all blogs
    const allTags = new Set<string>();
    publishedBlogs.forEach(blog => {
      // Check if tags exist and is a non-empty string
      if (blog.tags && typeof blog.tags === 'string' && blog.tags.trim()) {
        // Split by comma, trim each tag, and filter out empty strings
        const tags = blog.tags.split(',').map(t => t.trim()).filter(t => t);
        // Add each tag to the set
        tags.forEach(tag => allTags.add(tag));
      }
    });
    
    // Return sorted array of unique tags
    return Array.from(allTags).sort();
  }

  // ============================================
  // SIGNAL/EA MANAGEMENT IMPLEMENTATION
  // ============================================
  async createSignal(insertSignal: InsertSignal): Promise<Signal> {
    const id = this.nextSignalId++;
    const signal: Signal = {
      id,
      ...insertSignal,
      createdAt: new Date(),
      downloadCount: 0,
      rating: '0.00',
      status: 'active'
    };
    this.signals.set(id, signal);
    return signal;
  }

  async updateSignal(id: number, data: Partial<InsertSignal>): Promise<Signal | undefined> {
    const signal = this.signals.get(id);
    if (!signal) return undefined;
    const updated = { ...signal, ...data };
    this.signals.set(id, updated);
    return updated;
  }

  async deleteSignal(id: number): Promise<boolean> {
    return this.signals.delete(id);
  }

  async getSignalById(id: number): Promise<Signal | undefined> {
    return this.signals.get(id);
  }

  async getSignalByUuid(uuid: string): Promise<Signal | undefined> {
    return Array.from(this.signals.values()).find(s => s.uuid === uuid);
  }

  async getAllSignals(options: PaginationOptions = {}, filters?: SignalFilters): Promise<PaginatedResult<Signal>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    let signals = Array.from(this.signals.values());
    
    // Apply filters
    if (filters) {
      if (filters.platform) signals = signals.filter(s => s.platform === filters.platform);
      if (filters.strategy) signals = signals.filter(s => s.strategy === filters.strategy);
      if (filters.isPremium !== undefined) signals = signals.filter(s => s.isPremium === filters.isPremium);
      if (filters.minRating !== undefined) {
        signals = signals.filter(s => parseFloat(s.rating || '0') >= filters.minRating!);
      }
      if (filters.categoryId) signals = signals.filter(s => s.categoryId === filters.categoryId);
    }
    
    // Sort
    signals.sort((a, b) => {
      const aVal = (a as any)[sortBy];
      const bVal = (b as any)[sortBy];
      const comparison = aVal > bVal ? 1 : -1;
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    const total = signals.length;
    const start = (page - 1) * limit;
    const data = signals.slice(start, start + limit);
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1
    };
  }

  async getSignalsByPlatform(platform: SignalPlatform, options: PaginationOptions = {}): Promise<PaginatedResult<Signal>> {
    return this.getAllSignals(options, { platform });
  }

  async getSignalsByStrategy(strategy: SignalStrategy, options: PaginationOptions = {}): Promise<PaginatedResult<Signal>> {
    return this.getAllSignals(options, { strategy });
  }

  async getPremiumSignals(options: PaginationOptions = {}): Promise<PaginatedResult<Signal>> {
    return this.getAllSignals(options, { isPremium: true });
  }

  async getFreeSignals(options: PaginationOptions = {}): Promise<PaginatedResult<Signal>> {
    return this.getAllSignals(options, { isPremium: false });
  }

  async incrementSignalDownloadCount(id: number): Promise<void> {
    const signal = this.signals.get(id);
    if (signal) {
      signal.downloadCount = (signal.downloadCount || 0) + 1;
      this.signals.set(id, signal);
    }
  }

  async updateSignalRating(id: number, rating: number): Promise<void> {
    const signal = this.signals.get(id);
    if (signal) {
      signal.rating = rating.toFixed(2);
      this.signals.set(id, signal);
    }
  }

  async getTopRatedSignals(limit: number = 10): Promise<Signal[]> {
    return Array.from(this.signals.values())
      .sort((a, b) => parseFloat(b.rating || '0') - parseFloat(a.rating || '0'))
      .slice(0, limit);
  }

  async getMostDownloadedSignals(limit: number = 10): Promise<Signal[]> {
    return Array.from(this.signals.values())
      .sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0))
      .slice(0, limit);
  }

  async getSignalsByCategory(categoryId: number, options: PaginationOptions = {}): Promise<PaginatedResult<Signal>> {
    return this.getAllSignals(options, { categoryId });
  }

  async searchSignals(query: string, options: PaginationOptions = {}): Promise<PaginatedResult<Signal>> {
    const { page = 1, limit = 10 } = options;
    const lowerQuery = query.toLowerCase();
    const filtered = Array.from(this.signals.values()).filter(s => 
      s.title.toLowerCase().includes(lowerQuery) ||
      s.description.toLowerCase().includes(lowerQuery)
    );
    const total = filtered.length;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1
    };
  }

  async deleteSignalFiles(signalId: number): Promise<void> {
    // In MemStorage, we don't actually delete files, but in a real implementation
    // this would delete the associated files from the filesystem
    const signal = this.signals.get(signalId);
    if (signal) {
      if (signal.fileUrl) {
        console.log(`Would delete file: ${signal.fileUrl}`);
      }
      if (signal.previewImage) {
        console.log(`Would delete preview: ${signal.previewImage}`);
      }
    }
  }

  async updateSignalFileInfo(id: number, fileInfo: { fileUrl?: string; previewImage?: string; fileSize?: number; uploadedAt?: Date }): Promise<Signal | undefined> {
    const signal = this.signals.get(id);
    if (!signal) return undefined;
    
    const updated = { 
      ...signal,
      ...fileInfo,
      updatedAt: new Date()
    };
    
    this.signals.set(id, updated);
    return updated;
  }

  // ============================================
  // CATEGORY MANAGEMENT IMPLEMENTATION
  // ============================================
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const categoryId = this.nextCategoryId++;
    const category: Category = {
      categoryId,
      ...insertCategory,
      status: insertCategory.status || 'active'
    };
    this.categories.set(categoryId, category);
    return category;
  }

  async updateCategory(id: number, data: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    const updated = { ...category, ...data };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(c => c.slug === slug);
  }

  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getActiveCategories(): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(c => c.status === 'active');
  }

  async getCategoryTree(): Promise<Category[]> {
    const categories = Array.from(this.categories.values());
    const tree: Category[] = [];
    const map = new Map<number, Category>();
    
    categories.forEach(cat => {
      map.set(cat.categoryId, { ...cat });
    });
    
    categories.forEach(cat => {
      if (!cat.parentId) {
        tree.push(map.get(cat.categoryId)!);
      }
    });
    
    return tree;
  }

  async getCategoriesByParent(parentId: number | null): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(c => c.parentId === parentId);
  }

  async updateCategoryStatus(id: number, status: CategoryStatus): Promise<boolean> {
    const category = this.categories.get(id);
    if (!category) return false;
    category.status = status;
    this.categories.set(id, category);
    return true;
  }

  // ============================================
  // COMMENT MANAGEMENT IMPLEMENTATION
  // ============================================
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.nextCommentId++;
    const comment: Comment = {
      id,
      ...insertComment,
      status: insertComment.status || 'pending',
      approved: false,
      createdAt: new Date()
    };
    this.comments.set(id, comment);
    return comment;
  }

  async updateComment(id: number, data: Partial<InsertComment>): Promise<Comment | undefined> {
    const comment = this.comments.get(id);
    if (!comment) return undefined;
    const updated = { ...comment, ...data };
    this.comments.set(id, updated);
    return updated;
  }

  async deleteComment(id: number): Promise<boolean> {
    return this.comments.delete(id);
  }

  async getCommentById(id: number): Promise<Comment | undefined> {
    return this.comments.get(id);
  }

  async getCommentsByPost(postId: number, onlyApproved: boolean = true): Promise<Comment[]> {
    return Array.from(this.comments.values()).filter(c => 
      c.postId === postId && (!onlyApproved || c.approved === true)
    );
  }

  async getCommentsByStatus(status: CommentStatus): Promise<Comment[]> {
    return Array.from(this.comments.values()).filter(c => c.status === status);
  }

  async getPendingComments(): Promise<Comment[]> {
    return this.getCommentsByStatus('pending');
  }

  async approveComment(id: number): Promise<Comment | undefined> {
    const comment = this.comments.get(id);
    if (!comment) return undefined;
    comment.approved = true;
    comment.status = 'approved';
    this.comments.set(id, comment);
    return comment;
  }

  async markCommentAsSpam(id: number): Promise<Comment | undefined> {
    const comment = this.comments.get(id);
    if (!comment) return undefined;
    comment.status = 'spam';
    comment.approved = false;
    this.comments.set(id, comment);
    return comment;
  }

  async getCommentReplies(parentId: number): Promise<Comment[]> {
    return Array.from(this.comments.values()).filter(c => c.parentId === parentId);
  }

  async getCommentCount(postId: number): Promise<number> {
    return Array.from(this.comments.values()).filter(c => 
      c.postId === postId && c.approved === true
    ).length;
  }

  async getRecentComments(limit: number = 10): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(c => c.approved === true)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  // ============================================
  // SEO META MANAGEMENT IMPLEMENTATION
  // ============================================
  async createSeoMeta(insertSeoMeta: InsertSeoMeta): Promise<SeoMeta> {
    const id = this.nextSeoMetaId++;
    const seoMeta: SeoMeta = {
      id,
      ...insertSeoMeta,
      metaRobots: insertSeoMeta.metaRobots || 'index, follow',
      schemaType: 'Article',
      twitterCard: 'summary_large_image',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.seoMeta.set(id, seoMeta);
    return seoMeta;
  }

  async updateSeoMeta(id: number, data: Partial<InsertSeoMeta>): Promise<SeoMeta | undefined> {
    const seoMeta = this.seoMeta.get(id);
    if (!seoMeta) return undefined;
    const updated = { ...seoMeta, ...data, updatedAt: new Date() };
    this.seoMeta.set(id, updated);
    return updated;
  }

  async deleteSeoMeta(id: number): Promise<boolean> {
    return this.seoMeta.delete(id);
  }

  async getSeoMetaById(id: number): Promise<SeoMeta | undefined> {
    return this.seoMeta.get(id);
  }

  async getSeoMetaByPostId(postId: number): Promise<SeoMeta | undefined> {
    return Array.from(this.seoMeta.values()).find(s => s.postId === postId);
  }

  async updateOrCreateSeoMeta(postId: number, data: InsertSeoMeta): Promise<SeoMeta> {
    const existing = await this.getSeoMetaByPostId(postId);
    if (existing) {
      return (await this.updateSeoMeta(existing.id, data))!;
    } else {
      return await this.createSeoMeta({ ...data, postId });
    }
  }

  async generateSitemap(): Promise<Array<{ url: string; lastmod: Date; priority: number }>> {
    const urls: Array<{ url: string; lastmod: Date; priority: number }> = [];
    
    // Add blogs
    const blogs = Array.from(this.blogs.values()).filter(b => b.status === 'published');
    blogs.forEach(blog => {
      urls.push({
        url: `/blog/${blog.seoSlug}`,
        lastmod: blog.createdAt,
        priority: 0.8
      });
    });
    
    // Add pages
    const pages = Array.from(this.pages.values());
    pages.forEach(page => {
      urls.push({
        url: `/${page.slug}`,
        lastmod: page.updatedAt || page.createdAt,
        priority: 0.6
      });
    });
    
    return urls;
  }

  // ============================================
  // MEDIA MANAGEMENT IMPLEMENTATION
  // ============================================
  async createMedia(insertMedia: InsertMedia): Promise<Media> {
    const id = this.nextMediaId++;
    const media: Media = {
      id,
      ...insertMedia,
      uploadedAt: new Date()
    };
    this.media.set(id, media);
    return media;
  }

  async updateMedia(id: number, data: Partial<InsertMedia>): Promise<Media | undefined> {
    const media = this.media.get(id);
    if (!media) return undefined;
    const updated = { ...media, ...data };
    this.media.set(id, updated);
    return updated;
  }

  async deleteMedia(id: number): Promise<boolean> {
    return this.media.delete(id);
  }

  async getMediaById(id: number): Promise<Media | undefined> {
    return this.media.get(id);
  }

  async getMediaByUser(userId: number, options: PaginationOptions = {}): Promise<PaginatedResult<Media>> {
    const { page = 1, limit = 10 } = options;
    const filtered = Array.from(this.media.values()).filter(m => m.uploadedBy === userId);
    const total = filtered.length;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1
    };
  }

  async getAllMedia(options: PaginationOptions = {}): Promise<PaginatedResult<Media>> {
    const { page = 1, limit = 10 } = options;
    const media = Array.from(this.media.values());
    const total = media.length;
    const start = (page - 1) * limit;
    const data = media.slice(start, start + limit);
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1
    };
  }

  async getMediaByType(fileType: string, options: PaginationOptions = {}): Promise<PaginatedResult<Media>> {
    const { page = 1, limit = 10 } = options;
    const filtered = Array.from(this.media.values()).filter(m => m.fileType === fileType);
    const total = filtered.length;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1
    };
  }

  async searchMedia(query: string, options: PaginationOptions = {}): Promise<PaginatedResult<Media>> {
    const { page = 1, limit = 10 } = options;
    const lowerQuery = query.toLowerCase();
    const filtered = Array.from(this.media.values()).filter(m => 
      m.fileName.toLowerCase().includes(lowerQuery) ||
      (m.altText && m.altText.toLowerCase().includes(lowerQuery))
    );
    const total = filtered.length;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1
    };
  }

  // ============================================
  // POST MANAGEMENT IMPLEMENTATION
  // ============================================
  async createPost(insertPost: InsertPost): Promise<Post> {
    const id = this.nextPostId++;
    const post: Post = {
      id,
      ...insertPost,
      status: insertPost.status || 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.posts.set(id, post);
    return post;
  }

  async updatePost(id: number, data: Partial<InsertPost>): Promise<Post | undefined> {
    const post = this.posts.get(id);
    if (!post) return undefined;
    const updated = { ...post, ...data, updatedAt: new Date() };
    this.posts.set(id, updated);
    return updated;
  }

  async deletePost(id: number): Promise<boolean> {
    return this.posts.delete(id);
  }

  async getPostById(id: number): Promise<Post | undefined> {
    return this.posts.get(id);
  }

  async getPostBySlug(slug: string): Promise<Post | undefined> {
    return Array.from(this.posts.values()).find(p => p.slug === slug);
  }

  async getAllPosts(options: PaginationOptions = {}): Promise<PaginatedResult<Post>> {
    const { page = 1, limit = 10 } = options;
    const posts = Array.from(this.posts.values());
    const total = posts.length;
    const start = (page - 1) * limit;
    const data = posts.slice(start, start + limit);
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1
    };
  }

  async getPublishedPosts(options: PaginationOptions = {}): Promise<PaginatedResult<Post>> {
    const { page = 1, limit = 10 } = options;
    const filtered = Array.from(this.posts.values()).filter(p => p.status === 'published');
    const total = filtered.length;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1
    };
  }

  async getPostsByAuthor(authorId: number, options: PaginationOptions = {}): Promise<PaginatedResult<Post>> {
    const { page = 1, limit = 10 } = options;
    const filtered = Array.from(this.posts.values()).filter(p => p.authorId === authorId);
    const total = filtered.length;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1
    };
  }

  async getPostsByCategory(category: string, options: PaginationOptions = {}): Promise<PaginatedResult<Post>> {
    const { page = 1, limit = 10 } = options;
    const filtered = Array.from(this.posts.values()).filter(p => p.category === category);
    const total = filtered.length;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1
    };
  }

  // ============================================
  // PAGE MANAGEMENT IMPLEMENTATION
  // ============================================
  async createPage(insertPage: InsertPage): Promise<Page> {
    const id = this.nextPageId++;
    const page: Page = {
      id,
      ...insertPage,
      status: insertPage.status || 'published',
      template: insertPage.template || 'default',
      order: insertPage.order || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.pages.set(id, page);
    return page;
  }

  async updatePage(id: number, data: Partial<InsertPage>): Promise<Page | undefined> {
    const page = this.pages.get(id);
    if (!page) return undefined;
    const updated = { ...page, ...data, updatedAt: new Date() };
    this.pages.set(id, updated);
    return updated;
  }

  async deletePage(id: number): Promise<boolean> {
    return this.pages.delete(id);
  }

  async getPageById(id: number): Promise<Page | undefined> {
    return this.pages.get(id);
  }

  async getPageBySlug(slug: string): Promise<Page | undefined> {
    return Array.from(this.pages.values()).find(p => p.slug === slug);
  }

  async getAllPages(): Promise<Page[]> {
    return Array.from(this.pages.values()).sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  async getPagesByTemplate(template: string): Promise<Page[]> {
    return Array.from(this.pages.values()).filter(p => p.template === template);
  }

  async getPageTree(): Promise<Page[]> {
    const pages = Array.from(this.pages.values());
    const tree: Page[] = [];
    const map = new Map<number, Page>();
    
    pages.forEach(page => {
      map.set(page.id, { ...page });
    });
    
    pages.forEach(page => {
      if (!page.parentId) {
        tree.push(map.get(page.id)!);
      }
    });
    
    return tree.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  // ============================================
  // DOWNLOAD MANAGEMENT IMPLEMENTATION
  // ============================================
  async createDownload(insertDownload: InsertDownload): Promise<Download> {
    const id = this.nextDownloadId++;
    const download: Download = {
      id,
      ...insertDownload,
      downloadedAt: new Date()
    };
    this.downloads.set(id, download);
    return download;
  }

  async getDownloadById(id: number): Promise<Download | undefined> {
    return this.downloads.get(id);
  }

  async getDownloadsByUser(userId: number, options: PaginationOptions = {}): Promise<PaginatedResult<Download>> {
    const { page = 1, limit = 10 } = options;
    const userDownloads = Array.from(this.downloads.values()).filter(d => d.userId === userId);
    const total = userDownloads.length;
    const start = (page - 1) * limit;
    const data = userDownloads.slice(start, start + limit);
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1
    };
  }

  async getDownloadsByPost(postId: number, options: PaginationOptions = {}): Promise<PaginatedResult<Download>> {
    const { page = 1, limit = 10 } = options;
    const postDownloads = Array.from(this.downloads.values()).filter(d => d.postId === postId);
    const total = postDownloads.length;
    const start = (page - 1) * limit;
    const data = postDownloads.slice(start, start + limit);
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1
    };
  }

  async getTotalDownloadsForPost(postId: number): Promise<number> {
    return Array.from(this.downloads.values()).filter(d => d.postId === postId).length;
  }

  async getRecentDownloads(limit: number = 10): Promise<Download[]> {
    const downloads = Array.from(this.downloads.values())
      .sort((a, b) => b.downloadedAt.getTime() - a.downloadedAt.getTime())
      .slice(0, limit);
    return downloads;
  }

  async getUserDownloadHistory(userId: number, postId: number): Promise<Download[]> {
    return Array.from(this.downloads.values()).filter(d => d.userId === userId && d.postId === postId);
  }

  async checkUserHasDownloaded(userId: number, postId: number): Promise<boolean> {
    return Array.from(this.downloads.values()).some(d => d.userId === userId && d.postId === postId);
  }

  async getDownloadStats(startDate?: Date, endDate?: Date): Promise<{ totalDownloads: number; uniqueUsers: number; topPosts: Array<{postId: number; downloads: number}> }> {
    let downloads = Array.from(this.downloads.values());
    
    if (startDate || endDate) {
      downloads = downloads.filter(d => {
        const downloadTime = d.downloadedAt.getTime();
        if (startDate && endDate) {
          return downloadTime >= startDate.getTime() && downloadTime <= endDate.getTime();
        } else if (startDate) {
          return downloadTime >= startDate.getTime();
        } else if (endDate) {
          return downloadTime <= endDate.getTime();
        }
        return true;
      });
    }
    
    const uniqueUsers = new Set(downloads.map(d => d.userId));
    const postCounts = new Map<number, number>();
    
    downloads.forEach(d => {
      postCounts.set(d.postId, (postCounts.get(d.postId) || 0) + 1);
    });
    
    const topPosts = Array.from(postCounts.entries())
      .map(([postId, downloads]) => ({ postId, downloads }))
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, 10);
    
    return {
      totalDownloads: downloads.length,
      uniqueUsers: uniqueUsers.size,
      topPosts
    };
  }

  async incrementPostDownloadCount(postId: number): Promise<void> {
    const post = this.posts.get(postId);
    if (post) {
      post.downloadCount = (post.downloadCount || 0) + 1;
      this.posts.set(postId, post);
    }
  }

  // ============================================
  // EMAIL NOTIFICATION MANAGEMENT IMPLEMENTATION
  // ============================================
  async createEmailNotification(insertNotification: InsertEmailNotification): Promise<EmailNotification> {
    const id = this.nextEmailNotificationId++;
    const notification: EmailNotification = {
      id,
      ...insertNotification,
      sentAt: new Date(),
      status: insertNotification.status || 'pending'
    };
    this.emailNotifications.set(id, notification);
    return notification;
  }

  async updateEmailNotificationStatus(id: number, status: 'sent' | 'failed', errorMessage?: string): Promise<EmailNotification | undefined> {
    const notification = this.emailNotifications.get(id);
    if (!notification) return undefined;
    notification.status = status;
    if (errorMessage) {
      notification.errorMessage = errorMessage;
    }
    this.emailNotifications.set(id, notification);
    return notification;
  }

  async getEmailNotificationById(id: number): Promise<EmailNotification | undefined> {
    return this.emailNotifications.get(id);
  }

  async getEmailNotificationsByUser(userId: number, options: PaginationOptions = {}): Promise<PaginatedResult<EmailNotification>> {
    const { page = 1, limit = 10 } = options;
    const userNotifications = Array.from(this.emailNotifications.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
    const total = userNotifications.length;
    const start = (page - 1) * limit;
    const data = userNotifications.slice(start, start + limit);
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1
    };
  }

  async getPendingEmailNotifications(limit: number = 100): Promise<EmailNotification[]> {
    return Array.from(this.emailNotifications.values())
      .filter(n => n.status === 'pending')
      .slice(0, limit);
  }

  async getFailedEmailNotifications(limit: number = 100): Promise<EmailNotification[]> {
    return Array.from(this.emailNotifications.values())
      .filter(n => n.status === 'failed')
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
      .slice(0, limit);
  }

  async markEmailAsSent(id: number): Promise<boolean> {
    const notification = this.emailNotifications.get(id);
    if (!notification) return false;
    notification.status = 'sent';
    this.emailNotifications.set(id, notification);
    return true;
  }

  async markEmailAsFailed(id: number, errorMessage: string): Promise<boolean> {
    const notification = this.emailNotifications.get(id);
    if (!notification) return false;
    notification.status = 'failed';
    notification.errorMessage = errorMessage;
    this.emailNotifications.set(id, notification);
    return true;
  }

  async getLastEmailSentToUser(userId: number, emailType?: string): Promise<EmailNotification | undefined> {
    const userNotifications = Array.from(this.emailNotifications.values())
      .filter(n => {
        const matchesUser = n.userId === userId;
        const matchesType = !emailType || n.emailType === emailType;
        return matchesUser && matchesType;
      })
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
    
    return userNotifications[0];
  }

  async getUsersWithEmailPreference(preference: 'subscribeToNewPosts' | 'subscribeToWeeklyDigest'): Promise<User[]> {
    return Array.from(this.users.values()).filter(u => {
      if (preference === 'subscribeToNewPosts') {
        return u.subscribeToNewPosts === true;
      } else if (preference === 'subscribeToWeeklyDigest') {
        return u.subscribeToWeeklyDigest === true;
      }
      return false;
    });
  }

  async updateUserEmailPreferences(userId: number, preferences: { subscribeToNewPosts?: boolean; subscribeToWeeklyDigest?: boolean }): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    if (preferences.subscribeToNewPosts !== undefined) {
      user.subscribeToNewPosts = preferences.subscribeToNewPosts;
    }
    if (preferences.subscribeToWeeklyDigest !== undefined) {
      user.subscribeToWeeklyDigest = preferences.subscribeToWeeklyDigest;
    }
    
    this.users.set(userId, user);
    return user;
  }

  async updateUserLastEmailSentAt(userId: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.lastEmailSentAt = new Date();
      this.users.set(userId, user);
    }
  }

  async getUsersForWeeklyDigest(): Promise<User[]> {
    return Array.from(this.users.values()).filter(u => u.subscribeToWeeklyDigest === true);
  }

  async getUsersForNewPostNotification(): Promise<User[]> {
    return Array.from(this.users.values()).filter(u => u.subscribeToNewPosts === true);
  }

  async setEmailVerificationToken(userId: number, token: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.emailVerificationToken = token;
      this.users.set(userId, user);
    }
  }

  async clearEmailVerificationToken(userId: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.emailVerificationToken = null;
      user.emailVerified = true;
      this.users.set(userId, user);
    }
  }

  async getUserByEmailVerificationToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.emailVerificationToken === token);
  }

  // ============================================
  // UTILITY METHODS
  // ============================================
  async initialize(): Promise<void> {
    // Initialize with sample data if needed
    console.log('Storage initialized');
  }

  generateUuid(): string {
    return randomUUID().replace(/-/g, '').substring(0, 32);
  }

  async hashPassword(password: string): Promise<string> {
    return hashPassword(password);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return comparePassword(password, hash);
  }
}

// Export a singleton instance
export const storage = new MemStorage();