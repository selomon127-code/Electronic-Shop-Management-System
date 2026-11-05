const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const { createAiAnalyticsService } = require("../services/aiAnalyticsService");

const analyticsService = createAiAnalyticsService({ Order, Product, User });

function createAiAnalyticsController(service = analyticsService) {
  const handle = (operation, label, getArguments = () => []) => async (req, res) => {
    const args = getArguments(req);
    if (!args) {
      return res.status(400).json({ message: "Interval must be day, week, or month." });
    }
    try {
      return res.json(await service[operation](...args));
    } catch (error) {
      console.error(`${label} error:`, error);
      return res.status(500).json({ message: `Failed to load ${label.toLowerCase()}.` });
    }
  };

  return {
    getSalesForecast: handle("getSalesForecast", "Sales forecast", (req) => {
      const interval = req.query.interval || "day";
      if (!["day", "week", "month"].includes(interval)) {
        return null;
      }
      return [interval];
    }),
    getStockPredictions: handle("getStockPredictions", "Stock predictions"),
    getCustomerInsights: handle("getCustomerInsights", "Customer insights"),
  };
}

module.exports = createAiAnalyticsController();
module.exports.createAiAnalyticsController = createAiAnalyticsController;
