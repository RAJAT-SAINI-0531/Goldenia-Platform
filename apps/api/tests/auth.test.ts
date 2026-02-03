import request from 'supertest';
import express from 'express';
import authRouter from '../src/routes/auth';
import prisma from '../src/config/database';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRouter);

// Test user data
const testUser = {
  email: 'test@example.com',
  password: 'testpassword123',
  confirmPassword: 'testpassword123'
};

describe('Authentication', () => {
  // Clean up test user before and after tests
  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: { email: testUser.email }
    });
  });
  
  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: testUser.email }
    });
    await prisma.$disconnect();
  });
  
  describe('POST /auth/signup', () => {
    it('should create a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(testUser)
        .expect(201);
      
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
    });
    
    it('should not allow duplicate email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(testUser)
        .expect(400);
      
      expect(response.body.error).toContain('already exists');
    });
    
    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'invalid-email',
          password: 'password123',
          confirmPassword: 'password123'
        })
        .expect(400);
      
      expect(response.body.error).toBe('Validation failed');
    });
    
    it('should validate password length', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'new@example.com',
          password: 'short',
          confirmPassword: 'short'
        })
        .expect(400);
      
      expect(response.body.error).toBe('Validation failed');
    });
  });
  
  describe('POST /auth/login', () => {
    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);
      
      expect(response.body.user).toBeDefined();
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
    });
    
    it('should not login with wrong password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);
      
      expect(response.body.error).toContain('Invalid');
    });
    
    it('should not login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);
      
      expect(response.body.error).toContain('Invalid');
    });
  });
  
  describe('POST /auth/refresh', () => {
    let refreshToken: string;
    
    beforeAll(async () => {
      // Login to get refresh token
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      refreshToken = response.body.refreshToken;
    });
    
    it('should get new access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);
      
      expect(response.body.accessToken).toBeDefined();
    });
    
    it('should not work with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
      
      expect(response.body.error).toContain('Invalid');
    });
  });
  
  describe('POST /auth/logout', () => {
    let refreshToken: string;
    
    beforeAll(async () => {
      // Login to get refresh token
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      refreshToken = response.body.refreshToken;
    });
    
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken })
        .expect(200);
      
      expect(response.body.message).toContain('Logged out');
    });
    
    it('should not be able to use refresh token after logout', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);
      
      expect(response.body.error).toContain('Invalid');
    });
  });
});
