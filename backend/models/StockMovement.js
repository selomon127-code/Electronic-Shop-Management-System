const mongoose = require("mongoose");

const stockMovementSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    productName: { type: String, required: true },
    type: {
      type: String,
      enum: ["opening", "sale", "supplier_purchase", "adjustment", "return"],
      required: true,
      index: true,
    },
    quantity: { type: Number, required: true },
    stockAfter: { type: Number, required: true, min: 0 },
    unitCost: { type: Number, default: null, min: 0 },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    supplierPurchase: { type: mongoose.Schema.Types.ObjectId, ref: "SupplierPurchase", default: null },
    note: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("StockMovement", stockMovementSchema);
