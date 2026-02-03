import { prisma } from '../../config/database';

// Admin service to manage platform
// Simple functions to get stats and manage users

export const adminService = {
  // Get dashboard stats - total users, KYC pending, trades, etc.
  async getDashboardStats() {
    // Count total users
    const totalUsers = await prisma.user.count();

    // Count users by KYC status
    const kycPending = await prisma.user.count({
      where: { kycStatus: 'pending' }
    });

    const kycVerified = await prisma.user.count({
      where: { kycStatus: 'verified' }
    });

    // Count total trades
    const totalTrades = await prisma.trade.count();

    // Get current gold and silver prices
    const prices = await prisma.assetPrice.findMany();

    return {
      totalUsers,
      kycPending,
      kycVerified,
      totalTrades,
      prices
    };
  },

  // Get all users with basic info
  async getAllUsers(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const users = await prisma.user.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        role: true,
        kycStatus: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.user.count();

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  },

  // Get all pending KYC requests
  async getPendingKycRequests() {
    const users = await prisma.user.findMany({
      where: { kycStatus: 'pending' },
      select: {
        id: true,
        email: true,
        kycStatus: true,
        kycSubmittedAt: true,
        kycDocuments: true
      },
      orderBy: { kycSubmittedAt: 'desc' }
    });

    return users;
  },

  // Get all transactions across the platform
  async getAllTransactions(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    // Get all transactions with wallet info
    const transactions = await prisma.transaction.findMany({
      skip,
      take: limit,
      include: {
        fromWallet: {
          select: {
            id: true,
            type: true,
            userId: true
          }
        },
        toWallet: {
          select: {
            id: true,
            type: true,
            userId: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.transaction.count();

    return {
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
};
