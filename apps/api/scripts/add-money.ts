import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addMoney() {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: 'test@gmail.com' }
    });

    if (!user) {
      console.log('User not found: test@gmail.com');
      console.log('Please create this user first by signing up at http://localhost:3000/signup');
      return;
    }

    console.log(`Found user: ${user.email} (ID: ${user.id})`);

    // Find their FIAT wallet
    const fiatWallet = await prisma.wallet.findFirst({
      where: {
        userId: user.id,
        type: 'fiat'
      }
    });

    if (!fiatWallet) {
      console.log('FIAT wallet not found');
      return;
    }

    console.log(`Current FIAT balance: ${fiatWallet.balance} USD`);

    // Add 100 USD
    const updated = await prisma.wallet.update({
      where: { id: fiatWallet.id },
      data: { balance: { increment: 100 } }
    });

    console.log(`Added 100 USD to test@gmail.com FIAT wallet`);
    console.log(`New balance: ${updated.balance} USD`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMoney();
