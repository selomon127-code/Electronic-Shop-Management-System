const mongoose = require("mongoose");

const supplierPurchaseSchema = new mongoose.Schema(
  {
    supplierName: { type: String, required: true, trim: true, maxlength: 120 },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    productName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 },
    purchaseDate: { type: Date, required: true, index: true },
    reference: { type: String, trim: true, maxlength: 120, default: "" },
    notes: { type: String, trim: true, maxlength: 1000, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SupplierPurchase", supplierPurchaseSchema);
