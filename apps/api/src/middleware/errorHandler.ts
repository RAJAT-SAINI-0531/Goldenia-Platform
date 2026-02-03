import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

// Catch all errors and return a nice JSON response
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // Log the error
  logger.error('API Error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId: (req as any).id
  });
  
  // Send error response
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    requestId: (req as any).id
  });
}
