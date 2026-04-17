const express = require('express');
const db = require('../db');
const router = express.Router();

router.post('/reset', async (req, res) => {
  const secret = req.query.key || process.env.DEMO_RESET_KEY || 'houseblend-demo';
  if (String(secret) !== String(req.query.key)) {
    return res.status(403).json({ error: 'Demo reset key missing or invalid' });
  }

  try {
    await db.resetDemoData();
    res.json({ success: true, message: 'Demo data reset successfully' });
  } catch (error) {
    console.error('Demo reset error:', error);
    res.status(500).json({ error: 'Unable to reset demo data' });
  }
});

module.exports = router;
