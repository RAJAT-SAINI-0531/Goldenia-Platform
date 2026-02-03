import { Router, Request, Response } from 'express';
import { walletService } from '../modules/wallet/wallet.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { z } from 'zod';

const router = Router();

// All wallet routes need login (authMiddleware checks token)

// GET /api/v1/wallet/my-wallets
// Get all wallets for logged in user
router.get('/my-wallets', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const wallets = await walletService.getUserWallets(userId);
    
    res.json({
      success: true,
      wallets
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get wallets'
    });
  }
});

// GET /api/v1/wallet/stats
// Get simple dashboard stats
// MUST be before /:walletId routes to avoid parameter matching
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // Get all wallets
    const wallets = await walletService.getUserWallets(userId);
    
    // Calculate total USD balance
    let totalUsdBalance = 0;
    for (const wallet of wallets) {
      if (wallet.type === 'fiat') {
        totalUsdBalance += wallet.balance;
      }
    }
    
    // Get all transactions
    const transactions = await walletService.getAllUserTransactions(userId);
    const totalTransactions = transactions.length;
    
    // Get recent transactions (last 5)
    const recentTransactions = transactions.slice(0, 5);

    res.json({
      success: true,
      stats: {
        totalUsdBalance,
        totalTransactions,
        totalWallets: wallets.length,
        recentTransactions
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get stats'
    });
  }
});

// GET /api/v1/wallet/:walletId
// Get specific wallet details
router.get('/:walletId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { walletId } = req.params;
    const wallet = await walletService.getWalletById(walletId);
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    // Check if this wallet belongs to the logged in user
    if (wallet.userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      wallet
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get wallet'
    });
  }
});

// POST /api/v1/wallet/transfer
// Transfer money between wallets
const transferSchema = z.object({
  fromWalletId: z.string(),
  toWalletId: z.string(),
  amount: z.number().positive(),
  description: z.string().optional()
});

router.post('/transfer', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Validate input
    const data = transferSchema.parse(req.body);

    // Check if both wallets belong to this user
    const fromWallet = await walletService.getWalletById(data.fromWalletId);
    const toWallet = await walletService.getWalletById(data.toWalletId);

    if (!fromWallet || !toWallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    if (fromWallet.userId !== req.user!.id || toWallet.userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only transfer between your own wallets'
      });
    }

    // Do the transfer
    const transaction = await walletService.transferBetweenWallets(
      data.fromWalletId,
      data.toWalletId,
      data.amount,
      data.description
    );

    res.json({
      success: true,
      message: 'Transfer successful',
      transaction
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Transfer failed'
    });
  }
});

// GET /api/v1/wallet/:walletId/transactions
// Get transaction history for a wallet
router.get('/:walletId/transactions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { walletId } = req.params;
    
    // Check if wallet belongs to user
    const wallet = await walletService.getWalletById(walletId);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    if (wallet.userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const transactions = await walletService.getWalletTransactions(walletId);

    res.json({
      success: true,
      transactions
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get transactions'
    });
  }
});

// POST /api/v1/wallet/:walletId/deposit
// Add money to wallet (for testing only)
router.post('/:walletId/deposit', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { walletId } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    // Check if wallet belongs to user
    const wallet = await walletService.getWalletById(walletId);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    if (wallet.userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const updatedWallet = await walletService.depositToWallet(walletId, amount);

    res.json({
      success: true,
      message: 'Deposit successful',
      wallet: updatedWallet
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Deposit failed'
    });
  }
});

// GET /api/v1/wallet/transactions/all
// Get all transactions for user across all wallets
router.get('/transactions/all', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const transactions = await walletService.getAllUserTransactions(userId);

    res.json({
      success: true,
      transactions
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get transactions'
    });
  }
});

// GET /api/v1/wallet/transactions/search
// Search and filter transactions
// Student approach: pass filters as query params
router.get('/transactions/search', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // Get query params
    const { type, searchText, startDate, endDate } = req.query;
    
    // Build filters object
    const filters: any = {};
    if (type) filters.type = type as string;
    if (searchText) filters.searchText = searchText as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    
    const transactions = await walletService.searchTransactions(userId, filters);

    res.json({
      success: true,
      transactions,
      count: transactions.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search transactions'
    });
  }
});

// GET /api/v1/wallet/transactions/export
// Export all transactions as CSV file
router.get('/transactions/export', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const csvData = await walletService.exportTransactionsCSV(userId);

    // Set headers to download as CSV file
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
    
    res.send(csvData);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to export transactions'
    });
  }
});

export default router;
