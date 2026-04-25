// ecommerce-app/src/pages/Checkout.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Checkout({ cart, user, onAddressSubmit }) {
  const navigate = useNavigate();
  
  // Address state - pre-fill from user if available
  const [address, setAddress] = useState({
    fullName: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    street: "",
    city: "Addis Ababa",
    subcity: "",
    region: "Addis Ababa",
    country: "Ethiopia"
  });
  
  const [error, setError] = useState("");

  // Calculate order summary (ETB currency)
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = 50; // Fixed shipping in Ethiopia
  const tax = subtotal * 0.15; // 15% VAT
  const total = subtotal + shippingFee + tax;

  // Pre-fill address if user has saved info
  useEffect(() => {
    if (user?.address) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAddress(prev => ({ ...prev, ...user.address }));
    }
  }, [user]);

  // Handle address change
  const handleAddressChange = (field, value) => {
    setAddress(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  // Continue to payment page
  const handleContinue = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!address.fullName || !address.phone || !address.street || !address.city) {
      setError("Please fill in all required fields (*)");
      return;
    }
    
    // Validate Ethiopian phone format (+251 or 09)
    const phoneRegex = /^(\+251|0)[91]\d{8}$/;
    if (!phoneRegex.test(address.phone.replace(/\s/g, ''))) {
      setError("Please enter a valid Ethiopian phone number (e.g., 0911234567)");
      return;
    }

    // Save address to localStorage for payment page
    localStorage.setItem("checkoutAddress", JSON.stringify(address));
    
    // Call parent callback if provided
    if (onAddressSubmit) {
      onAddressSubmit(address);
    }
    
    // Navigate to payment page with order data
    navigate("/payment", { 
      state: { 
        cart, 
        total, 
        subtotal, 
        shippingFee, 
        tax,
        address 
      } 
    });
  };

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.length === 0) {
      navigate("/cart");
    }
  }, [cart, navigate]);

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
      
      {/* Order Summary */}
      <div style={{ background: "white", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", height: "fit-content" }}>
        <h2 style={{ margin: "0 0 1rem 0", color: "#333" }}>📦 Order Summary</h2>
        
        {cart.length === 0 ? (
          <p style={{ color: "#666" }}>Your cart is empty</p>
        ) : (
          <>
            {cart.map((item) => (
              <div key={item._id || item.id} style={{ display: "flex", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid #eee" }}>
                <img src={item.image || "https://via.placeholder.com/60"} alt={item.name} style={{ width: "60px", height: "60px", objectFit: "cover", marginRight: "10px", borderRadius: "6px" }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: "500" }}>{item.name}</span>
                  <p style={{ margin: "0.25rem 0 0 0", color: "#666", fontSize: "0.9rem" }}>× {item.quantity}</p>
                </div>
                <span style={{ fontWeight: "600", color: "#28a745" }}>{(item.price * item.quantity).toFixed(2)} ETB</span>
              </div>
            ))}
            
            <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "2px solid #eee" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ color: "#666" }}>Subtotal</span>
                <span>{subtotal.toFixed(2)} ETB</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ color: "#666" }}>Shipping</span>
                <span>{shippingFee.toFixed(2)} ETB</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ color: "#666" }}>VAT (15%)</span>
                <span>{tax.toFixed(2)} ETB</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "700", fontSize: "1.1rem", paddingTop: "0.5rem", borderTop: "1px solid #eee" }}>
                <span>Total</span>
                <span style={{ color: "#28a745" }}>{total.toFixed(2)} ETB</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delivery Address Form */}
      <div style={{ background: "white", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
        <h1 style={{ margin: "0 0 1.5rem 0", color: "#333" }}>🚚 Delivery Address</h1>
        
        {error && (
          <p style={{ color: "#dc3545", background: "#ffe6e6", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem" }}>
            ❌ {error}
          </p>
        )}

        <form onSubmit={handleContinue}>
          {/* Personal Info */}
          <div style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1rem 0", color: "#333", fontSize: "1.1rem" }}>👤 Contact Information</h3>
            <input 
              type="text" 
              placeholder="Full Name *" 
              value={address.fullName} 
              onChange={(e) => handleAddressChange("fullName", e.target.value)} 
              required 
              style={{ width: "100%", padding: "0.75rem", marginBottom: "0.75rem", borderRadius: "6px", border: "1px solid #ddd", fontSize: "1rem" }} 
            />
            <input 
              type="tel" 
              placeholder="Phone Number * (e.g., 0911234567)" 
              value={address.phone} 
              onChange={(e) => handleAddressChange("phone", e.target.value)} 
              required 
              style={{ width: "100%", padding: "0.75rem", marginBottom: "0.75rem", borderRadius: "6px", border: "1px solid #ddd", fontSize: "1rem" }} 
            />
            <input 
              type="email" 
              placeholder="Email Address" 
              value={address.email} 
              onChange={(e) => handleAddressChange("email", e.target.value)} 
              style={{ width: "100%", padding: "0.75rem", borderRadius: "6px", border: "1px solid #ddd", fontSize: "1rem" }} 
            />
          </div>

          {/* Address Fields */}
          <div style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1rem 0", color: "#333", fontSize: "1.1rem" }}>📍 Delivery Address</h3>
            <input 
              type="text" 
              placeholder="Street Address / Landmark *" 
              value={address.street} 
              onChange={(e) => handleAddressChange("street", e.target.value)} 
              required 
              style={{ width: "100%", padding: "0.75rem", marginBottom: "0.75rem", borderRadius: "6px", border: "1px solid #ddd", fontSize: "1rem" }} 
            />
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <input 
                type="text" 
                placeholder="City *" 
                value={address.city} 
                onChange={(e) => handleAddressChange("city", e.target.value)} 
                required 
                style={{ padding: "0.75rem", borderRadius: "6px", border: "1px solid #ddd", fontSize: "1rem" }} 
              />
              <input 
                type="text" 
                placeholder="Subcity / Woreda" 
                value={address.subcity} 
                onChange={(e) => handleAddressChange("subcity", e.target.value)} 
                style={{ padding: "0.75rem", borderRadius: "6px", border: "1px solid #ddd", fontSize: "1rem" }} 
              />
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.75rem" }}>
              <input 
                type="text" 
                placeholder="Region" 
                value={address.region} 
                onChange={(e) => handleAddressChange("region", e.target.value)} 
                style={{ padding: "0.75rem", borderRadius: "6px", border: "1px solid #ddd", fontSize: "1rem" }} 
              />
              <input 
                type="text" 
                placeholder="Country" 
                value={address.country} 
                onChange={(e) => handleAddressChange("country", e.target.value)} 
                style={{ padding: "0.75rem", borderRadius: "6px", border: "1px solid #ddd", fontSize: "1rem" }} 
              />
            </div>
          </div>

          {/* Continue Button */}
          <button 
            type="submit" 
            disabled={cart.length === 0} 
            style={{ 
              width: "100%", 
              padding: "1rem", 
              background: cart.length === 0 ? "#ccc" : "#007bff", 
              color: "white", 
              border: "none", 
              borderRadius: "8px", 
              fontSize: "1.1rem", 
              fontWeight: "600", 
              cursor: cart.length === 0 ? "not-allowed" : "pointer",
              transition: "background 0.2s"
            }}
          >
            Continue to Payment →
          </button>

          <p style={{ textAlign: "center", color: "#666", fontSize: "0.85rem", marginTop: "1rem" }}>
            🔒 Your information is secure and encrypted.
          </p>
        </form>
      </div>
    </div>
  );
}

export default Checkout;