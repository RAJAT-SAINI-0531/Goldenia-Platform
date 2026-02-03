import request from 'supertest';
import express from 'express';
import tradingRouter from '../src/routes/trading';
import authRouter from '../src/routes/auth';
import prisma from '../src/config/database';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/trading', tradingRouter);

describe('Trading System', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Create test user via signup
    const signupRes = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: 'trading-test@goldenia.com',
        password: 'testpass123',
        confirmPassword: 'testpass123'
      });
    
    authToken = signupRes.body.accessToken;
    userId = signupRes.body.user.id;

    // Give user some FIAT balance for testing
    const fiatWallet = await prisma.wallet.findFirst({
      where: {
        userId,
        type: 'fiat'
      }
    });
    
    if (fiatWallet) {
      await prisma.wallet.update({
        where: { id: fiatWallet.id },
        data: { balance: 10000 } // $10,000 for testing
      });
    }
  });

  afterAll(async () => {
    // Clean up trades
    await prisma.trade.deleteMany({
      where: { userId }
    });

    // Clean up wallets, session, and user
    await prisma.wallet.deleteMany({ where: { userId } });
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });

    await prisma.$disconnect();
  });

  describe('GET /api/v1/trading/prices', () => {
    it('should get current gold and silver prices', async () => {
      const res = await request(app)
        .get('/api/v1/trading/prices')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.prices).toHaveLength(2);
      
      const goldPrice = res.body.prices.find((p: any) => p.asset === 'gold');
      const silverPrice = res.body.prices.find((p: any) => p.asset === 'silver');
      
      expect(goldPrice).toBeDefined();
      expect(silverPrice).toBeDefined();
      expect(goldPrice.priceUsd).toBeGreaterThan(0);
      expect(silverPrice.priceUsd).toBeGreaterThan(0);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/v1/trading/prices');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/trading/buy', () => {
    it('should buy gold successfully', async () => {
      const res = await request(app)
        .post('/api/v1/trading/buy')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          asset: 'gold',
          amountUsd: 100
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.trade).toBeDefined();
      expect(res.body.trade.tradeType).toBe('buy');
      expect(res.body.trade.asset).toBe('gold');
      expect(res.body.trade.totalUsd).toBe(100);
      expect(res.body.trade.amountGrams).toBeGreaterThan(0);

      // Check wallet balances
      const fiatWallet = await prisma.wallet.findFirst({
        where: {
          userId,
          type: 'fiat'
        }
      });
      
      const goldWallet = await prisma.wallet.findFirst({
        where: {
          userId,
          type: 'gold'
        }
      });

      expect(fiatWallet?.balance).toBe(9900); // 10000 - 100
      expect(goldWallet?.balance).toBeGreaterThan(0);
    });

    it('should buy silver successfully', async () => {
      const res = await request(app)
        .post('/api/v1/trading/buy')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          asset: 'silver',
          amountUsd: 50
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.trade.asset).toBe('silver');
    });

    it('should fail with insufficient balance', async () => {
      const res = await request(app)
        .post('/api/v1/trading/buy')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          asset: 'gold',
          amountUsd: 100000 // More than available
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Insufficient');
    });

    it('should validate request body', async () => {
      const res = await request(app)
        .post('/api/v1/trading/buy')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          asset: 'invalid',
          amountUsd: -100
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/trading/sell', () => {
    beforeAll(async () => {
      // Make sure user has some gold to sell
      await request(app)
        .post('/api/v1/trading/buy')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          asset: 'gold',
          amountUsd: 200
        });
    });

    it('should sell gold successfully', async () => {
      // Get current gold balance
      const goldWalletBefore = await prisma.wallet.findFirst({
        where: {
          userId,
          type: 'gold'
        }
      });

      const gramsToSell = Number(goldWalletBefore?.balance) / 2; // Sell half

      const res = await request(app)
        .post('/api/v1/trading/sell')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          asset: 'gold',
          amountGrams: gramsToSell
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.trade.tradeType).toBe('sell');
      expect(res.body.trade.asset).toBe('gold');
      expect(res.body.trade.amountGrams).toBeCloseTo(gramsToSell, 4);

      // Check wallet balances
      const goldWalletAfter = await prisma.wallet.findFirst({
        where: {
          userId,
          type: 'gold'
        }
      });

      expect(Number(goldWalletAfter?.balance)).toBeLessThan(Number(goldWalletBefore?.balance));
    });

    it('should fail with insufficient balance', async () => {
      const res = await request(app)
        .post('/api/v1/trading/sell')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          asset: 'gold',
          amountGrams: 1000000 // Way more than available
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Insufficient');
    });
  });

  describe('GET /api/v1/trading/my-trades', () => {
    it('should get user trade history', async () => {
      const res = await request(app)
        .get('/api/v1/trading/my-trades')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.trades)).toBe(true);
      expect(res.body.trades.length).toBeGreaterThan(0);

      // Check trade structure
      const trade = res.body.trades[0];
      expect(trade).toHaveProperty('id');
      expect(trade).toHaveProperty('tradeType');
      expect(trade).toHaveProperty('asset');
      expect(trade).toHaveProperty('amountGrams');
      expect(trade).toHaveProperty('pricePerGram');
      expect(trade).toHaveProperty('totalUsd');
      expect(trade).toHaveProperty('status');
      expect(trade).toHaveProperty('createdAt');
    });
  });

  describe('POST /api/v1/trading/admin/update-price', () => {
    let adminToken: string;

    beforeAll(async () => {
      // Login as admin (seeded user)
      const adminLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@goldenia.com',
          password: 'admin123'
        });
      
      adminToken = adminLogin.body.accessToken;
    });

    it('should update gold price as admin', async () => {
      const newPrice = 65.00;
      
      const res = await request(app)
        .post('/api/v1/trading/admin/update-price')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          asset: 'gold',
          price: newPrice
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.price.priceUsd).toBe(newPrice);

      // Verify price was updated
      const prices = await request(app)
        .get('/api/v1/trading/prices')
        .set('Authorization', `Bearer ${adminToken}`);

      const goldPrice = prices.body.prices.find((p: any) => p.asset === 'gold');
      expect(goldPrice.priceUsd).toBe(newPrice);
    });

    it('should fail for non-admin users', async () => {
      const res = await request(app)
        .post('/api/v1/trading/admin/update-price')
        .set('Authorization', `Bearer ${authToken}`) // Regular user token
        .send({
          asset: 'gold',
          price: 70.00
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Admin');
    });
  });
});
