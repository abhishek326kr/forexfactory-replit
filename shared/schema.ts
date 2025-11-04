import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, real, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with comprehensive fields
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: varchar("role").notNull().default("user"), // user, admin, moderator
  avatar: text("avatar"),
  bio: text("bio"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  usernameIdx: index("users_username_idx").on(table.username),
}));

export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
}).extend({
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Categories table with hierarchical support and SEO
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  parentId: varchar("parent_id").references(() => categories.id),
  order: integer("order").default(0),
  // SEO fields
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  seoKeywords: text("seo_keywords"),
  canonicalUrl: text("canonical_url"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  slugIdx: uniqueIndex("categories_slug_idx").on(table.slug),
  parentIdx: index("categories_parent_idx").on(table.parentId),
}));

export const insertCategorySchema = createInsertSchema(categories).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  name: z.string().min(1, "Category name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens"),
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Tags table
export const tags = pgTable("tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  count: integer("count").default(0),
  description: text("description"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  slugIdx: uniqueIndex("tags_slug_idx").on(table.slug),
  countIdx: index("tags_count_idx").on(table.count),
}));

export const insertTagSchema = createInsertSchema(tags).omit({ 
  id: true,
  count: true,
  createdAt: true,
  updatedAt: true
}).extend({
  name: z.string().min(1, "Tag name is required"),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
});

export type InsertTag = z.infer<typeof insertTagSchema>;
export type Tag = typeof tags.$inferSelect;

// Blog posts table with comprehensive SEO fields
export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  featuredImage: text("featured_image"),
  categoryId: varchar("category_id").references(() => categories.id),
  authorId: varchar("author_id").references(() => users.id),
  status: varchar("status").notNull().default("draft"), // draft, published, archived
  published: boolean("published").default(false),
  publishedAt: timestamp("published_at"),
  views: integer("views").default(0),
  readingTime: integer("reading_time"), // in minutes
  // SEO fields
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  seoKeywords: text("seo_keywords"),
  canonicalUrl: text("canonical_url"),
  ogImage: text("og_image"),
  // SEO schema data
  schemaType: varchar("schema_type").default("Article"), // Article, NewsArticle, BlogPosting
  structuredData: jsonb("structured_data"), // Additional JSON-LD data
  // Timestamps
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  slugIdx: uniqueIndex("posts_slug_idx").on(table.slug),
  publishedIdx: index("posts_published_idx").on(table.published),
  publishedAtIdx: index("posts_published_at_idx").on(table.publishedAt),
  categoryIdx: index("posts_category_idx").on(table.categoryId),
  authorIdx: index("posts_author_idx").on(table.authorId),
  viewsIdx: index("posts_views_idx").on(table.views),
}));

export const insertPostSchema = createInsertSchema(posts).omit({ 
  id: true,
  views: true,
  createdAt: true,
  updatedAt: true
}).extend({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  content: z.string().min(1, "Content is required"),
  readingTime: z.number().optional(),
});

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;

// Post Tags junction table
export const postTags = pgTable("post_tags", {
  postId: varchar("post_id").notNull().references(() => posts.id),
  tagId: varchar("tag_id").notNull().references(() => tags.id),
}, (table) => ({
  pk: uniqueIndex("post_tags_pk").on(table.postId, table.tagId),
  postIdx: index("post_tags_post_idx").on(table.postId),
  tagIdx: index("post_tags_tag_idx").on(table.tagId),
}));

// Downloads/Expert Advisors table with comprehensive fields
export const downloads = pgTable("downloads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  version: text("version").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: text("file_size"),
  compatibility: text("compatibility"), // MT4 1.4+, MT5 2.0+, etc
  platform: text("platform").notNull(), // MT4, MT5, Both
  strategy: text("strategy"), // Scalping, Trend, Grid, etc
  categoryId: varchar("category_id").references(() => categories.id),
  downloadCount: integer("download_count").default(0),
  rating: real("rating").default(0),
  status: varchar("status").notNull().default("active"), // active, inactive
  isPremium: boolean("is_premium").default(false),
  featuredImage: text("featured_image"),
  screenshots: text("screenshots").array(),
  requirements: text("requirements"),
  features: text("features").array(),
  // SEO fields
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  seoKeywords: text("seo_keywords"),
  canonicalUrl: text("canonical_url"),
  ogImage: text("og_image"),
  // Performance metrics
  winRate: real("win_rate"),
  profitFactor: real("profit_factor"),
  maxDrawdown: real("max_drawdown"),
  // SEO schema data
  structuredData: jsonb("structured_data"), // SoftwareApplication schema
  // Timestamps
  publishedAt: timestamp("published_at").default(sql`CURRENT_TIMESTAMP`),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  slugIdx: uniqueIndex("downloads_slug_idx").on(table.slug),
  platformIdx: index("downloads_platform_idx").on(table.platform),
  strategyIdx: index("downloads_strategy_idx").on(table.strategy),
  categoryIdx: index("downloads_category_idx").on(table.categoryId),
  downloadCountIdx: index("downloads_count_idx").on(table.downloadCount),
  ratingIdx: index("downloads_rating_idx").on(table.rating),
  isPremiumIdx: index("downloads_premium_idx").on(table.isPremium),
}));

export const insertDownloadSchema = createInsertSchema(downloads).omit({ 
  id: true,
  downloadCount: true,
  rating: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true
}).extend({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().min(1, "Description is required"),
  version: z.string().min(1, "Version is required"),
  fileUrl: z.string().url("Invalid file URL"),
  platform: z.enum(["MT4", "MT5", "Both"]),
  isPremium: z.boolean().optional(),
});

export type InsertDownload = z.infer<typeof insertDownloadSchema>;
export type Download = typeof downloads.$inferSelect;

// Comments table for posts
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => posts.id),
  parentId: varchar("parent_id").references(() => comments.id),
  userId: varchar("user_id").references(() => users.id),
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email").notNull(),
  content: text("content").notNull(),
  approved: boolean("approved").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  postIdx: index("comments_post_idx").on(table.postId),
  approvedIdx: index("comments_approved_idx").on(table.approved),
  parentIdx: index("comments_parent_idx").on(table.parentId),
}));

export const insertCommentSchema = createInsertSchema(comments).omit({ 
  id: true,
  approved: true,
  createdAt: true,
  updatedAt: true
}).extend({
  authorName: z.string().min(1, "Author name is required"),
  authorEmail: z.string().email("Invalid email"),
  content: z.string().min(1, "Comment content is required"),
});

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

// Analytics table for tracking
export const analytics = pgTable("analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventType: varchar("event_type").notNull(), // pageView, downloadEvent, searchQuery
  pageUrl: text("page_url"),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  userId: varchar("user_id").references(() => users.id),
  sessionId: text("session_id"),
  // Event specific data
  downloadId: varchar("download_id").references(() => downloads.id),
  postId: varchar("post_id").references(() => posts.id),
  searchQuery: text("search_query"),
  searchResultsCount: integer("search_results_count"),
  // Additional data
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  eventTypeIdx: index("analytics_event_type_idx").on(table.eventType),
  userIdx: index("analytics_user_idx").on(table.userId),
  sessionIdx: index("analytics_session_idx").on(table.sessionId),
  createdAtIdx: index("analytics_created_at_idx").on(table.createdAt),
}));

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({ 
  id: true,
  createdAt: true
}).extend({
  eventType: z.enum(["pageView", "downloadEvent", "searchQuery"]),
});

export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Analytics = typeof analytics.$inferSelect;

// Newsletter subscribers (enhanced)
export const newsletter = pgTable("newsletter", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name"),
  preferences: jsonb("preferences"), // { categories: [], frequency: 'weekly' }
  isActive: boolean("is_active").default(true),
  confirmationToken: text("confirmation_token"),
  confirmedAt: timestamp("confirmed_at"),
  subscribedAt: timestamp("subscribed_at").default(sql`CURRENT_TIMESTAMP`),
  unsubscribedAt: timestamp("unsubscribed_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  emailIdx: uniqueIndex("newsletter_email_idx").on(table.email),
  activeIdx: index("newsletter_active_idx").on(table.isActive),
  confirmedIdx: index("newsletter_confirmed_idx").on(table.confirmedAt),
}));

export const insertNewsletterSchema = createInsertSchema(newsletter).omit({ 
  id: true,
  subscribedAt: true,
  unsubscribedAt: true,
  createdAt: true,
  updatedAt: true,
  confirmedAt: true,
  confirmationToken: true
}).extend({
  email: z.string().email("Invalid email address"),
  name: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type InsertNewsletter = z.infer<typeof insertNewsletterSchema>;
export type Newsletter = typeof newsletter.$inferSelect;

// Pages table for static pages
export const pages = pgTable("pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  template: varchar("template").default("default"), // default, landing, contact
  status: varchar("status").notNull().default("published"),
  // SEO fields
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  seoKeywords: text("seo_keywords"),
  canonicalUrl: text("canonical_url"),
  ogImage: text("og_image"),
  robots: text("robots"), // index,follow or noindex,nofollow
  priority: real("priority").default(0.5), // Sitemap priority
  structuredData: jsonb("structured_data"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  slugIdx: uniqueIndex("pages_slug_idx").on(table.slug),
  statusIdx: index("pages_status_idx").on(table.status),
}));

export const insertPageSchema = createInsertSchema(pages).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  content: z.string().min(1, "Content is required"),
  status: z.enum(["draft", "published", "archived"]).optional(),
});

export type InsertPage = z.infer<typeof insertPageSchema>;
export type Page = typeof pages.$inferSelect;

// Reviews/Ratings table
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  downloadId: varchar("download_id").references(() => downloads.id),
  userId: varchar("user_id").references(() => users.id),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  helpful: integer("helpful").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  downloadIdx: index("reviews_download_idx").on(table.downloadId),
  userIdx: index("reviews_user_idx").on(table.userId),
  ratingIdx: index("reviews_rating_idx").on(table.rating),
}));

export const insertReviewSchema = createInsertSchema(reviews).omit({ 
  id: true,
  helpful: true,
  createdAt: true,
  updatedAt: true
}).extend({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

// FAQ table
export const faqs = pgTable("faqs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: text("category"),
  order: integer("order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  categoryIdx: index("faqs_category_idx").on(table.category),
  orderIdx: index("faqs_order_idx").on(table.order),
  activeIdx: index("faqs_active_idx").on(table.isActive),
}));

export const insertFaqSchema = createInsertSchema(faqs).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
});

export type InsertFaq = z.infer<typeof insertFaqSchema>;
export type Faq = typeof faqs.$inferSelect;