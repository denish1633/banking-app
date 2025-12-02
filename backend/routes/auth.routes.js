const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '3600'; // seconds or string

// ---------------- REGISTER ----------------
router.post('/register', async (req, res) => {
  console.log("➡️ REGISTER HIT");
  console.log("REQ BODY:", req.body);

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      console.log("❌ Missing email or password");
      return res.status(400).json({ message: 'Email and password required' });
    }

    console.log(`🔍 Checking if user exists: ${email}`);

    const exists = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (exists.rows.length) {
      console.log("❌ User already exists");
      return res.status(400).json({ message: 'User already exists' });
    }

    console.log("🔐 Hashing password...");
    const hashed = await bcrypt.hash(password, 10);

    console.log("📝 Saving user to DB...");
    const result = await db.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, created_at',
      [email.toLowerCase(), hashed]
    );

    const user = result.rows[0];
    console.log("✅ User created:", user);

    res.status(201).json({
      message: 'User created',
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    console.error("🔥 REGISTER ERROR:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------- LOGIN ----------------
router.post('/login', async (req, res) => {
  console.log("➡️ LOGIN HIT");
  console.log("REQ BODY:", req.body);

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      console.log("❌ Missing email or password");
      return res.status(400).json({ message: 'Email and password required' });
    }

    console.log(`🔍 Checking DB for user: ${email}`);

    const q = await db.query(
      'SELECT id, email, password FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (!q.rows.length) {
      console.log("❌ No user found");
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = q.rows[0];
    console.log("👤 User found:", user.email);

    console.log("🔐 Comparing password...");
    const ok = await bcrypt.compare(password, user.password);

    if (!ok) {
      console.log("❌ Password mismatch");
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log("🔑 Creating JWT token...");

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: Number(JWT_EXPIRES) || JWT_EXPIRES }
    );

    console.log("✅ Login successful, token generated");
    res.json({ message: 'Login successful', token });

  } catch (err) {
    console.error("🔥 LOGIN ERROR:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
