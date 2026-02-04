import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestUsers() {
  console.log('Creating test users...\n');

  const users = [
    { email: 'test2@gmail.com', password: 'test2@123', name: 'Test User 2' },
    { email: 'test3@gmail.com', password: 'test3@123', name: 'Test User 3' },
    { email: 'test4@gmail.com', password: 'test4@123', name: 'Test User 4' },
  ];

  for (const userData of users) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        console.log(`User ${userData.email} already exists. Skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          emailVerified: true,
          role: 'user'
        }
      });

      console.log(`✓ Created user: ${userData.email}`);

      // Create fiat wallet with $1000
      const fiatWallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          type: 'fiat',
          currency: 'USD',
          balance: 1000.00,
          status: 'active'
        }
      });

      console.log(`✓ Created fiat wallet with $1000 for ${userData.email}`);

      // Create gold wallet
      await prisma.wallet.create({
        data: {
          userId: user.id,
          type: 'gold',
          currency: 'grams',
          balance: 0,
          status: 'active'
        }
      });

      // Create silver wallet
      await prisma.wallet.create({
        data: {
          userId: user.id,
          type: 'silver',
          currency: 'grams',
          balance: 0,
          status: 'active'
        }
      });

      // Create BPC wallet
      await prisma.wallet.create({
        data: {
          userId: user.id,
          type: 'bpc',
          currency: 'BPC',
          balance: 0,
          status: 'active'
        }
      });

      console.log(`✓ Created all wallets for ${userData.email}\n`);

    } catch (error) {
      console.error(`Error creating user ${userData.email}:`, error);
    }
  }

  console.log('All test users created successfully!');
}

createTestUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
