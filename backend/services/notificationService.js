const Notification = require("../models/Notification");

class NotificationService {
  // Create a new notification
  async create(data) {
    try {
      const notification = new Notification(data);
      await notification.save();
      return notification;
    } catch (error) {
      console.error("❌ Error creating notification:", error);
      throw error;
    }
  }

  // Get unread notifications for admin AND business_owner
  async getUnreadNotifications(limit = 50) {
    try {
      return await Notification.find({
        recipient: { $in: ["admin", "business_owner", "all"] }, // ✅ Added business_owner
        isRead: false,
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("metadata.userId", "name email")
        .populate("metadata.orderId", "orderNumber totalPrice");
    } catch (error) {
      console.error("❌ Error fetching unread notifications:", error);
      throw error;
    }
  }

  // Get recent notifications (read and unread)
  async getRecentNotifications(limit = 50) {
    try {
      return await Notification.find({
        recipient: { $in: ["admin", "business_owner", "all"] }, // ✅ Added business_owner
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("metadata.userId", "name email")
        .populate("metadata.orderId", "orderNumber totalPrice");
    } catch (error) {
      console.error("❌ Error fetching recent notifications:", error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      return await Notification.findByIdAndUpdate(
        notificationId,
        { isRead: true },
        { new: true },
      );
    } catch (error) {
      console.error("❌ Error marking notification as read:", error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      return await Notification.updateMany(
        {
          recipient: { $in: ["admin", "business_owner", "all"] },
          isRead: false,
        }, // ✅ Added business_owner
        { isRead: true },
      );
    } catch (error) {
      console.error("❌ Error marking all as read:", error);
      throw error;
    }
  }

  // Get unread count
  async getUnreadCount() {
    try {
      return await Notification.countDocuments({
        recipient: { $in: ["admin", "business_owner", "all"] }, // ✅ Added business_owner
        isRead: false,
      });
    } catch (error) {
      console.error("❌ Error getting unread count:", error);
      throw error;
    }
  }

  // User registered notification - send to BOTH admin and business_owner
  async userRegistered(user) {
    return await this.create({
      type: "user_activity",
      title: "New User Registration",
      message: `New user registered: ${user.name} (${user.email})`,
      recipient: "all", // ✅ Changed to "all" so both admin and business_owner see it
      metadata: {
        userId: user._id,
        additionalData: {
          userName: user.name,
          userEmail: user.email,
        },
      },
    });
  }

  // User login notification
  async userLogin(user) {
    return await this.create({
      type: "user_activity",
      title: "User Login",
      message: `${user.name} logged in`,
      recipient: "all", // ✅ Changed to "all"
      metadata: {
        userId: user._id,
        additionalData: {
          userName: user.name,
          userEmail: user.email,
        },
      },
    });
  }

  // New order notification
  async newOrder(order) {
    return await this.create({
      type: "order",
      title: "New Order Placed",
      message: `Order #${order._id.toString().slice(-6).toUpperCase()} placed - ${order.totalPrice.toFixed(2)} ETB`,
      recipient: "all", // ✅ Changed to "all"
      metadata: {
        orderId: order._id,
        userId: order.user,
        additionalData: {
          orderNumber: order._id.toString().slice(-6).toUpperCase(),
          totalPrice: order.totalPrice,
          paymentMethod: order.paymentMethod,
        },
      },
    });
  }

  // Payment received notification
  async paymentReceived(order) {
    return await this.create({
      type: "payment",
      title: "Payment Received",
      message: `Payment of ${order.totalPrice.toFixed(2)} ETB received for Order #${order._id.toString().slice(-6).toUpperCase()}`,
      recipient: "all", // ✅ Changed to "all"
      metadata: {
        orderId: order._id,
        additionalData: {
          amount: order.totalPrice,
          paymentMethod: order.paymentMethod,
        },
      },
    });
  }

  // Low stock alert
  async lowStockAlert(product) {
    return await this.create({
      type: "stock_alert",
      title: "Low Stock Alert",
      message: `${product.name} is low in stock (${product.stock} remaining)`,
      recipient: "all", // ✅ Changed to "all"
      metadata: {
        productId: product._id,
        additionalData: {
          productName: product.name,
          stock: product.stock,
        },
      },
    });
  }
}

module.exports = new NotificationService();
