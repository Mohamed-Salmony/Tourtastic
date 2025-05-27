const express = require("express");
const { handleWebhook } = require("../controllers/webhookController");

const router = express.Router();

// Process incoming webhooks from Seeru Travel
router.post("/", handleWebhook);

module.exports = router;