// backend/services/paymentConfirmationService.js
const Order = require("../models/Order");
const PaymentNotification = require("../models/PaymentNotification");
const { sendPaymentConfirmationEmail } = require("../utils/sendEmail");

/**
 * Safely extract customer email from persisted order and populated user
 */
function extractCustomerEmail(order) {
  if (!order) return null;
  const email =
    order.user?.email ||
    (typeof order.user === "object" && order.user?.email) ||
    order.shippingAddress?.email ||
    null;
  if (typeof email === "string" && email.includes("@")) {
    return email.trim().toLowerCase();
  }
  return null;
}

/**
 * Safely extract customer name from persisted order and populated user
 */
function extractCustomerName(order) {
  if (!order) return "Valued Customer";
  return (
    order.user?.name ||
    order.shippingAddress?.fullName ||
    "Valued Customer"
  );
}

/**
 * Dispatches payment confirmation email with persistent idempotency tracking.
 *
 * CRITICAL RELIABILITY GUARANTEE:
 * Email failures are logged and recorded persistently in PaymentNotification,
 * but NEVER throw or reject back into the caller, ensuring payment verification
 * is never invalidated or reverted by downstream email failures.
 *
 * @param {Object|string} orderOrId - Populated Order document or order ID string
 * @param {Object} [options]
 * @param {string} [options.actor] - Source of event ("chapa_webhook", "customer_verify", "admin_cod")
 * @param {string} [options.recipientEmail] - Override recipient email
 * @param {Object} [options.transporter] - Optional mock/custom nodemailer transporter
 * @returns {Promise<{ emailDispatched: boolean, reason?: string, error?: string, messageId?: string }>}
 */
async function dispatchPaymentConfirmationEmail(orderOrId, options = {}) {
  try {
    let order = orderOrId;
    const orderId = typeof orderOrId === "object" && orderOrId?._id ? orderOrId._id : orderOrId;

    if (!orderId) {
      console.warn("⚠️ [PAYMENT-CONFIRM] Dispatch skipped: No order ID provided.");
      return { emailDispatched: false, reason: "missing_order_id" };
    }

    // Load order if not provided or missing user details
    const hasPopulatedUser = order && typeof order === "object" && order.user && (order.user.email !== undefined);
    if (!hasPopulatedUser) {
      let findQuery = Order.findById(orderId);
      if (findQuery && typeof findQuery.populate === "function") {
        findQuery = findQuery
          .populate("user", "name email preferredLanguage")
          .populate("products.product", "name price image");
      }
      const fetchedOrder = await findQuery;
      if (fetchedOrder) {
        order = fetchedOrder;
      }
    }

    if (!order) {
      console.warn(`⚠️ [PAYMENT-CONFIRM] Order #${orderId} not found.`);
      return { emailDispatched: false, reason: "order_not_found" };
    }

    // Verified payment check: only dispatch for orders marked paid
    if (order.paymentStatus !== "paid") {
      console.warn(`⚠️ [PAYMENT-CONFIRM] Order #${orderId} payment status is "${order.paymentStatus}", not "paid". Dispatch aborted.`);
      return { emailDispatched: false, reason: "order_not_paid" };
    }

    const idempotencyKey = `payment-confirm-${order._id}`;
    const recipientEmail = options.recipientEmail || extractCustomerEmail(order);
    const customerName = extractCustomerName(order);

    // Persistent notification outbox check
    let notification = null;
    try {
      notification = await PaymentNotification.findOne({ idempotencyKey });
    } catch (dbErr) {
      console.warn("⚠️ [PAYMENT-CONFIRM] Notification query error:", dbErr.message);
    }

    if (notification && notification.status === "sent") {
      console.log(`ℹ️ [IDEMPOTENCY] Payment confirmation email already sent for Order #${order._id}. Skipping duplicate.`);
      return { emailDispatched: false, reason: "already_sent", notification };
    }

    if (notification && notification.status === "processing") {
      // If claimed within last 60 seconds, avoid concurrent double-send
      const recentWindow = Date.now() - 60000;
      if (notification.lastAttemptAt && notification.lastAttemptAt.getTime() > recentWindow) {
        console.log(`ℹ️ [IDEMPOTENCY] Email delivery already in progress for Order #${order._id}.`);
        return { emailDispatched: false, reason: "in_progress", notification };
      }
    }

    // If customer has no verified email address
    if (!recipientEmail) {
      console.warn(`⚠️ [PAYMENT-CONFIRM] Missing customer email for Order #${order._id}. Payment verified but email skipped.`);
      try {
        if (!notification) {
          notification = await PaymentNotification.create({
            order: order._id,
            recipientEmail: "missing-email@internal",
            idempotencyKey,
            status: "failed",
            attempts: 1,
            lastAttemptAt: new Date(),
            lastError: "Missing customer email address",
          });
        } else {
          notification.status = "failed";
          notification.lastError = "Missing customer email address";
          notification.attempts = (notification.attempts || 0) + 1;
          await notification.save();
        }
      } catch (saveErr) {
        // Safe catch - do not throw
      }
      return { emailDispatched: false, reason: "missing_email" };
    }

    // Claim or create notification outbox entry
    try {
      if (!notification) {
        notification = await PaymentNotification.create({
          order: order._id,
          recipientEmail,
          idempotencyKey,
          status: "processing",
          attempts: 1,
          lastAttemptAt: new Date(),
          metadata: {
            totalPrice: order.totalPrice,
            paymentMethod: order.paymentMethod,
            actor: options.actor || "payment_verification",
          },
        });
      } else {
        notification.status = "processing";
        notification.attempts = (notification.attempts || 0) + 1;
        notification.lastAttemptAt = new Date();
        await notification.save();
      }
    } catch (createErr) {
      // E11000 duplicate key error means a concurrent callback created it simultaneously
      if (createErr.code === 11000) {
        console.log(`ℹ️ [IDEMPOTENCY] Concurrent duplicate prevented by unique idempotencyKey for Order #${order._id}.`);
        return { emailDispatched: false, reason: "concurrent_duplicate" };
      }
      console.warn("⚠️ [PAYMENT-CONFIRM] Notification create warning:", createErr.message);
    }

    // Dispatch email
    try {
      const sendResult = await sendPaymentConfirmationEmail(recipientEmail, order, {
        customerName,
        transporter: options.transporter,
      });

      if (notification) {
        notification.status = "sent";
        notification.sentAt = new Date();
        notification.lastError = null;
        await notification.save().catch(() => {});
      }

      await Order.findByIdAndUpdate(order._id, {
        $set: {
          paymentReceiptSent: true,
          paymentReceiptSentAt: new Date(),
        },
      }).catch(() => {});

      return {
        emailDispatched: true,
        messageId: sendResult.messageId,
        subject: sendResult.subject,
      };
    } catch (sendErr) {
      // Log sanitized error (avoiding any secret credentials or sensitive tokens)
      console.error(`❌ [PAYMENT-CONFIRM] Failed to send email for Order #${order._id}:`, sendErr.message);

      if (notification) {
        notification.status = "failed";
        notification.lastError = sendErr.message;
        await notification.save().catch(() => {});
      }

      // DO NOT throw error - payment remains successfully verified and recorded!
      return {
        emailDispatched: false,
        reason: "send_failed",
        error: sendErr.message,
      };
    }
  } catch (outerErr) {
    console.error("❌ [PAYMENT-CONFIRM] Unexpected error in dispatchPaymentConfirmationEmail:", outerErr.message);
    return {
      emailDispatched: false,
      reason: "unexpected_error",
      error: outerErr.message,
    };
  }
}

/**
 * Atomically transitions an order from 'pending' to 'paid',
 * and triggers payment confirmation email dispatch idempotently.
 *
 * @param {string|Object} orderId
 * @param {Object} [options]
 * @param {string} [options.paymentMethod]
 * @param {string} [options.transactionReference]
 * @param {string} [options.actor] - Source ("chapa_webhook", "customer_polling", "admin_cod")
 * @param {Object} [options.transporter] - Optional mock/custom transporter for testing
 * @returns {Promise<{ transitioned: boolean, order: Object, emailDispatched: boolean, reason?: string }>}
 */
async function handleVerifiedPaymentTransition(orderId, options = {}) {
  if (!orderId) {
    return { transitioned: false, order: null, emailDispatched: false, reason: "missing_order_id" };
  }

  const updateFields = {
    paymentStatus: "paid",
    status: "processing",
    paidAt: new Date(),
  };

  if (options.transactionReference) {
    updateFields.chapaTxRef = options.transactionReference;
    updateFields.paymentReference = options.transactionReference;
  }
  if (options.paymentMethod) {
    updateFields.paymentMethod = options.paymentMethod;
  }

  // ATOMIC CONDITIONAL UPDATE:
  // Matches ONLY orders whose paymentStatus is currently "pending".
  // If order is already "paid", findOneAndUpdate returns null, preventing repeated transitions.
  let updateQuery = Order.findOneAndUpdate(
    {
      _id: orderId,
      paymentStatus: "pending",
    },
    {
      $set: updateFields,
    },
    { returnDocument: "after" },
  );

  if (updateQuery && typeof updateQuery.populate === "function") {
    updateQuery = updateQuery
      .populate("user", "name email preferredLanguage")
      .populate("products.product", "name price image");
  }

  const updatedOrder = await updateQuery;

  if (!updatedOrder) {
    // Determine whether order is already paid or non-existent
    let findQuery = Order.findById(orderId);
    if (findQuery && typeof findQuery.populate === "function") {
      findQuery = findQuery
        .populate("user", "name email preferredLanguage")
        .populate("products.product", "name price image");
    }
    const existingOrder = await findQuery;

    if (!existingOrder) {
      return { transitioned: false, order: null, emailDispatched: false, reason: "order_not_found" };
    }

    if (existingOrder.paymentStatus === "paid") {
      console.log(`ℹ️ [IDEMPOTENCY] Order #${orderId} is already PAID. No status transition or email triggered.`);
      return {
        transitioned: false,
        order: existingOrder,
        emailDispatched: false,
        reason: "already_paid",
      };
    }

    return {
      transitioned: false,
      order: existingOrder,
      emailDispatched: false,
      reason: `status_not_pending_${existingOrder.paymentStatus}`,
    };
  }

  console.log(`✅ [PAYMENT-TRANSITION] Order #${updatedOrder._id} successfully transitioned PENDING -> PAID.`);

  // Dispatch payment confirmation email asynchronously (with promise safety)
  let emailResult = { emailDispatched: false };
  try {
    emailResult = await dispatchPaymentConfirmationEmail(updatedOrder, options);
  } catch (emailErr) {
    console.error(`❌ [PAYMENT-CONFIRM] Caught unexpected email error for Order #${updatedOrder._id}:`, emailErr.message);
  }

  return {
    transitioned: true,
    order: updatedOrder,
    emailDispatched: Boolean(emailResult?.emailDispatched),
    emailDetails: emailResult,
  };
}

/**
 * Outbox retry utility for failed notification records.
 */
async function retryPendingPaymentNotifications(options = {}) {
  const maxAttempts = options.maxAttempts || 3;
  const limit = options.limit || 20;

  const failedNotifications = await PaymentNotification.find({
    status: "failed",
    attempts: { $lt: maxAttempts },
  })
    .sort({ updatedAt: 1 })
    .limit(limit);

  const results = [];
  for (const notification of failedNotifications) {
    let orderQuery = Order.findById(notification.order);
    if (orderQuery && typeof orderQuery.populate === "function") {
      orderQuery = orderQuery
        .populate("user", "name email preferredLanguage")
        .populate("products.product", "name price image");
    }
    const order = await orderQuery;

    if (!order || order.paymentStatus !== "paid") {
      notification.status = "failed";
      notification.lastError = "Order no longer eligible for payment confirmation";
      await notification.save();
      results.push({ id: notification._id, retried: false, reason: "ineligible_order" });
      continue;
    }

    const res = await dispatchPaymentConfirmationEmail(order, {
      actor: "outbox_retry",
      transporter: options.transporter,
    });
    results.push({ id: notification._id, retried: true, result: res });
  }

  return results;
}

module.exports = {
  handleVerifiedPaymentTransition,
  dispatchPaymentConfirmationEmail,
  retryPendingPaymentNotifications,
  extractCustomerEmail,
  extractCustomerName,
};
