const express = require("express");
const {
  getDestinations,
  getDestination,
  createDestination,
  updateDestination,
  deleteDestination,
  updateDestinationPopular
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

router
  .route('/:id/popular')
  .patch(protect, authorize('admin'), updateDestinationPopular);

// Note: POST, PUT, DELETE routes for destinations will be under /api/admin/destinations

module.exports = router;
