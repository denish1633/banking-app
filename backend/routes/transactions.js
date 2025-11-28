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
    const q = await db.query(sql, params);
    res.json(q.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// create transaction
router.post('/', auth, async (req, res) => {
  try {
    const { amount, type, category_id, note, occurred_at } = req.body;
    if (!amount || !['income','expense'].includes(type)) return res.status(400).json({ message: 'Amount and valid type are required' });

    const q = await db.query(
      `INSERT INTO transactions (user_id, category_id, amount, type, note, occurred_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, amount, type, note, occurred_at`,
      [req.user.id, category_id || null, amount, type, note || null, occurred_at || new Date()]
    );
    res.status(201).json(q.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// get single
router.get('/:id', auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const q = await db.query('SELECT * FROM transactions WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (!q.rows.length) return res.status(404).json({ message: 'Not found' });
    res.json(q.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// update
router.put('/:id', auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { amount, category_id, note, occurred_at } = req.body;
    const q = await db.query(
      `UPDATE transactions SET amount=$1, category_id=$2, note=$3, occurred_at=$4 WHERE id=$5 AND user_id=$6 RETURNING id, amount, type, note, occurred_at`,
      [amount, category_id || null, note || null, occurred_at || new Date(), id, req.user.id]
    );
    if (!q.rows.length) return res.status(404).json({ message: 'Not found' });
    res.json(q.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// delete
router.delete('/:id', auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const q = await db.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id', [id, req.user.id]);
    if (!q.rows.length) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
