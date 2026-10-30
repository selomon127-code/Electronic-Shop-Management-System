import React from "react";

function CartItem({ item, removeFromCart, updateQuantity }) {
  return (
    <div style={{ border: "1px solid #ccc", padding: "10px", margin: "10px" }}>
      <h3>{item.name}</h3>
      <p>Price: ${item.price}</p>
      <input
        type="number"
        value={item.quantity}
        min="1"
        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
      />
      <button onClick={() => removeFromCart(item.id)}>Remove</button>
    </div>
  );
}

export default CartItem;
