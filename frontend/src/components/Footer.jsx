import React from "react";
import { Link } from "react-router-dom";
//import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* About */}
        <div className="footer-section">
          <h3>About E-Shop</h3>
          <p>Your one-stop online store for the latest electronics and gadgets. Quality guaranteed.</p>
        </div>

        {/* Links */}
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/products">Products</Link></li>
            <li><Link to="/cart">Cart</Link></li>
            <li><Link to="/login">Login</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div className="footer-section">
          <h3>Contact Us</h3>
          <p>
            Email: <a href="mailto:selomon127@gmail.com">selomon127@gmail.com</a>
          </p>
          <p>
            Phone: <a href="tel:+251927603690">+251 927603690</a>
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} E-Shop. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;