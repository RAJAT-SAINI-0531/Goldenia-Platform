import request from 'supertest';
import { app } from '../src/server';
import { prisma } from '../src/config/database';

// Test wallet operations
describe('Wallet API Tests', () => {
  let authToken: string;
  let userId: string;
  let fiatWalletId: string;
  let bpcWalletId: string;

  // Before all tests, create a test user and login
  beforeAll(async () => {
    // Create test user
    const signupRes = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: 'wallet-test@goldenia.com',
        password: 'testpass123',
        confirmPassword: 'testpass123'
      });

    authToken = signupRes.body.accessToken;
    userId = signupRes.body.user.id;

    // Get the user's wallets
    const walletsRes = await request(app)
      .get('/api/v1/wallet/my-wallets')
      .set('Authorization', `Bearer ${authToken}`);

    const wallets = walletsRes.body.wallets;
    fiatWalletId = wallets.find((w: any) => w.type === 'fiat')?.id;
    bpcWalletId = wallets.find((w: any) => w.type === 'bpc')?.id;
  });

  // After all tests, clean up test data
  afterAll(async () => {
    await prisma.transaction.deleteMany({
      where: {
        OR: [
          { fromWalletId: fiatWalletId },
          { toWalletId: fiatWalletId }
        ]
      }
    });
    await prisma.wallet.deleteMany({ where: { userId } });
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  // Test 1: Get user wallets
  test('should get all user wallets', async () => {
    const res = await request(app)
      .get('/api/v1/wallet/my-wallets')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.wallets).toHaveLength(4); // Should have 4 wallets
    expect(res.body.wallets[0]).toHaveProperty('balance');
  });

  // Test 2: Get specific wallet
  test('should get specific wallet by ID', async () => {
    const res = await request(app)
      .get(`/api/v1/wallet/${fiatWalletId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.wallet.type).toBe('fiat');
  });

  // Test 3: Deposit money to wallet
  test('should deposit money to wallet', async () => {
    const res = await request(app)
      .post(`/api/v1/wallet/${fiatWalletId}/deposit`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ amount: 1000 })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.wallet.balance).toBe(1000);
  });

  // Test 4: Transfer money between wallets
  test('should transfer money between wallets', async () => {
    const res = await request(app)
      .post('/api/v1/wallet/transfer')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fromWalletId: fiatWalletId,
        toWalletId: bpcWalletId,
        amount: 500,
        description: 'Test transfer'
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.transaction.amount).toBe(500);

    // Check balances updated
    const fiatWallet = await prisma.wallet.findUnique({
      where: { id: fiatWalletId }
    });
    const bpcWallet = await prisma.wallet.findUnique({
      where: { id: bpcWalletId }
    });

    expect(fiatWallet?.balance).toBe(500); // 1000 - 500
    expect(bpcWallet?.balance).toBe(500);
  });

  // Test 5: Should fail if insufficient balance
  test('should fail transfer if insufficient balance', async () => {
    const res = await request(app)
      .post('/api/v1/wallet/transfer')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fromWalletId: fiatWalletId,
        toWalletId: bpcWalletId,
        amount: 10000, // More than balance
        description: 'Test transfer'
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Insufficient balance');
  });

  // Test 6: Get transaction history
  test('should get transaction history for wallet', async () => {
    const res = await request(app)
      .get(`/api/v1/wallet/${fiatWalletId}/transactions`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.transactions.length).toBeGreaterThan(0);
  });

  // Test 7: Should require authentication
  test('should require authentication', async () => {
    await request(app)
      .get('/api/v1/wallet/my-wallets')
      .expect(401);
  });
});
