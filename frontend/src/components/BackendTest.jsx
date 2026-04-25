import { useState, useEffect } from "react";

const BackendTest = () => {
  const [status, setStatus] = useState("Testing connection...");

  useEffect(() => {
    // 🔍 Use the EXACT URL your backend is running on
   const API_URL = "/api/products"; 
    
    fetch(API_URL)
      .then((res) => {
        console.log("📡 Response status:", res.status);
        if (res.ok) return res.json();
        throw new Error(`HTTP ${res.status}`);
      })
      .then((data) => {
        console.log("✅ Data received:", data);
        setStatus(`✅ Connected! Got ${Array.isArray(data) ? data.length : "data"}`);
      })
      .catch((err) => {
        console.error("❌ Connection error:", err);
        setStatus(`❌ ${err.message}`);
      });
  }, []);

  return (
    <div style={{ 
      padding: "0.75rem 1rem", 
      background: status.includes("✅") ? "#d4edda" : status.includes("❌") ? "#ffe6e6" : "#fff3cd",
      borderRadius: "6px",
      margin: "1rem",
      border: `1px solid ${status.includes("✅") ? "#28a745" : status.includes("❌") ? "#dc3545" : "#ffc107"}`
    }}>
      <strong>🔗 Backend Test:</strong> {status}
      <br />
      <small style={{ color: "#666" }}>
        Trying: http://localhost:5000/api/products
      </small>
    </div>
  );
};

export default BackendTest;