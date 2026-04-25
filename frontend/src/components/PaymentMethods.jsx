// ecommerce-app/src/components/PaymentMethods.jsx
import React from "react";

function PaymentMethods({ selectedMethod, onMethodChange, selectedBank, onBankSelect }) {
  const paymentMethods = [
    { id: "telebirr", name: "Telebirr", icon: "📱", description: "Pay instantly with Telebirr", fee: "0%" },
    { id: "chapa", name: "Chapa", icon: "🔗", description: "Card, Telebirr, CBE Birr — Pay on secure Chapa checkout", fee: "2.9%" },
    { id: "bank_transfer", name: "Direct Bank Transfer", icon: "🏦", description: "Transfer & upload proof", fee: "0%", banks: ["CBE", "Awash Bank", "Dashen Bank", "Bank of Abyssinia"] },
    { id: "cod", name: "Cash on Delivery", icon: "💵", description: "Pay when delivered", fee: "0%" }
  ];

  const handleMethodSelect = (methodId) => {
    onMethodChange(methodId);
    // ✅ Clear bank selection when switching away from bank_transfer
    if (methodId !== "bank_transfer") {
      onBankSelect("");
    }
  };

  // ✅ FIX: Show bank select ONLY for bank_transfer (NOT for Chapa!)
  const showBankSelect = selectedMethod === "bank_transfer";
  const banks = paymentMethods.find(m => m.id === selectedMethod)?.banks || [];

  return (
    <div style={{ marginBottom: "2rem" }}>
      <h3 style={{ marginBottom: "1rem", color: "#333" }}>💳 Select Payment Method</h3>
      
      <div style={{ display: "grid", gap: "1rem" }}>
        {paymentMethods.map((method) => (
          <label
            key={method.id}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "1rem",
              border: `2px solid ${selectedMethod === method.id ? "#007bff" : "#ddd"}`,
              borderRadius: "12px",
              cursor: "pointer",
              background: selectedMethod === method.id ? "#f0f7ff" : "white",
              transition: "all 0.2s"
            }}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={method.id}
              checked={selectedMethod === method.id}
              onChange={() => handleMethodSelect(method.id)}
              style={{ marginRight: "1rem", transform: "scale(1.2)", cursor: "pointer" }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.5rem" }}>{method.icon}</span>
                <span style={{ fontWeight: "600", color: "#333" }}>{method.name}</span>
                {method.fee !== "0%" && (
                  <span style={{ fontSize: "0.8rem", background: "#e9ecef", padding: "0.2rem 0.5rem", borderRadius: "4px", color: "#666" }}>
                    Fee: {method.fee}
                  </span>
                )}
              </div>
              <p style={{ margin: "0.25rem 0 0 0", color: "#666", fontSize: "0.9rem" }}>{method.description}</p>
            </div>
          </label>
        ))}
      </div>

      {/* ✅ FIX: Bank selection ONLY for bank_transfer */}
      {showBankSelect && (
        <div style={{ marginTop: "1rem", padding: "1rem", background: "#f8f9fa", borderRadius: "8px", border: "1px solid #dee2e6" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#333" }}>
            Select Bank for Transfer:
          </label>
          <select
            value={selectedBank}
            onChange={(e) => onBankSelect(e.target.value)}
            required={selectedMethod === "bank_transfer"}
            style={{ width: "100%", padding: "0.75rem", borderRadius: "6px", border: "1px solid #ddd", fontSize: "1rem", background: "white" }}
          >
            <option value="">-- Select a bank --</option>
            {banks.map(bank => <option key={bank} value={bank}>{bank}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

export default PaymentMethods;