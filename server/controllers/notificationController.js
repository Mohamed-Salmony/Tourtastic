const Notification = require("../models/Notification");
const asyncHandler = require("../middleware/asyncHandler");
const User = require("../models/User");
const gcsService = require("../services/gcsService");
const multer = require("multer");

// Use memory storage for multer here so we can stream directly to GCS
const memoryUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// @desc    Get all notifications for a user
// @route   GET /api/notifications
// @access  Private
// Get notifications for the authenticated user (legacy)
exports.getNotifications = asyncHandler(async (req, res) => {
  // populate recipient user basic info for client display
  const notifications = await Notification.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .populate('userId', 'name email username');

  res.status(200).json({ success: true, data: notifications });
});

// Get notifications for a specific userId. A user may fetch only their own notifications unless the requester is admin.
exports.getNotificationsByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // If requester is not admin, ensure they are requesting their own notifications
  if (req.user.role !== 'admin' && req.user.id !== userId) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const notifications = await Notification.find({ userId })
    .sort({ createdAt: -1 })
    .populate('userId', 'name email username');

  res.status(200).json({ success: true, data: notifications });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
// Mark a specific notification as read. Owners or admins only.
exports.markAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  const notification = await Notification.findById(notificationId);
  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }

  // Only owner or admin can mark as read
  if (req.user.role !== 'admin' && notification.userId.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  notification.read = true;
  await notification.save();

  res.status(200).json({ success: true, data: notification });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
  res.status(200).json({ success: true, message: 'All notifications marked as read' });
});

// @desc    Create a notification
// @route   POST /api/notifications
// @access  Private
// Create a notification - kept for legacy API (creates single notification for authenticated user)
exports.createNotification = asyncHandler(async (req, res) => {
  const { userId, title, message, type } = req.body;

  if (!title?.en || !title?.ar || !message?.en || !message?.ar) {
    return res.status(400).json({ success: false, message: 'Title and message must include both English and Arabic versions' });
  }

  const notification = await Notification.create({ userId, title, message, type });
  res.status(201).json({ success: true, data: notification });
});

// Admin-only: Send notification to a single user (by email/username) or to all users. Accepts multipart/form-data with optional 'pdf' file.
exports.sendNotification = [
  // multer middleware for single file upload in memory
  memoryUpload.single('pdf'),
  asyncHandler(async (req, res) => {
    try {
    } catch (logErr) {
      console.warn('sendNotification logging failed', logErr);
    }

    // Ensure admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }

    const { recipientType, recipient, title, message, type } = req.body;

    // Parse multilingual fields which may be sent as JSON strings from the client
    let parsedTitle = title;
    let parsedMessage = message;
    try {
      if (typeof title === 'string') parsedTitle = JSON.parse(title);
    } catch (e) {
      // leave as-is
    }
    try {
      if (typeof message === 'string') parsedMessage = JSON.parse(message);
    } catch (e) {
      // leave as-is
    }

    if (!parsedTitle?.en || !parsedTitle?.ar || !parsedMessage?.en || !parsedMessage?.ar) {
      return res.status(400).json({ success: false, message: 'Title and message must include both English and Arabic versions' });
    }

    // Handle optional PDF upload to GCS. For production behavior we require GCS to be configured.
    let pdfUrl = null;
    if (req.file && req.file.buffer) {
      // Require bucket env to be set
      if (!process.env.GCLOUD_BUCKET_NAME && !process.env.GCP_BUCKET_NAME && !process.env.FIREBASE_STORAGE_BUCKET) {
        console.error('sendNotification -> GCS bucket not configured but PDF was provided; rejecting per config to avoid local storage');
        return res.status(500).json({ success: false, message: 'Server is not configured to store files. Contact administrator.' });
      }

      try {
        const uploadResult = await gcsService.uploadBuffer(req.file.originalname, req.file.buffer, req.file.mimetype);
        pdfUrl = uploadResult.publicUrl;
      } catch (err) {
        console.error('sendNotification -> GCS upload failed', err);
        return res.status(500).json({ success: false, message: 'Failed to upload PDF to cloud storage' });
      }
    }

    // Build notification payload
    const payload = { title: parsedTitle, message: parsedMessage, type, pdfUrl };

    if (recipientType === 'all') {
      // Send to all active users
      const users = await User.find({ status: 'active' }).select('_id');

      const docs = users.map(u => ({ userId: u._id, ...payload }));
      await Notification.insertMany(docs);
      return res.status(201).json({ success: true, message: 'Notifications sent to all users' });
    }

    // Send to single user (by email or username)
    if (recipientType === 'single') {
      if (!recipient) {
        return res.status(400).json({ success: false, message: 'Recipient is required for single recipientType' });
      }

      const user = await User.findOne({ $or: [{ email: recipient.toLowerCase() }, { username: recipient }] });
      if (!user) {
        return res.status(404).json({ success: false, message: 'Recipient user not found' });
      }

      const notification = await Notification.create({ userId: user._id, ...payload });
      return res.status(201).json({ success: true, data: notification });
    }

    return res.status(400).json({ success: false, message: 'Invalid recipientType' });
  })
];