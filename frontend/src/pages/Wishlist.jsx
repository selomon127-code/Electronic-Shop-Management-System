// ecommerce-app/src/pages/Wishlist.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { wishlistApi } from "../api/adminApi";

const PLACEHOLDER = "https://placehold.co/400x300/e2e8f0/64748b?text=No+Image";

function Wishlist({ addToCart }) {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedToCart, setAddedToCart] = useState({});
  const [confirmId, setConfirmId] = useState(null); // item awaiting remove confirmation
  const [removingId, setRemovingId] = useState(null); // item playing exit animation
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', text }
  const toastTimer = useRef(null);

  useEffect(() => {
    fetchWishlist();
    return () => clearTimeout(toastTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (text, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ text, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const { data } = await wishlistApi.getWishlist();
      setWishlist(data.products || []);
    } catch (err) {
      console.error("❌ Fetch wishlist error:", err);
      showToast("Failed to load wishlist", "error");
    } finally {
      setLoading(false);
    }
  };

  // Treat undefined/missing stock as in stock
  const isInStock = (item) => item.stock === undefined || item.stock === null || item.stock > 0;

  const toCartItem = (item) => ({
    _id: item.productId,
    id: item.productId,
    name: item.name,
    price: item.price,
    image: item.image,
    category: item.category,
    description: item.description,
    stock: item.stock ?? 999,
  });

  const handleRemove = async (productId) => {
    setConfirmId(null);
    setRemovingId(productId);
    try {
      await wishlistApi.removeFromWishlist(productId);
      // let the exit animation play before the card disappears
      setTimeout(() => {
        setWishlist((prev) => prev.filter((item) => item.productId !== productId));
        setRemovingId(null);
        showToast("Removed from wishlist");
      }, 350);
    } catch (err) {
      setRemovingId(null);
      showToast("Failed to remove: " + (err.response?.data?.message || err.message), "error");
    }
  };

  const handleMoveToCart = (item) => {
    if (!item) return;
    addToCart(toCartItem(item));
    setAddedToCart((prev) => ({ ...prev, [item.productId]: true }));
    setTimeout(() => {
      setAddedToCart((prev) => {
        const next = { ...prev };
        delete next[item.productId];
        return next;
      });
    }, 2000);
  };

  const handleAddAllToCart = () => {
    const available = wishlist.filter(isInStock);
    if (available.length === 0) {
      showToast("No items in stock to add to cart", "error");
      return;
    }
    available.forEach((item) => addToCart(toCartItem(item)));
    showToast(`${available.length} item${available.length === 1 ? "" : "s"} added to cart!`);
  };

  const handleClearAll = async () => {
    try {
      setClearing(true);
      await wishlistApi.clearWishlist();
      setWishlist([]);
      setShowClearModal(false);
      showToast("Wishlist cleared");
    } catch (err) {
      showToast("Failed to clear: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setClearing(false);
    }
  };

  const inStockCount = wishlist.filter(isInStock).length;

  return (
    <div className="wl">
      <style>{css}</style>

      {/* ================= HEADER ================= */}
      <header className="wl-hero">
        <div className="wl-blob b1" />
        <div className="wl-blob b2" />
        <div className="wl-hero-inner">
          <h1>
            <span className="wl-heart">❤️</span> My <span className="wl-gradient">Wishlist</span>
          </h1>
          <p>
            {loading
              ? "Loading your favorites…"
              : `${wishlist.length} ${wishlist.length === 1 ? "item" : "items"} saved${
                  wishlist.length > 0 ? ` • ${inStockCount} in stock` : ""
                }`}
          </p>

          {wishlist.length > 0 && !loading && (
            <div className="wl-actions">
              <button className="wl-btn wl-btn-primary" onClick={handleAddAllToCart}>
                🛒 Add All to Cart
              </button>
              <button className="wl-btn wl-btn-ghost" onClick={() => setShowClearModal(true)}>
                🗑️ Clear All
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="wl-main">
        {/* ================= LOADING ================= */}
        {loading ? (
          <div className="wl-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="wl-skel">
                <div className="sk sk-img" />
                <div className="sk sk-line" />
                <div className="sk sk-line short" />
              </div>
            ))}
          </div>
        ) : wishlist.length === 0 ? (
          /* ================= EMPTY ================= */
          <div className="wl-empty">
            <div className="wl-empty-icon">💔</div>
            <h3>Your wishlist is empty</h3>
            <p>Tap the heart on any product to save it here for later.</p>
            <button className="wl-btn wl-btn-primary" onClick={() => navigate("/products")}>
              🛍️ Browse Products
            </button>
          </div>
        ) : (
          /* ================= GRID ================= */
          <div className="wl-grid">
            {wishlist.map((item, index) => {
              const inStock = isInStock(item);
              const wasAdded = addedToCart[item.productId];
              const leaving = removingId === item.productId;

              return (
                <article
                  key={item.productId}
                  className={`wl-card ${leaving ? "leaving" : ""} ${!inStock ? "oos" : ""}`}
                  style={{ animationDelay: `${Math.min(index, 11) * 70}ms` }}
                >
                  {/* Image */}
                  <div className="wl-img">
                    <img
                      src={item.image || PLACEHOLDER}
                      alt={item.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = PLACEHOLDER;
                      }}
                    />
                    {!inStock && <span className="wl-oos-badge">Out of Stock</span>}
                    {item.category && <span className="wl-cat">{item.category}</span>}
                    {wasAdded && <div className="wl-added">✅ Added to Cart!</div>}
                  </div>

                  {/* Info */}
                  <div className="wl-body">
                    <h3>{item.name}</h3>

                    <div className="wl-price-row">
                      <div className="wl-price">
                        {Number(item.price || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        <small>ETB</small>
                      </div>
                      <div className={`wl-stock ${inStock ? "ok" : "no"}`}>
                        <span className="wl-dot" />
                        {inStock ? (item.stock ? `${item.stock} in stock` : "In Stock") : "Out of Stock"}
                      </div>
                    </div>

                    <div className="wl-card-actions">
                      <button
                        className={`wl-add ${wasAdded ? "done" : ""}`}
                        onClick={() => handleMoveToCart(item)}
                        disabled={!inStock}
                      >
                        {!inStock ? "Out of Stock" : wasAdded ? "✅ Added!" : "🛒 Add to Cart"}
                      </button>

                      {confirmId === item.productId ? (
                        <div className="wl-confirm">
                          <button className="yes" onClick={() => handleRemove(item.productId)} aria-label="Confirm remove">
                            ✓
                          </button>
                          <button className="no" onClick={() => setConfirmId(null)} aria-label="Cancel">
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          className="wl-remove"
                          onClick={() => setConfirmId(item.productId)}
                          aria-label={`Remove ${item.name} from wishlist`}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* ================= CLEAR-ALL MODAL ================= */}
      {showClearModal && (
        <div className="wl-overlay" onClick={() => !clearing && setShowClearModal(false)}>
          <div className="wl-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="wl-modal-icon">⚠️</div>
            <h3>Clear entire wishlist?</h3>
            <p>
              This will remove all {wishlist.length} saved {wishlist.length === 1 ? "item" : "items"}. This
              cannot be undone.
            </p>
            <div className="wl-modal-actions">
              <button className="wl-btn wl-btn-cancel" onClick={() => setShowClearModal(false)} disabled={clearing}>
                Cancel
              </button>
              <button className="wl-btn wl-btn-danger" onClick={handleClearAll} disabled={clearing}>
                {clearing ? "Clearing…" : "Yes, clear all"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TOAST ================= */}
      {toast && (
        <div className={`wl-toast ${toast.type}`} role="status">
          {toast.type === "success" ? "✅" : "❌"} {toast.text}
        </div>
      )}
    </div>
  );
}

const css = `
.wl { font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif; background: #f8fafc; min-height: 100vh; color: #0f172a; }
.wl * { box-sizing: border-box; }
@keyframes wlUp { from { opacity: 0; transform: translateY(26px); } to { opacity: 1; transform: none; } }

/* Hero */
.wl-hero { position: relative; overflow: hidden; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%); color: #fff; padding: 3rem 1.5rem 3.4rem; text-align: center; border-radius: 0 0 36px 36px; }
.wl-blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: .5; animation: wlBlob 12s ease-in-out infinite alternate; }
.wl-blob.b1 { width: 280px; height: 280px; background: #6366f1; top: -120px; left: -60px; }
.wl-blob.b2 { width: 260px; height: 260px; background: #ec4899; bottom: -130px; right: 8%; animation-delay: -5s; }
@keyframes wlBlob { to { transform: translate(40px, -25px) scale(1.15); } }
.wl-hero-inner { position: relative; z-index: 2; animation: wlUp .8s cubic-bezier(.2,.8,.2,1) both; }
.wl-hero h1 { margin: 0 0 .5rem; font-size: clamp(1.9rem, 5vw, 2.9rem); font-weight: 800; letter-spacing: -.02em; }
.wl-heart { display: inline-block; animation: wlBeat 1.5s ease-in-out infinite; }
@keyframes wlBeat { 0%,100% { transform: scale(1); } 15% { transform: scale(1.25); } 30% { transform: scale(1); } 45% { transform: scale(1.2); } }
.wl-gradient { background: linear-gradient(90deg, #a5b4fc, #f0abfc, #67e8f9); background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent; animation: wlShine 5s linear infinite; }
@keyframes wlShine { to { background-position: 200% center; } }
.wl-hero p { margin: 0; opacity: .85; font-size: 1.05rem; }
.wl-actions { display: flex; justify-content: center; gap: .8rem; flex-wrap: wrap; margin-top: 1.6rem; }

/* Buttons */
.wl-btn { display: inline-flex; align-items: center; justify-content: center; gap: .5rem; padding: .85rem 1.7rem; border: none; border-radius: 999px; font-weight: 700; font-size: .95rem; cursor: pointer; transition: transform .25s ease, box-shadow .25s ease, background .25s ease; }
.wl-btn:hover:not(:disabled) { transform: translateY(-3px); }
.wl-btn:disabled { opacity: .6; cursor: not-allowed; }
.wl-btn-primary { color: #fff; background: linear-gradient(135deg, #6366f1, #8b5cf6); box-shadow: 0 10px 25px rgba(99,102,241,.4); }
.wl-btn-primary:hover { box-shadow: 0 14px 30px rgba(99,102,241,.55); }
.wl-btn-ghost { color: #fff; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.25); backdrop-filter: blur(6px); }
.wl-btn-ghost:hover { background: rgba(239,68,68,.35); border-color: rgba(252,165,165,.6); }
.wl-btn-cancel { background: #f1f5f9; color: #334155; }
.wl-btn-danger { color: #fff; background: linear-gradient(135deg, #ef4444, #dc2626); box-shadow: 0 8px 20px rgba(239,68,68,.35); }

/* Layout */
.wl-main { max-width: 1300px; margin: 0 auto; padding: 2.5rem 1.5rem 4rem; }
.wl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 1.5rem; }

/* Card */
.wl-card { display: flex; flex-direction: column; background: #fff; border: 1px solid #e2e8f0; border-radius: 22px; overflow: hidden; opacity: 0; animation: wlUp .6s cubic-bezier(.2,.8,.2,1) forwards; transition: transform .3s ease, box-shadow .3s ease, border-color .3s ease; }
.wl-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(99,102,241,.18); border-color: #c7d2fe; }
.wl-card.leaving { animation: wlLeave .35s ease forwards; }
@keyframes wlLeave { to { opacity: 0; transform: scale(.88) translateY(10px); } }
.wl-img { position: relative; height: 210px; background: #f1f5f9; overflow: hidden; }
.wl-img img { width: 100%; height: 100%; object-fit: cover; transition: transform .6s ease; }
.wl-card:hover .wl-img img { transform: scale(1.09); }
.wl-card.oos .wl-img img { filter: grayscale(.8); opacity: .75; }
.wl-cat { position: absolute; left: .8rem; bottom: .8rem; padding: .25rem .8rem; background: rgba(15,23,42,.75); backdrop-filter: blur(6px); color: #fff; border-radius: 999px; font-size: .75rem; font-weight: 600; }
.wl-oos-badge { position: absolute; top: .8rem; right: .8rem; padding: .3rem .85rem; background: #ef4444; color: #fff; border-radius: 999px; font-size: .75rem; font-weight: 700; box-shadow: 0 4px 12px rgba(239,68,68,.4); }
.wl-added { position: absolute; top: .8rem; left: 50%; transform: translateX(-50%); padding: .45rem 1rem; background: #10b981; color: #fff; border-radius: 999px; font-size: .82rem; font-weight: 700; white-space: nowrap; box-shadow: 0 8px 20px rgba(16,185,129,.45); animation: wlPop .4s cubic-bezier(.2,.8,.2,1); }
@keyframes wlPop { from { opacity: 0; transform: translateX(-50%) translateY(-14px) scale(.8); } to { opacity: 1; transform: translateX(-50%); } }

.wl-body { padding: 1.1rem 1.2rem 1.3rem; display: flex; flex-direction: column; gap: .9rem; flex: 1; }
.wl-body h3 { margin: 0; font-size: 1.08rem; font-weight: 700; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.wl-price-row { display: flex; justify-content: space-between; align-items: flex-end; gap: .5rem; margin-top: auto; }
.wl-price { font-size: 1.4rem; font-weight: 800; color: #059669; }
.wl-price small { font-size: .75rem; font-weight: 600; }
.wl-stock { display: inline-flex; align-items: center; gap: .4rem; font-size: .8rem; font-weight: 600; }
.wl-stock.ok { color: #059669; }
.wl-stock.no { color: #dc2626; }
.wl-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
.wl-stock.ok .wl-dot { animation: wlPulse 1.8s infinite; }
@keyframes wlPulse { 0% { box-shadow: 0 0 0 0 rgba(5,150,105,.5); } 70% { box-shadow: 0 0 0 7px rgba(5,150,105,0); } 100% { box-shadow: 0 0 0 0 rgba(5,150,105,0); } }

.wl-card-actions { display: flex; gap: .5rem; }
.wl-add { flex: 1; padding: .75rem; border: none; border-radius: 12px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; font-weight: 700; font-size: .88rem; cursor: pointer; box-shadow: 0 6px 16px rgba(99,102,241,.35); transition: transform .25s, box-shadow .25s, background .3s; }
.wl-add:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 22px rgba(99,102,241,.5); }
.wl-add.done { background: linear-gradient(135deg, #10b981, #34d399); box-shadow: 0 6px 16px rgba(16,185,129,.4); }
.wl-add:disabled { background: #cbd5e1; box-shadow: none; cursor: not-allowed; }
.wl-remove { width: 46px; border: none; border-radius: 12px; background: #fee2e2; font-size: 1rem; cursor: pointer; transition: background .2s, transform .2s; }
.wl-remove:hover { background: #fecaca; transform: scale(1.08) rotate(-6deg); }
.wl-confirm { display: flex; gap: .3rem; animation: wlPopIn .25s cubic-bezier(.2,.8,.2,1); }
@keyframes wlPopIn { from { opacity: 0; transform: scale(.8); } to { opacity: 1; transform: none; } }
.wl-confirm button { width: 40px; border: none; border-radius: 12px; font-weight: 800; cursor: pointer; transition: transform .2s; }
.wl-confirm button:hover { transform: scale(1.1); }
.wl-confirm .yes { background: #dc2626; color: #fff; }
.wl-confirm .no { background: #f1f5f9; color: #475569; }

/* Skeleton */
.wl-skel { background: #fff; border: 1px solid #e2e8f0; border-radius: 22px; padding: 1rem; }
.sk { background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%); background-size: 400% 100%; animation: wlSk 1.4s ease infinite; border-radius: 10px; }
.sk-img { height: 190px; margin-bottom: 1rem; }
.sk-line { height: 14px; margin-bottom: .7rem; }
.sk-line.short { width: 55%; }
@keyframes wlSk { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }

/* Empty */
.wl-empty { max-width: 560px; margin: 2rem auto; padding: 4rem 1.5rem; text-align: center; background: #fff; border: 2px dashed #cbd5e1; border-radius: 28px; animation: wlUp .6s both; }
.wl-empty-icon { font-size: 5rem; display: inline-block; animation: wlBob 3s ease-in-out infinite; filter: drop-shadow(0 14px 14px rgba(236,72,153,.3)); }
@keyframes wlBob { 0%,100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-14px) rotate(4deg); } }
.wl-empty h3 { margin: .8rem 0 .4rem; font-size: 1.6rem; font-weight: 800; }
.wl-empty p { margin: 0 0 1.8rem; color: #64748b; }

/* Modal */
.wl-overlay { position: fixed; inset: 0; z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 1rem; background: rgba(15,23,42,.6); backdrop-filter: blur(5px); animation: wlFade .25s ease; }
@keyframes wlFade { from { opacity: 0; } to { opacity: 1; } }
.wl-modal { width: 100%; max-width: 420px; padding: 2rem; text-align: center; background: #fff; border-radius: 24px; box-shadow: 0 30px 60px rgba(0,0,0,.35); animation: wlModal .35s cubic-bezier(.2,.8,.2,1); }
@keyframes wlModal { from { opacity: 0; transform: translateY(24px) scale(.92); } to { opacity: 1; transform: none; } }
.wl-modal-icon { font-size: 3rem; margin-bottom: .4rem; }
.wl-modal h3 { margin: 0 0 .5rem; font-size: 1.35rem; font-weight: 800; }
.wl-modal p { margin: 0 0 1.5rem; color: #64748b; line-height: 1.6; }
.wl-modal-actions { display: flex; gap: .7rem; justify-content: center; }

/* Toast */
.wl-toast { position: fixed; bottom: 1.6rem; left: 50%; transform: translateX(-50%); z-index: 3000; padding: .9rem 1.6rem; border-radius: 999px; color: #fff; font-weight: 700; font-size: .92rem; box-shadow: 0 16px 35px rgba(0,0,0,.3); animation: wlToast .4s cubic-bezier(.2,.8,.2,1); max-width: calc(100vw - 2rem); }
.wl-toast.success { background: linear-gradient(135deg, #059669, #10b981); }
.wl-toast.error { background: linear-gradient(135deg, #dc2626, #ef4444); }
@keyframes wlToast { from { opacity: 0; transform: translateX(-50%) translateY(30px); } to { opacity: 1; transform: translateX(-50%); } }

@media (max-width: 560px) {
  .wl-main { padding: 1.8rem 1rem 3rem; }
  .wl-actions .wl-btn { flex: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .wl *, .wl *::before { animation: none !important; transition: none !important; }
  .wl-card { opacity: 1; }
}
`;

export default Wishlist;
