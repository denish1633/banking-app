const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// list transactions (optionally by date range)
router.get('/', auth, async (req, res) => {
  try {
    const { from, to, type } = req.query;
    let sql = 'SELECT t.id, t.amount, t.type, t.note, t.occurred_at, c.id as category_id, c.name as category_name FROM transactions t LEFT JOIN categories c ON t.category_id = c.id WHERE t.user_id = $1';
    const params = [req.user.id];

    if (type) { params.push(type); sql += ` AND t.type = $${params.length}`; }
    if (from) { params.push(from); sql += ` AND t.occurred_at >= $${params.length}`; }
    if (to) { params.push(to); sql += ` AND t.occurred_at <= $${params.length}`; }
    sql += ' ORDER BY t.occurred_at DESC';

    console.log('List transactions SQL:', sql);
    console.log('Query params:', params);

    const q = await db.query(sql, params);
    console.log('Transactions fetched:', q.rows.length);
    res.json(q.rows);
  } catch (err) {
    console.error('Error listing transactions:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// create transaction
router.post('/', auth, async (req, res) => {
  try {
    const { amount, type, category_id, note, occurred_at } = req.body;
    console.log('Creating transaction:', { user: req.user.id, amount, type, category_id, note, occurred_at });

    if (!amount || !['income','expense'].includes(type)) {
      console.log('Invalid transaction data');
      return res.status(400).json({ message: 'Amount and valid type are required' });
    }

    const q = await db.query(
      `INSERT INTO transactions (user_id, category_id, amount, type, note, occurred_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, amount, type, note, occurred_at`,
      [req.user.id, category_id || null, amount, type, note || null, occurred_at || new Date()]
    );

    console.log('Transaction created:', q.rows[0]);
    res.status(201).json(q.rows[0]);
  } catch (err) {
    console.error('Error creating transaction:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// get single transaction
router.get('/:id', auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    console.log(`Fetching transaction ${id} for user ${req.user.id}`);

    const q = await db.query('SELECT * FROM transactions WHERE id = $1 AND user_id = $2', [id, req.user.id]);

    if (!q.rows.length) {
      console.log('Transaction not found:', id);
      return res.status(404).json({ message: 'Not found' });
    }

    console.log('Transaction fetched:', q.rows[0]);
    res.json(q.rows[0]);
  } catch (err) {
    console.error('Error fetching transaction:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// update transaction
router.put('/:id', auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { amount, category_id, note, occurred_at } = req.body;
    console.log(`Updating transaction ${id} for user ${req.user.id}`, { amount, category_id, note, occurred_at });

    const q = await db.query(
      `UPDATE transactions SET amount=$1, category_id=$2, note=$3, occurred_at=$4 WHERE id=$5 AND user_id=$6 RETURNING id, amount, type, note, occurred_at`,
      [amount, category_id || null, note || null, occurred_at || new Date(), id, req.user.id]
    );

    if (!q.rows.length) {
      console.log('Transaction not found for update:', id);
      return res.status(404).json({ message: 'Not found' });
    }

    console.log('Transaction updated:', q.rows[0]);
    res.json(q.rows[0]);
  } catch (err) {
    console.error('Error updating transaction:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// delete transaction
router.delete('/:id', auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    console.log(`Deleting transaction ${id} for user ${req.user.id}`);

    const q = await db.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id', [id, req.user.id]);

    if (!q.rows.length) {
      console.log('Transaction not found for deletion:', id);
      return res.status(404).json({ message: 'Not found' });
    }

    console.log('Transaction deleted:', id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Error deleting transaction:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
