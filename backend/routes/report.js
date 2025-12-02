const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// monthly summary: ?year=2025&month=11
router.get('/monthly', auth, async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const month = Number(req.query.month) || (new Date().getMonth() + 1);

    console.log(`Generating monthly report for user ${req.user.id}: Year=${year}, Month=${month}`);

    const start = new Date(Date.UTC(year, month - 1, 1)).toISOString();
    const end = new Date(Date.UTC(year, month, 1)).toISOString();

    console.log('Report date range:', start, 'to', end);

    // totals by type
    const q = await db.query(
      `SELECT type, COALESCE(SUM(amount),0) as total
       FROM transactions
       WHERE user_id = $1 AND occurred_at >= $2 AND occurred_at < $3
       GROUP BY type`,
      [req.user.id, start, end]
    );
    console.log('Totals query result:', q.rows);

    const totals = { income: 0, expense: 0 };
    q.rows.forEach(r => { totals[r.type] = parseFloat(r.total); });
    console.log('Calculated totals:', totals);

    // category breakdown (top categories)
    const catQ = await db.query(
      `SELECT c.name, t.type, COALESCE(SUM(t.amount),0) as total
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = $1 AND t.occurred_at >= $2 AND t.occurred_at < $3
       GROUP BY c.name, t.type
       ORDER BY total DESC
       LIMIT 10`,
      [req.user.id, start, end]
    );
    console.log('Category breakdown query result:', catQ.rows);

    res.json({ year, month, totals, breakdown: catQ.rows });
  } catch (err) {
    console.error('Error generating monthly report:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
