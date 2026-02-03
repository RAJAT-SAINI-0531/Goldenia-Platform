import { prisma } from '../../config/database';

// This file handles gold/silver trading operations
// Simple approach: convert money between FIAT and GOLD/SILVER wallets using current prices

export const tradingService = {
  // Get current gold and silver prices
  async getCurrentPrices() {
    const prices = await prisma.assetPrice.findMany();
    return prices;
  },

  // Buy gold or silver (convert FIAT to GOLD/SILVER)
  // User pays USD from FIAT wallet, receives grams in GOLD/SILVER wallet
  async buyAsset(
    userId: string,
    asset: string, // 'gold' or 'silver'
    amountUsd: number // how much USD to spend
  ) {
    // Get current price
    const assetPrice = await prisma.assetPrice.findUnique({
      where: { asset }
    });

    if (!assetPrice) {
      throw new Error('Invalid asset');
    }

    // Calculate how many grams user will get
    const gramsReceived = amountUsd / assetPrice.priceUsd;

    // Get user's wallets
    const fiatWallet = await prisma.wallet.findFirst({
      where: {
        userId,
        type: 'fiat'
      }
    });

    const assetWallet = await prisma.wallet.findFirst({
      where: {
        userId,
        type: asset // 'gold' or 'silver'
      }
    });

    if (!fiatWallet || !assetWallet) {
      throw new Error('Wallets not found');
    }

    // Check if user has enough FIAT balance
    if (fiatWallet.balance < amountUsd) {
      throw new Error('Insufficient FIAT balance');
    }

    // Do the trade in one transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct USD from FIAT wallet
      await tx.wallet.update({
        where: { id: fiatWallet.id },
        data: { balance: { decrement: amountUsd } }
      });

      // Add grams to GOLD/SILVER wallet
      await tx.wallet.update({
        where: { id: assetWallet.id },
        data: { balance: { increment: gramsReceived } }
      });

      // Record the trade
      const trade = await tx.trade.create({
        data: {
          userId,
          tradeType: 'buy',
          asset,
          amountGrams: gramsReceived,
          pricePerGram: assetPrice.priceUsd,
          totalUsd: amountUsd,
          status: 'completed'
        }
      });

      return trade;
    });

    return result;
  },

  // Sell gold or silver (convert GOLD/SILVER back to FIAT)
  // User gives grams from GOLD/SILVER wallet, receives USD in FIAT wallet
  async sellAsset(
    userId: string,
    asset: string, // 'gold' or 'silver'
    amountGrams: number // how many grams to sell
  ) {
    // Get current price
    const assetPrice = await prisma.assetPrice.findUnique({
      where: { asset }
    });

    if (!assetPrice) {
      throw new Error('Invalid asset');
    }

    // Calculate how much USD user will receive
    const usdReceived = amountGrams * assetPrice.priceUsd;

    // Get user's wallets
    const fiatWallet = await prisma.wallet.findFirst({
      where: {
        userId,
        type: 'fiat'
      }
    });

    const assetWallet = await prisma.wallet.findFirst({
      where: {
        userId,
        type: asset
      }
    });

    if (!fiatWallet || !assetWallet) {
      throw new Error('Wallets not found');
    }

    // Check if user has enough grams
    if (assetWallet.balance < amountGrams) {
      throw new Error(`Insufficient ${asset} balance`);
    }

    // Do the trade in one transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct grams from GOLD/SILVER wallet
      await tx.wallet.update({
        where: { id: assetWallet.id },
        data: { balance: { decrement: amountGrams } }
      });

      // Add USD to FIAT wallet
      await tx.wallet.update({
        where: { id: fiatWallet.id },
        data: { balance: { increment: usdReceived } }
      });

      // Record the trade
      const trade = await tx.trade.create({
        data: {
          userId,
          tradeType: 'sell',
          asset,
          amountGrams,
          pricePerGram: assetPrice.priceUsd,
          totalUsd: usdReceived,
          status: 'completed'
        }
      });

      return trade;
    });

    return result;
  },

  // Get user's trade history
  async getUserTrades(userId: string) {
    const trades = await prisma.trade.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    return trades;
  },

  // Admin: Update asset prices
  // In real app, this would fetch from external API
  // For now, admin can manually update prices
  async updatePrice(asset: string, newPrice: number) {
    const updated = await prisma.assetPrice.update({
      where: { asset },
      data: { priceUsd: newPrice }
    });
    return updated;
  }
};
