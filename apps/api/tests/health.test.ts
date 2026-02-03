import request from 'supertest';
import express from 'express';
import healthRouter from '../src/routes/health';

// Create a test app
const app = express();
app.use('/api/v1', healthRouter);

describe('Health Check', () => {
  it('should return ok status', async () => {
    const response = await request(app)
      .get('/api/v1/health')
      .expect(200);
    
    expect(response.body.ok).toBe(true);
    expect(response.body.database).toBeDefined();
    expect(response.body.timestamp).toBeDefined();
  });
});
