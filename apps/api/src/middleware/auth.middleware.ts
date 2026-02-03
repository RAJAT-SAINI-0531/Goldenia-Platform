import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../modules/auth/token.service';
import { getUserById } from '../modules/auth/auth.service';

// Add user property to Request type
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Middleware to check if user is authenticated
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    // Verify the token
    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    // Get user from database
    const user = await getUserById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Attach user to request object
    req.user = user;
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
}
