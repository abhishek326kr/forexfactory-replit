import { PrismaClient } from '@prisma/client';

// Create a single instance of Prisma Client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasourceUrl: process.env.MYSQL_DATABASE_URL,
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Export db as an alias for prisma for compatibility
export const db = prisma;

// Helper function to handle database connection
export async function connectDB() {
  try {
    console.log('🔄 Attempting to connect to database...');
    console.log('📊 Database URL:', process.env.MYSQL_DATABASE_URL ? 'Set (hidden for security)' : 'Not set');
    
    // Test the connection
    await prisma.$connect();
    
    // Verify connection with a simple query
    await prisma.$queryRaw`SELECT 1`;
    
    console.log('✅ Database connected successfully');
  } catch (error: any) {
    console.error('❌ Database connection failed:');
    console.error('  Error message:', error.message);
    console.error('  Error code:', error.code);
    
    if (error.message?.includes("Can't reach database server")) {
      console.error('  💡 Check if the database server is running and accessible');
      console.error('  💡 Verify the MYSQL_DATABASE_URL environment variable');
      console.error('  💡 Ensure @ symbols are encoded as %40 in the password');
    }
    
    // Don't exit in development, allow app to run with limited functionality
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

// Helper function to disconnect from database
export async function disconnectDB() {
  await prisma.$disconnect();
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});