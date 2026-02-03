import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Hash a password before storing it in database
export async function hashPassword(password: string): Promise<string> {
  // The number 10 is how many times we hash it (more = safer but slower)
  const hashed = await bcrypt.hash(password, 10);
  return hashed;
}

// Check if a password matches the hashed version
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  const isMatch = await bcrypt.compare(password, hashedPassword);
  return isMatch;
}

// Generate a random token for password reset
export function generateResetToken(): string {
  // Just create a random string
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  return token;
}

// Change user password
export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  // Get the user
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Check if current password is correct
  const isValid = await comparePassword(currentPassword, user.password);
  if (!isValid) {
    throw new Error('Current password is incorrect');
  }

  // Hash the new password
  const hashedPassword = await hashPassword(newPassword);

  // Update the password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });
}
