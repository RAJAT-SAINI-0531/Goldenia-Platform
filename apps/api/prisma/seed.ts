import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Create a default admin user for testing
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@goldenia.com' },
    update: {},
    create: {
      email: 'admin@goldenia.com',
      password: hashedPassword,
      role: 'admin',
      adminRole: 'super_admin',
      emailVerified: true,
      kycStatus: 'verified'
    }
  });
  
  console.log('Created admin user:', admin.email);
  
  // Create initial gold and silver prices
  // Gold: around $60/gram, Silver: around $0.75/gram (realistic 2026 prices)
  await prisma.assetPrice.upsert({
    where: { asset: 'gold' },
    update: {},
    create: {
      asset: 'gold',
      priceUsd: 60.50
    }
  });
  
  await prisma.assetPrice.upsert({
    where: { asset: 'silver' },
    update: {},
    create: {
      asset: 'silver',
      priceUsd: 0.75
    }
  });
  
  console.log('Created initial asset prices');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
