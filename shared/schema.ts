import { sql } from "drizzle-orm";
import { 
  mysqlTable, 
  varchar, 
  int, 
  text, 
  timestamp, 
  mysqlEnum, 
  boolean, 
  datetime,
  tinyint,
  index,
  uniqueIndex,
  primaryKey,
  decimal
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================
// ENUMS
// ============================================

// Admin roles enum
export const adminRoleEnum = mysqlEnum('role', ['admin', 'editor']);

// Blog status enum  
export const blogStatusEnum = mysqlEnum('status', ['published', 'draft', 'archived']);

// Category status enum
export const categoryStatusEnum = mysqlEnum('status', ['active', 'inactive']);

// Post status enum
export const postStatusEnum = mysqlEnum('status', ['draft', 'published']);

// Meta robots enum
export const metaRobotsEnum = mysqlEnum('meta_robots', [
  'index, follow',
  'noindex, follow', 
  'index, nofollow',
  'noindex, nofollow'
]);

// User roles enum - extended with more roles
export const userRoleEnum = mysqlEnum('role', ['viewer', 'user', 'editor', 'moderator', 'admin', 'super_admin']);

// Signal platform enum
export const signalPlatformEnum = mysqlEnum('platform', ['MT4', 'MT5', 'Both']);

// Signal strategy enum
export const signalStrategyEnum = mysqlEnum('strategy', [
  'scalping',
  'trend_following', 
  'hedging',
  'grid',
  'martingale',
  'breakout',
  'range_trading',
  'news_trading'
]);

// Comment status enum
export const commentStatusEnum = mysqlEnum('status', ['pending', 'approved', 'spam', 'deleted']);

// ============================================
// TABLES
// ============================================

// Admins table
export const admins = mysqlTable('admins', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  phone: varchar('phone', { length: 15 }),
  password: varchar('password', { length: 255 }).notNull(),
  role: adminRoleEnum.default('editor'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  profilePic: varchar('profile_pic', { length: 255 }),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

// Blogs table
export const blogs = mysqlTable('blogs', {
  id: int('id').autoincrement().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  seoSlug: varchar('seo_slug', { length: 255 }).notNull(),
  status: blogStatusEnum.notNull().default('draft'),
  views: int('views').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  content: text('content').notNull(),
  author: varchar('author', { length: 255 }).notNull(),
  featuredImage: varchar('featured_image', { length: 255 }).notNull(),
  tags: varchar('tags', { length: 255 }).notNull(),
  categoryId: int('category_id').notNull(),
  downloadLink: varchar('download_link', { length: 255 }),
  // Download-related fields
  hasDownload: boolean('has_download').default(false),
  downloadTitle: text('download_title'),
  downloadDescription: text('download_description'),
  downloadFileName: text('download_file_name'),
  downloadFileUrl: text('download_file_url'),
  downloadFileSize: text('download_file_size'),
  downloadVersion: text('download_version'),
  downloadType: text('download_type'), // EA, Indicator, Template, Tool, or Other
  downloadCount: int('download_count').default(0),
  requiresLogin: boolean('requires_login').default(true)
});

// Categories table
export const categories = mysqlTable('categories', {
  categoryId: int('category_id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  description: text('description'),
  status: categoryStatusEnum.default('active'),
  parentId: int('parent_id'), // For hierarchical categories
  slug: varchar('slug', { length: 255 }), // For SEO-friendly URLs
  metaTitle: varchar('meta_title', { length: 255 }),
  metaDescription: text('meta_description'),
  order: int('order').default(0)
});

// Blog Categories junction table
export const blogCategories = mysqlTable('blog_categories', {
  blogId: int('blog_id').notNull().references(() => blogs.id, { onDelete: 'cascade' }),
  categoryId: int('category_id').notNull().references(() => categories.categoryId, { onDelete: 'cascade' })
}, (table) => ({
  pk: primaryKey({ columns: [table.blogId, table.categoryId] }),
}));

// Comments table
export const comments = mysqlTable('comments', {
  id: int('id').autoincrement().primaryKey(),
  postId: int('post_id').notNull().references(() => blogs.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  comment: text('comment').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  status: commentStatusEnum.default('pending'),
  parentId: int('parent_id'), // For nested comments
  userId: int('user_id'), // If registered user
  approved: boolean('approved').default(false)
});

// Media table
export const media = mysqlTable('media', {
  id: int('id').autoincrement().primaryKey(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 255 }).notNull(),
  uploadedBy: int('uploaded_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
  fileType: varchar('file_type', { length: 100 }),
  fileSize: int('file_size'),
  altText: varchar('alt_text', { length: 255 })
});

// Password Reset Tokens table
export const passwordResetTokens = mysqlTable('password_reset_tokens', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').notNull(),
  token: varchar('token', { length: 64 }).notNull(),
  expiresAt: datetime('expires_at').notNull(),
  used: tinyint('used').default(0),
  createdAt: timestamp('created_at').defaultNow()
});

// Posts table (separate from blogs for different content types)
export const posts = mysqlTable('posts', {
  id: int('id').autoincrement().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  content: text('content').notNull(),
  image: varchar('image', { length: 255 }),
  authorId: int('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  category: varchar('category', { length: 100 }),
  featuredImage: varchar('featured_image', { length: 255 }),
  status: postStatusEnum.default('draft'),
  metaTitle: varchar('meta_title', { length: 255 }),
  metaDescription: text('meta_description'),
  metaKeywords: text('meta_keywords'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  // Download-related fields
  hasDownload: boolean('has_download').default(false),
  downloadTitle: text('download_title'),
  downloadDescription: text('download_description'),
  downloadFileName: text('download_file_name'),
  downloadFileUrl: text('download_file_url'),
  downloadFileSize: text('download_file_size'),
  downloadVersion: text('download_version'),
  downloadType: text('download_type'), // EA, Indicator, Template, Tool, or Other
  downloadCount: int('download_count').default(0),
  requiresLogin: boolean('requires_login').default(true)
});

// SEO Meta table
export const seoMeta = mysqlTable('seo_meta', {
  id: int('id').autoincrement().primaryKey(),
  postId: int('post_id').notNull().references(() => blogs.id, { onDelete: 'cascade' }),
  seoTitle: varchar('seo_title', { length: 255 }),
  seoDescription: text('seo_description'),
  seoKeywords: text('seo_keywords'),
  seoSlug: varchar('seo_slug', { length: 255 }),
  canonicalUrl: varchar('canonical_url', { length: 255 }),
  metaRobots: metaRobotsEnum.default('index, follow'),
  ogTitle: varchar('og_title', { length: 255 }),
  ogDescription: text('og_description'),
  ogImage: varchar('og_image', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  schemaType: varchar('schema_type', { length: 50 }).default('Article'),
  twitterCard: varchar('twitter_card', { length: 50 }).default('summary_large_image')
}, (table) => ({
  postIdIdx: index('post_id_idx').on(table.postId),
}));

// Signals table (for Expert Advisors/Trading Signals)
export const signals = mysqlTable('signals', {
  id: int('id').autoincrement().primaryKey(),
  uuid: varchar('uuid', { length: 32 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  mime: varchar('mime', { length: 100 }).notNull(),
  sizeBytes: int('size_bytes').notNull(),
  createdAt: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  // Extended fields for EA management
  platform: signalPlatformEnum.default('Both'),
  strategy: signalStrategyEnum,
  version: varchar('version', { length: 20 }),
  downloadCount: int('download_count').default(0),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0.00'),
  isPremium: boolean('is_premium').default(false),
  price: decimal('price', { precision: 10, scale: 2 }),
  compatibility: varchar('compatibility', { length: 255 }), // MT4 versions, MT5 versions
  winRate: decimal('win_rate', { precision: 5, scale: 2 }),
  profitFactor: decimal('profit_factor', { precision: 10, scale: 2 }),
  maxDrawdown: decimal('max_drawdown', { precision: 5, scale: 2 }),
  screenshots: text('screenshots'), // JSON array of screenshot URLs
  requirements: text('requirements'),
  features: text('features'), // JSON array of features
  authorId: int('author_id'),
  categoryId: int('category_id'),
  status: varchar('status', { length: 20 }).default('active')
}, (table) => ({
  createdAtIdx: index('created_at_idx').on(table.createdAt),
  platformIdx: index('platform_idx').on(table.platform),
  strategyIdx: index('strategy_idx').on(table.strategy)
}));

// Users table
export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: userRoleEnum.default('viewer'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  phone: varchar('phone', { length: 20 }),
  name: varchar('name', { length: 255 }),
  countryCode: varchar('country_code', { length: 10 }).default('+91'),
  country: varchar('country', { length: 50 }).default('IN'),
  // Extended fields
  username: varchar('username', { length: 50 }).unique(),
  avatar: varchar('avatar', { length: 255 }),
  bio: text('bio'),
  subscriptionStatus: varchar('subscription_status', { length: 20 }).default('free'),
  subscriptionEndDate: datetime('subscription_end_date'),
  lastLogin: datetime('last_login'),
  emailVerified: boolean('email_verified').default(false),
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  // Email notification preferences
  emailVerificationToken: text('email_verification_token'),
  subscribeToNewPosts: boolean('subscribe_to_new_posts').default(true),
  subscribeToWeeklyDigest: boolean('subscribe_to_weekly_digest').default(false),
  lastEmailSentAt: timestamp('last_email_sent_at')
});

// Downloads tracking table
export const downloads = mysqlTable('downloads', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: int('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  downloadedAt: timestamp('downloaded_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent')
}, (table) => ({
  userIdIdx: index('user_id_idx').on(table.userId),
  postIdIdx: index('post_id_idx').on(table.postId),
  downloadedAtIdx: index('downloaded_at_idx').on(table.downloadedAt)
}));

// Email Notifications table
export const emailNotifications = mysqlTable('email_notifications', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  emailType: varchar('email_type', { length: 50 }).notNull(), // "welcome", "new_post", "weekly_digest"
  postId: int('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  sentAt: timestamp('sent_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // "sent", "failed", "pending"
  errorMessage: text('error_message')
}, (table) => ({
  userIdIdx: index('user_id_idx').on(table.userId),
  emailTypeIdx: index('email_type_idx').on(table.emailType),
  sentAtIdx: index('sent_at_idx').on(table.sentAt)
}));

// Pages table (for static content)
export const pages = mysqlTable('pages', {
  id: int('id').autoincrement().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  content: text('content').notNull(),
  metaTitle: varchar('meta_title', { length: 255 }),
  metaDescription: text('meta_description'),
  metaKeywords: text('meta_keywords'),
  status: varchar('status', { length: 20 }).default('published'),
  template: varchar('template', { length: 50 }).default('default'),
  parentId: int('parent_id'),
  order: int('order').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
});

// ============================================
// SCHEMAS AND TYPES
// ============================================

// Admin schemas
export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional()
});

export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = typeof admins.$inferSelect;

// Blog schemas
export const insertBlogSchema = createInsertSchema(blogs).omit({
  id: true,
  createdAt: true,
  views: true
}).extend({
  title: z.string().min(1, "Title is required").max(255),
  seoSlug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens"),
  content: z.string().min(1, "Content is required"),
  author: z.string().min(1, "Author is required"),
  featuredImage: z.string().url("Invalid image URL"),
  tags: z.string(),
  categoryId: z.number().positive(),
  downloadLink: z.string().url().optional(),
  status: z.enum(['published', 'draft', 'archived']).optional()
});

export type InsertBlog = z.infer<typeof insertBlogSchema>;
export type Blog = typeof blogs.$inferSelect;

// Category schemas
export const insertCategorySchema = createInsertSchema(categories).omit({
  categoryId: true
}).extend({
  name: z.string().min(1, "Category name is required").max(255),
  description: z.string().optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Invalid slug format").optional(),
  parentId: z.number().positive().optional(),
  order: z.number().optional(),
  status: z.enum(['active', 'inactive']).optional()
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Comment schemas
export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  approved: true
}).extend({
  postId: z.number().positive(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  comment: z.string().min(1, "Comment is required"),
  parentId: z.number().positive().optional(),
  userId: z.number().positive().optional(),
  status: z.enum(['pending', 'approved', 'spam', 'deleted']).optional()
});

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

// Media schemas
export const insertMediaSchema = createInsertSchema(media).omit({
  id: true,
  uploadedAt: true
}).extend({
  fileName: z.string().min(1, "File name is required"),
  filePath: z.string().min(1, "File path is required"),
  uploadedBy: z.number().positive(),
  fileType: z.string().optional(),
  fileSize: z.number().positive().optional(),
  altText: z.string().optional()
});

export type InsertMedia = z.infer<typeof insertMediaSchema>;
export type Media = typeof media.$inferSelect;

// SEO Meta schemas
export const insertSeoMetaSchema = createInsertSchema(seoMeta).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  postId: z.number().positive(),
  seoTitle: z.string().max(255).optional(),
  seoDescription: z.string().max(160, "SEO description should be under 160 characters").optional(),
  seoKeywords: z.string().optional(),
  seoSlug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  canonicalUrl: z.string().url().optional(),
  ogTitle: z.string().max(255).optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().url().optional(),
  metaRobots: z.enum(['index, follow', 'noindex, follow', 'index, nofollow', 'noindex, nofollow']).optional()
});

export type InsertSeoMeta = z.infer<typeof insertSeoMetaSchema>;
export type SeoMeta = typeof seoMeta.$inferSelect;

// Signal schemas (Expert Advisors)
export const insertSignalSchema = createInsertSchema(signals).omit({
  id: true,
  createdAt: true
}).extend({
  uuid: z.string().length(32, "UUID must be 32 characters"),
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().min(1, "Description is required"),
  filePath: z.string().min(1, "File path is required").max(500),
  mime: z.string().min(1, "MIME type is required"),
  sizeBytes: z.number().positive("File size must be positive"),
  platform: z.enum(['MT4', 'MT5', 'Both']).optional(),
  strategy: z.enum([
    'scalping',
    'trend_following', 
    'hedging',
    'grid',
    'martingale',
    'breakout',
    'range_trading',
    'news_trading'
  ]).optional(),
  version: z.string().optional(),
  isPremium: z.boolean().optional(),
  price: z.number().positive().optional(),
  compatibility: z.string().optional(),
  winRate: z.number().min(0).max(100).optional(),
  profitFactor: z.number().positive().optional(),
  maxDrawdown: z.number().min(0).max(100).optional(),
  screenshots: z.string().optional(),
  requirements: z.string().optional(),
  features: z.string().optional(),
  authorId: z.number().positive().optional(),
  categoryId: z.number().positive().optional()
});

export type InsertSignal = z.infer<typeof insertSignalSchema>;
export type Signal = typeof signals.$inferSelect;

// User schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  emailVerified: true,
  twoFactorEnabled: true,
  lastEmailSentAt: true
}).extend({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().optional(),
  phone: z.string().optional(),
  countryCode: z.string().default('+91'),
  country: z.string().default('IN'),
  username: z.string().min(3).max(50).optional(),
  bio: z.string().optional(),
  role: z.enum(['viewer', 'user', 'editor', 'moderator', 'admin', 'super_admin']).optional(),
  subscriptionStatus: z.enum(['free', 'basic', 'premium', 'enterprise']).optional(),
  // Email preferences
  emailVerificationToken: z.string().optional(),
  subscribeToNewPosts: z.boolean().optional(),
  subscribeToWeeklyDigest: z.boolean().optional()
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Post schemas (separate from blogs)
export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  downloadCount: true
}).extend({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  content: z.string().min(1, "Content is required"),
  authorId: z.number().positive(),
  image: z.string().url().optional(),
  category: z.string().optional(),
  featuredImage: z.string().url().optional(),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
  status: z.enum(['draft', 'published']).optional(),
  // Download-related fields
  hasDownload: z.boolean().optional(),
  downloadTitle: z.string().optional(),
  downloadDescription: z.string().optional(),
  downloadFileName: z.string().optional(),
  downloadFileUrl: z.string().optional(),
  downloadFileSize: z.string().optional(),
  downloadVersion: z.string().optional(),
  downloadType: z.string().optional(),
  requiresLogin: z.boolean().optional()
});

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;

// Page schemas
export const insertPageSchema = createInsertSchema(pages).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  content: z.string().min(1, "Content is required"),
  template: z.string().optional(),
  parentId: z.number().positive().optional(),
  order: z.number().optional(),
  status: z.string().optional()
});

export type InsertPage = z.infer<typeof insertPageSchema>;
export type Page = typeof pages.$inferSelect;

// Downloads schemas
export const insertDownloadSchema = createInsertSchema(downloads).omit({
  id: true,
  downloadedAt: true
}).extend({
  userId: z.number().positive(),
  postId: z.number().positive(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional()
});

export type InsertDownload = z.infer<typeof insertDownloadSchema>;
export type Download = typeof downloads.$inferSelect;

// Email Notifications schemas
export const insertEmailNotificationSchema = createInsertSchema(emailNotifications).omit({
  id: true,
  sentAt: true
}).extend({
  userId: z.number().positive(),
  emailType: z.enum(['welcome', 'new_post', 'weekly_digest']),
  postId: z.number().positive().optional(),
  status: z.enum(['sent', 'failed', 'pending']).default('pending'),
  errorMessage: z.string().optional()
});

export type InsertEmailNotification = z.infer<typeof insertEmailNotificationSchema>;
export type EmailNotification = typeof emailNotifications.$inferSelect;

// ============================================
// ADDITIONAL TYPES AND ENUMS
// ============================================

// Status enums as TypeScript types for use in application logic
export type BlogStatus = 'draft' | 'published' | 'archived';
export type UserRole = 'viewer' | 'user' | 'editor' | 'moderator' | 'admin' | 'super_admin';
export type AdminRole = 'admin' | 'editor';
export type SignalPlatform = 'MT4' | 'MT5' | 'Both';
export type SignalStrategy = 'scalping' | 'trend_following' | 'hedging' | 'grid' | 'martingale' | 'breakout' | 'range_trading' | 'news_trading';
export type CommentStatus = 'pending' | 'approved' | 'spam' | 'deleted';
export type CategoryStatus = 'active' | 'inactive';
export type SubscriptionStatus = 'free' | 'basic' | 'premium' | 'enterprise';

// Pagination types
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
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Filter types for complex queries
export interface BlogFilters {
  status?: BlogStatus;
  categoryId?: number;
  authorId?: number;
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
}

export interface SignalFilters {
  platform?: SignalPlatform;
  strategy?: SignalStrategy;
  isPremium?: boolean;
  minRating?: number;
  categoryId?: number;
}

export interface UserFilters {
  role?: UserRole;
  subscriptionStatus?: SubscriptionStatus;
  country?: string;
  emailVerified?: boolean;
}

// Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// SEO structured data types
export interface StructuredData {
  '@context': string;
  '@type': string;
  [key: string]: any;
}