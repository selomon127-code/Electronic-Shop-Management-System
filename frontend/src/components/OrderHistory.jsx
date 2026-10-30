import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios"; // Adjust path to your axios instance

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // ✅ This calls your backend: GET /api/orders
      const { data } = await API.get("/orders");
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      if (error.response?.status === 401) {
        navigate("/login"); // Redirect if not logged in
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    
    try {
      await API.put(`/orders/${orderId}/cancel`);
      alert("Order cancelled successfully! Stock has been restored.");
      fetchOrders(); // ✅ Refresh the list immediately
    } catch (error) {
      alert(error.response?.data?.message || "Failed to cancel order");
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "paid": case "processing": case "shipped": return "bg-blue-100 text-blue-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "cancelled": case "failed": return "bg-red-100 text-red-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading your orders... 🔄</div>;

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-xl font-semibold text-gray-700">No orders yet</h3>
        <p className="text-gray-500 mt-2 mb-4">Start shopping to see your orders here!</p>
        <button 
          onClick={() => navigate("/products")}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        📦 My Orders <span className="text-sm font-normal text-gray-500 bg-gray-200 px-2 py-1 rounded-full">{orders.length}</span>
      </h2>

      {orders.map((order) => (
        <div key={order._id} className="border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow bg-white">
          {/* Order Header */}
          <div className="flex flex-wrap justify-between items-center border-b pb-4 mb-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase">Order ID</p>
              <p className="font-mono font-bold text-gray-800">#{order._id.toString().slice(-6).toUpperCase()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Date</p>
              <p className="font-medium text-gray-800">{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Total</p>
              <p className="font-bold text-lg text-indigo-600">{order.totalPrice} ETB</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(order.paymentStatus || order.status)}`}>
              {order.paymentStatus || order.status}
            </span>
          </div>

          {/* Order Items */}
          <div className="space-y-3">
            {order.products.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <img 
                  src={item.product?.image || item.image || "https://via.placeholder.com/50"} 
                  alt={item.product?.name || item.name}
                  className="w-16 h-16 object-cover rounded-lg border"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{item.product?.name || item.name}</h4>
                  <p className="text-sm text-gray-500">Qty: {item.quantity} × {item.product?.price || item.price} ETB</p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          {(order.status === "pending" || order.status === "pending_payment") && (
            <div className="mt-4 pt-4 border-t flex justify-end">
              <button 
                onClick={() => handleCancelOrder(order._id)}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm flex items-center gap-2"
              >
                🚫 Cancel Order
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default OrderHistory;