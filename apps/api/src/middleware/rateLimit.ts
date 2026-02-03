import { Request, Response, NextFunction } from 'express';

// Simple in-memory rate limiter
// In production, use Redis for this
const loginAttempts = new Map<string, { count: number; resetAt: Date }>();

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || 'unknown';
  
  const now = new Date();
  const attempt = loginAttempts.get(ip);
  
  // If no previous attempts or time window expired, reset
  if (!attempt || attempt.resetAt < now) {
    loginAttempts.set(ip, {
      count: 1,
      resetAt: new Date(now.getTime() + 15 * 60 * 1000) // 15 minutes from now
    });
    return next();
  }
  
  // Check if too many attempts
  if (attempt.count >= 5) {
    const remainingTime = Math.ceil((attempt.resetAt.getTime() - now.getTime()) / 1000 / 60);
    return res.status(429).json({
      error: `Too many login attempts. Please try again in ${remainingTime} minutes`
    });
  }
  
  // Increment attempt count
  attempt.count++;
  loginAttempts.set(ip, attempt);
  
  next();
}
