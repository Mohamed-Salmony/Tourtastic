const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification
} = require("../controllers/notificationController");
const { protect } = require("../middleware/auth");

router.use(protect); // All notification routes require authentication

router.route("/")
  .get(getNotifications)
  .post(createNotification);

router.put("/:id/read", markAsRead);
router.put("/read-all", markAllAsRead);

module.exports = router; 