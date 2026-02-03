import prisma from '../../config/database';
import { hashPassword, comparePassword, generateResetToken } from './password.service';
import { createAccessToken, createRefreshToken } from './token.service';

// Signup a new user
export async function signup(email: string, password: string) {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });
  
  if (existingUser) {
    throw new Error('User with this email already exists');
  }
  
  // Hash the password
  const hashedPassword = await hashPassword(password);
  
  // Create the user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: 'user'
    }
  });
  
  // Create 4 wallets for the user (fiat, gold, silver, bpc)
  await prisma.wallet.createMany({
    data: [
      { userId: user.id, type: 'fiat', currency: 'USD' },
      { userId: user.id, type: 'gold', currency: 'grams' },
      { userId: user.id, type: 'silver', currency: 'grams' },
      { userId: user.id, type: 'bpc', currency: 'bpc' }
    ]
  });
  
  // Generate tokens
  const accessToken = createAccessToken(user.id);
  const refreshToken = await createRefreshToken(user.id);
  
  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      kycStatus: user.kycStatus
    },
    accessToken,
    refreshToken
  };
}

// Login an existing user
export async function login(email: string, password: string) {
  // Find the user
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  // Check password
  const isPasswordValid = await comparePassword(password, user.password);
  
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }
  
  // Generate tokens
  const accessToken = createAccessToken(user.id);
  const refreshToken = await createRefreshToken(user.id);
  
  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      kycStatus: user.kycStatus
    },
    accessToken,
    refreshToken
  };
}

// Request password reset (generates token)
export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  if (!user) {
    // Don't reveal if user exists or not (security)
    return { message: 'If email exists, reset link will be sent' };
  }
  
  // Generate reset token
  const resetToken = generateResetToken();
  const resetTokenExpiry = new Date();
  resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Valid for 1 hour
  
  // Save token to database
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken,
      resetTokenExpiry
    }
  });
  
  // TODO: Send email with reset link
  // For now just log it
  console.log(`Password reset token for ${email}: ${resetToken}`);
  
  return { message: 'If email exists, reset link will be sent' };
}

// Reset password using token
export async function resetPassword(resetToken: string, newPassword: string) {
  const user = await prisma.user.findFirst({
    where: {
      resetToken,
      resetTokenExpiry: {
        gte: new Date() // Token must not be expired
      }
    }
  });
  
  if (!user) {
    throw new Error('Invalid or expired reset token');
  }
  
  // Hash new password
  const hashedPassword = await hashPassword(newPassword);
  
  // Update password and clear reset token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null
    }
  });
  
  return { message: 'Password reset successful' };
}

// Get user by ID
export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      kycStatus: true,
      emailVerified: true,
      phoneNumber: true,
      createdAt: true
    }
  });
  
  return user;
}

// Update user profile - simple update for name and phone
export async function updateUserProfile(userId: string, data: { name?: string; phoneNumber?: string }) {
  // Just update the fields that are provided
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      phoneNumber: data.phoneNumber
    },
    select: {
      id: true,
      email: true,
      name: true,
      phoneNumber: true,
      role: true,
      kycStatus: true
    }
  });
  
  return user;
}

// Change password - check old password first, then update
export async function changePassword(userId: string, oldPassword: string, newPassword: string) {
  // Get user with password to verify old password
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Check if old password is correct
  const isValidPassword = await comparePassword(oldPassword, user.password);
  
  if (!isValidPassword) {
    throw new Error('Current password is incorrect');
  }
  
  // Hash new password
  const hashedNewPassword = await hashPassword(newPassword);
  
  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedNewPassword
    }
  });
  
  return { message: 'Password changed successfully' };
}
