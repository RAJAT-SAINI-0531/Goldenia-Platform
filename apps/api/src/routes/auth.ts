import { Router } from 'express';
import { signup, login, requestPasswordReset, resetPassword, updateUserProfile, changePassword } from '../modules/auth/auth.service';
import { verifyRefreshToken, createAccessToken, deleteRefreshToken } from '../modules/auth/token.service';
import { rateLimitMiddleware } from '../middleware/rateLimit';
import { validateBody } from '../middleware/validator';
import { authMiddleware } from '../middleware/auth.middleware';
import { signupSchema, loginSchema, resetPasswordRequestSchema, resetPasswordSchema } from '@goldenia/shared';

const router = Router();

// POST /auth/signup - Create new user account
router.post('/signup', validateBody(signupSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await signup(email, password);
    
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /auth/login - Login existing user
router.post('/login', rateLimitMiddleware, validateBody(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

// POST /auth/refresh - Get new access token using refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }
    
    // Verify refresh token
    const session = await verifyRefreshToken(refreshToken);
    
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    
    // Create new access token
    const accessToken = createAccessToken(session.userId);
    
    res.json({ accessToken });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

// POST /auth/logout - Logout user (delete refresh token)
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }
    
    await deleteRefreshToken(refreshToken);
    
    res.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /auth/reset-password-request - Request password reset
router.post('/reset-password-request', validateBody(resetPasswordRequestSchema), async (req, res) => {
  try {
    const { email } = req.body;
    const result = await requestPasswordReset(email);
    
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /auth/reset-password - Reset password with token
router.post('/reset-password', validateBody(resetPasswordSchema), async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    const result = await resetPassword(resetToken, newPassword);
    
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /auth/me - Get current user info (protected route)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /auth/profile - Update user profile (protected route)
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phoneNumber } = req.body;
    const userId = req.user!.id;
    
    // Update profile with provided data
    const updatedUser = await updateUserProfile(userId, { name, phoneNumber });
    
    res.json({ user: updatedUser, message: 'Profile updated successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /auth/change-password - Change user password (protected route)
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old password and new password are required' });
    }
    
    const userId = req.user!.id;
    
    // Use our new changePassword function
    const result = await changePassword(userId, oldPassword, newPassword);
    
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
