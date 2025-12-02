// src/services/transfer.service.js
const { transaction, query } = require('../config/database');
const { AppError } = require('../utils/errors');
const bcrypt = require('bcrypt');

class TransferService {
  async createTransfer(transferData) {
    const { user_id, from_account_id, to_account_id, amount, description, reference, pin } = transferData;

    return await transaction(async (client) => {
      // 1. Verify PIN (in production, fetch from user table)
      // For now, we'll skip PIN verification in this example
      
      // 2. Verify source account ownership
      const sourceAccountQuery = await client.query(
        'SELECT * FROM accounts WHERE id = $1 AND user_id = $2 AND status = $3',
        [from_account_id, user_id, 'active']
      );

      if (sourceAccountQuery.rows.length === 0) {
        throw new AppError('Source account not found or not authorized', 403);
      }

      const sourceAccount = sourceAccountQuery.rows[0];

      // 3. Check sufficient balance
      const fee = this.calculateFee(amount);
      const totalAmount = parseFloat(amount) + fee;

      if (parseFloat(sourceAccount.balance) < totalAmount) {
        throw new AppError('Insufficient funds', 400);
      }

      // 4. Verify destination account exists
      const destAccountQuery = await client.query(
        'SELECT * FROM accounts WHERE id = $1 AND status = $2',
        [to_account_id, 'active']
      );

      if (destAccountQuery.rows.length === 0) {
        throw new AppError('Destination account not found', 404);
      }

      // 5. Deduct from source account
      await client.query(
        'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
        [totalAmount, from_account_id]
      );

      // 6. Add to destination account
      await client.query(
        'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
        [amount, to_account_id]
      );

      // 7. Create transaction record
      const transactionQuery = await client.query(
        `INSERT INTO transactions (account_id, transaction_type, amount, description, reference, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [from_account_id, 'transfer', -totalAmount, description, reference, 'completed']
      );

      const transactionId = transactionQuery.rows[0].id;

      // 8. Create transfer record
      const transferQuery = await client.query(
        `INSERT INTO transfers (transaction_id, from_account_id, to_account_id, fee, status, completed_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
         RETURNING *`,
        [transactionId, from_account_id, to_account_id, fee, 'completed']
      );

      // 9. Create corresponding transaction for destination account
      await client.query(
        `INSERT INTO transactions (account_id, transaction_type, amount, description, reference, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [to_account_id, 'transfer', amount, description, reference, 'completed']
      );

      // 10. Return transfer details
      return {
        transfer_id: transferQuery.rows[0].id,
        transaction_id: transactionId,
        from_account_id,
        to_account_id,
        amount: parseFloat(amount),
        fee,
        total_amount: totalAmount,
        status: 'completed',
        reference,
        created_at: transferQuery.rows[0].created_at
      };
    });
  }

  calculateFee(amount) {
    // Simple fee structure
    const amt = parseFloat(amount);
    if (amt <= 1000) return 0;
    if (amt <= 10000) return 2.50;
    return 5.00;
  }

  async getTransfersByUser(userId, page = 1, limit = 10, status = null) {
    const offset = (page - 1) * limit;
    
    let queryText = `
      SELECT 
        t.*,
        tr.from_account_id,
        tr.to_account_id,
        tr.fee,
        fa.account_number as from_account_number,
        fa.account_type as from_account_type,
        ta.account_number as to_account_number,
        ta.account_type as to_account_type
      FROM transfers tr
      JOIN transactions t ON t.id = tr.transaction_id
      JOIN accounts fa ON fa.id = tr.from_account_id
      JOIN accounts ta ON ta.id = tr.to_account_id
      WHERE fa.user_id = $1
    `;

    const params = [userId];
    
    if (status) {
      queryText += ' AND tr.status = $2';
      params.push(status);
    }

    queryText += ' ORDER BY t.occurred_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await query(queryText, params);

    // Get total count
    const countQuery = await query(
      'SELECT COUNT(*) FROM transfers tr JOIN accounts a ON a.id = tr.from_account_id WHERE a.user_id = $1',
      [userId]
    );

    return {
      transfers: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countQuery.rows[0].count),
        pages: Math.ceil(countQuery.rows[0].count / limit)
      }
    };
  }

  async getTransferById(transferId, userId) {
    const result = await query(
      `SELECT 
        t.*,
        tr.from_account_id,
        tr.to_account_id,
        tr.fee,
        fa.account_number as from_account_number,
        fa.account_type as from_account_type,
        ta.account_number as to_account_number,
        ta.account_type as to_account_type
      FROM transfers tr
      JOIN transactions t ON t.id = tr.transaction_id
      JOIN accounts fa ON fa.id = tr.from_account_id
      JOIN accounts ta ON ta.id = tr.to_account_id
      WHERE tr.id = $1 AND fa.user_id = $2`,
      [transferId, userId]
    );

    return result.rows[0] || null;
  }

  async getRecentTransfers(userId, limit = 5) {
    const result = await query(
      `SELECT 
        t.*,
        tr.from_account_id,
        tr.to_account_id,
        tr.fee,
        ta.account_number as to_account_number,
        ta.account_type as to_account_type
      FROM transfers tr
      JOIN transactions t ON t.id = tr.transaction_id
      JOIN accounts fa ON fa.id = tr.from_account_id
      JOIN accounts ta ON ta.id = tr.to_account_id
      WHERE fa.user_id = $1 AND tr.status = 'completed'
      ORDER BY t.occurred_at DESC
      LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }
}

module.exports = new TransferService();