const express = require("express");
const {
  getDestinations,
  getDestination,
  createDestination,
  updateDestination,
  deleteDestination
} = require("../controllers/destinations");
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router
  .route('/')
  .get(getDestinations)
  .post(protect, authorize('admin'), createDestination);

router
  .route('/:id')
  .get(getDestination)
  .put(protect, authorize('admin'), updateDestination)
  .delete(protect, authorize('admin'), deleteDestination);

// Note: POST, PUT, DELETE routes for destinations will be under /api/admin/destinations

module.exports = router;
