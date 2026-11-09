const assert = require("node:assert/strict");
const { test, mock, beforeEach, afterEach } = require("node:test");
const Order = require("../models/Order");
const PaymentNotification = require("../models/PaymentNotification");
const Product = require("../models/Product");
const chapaUtils = require("../utils/chapa");
const sendEmailModule = require("../utils/sendEmail");
const {
  handleVerifiedPaymentTransition,
  dispatchPaymentConfirmationEmail,
} = require("../services/paymentConfirmationService");
const { processChapaWebhook } = require("../routes/payment");

process.env.CHAPA_BASE_URL = process.env.CHAPA_BASE_URL || "https://api.chapa.co/v1";
process.env.FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const TEST_ORDER_ID = "507f1f77bcf86cd799439011";
const TEST_CUSTOMER_EMAIL = "abebe@example.com";

function createSampleOrder(overrides = {}) {
  const orderDoc = {
    _id: TEST_ORDER_ID,
    user: {
      _id: "507f1f77bcf86cd799439099",
      name: "Abebe Kebede",
      email: TEST_CUSTOMER_EMAIL,
      preferredLanguage: "en",
    },
    products: [
      {
        name: "Wireless Headphones",
        price: 1500,
        originalPrice: 1500,
        quantity: 2,
        image: "https://example.com/headphones.jpg",
      },
    ],
    subtotal: 3000,
    shippingFee: 150,
    tax: 0,
    coupon: {
      code: "SAVE200",
      discount: 200,
    },
    shippingAddress: {
      fullName: "Abebe Kebede",
      phone: "0911000000",
      city: "Addis Ababa",
      subcity: "Bole",
      street: "Airport Rd",
    },
    totalPrice: 2950,
    paymentMethod: "chapa",
    paymentStatus: "pending",
    status: "pending_payment",
    chapaTxRef: `TXN-${TEST_ORDER_ID}`,
    paymentReference: `TXN-${TEST_ORDER_ID}`,
    paidAt: null,
    paymentReceiptSent: false,
    async populate() {
      return this;
    },
    async save() {
      return this;
    },
    ...overrides,
  };
  return orderDoc;
}

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    send(data) {
      this.body = data;
      return this;
    },
  };
  return res;
}

test("Payment Confirmation Email Test Suite", async (t) => {
  let sentMessages = [];
  let mockTransporter;

  beforeEach(() => {
    sentMessages = [];
    mockTransporter = {
      sendMail: async (mailOptions) => {
        sentMessages.push(mailOptions);
        return { messageId: `test-msg-${Date.now()}` };
      },
    };
    sendEmailModule.setTransporter(mockTransporter);
  });

  afterEach(() => {
    mock.restoreAll();
    sendEmailModule.setTransporter(null);
  });

  await t.test(
    "1. Successful verified payment transitions PENDING → PAID",
    async () => {
      const order = createSampleOrder({ paymentStatus: "pending" });

      mock.method(Order, "findOneAndUpdate", () => {
        order.paymentStatus = "paid";
        order.status = "processing";
        order.paidAt = new Date();
        return Promise.resolve(order);
      });

      mock.method(Order, "findById", () => Promise.resolve(order));
      mock.method(PaymentNotification, "findOne", () => Promise.resolve(null));
      mock.method(PaymentNotification, "create", async (data) => ({
        ...data,
        save: async () => {},
      }));

      const result = await handleVerifiedPaymentTransition(order._id, {
        actor: "test",
        transporter: mockTransporter,
      });

      assert.equal(result.transitioned, true);
      assert.equal(order.paymentStatus, "paid");
      assert.equal(order.status, "processing");
      assert.ok(order.paidAt instanceof Date);
    },
  );

  await t.test(
    "2. Payment confirmation invokes the email utility",
    async () => {
      const order = createSampleOrder({ paymentStatus: "pending" });

      mock.method(Order, "findOneAndUpdate", () => {
        order.paymentStatus = "paid";
        order.status = "processing";
        return Promise.resolve(order);
      });
      mock.method(Order, "findById", () => Promise.resolve(order));
      mock.method(PaymentNotification, "findOne", () => Promise.resolve(null));
      mock.method(PaymentNotification, "create", async (data) => ({
        ...data,
        save: async () => {},
      }));

      const result = await handleVerifiedPaymentTransition(order._id, {
        transporter: mockTransporter,
      });

      assert.equal(result.emailDispatched, true);
      assert.equal(sentMessages.length, 1);
    },
  );

  await t.test(
    "3. Email recipient is the correct customer",
    async () => {
      const order = createSampleOrder({ paymentStatus: "paid" });
      mock.method(Order, "findById", () => Promise.resolve(order));
      mock.method(PaymentNotification, "findOne", () => Promise.resolve(null));
      mock.method(PaymentNotification, "create", async (data) => ({
        ...data,
        save: async () => {},
      }));

      await dispatchPaymentConfirmationEmail(order, {
        transporter: mockTransporter,
      });

      assert.equal(sentMessages.length, 1);
      assert.equal(sentMessages[0].to, TEST_CUSTOMER_EMAIL);
    },
  );

  await t.test(
    "4. Email subject contains the correct order ID",
    async () => {
      const order = createSampleOrder({ paymentStatus: "paid" });
      mock.method(Order, "findById", () => Promise.resolve(order));
      mock.method(PaymentNotification, "findOne", () => Promise.resolve(null));
      mock.method(PaymentNotification, "create", async (data) => ({
        ...data,
        save: async () => {},
      }));

      await dispatchPaymentConfirmationEmail(order, {
        transporter: mockTransporter,
      });

      assert.equal(sentMessages.length, 1);
      assert.equal(
        sentMessages[0].subject,
        `Payment Confirmed - Order #${TEST_ORDER_ID}`,
      );
      assert.ok(sentMessages[0].subject.includes(TEST_ORDER_ID));
    },
  );

  await t.test(
    "5. Email body includes payment status and ETB total",
    async () => {
      const order = createSampleOrder({ paymentStatus: "paid" });
      mock.method(Order, "findById", () => Promise.resolve(order));
      mock.method(PaymentNotification, "findOne", () => Promise.resolve(null));
      mock.method(PaymentNotification, "create", async (data) => ({
        ...data,
        save: async () => {},
      }));

      await dispatchPaymentConfirmationEmail(order, {
        transporter: mockTransporter,
      });

      const message = sentMessages[0];
      assert.match(message.html, /PAID/);
      assert.match(message.html, /2950\.00 ETB/);
      assert.match(message.html, /Electronic Shop Ethiopia/);
      assert.match(message.text, /PAID/);
      assert.match(message.text, /2950\.00 ETB/);
    },
  );

  await t.test(
    "6. Email failure does not crash the payment handler",
    async () => {
      const order = createSampleOrder({ paymentStatus: "pending" });

      const failingTransporter = {
        sendMail: async () => {
          throw new Error("SMTP connection failed: server unreachable");
        },
      };

      mock.method(Order, "findOneAndUpdate", () => {
        order.paymentStatus = "paid";
        return Promise.resolve(order);
      });
      mock.method(Order, "findById", () => Promise.resolve(order));
      mock.method(PaymentNotification, "findOne", () => Promise.resolve(null));
      let savedNotification = null;
      mock.method(PaymentNotification, "create", async (data) => {
        savedNotification = { ...data, save: async () => {} };
        return savedNotification;
      });

      // Must not throw error
      const result = await handleVerifiedPaymentTransition(order._id, {
        transporter: failingTransporter,
      });

      assert.equal(result.transitioned, true);
      assert.equal(result.emailDispatched, false);
      assert.equal(savedNotification?.status, "failed");
    },
  );

  await t.test(
    "7. Email failure does not return HTTP 500 for a successful payment",
    async () => {
      const order = createSampleOrder({ paymentStatus: "pending" });
      const txRef = order.chapaTxRef;

      mock.method(chapaUtils, "verifyPayment", async () => ({
        success: true,
        status: "success",
        amount: "2950",
        currency: "ETB",
      }));

      mock.method(Order, "findOne", () => Promise.resolve(order));
      mock.method(Order, "findOneAndUpdate", () => {
        order.paymentStatus = "paid";
        return Promise.resolve(order);
      });
      mock.method(Order, "findById", () => Promise.resolve(order));
      mock.method(PaymentNotification, "findOne", () => Promise.resolve(null));
      mock.method(PaymentNotification, "create", async (data) => ({
        ...data,
        save: async () => {},
      }));

      const failingTransporter = {
        sendMail: async () => {
          throw new Error("SMTP Auth Failure");
        },
      };
      sendEmailModule.setTransporter(failingTransporter);

      const req = {
        headers: {},
        body: JSON.stringify({
          event: "charge.success",
          data: { tx_ref: txRef, amount: 2950 },
        }),
      };
      const res = mockRes();

      await processChapaWebhook(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.status, "success");
      assert.equal(order.paymentStatus, "paid");
    },
  );

  await t.test(
    "8. Email failure does not revert the order status",
    async () => {
      const order = createSampleOrder({ paymentStatus: "pending" });

      mock.method(Order, "findOneAndUpdate", () => {
        order.paymentStatus = "paid";
        return Promise.resolve(order);
      });
      mock.method(Order, "findById", () => Promise.resolve(order));
      mock.method(PaymentNotification, "findOne", () => Promise.resolve(null));
      mock.method(PaymentNotification, "create", async (data) => ({
        ...data,
        save: async () => {},
      }));

      const failingTransporter = {
        sendMail: async () => {
          throw new Error("Temporary mailserver outage");
        },
      };

      await handleVerifiedPaymentTransition(order._id, {
        transporter: failingTransporter,
      });

      // Status must remain paid!
      assert.equal(order.paymentStatus, "paid");
    },
  );

  await t.test(
    "9. Repeated payment verification does not duplicate the email",
    async () => {
      const order = createSampleOrder({ paymentStatus: "paid" });

      // First call when order is already paid returns null from findOneAndUpdate
      mock.method(Order, "findOneAndUpdate", (filter) => {
        if (filter.paymentStatus === "pending") return Promise.resolve(order);
        return Promise.resolve(null);
      });
      mock.method(Order, "findById", () => Promise.resolve(order));

      // Notification outbox already marked sent
      mock.method(PaymentNotification, "findOne", () =>
        Promise.resolve({
          status: "sent",
          recipientEmail: TEST_CUSTOMER_EMAIL,
        }),
      );

      const result = await handleVerifiedPaymentTransition(order._id, {
        transporter: mockTransporter,
      });

      assert.equal(result.transitioned, false);
      assert.equal(result.emailDispatched, false);
      assert.equal(sentMessages.length, 0);
    },
  );

  await t.test(
    "10. Unverified payment does not trigger an email",
    async () => {
      const order = createSampleOrder({ paymentStatus: "pending" });
      const txRef = order.chapaTxRef;

      mock.method(chapaUtils, "verifyPayment", async () => ({
        success: false,
        status: "failed",
        error: "Transaction not found",
      }));

      const req = {
        headers: {},
        body: JSON.stringify({
          event: "charge.success",
          data: { tx_ref: txRef, amount: 2950 },
        }),
      };
      const res = mockRes();

      await processChapaWebhook(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.message, "Transaction verification unconfirmed");
      assert.equal(sentMessages.length, 0);
      assert.equal(order.paymentStatus, "pending");
    },
  );

  await t.test(
    "11. Failed payment does not trigger an email",
    async () => {
      const order = createSampleOrder({ paymentStatus: "pending", totalPrice: 2950 });
      const txRef = order.chapaTxRef;

      mock.method(chapaUtils, "verifyPayment", async () => ({
        success: true,
        status: "success",
        amount: "1000", // Mismatched amount
        currency: "ETB",
      }));

      mock.method(Order, "findOne", () => Promise.resolve(order));
      mock.method(Product, "findByIdAndUpdate", () => Promise.resolve({}));

      const req = {
        headers: {},
        body: JSON.stringify({
          event: "charge.success",
          data: { tx_ref: txRef, amount: 1000 },
        }),
      };
      const res = mockRes();

      await processChapaWebhook(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.message, "Amount mismatch, order cancelled");
      assert.equal(order.paymentStatus, "cancelled");
      assert.equal(sentMessages.length, 0);
    },
  );

  await t.test(
    "12. Missing customer email is handled safely",
    async () => {
      const orderWithoutEmail = createSampleOrder({
        user: { name: "No Email User", email: null },
        paymentStatus: "paid",
      });

      mock.method(Order, "findById", () => Promise.resolve(orderWithoutEmail));
      let createdNotification = null;
      mock.method(PaymentNotification, "findOne", () => Promise.resolve(null));
      mock.method(PaymentNotification, "create", async (data) => {
        createdNotification = { ...data, save: async () => {} };
        return createdNotification;
      });

      const result = await dispatchPaymentConfirmationEmail(orderWithoutEmail, {
        transporter: mockTransporter,
      });

      assert.equal(result.emailDispatched, false);
      assert.equal(result.reason, "missing_email");
      assert.equal(sentMessages.length, 0);
      assert.equal(createdNotification?.status, "failed");
    },
  );

  await t.test(
    "13. sendEmail.js rejected promises are handled",
    async () => {
      const order = createSampleOrder({ paymentStatus: "paid" });
      mock.method(Order, "findById", () => Promise.resolve(order));
      mock.method(PaymentNotification, "findOne", () => Promise.resolve(null));
      mock.method(PaymentNotification, "create", async (data) => ({
        ...data,
        save: async () => {},
      }));

      const rejectingTransporter = {
        sendMail: () => Promise.reject(new Error("Network timeout contacting SMTP server")),
      };

      // Ensure calling dispatchPaymentConfirmationEmail resolves cleanly without an unhandled rejection
      const result = await dispatchPaymentConfirmationEmail(order, {
        transporter: rejectingTransporter,
      });

      assert.equal(result.emailDispatched, false);
      assert.equal(result.reason, "send_failed");
      assert.match(result.error, /Network timeout/);
    },
  );

  await t.test(
    "14. Concurrent duplicate payment events are handled according to the implemented idempotency mechanism",
    async () => {
      const order = createSampleOrder({ paymentStatus: "pending" });

      let executionCount = 0;
      mock.method(Order, "findOneAndUpdate", (filter) => {
        executionCount++;
        // First concurrent worker wins atomic match, second returns null
        if (executionCount === 1 && filter.paymentStatus === "pending") {
          order.paymentStatus = "paid";
          return Promise.resolve(order);
        }
        return Promise.resolve(null);
      });

      mock.method(Order, "findById", () => Promise.resolve(order));
      mock.method(PaymentNotification, "findOne", () => Promise.resolve(null));
      mock.method(PaymentNotification, "create", async (data) => ({
        ...data,
        save: async () => {},
      }));

      // Fire 2 concurrent transitions simultaneously
      const [callA, callB] = await Promise.all([
        handleVerifiedPaymentTransition(order._id, { transporter: mockTransporter }),
        handleVerifiedPaymentTransition(order._id, { transporter: mockTransporter }),
      ]);

      const transitionedCount = [callA, callB].filter((r) => r.transitioned).length;
      const emailsSentCount = [callA, callB].filter((r) => r.emailDispatched).length;

      assert.equal(transitionedCount, 1);
      assert.equal(emailsSentCount, 1);
      assert.equal(sentMessages.length, 1);
    },
  );

  await t.test(
    "15. HTML escaping prevents XSS in email template",
    async () => {
      const orderWithXss = createSampleOrder({
        user: { name: '<script>alert("hack")</script>', email: TEST_CUSTOMER_EMAIL },
        products: [
          {
            name: '<img src="x" onerror="steal()">Gaming Mouse',
            price: 500,
            quantity: 1,
          },
        ],
        paymentStatus: "paid",
      });

      mock.method(Order, "findById", () => Promise.resolve(orderWithXss));
      mock.method(PaymentNotification, "findOne", () => Promise.resolve(null));
      mock.method(PaymentNotification, "create", async (data) => ({
        ...data,
        save: async () => {},
      }));

      await dispatchPaymentConfirmationEmail(orderWithXss, {
        transporter: mockTransporter,
      });

      const html = sentMessages[0].html;
      assert.ok(!html.includes("<script>alert("));
      assert.ok(html.includes("&lt;script&gt;alert(&quot;hack&quot;)&lt;/script&gt;"));
      assert.ok(!html.includes('<img src="x" onerror='));
    },
  );
});
