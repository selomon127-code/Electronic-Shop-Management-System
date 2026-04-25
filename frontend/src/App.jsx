// ecommerce-app/src/App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Layouts
import AdminLayout from "./layouts/AdminLayout";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
//import BackendTest from "./components/BackendTest";

// Pages
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Payment from "./pages/Payment";
import OrderConfirmation from "./pages/OrderConfirmation";
import OrderHistory from "./pages/OrderHistory";
import LoginForm from "./pages/LoginForm";
import Signup from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Admin Pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminOrders from "./pages/AdminOrders";
import AdminProducts from "./pages/AdminProducts";
import AdminAddProduct from "./pages/AdminAddProduct";
import AdminUsers from "./pages/AdminUsers";

function App() {
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");
      
      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error("Failed to parse user:", e);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }
      setAuthLoading(false);
    };
    checkAuth();
  }, []);
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const addToCart = (product) => {
    const existing = cart.find((p) => p.id === product.id);
    if (existing) {
      setCart(cart.map((p) =>
        p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (id) => setCart(cart.filter((p) => p.id !== id));
  const updateQuantity = (id, qty) => 
    setCart(cart.map((p) => (p.id === id ? { ...p, quantity: qty } : p)));

  const getCartCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  if (authLoading) {
    return <div style={{ textAlign: "center", padding: "2rem" }}>Loading... 🔄</div>;
  }

  return (
    <Router>
      <Routes>
        {/* ===== PUBLIC AUTH ROUTES ===== */}
        <Route path="/signup" element={
          user ? <Navigate to="/" replace /> : <Signup onLogin={handleLogin} />
        } />
        <Route path="/login" element={
          user ? <Navigate to="/" replace /> : <LoginForm onLogin={handleLogin} />
        } />
        <Route path="/forgot-password" element={
          user ? <Navigate to="/" replace /> : <ForgotPassword />
        } />
        <Route path="/reset-password/:token" element={
          user ? <Navigate to="/" replace /> : <ResetPassword />
        } />

        {/* ===== ADMIN ROUTES ===== */}
        <Route path="/admin/*" element={
          user?.role === "admin" ? (
            <AdminLayout user={user} handleLogout={handleLogout} />
          ) : <Navigate to="/" replace />
        }>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="add-product" element={<AdminAddProduct />} />
          <Route path="users" element={<AdminUsers />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* ===== USER ROUTES ===== */}
        <Route path="/" element={
          user ? (
            <>
              <Navbar cartCount={getCartCount()} user={user} handleLogout={handleLogout} />
              <Home addToCart={addToCart} />
              <Footer />
            </>
          ) : <Navigate to="/login" replace />
        } />

        <Route path="/products" element={
          user ? (
            <>
              <Navbar cartCount={getCartCount()} user={user} handleLogout={handleLogout} />
              <Products addToCart={addToCart} />
              <Footer />
            </>
          ) : <Navigate to="/login" replace />
        } />

        <Route path="/product/:id" element={
          user ? (
            <>
              <Navbar cartCount={getCartCount()} user={user} handleLogout={handleLogout} />
              <ProductDetail addToCart={addToCart} />
              <Footer />
            </>
          ) : <Navigate to="/login" replace />
        } />

        <Route path="/cart" element={
          user ? (
            <>
              <Navbar cartCount={getCartCount()} user={user} handleLogout={handleLogout} />
              <Cart cart={cart} removeFromCart={removeFromCart} updateQuantity={updateQuantity} />
              <Footer />
            </>
          ) : <Navigate to="/login" replace />
        } />

        <Route path="/checkout" element={
          user ? (
            <>
              <Navbar cartCount={getCartCount()} user={user} handleLogout={handleLogout} />
              <Checkout cart={cart} user={user} />
              <Footer />
            </>
          ) : <Navigate to="/login" replace />
        } />

        <Route path="/payment" element={
          user ? (
            <>
              <Navbar cartCount={getCartCount()} user={user} handleLogout={handleLogout} />
              <Payment onOrderSuccess={() => {
                setCart([]);
                console.log("🧹 Cart cleared after order");
              }} />
              <Footer />
            </>
          ) : <Navigate to="/login" replace />
        } />

        <Route path="/order-confirmation" element={
          user ? (
            <>
              <Navbar cartCount={getCartCount()} user={user} handleLogout={handleLogout} />
              <OrderConfirmation />
              <Footer />
            </>
          ) : <Navigate to="/login" replace />
        } />

        <Route path="/orders" element={
          user ? (
            <>
              <Navbar cartCount={getCartCount()} user={user} handleLogout={handleLogout} />
              <OrderHistory />
              <Footer />
            </>
          ) : <Navigate to="/login" replace />
        } />

        {/* ===== CATCH-ALL ROUTE ===== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
        {/* =====<BackendTest /> CATCH-ALL ROUTE ===== */}
      
    </Router>
  );
}

export default App;