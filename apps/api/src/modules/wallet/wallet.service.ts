import { prisma } from '../../config/database';

// This file handles all wallet operations
// Think of it like a bank teller - checks balances, transfers money, shows history

export const walletService = {
  // Get all wallets for a user
  // Example: Show me all my wallets (FIAT, GOLD, SILVER, BPC)
  async getUserWallets(userId: string) {
    const wallets = await prisma.wallet.findMany({
      where: { userId },
      orderBy: { type: 'asc' }
    });
    return wallets;
  },

  // Get one specific wallet by ID
  // Example: Show me my FIAT wallet details
  async getWalletById(walletId: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId }
    });
    return wallet;
  },

  // Transfer money between wallets
  // Example: Move $100 from my FIAT wallet to my BPC wallet
  async transferBetweenWallets(
    fromWalletId: string,
    toWalletId: string,
    amount: number,
    description?: string
  ) {
    // First, check if both wallets exist
    const fromWallet = await prisma.wallet.findUnique({
      where: { id: fromWalletId }
    });
    const toWallet = await prisma.wallet.findUnique({
      where: { id: toWalletId }
    });

    if (!fromWallet || !toWallet) {
      throw new Error('Wallet not found');
    }

    // Check if sender has enough money
    if (fromWallet.balance < amount) {
      throw new Error('Insufficient balance');
    }

    // Check if wallets are active
    if (fromWallet.status !== 'active' || toWallet.status !== 'active') {
      throw new Error('Wallet is frozen');
    }

    // Do the transfer in one transaction (so if anything fails, nothing happens)
    const result = await prisma.$transaction(async (tx) => {
      // Subtract from sender
      await tx.wallet.update({
        where: { id: fromWalletId },
        data: { balance: { decrement: amount } }
      });

      // Add to receiver
      await tx.wallet.update({
        where: { id: toWalletId },
        data: { balance: { increment: amount } }
      });

      // Record the transaction
      const transaction = await tx.transaction.create({
        data: {
          fromWalletId,
          toWalletId,
          amount,
          type: 'transfer',
          status: 'completed',
          description: description || 'Wallet transfer'
        }
      });

      return transaction;
    });

    return result;
  },

  // Get transaction history for a wallet
  // Example: Show me all transactions for my FIAT wallet
  async getWalletTransactions(walletId: string) {
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { fromWalletId: walletId },
          { toWalletId: walletId }
        ]
      },
      include: {
        fromWallet: true,
        toWallet: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return transactions;
  },

  // Add money to a wallet (for testing)
  // Example: Add $1000 to my FIAT wallet
  async depositToWallet(walletId: string, amount: number) {
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const updatedWallet = await prisma.wallet.update({
      where: { id: walletId },
      data: { balance: { increment: amount } }
    });

    // Record the deposit
    await prisma.transaction.create({
      data: {
        fromWalletId: walletId,
        toWalletId: walletId,
        amount,
        type: 'deposit',
        status: 'completed',
        description: 'Deposit to wallet'
      }
    });

    return updatedWallet;
  },

  // Get all transactions for a user across all wallets
  // Example: Show me everything - transfers, deposits, all wallets
  async getAllUserTransactions(userId: string) {
    // First get all user's wallets
    const wallets = await prisma.wallet.findMany({
      where: { userId }
    });

    const walletIds = wallets.map(w => w.id);

    // Get all transactions where user's wallets are involved
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { fromWalletId: { in: walletIds } },
          { toWalletId: { in: walletIds } }
        ]
      },
      include: {
        fromWallet: true,
        toWallet: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return transactions;
  },

  // Search and filter transactions
  // Simple student approach: get all transactions first, then filter in JavaScript
  async searchTransactions(userId: string, filters: {
    type?: string;      // 'sent', 'received', 'trade', or 'all'
    searchText?: string; // search in description or amount
    startDate?: Date;
    endDate?: Date;
  }) {
    // Get all user transactions first
    let transactions = await this.getAllUserTransactions(userId);
    
    // Get user's wallet IDs to determine sent vs received
    const wallets = await prisma.wallet.findMany({
      where: { userId }
    });
    const userWalletIds = wallets.map(w => w.id);

    // Filter by type
    if (filters.type && filters.type !== 'all') {
      if (filters.type === 'sent') {
        // Sent = fromWallet belongs to user
        transactions = transactions.filter(t => 
          userWalletIds.includes(t.fromWalletId)
        );
      } else if (filters.type === 'received') {
        // Received = toWallet belongs to user AND fromWallet does NOT belong to user
        transactions = transactions.filter(t => 
          userWalletIds.includes(t.toWalletId) && !userWalletIds.includes(t.fromWalletId)
        );
      } else if (filters.type === 'trade') {
        // Trade = type contains 'buy' or 'sell'
        transactions = transactions.filter(t => 
          t.type.includes('buy') || t.type.includes('sell')
        );
      }
    }

    // Filter by search text (search in description and amount)
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      transactions = transactions.filter(t => {
        const descMatch = t.description?.toLowerCase().includes(searchLower);
        const amountMatch = t.amount.toString().includes(searchLower);
        return descMatch || amountMatch;
      });
    }

    // Filter by date range
    if (filters.startDate) {
      transactions = transactions.filter(t => 
        new Date(t.createdAt) >= filters.startDate!
      );
    }
    if (filters.endDate) {
      transactions = transactions.filter(t => 
        new Date(t.createdAt) <= filters.endDate!
      );
    }

    return transactions;
  },

  // Export transactions as CSV data
  // Convert transaction data to CSV format string
  async exportTransactionsCSV(userId: string) {
    const transactions = await this.getAllUserTransactions(userId);

    // CSV header
    let csv = 'Date,Type,From Wallet,To Wallet,Amount,Currency,Status,Description\n';

    // Add each transaction as a row
    for (const tx of transactions) {
      const date = new Date(tx.createdAt).toLocaleString();
      const type = tx.type;
      const from = tx.fromWallet.type;
      const to = tx.toWallet.type;
      const amount = tx.amount;
      const currency = tx.fromWallet.currency;
      const status = tx.status;
      const description = tx.description || '';

      csv += `"${date}","${type}","${from}","${to}","${amount}","${currency}","${status}","${description}"\n`;
    }

    return csv;
  }
};

