const express = require("express");
const {
  createContactMessage,
  getAllContactMessages,
  updateContactStatus
} = require("../controllers/contactController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.post("/", createContactMessage);

// Admin routes
router.use(protect);
router.use(authorize("admin"));

router.route("/admin")
  .get(getAllContactMessages);

router.route("/admin/:id")
  .put(updateContactStatus);

module.exports = router;
