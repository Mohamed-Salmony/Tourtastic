const express = require("express");
const {
  getCartItems,
  removeFromCart,
  checkout,
  addFlightToCart
} = require("../controllers/cartController");
const { protect, optionalAuth } = require("../middleware/auth");

const router = express.Router();

// Routes that work for both authenticated and anonymous users
router.route("/")
  .get(optionalAuth, getCartItems)
  .post(optionalAuth, addFlightToCart);

router.route("/:id")
  .delete(optionalAuth, removeFromCart);

// Checkout requires authentication
router.route("/checkout")
  .post(protect, checkout);

module.exports = router;
