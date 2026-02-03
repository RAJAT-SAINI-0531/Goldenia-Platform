import { Router } from 'express';
import prisma from '../config/database';

const router = Router();

// Simple health check endpoint
// Returns OK if API and database are working
router.get('/health', async (req, res) => {
  try {
    // Try to query database
    await prisma.$queryRaw`SELECT 1`;
    
    // If we get here, everything is working
    res.json({
      ok: true,
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Database is not working
    res.status(503).json({
      ok: false,
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
