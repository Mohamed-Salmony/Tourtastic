const express = require("express");
const {
  subscribeNewsletter,
} = require("../controllers/newsletterController");

const router = express.Router();

// Public route
router.post("/subscribe", subscribeNewsletter);

// Note: Admin routes for managing subscribers (GET /subscribers, POST /send)
// will be under /api/admin/newsletter

module.exports = router;
