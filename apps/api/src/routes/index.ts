import { Router } from 'express';
import healthRouter from './health';
import authRouter from './auth';
import walletRouter from './wallet';
import kycRouter from './kyc';
import tradingRouter from './trading';
import adminRouter from './admin';
import notificationsRouter from './notifications';
import alertsRouter from './alerts';
import paymentsRouter from './payments';
import waitlistRouter from './waitlist';

const router = Router();

// Mount all routes here
router.use('/api/v1', healthRouter);
router.use('/api/v1/auth', authRouter);
router.use('/api/v1/wallet', walletRouter);
router.use('/api/v1/kyc', kycRouter);
router.use('/api/v1/trading', tradingRouter);
router.use('/api/v1/admin', adminRouter);
router.use('/api/v1/notifications', notificationsRouter);
router.use('/api/v1/alerts', alertsRouter);
router.use('/api/v1/payments', paymentsRouter);
router.use('/api/v1/waitlist', waitlistRouter);

export default router;
