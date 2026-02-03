import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { priceAlertsService } from '../modules/alerts/alerts.service';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get all alerts for logged-in user
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const alerts = await priceAlertsService.getUserAlerts(userId);

    res.json({ alerts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get active alerts for logged-in user
router.get('/active', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const alerts = await priceAlertsService.getActiveAlerts(userId);

    res.json({ alerts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new price alert
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { asset, targetPrice, condition } = req.body;

    console.log('POST /alerts - userId from auth:', userId);
    console.log('POST /alerts - body:', { asset, targetPrice, condition });

    if (!asset || targetPrice === undefined || targetPrice === null || !condition) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const alert = await priceAlertsService.createAlert({
      userId,
      asset,
      targetPrice: parseFloat(targetPrice),
      condition,
    });

    res.json({ alert });
  } catch (error: any) {
    console.error('Error creating alert:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete an alert
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    await priceAlertsService.deleteAlert(id, userId);

    res.json({ message: 'Alert deleted' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
