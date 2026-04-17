require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { createTables } = require('./backend/db');
const authRoutes = require('./backend/routes/auth');
const productRoutes = require('./backend/routes/products');
const orderRoutes = require('./backend/routes/orders');
const analyticsRoutes = require('./backend/routes/analytics');
const demoRoutes = require('./backend/routes/demo');

const app = express();
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/demo', demoRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const port = parseInt(process.env.PORT, 10) || 3000;
createTables()
  .then(() => {
    app.listen(port, () => {
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`  ☕ House Blend POS API listening on port ${port}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });
  })
  .catch((error) => {
    console.error('Unable to start server:', error);
    process.exit(1);
  });
