import { z } from 'zod';

// Email validation
export const emailSchema = z.string().email('Invalid email address');

// Password validation (minimum 8 characters)
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');

// Common validation schemas
export const commonSchemas = {
  email: emailSchema,
  password: passwordSchema
};
