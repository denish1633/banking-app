// src/services/__tests__/transfer.service.test.js
const transferService = require('../transfer.service');
const { transaction, query } = require('../../config/database');
const { AppError } = require('../../utils/errors');

// Mock database
jest.mock('../../config/database');

describe('TransferService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTransfer', () => {
    const mockTransferData = {
      user_id: 1,
      from_account_id: 1,
      to_account_id: 2,
      amount: 100,
      description: 'Test transfer',
      reference: 'REF123',
      pin: '1234'
    };

    const mockSourceAccount = {
      id: 1,
      user_id: 1,
      balance: 1000,
      status: 'active'
    };

    const mockDestAccount = {
      id: 2,
      balance: 500,
      status: 'active'
    };

    it('should successfully create a transfer', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [mockSourceAccount] }) // Source account
          .mockResolvedValueOnce({ rows: [mockDestAccount] })   // Dest account
          .mockResolvedValueOnce({ rows: [] })                   // Deduct from source
          .mockResolvedValueOnce({ rows: [] })                   // Add to dest
          .mockResolvedValueOnce({ rows: [{ id: 1 }] })         // Transaction record
          .mockResolvedValueOnce({ 
            rows: [{ id: 1, created_at: new Date() }] 
          })  // Transfer record
          .mockResolvedValueOnce({ rows: [] })                   // Dest transaction
      };

      transaction.mockImplementation(async (callback) => {
        return await callback(mockClient);
      });

      const result = await transferService.createTransfer(mockTransferData);

      expect(result).toHaveProperty('transfer_id');
      expect(result).toHaveProperty('transaction_id');
      expect(result.amount).toBe(100);
      expect(result.status).toBe('completed');
    });

    it('should throw error if source account not found', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValueOnce({ rows: [] })
      };

      transaction.mockImplementation(async (callback) => {
        return await callback(mockClient);
      });

      await expect(
        transferService.createTransfer(mockTransferData)
      ).rejects.toThrow('Source account not found or not authorized');
    });

    it('should throw error if insufficient funds', async () => {
      const poorAccount = { ...mockSourceAccount, balance: 50 };
      const mockClient = {
        query: jest.fn().mockResolvedValueOnce({ rows: [poorAccount] })
      };

      transaction.mockImplementation(async (callback) => {
        return await callback(mockClient);
      });

      await expect(
        transferService.createTransfer(mockTransferData)
      ).rejects.toThrow('Insufficient funds');
    });

    it('should throw error if destination account not found', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [mockSourceAccount] })
          .mockResolvedValueOnce({ rows: [] })
      };

      transaction.mockImplementation(async (callback) => {
        return await callback(mockClient);
      });

      await expect(
        transferService.createTransfer(mockTransferData)
      ).rejects.toThrow('Destination account not found');
    });
  });

  describe('calculateFee', () => {
    it('should return 0 for amounts <= 1000', () => {
      expect(transferService.calculateFee(500)).toBe(0);
      expect(transferService.calculateFee(1000)).toBe(0);
    });

    it('should return 2.50 for amounts > 1000 and <= 10000', () => {
      expect(transferService.calculateFee(1001)).toBe(2.50);
      expect(transferService.calculateFee(5000)).toBe(2.50);
      expect(transferService.calculateFee(10000)).toBe(2.50);
    });

    it('should return 5.00 for amounts > 10000', () => {
      expect(transferService.calculateFee(10001)).toBe(5.00);
      expect(transferService.calculateFee(50000)).toBe(5.00);
    });
  });

  describe('getTransfersByUser', () => {
    it('should return paginated transfers', async () => {
      const mockTransfers = [
        { id: 1, amount: 100 },
        { id: 2, amount: 200 }
      ];

      query
        .mockResolvedValueOnce({ rows: mockTransfers })
        .mockResolvedValueOnce({ rows: [{ count: '10' }] });

      const result = await transferService.getTransfersByUser(1, 1, 10);

      expect(result.transfers).toHaveLength(2);
      expect(result.pagination).toHaveProperty('page', 1);
      expect(result.pagination).toHaveProperty('total', 10);
    });

    it('should filter by status when provided', async () => {
      query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] });

      await transferService.getTransfersByUser(1, 1, 10, 'completed');

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('AND tr.status = $2'),
        expect.any(Array)
      );
    });
  });

  describe('getTransferById', () => {
    it('should return transfer details', async () => {
      const mockTransfer = {
        id: 1,
        amount: 100,
        from_account_id: 1,
        to_account_id: 2
      };

      query.mockResolvedValueOnce({ rows: [mockTransfer] });

      const result = await transferService.getTransferById(1, 1);

      expect(result).toEqual(mockTransfer);
    });

    it('should return null if transfer not found', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      const result = await transferService.getTransferById(999, 1);

      expect(result).toBeNull();
    });
  });

  describe('getRecentTransfers', () => {
    it('should return limited recent transfers', async () => {
      const mockTransfers = [
        { id: 1, amount: 100 },
        { id: 2, amount: 200 },
        { id: 3, amount: 300 }
      ];

      query.mockResolvedValueOnce({ rows: mockTransfers });

      const result = await transferService.getRecentTransfers(1, 5);

      expect(result).toHaveLength(3);
      expect(query).toHaveBeenCalledWith(
        expect.any(String),
        [1, 5]
      );
    });
  });
});