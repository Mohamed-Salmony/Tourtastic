const express = require('express');
const {
  getUserProfile,
  updateUserProfile,
  getUserWishlist,
  addToWishlist,
  removeFromWishlist,
  changePassword
} = require('../controllers/users');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Password change route
router.put('/change-password', changePassword);

// Wishlist routes - more specific routes first
router.get('/:id/wishlist', getUserWishlist);
router.post('/:id/wishlist', addToWishlist);
router.delete('/:id/wishlist/:itemId', removeFromWishlist);

// User profile routes - more generic routes last
router.get('/:id', getUserProfile);
router.put('/:id', updateUserProfile);

module.exports = router; 