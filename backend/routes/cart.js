// backend/routes/cart.js
const router = require("express").Router();
const Cart = require("../models/Cart"); // You'd create this model

// Auth middleware (same as orders)
const auth = (req, res, next) => {
  /* ... */
};

// Sync cart to database
router.post("/sync", auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.userId });

    if (cart) {
      cart.items = req.body.items;
      await cart.save();
    } else {
      cart = new Cart({ user: req.userId, items: req.body.items });
      await cart.save();
    }

    res.json({ message: "Cart synced", cart });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
