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
  type BlogStatus,
  type UserRole,
  type AdminRole,
  type SignalPlatform,
  type SignalStrategy,
  type CommentStatus,
  type CategoryStatus,
  type PaginationOptions,
  type PaginatedResult,
  type BlogFilters,
  type SignalFilters,
  type UserFilters
} from "@shared/schema";
import { IStorage } from "./storage";
import { prisma } from "./db";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";

// Helper functions for password hashing
const SALT_ROUNDS = 10;

const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// Helper function to build pagination result
function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page < Math.ceil(total / limit),
    hasPreviousPage: page > 1
  };
}

// Helper function to handle Prisma errors
function handlePrismaError(error: any): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle known Prisma errors
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        throw new Error(`A record with this ${error.meta?.target} already exists`);
      case 'P2003':
        // Foreign key constraint violation
        throw new Error(`Referenced record does not exist: ${error.meta?.field_name}`);
      case 'P2025':
        // Record not found
        throw new Error('Record not found');
      default:
        throw new Error(`Database error: ${error.message}`);
    }
  }
  
  console.error('Unexpected database error:', error);
  throw new Error('An unexpected database error occurred');
}

// Prisma Storage Implementation
export class PrismaStorage implements IStorage {
  // ============================================
  // ADMIN MANAGEMENT
  // ============================================
  async createAdmin(insertAdmin: InsertAdmin): Promise<Admin> {
    try {
      const hashedPassword = await hashPassword(insertAdmin.password);
      const admin = await prisma.admin.create({
        data: {
          ...insertAdmin,
          password: hashedPassword,
          role: insertAdmin.role || 'editor'
        }
      });
      return admin as Admin;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getAdmin(id: number): Promise<Admin | undefined> {
    try {
      const admin = await prisma.admin.findUnique({
        where: { id }
      });
      return admin as Admin | null || undefined;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    try {
      const admin = await prisma.admin.findUnique({
        where: { email }
      });
      return admin as Admin | null || undefined;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    try {
      const admin = await prisma.admin.findUnique({
        where: { username }
      });
      return admin as Admin | null || undefined;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async authenticateAdmin(username: string, password: string): Promise<Admin | undefined> {
    try {
      const admin = await prisma.admin.findFirst({
        where: {
          OR: [
            { username },
            { email: username }
          ]
        }
      });
      
      if (!admin) return undefined;
      
      const valid = await comparePassword(password, admin.password);
      return valid ? admin as Admin : undefined;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async updateAdmin(id: number, data: Partial<InsertAdmin>): Promise<Admin | undefined> {
    try {
      const updateData: any = { ...data };
      if (data.password) {
        updateData.password = await hashPassword(data.password);
      }
      
      const admin = await prisma.admin.update({
        where: { id },
        data: updateData
      });
      return admin as Admin;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return undefined;
      }
      handlePrismaError(error);
    }
  }

  async deleteAdmin(id: number): Promise<boolean> {
    try {
      await prisma.admin.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return false;
      }
      handlePrismaError(error);
    }
  }

  async getAllAdmins(options: PaginationOptions = {}): Promise<PaginatedResult<Admin>> {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
      const skip = (page - 1) * limit;
      
      const [data, total] = await prisma.$transaction([
        prisma.admin.findMany({
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder }
        }),
        prisma.admin.count()
      ]);
      
      return buildPaginatedResult(data as Admin[], total, page, limit);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getAdminsByRole(role: AdminRole, options: PaginationOptions = {}): Promise<PaginatedResult<Admin>> {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
      const skip = (page - 1) * limit;
      
      const [data, total] = await prisma.$transaction([
        prisma.admin.findMany({
          where: { role },
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder }
        }),
        prisma.admin.count({
          where: { role }
        })
      ]);
      
      return buildPaginatedResult(data as Admin[], total, page, limit);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  // ============================================
  // USER MANAGEMENT
  // ============================================
  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const hashedPassword = await hashPassword(insertUser.password);
      const user = await prisma.user.create({
        data: {
          ...insertUser,
          password: hashedPassword,
          role: insertUser.role || 'viewer',
          emailVerified: false,
          twoFactorEnabled: false
        }
      });
      return user as User;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      const user = await prisma.user.findUnique({
        where: { id }
      });
      return user as User | null || undefined;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const user = await prisma.user.findUnique({
        where: { email }
      });
      return user as User | null || undefined;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const user = await prisma.user.findUnique({
        where: { username }
      });
      return user as User | null || undefined;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async authenticateUser(email: string, password: string): Promise<User | undefined> {
    try {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { username: email }
          ]
        }
      });
      
      if (!user) return undefined;
      
      const valid = await comparePassword(password, user.password);
      if (valid) {
        await this.updateLastLogin(user.id);
      }
      return valid ? user as User : undefined;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async updateUserProfile(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const updateData: any = { ...data };
      if (data.password) {
        updateData.password = await hashPassword(data.password);
      }
      
      const user = await prisma.user.update({
        where: { id },
        data: updateData
      });
      return user as User;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return undefined;
      }
      handlePrismaError(error);
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return false;
      }
      handlePrismaError(error);
    }
  }

  async getAllUsers(options: PaginationOptions = {}, filters?: UserFilters): Promise<PaginatedResult<User>> {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
      const skip = (page - 1) * limit;
      
      const where: any = {};
      if (filters) {
        if (filters.role) where.role = filters.role;
        if (filters.subscriptionStatus) where.subscriptionStatus = filters.subscriptionStatus;
        if (filters.country) where.country = filters.country;
        if (filters.emailVerified !== undefined) where.emailVerified = filters.emailVerified;
      }
      
      const [data, total] = await prisma.$transaction([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder }
        }),
        prisma.user.count({ where })
      ]);
      
      return buildPaginatedResult(data as User[], total, page, limit);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getUsersByRole(role: UserRole, options: PaginationOptions = {}): Promise<PaginatedResult<User>> {
    return this.getAllUsers(options, { role });
  }

  async updateUserSubscription(id: number, status: string, endDate?: Date): Promise<User | undefined> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          subscriptionStatus: status,
          subscriptionEndDate: endDate || null
        }
      });
      return user as User;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return undefined;
      }
      handlePrismaError(error);
    }
  }

  async updateLastLogin(id: number): Promise<void> {
    try {
      await prisma.user.update({
        where: { id },
        data: { lastLogin: new Date() }
      });
    } catch (error) {
      // Silently fail if user not found
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return;
      }
      handlePrismaError(error);
    }
  }

  async verifyUserEmail(id: number): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id },
        data: { emailVerified: true }
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return false;
      }
      handlePrismaError(error);
    }
  }

  // ============================================
  // BLOG MANAGEMENT
  // ============================================
  async createBlog(insertBlog: InsertBlog): Promise<Blog> {
    try {
      const blog = await prisma.blog.create({
        data: {
          ...insertBlog,
          status: insertBlog.status || 'draft',
          views: 0
        }
      });
      return blog as Blog;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async updateBlog(id: number, data: Partial<InsertBlog>): Promise<Blog | undefined> {
    try {
      const blog = await prisma.blog.update({
        where: { id },
        data
      });
      return blog as Blog;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return undefined;
      }
      handlePrismaError(error);
    }
  }

  async deleteBlog(id: number): Promise<boolean> {
    try {
      await prisma.blog.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return false;
      }
      handlePrismaError(error);
    }
  }

  async getBlogById(id: number): Promise<Blog | undefined> {
    try {
      const blog = await prisma.blog.findUnique({
        where: { id }
      });
      return blog as Blog | null || undefined;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getBlogBySlug(slug: string): Promise<Blog | undefined> {
    try {
      const blog = await prisma.blog.findFirst({
        where: { seoSlug: slug }
      });
      return blog as Blog | null || undefined;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getAllBlogs(options: PaginationOptions = {}, filters?: BlogFilters): Promise<PaginatedResult<Blog>> {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
      const skip = (page - 1) * limit;
      
      const where: any = {};
      if (filters) {
        if (filters.status) where.status = filters.status;
        if (filters.categoryId) where.categoryId = filters.categoryId;
        if (filters.tags && filters.tags.length > 0) {
          where.OR = filters.tags.map(tag => ({
            tags: { contains: tag }
          }));
        }
      }
      
      const [data, total] = await prisma.$transaction([
        prisma.blog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder }
        }),
        prisma.blog.count({ where })
      ]);
      
      return buildPaginatedResult(data as Blog[], total, page, limit);
    } catch (error) {
      handlePrismaError(error);
    }
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
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
      const skip = (page - 1) * limit;
      
      const where = { author };
      
      const [data, total] = await prisma.$transaction([
        prisma.blog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder }
        }),
        prisma.blog.count({ where })
      ]);
      
      return buildPaginatedResult(data as Blog[], total, page, limit);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async incrementBlogViews(id: number): Promise<void> {
    try {
      await prisma.blog.update({
        where: { id },
        data: {
          views: { increment: 1 }
        }
      });
    } catch (error) {
      // Silently fail if blog not found
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return;
      }
      handlePrismaError(error);
    }
  }

  async searchBlogs(query: string, options: PaginationOptions = {}): Promise<PaginatedResult<Blog>> {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
      const skip = (page - 1) * limit;
      
      const where = {
        OR: [
          { title: { contains: query } },
          { content: { contains: query } },
          { tags: { contains: query } }
        ]
      };
      
      const [data, total] = await prisma.$transaction([
        prisma.blog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder }
        }),
        prisma.blog.count({ where })
      ]);
      
      return buildPaginatedResult(data as Blog[], total, page, limit);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getRelatedBlogs(blogId: number, limit: number = 5): Promise<Blog[]> {
    try {
      const blog = await prisma.blog.findUnique({
        where: { id: blogId }
      });
      
      if (!blog) return [];
      
      const related = await prisma.blog.findMany({
        where: {
          AND: [
            { id: { not: blogId } },
            { categoryId: blog.categoryId },
            { status: 'published' }
          ]
        },
        take: limit,
        orderBy: { views: 'desc' }
      });
      
      return related as Blog[];
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getFeaturedBlogs(limit: number = 5): Promise<Blog[]> {
    try {
      const featured = await prisma.blog.findMany({
        where: { status: 'published' },
        orderBy: { views: 'desc' },
        take: limit
      });
      
      return featured as Blog[];
    } catch (error) {
      handlePrismaError(error);
    }
  }

  // ============================================
  // SIGNAL/EA MANAGEMENT
  // ============================================
  async createSignal(insertSignal: InsertSignal): Promise<Signal> {
    try {
      const signal = await prisma.signal.create({
        data: {
          ...insertSignal,
          downloadCount: 0,
          rating: '0.00',
          status: 'active'
        }
      });
      return signal as Signal;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async updateSignal(id: number, data: Partial<InsertSignal>): Promise<Signal | undefined> {
    try {
      const signal = await prisma.signal.update({
        where: { id },
        data
      });
      return signal as Signal;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return undefined;
      }
      handlePrismaError(error);
    }
  }

  async deleteSignal(id: number): Promise<boolean> {
    try {
      await prisma.signal.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return false;
      }
      handlePrismaError(error);
    }
  }

  async getSignalById(id: number): Promise<Signal | undefined> {
    try {
      const signal = await prisma.signal.findUnique({
        where: { id }
      });
      return signal as Signal | null || undefined;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getSignalByUuid(uuid: string): Promise<Signal | undefined> {
    try {
      const signal = await prisma.signal.findUnique({
        where: { uuid }
      });
      return signal as Signal | null || undefined;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getAllSignals(options: PaginationOptions = {}, filters?: SignalFilters): Promise<PaginatedResult<Signal>> {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
      const skip = (page - 1) * limit;
      
      const where: any = {};
      if (filters) {
        if (filters.platform) where.platform = filters.platform;
        if (filters.strategy) where.strategy = filters.strategy;
        if (filters.isPremium !== undefined) where.isPremium = filters.isPremium;
        if (filters.minRating !== undefined) {
          where.rating = { gte: filters.minRating.toString() };
        }
        if (filters.categoryId) where.categoryId = filters.categoryId;
      }
      
      const [data, total] = await prisma.$transaction([
        prisma.signal.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder }
        }),
        prisma.signal.count({ where })
      ]);
      
      return buildPaginatedResult(data as Signal[], total, page, limit);
    } catch (error) {
      handlePrismaError(error);
    }
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
    try {
      await prisma.signal.update({
        where: { id },
        data: {
          downloadCount: { increment: 1 }
        }
      });
    } catch (error) {
      // Silently fail if signal not found
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return;
      }
      handlePrismaError(error);
    }
  }

  async updateSignalRating(id: number, rating: number): Promise<void> {
    try {
      await prisma.signal.update({
        where: { id },
        data: {
          rating: rating.toFixed(2)
        }
      });
    } catch (error) {
      // Silently fail if signal not found
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return;
      }
      handlePrismaError(error);
    }
  }

  async getTopRatedSignals(limit: number = 10): Promise<Signal[]> {
    try {
      const signals = await prisma.signal.findMany({
        orderBy: { rating: 'desc' },
        take: limit
      });
      return signals as Signal[];
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getMostDownloadedSignals(limit: number = 10): Promise<Signal[]> {
    try {
      const signals = await prisma.signal.findMany({
        orderBy: { downloadCount: 'desc' },
        take: limit
      });
      return signals as Signal[];
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getSignalsByCategory(categoryId: number, options: PaginationOptions = {}): Promise<PaginatedResult<Signal>> {
    return this.getAllSignals(options, { categoryId });
  }

  async searchSignals(query: string, options: PaginationOptions = {}): Promise<PaginatedResult<Signal>> {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
      const skip = (page - 1) * limit;
      
      const where = {
        OR: [
          { title: { contains: query } },
          { description: { contains: query } }
        ]
      };
      
      const [data, total] = await prisma.$transaction([
        prisma.signal.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder }
        }),
        prisma.signal.count({ where })
      ]);
      
      return buildPaginatedResult(data as Signal[], total, page, limit);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  // ============================================
  // CATEGORY MANAGEMENT
  // ============================================
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    try {
      const category = await prisma.category.create({
        data: {
          ...insertCategory,
          status: insertCategory.status || 'active'
        }
      });
      return category as Category;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async updateCategory(id: number, data: Partial<InsertCategory>): Promise<Category | undefined> {
    try {
      const category = await prisma.category.update({
        where: { categoryId: id },
        data
      });
      return category as Category;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return undefined;
      }
      handlePrismaError(error);
    }
  }

  async deleteCategory(id: number): Promise<boolean> {
    try {
      await prisma.category.delete({
        where: { categoryId: id }
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return false;
      }
      handlePrismaError(error);
    }
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    try {
      const category = await prisma.category.findUnique({
        where: { categoryId: id }
      });
      return category as Category | null || undefined;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    try {
      const category = await prisma.category.findFirst({
        where: { slug }
      });
      return category as Category | null || undefined;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getAllCategories(): Promise<Category[]> {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { order: 'asc' }
      });
      return categories as Category[];
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getActiveCategories(): Promise<Category[]> {
    try {
      const categories = await prisma.category.findMany({
        where: { status: 'active' },
        orderBy: { order: 'asc' }
      });
      return categories as Category[];
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getCategoryTree(): Promise<Category[]> {
    try {
      const categories = await prisma.category.findMany({
        where: { parentId: null },
        orderBy: { order: 'asc' }
      });
      return categories as Category[];
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getCategoriesByParent(parentId: number | null): Promise<Category[]> {
    try {
      const categories = await prisma.category.findMany({
        where: { parentId },
        orderBy: { order: 'asc' }
      });
      return categories as Category[];
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async updateCategoryStatus(id: number, status: CategoryStatus): Promise<boolean> {
    try {
      await prisma.category.update({
        where: { categoryId: id },
        data: { status }
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return false;
      }
      handlePrismaError(error);
    }
  }

  // ============================================
  // COMMENT MANAGEMENT
  // ============================================
  async createComment(insertComment: InsertComment): Promise<Comment> {
    try {
      const comment = await prisma.comment.create({
        data: {
          ...insertComment,
          status: insertComment.status || 'pending',
          approved: false
        }
      });
      return comment as Comment;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async updateComment(id: number, data: Partial<InsertComment>): Promise<Comment | undefined> {
    try {
      const comment = await prisma.comment.update({
        where: { id },
        data
      });
      return comment as Comment;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return undefined;
      }
      handlePrismaError(error);
    }
  }

  async deleteComment(id: number): Promise<boolean> {
    try {
      await prisma.comment.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return false;
      }
      handlePrismaError(error);
    }
  }

  async getCommentById(id: number): Promise<Comment | undefined> {
    try {
      const comment = await prisma.comment.findUnique({
        where: { id }
      });
      return comment as Comment | null || undefined;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getCommentsByPost(postId: number, onlyApproved: boolean = true): Promise<Comment[]> {
    try {
      const where: any = { postId };
      if (onlyApproved) {
        where.approved = true;
      }
      
      const comments = await prisma.comment.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });
      return comments as Comment[];
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getCommentsByStatus(status: CommentStatus): Promise<Comment[]> {
    try {
      const comments = await prisma.comment.findMany({
        where: { status },
        orderBy: { createdAt: 'desc' }
      });
      return comments as Comment[];
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getPendingComments(): Promise<Comment[]> {
    return this.getCommentsByStatus('pending');
  }

  async approveComment(id: number): Promise<Comment | undefined> {
    try {
      const comment = await prisma.comment.update({
        where: { id },
        data: {
          approved: true,
          status: 'approved'
        }
      });
      return comment as Comment;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return undefined;
      }
      handlePrismaError(error);
    }
  }

  async markCommentAsSpam(id: number): Promise<Comment | undefined> {
    try {
      const comment = await prisma.comment.update({
        where: { id },
        data: {
          status: 'spam',
          approved: false
        }
      });
      return comment as Comment;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return undefined;
      }
      handlePrismaError(error);
    }
  }

  async getCommentReplies(parentId: number): Promise<Comment[]> {
    try {
      const replies = await prisma.comment.findMany({
        where: { parentId },
        orderBy: { createdAt: 'asc' }
      });
      return replies as Comment[];
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getCommentCount(postId: number): Promise<number> {
    try {
      const count = await prisma.comment.count({
        where: {
          postId,
          approved: true
        }
      });
      return count;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getRecentComments(limit: number = 10): Promise<Comment[]> {
    try {
      const comments = await prisma.comment.findMany({
        where: { approved: true },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
      return comments as Comment[];
    } catch (error) {
      handlePrismaError(error);
    }
  }

  // ============================================
  // SEO META MANAGEMENT
  // ============================================
  async createSeoMeta(insertSeoMeta: InsertSeoMeta): Promise<SeoMeta> {
    try {
      const seoMeta = await prisma.seoMeta.create({
        data: {
          ...insertSeoMeta,
          metaRobots: insertSeoMeta.metaRobots || 'index, follow',
          schemaType: 'Article',
          twitterCard: 'summary_large_image'
        }
      });
      return seoMeta as SeoMeta;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async updateSeoMeta(id: number, data: Partial<InsertSeoMeta>): Promise<SeoMeta | undefined> {
    try {
      const seoMeta = await prisma.seoMeta.update({
        where: { id },
        data
      });
      return seoMeta as SeoMeta;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return undefined;
      }
      handlePrismaError(error);
    }
  }

  async deleteSeoMeta(id: number): Promise<boolean> {
    try {
      await prisma.seoMeta.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return false;
      }
      handlePrismaError(error);
    }
  }

  async getSeoMetaById(id: number): Promise<SeoMeta | undefined> {
    try {
      const seoMeta = await prisma.seoMeta.findUnique({
        where: { id }
      });
      return seoMeta as SeoMeta | null || undefined;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getSeoMetaByPostId(postId: number): Promise<SeoMeta | undefined> {
    try {
      const seoMeta = await prisma.seoMeta.findFirst({
        where: { postId }
      });
      return seoMeta as SeoMeta | null || undefined;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async updateOrCreateSeoMeta(postId: number, data: InsertSeoMeta): Promise<SeoMeta> {
    try {
      const existing = await this.getSeoMetaByPostId(postId);
      if (existing) {
        return (await this.updateSeoMeta(existing.id, data))!;
      } else {
        return await this.createSeoMeta({ ...data, postId });
      }
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async generateSitemap(): Promise<Array<{ url: string; lastmod: Date; priority: number }>> {
    try {
      const urls: Array<{ url: string; lastmod: Date; priority: number }> = [];
      
      // Add blogs
      const blogs = await prisma.blog.findMany({
        where: { status: 'published' },
        select: { seoSlug: true, createdAt: true }
      });
      
      blogs.forEach(blog => {
        urls.push({
          url: `/blog/${blog.seoSlug}`,
          lastmod: blog.createdAt,
          priority: 0.8
        });
      });
      
      // Add pages
      const pages = await prisma.page.findMany({
        select: { slug: true, createdAt: true, updatedAt: true }
      });
      
      pages.forEach(page => {
        urls.push({
          url: `/${page.slug}`,
          lastmod: page.updatedAt || page.createdAt,
          priority: 0.6
        });
      });
      
      return urls;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  // ============================================
  // MEDIA MANAGEMENT
  // ============================================
  async createMedia(insertMedia: InsertMedia): Promise<Media> {
    try {
      const media = await prisma.media.create({
        data: insertMedia
      });
      return media as Media;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async updateMedia(id: number, data: Partial<InsertMedia>): Promise<Media | undefined> {
    try {
      const media = await prisma.media.update({
        where: { id },
        data
      });
      return media as Media;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return undefined;
      }
      handlePrismaError(error);
    }
  }

  async deleteMedia(id: number): Promise<boolean> {
    try {
      await prisma.media.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return false;
      }
      handlePrismaError(error);
    }
  }

  async getMediaById(id: number): Promise<Media | undefined> {
    try {
      const media = await prisma.media.findUnique({
        where: { id }
      });
      return media as Media | null || undefined;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getMediaByUser(userId: number, options: PaginationOptions = {}): Promise<PaginatedResult<Media>> {
    try {
      const { page = 1, limit = 10, sortBy = 'uploadedAt', sortOrder = 'desc' } = options;
      const skip = (page - 1) * limit;
      
      const where = { uploadedBy: userId };
      
      const [data, total] = await prisma.$transaction([
        prisma.media.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder }
        }),
        prisma.media.count({ where })
      ]);
      
      return buildPaginatedResult(data as Media[], total, page, limit);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getAllMedia(options: PaginationOptions = {}): Promise<PaginatedResult<Media>> {
    try {
      const { page = 1, limit = 10, sortBy = 'uploadedAt', sortOrder = 'desc' } = options;
      const skip = (page - 1) * limit;
      
      const [data, total] = await prisma.$transaction([
        prisma.media.findMany({
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder }
        }),
        prisma.media.count()
      ]);
      
      return buildPaginatedResult(data as Media[], total, page, limit);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getMediaByType(fileType: string, options: PaginationOptions = {}): Promise<PaginatedResult<Media>> {
    try {
      const { page = 1, limit = 10, sortBy = 'uploadedAt', sortOrder = 'desc' } = options;
      const skip = (page - 1) * limit;
      
      const where = { fileType };
      
      const [data, total] = await prisma.$transaction([
        prisma.media.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder }
        }),
        prisma.media.count({ where })
      ]);
      
      return buildPaginatedResult(data as Media[], total, page, limit);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async searchMedia(query: string, options: PaginationOptions = {}): Promise<PaginatedResult<Media>> {
    try {
      const { page = 1, limit = 10, sortBy = 'uploadedAt', sortOrder = 'desc' } = options;
      const skip = (page - 1) * limit;
      
      const where = {
        OR: [
          { fileName: { contains: query } },
          { altText: { contains: query } }
        ]
      };
      
      const [data, total] = await prisma.$transaction([
        prisma.media.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder }
        }),
        prisma.media.count({ where })
      ]);
      
      return buildPaginatedResult(data as Media[], total, page, limit);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  // ============================================
  // POST MANAGEMENT
  // ============================================
  async createPost(insertPost: InsertPost): Promise<Post> {
    try {
      const post = await prisma.post.create({
        data: {
          ...insertPost,
          status: insertPost.status || 'draft'
        }
      });
      return post as Post;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async updatePost(id: number, data: Partial<InsertPost>): Promise<Post | undefined> {
    try {
      const post = await prisma.post.update({
        where: { id },
        data
      });
      return post as Post;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return undefined;
      }
      handlePrismaError(error);
    }
  }

  async deletePost(id: number): Promise<boolean> {
    try {
      await prisma.post.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return false;
      }
      handlePrismaError(error);
    }
  }

  async getPostById(id: number): Promise<Post | undefined> {
    try {
      const post = await prisma.post.findUnique({
        where: { id }
      });
      return post as Post | null || undefined;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getPostBySlug(slug: string): Promise<Post | undefined> {
    try {
      const post = await prisma.post.findUnique({
        where: { slug }
      });
      return post as Post | null || undefined;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getAllPosts(options: PaginationOptions = {}): Promise<PaginatedResult<Post>> {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
      const skip = (page - 1) * limit;
      
      const [data, total] = await prisma.$transaction([
        prisma.post.findMany({
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder }
        }),
        prisma.post.count()
      ]);
      
      return buildPaginatedResult(data as Post[], total, page, limit);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getPublishedPosts(options: PaginationOptions = {}): Promise<PaginatedResult<Post>> {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
      const skip = (page - 1) * limit;
      
      const where = { status: 'published' };
      
      const [data, total] = await prisma.$transaction([
        prisma.post.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder }
        }),
        prisma.post.count({ where })
      ]);
      
      return buildPaginatedResult(data as Post[], total, page, limit);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getPostsByAuthor(authorId: number, options: PaginationOptions = {}): Promise<PaginatedResult<Post>> {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
      const skip = (page - 1) * limit;
      
      const where = { authorId };
      
      const [data, total] = await prisma.$transaction([
        prisma.post.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder }
        }),
        prisma.post.count({ where })
      ]);
      
      return buildPaginatedResult(data as Post[], total, page, limit);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getPostsByCategory(category: string, options: PaginationOptions = {}): Promise<PaginatedResult<Post>> {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
      const skip = (page - 1) * limit;
      
      const where = { category };
      
      const [data, total] = await prisma.$transaction([
        prisma.post.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder }
        }),
        prisma.post.count({ where })
      ]);
      
      return buildPaginatedResult(data as Post[], total, page, limit);
    } catch (error) {
      handlePrismaError(error);
    }
  }

  // ============================================
  // PAGE MANAGEMENT
  // ============================================
  async createPage(insertPage: InsertPage): Promise<Page> {
    try {
      const page = await prisma.page.create({
        data: {
          ...insertPage,
          status: insertPage.status || 'published',
          template: insertPage.template || 'default',
          order: insertPage.order || 0
        }
      });
      return page as Page;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async updatePage(id: number, data: Partial<InsertPage>): Promise<Page | undefined> {
    try {
      const page = await prisma.page.update({
        where: { id },
        data
      });
      return page as Page;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return undefined;
      }
      handlePrismaError(error);
    }
  }

  async deletePage(id: number): Promise<boolean> {
    try {
      await prisma.page.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return false;
      }
      handlePrismaError(error);
    }
  }

  async getPageById(id: number): Promise<Page | undefined> {
    try {
      const page = await prisma.page.findUnique({
        where: { id }
      });
      return page as Page | null || undefined;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getPageBySlug(slug: string): Promise<Page | undefined> {
    try {
      const page = await prisma.page.findUnique({
        where: { slug }
      });
      return page as Page | null || undefined;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getAllPages(): Promise<Page[]> {
    try {
      const pages = await prisma.page.findMany({
        orderBy: { order: 'asc' }
      });
      return pages as Page[];
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getPagesByTemplate(template: string): Promise<Page[]> {
    try {
      const pages = await prisma.page.findMany({
        where: { template },
        orderBy: { order: 'asc' }
      });
      return pages as Page[];
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async getPageTree(): Promise<Page[]> {
    try {
      const pages = await prisma.page.findMany({
        where: { parentId: null },
        orderBy: { order: 'asc' }
      });
      return pages as Page[];
    } catch (error) {
      handlePrismaError(error);
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================
  async initialize(): Promise<void> {
    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;
      console.log('PrismaStorage initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PrismaStorage:', error);
      throw error;
    }
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

// Export singleton instance
export const prismaStorage = new PrismaStorage();