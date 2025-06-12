const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// Change password route
router.put('/change-password', auth, userController.changePassword);

module.exports = router; 