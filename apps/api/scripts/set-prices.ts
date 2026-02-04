import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setPrices() {
  console.log('Setting initial gold and silver prices...');

  try {
    // Set Gold price - $85 per gram (realistic current price)
    await prisma.assetPrice.upsert({
      where: { asset: 'gold' },
      update: { priceUsd: 85.00 },
      create: {
        asset: 'gold',
        priceUsd: 85.00
      }
    });
    console.log('✅ Gold price set to $85.00 per gram');

    // Set Silver price - $1.10 per gram (realistic current price)
    await prisma.assetPrice.upsert({
      where: { asset: 'silver' },
      update: { priceUsd: 1.10 },
      create: {
        asset: 'silver',
        priceUsd: 1.10
      }
    });
    console.log('✅ Silver price set to $1.10 per gram');

    console.log('\n✅ Prices set successfully!');
  } catch (error) {
    console.error('Error setting prices:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setPrices();
