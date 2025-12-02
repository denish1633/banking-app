// src/routes/__tests__/transfer.routes.integration.test.js
const request = require('supertest');
const app = require('../../server');
const { pool } = require('../../config/database');

describe('Transfer API Integration Tests', () => {
  let authToken;
  let userId;
  let fromAccountId;
  let toAccountId;

  beforeAll(async () => {
    // Setup test data
    // In production, use a separate test database
    
    // Create test user
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      ['test@example.com', 'hashed_password', 'Test', 'User', '1234567890']
    );
    userId = userResult.rows[0].id;

    // Create test accounts
    const fromAccountResult = await pool.query(
      `INSERT INTO accounts (user_id, account_number, account_type, balance, currency)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [userId, '1234567890', 'checking', 5000, 'USD']
    );
    fromAccountId = fromAccountResult.rows[0].id;

    const toAccountResult = await pool.query(
      `INSERT INTO accounts (user_id, account_number, account_type, balance, currency)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [userId, '0987654321', 'savings', 1000, 'USD']
    );
    toAccountId = toAccountResult.rows[0].id;

    // Mock authentication - in production, get real token
    authToken = 'mock_jwt_token';
  });

  afterAll(async () => {
    // Cleanup test data
    await pool.query('DELETE FROM transfers WHERE from_account_id = $1 OR to_account_id = $2', [fromAccountId, toAccountId]);
    await pool.query('DELETE FROM transactions WHERE account_id = $1 OR account_id = $2', [fromAccountId, toAccountId]);
    await pool.query('DELETE FROM accounts WHERE id = $1 OR id = $2', [fromAccountId, toAccountId]);
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    await pool.end();
  });

  describe('POST /api/transfers', () => {
    it('should create a new transfer successfully', async () => {
      const transferData = {
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        amount: 100,
        description: 'Test transfer',
        reference: 'TEST123',
        pin: '1234'
      };

      const response = await request(app)
        .post('/api/transfers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transferData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('transfer_id');
      expect(response.body.data.amount).toBe(100);
    });

    it('should return 400 for insufficient funds', async () => {
      const transferData = {
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        amount: 10000, // More than available balance
        pin: '1234'
      };

      const response = await request(app)
        .post('/api/transfers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transferData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Insufficient funds');
    });

    it('should return 400 for invalid amount', async () => {
      const transferData = {
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        amount: -50, // Negative amount
        pin: '1234'
      };

      const response = await request(app)
        .post('/api/transfers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transferData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 401 for missing authentication', async () => {
      const transferData = {
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        amount: 100,
        pin: '1234'
      };

      await request(app)
        .post('/api/transfers')
        .send(transferData)
        .expect(401);
    });
  });

  describe('GET /api/transfers', () => {
    it('should return list of transfers', async () => {
      const response = await request(app)
        .get('/api/transfers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('transfers');
      expect(response.body.data).toHaveProperty('pagination');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/transfers?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(5);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/transfers?status=completed')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/transfers/:id', () => {
    it('should return transfer details', async () => {
      // First create a transfer
      const createResponse = await request(app)
        .post('/api/transfers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          from_account_id: fromAccountId,
          to_account_id: toAccountId,
          amount: 50,
          pin: '1234'
        });

      const transferId = createResponse.body.data.transfer_id;

      // Then get its details
      const response = await request(app)
        .get(`/api/transfers/${transferId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(transferId);
    });

    it('should return 404 for non-existent transfer', async () => {
      await request(app)
        .get('/api/transfers/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});