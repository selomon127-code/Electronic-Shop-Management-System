const ELIGIBLE_ORDER_FILTER = {
  status: { $ne: "cancelled" },
  paymentStatus: { $ne: "refunded" },
  $or: [{ paymentStatus: "paid" }, { status: "delivered" }],
};

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function createDailySeries(rows, start, days) {
  const grouped = new Map(rows.map((row) => [
    row._id,
    { revenue: Number(row.revenue) || 0, orders: Number(row.orders) || 0 },
  ]));
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(start.getTime() + index * DAY_MS);
    const key = date.toISOString().slice(0, 10);
    return { date: key, revenue: grouped.get(key)?.revenue || 0, orders: grouped.get(key)?.orders || 0 };
  });
}

function linearRegression(values) {
  const count = values.length;
  if (!count) return { intercept: 0, slope: 0 };
  const xMean = (count - 1) / 2;
  const yMean = values.reduce((sum, value) => sum + value, 0) / count;
  let numerator = 0;
  let denominator = 0;
  values.forEach((value, index) => {
    numerator += (index - xMean) * (value - yMean);
    denominator += (index - xMean) ** 2;
  });
  const slope = denominator ? numerator / denominator : 0;
  return { intercept: yMean - slope * xMean, slope };
}

function periodKey(dateValue, interval) {
  const date = new Date(`${dateValue}T00:00:00.000Z`);
  if (interval === "month") return dateValue.slice(0, 7);
  if (interval === "week") {
    const weekday = date.getUTCDay();
    date.setUTCDate(date.getUTCDate() + (weekday === 0 ? -6 : 1 - weekday));
    return date.toISOString().slice(0, 10);
  }
  return dateValue;
}

function groupSeriesByInterval(series, interval) {
  const grouped = new Map();
  series.forEach((item) => {
    const period = periodKey(item.date, interval);
    const existing = grouped.get(period) || { date: period, revenue: 0, orders: 0 };
    existing.revenue += Number(item.revenue) || 0;
    existing.orders += Number(item.orders) || 0;
    grouped.set(period, existing);
  });
  return [...grouped.values()];
}

function makeSalesForecast(dailyHistory, now = new Date(), interval = "day") {
  if (!["day", "week", "month"].includes(interval)) {
    throw new RangeError("Forecast interval must be day, week, or month.");
  }
  const historicalRevenue = dailyHistory.map((day) => day.revenue);
  const activeDays = historicalRevenue.filter((revenue) => revenue > 0).length;
  const { intercept, slope } = linearRegression(historicalRevenue);
  const dailyAverage = historicalRevenue.length
    ? historicalRevenue.reduce((sum, revenue) => sum + revenue, 0) / historicalRevenue.length
    : 0;
  const trendPerDay = activeDays >= 7 ? slope : 0;
  const forecastStart = startOfUtcDay(now);
  const forecastDaily = Array.from({ length: 30 }, (_, index) => {
    const predicted = activeDays >= 7
      ? intercept + slope * (historicalRevenue.length + index)
      : dailyAverage;
    return {
      date: new Date(forecastStart.getTime() + index * DAY_MS).toISOString().slice(0, 10),
      revenue: Number(Math.max(0, predicted).toFixed(2)),
      orders: 0,
    };
  });

  const weekdayTotals = Array(7).fill(0);
  const weekdayDays = Array(7).fill(0);
  dailyHistory.forEach((day) => {
    const weekday = new Date(`${day.date}T00:00:00.000Z`).getUTCDay();
    weekdayTotals[weekday] += day.revenue;
    weekdayDays[weekday] += 1;
  });
  const weekdayAverages = weekdayTotals.map((total, weekday) => ({
    weekday: DAY_NAMES[weekday],
    averageRevenue: weekdayDays[weekday] ? total / weekdayDays[weekday] : 0,
  }));
  const strongestDay = weekdayAverages.reduce((best, item) =>
    item.averageRevenue > best.averageRevenue ? item : best, weekdayAverages[0]);
  const averageWeekdayRevenue = weekdayAverages.reduce((sum, item) => sum + item.averageRevenue, 0) / 7;
  const hasSeasonality = activeDays >= 14 && averageWeekdayRevenue > 0 &&
    strongestDay.averageRevenue > averageWeekdayRevenue * 1.15;
  const expectedRevenue30d = forecastDaily.reduce((sum, day) => sum + day.revenue, 0);

  return {
    historyDays: dailyHistory.length,
    activeSalesDays: activeDays,
    forecastDays: 30,
    interval,
    observed: groupSeriesByInterval(dailyHistory, interval),
    forecast: groupSeriesByInterval(forecastDaily, interval),
    expectedRevenue30d: Number(expectedRevenue30d.toFixed(2)),
    averageDailyRevenue: Number(dailyAverage.toFixed(2)),
    trend: activeDays >= 7
      ? trendPerDay > 0.01 ? "increasing" : trendPerDay < -0.01 ? "decreasing" : "stable"
      : "limited_data",
    confidence: activeDays >= 30 ? "moderate" : "limited",
    seasonality: hasSeasonality
      ? {
          detected: true,
          strongestWeekday: strongestDay.weekday,
          averageRevenue: Number(strongestDay.averageRevenue.toFixed(2)),
          insight: `${strongestDay.weekday} has the highest average sales in the observed period.`,
        }
      : {
          detected: false,
          strongestWeekday: activeDays ? strongestDay.weekday : null,
          averageRevenue: Number(strongestDay.averageRevenue.toFixed(2)),
          insight: activeDays >= 14
            ? "No strong weekday sales pattern was detected."
            : "More paid order history is needed to identify seasonality.",
        },
  };
}

function buildStockPredictions(products, salesByProduct, now = new Date()) {
  const sales = new Map(salesByProduct.map((item) => [String(item._id), Number(item.unitsSold) || 0]));
  const items = products.map((product) => {
    const unitsSold90Days = sales.get(String(product._id)) || 0;
    const dailyVelocity = unitsSold90Days / 90;
    const monthlyBurnRate = dailyVelocity * 30;
    const stock = Math.max(0, Number(product.stock) || 0);
    const daysToOutOfStock = dailyVelocity > 0 ? Math.floor(stock / dailyVelocity) : null;
    const reorderTarget = Math.ceil(monthlyBurnRate * 2);
    const recommendedRestockQuantity = Math.max(0, reorderTarget - stock);
    return {
      _id: String(product._id),
      name: product.name,
      category: product.category,
      stock,
      unitsSold90Days,
      monthlyBurnRate: Number(monthlyBurnRate.toFixed(2)),
      daysToOutOfStock,
      recommendedRestockQuantity,
      lowStock: stock === 0 || (daysToOutOfStock !== null && daysToOutOfStock <= 30),
      slowMoving: stock > 0 && monthlyBurnRate < 1,
      asOf: now.toISOString(),
    };
  });
  items.sort((a, b) =>
    Number(b.lowStock) - Number(a.lowStock) ||
    (a.daysToOutOfStock ?? Number.MAX_SAFE_INTEGER) - (b.daysToOutOfStock ?? Number.MAX_SAFE_INTEGER) ||
    a.name.localeCompare(b.name),
  );
  const lowStock = items.filter((item) => item.lowStock);
  const slowMoving = items.filter((item) => item.slowMoving);
  return {
    lookbackDays: 90,
    restockTargetMonths: 2,
    totalProducts: items.length,
    lowStockCount: lowStock.length,
    slowMovingCount: slowMoving.length,
    lowStock,
    slowMoving,
  };
}

function segmentCustomers(users, purchases, now = new Date()) {
  const purchaseByUser = new Map(purchases.map((item) => [String(item._id), item]));
  const inactiveBefore = now.getTime() - 90 * DAY_MS;
  const customers = users.map((user) => {
    const purchase = purchaseByUser.get(String(user._id));
    const orders = Number(purchase?.orders) || 0;
    const spend = Number(purchase?.spend) || 0;
    const lastPurchase = purchase?.lastPurchase ? new Date(purchase.lastPurchase) : null;
    let segment;
    if (!orders) segment = "new";
    else if (lastPurchase && lastPurchase.getTime() < inactiveBefore) segment = "at_risk";
    else if (spend >= 20000) segment = "high_value";
    else if (orders >= 3) segment = "frequent";
    else segment = "occasional";
    return {
      _id: String(user._id),
      name: user.name,
      email: user.email,
      segment,
      orders,
      spend: Number(spend.toFixed(2)),
      lastPurchase: lastPurchase?.toISOString() || null,
    };
  });

  const definitions = [
    ["high_value", "High-Value VIP", "Offer early access or a loyalty reward to retain top spenders."],
    ["frequent", "Frequent Buyers", "Encourage repeat purchases with relevant bundles or a limited-time loyalty offer."],
    ["at_risk", "At-Risk / Inactive", "Send a targeted win-back message with recently viewed or complementary products."],
    ["occasional", "Occasional Buyers", "Promote products related to prior purchases to increase repeat frequency."],
    ["new", "No Paid Purchases", "Send a first-purchase welcome offer and help customers discover popular items."],
  ];
  const segments = definitions.map(([key, label, suggestion]) => {
    const members = customers.filter((customer) => customer.segment === key);
    const totalSpend = members.reduce((sum, customer) => sum + customer.spend, 0);
    return {
      key,
      label,
      count: members.length,
      totalSpend: Number(totalSpend.toFixed(2)),
      averageSpend: members.length ? Number((totalSpend / members.length).toFixed(2)) : 0,
      suggestion,
      customers: members.slice(0, 10),
    };
  });
  return {
    totalCustomers: customers.length,
    purchasingCustomers: customers.filter((customer) => customer.orders > 0).length,
    segments,
  };
}

function createAiAnalyticsService({ Order, Product, User, clock = () => new Date() }) {
  async function getSalesForecast(interval = "day") {
    if (!["day", "week", "month"].includes(interval)) {
      throw new RangeError("Forecast interval must be day, week, or month.");
    }
    const now = clock();
    const end = startOfUtcDay(now);
    const start = new Date(end.getTime() - 89 * DAY_MS);
    const eligibleOrders = {
      ...ELIGIBLE_ORDER_FILTER,
      createdAt: { $gte: start, $lt: new Date(end.getTime() + DAY_MS) },
    };
    const rows = await Order.aggregate([
      { $match: eligibleOrders },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } },
          revenue: { $sum: "$totalPrice" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return makeSalesForecast(createDailySeries(rows, start, 90), now, interval);
  }

  async function getStockPredictions() {
    const now = clock();
    const start = new Date(now.getTime() - 90 * DAY_MS);
    const [products, salesByProduct] = await Promise.all([
      Product.find({}).select("name category stock").lean(),
      Order.aggregate([
        {
          $match: {
            ...ELIGIBLE_ORDER_FILTER,
            createdAt: { $gte: start, $lte: now },
          },
        },
        { $unwind: "$products" },
        {
          $group: {
            _id: "$products.product",
            unitsSold: { $sum: { $ifNull: ["$products.quantity", 0] } },
          },
        },
      ]),
    ]);
    return buildStockPredictions(products, salesByProduct, now);
  }

  async function getCustomerInsights() {
    const now = clock();
    const [users, purchases] = await Promise.all([
      User.find({ role: "customer" }).select("name email").sort({ name: 1 }).lean(),
      Order.aggregate([
        { $match: { ...ELIGIBLE_ORDER_FILTER, user: { $ne: null } } },
        {
          $group: {
            _id: "$user",
            orders: { $sum: 1 },
            spend: { $sum: "$totalPrice" },
            lastPurchase: { $max: "$createdAt" },
          },
        },
      ]),
    ]);
    return segmentCustomers(users, purchases, now);
  }

  return { getSalesForecast, getStockPredictions, getCustomerInsights };
}

module.exports = {
  ELIGIBLE_ORDER_FILTER,
  buildStockPredictions,
  createDailySeries,
  createAiAnalyticsService,
  groupSeriesByInterval,
  makeSalesForecast,
  segmentCustomers,
};
