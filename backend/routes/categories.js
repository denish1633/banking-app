const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// list categories for user
router.get('/', auth, async (req, res) => {
  try {
    const q = await db.query('SELECT id, name, type, created_at FROM categories WHERE user_id = $1 ORDER BY name', [req.user.id]);
    res.json(q.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// create
router.post('/', auth, async (req, res) => {
  try {
    const { name, type } = req.body;
    if (!name || !['income','expense'].includes(type)) return res.status(400).json({ message: 'Name and valid type required' });

    const q = await db.query(
      'INSERT INTO categories (user_id, name, type) VALUES ($1, $2, $3) RETURNING id, name, type, created_at',
      [req.user.id, name, type]
    );
    res.status(201).json(q.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Category already exists' });
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// update
router.put('/:id', auth, async (req, res) => {
  try {
    const { name } = req.body;
    const id = Number(req.params.id);
    if (!name) return res.status(400).json({ message: 'Name required' });

    const q = await db.query(
      'UPDATE categories SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING id, name, type, created_at',
      [name, id, req.user.id]
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
    const q = await db.query('DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id', [id, req.user.id]);
    if (!q.rows.length) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
