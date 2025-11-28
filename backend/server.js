require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const catRoutes = require('./routes/categories');
const txRoutes = require('./routes/transactions');
const reportRoutes = require('./routes/report');

const app = express();
app.use(cors());
app.use(express.json());

// health
app.get('/', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/categories', catRoutes);
app.use('/api/transactions', txRoutes);
app.use('/api/report', reportRoutes);

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
