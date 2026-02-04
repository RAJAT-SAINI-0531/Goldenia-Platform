import { Request, Response, NextFunction } from 'express';

// Middleware to validate request body against a Zod schema
// Using any type to support both Zod v3 (shared) and local schemas
export function validateBody(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate the request body
      schema.parse(req.body);
      next();
    } catch (error: any) {
      // Return validation errors
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
  };
}
