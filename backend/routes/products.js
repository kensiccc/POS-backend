const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const products = await db.query(
      `SELECT p.id, p.name, p.description, p.price, p.stock, p.threshold, p.image_url AS img, c.name AS category
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ORDER BY p.name ASC`
    );
    res.json(products);
  } catch (error) {
    console.error('Products list error:', error);
    res.status(500).json({ error: 'Unable to load products' });
  }
});

router.get('/low-stock', async (req, res) => {
  try {
    const products = await db.query(
      `SELECT p.id, p.name, p.stock, p.threshold, c.name AS category
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.stock <= p.threshold
       ORDER BY (p.stock / NULLIF(p.threshold, 1)) ASC, p.stock ASC`
    );
    res.json(products);
  } catch (error) {
    console.error('Low stock error:', error);
    res.status(500).json({ error: 'Unable to load low stock items' });
  }
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, description, category, price, stock, threshold, imageUrl } = req.body;
    if (!name || price === undefined || stock === undefined) {
      return res.status(400).json({ error: 'Product name, price, and stock are required' });
    }

    const categoryRow = await db.query('SELECT id FROM categories WHERE name = ?', [category]);
    const categoryId = categoryRow[0] ? categoryRow[0].id : null;

    const result = await db.query(
      `INSERT INTO products (name, description, category_id, price, stock, threshold, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name.trim(), description || '', categoryId, parseFloat(price), parseInt(stock, 10), parseInt(threshold || 10, 10), imageUrl || '']
    );

    const productRows = await db.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.status(201).json(productRows[0] || null);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Unable to create product' });
  }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, price, stock, threshold, imageUrl } = req.body;
    if (!name || price === undefined || stock === undefined) {
      return res.status(400).json({ error: 'Product name, price, and stock are required' });
    }

    const categoryRow = await db.query('SELECT id FROM categories WHERE name = ?', [category]);
    const categoryId = categoryRow[0] ? categoryRow[0].id : null;

    await db.query(
      `UPDATE products SET name = ?, description = ?, category_id = ?, price = ?, stock = ?, threshold = ?, image_url = ? WHERE id = ?`,
      [name.trim(), description || '', categoryId, parseFloat(price), parseInt(stock, 10), parseInt(threshold || 10, 10), imageUrl || '', id]
    );

    const productRows = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    res.json(productRows[0] || null);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Unable to update product' });
  }
});

router.patch('/:id/stock', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, threshold } = req.body;
    if (stock === undefined && threshold === undefined) {
      return res.status(400).json({ error: 'Stock or threshold is required' });
    }
    const updates = [];
    const values = [];
    if (stock !== undefined) {
      updates.push('stock = ?');
      values.push(parseInt(stock, 10));
    }
    if (threshold !== undefined) {
      updates.push('threshold = ?');
      values.push(parseInt(threshold, 10));
    }
    values.push(id);

    await db.query(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, values);
    const productRows = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    if (!productRows[0]) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(productRows[0]);
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ error: 'Unable to update stock' });
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Unable to delete product' });
  }
});

module.exports = router;
