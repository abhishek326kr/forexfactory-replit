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

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasourceUrl: process.env.MYSQL_DATABASE_URL,
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
export async function connectDB(maxRetries = 5): Promise<boolean> {
  const baseDelay = 1000; // Start with 1 second
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Database connection attempt ${attempt}/${maxRetries}...`);
      console.log('📊 Database URL:', process.env.MYSQL_DATABASE_URL ? 'Set (hidden for security)' : 'Not set');
      
      // Test the connection
      await prisma.$connect();
      
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
      console.error(`❌ Connection attempt ${attempt} failed:`, error.message);
      
      // Update status
      globalForPrisma.dbStatus = {
        connected: false,
        lastCheck: new Date(),
        lastError: error.message,
        retryCount: attempt
      };
      
      if (attempt < maxRetries) {
        // Calculate exponential backoff delay with jitter
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        console.log(`⏳ Waiting ${Math.round(delay / 1000)}s before retry...`);
        await sleep(delay);
      }
    }
  }
  
  // All attempts failed
  console.error('❌ All database connection attempts failed:');
  console.error('  Error message:', lastError?.message);
  console.error('  Error code:', lastError?.code);
  
  if (lastError?.message?.includes("Can't reach database server")) {
    console.error('  💡 Check if the database server is running and accessible');
    console.error('  💡 Verify the MYSQL_DATABASE_URL environment variable');
    console.error('  💡 Ensure @ symbols are encoded as %40 in the password');
  }
  
  // Don't exit in development, allow app to run with limited functionality
  if (process.env.NODE_ENV === 'production') {
    console.error('⚠️ Running in production mode - would normally exit, but continuing with degraded functionality');
  } else {
    console.warn('⚠️ Running in development mode with database unavailable - some features will not work');
  }
  
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

// Periodic health check (every 30 seconds)
if (process.env.NODE_ENV !== 'test') {
  setInterval(async () => {
    try {
      await isDatabaseConnected();
    } catch (error) {
      // Silently handle health check errors
    }
  }, 30000);
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});