import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { products } from "../data/products";

function ProductDetail({ addToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();

   const product = products.find((p) => 
  String(p._id) === String(id) || String(p.id) === String(id)
);

   if (!product) {
    console.error("❌ Product not found for ID:", id);
    return <h2>Product not found</h2>;
  }

  function handleAddToCart() {
    addToCart(product);
    navigate("/cart");
  }

  return (
    <div className="detail-container">
      <div className="detail-card">
        <div className="detail-image">
          <img src={product.image} alt={product.name} />
        </div>

        <div className="detail-info">
          <h1>{product.name}</h1>
          <p className="detail-description">{product.description}</p>
          <h2 className="detail-price">${product.price}</h2>
          <p><strong>Category:</strong> {product.category}</p>
          
          <button className="detail-button" onClick={handleAddToCart}>
            🛒 Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;