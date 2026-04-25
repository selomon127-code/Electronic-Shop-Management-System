import React from "react";
import { useNavigate } from "react-router-dom";
// import "./Cart.css";

function Cart({ cart, removeFromCart, updateQuantity }) {
  const navigate = useNavigate();

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (cart.length === 0) {
    return <h2 style={{ textAlign: "center" }}>Your cart is empty 🛒</h2>;
  }

  return (
    <div className="cart-container">
      <h1>Your Cart</h1>

      {cart.map((item) => (
        <div key={item.id} className="cart-item">
          <img 
            src={item.image} 
            alt={item.name} 
            style={{ width: "60px", height: "60px", objectFit: "cover", marginRight: "10px" }}
          />
          <div>
            <h3>{item.name}</h3>
            <p>${item.price}</p>
          </div>

          <input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
            style={{ width: "60px", padding: "0.25rem" }}
          />

          <button onClick={() => removeFromCart(item.id)}>Remove</button>
        </div>
      ))}

      <h2>Total: ${total.toFixed(2)}</h2>

      <button className="checkout-btn" onClick={() => navigate("/checkout")}>
        Proceed to Checkout
      </button>
    </div>
  );
}

export default Cart;