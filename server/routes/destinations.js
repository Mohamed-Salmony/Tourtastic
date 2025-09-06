const express = require("express");
const multer = require('multer');
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

// Use memory storage so we can access file buffers directly for server-side upload to GCS
const upload = multer({ storage: multer.memoryStorage() });

// Public routes
router
  .route('/')
  .get(getDestinations)
  // allow single file upload named 'image'
  // NOTE: use upload.any() temporarily to diagnose unexpected field issues
  .post(protect, authorize('admin'), upload.any(), createDestination);

router
  .route('/:id')
  .get(getDestination)
  .put(protect, authorize('admin'), upload.any(), authorize('admin'), updateDestination)
  .delete(protect, authorize('admin'), deleteDestination);

router
  .route('/:id/popular')
  .patch(protect, authorize('admin'), updateDestinationPopular);

module.exports = router;
