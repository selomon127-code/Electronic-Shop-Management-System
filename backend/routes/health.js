const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

router.get("/", (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? "ok" : "unavailable",
    database: databaseConnected ? "connected" : "disconnected",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
