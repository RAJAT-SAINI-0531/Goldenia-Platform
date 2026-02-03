import { PrismaClient } from '@prisma/client';

// Create one instance of Prisma client to use everywhere
const prisma = new PrismaClient();

// Test database connection
export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
    return true;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    return false;
  }
}

// Disconnect database
export async function disconnectDatabase() {
  await prisma.$disconnect();
}

// Export prisma for use in other files
export default prisma;
export { prisma };
