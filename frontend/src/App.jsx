/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Layouts
import AdminLayout from "./layouts/AdminLayout";
import RequireRole from "./components/RequireRole";
import Wishlist from "./pages/Wishlist";
import Profile from "./pages/Profile";

// Admin Pages
import Dashboard from "./pages/admin/Dashboard";
import Orders from "./pages/admin/Orders";
import Users from "./pages/admin/Users";
import Products from "./pages/admin/Products";
import AddProduct from "./pages/admin/AddProduct";
import EditProduct from "./pages/admin/EditProduct";
import Coupons from "./pages/admin/Coupons";
import SystemHealth from "./pages/admin/SystemHealth";
import Reports from "./pages/admin/Reports";

// Auth Pages
import GoogleAuthSuccess from "./pages/GoogleAuthSuccess";
import LoginForm from "./pages/LoginForm";
import Signup from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Notifications from "./pages/admin/Notifications";

// Public Pages
import Home from "./pages/Home";
import ProductsPublic from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Payment from "./pages/Payment";
import OrderConfirmation from "./pages/OrderConfirmation";
import OrderHistory from "./pages/OrderHistory";
import OrderDetail from "./pages/OrderDetail";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AIChatbotWidget from "./components/AIChatbotWidget";
import ToastNotifications, { useToast } from "./components/ToastNotifications";
import i18n from "./i18n";

function App() {
  const notify = useToast();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem("cart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

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
    localStorage.removeItem("cart");
    setUser(null);
    setCart([]);
  };

  const addToCart = (product, { showNotification = true } = {}) => {
    setCart((prevCart) => {
      const existing = prevCart.find((p) => String(p._id) === String(product._id));
      if (existing) {
        return prevCart.map((p) =>
          String(p._id) === String(product._id) 
            ? { ...p, quantity: p.quantity + 1 } 
            : p
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
    if (showNotification) {
      notify("success", i18n.t("wishlist.added_to_cart"));
    }
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((p) => String(p._id) !== String(id)));
  };

  const updateQuantity = (id, qty) => {
    if (qty < 1) return;
    setCart((prevCart) =>
      prevCart.map((p) => (String(p._id) === String(id) ? { ...p, quantity: qty } : p))
    );
  };

  const getCartCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  if (authLoading) {
    return <div style={{ textAlign: "center", padding: "2rem" }}>Loading... 🔄</div>;
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/auth/google/success" 
          element={<GoogleAuthSuccess onLogin={handleLogin} />} 
        />

        <Route path="/signup" element={
          user ? <Navigate to="/" replace /> : <Signup onLogin={handleLogin} />
        } />
        <Route path="/login" element={
          user ? <Navigate to="/" replace /> : <LoginForm onLogin={handleLogin} />
        } />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Admin Routes - PROTECTED */}
        <Route path="/admin/*" element={
          user && ["business_owner", "system_admin"].includes(user.role) ? (
            <AdminLayout user={user} onLogout={handleLogout} />
          ) : <Navigate to={user ? "/" : "/login"} replace />
        }>
          <Route index element={<Navigate to={user?.role === "system_admin" ? "system" : "dashboard"} replace />} />
          <Route path="dashboard" element={<RequireRole user={user} roles={["business_owner"]}><Dashboard /></RequireRole>} />
          <Route path="orders" element={<RequireRole user={user} roles={["business_owner"]}><Orders /></RequireRole>} />
          <Route path="products" element={<RequireRole user={user} roles={["business_owner"]}><Products /></RequireRole>} />
          <Route path="add-product" element={<RequireRole user={user} roles={["business_owner"]}><AddProduct /></RequireRole>} />
          <Route path="edit-product/:id" element={<RequireRole user={user} roles={["business_owner"]}><EditProduct /></RequireRole>} />
          <Route path="coupons" element={<RequireRole user={user} roles={["business_owner"]}><Coupons /></RequireRole>} />
          <Route path="reports" element={<RequireRole user={user} roles={["business_owner"]}><Reports /></RequireRole>} />
          <Route path="users" element={<RequireRole user={user} roles={["system_admin"]}><Users /></RequireRole>} />
          <Route path="system" element={<RequireRole user={user} roles={["system_admin"]}><SystemHealth /></RequireRole>} />
        </Route>

        {/* ✅ PUBLIC ROUTES - Accessible without login */}
        <Route path="/" element={
          <>
            <Navbar cartCount={getCartCount()} user={user} handleLogout={handleLogout} />
            <Home addToCart={addToCart} user={user} />
            <Footer />
          </>
        } />

        <Route path="/products" element={
          <>
            <Navbar cartCount={getCartCount()} user={user} handleLogout={handleLogout} />
            <ProductsPublic addToCart={addToCart} user={user} />
            <Footer />
          </>
        } />

        <Route path="/product/:id" element={
          <>
            <Navbar cartCount={getCartCount()} user={user} handleLogout={handleLogout} />
            <ProductDetail addToCart={addToCart} user={user} />
            <Footer />
          </>
        } />

        <Route path="/cart" element={
          <>
            <Navbar cartCount={getCartCount()} user={user} handleLogout={handleLogout} />
            <Cart cart={cart} removeFromCart={removeFromCart} updateQuantity={updateQuantity} addToCart={addToCart} user={user} />
            <Footer />
          </>
        } />

        {/* ✅ PROTECTED ROUTES - Require login */}
        <Route path="/checkout" element={
          user ? (
            <>
              <Navbar cartCount={getCartCount()} user={user} handleLogout={handleLogout} />
              <Checkout cart={cart} user={user} />
              <Footer />
            </>
          ) : <Navigate to="/login" replace />
        } />
        <Route path="/notifications" element={<Notifications />} />

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

        <Route path="/orders/:id" element={
          user ? (
            <>
              <Navbar cartCount={getCartCount()} user={user} handleLogout={handleLogout} />
              <OrderDetail addToCart={addToCart} />
              <Footer />
            </>
          ) : <Navigate to="/login" replace />
        } />

        <Route path="/wishlist" element={
          user ? (
            <>
              <Navbar cartCount={getCartCount()} user={user} handleLogout={handleLogout} />
              <Wishlist addToCart={addToCart} />
              <Footer />
            </>
          ) : <Navigate to="/login" replace />
        } />

        <Route path="/profile" element={
          user ? (
            <>
              <Navbar cartCount={getCartCount()} user={user} handleLogout={handleLogout} />
              <Profile 
                user={user} 
                onUserUpdate={(updatedUser) => {
                  setUser(updatedUser);
                  localStorage.setItem("user", JSON.stringify(updatedUser));
                }} 
              />
              <Footer />
            </>
          ) : <Navigate to="/login" replace />
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastNotifications />
      <AIChatbotWidget addToCart={addToCart} user={user} />
    </Router>
  );
}

export default App;