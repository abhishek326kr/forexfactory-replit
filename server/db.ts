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
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
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