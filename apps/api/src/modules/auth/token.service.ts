import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../config/database';

// Get secrets from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';

// Create an access token (short lived - 15 minutes)
export function createAccessToken(userId: string): string {
  const token = jwt.sign(
    { userId }, 
    JWT_SECRET, 
    { expiresIn: '15m' } // Token expires in 15 minutes
  );
  return token;
}

// Create a refresh token (long lived - 7 days) and store it in database
export async function createRefreshToken(userId: string, deviceInfo?: string): Promise<string> {
  // Generate a unique refresh token
  const refreshToken = uuidv4();
  
  // Store it in database with expiry date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
  
  await prisma.session.create({
    data: {
      userId,
      refreshToken,
      deviceInfo: deviceInfo || 'Unknown device',
      expiresAt
    }
  });
  
  return refreshToken;
}

// Verify if an access token is valid
export function verifyAccessToken(token: string): any {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null; // Token is invalid or expired
  }
}

// Verify if a refresh token is valid (check database)
export async function verifyRefreshToken(refreshToken: string): Promise<any> {
  const session = await prisma.session.findUnique({
    where: { refreshToken },
    include: { user: true }
  });
  
  // Check if session exists and is not expired
  if (!session || session.expiresAt < new Date()) {
    return null;
  }
  
  return session;
}

// Delete a refresh token (logout)
export async function deleteRefreshToken(refreshToken: string): Promise<void> {
  await prisma.session.delete({
    where: { refreshToken }
  });
}
