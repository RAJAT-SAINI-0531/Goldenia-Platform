import { Router, Request, Response } from 'express';
import { adminService } from '../modules/admin/admin.service';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Middleware to check if user is admin
const adminOnly = (req: Request, res: Response, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// All routes require auth + admin role
router.use(authMiddleware);
router.use(adminOnly);

// GET /api/v1/admin/stats
// Get dashboard statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await adminService.getDashboardStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get stats'
    });
  }
});

// GET /api/v1/admin/users
// Get all users (paginated)
router.get('/users', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await adminService.getAllUsers(page, limit);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get users'
    });
  }
});

// GET /api/v1/admin/kyc-requests
// Get all pending KYC requests
router.get('/kyc-requests', async (req: Request, res: Response) => {
  try {
    const requests = await adminService.getPendingKycRequests();
    
    res.json({
      success: true,
      requests
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get KYC requests'
    });
  }
});

// GET /api/v1/admin/transactions
// Get all transactions (paginated)
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await adminService.getAllTransactions(page, limit);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get transactions'
    });
  }
});

export default router;
