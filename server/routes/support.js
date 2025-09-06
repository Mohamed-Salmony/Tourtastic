const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Lightweight handlers to avoid adding new controllers; these can be replaced
// with full controller implementations later.

// Public: submit a support message
router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body || {};
  if (!email || !message) {
    return res.status(400).json({ success: false, error: 'Email and message are required' });
  }

  // In production you'd persist to DB and possibly send email. For now return 201.
  return res.status(201).json({ success: true, data: { name, email, subject, message } });
});

// Admin: list all support messages (protected + admin only)
router.use(protect);
router.use(authorize('admin'));

router.get('/', async (req, res) => {
  // Placeholder: respond with empty list
  return res.status(200).json({ success: true, data: [] });
});

module.exports = router;
