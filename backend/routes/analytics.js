const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function parseRange(range, query) {
  if (query.from && query.to) {
    return { from: query.from, to: query.to };
  }
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  if (range === 'week') {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay() + 1);
    return { from: start.toISOString().slice(0, 10), to: today };
  }
  if (range === 'month') {
    return { from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, to: today };
  }
  if (range === 'year') {
    return { from: `${now.getFullYear()}-01-01`, to: today };
  }
  return { from: '2000-01-01', to: today };
}

router.get('/summary', requireAuth, async (req, res) => {
  try {
    const { from, to } = parseRange(req.query.range, req.query);
    const summaryRows = await db.query(
      `SELECT COUNT(*) AS totalOrders,
              COALESCE(SUM(total), 0) AS totalRevenue,
              COALESCE(AVG(total), 0) AS avgOrder
       FROM orders
       WHERE DATE(order_date) BETWEEN ? AND ?`,
      [from, to]
    );
    res.json({ ...summaryRows[0], from, to });
  } catch (error) {
    console.error('Analytics summary error:', error);
    res.status(500).json({ error: 'Unable to load analytics' });
  }
});

router.get('/bestsellers', requireAuth, async (req, res) => {
  try {
    const { from, to } = parseRange(req.query.range, req.query);
    const rows = await db.query(
      `SELECT p.name AS name,
              SUM(oi.quantity) AS qty,
              SUM(oi.total_price) AS revenue
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE DATE(o.order_date) BETWEEN ? AND ?
       GROUP BY p.id
       ORDER BY qty DESC
       LIMIT 8`,
      [from, to]
    );
    res.json(rows);
  } catch (error) {
    console.error('Analytics bestsellers error:', error);
    res.status(500).json({ error: 'Unable to load best-selling items' });
  }
});

router.get('/revenue-trend', requireAuth, async (req, res) => {
  try {
    const { from, to } = parseRange(req.query.range, req.query);
    const rows = await db.query(
      `SELECT DATE(order_date) AS day,
              COALESCE(SUM(total), 0) AS revenue,
              COUNT(*) AS orders
       FROM orders
       WHERE DATE(order_date) BETWEEN ? AND ?
       GROUP BY DATE(order_date)
       ORDER BY day ASC`,
      [from, to]
    );
    res.json(rows);
  } catch (error) {
    console.error('Analytics trend error:', error);
    res.status(500).json({ error: 'Unable to load revenue trend' });
  }
});

router.get('/category-breakdown', requireAuth, async (req, res) => {
  try {
    const { from, to } = parseRange(req.query.range, req.query);
    const rows = await db.query(
      `SELECT c.name AS category,
              COALESCE(SUM(oi.total_price), 0) AS revenue
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       LEFT JOIN products p ON oi.product_id = p.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE DATE(o.order_date) BETWEEN ? AND ?
       GROUP BY c.name
       ORDER BY revenue DESC`,
      [from, to]
    );
    res.json(rows);
  } catch (error) {
    console.error('Analytics category error:', error);
    res.status(500).json({ error: 'Unable to load category breakdown' });
  }
});

module.exports = router;
