import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage as memStorage, type IStorage } from "./storage";
import { prismaStorage } from "./prisma-storage";
import { prisma, getDatabaseHealth, isDatabaseConnected } from "./db";
import { generateSitemap, generateSitemapIndex, generateNewsSitemap } from "./sitemap";
import { generateRobotsTxt, generateDynamicRobotsTxt } from "./robots";
import { generateRssFeed, generateDownloadsRssFeed, generateAtomFeed } from "./feed";
import { 
  insertPostSchema, 
  insertSignalSchema, 
  insertCategorySchema, 
  insertCommentSchema, 
  insertPageSchema,
  insertBlogSchema,
  insertMediaSchema,
  insertSeoMetaSchema,
  insertUserSchema,
  insertAdminSchema,
  type User
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import bcrypt from "bcrypt";

// Dynamic storage selection based on database availability
let storage: IStorage = memStorage;
let storageType = 'memory';

// Function to select appropriate storage based on database status
async function selectStorage(): Promise<IStorage> {
  try {
    const isConnected = await isDatabaseConnected();
    if (isConnected) {
      // Initialize PrismaStorage if not already initialized
      await prismaStorage.initialize();
      storage = prismaStorage;
      storageType = 'prisma';
      console.log('✅ Using PrismaStorage (database connected)');
      return prismaStorage;
    }
  } catch (error) {
    console.warn('⚠️ Database not available, falling back to MemStorage:', error);
  }
  
  // Fall back to memory storage
  storage = memStorage;
  storageType = 'memory';
  console.log('📦 Using MemStorage (database unavailable)');
  return memStorage;
}

// Initialize storage on startup
selectStorage().catch(console.error);

// Extend Express types to include user in request
declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
  }
}

// Configure memory store for sessions
const MemoryStoreSession = MemoryStore(session);

// Rate limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later'
});

// Helper function for admin authentication check
const isAdmin = (req: Request): boolean => {
  // Check if user is authenticated and has admin role
  return !!(req.user && req.user.role === 'admin');
};

// Middleware to require authentication
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Middleware to require admin role
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Helper function to parse pagination parameters
const parsePagination = (req: Request) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
  const sortBy = req.query.sortBy as string || 'createdAt';
  const sortOrder = (req.query.sortOrder as string || 'desc') as 'asc' | 'desc';
  return { page, limit, sortBy, sortOrder };
};

// Configure passport strategies
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email, password, done) => {
    console.log('🔑 Passport strategy called with email:', email);
    
    try {
      // Development fallback for testing when database is not available
      if (process.env.NODE_ENV !== 'production' && email === 'admin@example.com' && password === 'password123') {
        console.log('⚠️ Using development fallback admin user (database not connected)');
        const testUser: User = {
          id: '1',
          email: 'admin@example.com',
          username: 'admin',
          password: await bcrypt.hash('password123', 10),
          role: 'admin',
          avatar: null,
          bio: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        return done(null, testUser);
      }
      
      // Try to find admin by email or username
      console.log('🔍 Searching for admin with email/username:', email);
      const admin = await prisma.admin.findFirst({
        where: {
          OR: [
            { email: email },
            { username: email }
          ]
        }
      });
      
      if (!admin) {
        console.log('❌ No admin found with email/username:', email);
        return done(null, false, { message: 'Invalid email or password' });
      }
      
      console.log('👤 Admin found:', admin.email);
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, admin.password);
      if (!isValidPassword) {
        console.log('❌ Invalid password for admin:', admin.email);
        return done(null, false, { message: 'Invalid email or password' });
      }
      
      console.log('✅ Password valid for admin:', admin.email);
      
      // Return admin data as user
      const user: User = {
        id: admin.id.toString(),
        email: admin.email,
        username: admin.username,
        password: admin.password,
        role: admin.role === 'admin' ? 'admin' : 'user',
        avatar: admin.profilePic,
        bio: null,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt || new Date()
      };
      
      return done(null, user);
    } catch (error: any) {
      console.error('❌ Passport strategy error:', error.message);
      // If database error, try fallback in development
      if (process.env.NODE_ENV !== 'production' && error.message?.includes("Can't reach database server")) {
        if (email === 'admin@example.com' && password === 'password123') {
          console.log('⚠️ Database unavailable, using development fallback admin');
          const testUser: User = {
            id: '1',
            email: 'admin@example.com',
            username: 'admin',
            password: await bcrypt.hash('password123', 10),
            role: 'admin',
            avatar: null,
            bio: null,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          return done(null, testUser);
        }
      }
      return done(error);
    }
  }
));

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!admin) {
      return done(null, false);
    }
    
    const user: User = {
      id: admin.id.toString(),
      email: admin.email,
      username: admin.username,
      password: admin.password,
      role: admin.role === 'admin' ? 'admin' : 'user',
      avatar: admin.profilePic,
      bio: null,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt || new Date()
    };
    
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
  
  app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax'
    }
  }));

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Set CORS headers for all API routes
  app.use('/api', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-admin-key');
    res.header('Access-Control-Allow-Credentials', 'true');
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

  // ==================== AUTHENTICATION ENDPOINTS ====================
  
  // POST /api/auth/login - User login
  app.post("/api/auth/login", loginLimiter, (req: Request, res: Response, next: NextFunction) => {
    console.log('🔐 Login attempt received:', { email: req.body.email, hasPassword: !!req.body.password });
    
    passport.authenticate('local', (err: any, user: User | false, info: any) => {
      if (err) {
        console.error('❌ Authentication error:', err);
        return res.status(500).json({ error: 'Authentication failed', message: err.message });
      }
      
      if (!user) {
        console.log('❌ Invalid credentials for:', req.body.email);
        return res.status(401).json({ error: 'Invalid credentials', message: info?.message || 'Invalid email or password' });
      }
      
      console.log('✅ User authenticated successfully:', user.email);
      req.logIn(user, (err) => {
        if (err) {
          console.error('❌ Session login failed:', err);
          return res.status(500).json({ error: 'Login failed', message: err.message });
        }
        
        // Return user data without password
        const { password, ...userWithoutPassword } = user;
        console.log('✅ Login successful for user:', userWithoutPassword.email);
        res.json({ 
          success: true, 
          user: userWithoutPassword,
          message: 'Login successful'
        });
      });
    })(req, res, next);
  });

  // POST /api/auth/logout - User logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed', message: err.message });
      }
      
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ error: 'Session destruction failed', message: err.message });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true, message: 'Logout successful' });
      });
    });
  });

  // GET /api/auth/check - Check authentication status
  app.get("/api/auth/check", (req: Request, res: Response) => {
    if (!req.user) {
      return res.json({ 
        authenticated: false, 
        user: null 
      });
    }
    
    // Return user data without password
    const { password, ...userWithoutPassword } = req.user;
    res.json({ 
      authenticated: true, 
      user: userWithoutPassword 
    });
  });

  // GET /api/health - Health check endpoint for monitoring
  app.get("/api/health", async (req: Request, res: Response) => {
    try {
      const health = await getDatabaseHealth();
      
      // Check and update storage type if needed
      await selectStorage();
      
      const httpStatus = health.connected ? 200 : 503;
      
      // Add server and storage information
      const serverHealth = {
        ...health,
        storage: {
          type: storageType,
          description: storageType === 'prisma' ? 'Using database-backed PrismaStorage' : 'Using in-memory MemStorage',
          canPersist: storageType === 'prisma'
        },
        server: {
          status: 'running',
          environment: process.env.NODE_ENV || 'development',
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          nodeVersion: process.version
        },
        timestamp: new Date().toISOString()
      };
      
      res.status(httpStatus).json(serverHealth);
    } catch (error: any) {
      console.error('Health check error:', error);
      res.status(503).json({
        status: 'unhealthy',
        connected: false,
        error: error.message,
        storage: {
          type: storageType,
          description: storageType === 'prisma' ? 'Using database-backed PrismaStorage' : 'Using in-memory MemStorage',
          canPersist: storageType === 'prisma'
        },
        server: {
          status: 'running',
          environment: process.env.NODE_ENV || 'development',
          uptime: process.uptime()
        },
        timestamp: new Date().toISOString()
      });
    }
  });

  // POST /api/auth/register - User registration (optional, for creating admin users)
  app.post("/api/auth/register", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { email, username, password, role, name, phone } = req.body;
      
      // Validate input
      if (!email || !username || !password) {
        return res.status(400).json({ error: 'Email, username, and password are required' });
      }
      
      // Check if admin already exists
      const existingAdmin = await prisma.admin.findFirst({
        where: {
          OR: [
            { email: email },
            { username: username }
          ]
        }
      });
      
      if (existingAdmin) {
        return res.status(400).json({ 
          error: existingAdmin.email === email ? 'Email already registered' : 'Username already taken' 
        });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create new admin
      const newAdmin = await prisma.admin.create({
        data: {
          email,
          username,
          password: hashedPassword,
          name: name || username,
          phone: phone || null,
          role: role === 'admin' ? 'admin' : 'editor'
        }
      });
      
      // Return admin data without password
      const { password: _, ...adminWithoutPassword } = newAdmin;
      res.status(201).json({ 
        success: true, 
        user: adminWithoutPassword 
      });
    } catch (error) {
      console.error("Error creating admin:", error);
      res.status(500).json({ error: "Failed to create admin" });
    }
  });

  // ==================== POSTS API ====================
  
  // GET /api/posts - Get all published posts with pagination
  app.get("/api/posts", async (req: Request, res: Response) => {
    try {
      const { page, limit, sortBy, sortOrder } = parsePagination(req);
      const { status } = req.query;
      
      // Check if database is connected
      const dbConnected = await isDatabaseConnected();
      if (!dbConnected) {
        console.warn('Database unavailable - returning graceful response for /api/posts');
        return res.status(200).json({
          data: [],
          total: 0,
          page,
          totalPages: 0,
          warning: 'Database is currently unavailable. Posts will be available once the connection is restored.'
        });
      }
      
      const skip = (page - 1) * limit;
      const where: any = {};
      
      // Show all posts for admin, otherwise only published
      if (!(status === 'all' && isAdmin(req))) {
        where.status = 'published';
      }
      
      const [blogs, total] = await Promise.all([
        prisma.blog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy === 'createdAt' ? 'createdAt' : sortBy]: sortOrder },
          include: {
            categories: {
              include: {
                category: true
              }
            }
          }
        }),
        prisma.blog.count({ where })
      ]);
      
      // Format data to match expected response
      const formattedData = blogs.map(blog => ({
        id: blog.id.toString(),
        title: blog.title,
        slug: blog.seoSlug,
        content: blog.content,
        excerpt: blog.content.substring(0, 200) + '...',
        author: blog.author,
        authorId: '1', // Default since we don't have authorId
        categoryId: blog.categoryId.toString(),
        category: blog.categories[0]?.category?.name || null,
        featuredImage: blog.featuredImage,
        published: blog.status === 'published',
        publishedAt: blog.createdAt,
        status: blog.status,
        views: blog.views || 0,
        tags: blog.tags,
        createdAt: blog.createdAt,
        updatedAt: blog.createdAt
      }));
      
      res.json({
        data: formattedData,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error: any) {
      console.error("Error fetching posts:", error);
      // Check if it's a database connection error
      if (error.message?.includes("Can't reach database server") || error.code === 'P2002') {
        return res.status(200).json({
          data: [],
          total: 0,
          page,
          totalPages: 0,
          warning: 'Database connection error. Posts are temporarily unavailable.'
        });
      }
      res.status(500).json({ 
        error: "Failed to fetch posts",
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  });

  // GET /api/posts/search - Search posts by query
  app.get("/api/posts/search", async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ error: "Search query is required" });
      }
      
      const { page, limit } = parsePagination(req);
      const searchTerm = q.toString();
      
      // Search in title and content
      const blogs = await prisma.blog.findMany({
        where: {
          status: 'published',
          OR: [
            { title: { contains: searchTerm } },
            { content: { contains: searchTerm } }
          ]
        },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          categories: {
            include: {
              category: true
            }
          }
        }
      });
      
      const total = await prisma.blog.count({
        where: {
          status: 'published',
          OR: [
            { title: { contains: searchTerm } },
            { content: { contains: searchTerm } }
          ]
        }
      });
      
      // Format data
      const formattedData = blogs.map(blog => ({
        id: blog.id.toString(),
        title: blog.title,
        slug: blog.seoSlug,
        content: blog.content,
        excerpt: blog.content.substring(0, 200) + '...',
        author: blog.author,
        categoryId: blog.categoryId.toString(),
        category: blog.categories[0]?.category?.name || null,
        featuredImage: blog.featuredImage,
        published: blog.status === 'published',
        status: blog.status,
        views: blog.views || 0,
        tags: blog.tags,
        createdAt: blog.createdAt
      }));
      
      res.json({ 
        data: formattedData,
        total,
        page,
        totalPages: Math.ceil(total / limit),
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
      
      // Find and increment view count in a transaction
      const blog = await prisma.$transaction(async (tx) => {
        const foundBlog = await tx.blog.findFirst({
          where: { seoSlug: slug },
          include: {
            categories: {
              include: {
                category: true
              }
            },
            seoMeta: true
          }
        });
        
        if (foundBlog) {
          await tx.blog.update({
            where: { id: foundBlog.id },
            data: { views: { increment: 1 } }
          });
        }
        
        return foundBlog;
      });
      
      if (!blog) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      // Format response
      const formattedPost = {
        id: blog.id.toString(),
        title: blog.title,
        slug: blog.seoSlug,
        content: blog.content,
        excerpt: blog.content.substring(0, 200) + '...',
        author: blog.author,
        authorId: '1',
        categoryId: blog.categoryId.toString(),
        category: blog.categories[0]?.category?.name || null,
        featuredImage: blog.featuredImage,
        published: blog.status === 'published',
        status: blog.status,
        views: (blog.views || 0) + 1, // Include the increment
        tags: blog.tags ? blog.tags.split(',').map(t => t.trim()) : [],
        createdAt: blog.createdAt,
        seoMeta: blog.seoMeta[0] || null
      };
      
      res.json(formattedPost);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ error: "Failed to fetch post" });
    }
  });

  // GET /api/posts/category/:categorySlug - Get posts by category
  app.get("/api/posts/category/:categorySlug", async (req: Request, res: Response) => {
    try {
      const { categorySlug } = req.params;
      const { page, limit, sortBy, sortOrder } = parsePagination(req);
      
      // Find category by name (using name as slug)
      const category = await prisma.category.findFirst({
        where: { 
          name: categorySlug.replace(/-/g, ' ') // Convert slug back to name
        }
      });
      
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      const skip = (page - 1) * limit;
      
      // Get blogs for this category
      const [blogs, total] = await Promise.all([
        prisma.blog.findMany({
          where: {
            categoryId: category.categoryId,
            status: 'published'
          },
          skip,
          take: limit,
          orderBy: { [sortBy === 'createdAt' ? 'createdAt' : sortBy]: sortOrder },
          include: {
            categories: {
              include: {
                category: true
              }
            }
          }
        }),
        prisma.blog.count({
          where: {
            categoryId: category.categoryId,
            status: 'published'
          }
        })
      ]);
      
      // Format data
      const formattedData = blogs.map(blog => ({
        id: blog.id.toString(),
        title: blog.title,
        slug: blog.seoSlug,
        content: blog.content,
        excerpt: blog.content.substring(0, 200) + '...',
        author: blog.author,
        categoryId: blog.categoryId.toString(),
        category: category.name,
        featuredImage: blog.featuredImage,
        published: blog.status === 'published',
        status: blog.status,
        views: blog.views || 0,
        tags: blog.tags,
        createdAt: blog.createdAt
      }));
      
      res.json({
        data: formattedData,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      });
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
  app.post("/api/posts", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { 
        title, content, slug, excerpt, author, authorId, categoryId, 
        featuredImage, published, status, tags, seoTitle, seoDescription, seoKeywords 
      } = req.body;
      
      // Generate slug if not provided
      const seoSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      
      // Create blog with SEO meta in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const blog = await tx.blog.create({
          data: {
            title,
            content,
            seoSlug,
            status: status || 'draft',
            author: author || req.user?.username || 'Admin',
            featuredImage: featuredImage || '',
            tags: Array.isArray(tags) ? tags.join(', ') : (tags || ''),
            categoryId: parseInt(categoryId) || 1,
            views: 0,
            createdAt: new Date()
          }
        });
        
        // Create SEO meta if provided
        if (seoTitle || seoDescription || seoKeywords) {
          await tx.seoMeta.create({
            data: {
              postId: blog.id,
              seoTitle: seoTitle || title,
              seoDescription: seoDescription || excerpt || content.substring(0, 160),
              seoKeywords: seoKeywords || '',
              seoSlug
            }
          });
        }
        
        return blog;
      });
      
      res.status(201).json({
        id: result.id.toString(),
        slug: result.seoSlug,
        title: result.title,
        status: result.status
      });
    } catch (error) {
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
      const { 
        title, content, slug, excerpt, author, categoryId, 
        featuredImage, published, status, tags, seoTitle, seoDescription, seoKeywords 
      } = req.body;
      
      // Update blog and SEO meta in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Build update data dynamically
        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        if (slug !== undefined) updateData.seoSlug = slug;
        if (author !== undefined) updateData.author = author;
        if (categoryId !== undefined) updateData.categoryId = parseInt(categoryId);
        if (featuredImage !== undefined) updateData.featuredImage = featuredImage;
        if (status !== undefined) updateData.status = status;
        if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags.join(', ') : tags;
        
        const blog = await tx.blog.update({
          where: { id: parseInt(id) },
          data: updateData
        });
        
        // Update or create SEO meta
        if (seoTitle !== undefined || seoDescription !== undefined || seoKeywords !== undefined) {
          const existingSeoMeta = await tx.seoMeta.findFirst({
            where: { postId: parseInt(id) }
          });
          
          const seoData: any = {};
          if (seoTitle !== undefined) seoData.seoTitle = seoTitle;
          if (seoDescription !== undefined) seoData.seoDescription = seoDescription;
          if (seoKeywords !== undefined) seoData.seoKeywords = seoKeywords;
          if (slug !== undefined) seoData.seoSlug = slug;
          
          if (existingSeoMeta) {
            await tx.seoMeta.update({
              where: { id: existingSeoMeta.id },
              data: seoData
            });
          } else if (Object.keys(seoData).length > 0) {
            await tx.seoMeta.create({
              data: {
                ...seoData,
                postId: parseInt(id)
              }
            });
          }
        }
        
        return blog;
      });
      
      res.json({
        id: result.id.toString(),
        slug: result.seoSlug,
        title: result.title,
        status: result.status
      });
    } catch (error) {
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
      
      // Delete blog (cascade will handle related records)
      await prisma.blog.delete({
        where: { id: parseInt(id) }
      });
      
      res.json({ success: true, message: "Post deleted successfully" });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: "Post not found" });
      }
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
      const { page, limit, sortBy, sortOrder } = parsePagination(req);
      
      // Check if database is connected
      const dbConnected = await isDatabaseConnected();
      if (!dbConnected) {
        console.warn('Database unavailable - returning graceful response for /api/downloads');
        return res.status(200).json({
          data: [],
          total: 0,
          page,
          totalPages: 0,
          warning: 'Database is currently unavailable. Downloads will be available once the connection is restored.'
        });
      }
      
      const skip = (page - 1) * limit;
      
      // Get signals from database
      const [signals, total] = await Promise.all([
        prisma.signal.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: sortOrder }
        }),
        prisma.signal.count()
      ]);
      
      // Format data to match expected download response
      const formattedData = signals.map(signal => ({
        id: signal.uuid,
        name: signal.title,
        slug: signal.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: signal.description,
        version: '1.0.0',
        fileUrl: signal.filePath,
        fileSize: `${(signal.sizeBytes / 1024 / 1024).toFixed(2)} MB`,
        downloadCount: 0, // Not tracked in signals table
        rating: 4.5, // Default rating
        platform: 'Both', // Default to both MT4 and MT5
        strategy: 'EA', // Default strategy
        compatibility: 'MT4, MT5',
        isPremium: false,
        status: 'active',
        features: [],
        requirements: [],
        screenshots: [],
        createdAt: signal.createdAt
      }));
      
      res.json({
        data: formattedData,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error: any) {
      console.error("Error fetching downloads:", error);
      // Check if it's a database connection error
      if (error.message?.includes("Can't reach database server") || error.code === 'P2002') {
        return res.status(200).json({
          data: [],
          total: 0,
          page,
          totalPages: 0,
          warning: 'Database connection error. Downloads are temporarily unavailable.'
        });
      }
      res.status(500).json({ 
        error: "Failed to fetch downloads",
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
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
      
      const signal = await prisma.signal.findFirst({
        where: { 
          OR: [
            { uuid: id },
            { id: parseInt(id) || 0 }
          ]
        }
      });
      
      if (!signal) {
        return res.status(404).json({ error: "Download not found" });
      }
      
      // Format response
      const formattedDownload = {
        id: signal.uuid,
        name: signal.title,
        slug: signal.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: signal.description,
        version: '1.0.0',
        fileUrl: signal.filePath,
        fileSize: `${(signal.sizeBytes / 1024 / 1024).toFixed(2)} MB`,
        downloadCount: 0,
        rating: 4.5,
        platform: 'Both',
        strategy: 'EA',
        compatibility: 'MT4, MT5',
        isPremium: false,
        status: 'active',
        features: [],
        requirements: [],
        screenshots: [],
        createdAt: signal.createdAt
      };
      
      res.json(formattedDownload);
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
      
      const { name, description, fileUrl, fileSize } = req.body;
      
      const signal = await prisma.signal.create({
        data: {
          uuid: crypto.randomBytes(16).toString('hex'),
          title: name || 'New Signal',
          description: description || '',
          filePath: fileUrl || '',
          mime: 'application/octet-stream',
          sizeBytes: parseInt(fileSize) || 0,
          createdAt: new Date()
        }
      });
      
      res.status(201).json({
        id: signal.uuid,
        name: signal.title,
        description: signal.description
      });
    } catch (error) {
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
      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' }
      });
      
      // Format response
      const formattedCategories = categories.map(cat => ({
        id: cat.categoryId.toString(),
        name: cat.name,
        slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
        description: cat.description || null,
        parentId: null, // Categories table doesn't have parent relationships
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      res.json(formattedCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // GET /api/categories/:slug - Get single category
  app.get("/api/categories/:slug", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      
      // Find category by name (using name as slug)
      const category = await prisma.category.findFirst({
        where: { 
          name: slug.replace(/-/g, ' ') // Convert slug back to name
        }
      });
      
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      // Format response
      const formattedCategory = {
        id: category.categoryId.toString(),
        name: category.name,
        slug: category.name.toLowerCase().replace(/\s+/g, '-'),
        description: category.description || null,
        parentId: null, // Categories table doesn't have parent relationships
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      res.json(formattedCategory);
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
      
      const { name, description } = req.body;
      
      // Check if category already exists
      const existingCategory = await prisma.category.findFirst({
        where: { name }
      });
      
      if (existingCategory) {
        return res.status(400).json({ error: "Category already exists" });
      }
      
      const category = await prisma.category.create({
        data: {
          name,
          description: description || null,
          status: 'active'
        }
      });
      
      res.status(201).json({
        id: category.categoryId.toString(),
        name: category.name,
        slug: category.name.toLowerCase().replace(/\s+/g, '-'),
        description: category.description
      });
    } catch (error) {
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
      const { email, name } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        return res.status(200).json({ success: true, message: "Already subscribed to newsletter" });
      }
      
      // Create new user as subscriber
      await prisma.user.create({
        data: {
          email,
          name: name || null,
          password: crypto.randomBytes(32).toString('hex'), // Random password for newsletter-only users
          role: 'viewer',
          createdAt: new Date()
        }
      });
      
      res.status(201).json({ success: true, message: "Successfully subscribed to newsletter" });
    } catch (error) {
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
      
      // Delete user from users table
      const result = await prisma.user.deleteMany({
        where: { email }
      });
      
      if (result.count === 0) {
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
      
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          role: true
        },
        orderBy: { createdAt: 'desc' }
      });
      
      // Format response
      const formattedSubscribers = users.map(user => ({
        id: user.id.toString(),
        email: user.email,
        name: user.name || '',
        active: true,
        preferences: {},
        subscribedAt: user.createdAt,
        createdAt: user.createdAt
      }));
      
      res.json(formattedSubscribers);
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
      
      const comments = await prisma.comment.findMany({
        where: { postId: parseInt(postId) },
        orderBy: { createdAt: 'desc' }
      });
      
      // Format response
      const formattedComments = comments.map(comment => ({
        id: comment.id.toString(),
        postId: comment.postId.toString(),
        name: comment.name,
        email: comment.email,
        content: comment.comment,
        approved: true, // Comments table doesn't have approved field
        createdAt: comment.createdAt,
        updatedAt: comment.createdAt
      }));
      
      res.json(formattedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  // POST /api/comments - Add new comment
  app.post("/api/comments", async (req: Request, res: Response) => {
    try {
      const { postId, name, email, content } = req.body;
      
      // Verify blog post exists
      const blog = await prisma.blog.findUnique({
        where: { id: parseInt(postId) }
      });
      
      if (!blog) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      const comment = await prisma.comment.create({
        data: {
          postId: parseInt(postId),
          name: name || 'Anonymous',
          email: email || '',
          comment: content || '',
          createdAt: new Date()
        }
      });
      
      res.status(201).json({
        id: comment.id.toString(),
        postId: comment.postId.toString(),
        name: comment.name,
        email: comment.email,
        content: comment.comment,
        createdAt: comment.createdAt
      });
    } catch (error) {
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
      const { pageUrl, postId, downloadId } = req.body;
      
      // If tracking a blog post view, increment the view counter
      if (postId) {
        await prisma.blog.update({
          where: { id: parseInt(postId) },
          data: { views: { increment: 1 } }
        });
      }
      
      // Note: The schema doesn't have an analytics table, so we're just tracking views on blogs
      // For a more complete analytics solution, you'd need an analytics table
      
      res.status(201).json({ success: true });
    } catch (error) {
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

  // GET /api/analytics/popular - Get popular content
  app.get("/api/analytics/popular", async (req: Request, res: Response) => {
    try {
      const { type = 'posts' } = req.query;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
      
      const results: any = {};
      
      // Get popular posts based on view count
      if (type === 'posts' || type === 'all') {
        const popularPosts = await prisma.blog.findMany({
          where: { status: 'published' },
          orderBy: { views: 'desc' },
          take: limit,
          include: {
            categories: {
              include: {
                category: true
              }
            }
          }
        });
        
        results.posts = popularPosts.map(blog => ({
          id: blog.id.toString(),
          title: blog.title,
          slug: blog.seoSlug,
          views: blog.views || 0,
          category: blog.categories[0]?.category?.name || null,
          featuredImage: blog.featuredImage,
          createdAt: blog.createdAt
        }));
      }
      
      // Get signals for downloads (signals table doesn't track views, so just return latest)
      if (type === 'downloads' || type === 'all') {
        const signals = await prisma.signal.findMany({
          orderBy: { createdAt: 'desc' },
          take: limit
        });
        
        results.downloads = signals.map(signal => ({
          id: signal.uuid,
          name: signal.title,
          slug: signal.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          downloadCount: 0, // Not tracked in signals table
          description: signal.description,
          createdAt: signal.createdAt
        }));
      }
      
      res.json(results);
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
        const posts = await prisma.blog.findMany({
          where: {
            AND: [
              { status: 'published' },
              {
                OR: [
                  { title: { contains: searchTerm, mode: 'insensitive' } },
                  { content: { contains: searchTerm, mode: 'insensitive' } },
                  { tags: { contains: searchTerm, mode: 'insensitive' } }
                ]
              }
            ]
          },
          take: 10,
          include: {
            categories: {
              include: {
                category: true
              }
            }
          }
        });
        
        results.posts = posts.map(blog => ({
          id: blog.id.toString(),
          title: blog.title,
          slug: blog.seoSlug,
          excerpt: blog.content.substring(0, 200) + '...',
          featuredImage: blog.featuredImage,
          category: blog.categories[0]?.category?.name || null,
          createdAt: blog.createdAt
        }));
      }
      
      // Search downloads (signals table)
      if (type === 'all' || type === 'downloads') {
        const signals = await prisma.signal.findMany({
          where: {
            OR: [
              { title: { contains: searchTerm, mode: 'insensitive' } },
              { description: { contains: searchTerm, mode: 'insensitive' } }
            ]
          },
          take: 10
        });
        
        results.downloads = signals.map(signal => ({
          id: signal.uuid,
          name: signal.title,
          slug: signal.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: signal.description,
          fileUrl: signal.filePath,
          createdAt: signal.createdAt
        }));
      }
      
      // Note: Pages table doesn't exist in the schema, so skipping page search
      results.pages = [];
      
      results.total = results.posts.length + results.downloads.length + results.pages.length;
      
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
      const posts = await prisma.blog.findMany({
        where: {
          AND: [
            { status: 'published' },
            { title: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        select: { title: true },
        take: 5
      });
      
      posts.forEach(p => suggestions.push(p.title));
      
      // Get download names as suggestions
      const signals = await prisma.signal.findMany({
        where: {
          title: { contains: searchTerm, mode: 'insensitive' }
        },
        select: { title: true },
        take: 5
      });
      
      signals.forEach(s => suggestions.push(s.title));
      
      // Get category names as suggestions
      const categories = await prisma.category.findMany({
        where: {
          name: { contains: searchTerm, mode: 'insensitive' }
        },
        select: { name: true },
        take: 5
      });
      
      categories.forEach(c => suggestions.push(c.name));
      
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


  // ==================== ADMIN API ====================
  
  // GET /api/admin/stats - Get dashboard statistics (admin only)
  app.get("/api/admin/stats", requireAdmin, async (req: Request, res: Response) => {
    try {
      // Get real counts from database using Prisma
      const [
        totalBlogs,
        publishedBlogs,
        draftBlogs,
        totalViews,
        totalUsers,
        totalComments,
        totalCategories
      ] = await Promise.all([
        prisma.blog.count(),
        prisma.blog.count({ where: { status: 'published' } }),
        prisma.blog.count({ where: { status: 'draft' } }),
        prisma.blog.aggregate({ _sum: { views: true } }),
        prisma.user.count(),
        prisma.comment.count(),
        prisma.category.count()
      ]);

      const stats = {
        posts: {
          total: totalBlogs,
          published: publishedBlogs,
          draft: draftBlogs
        },
        analytics: {
          totalViews: totalViews._sum.views || 0,
          pageViews: totalViews._sum.views || 0,
          uniqueVisitors: Math.floor((totalViews._sum.views || 0) * 0.65), // Estimated
          avgSessionDuration: '3:45'
        },
        users: {
          total: totalUsers,
          active: Math.floor(totalUsers * 0.3), // Estimated active users
          new: Math.floor(totalUsers * 0.05) // Estimated new users
        },
        downloads: {
          total: 0, // No downloads table in current schema
          today: 0,
          week: 0
        },
        comments: {
          total: totalComments,
          pending: 0
        },
        categories: {
          total: totalCategories
        }
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // GET /api/admin/blogs - Get all blogs with filtering (admin only)
  app.get("/api/admin/blogs", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, status, categoryId, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
      
      const skip = (Number(page) - 1) * Number(limit);
      const where: any = {};
      
      if (status) {
        where.status = status;
      }
      
      if (categoryId) {
        where.categoryId = Number(categoryId);
      }

      const [blogs, total] = await Promise.all([
        prisma.blog.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { [sortBy as string]: sortOrder },
          include: {
            categories: {
              include: {
                category: true
              }
            },
            seoMeta: true,
            comments: {
              select: {
                id: true
              }
            }
          }
        }),
        prisma.blog.count({ where })
      ]);

      // Format blogs data
      const formattedBlogs = blogs.map(blog => ({
        id: blog.id,
        title: blog.title,
        slug: blog.seoSlug,
        author: blog.author,
        status: blog.status,
        views: blog.views || 0,
        createdAt: blog.createdAt,
        featuredImage: blog.featuredImage,
        category: blog.categories[0]?.category?.name || null,
        categoryId: blog.categoryId,
        tags: blog.tags,
        downloadLink: blog.downloadLink,
        commentsCount: blog.comments.length,
        seoMeta: blog.seoMeta[0] || null
      }));

      res.json({
        data: formattedBlogs,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit))
      });
    } catch (error) {
      console.error("Error fetching admin blogs:", error);
      res.status(500).json({ error: "Failed to fetch blogs" });
    }
  });

  // POST /api/admin/blogs - Create new blog with SEO fields (admin only)
  app.post("/api/admin/blogs", requireAdmin, async (req: Request, res: Response) => {
    try {
      const {
        title,
        content,
        author,
        featuredImage,
        categoryId,
        tags,
        downloadLink,
        status = 'draft',
        seoSlug,
        seoTitle,
        seoDescription,
        seoKeywords,
        canonicalUrl,
        metaRobots,
        ogTitle,
        ogDescription,
        ogImage
      } = req.body;

      // Generate slug if not provided
      const slug = seoSlug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

      // Create blog post
      const blog = await prisma.blog.create({
        data: {
          title,
          content,
          author: author || req.user?.name || 'Admin',
          seoSlug: slug,
          status: status as any,
          featuredImage: featuredImage || '',
          categoryId: categoryId ? Number(categoryId) : 1,
          tags: tags || '',
          downloadLink,
          views: 0,
          createdAt: new Date()
        }
      });

      // Create SEO meta if provided
      if (seoTitle || seoDescription || seoKeywords || canonicalUrl || metaRobots || ogTitle || ogDescription) {
        await prisma.seoMeta.create({
          data: {
            postId: blog.id,
            seoTitle,
            seoDescription,
            seoKeywords,
            seoSlug: slug,
            canonicalUrl,
            metaRobots: metaRobots as any,
            ogTitle,
            ogDescription,
            ogImage: ogImage || featuredImage
          }
        });
      }

      res.status(201).json({ 
        id: blog.id, 
        slug: blog.seoSlug,
        message: 'Blog created successfully' 
      });
    } catch (error) {
      console.error("Error creating blog:", error);
      res.status(500).json({ error: "Failed to create blog" });
    }
  });

  // PUT /api/admin/blogs/:id - Update blog with SEO fields (admin only)
  app.put("/api/admin/blogs/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        title,
        content,
        author,
        featuredImage,
        categoryId,
        tags,
        downloadLink,
        status,
        seoSlug,
        seoTitle,
        seoDescription,
        seoKeywords,
        canonicalUrl,
        metaRobots,
        ogTitle,
        ogDescription,
        ogImage
      } = req.body;

      // Update blog post
      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (author !== undefined) updateData.author = author;
      if (featuredImage !== undefined) updateData.featuredImage = featuredImage;
      if (categoryId !== undefined) updateData.categoryId = Number(categoryId);
      if (tags !== undefined) updateData.tags = tags;
      if (downloadLink !== undefined) updateData.downloadLink = downloadLink;
      if (status !== undefined) updateData.status = status;
      if (seoSlug !== undefined) updateData.seoSlug = seoSlug;

      const blog = await prisma.blog.update({
        where: { id: Number(id) },
        data: updateData
      });

      // Update or create SEO meta
      const existingSeoMeta = await prisma.seoMeta.findFirst({
        where: { postId: Number(id) }
      });

      const seoData: any = {};
      if (seoTitle !== undefined) seoData.seoTitle = seoTitle;
      if (seoDescription !== undefined) seoData.seoDescription = seoDescription;
      if (seoKeywords !== undefined) seoData.seoKeywords = seoKeywords;
      if (seoSlug !== undefined) seoData.seoSlug = seoSlug;
      if (canonicalUrl !== undefined) seoData.canonicalUrl = canonicalUrl;
      if (metaRobots !== undefined) seoData.metaRobots = metaRobots;
      if (ogTitle !== undefined) seoData.ogTitle = ogTitle;
      if (ogDescription !== undefined) seoData.ogDescription = ogDescription;
      if (ogImage !== undefined) seoData.ogImage = ogImage;

      if (Object.keys(seoData).length > 0) {
        if (existingSeoMeta) {
          await prisma.seoMeta.update({
            where: { id: existingSeoMeta.id },
            data: seoData
          });
        } else {
          await prisma.seoMeta.create({
            data: {
              ...seoData,
              postId: Number(id)
            }
          });
        }
      }

      res.json({ 
        id: blog.id,
        slug: blog.seoSlug,
        message: 'Blog updated successfully' 
      });
    } catch (error) {
      console.error("Error updating blog:", error);
      res.status(500).json({ error: "Failed to update blog" });
    }
  });

  // GET /api/admin/seo-performance - Get SEO performance metrics (admin only)
  app.get("/api/admin/seo-performance", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { days = 7 } = req.query;
      const daysAgo = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

      // Get blog view statistics
      const blogStats = await prisma.blog.aggregate({
        _sum: { views: true },
        _count: true,
        where: {
          createdAt: { gte: daysAgo }
        }
      });

      // Get total views for all time
      const totalViews = await prisma.blog.aggregate({
        _sum: { views: true }
      });

      // Get SEO meta coverage
      const [totalBlogs, blogsWithSeoMeta] = await Promise.all([
        prisma.blog.count(),
        prisma.seoMeta.count()
      ]);

      const performance = {
        searchTraffic: {
          value: blogStats._sum.views || 0,
          period: `Last ${days} days`,
          change: '+12.5%' // Mock change percentage
        },
        impressions: {
          value: (blogStats._sum.views || 0) * 3, // Estimated impressions
          period: `Last ${days} days`,
          change: '+8.3%'
        },
        keywordsRanking: {
          value: blogsWithSeoMeta,
          total: totalBlogs,
          percentage: Math.round((blogsWithSeoMeta / totalBlogs) * 100)
        },
        avgPosition: {
          value: 15.2, // Mock average position
          change: '-2.1'
        },
        weeklyTraffic: await getWeeklyTrafficData()
      };

      res.json(performance);
    } catch (error) {
      console.error("Error fetching SEO performance:", error);
      res.status(500).json({ error: "Failed to fetch SEO performance" });
    }
  });

  // Helper function to get weekly traffic data
  async function getWeeklyTrafficData() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dayName = days[date.getDay() === 0 ? 6 : date.getDay() - 1];
      
      // Get views for this specific day (mock data for now)
      const views = Math.floor(Math.random() * 3000) + 1000;
      const downloads = Math.floor(Math.random() * 500) + 100;
      
      data.push({
        name: dayName,
        views,
        downloads
      });
    }
    
    return data;
  }

  // Periodic storage check to switch to PrismaStorage when database becomes available
  setInterval(async () => {
    if (storageType === 'memory') {
      // Only check if we're still using memory storage
      try {
        const isConnected = await isDatabaseConnected();
        if (isConnected) {
          console.log('🔄 Database now available, switching to PrismaStorage...');
          await selectStorage();
        }
      } catch (error) {
        // Silently ignore errors during periodic checks
      }
    }
  }, 30000); // Check every 30 seconds

  const httpServer = createServer(app);
  return httpServer;
}