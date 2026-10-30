import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import API from "../api/axios";
import ProductCard from "../components/ProductCard";

function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { threshold: 0.15 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${visible ? "reveal-in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

function Counter({ end, suffix = "" }) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const duration = 1600;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setValue(Math.floor(eased * end));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    observer.observe(el);
    return () => { observer.disconnect(); cancelAnimationFrame(raf); };
  }, [end]);
  return <span ref={ref}>{value.toLocaleString()}{suffix}</span>;
}

// ✅ Added 'key' property for safe translation lookup
const CATEGORIES = [
  { icon: "📱", name: "Smartphones", key: "smartphones" },
  { icon: "💻", name: "Laptops", key: "laptops" },
  { icon: "🎧", name: "Audio", key: "audio" },
  { icon: "📺", name: "TVs & Displays", key: "tvs_displays" },
  { icon: "⌚", name: "Wearables", key: "wearables" },
  { icon: "🎮", name: "Gaming", key: "gaming" },
];

const FEATURES = [
  { icon: "🚚", title: "Fast Delivery", text: "Quick shipping across Ethiopia" },
  { icon: "🛡️", title: "Genuine Warranty", text: "100% authentic products" },
  { icon: "💳", title: "Secure Payment", text: "Safe and flexible checkout" },
  { icon: "🎧", title: "24/7 Support", text: "We're always here to help" },
];

const BRANDS = ["Samsung", "Apple", "HP", "Lenovo", "Sony", "JBL", "Xiaomi", "Dell", "Huawei", "Anker"];

function Home({ addToCart }) {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await API.get("/products");
        setProducts(data.slice(0, 8));
      } catch (err) { console.error("❌ Failed to fetch home products:", err); } 
      finally { setLoading(false); }
    };
    fetchProducts();
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail("");
  };

  return (
    <div className="home">
      <style>{css}</style>
      <section className="hero">
        <div className="hero-blob blob-1" /><div className="hero-blob blob-2" /><div className="hero-blob blob-3" />
        <div className="hero-inner">
          <div className="hero-text">
            <span className="hero-badge">⚡ {t("home.new_arrivals") || "New Arrivals Every Week"}</span>
            <h1>{t("home.hero_title") || "Upgrade Your"} <span className="gradient-text">{t("home.tech_life") || "Tech Life"}</span><br />{t("home.with_eshop") || "with E-Shop Ethiopia"}</h1>
            <p>{t("home.hero_subtitle") || "Premium smartphones, laptops, audio and smart devices — authentic products at prices you'll love."}</p>
            <div className="hero-actions">
              <Link to="/products" className="btn btn-primary">{t("home.shop_now")} <span className="arrow">→</span></Link>
              <a href="#featured" className="btn btn-ghost">{t("home.featured_deals") || "Featured Deals"}</a>
            </div>
            <div className="hero-stats">
              <div><strong><Counter end={5000} suffix="+" /></strong><span>{t("home.happy_customers") || "Happy Customers"}</span></div>
              <div><strong><Counter end={1200} suffix="+" /></strong><span>{t("home.products") || "Products"}</span></div>
              <div><strong><Counter end={50} suffix="+" /></strong><span>{t("home.top_brands") || "Top Brands"}</span></div>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="orbit">
              <div className="center-card">💻</div>
              <span className="float-icon fi-1">📱</span><span className="float-icon fi-2">🎧</span>
              <span className="float-icon fi-3">⌚</span><span className="float-icon fi-4">🎮</span><span className="float-icon fi-5">📷</span>
            </div>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="features">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 100}>
              <div className="feature">
                <div className="feature-icon">{f.icon}</div>
                <div><h4>{t(`features.${f.title.replace(/\s+/g, '_').toLowerCase()}`) || f.title}</h4><p>{f.text}</p></div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container section">
        <Reveal><div className="section-head"><h2>{t("home.shop_by_category") || "Shop by Category"}</h2><p>{t("home.find_what_you_need") || "Find exactly what you're looking for"}</p></div></Reveal>
        <div className="categories">
          {CATEGORIES.map((c, i) => (
            <Reveal key={c.name} delay={i * 80}>
              <Link to="/products" className="category" style={{ "--accent": c.color }}>
                <div className="category-icon">{c.icon}</div>
                {/* ✅ Uses the safe 'key' property instead of regex replacement */}
                <span>{t(`categories.${c.key}`) || c.name}</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container section" id="featured">
        <Reveal>
          <div className="section-head row">
            <div><h2>{t("home.featured_products")}</h2><p>{t("home.hand_picked") || "Hand-picked favorites from our store"}</p></div>
            <Link to="/products" className="view-all">{t("home.view_all")} →</Link>
          </div>
        </Reveal>
        {loading ? (
          <div className="grid">{Array.from({ length: 8 }).map((_, i) => (<div key={i} className="skeleton"><div className="sk-img" /><div className="sk-line" /><div className="sk-line short" /></div>))}</div>
        ) : products.length > 0 ? (
          <div className="grid">
            {products.map((product, i) => (
              <Reveal key={product._id} delay={(i % 4) * 90}>
                <div className="product-wrap"><ProductCard product={product} addToCart={addToCart} /></div>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="empty">
            <div className="empty-icon">📦</div>
            <h3>{t("home.no_products") || "No products available yet"}</h3>
            <p>{t("home.add_from_admin") || "Please add products from the Admin Panel."}</p>
            <Link to="/admin/add-product">{t("home.go_to_admin")} →</Link>
          </div>
        )}
      </section>

      <section className="container section">
        <Reveal>
          <div className="promo">
            <div className="promo-glow" />
            <div className="promo-text">
              <span className="hero-badge">🔥 {t("home.limited_offer") || "Limited Offer"}</span>
              <h2>{t("home.big_savings") || "Big Savings on Smart Devices"}</h2>
              <p>{t("home.grab_before_disappear") || "Grab the latest gadgets before the deals disappear."}</p>
              <Link to="/products" className="btn btn-light">{t("home.grab_deal") || "Grab the Deal"} →</Link>
            </div>
            <div className="promo-emoji">🎧</div>
          </div>
        </Reveal>
      </section>

      <section className="section">
        <Reveal><div className="section-head center"><h2>{t("home.trusted_brands") || "Trusted Brands"}</h2></div></Reveal>
        <div className="marquee">
          <div className="marquee-track">{[...BRANDS, ...BRANDS].map((b, i) => (<span key={i} className="brand">{b}</span>))}</div>
        </div>
      </section>

      <section className="container section">
        <Reveal>
          <div className="newsletter">
            <h2>{t("home.get_exclusive_deals") || "Get Exclusive Deals"} 📬</h2>
            <p>{t("home.subscribe_first_to_know") || "Subscribe and be the first to know about new arrivals and offers."}</p>
            {subscribed ? (
              <div className="thanks">✅ {t("home.thanks_subscribing") || "Thanks for subscribing!"}</div>
            ) : (
              <form onSubmit={handleSubscribe}>
                <input type="email" placeholder={t("home.enter_email") || "Enter your email"} value={email} onChange={(e) => setEmail(e.target.value)} required />
                <button type="submit" className="btn btn-primary">{t("home.subscribe") || "Subscribe"}</button>
              </form>
            )}
          </div>
        </Reveal>
      </section>
    </div>
  );
}

const css = `
.home { font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif; color: #0f172a; overflow-x: hidden; }
.home * { box-sizing: border-box; }
.container { max-width: 1400px; margin: 0 auto; padding: 0 1.5rem; }
.section { margin-top: 4.5rem; }
.reveal { opacity: 0; transform: translateY(32px); transition: opacity .7s ease, transform .7s cubic-bezier(.2,.8,.2,1); }
.reveal-in { opacity: 1; transform: none; }
.btn { display: inline-flex; align-items: center; gap: .5rem; padding: .9rem 1.8rem; border-radius: 999px; font-weight: 700; font-size: 1rem; text-decoration: none; border: none; cursor: pointer; transition: transform .25s ease, box-shadow .25s ease, background .25s ease; }
.btn:hover { transform: translateY(-3px); }
.btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; box-shadow: 0 10px 25px rgba(99,102,241,.4); }
.btn-primary:hover { box-shadow: 0 14px 30px rgba(99,102,241,.55); }
.btn-primary:hover .arrow { transform: translateX(5px); }
.arrow { transition: transform .25s ease; }
.btn-ghost { background: rgba(255,255,255,.08); color: #fff; border: 1px solid rgba(255,255,255,.25); backdrop-filter: blur(6px); }
.btn-ghost:hover { background: rgba(255,255,255,.18); }
.btn-light { background: #fff; color: #4338ca; }
.hero { position: relative; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%); color: #fff; padding: 5rem 1.5rem 6rem; overflow: hidden; border-radius: 0 0 40px 40px; }
.hero-blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: .5; animation: blobMove 14s ease-in-out infinite alternate; }
.blob-1 { width: 380px; height: 380px; background: #6366f1; top: -100px; left: -80px; }
.blob-2 { width: 320px; height: 320px; background: #ec4899; bottom: -120px; right: 10%; animation-delay: -4s; }
.blob-3 { width: 260px; height: 260px; background: #0ea5e9; top: 30%; right: -80px; animation-delay: -8s; }
@keyframes blobMove { from { transform: translate(0,0) scale(1); } to { transform: translate(40px,-30px) scale(1.15); } }
.hero-inner { position: relative; z-index: 2; max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: 1.1fr .9fr; gap: 3rem; align-items: center; }
.hero-text > * { animation: slideUp .9s cubic-bezier(.2,.8,.2,1) both; }
.hero-text > *:nth-child(1) { animation-delay: .1s; }
.hero-text > *:nth-child(2) { animation-delay: .25s; }
.hero-text > *:nth-child(3) { animation-delay: .4s; }
.hero-text > *:nth-child(4) { animation-delay: .55s; }
.hero-text > *:nth-child(5) { animation-delay: .7s; }
@keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: none; } }
.hero-badge { display: inline-block; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2); padding: .45rem 1rem; border-radius: 999px; font-size: .85rem; font-weight: 600; margin-bottom: 1.2rem; backdrop-filter: blur(6px); }
.hero h1 { font-size: clamp(2.2rem, 5vw, 3.8rem); line-height: 1.1; font-weight: 800; margin: 0 0 1.2rem; letter-spacing: -.02em; }
.gradient-text { background: linear-gradient(90deg, #a5b4fc, #f0abfc, #67e8f9); background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent; animation: shine 5s linear infinite; }
@keyframes shine { to { background-position: 200% center; } }
.hero p { font-size: 1.15rem; opacity: .85; max-width: 520px; line-height: 1.65; margin: 0 0 2rem; }
.hero-actions { display: flex; gap: 1rem; flex-wrap: wrap; }
.hero-stats { display: flex; gap: 2.5rem; margin-top: 2.8rem; flex-wrap: wrap; }
.hero-stats strong { display: block; font-size: 1.9rem; font-weight: 800; }
.hero-stats span { font-size: .85rem; opacity: .7; }
.hero-visual { display: flex; justify-content: center; animation: slideUp 1s .4s both; }
.orbit { position: relative; width: 380px; height: 380px; max-width: 100%; border-radius: 50%; border: 1px dashed rgba(255,255,255,.25); animation: spin 28s linear infinite; }
.center-card { position: absolute; inset: 0; margin: auto; width: 150px; height: 150px; display: flex; align-items: center; justify-content: center; font-size: 4.5rem; border-radius: 32px; background: linear-gradient(135deg, rgba(255,255,255,.2), rgba(255,255,255,.05)); border: 1px solid rgba(255,255,255,.3); backdrop-filter: blur(12px); box-shadow: 0 25px 60px rgba(0,0,0,.35); animation: spinBack 28s linear infinite, bob 4s ease-in-out infinite; }
.float-icon { position: absolute; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; font-size: 2rem; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.25); border-radius: 18px; backdrop-filter: blur(8px); animation: spinBack 28s linear infinite; }
.fi-1 { top: -30px; left: 50%; margin-left: -32px; }
.fi-2 { top: 18%; right: -30px; }
.fi-3 { bottom: 12%; right: 2%; }
.fi-4 { bottom: -30px; left: 30%; }
.fi-5 { top: 30%; left: -30px; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes spinBack { to { transform: rotate(-360deg); } }
@keyframes bob { 0%,100% { translate: 0 0; } 50% { translate: 0 -12px; } }
.features { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 1rem; margin-top: -3rem; position: relative; z-index: 5; }
.feature { display: flex; align-items: center; gap: 1rem; background: #fff; padding: 1.2rem 1.4rem; border-radius: 18px; box-shadow: 0 10px 30px rgba(15,23,42,.1); transition: transform .3s ease, box-shadow .3s ease; height: 100%; }
.feature:hover { transform: translateY(-6px); box-shadow: 0 18px 40px rgba(99,102,241,.2); }
.feature-icon { font-size: 1.8rem; width: 54px; height: 54px; display: flex; align-items: center; justify-content: center; background: #eef2ff; border-radius: 14px; flex-shrink: 0; }
.feature h4 { margin: 0 0 .2rem; font-size: 1rem; }
.feature p { margin: 0; font-size: .85rem; color: #64748b; }
.section-head { margin-bottom: 1.8rem; }
.section-head.row { display: flex; justify-content: space-between; align-items: flex-end; gap: 1rem; flex-wrap: wrap; }
.section-head.center { text-align: center; }
.section-head h2 { margin: 0; font-size: 2rem; font-weight: 800; letter-spacing: -.01em; }
.section-head p { margin: .35rem 0 0; color: #64748b; }
.view-all { color: #6366f1; font-weight: 700; text-decoration: none; transition: letter-spacing .25s; }
.view-all:hover { letter-spacing: .03em; }
.categories { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; }
.category { display: flex; flex-direction: column; align-items: center; gap: .8rem; padding: 1.6rem 1rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; text-decoration: none; color: #0f172a; font-weight: 700; transition: all .3s ease; position: relative; overflow: hidden; }
.category::before { content: ""; position: absolute; inset: 0; background: var(--accent); opacity: 0; transition: opacity .3s; }
.category:hover { transform: translateY(-8px); border-color: var(--accent); box-shadow: 0 16px 35px rgba(0,0,0,.12); }
.category:hover::before { opacity: .08; }
.category-icon { font-size: 2.4rem; transition: transform .35s cubic-bezier(.2,.8,.2,1); position: relative; }
.category:hover .category-icon { transform: scale(1.25) rotate(-8deg); }
.category span { position: relative; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.5rem; }
.product-wrap { transition: transform .3s ease, filter .3s ease; }
.product-wrap:hover { transform: translateY(-8px); filter: drop-shadow(0 18px 24px rgba(99,102,241,.22)); }
.skeleton { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1rem; }
.sk-img, .sk-line { background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%); background-size: 400% 100%; animation: skeleton 1.4s ease infinite; border-radius: 10px; }
.sk-img { height: 170px; margin-bottom: 1rem; }
.sk-line { height: 14px; margin-bottom: .7rem; }
.sk-line.short { width: 55%; }
@keyframes skeleton { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }
.empty { text-align: center; padding: 3rem 1rem; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 20px; }
.empty-icon { font-size: 3rem; animation: bob 3s ease-in-out infinite; }
.empty h3 { color: #475569; margin: .5rem 0; }
.empty p { color: #94a3b8; }
.empty a { color: #6366f1; font-weight: 700; text-decoration: none; }
.promo { position: relative; overflow: hidden; display: flex; align-items: center; justify-content: space-between; gap: 2rem; padding: 3.2rem; border-radius: 28px; color: #fff; background: linear-gradient(120deg, #4f46e5, #9333ea, #db2777); background-size: 200% 200%; animation: gradientMove 8s ease infinite; }
@keyframes gradientMove { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
.promo-glow { position: absolute; width: 300px; height: 300px; border-radius: 50%; background: rgba(255,255,255,.18); filter: blur(60px); right: -60px; top: -80px; }
.promo-text { position: relative; max-width: 520px; }
.promo h2 { font-size: 2.2rem; margin: .4rem 0 .6rem; font-weight: 800; }
.promo p { opacity: .9; margin: 0 0 1.5rem; font-size: 1.05rem; }
.promo-emoji { position: relative; font-size: 8rem; animation: bob 3.5s ease-in-out infinite; filter: drop-shadow(0 20px 25px rgba(0,0,0,.3)); }
.marquee { overflow: hidden; padding: 1.2rem 0; mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent); -webkit-mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent); }
.marquee-track { display: flex; gap: 3.5rem; width: max-content; animation: marquee 28s linear infinite; }
.marquee:hover .marquee-track { animation-play-state: paused; }
.brand { font-size: 1.7rem; font-weight: 800; color: #cbd5e1; transition: color .3s, transform .3s; cursor: default; }
.brand:hover { color: #6366f1; transform: scale(1.1); }
@keyframes marquee { to { transform: translateX(-50%); } }
.newsletter { text-align: center; padding: 3.2rem 1.5rem; background: #0f172a; color: #fff; border-radius: 28px; margin-bottom: 3rem; position: relative; overflow: hidden; }
.newsletter::before { content: ""; position: absolute; width: 320px; height: 320px; border-radius: 50%; background: #6366f1; filter: blur(110px); opacity: .45; top: -140px; left: -60px; }
.newsletter > * { position: relative; }
.newsletter h2 { margin: 0 0 .5rem; font-size: 2rem; font-weight: 800; }
.newsletter p { opacity: .75; margin: 0 0 1.6rem; }
.newsletter form { display: flex; gap: .7rem; justify-content: center; flex-wrap: wrap; }
.newsletter input { padding: .9rem 1.3rem; border-radius: 999px; border: 1px solid rgba(255,255,255,.2); background: rgba(255,255,255,.08); color: #fff; min-width: 280px; font-size: 1rem; outline: none; transition: border-color .25s, box-shadow .25s; }
.newsletter input::placeholder { color: rgba(255,255,255,.5); }
.newsletter input:focus { border-color: #818cf8; box-shadow: 0 0 0 4px rgba(129,140,248,.25); }
.thanks { font-weight: 700; font-size: 1.1rem; animation: slideUp .5s both; }
@media (max-width: 900px) {
  .hero-inner { grid-template-columns: 1fr; text-align: center; }
  .hero p { margin-left: auto; margin-right: auto; }
  .hero-actions, .hero-stats { justify-content: center; }
  .hero-visual { display: none; }
  .promo { flex-direction: column; text-align: center; padding: 2.2rem 1.5rem; }
  .promo-emoji { font-size: 5rem; }
}
@media (prefers-reduced-motion: reduce) {
  .home *, .home *::before { animation: none !important; transition: none !important; }
  .reveal { opacity: 1; transform: none; }
}
`;
export default Home;