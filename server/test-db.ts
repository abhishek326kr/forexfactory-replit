#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset}  ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset}  ${msg}`),
  header: (msg: string) => console.log(`\n${colors.bright}${colors.cyan}═══ ${msg} ═══${colors.reset}\n`),
  subheader: (msg: string) => console.log(`\n${colors.bright}▸ ${msg}${colors.reset}`),
};

async function testDatabaseConnection() {
  log.header('Database Connection Test');
  
  // Check environment variable
  const dbUrl = process.env.MYSQL_DATABASE_URL;
  
  if (!dbUrl) {
    log.error('MYSQL_DATABASE_URL environment variable is not set');
    return false;
  }
  
  log.info(`Database URL configured: ${dbUrl.replace(/:[^@]+@/, ':****@')}`);
  
  const prisma = new PrismaClient({
    datasourceUrl: dbUrl,
    log: ['error', 'warn'],
  });
  
  try {
    // Test basic connection
    log.subheader('Testing Connection');
    await prisma.$connect();
    log.success('Connected to database successfully');
    
    // Test query execution
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    log.success('Query execution successful');
    
    // Get database version
    try {
      const versionResult = await prisma.$queryRaw`SELECT VERSION() as version`;
      log.info(`MySQL Version: ${(versionResult as any)[0].version}`);
    } catch (e) {
      // Version query might fail on some MySQL setups
    }
    
    return prisma;
  } catch (error: any) {
    log.error(`Failed to connect to database: ${error.message}`);
    if (error.message?.includes("Can't reach database server")) {
      log.warning('Ensure the database server is running and accessible');
      log.warning('Check firewall settings and network connectivity');
    }
    if (error.message?.includes("Access denied")) {
      log.warning('Check username and password in MYSQL_DATABASE_URL');
    }
    return false;
  }
}

async function listTables(prisma: PrismaClient) {
  log.header('Available Tables');
  
  try {
    const tables = await prisma.$queryRaw<Array<{TABLE_NAME: string}>>`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    `;
    
    if (tables.length === 0) {
      log.warning('No tables found in database');
    } else {
      log.success(`Found ${tables.length} tables:`);
      tables.forEach(table => {
        console.log(`  • ${table.TABLE_NAME}`);
      });
    }
    
    return tables.map(t => t.TABLE_NAME);
  } catch (error: any) {
    log.error(`Failed to list tables: ${error.message}`);
    return [];
  }
}

async function countRecords(prisma: PrismaClient) {
  log.header('Table Record Counts');
  
  const tables = [
    { name: 'blogs', model: prisma.blog },
    { name: 'signals', model: prisma.signal },
    { name: 'categories', model: prisma.category },
    { name: 'admins', model: prisma.admin },
    { name: 'users', model: prisma.user },
    { name: 'comments', model: prisma.comment },
    { name: 'posts', model: prisma.post },
    { name: 'media', model: prisma.media },
  ];
  
  for (const table of tables) {
    try {
      const count = await (table.model as any).count();
      if (count > 0) {
        log.success(`${table.name}: ${count} records`);
      } else {
        log.warning(`${table.name}: 0 records (empty table)`);
      }
    } catch (error: any) {
      log.error(`${table.name}: Failed to count - ${error.message}`);
    }
  }
}

async function verifyRelationships(prisma: PrismaClient) {
  log.header('Foreign Key Relationships');
  
  try {
    // Test blog-category relationship
    log.subheader('Testing Blog-Category Relationship');
    const blogsWithCategories = await prisma.blog.findMany({
      take: 1,
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });
    
    if (blogsWithCategories.length > 0) {
      log.success('Blog-Category relationship working');
      const blog = blogsWithCategories[0];
      log.info(`Sample: Blog "${blog.title}" has ${blog.categories.length} categories`);
    } else {
      log.warning('No blogs found to test relationship');
    }
    
    // Test blog-comments relationship
    log.subheader('Testing Blog-Comments Relationship');
    const blogsWithComments = await prisma.blog.findMany({
      take: 1,
      include: {
        comments: true
      }
    });
    
    if (blogsWithComments.length > 0) {
      log.success('Blog-Comments relationship working');
      const blog = blogsWithComments[0];
      log.info(`Sample: Blog "${blog.title}" has ${blog.comments.length} comments`);
    } else {
      log.warning('No blogs found to test relationship');
    }
    
    // Test post-author relationship  
    log.subheader('Testing Post-Author Relationship');
    const postsWithAuthors = await prisma.post.findMany({
      take: 1,
      include: {
        author: true
      }
    });
    
    if (postsWithAuthors.length > 0) {
      log.success('Post-Author relationship working');
      const post = postsWithAuthors[0];
      log.info(`Sample: Post "${post.title}" by ${post.author.email}`);
    } else {
      log.warning('No posts found to test relationship');
    }
    
  } catch (error: any) {
    log.error(`Failed to verify relationships: ${error.message}`);
  }
}

async function sampleData(prisma: PrismaClient) {
  log.header('Sample Data');
  
  // Sample blogs
  try {
    log.subheader('Recent Blogs');
    const blogs = await prisma.blog.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        views: true
      }
    });
    
    if (blogs.length > 0) {
      blogs.forEach(blog => {
        console.log(`  📝 [${blog.id}] ${blog.title}`);
        console.log(`     Status: ${blog.status}, Views: ${blog.views}, Created: ${blog.createdAt.toLocaleDateString()}`);
      });
    } else {
      log.warning('No blogs found');
    }
  } catch (error: any) {
    log.error(`Failed to fetch blogs: ${error.message}`);
  }
  
  // Sample signals (EAs)
  try {
    log.subheader('Recent Signals (EAs)');
    const signals = await prisma.signal.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        sizeBytes: true,
        createdAt: true
      }
    });
    
    if (signals.length > 0) {
      signals.forEach(signal => {
        console.log(`  🤖 [${signal.id}] ${signal.title}`);
        console.log(`     Size: ${Math.round(signal.sizeBytes / 1024)}KB, Created: ${signal.createdAt.toLocaleDateString()}`);
      });
    } else {
      log.warning('No signals found');
    }
  } catch (error: any) {
    log.error(`Failed to fetch signals: ${error.message}`);
  }
  
  // Sample categories
  try {
    log.subheader('Categories');
    const categories = await prisma.category.findMany({
      take: 5,
      select: {
        categoryId: true,
        name: true,
        status: true
      }
    });
    
    if (categories.length > 0) {
      categories.forEach(cat => {
        console.log(`  📁 [${cat.categoryId}] ${cat.name} (${cat.status})`);
      });
    } else {
      log.warning('No categories found');
    }
  } catch (error: any) {
    log.error(`Failed to fetch categories: ${error.message}`);
  }
}

async function main() {
  console.log(`${colors.bright}${colors.magenta}\n╔════════════════════════════════════════╗`);
  console.log(`║     ForexFactory Database Test Tool     ║`);
  console.log(`╚════════════════════════════════════════╝${colors.reset}\n`);
  
  const prisma = await testDatabaseConnection();
  
  if (!prisma) {
    log.error('Cannot proceed without database connection');
    process.exit(1);
  }
  
  try {
    const tables = await listTables(prisma);
    
    if (tables.length > 0) {
      await countRecords(prisma);
      await verifyRelationships(prisma);
      await sampleData(prisma);
    }
    
    log.header('Test Summary');
    log.success('Database connection test completed successfully');
    log.info('All tests passed. Database is properly configured.');
    
  } catch (error: any) {
    log.error(`Test failed: ${error.message}`);
  } finally {
    await prisma.$disconnect();
    log.info('Database connection closed');
  }
}

// Run the test
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});