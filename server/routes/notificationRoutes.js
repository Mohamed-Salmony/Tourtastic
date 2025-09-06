const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  sendNotification,
  getNotificationsByUserId
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Admin-only send endpoint (multipart/form-data)
router.post('/send', authorize('admin'), sendNotification);

// Get notifications for a specific userId (user can fetch own, admin can fetch any)
router.get('/:userId', getNotificationsByUserId);

// Legacy endpoints for authenticated user
router.get('/', getNotifications);
router.post('/', createNotification);

// Mark read endpoints (owners or admin)
router.put('/mark-read/:notificationId', markAsRead);
router.put('/read-all', markAllAsRead);

module.exports = router;