const express = require("express");
const router = express.Router();
const notificationService = require("../services/notificationService");
const auth = require("../middleware/auth");

// Admin/Business Owner middleware - allows both roles
const adminOrOwnerAuth = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "admin" || req.user.role === "business_owner")
  ) {
    return next();
  }
  res.status(403).json({ message: "Admin or Business Owner access required" });
};

// Get unread notifications
router.get("/unread", auth, adminOrOwnerAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const notifications =
      await notificationService.getUnreadNotifications(limit);
    res.json(notifications);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch notifications", error: error.message });
  }
});

// Get recent notifications
router.get("/recent", auth, adminOrOwnerAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const notifications =
      await notificationService.getRecentNotifications(limit);
    res.json(notifications);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch notifications", error: error.message });
  }
});

// Get unread count
router.get("/unread-count", auth, adminOrOwnerAuth, async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount();
    res.json({ count });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to get unread count", error: error.message });
  }
});

// Mark notification as read
router.put("/:id/read", auth, adminOrOwnerAuth, async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json({ message: "Notification marked as read", notification });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to mark as read", error: error.message });
  }
});

// Mark all as read
router.put("/mark-all-read", auth, adminOrOwnerAuth, async (req, res) => {
  try {
    await notificationService.markAllAsRead();
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to mark all as read", error: error.message });
  }
});

module.exports = router;
