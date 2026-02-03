import { Router, Request, Response } from 'express';
import { tradingService } from '../modules/trading/trading.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { z } from 'zod';

const router = Router();

// All trading routes need login

// GET /api/v1/trading/prices
// Get current gold and silver prices
router.get('/prices', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prices = await tradingService.getCurrentPrices();
    
    res.json({
      success: true,
      prices
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get prices'
    });
  }
});

// POST /api/v1/trading/buy
// Buy gold or silver
const buySchema = z.object({
  asset: z.enum(['gold', 'silver']),
  amountUsd: z.number().positive()
});

router.post('/buy', authMiddleware, async (req: Request, res: Response) => {
  try {
    const data = buySchema.parse(req.body);
    const userId = req.user!.id;

    const trade = await tradingService.buyAsset(
      userId,
      data.asset,
      data.amountUsd
    );

    res.json({
      success: true,
      message: `Successfully bought ${trade.amountGrams.toFixed(4)} grams of ${data.asset}`,
      trade
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to buy asset'
    });
  }
});

// POST /api/v1/trading/sell
// Sell gold or silver
const sellSchema = z.object({
  asset: z.enum(['gold', 'silver']),
  amountGrams: z.number().positive()
});

router.post('/sell', authMiddleware, async (req: Request, res: Response) => {
  try {
    const data = sellSchema.parse(req.body);
    const userId = req.user!.id;

    const trade = await tradingService.sellAsset(
      userId,
      data.asset,
      data.amountGrams
    );

    res.json({
      success: true,
      message: `Successfully sold ${data.amountGrams.toFixed(4)} grams of ${data.asset} for $${trade.totalUsd.toFixed(2)}`,
      trade
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to sell asset'
    });
  }
});

// GET /api/v1/trading/my-trades
// Get my trade history
router.get('/my-trades', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const trades = await tradingService.getUserTrades(userId);

    res.json({
      success: true,
      trades
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get trades'
    });
  }
});

// Admin route: Update prices
// POST /api/v1/trading/admin/update-price
const updatePriceSchema = z.object({
  asset: z.enum(['gold', 'silver']),
  price: z.number().positive()
});

router.post('/admin/update-price', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const data = updatePriceSchema.parse(req.body);
    const updated = await tradingService.updatePrice(data.asset, data.price);

    res.json({
      success: true,
      message: `${data.asset} price updated to $${data.price}/gram`,
      price: updated
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update price'
    });
  }
});

export default router;
