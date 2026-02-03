import request from 'supertest';
import { app } from '../src/server';
import { prisma } from '../src/config/database';

// Test KYC operations
describe('KYC API Tests', () => {
  let userToken: string;
  let adminToken: string;
  let userId: string;
  let adminId: string;

  // Create test user and admin before tests
  beforeAll(async () => {
    // Create regular user
    const userSignup = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: 'kyc-user@goldenia.com',
        password: 'testpass123',
        confirmPassword: 'testpass123'
      });

    userToken = userSignup.body.accessToken;
    userId = userSignup.body.user.id;

    // Use the existing admin user from seed
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@goldenia.com',
        password: 'admin123'
      });

    adminToken = adminLogin.body.accessToken;
    adminId = adminLogin.body.user.id;
  });

  // Clean up after tests
  afterAll(async () => {
    await prisma.kycDocument.deleteMany({
      where: { userId }
    });
    await prisma.wallet.deleteMany({ where: { userId } });
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  // Test 1: Upload ID proof
  test('should upload ID proof document', async () => {
    const res = await request(app)
      .post('/api/v1/kyc/upload')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        documentType: 'id_proof',
        fileName: 'passport.jpg',
        fileData: 'base64encodeddata...' // In real app, this would be actual base64
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.document.documentType).toBe('id_proof');
    expect(res.body.document.status).toBe('pending');
  });

  // Test 2: Upload address proof
  test('should upload address proof document', async () => {
    const res = await request(app)
      .post('/api/v1/kyc/upload')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        documentType: 'address_proof',
        fileName: 'utility_bill.pdf',
        fileData: 'base64encodeddata...'
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.document.documentType).toBe('address_proof');
  });

  // Test 3: Upload selfie
  test('should upload selfie document', async () => {
    const res = await request(app)
      .post('/api/v1/kyc/upload')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        documentType: 'selfie',
        fileName: 'selfie.jpg',
        fileData: 'base64encodeddata...'
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.document.documentType).toBe('selfie');
  });

  // Test 4: Get my documents
  test('should get all uploaded documents', async () => {
    const res = await request(app)
      .get('/api/v1/kyc/my-documents')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.documents).toHaveLength(3); // id_proof, address_proof, selfie
  });

  // Test 5: Submit KYC for review
  test('should submit KYC for review', async () => {
    const res = await request(app)
      .post('/api/v1/kyc/submit')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.user.kycStatus).toBe('pending');
  });

  // Test 6: Admin should see pending submission
  test('admin should see pending KYC submissions', async () => {
    const res = await request(app)
      .get('/api/v1/kyc/admin/pending')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.submissions.length).toBeGreaterThan(0);
  });

  // Test 7: Admin approve KYC
  test('admin should approve KYC', async () => {
    const res = await request(app)
      .post('/api/v1/kyc/admin/approve')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: userId
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.user.kycStatus).toBe('verified');

    // Check if user is actually verified
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    expect(user?.kycStatus).toBe('verified');
    expect(user?.kycLevel).toBe('tier1');
  });

  // Test 8: Regular user cannot access admin routes
  test('regular user should not access admin routes', async () => {
    await request(app)
      .get('/api/v1/kyc/admin/pending')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  // Test 9: Cannot submit without all documents
  test('should fail to submit without all documents', async () => {
    // Create another user with incomplete documents
    const newUser = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: 'incomplete@goldenia.com',
        password: 'testpass123',
        confirmPassword: 'testpass123'
      });

    const newToken = newUser.body.accessToken;
    const newUserId = newUser.body.user.id;

    // Upload only ID proof (missing address and selfie)
    await request(app)
      .post('/api/v1/kyc/upload')
      .set('Authorization', `Bearer ${newToken}`)
      .send({
        documentType: 'id_proof',
        fileName: 'id.jpg',
        fileData: 'base64data...'
      });

    // Try to submit
    const res = await request(app)
      .post('/api/v1/kyc/submit')
      .set('Authorization', `Bearer ${newToken}`)
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('all required documents');

    // Clean up
    await prisma.kycDocument.deleteMany({ where: { userId: newUserId } });
    await prisma.wallet.deleteMany({ where: { userId: newUserId } });
    await prisma.session.deleteMany({ where: { userId: newUserId } });
    await prisma.user.delete({ where: { id: newUserId } });
  });
});
