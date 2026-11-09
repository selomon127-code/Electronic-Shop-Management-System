const PDFDocument = require("pdfkit");

const STORE = {
  name: "Electronic Shop Ethiopia",
  address: "Addis Ababa, Ethiopia",
  phone: "+251 927 603 690",
  email: "selomon127@gmail.com",
};

const STAFF_ROLES = new Set(["business_owner", "system_admin"]);

function receiptOrderId(order) {
  return String(order._id).slice(-6).toUpperCase();
}

function receiptFilename(order) {
  return `Receipt_${receiptOrderId(order)}.pdf`;
}

/**
 * Display status for the receipt. Paid fulfillment stays PAID until delivery.
 * A separate tax is not stored on orders, so the tax line is zero and the
 * charged total remains subtotal - coupon + shipping.
 */
function receiptStatus(order) {
  const status = String(order.status || "").toLowerCase();
  const paymentStatus = String(order.paymentStatus || "").toLowerCase();

  if (status === "cancelled" || paymentStatus === "cancelled") return "CANCELLED";
  if (status === "delivered") return "DELIVERED";
  if (paymentStatus === "refunded") return "REFUNDED";
  if (paymentStatus === "paid") return "PAID";
  if (
    status === "pending" ||
    status === "pending_payment" ||
    paymentStatus === "pending"
  ) {
    return "PENDING";
  }
  return status.replace(/_/g, " ").toUpperCase() || "PENDING";
}

function canAccessOrderReceipt(order, actor) {
  if (!order || !actor) return false;
  if (STAFF_ROLES.has(actor.role)) return true;
  const ownerId = order.user && order.user._id ? order.user._id : order.user;
  const actorId = actor._id || actor.id;
  return String(ownerId) === String(actorId);
}

function formatMoney(value) {
  const amount = Number(value);
  const safe = Number.isFinite(amount) ? amount : 0;
  return `${safe.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ETB`;
}

function formatAddress(address = {}) {
  const line = [address.street, address.subcity, address.city]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean)
    .join(", ");
  return line || "—";
}

function customerName(order) {
  return (
    order.user?.name ||
    order.shippingAddress?.fullName ||
    "Customer"
  );
}

function customerEmail(order) {
  return order.user?.email || "—";
}

function drawLabelValue(doc, label, value, x, y, width) {
  doc.font("Helvetica").fontSize(9).fillColor("#64748b").text(label, x, y, { width });
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a").text(value, x, y + 14, { width });
}

function renderReceipt(doc, order) {
  const shortId = receiptOrderId(order);
  const pageWidth = doc.page.width;
  const left = 48;
  const right = pageWidth - 48;
  const contentWidth = right - left;

  doc.rect(0, 0, pageWidth, 108).fill("#1e293b");
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(22).text(STORE.name, left, 28, {
    width: contentWidth,
  });
  doc.font("Helvetica").fontSize(10).fillColor("#cbd5e1").text(
    `${STORE.address}   |   ${STORE.phone}   |   ${STORE.email}`,
    left,
    62,
    { width: contentWidth },
  );
  doc.fontSize(9).fillColor("#94a3b8").text("Official order receipt", left, 80);

  let y = 132;
  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(18).text("RECEIPT", left, y);
  doc.font("Helvetica").fontSize(11).fillColor("#4f46e5").text(`#${shortId}`, left + 92, y + 3);

  y = 168;
  drawLabelValue(doc, "Order ID", `#${shortId}`, left, y, 150);
  drawLabelValue(
    doc,
    "Order date",
    new Date(order.createdAt || Date.now()).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    left + 170,
    y,
    160,
  );
  drawLabelValue(doc, "Order status", receiptStatus(order), left + 350, y, 150);

  y = 220;
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#4f46e5").text("CUSTOMER", left, y);
  doc.font("Helvetica-Bold").fontSize(12).fillColor("#0f172a").text(customerName(order), left, y + 18);
  doc.font("Helvetica").fontSize(10).fillColor("#334155").text(customerEmail(order), left, y + 36);
  doc.text(formatAddress(order.shippingAddress), left, y + 52, { width: contentWidth });
  if (order.shippingAddress?.phone) {
    doc.text(order.shippingAddress.phone, left, y + 68);
  }

  y = 320;
  const columns = [
    { label: "Product", x: left, width: 250, align: "left" },
    { label: "Qty", x: left + 250, width: 50, align: "right" },
    { label: "Unit price", x: left + 310, width: 90, align: "right" },
    { label: "Subtotal", x: left + 400, width: contentWidth - 400, align: "right" },
  ];

  doc.rect(left, y, contentWidth, 24).fill("#eef2ff");
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#3730a3");
  columns.forEach((column) => {
    doc.text(column.label, column.x, y + 7, { width: column.width, align: column.align });
  });

  y += 32;
  const items = Array.isArray(order.products) ? order.products : [];
  items.forEach((item, index) => {
    if (y > 700) {
      doc.addPage();
      y = 48;
    }
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.price) || 0;
    const lineTotal = unitPrice * quantity;
    const name = item.name || item.product?.name || "Product";
    const rowHeight = Math.max(22, doc.heightOfString(name, { width: columns[0].width }) + 8);

    if (index % 2 === 0) {
      doc.rect(left, y - 4, contentWidth, rowHeight).fill("#f8fafc");
    }
    doc.font("Helvetica").fontSize(10).fillColor("#0f172a");
    doc.text(name, columns[0].x, y, { width: columns[0].width, align: "left" });
    doc.text(String(quantity), columns[1].x, y, { width: columns[1].width, align: "right" });
    doc.text(formatMoney(unitPrice), columns[2].x, y, { width: columns[2].width, align: "right" });
    doc.text(formatMoney(lineTotal), columns[3].x, y, { width: columns[3].width, align: "right" });
    y += rowHeight;
  });

  if (items.length === 0) {
    doc.font("Helvetica").fontSize(10).fillColor("#64748b").text("No items on this order.", left, y);
    y += 24;
  }

  y += 16;
  const couponDiscount = Number(order.coupon?.discount) || 0;
  const tax = Number(order.tax) || 0;
  const summary = [
    ["Subtotal", formatMoney(order.subtotal)],
  ];
  if (couponDiscount > 0) {
    const code = order.coupon?.code ? ` (${order.coupon.code})` : "";
    summary.push([`Coupon discount${code}`, `- ${formatMoney(couponDiscount)}`]);
  }
  summary.push(["Shipping", formatMoney(order.shippingFee)]);
  summary.push(["Tax", formatMoney(tax)]);
  summary.push(["Final total", formatMoney(order.totalPrice)]);

  const summaryTop = y;
  const summaryWidth = 260;
  const summaryX = right - summaryWidth;
  summary.forEach((row, index) => {
    const isTotal = index === summary.length - 1;
    const rowY = summaryTop + index * 22;
    if (isTotal) {
      doc.moveTo(summaryX, rowY - 4).lineTo(right, rowY - 4).strokeColor("#e2e8f0").stroke();
    }
    doc.font(isTotal ? "Helvetica-Bold" : "Helvetica").fontSize(isTotal ? 12 : 10)
      .fillColor("#334155")
      .text(row[0], summaryX, rowY, { width: 140 });
    doc.font(isTotal ? "Helvetica-Bold" : "Helvetica").fontSize(isTotal ? 12 : 10)
      .fillColor(isTotal ? "#4f46e5" : "#0f172a")
      .text(row[1], summaryX + 140, rowY, { width: 120, align: "right" });
  });

  const footerY = Math.max(summaryTop + summary.length * 22 + 36, 760);
  doc.font("Helvetica").fontSize(9).fillColor("#64748b").text(
    "Thank you for shopping with Electronic Shop Ethiopia.",
    left,
    Math.min(footerY, 780),
    { width: contentWidth, align: "center" },
  );
}

function streamOrderReceipt(order, res) {
  const doc = new PDFDocument({ size: "A4", margin: 48, compress: false });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${receiptFilename(order)}"`);
  res.setHeader("Cache-Control", "private, no-store");
  doc.pipe(res);
  renderReceipt(doc, order);
  doc.end();
}

module.exports = {
  STORE,
  canAccessOrderReceipt,
  receiptFilename,
  receiptOrderId,
  receiptStatus,
  streamOrderReceipt,
};
