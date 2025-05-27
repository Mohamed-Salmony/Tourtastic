const express = require("express");
const {
  getDestinations,
  getDestination,
} = require("../controllers/destinationController");

const router = express.Router();

// Public routes
router.route("/").get(getDestinations);
router.route("/:id").get(getDestination);

// Note: POST, PUT, DELETE routes for destinations will be under /api/admin/destinations

module.exports = router;
