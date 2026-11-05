/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import API from "../api/axios";
import { getDiscountedPrice } from "../utils/productPricing";
import PromoCodeInput from "../components/PromoCodeInput";
import CouponSelector from "../components/CouponSelector";
import CouponAppliedMessage from "../components/CouponAppliedMessage";
import CouponErrorMessage from "../components/CouponErrorMessage";

function Checkout({ cart, user }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("chapa");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponCartSignature, setCouponCartSignature] = useState("");

  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.name || "",
    phone: user?.phone || "",
    city: "Addis Ababa",
    subcity: "",
    street: "",
  });

  useEffect(() => {
    if (!cart || cart.length === 0) navigate("/cart");
  }, [cart, navigate]);

  const handleChange = (e) =>
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });

  const subtotal = cart.reduce(
    (sum, item) => sum + getDiscountedPrice(item) * item.quantity,
    0,
  );
  const shippingFee = subtotal > 5000 ? 0 : 150;
  const cartSignature = JSON.stringify(
    cart.map((item) => [String(item._id || item.id), item.quantity]).sort(),
  );
  const couponIsCurrent =
    appliedCoupon && couponCartSignature === cartSignature;
  const displayedSubtotal = couponIsCurrent
    ? appliedCoupon.subtotal
    : subtotal;
  const displayedShippingFee = couponIsCurrent
    ? appliedCoupon.shippingFee
    : shippingFee;
  const couponDiscount = couponIsCurrent
    ? appliedCoupon.couponDiscount
    : 0;
  const total = Math.max(0, displayedSubtotal - couponDiscount) + displayedShippingFee;

  useEffect(() => {
    if (appliedCoupon && couponCartSignature !== cartSignature) {
      setAppliedCoupon(null);
      setCouponError("Cart changed. Apply the coupon again to refresh the discount.");
    }
  }, [appliedCoupon, cartSignature, couponCartSignature]);

  const handleApplyCoupon = async (selectedCode = couponCode) => {
    const code = selectedCode.trim().toUpperCase();
    if (!code) {
      setCouponError("Enter a coupon code.");
      return;
    }

    if (
      appliedCoupon &&
      appliedCoupon.coupon?.code === code &&
      couponCartSignature === cartSignature
    ) {
      setCouponError("This coupon is already applied.");
      return;
    }

    setCouponLoading(true);
    setCouponError("");
    try {
      const { data } = await API.post("/coupons/validate", {
        code,
        items: cart.map((item) => ({
          _id: item._id || item.id,
          quantity: item.quantity,
        })),
      });
      setAppliedCoupon(data);
      setCouponCartSignature(cartSignature);
      setCouponCode(data.coupon.code);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err.response?.data?.message || "Could not apply this coupon.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCartSignature("");
    setCouponCode("");
    setCouponError("");
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const orderData = {
        items: cart.map((item) => ({
          _id: item._id || item.id,
          quantity: item.quantity,
        })),
        shippingAddress,
        paymentMethod: paymentMethod === "cash_on_delivery" ? "cod" : "chapa",
        ...(appliedCoupon &&
          couponCartSignature === cartSignature && {
            couponCode: appliedCoupon.coupon.code,
          }),
      };

      const { data } = await API.post("/orders", orderData);

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        navigate(`/order-confirmation?orderId=${data.order?._id || data._id}`);
      }
    } catch (err) {
      const backendError = err.response?.data?.message;
      setError(
        Array.isArray(backendError)
          ? backendError.join(", ")
          : backendError || "Failed to process order.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!cart || cart.length === 0) return null;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <h1 style={{ marginBottom: "1.5rem", fontSize: "1.5rem" }}>🛒 Checkout</h1>

      {error && (
        <div
          style={{
            background: "#fef2f2",
            color: "#991b1b",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            border: "1px solid #fecaca",
          }}
        >
          ❌ {error}
        </div>
      )}

      <form
        onSubmit={handlePlaceOrder}
        className="checkout-layout"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1.5rem",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Shipping Info */}
          <div
            className="checkout-section"
            style={{
              background: "var(--bg-card)",
              padding: "1.5rem",
              borderRadius: "12px",
              border: "1px solid var(--border)",
            }}
          >
            <h2 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>📍 Shipping Info</h2>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <input
                name="fullName"
                value={shippingAddress.fullName}
                onChange={handleChange}
                required
                placeholder="Full Name *"
                style={{
                  width: "100%",
                  padding: "0.65rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  fontSize: "0.9rem",
                  boxSizing: "border-box",
                }}
              />
              <input
                name="phone"
                type="tel"
                value={shippingAddress.phone}
                onChange={handleChange}
                required
                placeholder="Phone (+251...) *"
                style={{
                  width: "100%",
                  padding: "0.65rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  fontSize: "0.9rem",
                  boxSizing: "border-box",
                }}
              />
              <div
                className="checkout-address-pair"
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}
              >
                <input
                  name="city"
                  value={shippingAddress.city}
                  onChange={handleChange}
                  required
                  placeholder="City *"
                  style={{
                    width: "100%",
                    padding: "0.65rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    fontSize: "0.9rem",
                    boxSizing: "border-box",
                  }}
                />
                <input
                  name="subcity"
                  value={shippingAddress.subcity}
                  onChange={handleChange}
                  placeholder="Subcity"
                  style={{
                    width: "100%",
                    padding: "0.65rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    fontSize: "0.9rem",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <input
                name="street"
                value={shippingAddress.street}
                onChange={handleChange}
                required
                placeholder="Street / House Number *"
                style={{
                  width: "100%",
                  padding: "0.65rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  fontSize: "0.9rem",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Payment Method */}
          <div
            className="checkout-section"
            style={{
              background: "var(--bg-card)",
              padding: "1.5rem",
              borderRadius: "12px",
              border: "1px solid var(--border)",
            }}
          >
            <h2 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>💳 Payment Method</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {["chapa", "cash_on_delivery"].map((method) => (
                <label
                  key={method}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem",
                    border:
                      paymentMethod === method
                        ? "2px solid var(--primary)"
                        : "1px solid var(--border)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    background: paymentMethod === method ? "#eef2ff" : "white",
                  }}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={() => setPaymentMethod(method)}
                    style={{ accentColor: "var(--primary)" }}
                  />
                  <div>
                    <div style={{ fontWeight: "600", fontSize: "0.95rem" }}>
                      {method === "chapa" ? "Pay with Chapa" : "Cash on Delivery"}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {method === "chapa"
                        ? "Card, Telebirr, or CBE Birr"
                        : "Pay when your order arrives"}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div
          className="checkout-section checkout-summary"
          style={{
            background: "#f8fafc",
            padding: "1.5rem",
            borderRadius: "12px",
            height: "fit-content",
            position: "sticky",
            top: "80px",
            border: "1px solid var(--border)",
          }}
        >
          <h2 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>📝 Order Summary</h2>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              marginBottom: "1rem",
              maxHeight: "250px",
              overflowY: "auto",
            }}
          >
            {cart.map((item) => (
              <div
                key={item._id || item.id}
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "center",
                  fontSize: "0.9rem",
                }}
              >
                <img
                  src={item.image || "https://placehold.co/50"}
                  alt={item.name}
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "6px",
                    objectFit: "cover",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: "600", fontSize: "0.85rem" }}>
                    {item.name}
                  </p>
                  <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.8rem" }}>
                    Qty: {item.quantity}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontWeight: "700", color: "var(--success)" }}>
                    {(getDiscountedPrice(item) * item.quantity).toLocaleString()} ETB
                  </p>
                  {Number(item.discount) > 0 && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        textDecoration: "line-through",
                      }}
                    >
                      {(Number(item.price) * item.quantity).toLocaleString()} ETB
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Coupon Section */}
          {couponIsCurrent && (
            <CouponAppliedMessage
              appliedCoupon={appliedCoupon}
              onRemove={handleRemoveCoupon}
            />
          )}

          <PromoCodeInput
            value={couponCode}
            onChange={(val) => {
              setCouponCode(val);
              if (couponError) setCouponError("");
            }}
            onApply={() => handleApplyCoupon()}
            onRemove={handleRemoveCoupon}
            appliedCoupon={couponIsCurrent ? appliedCoupon : null}
            loading={couponLoading}
          />

          <CouponSelector
            subtotal={subtotal}
            appliedCode={couponIsCurrent ? appliedCoupon.coupon.code : ""}
            disabled={couponLoading}
            onSelectCoupon={(code) => {
              setCouponCode(code);
              handleApplyCoupon(code);
            }}
          />

          {couponError && (
            <CouponErrorMessage
              message={couponError}
              onDismiss={() => setCouponError("")}
            />
          )}

          {/* Totals Breakdown */}
          <div
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: "0.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              fontSize: "0.9rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: "var(--text-muted)",
              }}
            >
              <span>Subtotal</span>
              <span>{displayedSubtotal.toLocaleString()} ETB</span>
            </div>
            {couponIsCurrent && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "var(--success)",
                }}
              >
                <span>Coupon ({appliedCoupon.coupon.code})</span>
                <strong>−{couponDiscount.toLocaleString()} ETB</strong>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: "var(--text-muted)",
              }}
            >
              <span>Shipping</span>
              <span
                style={{
                  color: displayedShippingFee === 0 ? "var(--success)" : "inherit",
                }}
              >
                {displayedShippingFee === 0 ? "FREE" : `${displayedShippingFee} ETB`}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: "800",
                fontSize: "1.1rem",
                marginTop: "0.5rem",
              }}
            >
              <span>Total</span>
              <span>{total.toLocaleString()} ETB</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "1.25rem",
              padding: "0.85rem",
              background: loading ? "#cbd5e1" : "var(--primary)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "700",
              fontSize: "1rem",
            }}
          >
            {loading
              ? "Processing..."
              : paymentMethod === "cash_on_delivery"
                ? "📦 Place Order"
                : `💳 Pay ${total.toLocaleString()} ETB`}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Checkout;
