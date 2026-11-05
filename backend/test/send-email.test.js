const assert = require("node:assert/strict");
const { mock, test } = require("node:test");
const nodemailer = require("nodemailer");

const sentMessages = [];
mock.method(nodemailer, "createTransport", () => ({
  sendMail: async (message) => {
    sentMessages.push(message);
    return { messageId: "test-message" };
  },
}));

const { sendStatusUpdateEmail } = require("../utils/sendEmail");

test("sends an order status update email", async () => {
  await sendStatusUpdateEmail(
    "customer@example.com",
    { _id: "order-123456", user: { name: "<Customer>" } },
    "shipped",
  );

  assert.equal(sentMessages.length, 1);
  assert.equal(sentMessages[0].to, "customer@example.com");
  assert.equal(sentMessages[0].subject, "Order #123456 status: Shipped");
  assert.match(sentMessages[0].html, /&lt;Customer&gt;/);
  assert.match(sentMessages[0].html, /is now <strong>Shipped<\/strong>/);
});
