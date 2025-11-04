import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: varchar("role").notNull().default("user"), // user, admin
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Categories table
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  // SEO fields
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  seoKeywords: text("seo_keywords"),
  canonicalUrl: text("canonical_url"),
});

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Blog posts table
export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  featuredImage: text("featured_image"),
  categoryId: varchar("category_id").references(() => categories.id),
  authorId: varchar("author_id").references(() => users.id),
  status: varchar("status").notNull().default("draft"), // draft, published
  publishedAt: timestamp("published_at"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
  // SEO fields
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  seoKeywords: text("seo_keywords"),
  canonicalUrl: text("canonical_url"),
  ogImage: text("og_image"),
  readTime: integer("read_time"), // in minutes
  // SEO schema data
  schemaType: varchar("schema_type").default("Article"), // Article, NewsArticle, BlogPosting
  structuredData: jsonb("structured_data"), // Additional JSON-LD data
});

export const insertPostSchema = createInsertSchema(posts).omit({ id: true, updatedAt: true });
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;

// Downloads/Expert Advisors table
export const downloads = pgTable("downloads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  version: text("version").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: text("file_size"),
  platform: text("platform").notNull(), // MT4, MT5, Both
  categoryId: varchar("category_id").references(() => categories.id),
  downloadCount: integer("download_count").default(0),
  status: varchar("status").notNull().default("active"), // active, inactive
  featuredImage: text("featured_image"),
  screenshots: text("screenshots").array(),
  requirements: text("requirements"),
  features: text("features").array(),
  publishedAt: timestamp("published_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
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
});

export const insertDownloadSchema = createInsertSchema(downloads).omit({ id: true, downloadCount: true, publishedAt: true, updatedAt: true });
export type InsertDownload = z.infer<typeof insertDownloadSchema>;
export type Download = typeof downloads.$inferSelect;

// Reviews/Ratings table
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  downloadId: varchar("download_id").references(() => downloads.id),
  userId: varchar("user_id").references(() => users.id),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  helpful: integer("helpful").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, helpful: true, createdAt: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

// Pages table (for static pages like About, Contact, etc.)
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
});

export const insertPageSchema = createInsertSchema(pages).omit({ id: true });
export type InsertPage = z.infer<typeof insertPageSchema>;
export type Page = typeof pages.$inferSelect;

// FAQ table
export const faqs = pgTable("faqs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: text("category"),
  order: integer("order").default(0),
  isActive: boolean("is_active").default(true),
});

export const insertFaqSchema = createInsertSchema(faqs).omit({ id: true });
export type InsertFaq = z.infer<typeof insertFaqSchema>;
export type Faq = typeof faqs.$inferSelect;

// Newsletter subscribers
export const subscribers = pgTable("subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  isActive: boolean("is_active").default(true),
  subscribedAt: timestamp("subscribed_at").default(sql`CURRENT_TIMESTAMP`),
  unsubscribedAt: timestamp("unsubscribed_at"),
});

export const insertSubscriberSchema = createInsertSchema(subscribers).omit({ id: true, subscribedAt: true, unsubscribedAt: true });
export type InsertSubscriber = z.infer<typeof insertSubscriberSchema>;
export type Subscriber = typeof subscribers.$inferSelect;
