const express = require('express');
const { getSetting, upsertSetting } = require('../controllers/settingController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public read
router.get('/:key', getSetting);

// Admin upsert
router.put('/:key', protect, authorize('admin'), upsertSetting);

module.exports = router;
