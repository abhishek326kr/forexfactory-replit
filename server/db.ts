import { PrismaClient } from '@prisma/client';

// Create a single instance of Prisma Client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  dbStatus: {
    connected: boolean;
    lastCheck: Date;
    lastError?: string;
    retryCount: number;
  };
};

// Add connection timeout to DATABASE_URL for Neon scale-to-zero support (Postgres only)
const getDatabaseUrl = () => {
  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return dbUrl;

  const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');
  if (isPostgres && !dbUrl.includes('connect_timeout')) {
    const separator = dbUrl.includes('?') ? '&' : '?';
    dbUrl = `${dbUrl}${separator}connect_timeout=15`;
  }
  return dbUrl;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn'] : ['error'],
  datasourceUrl: getDatabaseUrl(),
  errorFormat: 'minimal',
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Initialize database status
globalForPrisma.dbStatus = globalForPrisma.dbStatus ?? {
  connected: false,
  lastCheck: new Date(),
  retryCount: 0
};

// Export db as an alias for prisma for compatibility
export const db = prisma;

// Export database status for monitoring
export const getDatabaseStatus = () => globalForPrisma.dbStatus;

// Helper function to sleep for exponential backoff
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to handle database connection with retry logic
export async function connectDB(maxRetries = 2): Promise<boolean> {
  const baseDelay = 1000; // Start with 1 second
  let lastError: any;
  
  // Only attempt connection if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.log('ℹ️ DATABASE_URL not set - using in-memory storage');
    globalForPrisma.dbStatus = {
      connected: false,
      lastCheck: new Date(),
      lastError: 'DATABASE_URL not configured',
      retryCount: 0
    };
    return false;
  }
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Database connection attempt ${attempt}/${maxRetries}...`);
      
      // Test the connection with a timeout
      const connectPromise = prisma.$connect();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      );
      
      await Promise.race([connectPromise, timeoutPromise]);
      
      // Verify connection with a simple query
      await prisma.$queryRaw`SELECT 1`;
      
      // Update status
      globalForPrisma.dbStatus = {
        connected: true,
        lastCheck: new Date(),
        retryCount: attempt - 1
      };
      
      console.log(`✅ Database connected successfully on attempt ${attempt}`);
      return true;
    } catch (error: any) {
      lastError = error;
      
      // Update status
      globalForPrisma.dbStatus = {
        connected: false,
        lastCheck: new Date(),
        lastError: error.message,
        retryCount: attempt
      };
      
      if (attempt < maxRetries) {
        // Short delay before retry
        const delay = baseDelay * attempt;
        console.log(`⏳ Retrying in ${delay / 1000}s...`);
        await sleep(delay);
      }
    }
  }
  
  // All attempts failed - log once and continue with in-memory storage
  console.warn('⚠️ Database connection failed - falling back to in-memory storage');
  console.log(`   Last error: ${lastError?.message}`);
  console.log('ℹ️ The application will continue with limited functionality.');
  console.log('   In-memory storage will be used for data persistence.');
  
  return false;
}

// Helper function to check if database is currently connected
export async function isDatabaseConnected(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    globalForPrisma.dbStatus.connected = true;
    globalForPrisma.dbStatus.lastCheck = new Date();
    return true;
  } catch (error: any) {
    globalForPrisma.dbStatus.connected = false;
    globalForPrisma.dbStatus.lastCheck = new Date();
    globalForPrisma.dbStatus.lastError = error.message;
    return false;
  }
}

// Helper function to get database health metrics
export async function getDatabaseHealth() {
  const status = getDatabaseStatus();
  let tableStatus = {};
  let recordCounts = {};
  
  if (status.connected) {
    try {
      // Check key tables
      const [blogsCount, signalsCount, categoriesCount, adminsCount, usersCount] = await Promise.allSettled([
        prisma.blog.count(),
        prisma.signal.count(),
        prisma.category.count(),
        prisma.admin.count(),
        prisma.user.count()
      ]);
      
      recordCounts = {
        blogs: blogsCount.status === 'fulfilled' ? blogsCount.value : 0,
        signals: signalsCount.status === 'fulfilled' ? signalsCount.value : 0,
        categories: categoriesCount.status === 'fulfilled' ? categoriesCount.value : 0,
        admins: adminsCount.status === 'fulfilled' ? adminsCount.value : 0,
        users: usersCount.status === 'fulfilled' ? usersCount.value : 0
      };
      
      tableStatus = {
        blogs: blogsCount.status === 'fulfilled',
        signals: signalsCount.status === 'fulfilled',
        categories: categoriesCount.status === 'fulfilled',
        admins: adminsCount.status === 'fulfilled',
        users: usersCount.status === 'fulfilled'
      };
    } catch (error: any) {
      console.error('Error getting database health metrics:', error.message);
    }
  }
  
  return {
    status: status.connected ? 'healthy' : 'unhealthy',
    connected: status.connected,
    lastCheck: status.lastCheck,
    lastError: status.lastError,
    retryCount: status.retryCount,
    tables: tableStatus,
    recordCounts
  };
}

// Helper function to disconnect from database
export async function disconnectDB() {
  await prisma.$disconnect();
}

// Periodic health check (disabled when database is not connected)
if (process.env.NODE_ENV !== 'test') {
  setInterval(async () => {
    // Only check if we think we're connected to avoid spamming logs
    if (globalForPrisma.dbStatus.connected) {
      try {
        await isDatabaseConnected();
      } catch (error) {
        // Silently handle health check errors
      }
    }
  }, 30000);
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});