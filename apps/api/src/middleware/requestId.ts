import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Add a unique ID to each request so we can track it in logs
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  // Generate unique ID
  const requestId = uuidv4();
  
  // Attach it to request object
  (req as any).id = requestId;
  
  // Also send it in response header
  res.setHeader('X-Request-ID', requestId);
  
  next();
}
