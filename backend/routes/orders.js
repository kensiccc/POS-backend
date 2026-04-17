const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function parseDateRange(query) {
  const from = query.from || '2000-01-01';
  const to = query.to || '2099-12-31';
  return { from, to };
}

router.post('/', requireAuth, async (req, res) => {
  const {
    orderNumber,
    customerName,
    items,
    subtotal,
    discountPct,
    discountAmount,
    total,
    cash,
    changeAmount,
    promoCode,
  } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order items are required' });
  }
  if (!total || total <= 0) {
    return res.status(400).json({ error: 'Invalid total value' });
  }

  const connection = await db.pool.getConnection();
  try {
    await connection.beginTransaction();

    const productIds = items.map((item) => item.id);
    const placeholders = productIds.map(() => '?').join(', ');
    const [products] = await connection.query(
      `SELECT id, name, stock, price FROM products WHERE id IN (${placeholders}) FOR UPDATE`,
      productIds
    );

    const productMap = products.reduce((map, product) => {
      map[product.id] = product;
      return map;
    }, {});

    for (const item of items) {
      const product = productMap[item.id];
      if (!product) {
        throw new Error(`Product not found: ${item.name}`);
      }
      if (product.stock < item.qty) {
        throw new Error(`${product.name} is out of stock or quantity exceeds available stock`);
      }
    }

    const [orderResult] = await connection.query(
      `INSERT INTO orders
        (order_number, user_id, customer_name, subtotal, discount_pct, discount_amount, total, cash, change_amount, promo_code, order_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        orderNumber,
        req.user.id,
        customerName || 'Guest',
        parseFloat(subtotal) || 0,
        parseFloat(discountPct) || 0,
        parseFloat(discountAmount) || 0,
        parseFloat(total),
        parseFloat(cash) || 0,
        parseFloat(changeAmount) || 0,
        promoCode || '',
      ]
    );

    const orderId = orderResult.insertId;
    for (const item of items) {
      const totalPrice = parseFloat(item.unitPrice) * parseInt(item.qty, 10);
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, attributes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.id, item.qty, item.unitPrice, totalPrice, JSON.stringify({ size: item.size, sugar: item.sugar, ice: item.ice })]
      );
      await connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.qty, item.id]);
    }

    await connection.commit();

    res.status(201).json({ success: true, orderId });
  } catch (error) {
    await connection.rollback();
    console.error('Order create error:', error);
    res.status(400).json({ error: error.message || 'Unable to create order' });
  } finally {
    connection.release();
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    const { from, to } = parseDateRange(req.query);

    const [orders] = await db.query(
      `SELECT o.id, o.order_number, o.customer_name, o.subtotal, o.discount_pct, o.discount_amount, o.total, o.cash, o.change_amount, o.promo_code, o.order_date, u.name AS cashier
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE DATE(o.order_date) BETWEEN ? AND ?
       ORDER BY o.order_date DESC
       LIMIT ? OFFSET ?`,
      [from, to, limit, offset]
    );

    const totalOrdersRow = await db.query(
      `SELECT COUNT(*) AS total FROM orders WHERE DATE(order_date) BETWEEN ? AND ?`,
      [from, to]
    );

    const orderIds = orders.map((order) => order.id);
    const items = orderIds.length > 0
      ? await db.query(
        `SELECT oi.order_id, oi.quantity, oi.unit_price, oi.total_price, oi.attributes, p.name AS product_name
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id IN (${orderIds.map(() => '?').join(', ')})`,
        orderIds
      )
      : [];

    const orderMap = orders.reduce((map, order) => {
      map[order.id] = [];
      return map;
    }, {});
    items.forEach((item) => {
      const attrs = item.attributes ? JSON.parse(item.attributes) : {};
      orderMap[item.order_id].push({
        name: item.product_name,
        qty: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price,
        ...attrs,
      });
    });

    const results = orders.map((order) => ({
      ...order,
      items: orderMap[order.id] || [],
    }));

    res.json({
      page,
      limit,
      total: totalOrdersRow[0].total,
      orders: results,
    });
  } catch (error) {
    console.error('Orders list error:', error);
    res.status(500).json({ error: 'Unable to load orders' });
  }
});

module.exports = router;
