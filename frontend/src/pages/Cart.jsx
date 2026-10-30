import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const FREE_SHIPPING_THRESHOLD = 5000;
const SHIPPING_FEE = 150;

function Cart({ cart, removeFromCart, updateQuantity }) {
  const navigate = useNavigate();
  const { t } = useTranslation(); // ✅ Initialize translation
  
  const [updating, setUpdating] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const items = cart || [];
  const getId = (item) => item._id || item.id;
  
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
  const remainingForFree = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  const handleQuantityChange = async (id, newQty, stock) => {
    if (newQty < 1) return;
    if (stock && newQty > stock) newQty = stock;
    setUpdating(id);
    try {
      await updateQuantity(id, newQty);
    } finally {
      setUpdating(null);
    }
  };

  const handleRemove = async (id) => {
    setConfirmId(null);
    setRemovingId(id);
    setTimeout(async () => {
      try {
        await removeFromCart(id);
      } finally {
        setRemovingId(null);
      }
    }, 350);
  };

  if (items.length === 0) {
    return (
      <div className="ct">
        <style>{css}</style>
        <div className="ct-empty">
          <div className="ct-empty-icon">🛒</div>
          <h2>{t("cart.empty_title") || "Your cart is empty"}</h2>
          <p>{t("cart.empty_desc") || "Looks like you haven't added anything yet. Let's find something you'll love!"}</p>
          <Link to="/products" className="ct-btn ct-btn-primary">
            🛍️ {t("cart.continue_shopping")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ct">
      <style>{css}</style>

      <header className="ct-hero">
        <div className="ct-blob b1" />
        <div className="ct-blob b2" />
        <div className="ct-hero-inner">
          <h1>
            🛒 {t("cart.title")} <span className="ct-gradient">Cart</span>
          </h1>
          <p>
            {items.length} {items.length === 1 ? (t("cart.product") || "product") : (t("cart.products") || "products")} • {totalUnits}{" "}
            {totalUnits === 1 ? (t("cart.item") || "item") : (t("cart.items") || "items")} {t("cart.in_total") || "in total"}
          </p>
        </div>
      </header>

      <div className="ct-container">
        <section className="ct-card ct-items">
          <div className="ct-card-head">
            <h2>📦 {t("cart.items")}</h2>
          </div>

          <div className="ct-list">
            {items.map((item, index) => {
              const id = getId(item);
              const busy = updating === id;
              const atMax = item.stock ? item.quantity >= item.stock : false;

              return (
                <article
                  key={id}
                  className={`ct-item ${removingId === id ? "leaving" : ""}`}
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <div className="ct-img">
                    <img
                      src={item.image || "https://placehold.co/120x120/e2e8f0/64748b?text=No+Image"}
                      alt={item.name}
                    />
                  </div>

                  <div className="ct-info">
                    <div className="ct-info-top">
                      <div>
                        <h3>{item.name}</h3>
                        {item.category && <span className="ct-tag">{item.category}</span>}
                        <div className="ct-unit">{Number(item.price).toLocaleString()} ETB {t("cart.each") || "each"}</div>
                      </div>

                      <div className="ct-line-total">
                        {(item.price * item.quantity).toLocaleString()} <small>ETB</small>
                      </div>
                    </div>

                    <div className="ct-info-bottom">
                      <div className="ct-qty">
                        <button
                          onClick={() => handleQuantityChange(id, item.quantity - 1, item.stock)}
                          disabled={busy || item.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          min="1"
                          max={item.stock || 99}
                          disabled={busy}
                          onChange={(e) =>
                            handleQuantityChange(id, parseInt(e.target.value) || 1, item.stock)
                          }
                          aria-label="Quantity"
                        />
                        <button
                          onClick={() => handleQuantityChange(id, item.quantity + 1, item.stock)}
                          disabled={busy || atMax}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                        {busy && <span className="ct-spinner" />}
                      </div>

                      {confirmId === id ? (
                        <div className="ct-confirm">
                          <span>{t("cart.remove_confirm") || "Remove?"}</span>
                          <button className="yes" onClick={() => handleRemove(id)}>{t("cart.yes") || "Yes"}</button>
                          <button className="no" onClick={() => setConfirmId(null)}>{t("cart.no") || "No"}</button>
                        </div>
                      ) : (
                        <button className="ct-remove" onClick={() => setConfirmId(id)}>
                          🗑️ {t("cart.remove")}
                        </button>
                      )}
                    </div>

                    {atMax && <div className="ct-stock">{t("cart.max_stock") || "Max available stock reached"}</div>}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="ct-card-foot">
            <Link to="/products" className="ct-back">← {t("cart.continue_shopping")}</Link>
          </div>
        </section>

        <aside className="ct-side">
          <div className="ct-card ct-summary">
            <h2>📋 {t("cart.order_summary")}</h2>

            <div className={`ct-ship ${shipping === 0 ? "done" : ""}`}>
              {shipping === 0 ? (
                <div className="ct-ship-text">🎉 {t("cart.free_shipping_unlocked") || "You've unlocked"} <strong>{t("cart.free_shipping") || "FREE shipping!"}</strong></div>
              ) : (
                <div className="ct-ship-text">
                  🚚 {t("cart.add") || "Add"} <strong>{remainingForFree.toLocaleString()} ETB</strong> {t("cart.more_for_free") || "more for FREE shipping"}
                </div>
              )}
              <div className="ct-bar">
                <div className="ct-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="ct-row">
              <span>{t("cart.subtotal")} ({items.length} {items.length === 1 ? (t("cart.product") || "product") : (t("cart.products") || "products")})</span>
              <strong>{subtotal.toLocaleString()} ETB</strong>
            </div>
            <div className="ct-row">
              <span>{t("cart.shipping")}</span>
              <strong className={shipping === 0 ? "free" : ""}>
                {shipping === 0 ? (t("cart.free") || "FREE ✓") : `${shipping.toLocaleString()} ETB`}
              </strong>
            </div>

            <div className="ct-total">
              <span>{t("cart.total")}</span>
              <span className="ct-total-amount" key={total}>
                {total.toLocaleString()} <small>ETB</small>
              </span>
            </div>

            <button className="ct-btn ct-btn-primary block" onClick={() => navigate("/checkout")}>
              💳 {t("cart.proceed_to_checkout")} <span className="ct-arrow">→</span>
            </button>

            <div className="ct-secure">🔒 {t("cart.secure_checkout") || "Secure checkout. SSL encrypted."}</div>
          </div>

          <div className="ct-card ct-trust">
            <div className="ct-trust-item">
              <div className="ct-trust-icon">🚚</div>
              <div>
                <strong>{t("cart.free_shipping") || "Free Shipping"}</strong>
                <span>{t("cart.on_orders_over") || "On orders over"} {FREE_SHIPPING_THRESHOLD.toLocaleString()} ETB</span>
              </div>
            </div>
            <div className="ct-trust-item">
              <div className="ct-trust-icon">💳</div>
              <div>
                <strong>{t("cart.secure_payment") || "Secure Payment"}</strong>
                <span>{t("cart.powered_by_chapa") || "Powered by Chapa"}</span>
              </div>
            </div>
            <div className="ct-trust-item">
              <div className="ct-trust-icon">↩️</div>
              <div>
                <strong>{t("cart.easy_returns") || "Easy Returns"}</strong>
                <span>{t("cart.return_policy") || "7-day return policy"}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

const css = `
.ct { font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif; background: #f8fafc; min-height: 100vh; color: #0f172a; }
.ct * { box-sizing: border-box; }
@keyframes ctUp { from { opacity: 0; transform: translateY(26px); } to { opacity: 1; transform: none; } }
.ct-hero { position: relative; overflow: hidden; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%); color: #fff; padding: 2.8rem 1.5rem 4.2rem; text-align: center; border-radius: 0 0 36px 36px; }
.ct-blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: .5; animation: ctBlob 12s ease-in-out infinite alternate; }
.ct-blob.b1 { width: 280px; height: 280px; background: #6366f1; top: -120px; left: -60px; }
.ct-blob.b2 { width: 240px; height: 240px; background: #ec4899; bottom: -130px; right: 8%; animation-delay: -5s; }
@keyframes ctBlob { to { transform: translate(40px, -25px) scale(1.15); } }
.ct-hero-inner { position: relative; z-index: 2; animation: ctUp .8s cubic-bezier(.2,.8,.2,1) both; }
.ct-hero h1 { margin: 0 0 .4rem; font-size: clamp(1.9rem, 5vw, 2.8rem); font-weight: 800; letter-spacing: -.02em; }
.ct-gradient { background: linear-gradient(90deg, #a5b4fc, #f0abfc, #67e8f9); background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent; animation: ctShine 5s linear infinite; }
@keyframes ctShine { to { background-position: 200% center; } }
.ct-hero p { margin: 0; opacity: .85; }
.ct-container { max-width: 1250px; margin: -2rem auto 0; padding: 0 1.5rem 4rem; display: grid; grid-template-columns: 1fr 390px; gap: 1.5rem; align-items: start; position: relative; z-index: 3; }
.ct-card { background: #fff; border-radius: 22px; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(15,23,42,.07); animation: ctUp .7s cubic-bezier(.2,.8,.2,1) both; }
.ct-items { overflow: hidden; }
.ct-card-head { padding: 1.2rem 1.6rem; border-bottom: 1px solid #eef2f7; background: #f8fafc; }
.ct-card-head h2 { margin: 0; font-size: 1.2rem; }
.ct-card-foot { padding: 1.1rem 1.6rem; border-top: 1px solid #eef2f7; background: #f8fafc; }
.ct-back { color: #6366f1; font-weight: 700; text-decoration: none; display: inline-block; transition: transform .25s; }
.ct-back:hover { transform: translateX(-5px); }
.ct-list { padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
.ct-item { display: flex; gap: 1.2rem; padding: 1.1rem; border: 1px solid #e2e8f0; border-radius: 18px; background: #fff; opacity: 0; animation: ctUp .6s cubic-bezier(.2,.8,.2,1) forwards; transition: box-shadow .3s ease, border-color .3s ease, transform .3s ease; }
.ct-item:hover { box-shadow: 0 12px 28px rgba(99,102,241,.14); border-color: #c7d2fe; transform: translateY(-2px); }
.ct-item.leaving { animation: ctLeave .35s ease forwards; }
@keyframes ctLeave { to { opacity: 0; transform: translateX(60px) scale(.96); } }
.ct-img { width: 120px; height: 120px; border-radius: 14px; overflow: hidden; background: #f1f5f9; flex-shrink: 0; }
.ct-img img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s ease; }
.ct-item:hover .ct-img img { transform: scale(1.08); }
.ct-info { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: space-between; gap: .8rem; }
.ct-info-top { display: flex; justify-content: space-between; gap: 1rem; }
.ct-info h3 { margin: 0 0 .4rem; font-size: 1.1rem; font-weight: 700; }
.ct-tag { display: inline-block; padding: .2rem .7rem; background: #eef2ff; color: #4f46e5; border-radius: 999px; font-size: .75rem; font-weight: 600; }
.ct-unit { margin-top: .4rem; font-size: .82rem; color: #64748b; }
.ct-line-total { font-size: 1.35rem; font-weight: 800; color: #059669; white-space: nowrap; }
.ct-line-total small { font-size: .75rem; font-weight: 600; }
.ct-info-bottom { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; }
.ct-stock { font-size: .78rem; color: #b45309; background: #fef3c7; padding: .25rem .7rem; border-radius: 8px; align-self: flex-start; }
.ct-qty { display: inline-flex; align-items: center; gap: .4rem; background: #f1f5f9; padding: .3rem; border-radius: 14px; }
.ct-qty button { width: 34px; height: 34px; border: none; border-radius: 10px; background: #fff; color: #334155; font-size: 1.2rem; font-weight: 700; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,.1); transition: all .2s ease; }
.ct-qty button:hover:not(:disabled) { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; transform: scale(1.1); }
.ct-qty button:disabled { opacity: .4; cursor: not-allowed; }
.ct-qty input { width: 52px; height: 34px; text-align: center; border: none; background: transparent; font-size: 1rem; font-weight: 700; color: #0f172a; outline: none; -moz-appearance: textfield; }
.ct-qty input::-webkit-outer-spin-button, .ct-qty input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.ct-spinner { width: 16px; height: 16px; margin: 0 .4rem; border: 2px solid #c7d2fe; border-top-color: #6366f1; border-radius: 50%; animation: ctSpin .7s linear infinite; }
@keyframes ctSpin { to { transform: rotate(360deg); } }
.ct-remove { padding: .5rem 1rem; border: none; border-radius: 10px; background: #fee2e2; color: #dc2626; font-weight: 700; font-size: .85rem; cursor: pointer; transition: all .2s ease; }
.ct-remove:hover { background: #fecaca; transform: translateY(-2px); }
.ct-confirm { display: inline-flex; align-items: center; gap: .5rem; padding: .35rem .5rem .35rem .9rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; font-size: .85rem; font-weight: 600; color: #991b1b; animation: ctPop .25s cubic-bezier(.2,.8,.2,1); }
@keyframes ctPop { from { opacity: 0; transform: scale(.85); } to { opacity: 1; transform: none; } }
.ct-confirm button { border: none; padding: .35rem .8rem; border-radius: 8px; font-weight: 700; font-size: .8rem; cursor: pointer; transition: transform .2s; }
.ct-confirm button:hover { transform: scale(1.08); }
.ct-confirm .yes { background: #dc2626; color: #fff; }
.ct-confirm .no { background: #fff; color: #475569; border: 1px solid #e2e8f0; }
.ct-side { position: sticky; top: 84px; display: flex; flex-direction: column; gap: 1.2rem; }
.ct-summary { padding: 1.8rem; animation-delay: .15s; }
.ct-summary h2 { margin: 0 0 1.2rem; font-size: 1.35rem; font-weight: 800; }
.ct-ship { padding: 1rem; background: #fffbeb; border: 1px solid #fde68a; border-radius: 14px; margin-bottom: 1.3rem; transition: background .4s, border-color .4s; }
.ct-ship.done { background: #ecfdf5; border-color: #a7f3d0; }
.ct-ship-text { font-size: .88rem; color: #92400e; margin-bottom: .7rem; }
.ct-ship.done .ct-ship-text { color: #065f46; }
.ct-bar { height: 8px; background: rgba(0,0,0,.08); border-radius: 999px; overflow: hidden; }
.ct-bar-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #f59e0b, #f97316); transition: width .7s cubic-bezier(.2,.8,.2,1); }
.ct-ship.done .ct-bar-fill { background: linear-gradient(90deg, #10b981, #34d399); }
.ct-row { display: flex; justify-content: space-between; margin-bottom: .9rem; color: #64748b; font-size: .95rem; }
.ct-row strong { color: #0f172a; }
.ct-row strong.free { color: #059669; }
.ct-total { display: flex; justify-content: space-between; align-items: center; margin: 1.2rem 0 1.5rem; padding-top: 1.3rem; border-top: 2px dashed #e2e8f0; font-size: 1.15rem; font-weight: 800; }
.ct-total-amount { font-size: 1.9rem; color: #059669; animation: ctBump .45s cubic-bezier(.2,.8,.2,1); }
.ct-total-amount small { font-size: .85rem; }
@keyframes ctBump { 0% { transform: scale(1); } 40% { transform: scale(1.12); } 100% { transform: scale(1); } }
.ct-secure { margin-top: 1rem; text-align: center; font-size: .82rem; color: #64748b; }
.ct-btn { display: inline-flex; align-items: center; justify-content: center; gap: .5rem; padding: 1rem 2.2rem; border: none; border-radius: 999px; font-weight: 700; font-size: 1.02rem; text-decoration: none; cursor: pointer; transition: transform .25s ease, box-shadow .25s ease; }
.ct-btn:hover { transform: translateY(-3px); }
.ct-btn.block { width: 100%; }
.ct-btn-primary { color: #fff; background: linear-gradient(135deg, #6366f1, #8b5cf6); box-shadow: 0 10px 25px rgba(99,102,241,.4); }
.ct-btn-primary:hover { box-shadow: 0 14px 30px rgba(99,102,241,.55); }
.ct-btn-primary:hover .ct-arrow { transform: translateX(5px); }
.ct-arrow { transition: transform .25s ease; }
.ct-trust { padding: 1.3rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; animation-delay: .3s; }
.ct-trust-item { display: flex; align-items: center; gap: 1rem; }
.ct-trust-icon { width: 46px; height: 46px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; background: #eef2ff; border-radius: 14px; flex-shrink: 0; transition: transform .35s cubic-bezier(.2,.8,.2,1); }
.ct-trust-item:hover .ct-trust-icon { transform: scale(1.15) rotate(-8deg); }
.ct-trust-item strong { display: block; font-size: .95rem; }
.ct-trust-item span { font-size: .82rem; color: #64748b; }
.ct-empty { max-width: 560px; margin: 0 auto; padding: 5rem 1.5rem; min-height: 70vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; animation: ctUp .7s both; }
.ct-empty-icon { font-size: 5.5rem; margin-bottom: 1rem; animation: ctBob 3s ease-in-out infinite; filter: drop-shadow(0 14px 14px rgba(99,102,241,.3)); }
@keyframes ctBob { 0%,100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-14px) rotate(4deg); } }
.ct-empty h2 { margin: 0 0 .6rem; font-size: 2rem; font-weight: 800; }
.ct-empty p { margin: 0 0 2rem; color: #64748b; font-size: 1.05rem; }
@media (max-width: 960px) {
  .ct-container { grid-template-columns: 1fr; margin-top: -1.6rem; }
  .ct-side { position: static; }
}
@media (max-width: 560px) {
  .ct-container { padding: 0 1rem 3rem; }
  .ct-item { flex-direction: column; }
  .ct-img { width: 100%; height: 190px; }
  .ct-info-bottom { flex-direction: column; align-items: stretch; }
  .ct-qty { justify-content: center; }
  .ct-remove, .ct-confirm { align-self: stretch; justify-content: center; text-align: center; }
}
@media (prefers-reduced-motion: reduce) {
  .ct *, .ct *::before { animation: none !important; transition: none !important; }
  .ct-item { opacity: 1; }
}
`;

export default Cart;