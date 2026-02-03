import request from 'supertest';
import express from 'express';
import adminRouter from '../src/routes/admin';
import authRouter from '../src/routes/auth';
import prisma from '../src/config/database';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/admin', adminRouter);

describe('Admin System', () => {
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    // Login as admin (seeded user)
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@goldenia.com',
        password: 'admin123'
      });
    
    adminToken = adminLogin.body.accessToken;

    // Create regular user for testing
    const userSignup = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: 'admin-test-user@test.com',
        password: 'testpass123',
        confirmPassword: 'testpass123'
      });
    
    userToken = userSignup.body.accessToken;
  });

  afterAll(async () => {
    // Clean up test user
    await prisma.user.deleteMany({
      where: { email: 'admin-test-user@test.com' }
    });

    await prisma.$disconnect();
  });

  describe('GET /api/v1/admin/stats', () => {
    it('should get dashboard stats as admin', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats).toBeDefined();
      expect(res.body.stats.totalUsers).toBeGreaterThan(0);
      expect(res.body.stats.prices).toBeDefined();
    });

    it('should fail without admin role', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Admin');
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/admin/users', () => {
    it('should get all users as admin', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.users.length).toBeGreaterThan(0);
      expect(res.body.total).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.users.length).toBeLessThanOrEqual(5);
    });

    it('should fail for non-admin', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/admin/kyc-requests', () => {
    it('should get pending KYC requests', async () => {
      const res = await request(app)
        .get('/api/v1/admin/kyc-requests')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.requests)).toBe(true);
    });

    it('should fail for non-admin', async () => {
      const res = await request(app)
        .get('/api/v1/admin/kyc-requests')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });
});
