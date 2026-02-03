import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

// Middleware to validate request body against a Zod schema
export function validateBody(schema: ZodSchema) {
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
