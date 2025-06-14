const Notification = require("../models/Notification");
const asyncHandler = require("../middleware/asyncHandler");

// @desc    Get all notifications for a user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user.id })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: notifications
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { read: true },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: "Notification not found"
    });
  }

  res.status(200).json({
    success: true,
    data: notification
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user.id, read: false },
    { read: true }
  );

  res.status(200).json({
    success: true,
    message: "All notifications marked as read"
  });
});

// @desc    Create a notification
// @route   POST /api/notifications
// @access  Private
exports.createNotification = asyncHandler(async (req, res) => {
  const { userId, title, message, type } = req.body;

  const notification = await Notification.create({
    userId,
    title,
    message,
    type
  });

  res.status(201).json({
    success: true,
    data: notification
  });
}); 