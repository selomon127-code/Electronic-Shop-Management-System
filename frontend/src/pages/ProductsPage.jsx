import { useEffect, useState } from "react";
import { productApi } from "../api/productApi";

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await productApi.getAll();
        setProducts(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load products");
        console.error("API Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) return <div className="loading">Loading products... 🔄</div>;
  if (error) return <div className="error">❌ {error}</div>;

  return (
    <div className="products-grid">
      <h1>🛍️ Our Products</h1>
      <div className="grid">
        {products.map((product) => (
          <div key={product._id} className="product-card">
            <img 
              src={product.image || "https://via.placeholder.com/200"} 
              alt={product.name}
              className="product-image"
            />
            <h3>{product.name}</h3>
            <p className="price">${product.price}</p>
            <p className="category">{product.category}</p>
            <button 
              onClick={() => console.log("Add to cart:", product._id)}
              className="btn-primary"
            >
              Add to Cart 🛒
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductsPage;