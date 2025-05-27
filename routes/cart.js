const express = require("express");
const {
  getCartItems,
  removeFromCart,
  updateCartItem,
  checkout
} = require("../controllers/cartController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route("/")
  .get(getCartItems);

router.route("/:id")
  .delete(removeFromCart)
  .patch(updateCartItem);

router.post("/checkout", checkout);

module.exports = router;
