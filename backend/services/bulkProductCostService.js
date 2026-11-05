const mongoose = require("mongoose");

class BulkCostUpdateError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "BulkCostUpdateError";
    this.statusCode = statusCode;
  }
}

function normalizeBulkCostUpdates(updates) {
  if (!Array.isArray(updates) || updates.length === 0 || updates.length > 500) {
    throw new BulkCostUpdateError("Provide between 1 and 500 product cost updates.");
  }

  const seenIds = new Set();
  return updates.map((update, index) => {
    if (!update || typeof update !== "object" || Array.isArray(update)) {
      throw new BulkCostUpdateError(`Update ${index + 1} must include a product id and costPrice.`);
    }
    if (typeof update.id !== "string" || !mongoose.isValidObjectId(update.id)) {
      throw new BulkCostUpdateError(`Update ${index + 1} has an invalid product id.`);
    }
    const id = update.id.toLowerCase();
    if (seenIds.has(id)) {
      throw new BulkCostUpdateError(`Product ${update.id} appears more than once.`);
    }
    seenIds.add(id);

    if (typeof update.costPrice !== "number" || !Number.isFinite(update.costPrice) || update.costPrice < 0) {
      throw new BulkCostUpdateError(`Update ${index + 1} costPrice must be a non-negative number.`);
    }
    return { id: update.id, costPrice: update.costPrice };
  });
}

async function bulkUpdateProductCosts(productModel, updates) {
  const normalized = normalizeBulkCostUpdates(updates);
  const ids = normalized.map(({ id }) => id);
  const existingProducts = await productModel.find({ _id: { $in: ids } }).select("_id").lean();
  const existingIds = new Set(existingProducts.map((product) => String(product._id).toLowerCase()));
  const missingIds = ids.filter((id) => !existingIds.has(id.toLowerCase()));
  if (missingIds.length) {
    throw new BulkCostUpdateError(`Product not found: ${missingIds.join(", ")}. No costs were updated.`, 404);
  }

  const result = await productModel.bulkWrite(
    normalized.map(({ id, costPrice }) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { costPrice } },
        runValidators: true,
      },
    })),
    { ordered: true },
  );
  if (result.matchedCount !== normalized.length) {
    throw new BulkCostUpdateError("Some products changed during the update. Reload the inventory and try again.", 409);
  }
  return { updatedCount: result.modifiedCount, matchedCount: result.matchedCount };
}

module.exports = {
  BulkCostUpdateError,
  bulkUpdateProductCosts,
  normalizeBulkCostUpdates,
};
