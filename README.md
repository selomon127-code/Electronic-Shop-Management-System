# Electronic Shop Management System

## 🚀 Overview
A full-stack system for managing an electronic shop including products, orders, and users.

---

## 🖼️ Preview

### Dashboard / UI Preview
![App Preview](frontend/src/assets/sss.png)

### Product Preview
![Product Preview](frontend/src/assets/ppp.png)

---

## 🛠 Tech Stack
- Frontend: React  
- Backend: Node.js / Express  
- Database: MongoDB  

---

## 📦 Installation

Install and start the backend from the `backend` directory:

```bash
npm install
npm run dev
```

In another terminal, start the frontend from the `frontend` directory:

```bash
npm install
npm run dev
```

## Google sign-in verification

Google sign-in and Google sign-up require a reCAPTCHA v2 checkbox before redirecting to Google. Create a reCAPTCHA v2 site key for the frontend domains and configure:

- `VITE_RECAPTCHA_SITE_KEY` in the frontend environment
- `RECAPTCHA_SECRET_KEY` in the backend environment

The backend verifies each reCAPTCHA response with Google and blocks the OAuth redirect unless verification succeeds. Restart/rebuild the frontend after setting its site key. Google sign-in remains unavailable until both keys are configured.

## Frontend tests

From the `frontend` directory, run the unit tests with `npm test`. Install the Chromium browser once with `npx playwright install chromium`, then run the Playwright tests with `npm run test:e2e`. Playwright starts the Vite development server automatically.

## Product discounts

Business owners can set a whole-number discount from 0% to 100% when adding or editing a product. The public product views, cart, and checkout show/use the discounted price. The order API calculates the discount from the product stored in the database, rather than trusting prices sent by the browser.

## Product reviews with photos

Signed-in customers can submit a 1–5-star rating, a comment of up to 2,000 characters, and up to five JPG, PNG, WEBP, or AVIF photos per review. Each photo can be up to 5 MB and is stored in Cloudinary; configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in the backend environment. Product reviews can be sorted by newest, highest-rated, or lowest-rated and filtered by star rating.

## Promo codes and coupons

Business owners can create and schedule percentage or fixed-amount coupons from **Business management → Coupons**, with minimum subtotal, optional maximum discount, overall usage, and per-customer limits. Customers apply codes during checkout. The backend recalculates product prices, coupon eligibility, shipping, and payable total from database values, and stores the coupon discount on the order; cancelling an eligible order releases its coupon usage.

## Admin revenue analytics

The business-owner dashboard includes paid-revenue trends for the last 7 days, 30 days, or 12 months, plus revenue and order counts by payment method. The chart data is aggregated from paid orders on the server and displayed in ETB; pending and cancelled payments are excluded. Since orders do not currently record a payment timestamp, paid revenue is grouped by order creation date.

## Role-based access

Accounts have exactly one of three roles: `customer` (the default), `business_owner`, or `system_admin`. Business owners can access business metrics, orders, products/pricing, and coupons. System admins can access user-account management and the protected system-health view. Backend role checks reload the account role from MongoDB, so a stale JWT role claim cannot grant access. System settings, logs, and database-maintenance endpoints should be added only behind `restrictTo("system_admin")`.

Before deploying the new role enum, back up the database and run the idempotent legacy-role migration from the `backend` directory:

```bash
npm run migrate:user-roles
```

It maps legacy `admin` accounts to `business_owner` (as selected for this migration) and legacy `user` accounts to `customer`. Set a strong `JWT_SECRET` in the backend environment before starting the server.

## Reports and analytics

Business owners can view daily, weekly, monthly, and annual sales summaries and filter reports by date. The report page includes gross profit, inventory valuation, stock movements, best/slow-moving products, customer purchases, payment status, and recorded supplier purchases. Excel-compatible CSV and PDF exports are available. Record supplier purchases from the report page to update stock and maintain purchase-cost data. Historical orders without item cost snapshots are excluded from a complete gross-profit calculation, and operating expenses are not tracked.

The Inventory section on the Reports page includes a bulk unit-cost updater. It submits `PUT /api/admin/products/bulk-cost` with an array of `{ id, costPrice }` updates. Only `costPrice` is changed; values must be finite non-negative numbers and all product IDs must exist. This endpoint uses the existing business-owner product-management authorization (legacy `admin` roles should be migrated to `business_owner`; `system_admin` is intentionally not authorized for business inventory edits).

The dashboard also provides business-owner-only AI analytics endpoints: `GET /api/admin/ai-analytics/sales-forecast?interval=day` (the interval accepts `day`, `week`, or `month`), `GET /api/admin/ai-analytics/stock-predictions`, and `GET /api/admin/ai-analytics/customer-insights`. Forecast history can be grouped daily, weekly, or monthly; projections use a 90-day daily revenue trend and fall back to the historical daily average when sales history is sparse. Revenue and inventory velocity include only non-cancelled, non-refunded orders that are paid or delivered. Stock recommendations target two months of recent demand; customer segments use lifetime spend, purchase frequency, and a 90-day inactivity threshold. Customer action suggestions are advisory and do not send messages.

## Customer AI suite

The customer catalog includes natural-language product search (`POST /api/ai/search`), a floating product-aware shopping assistant (`POST /api/ai/chat`), and related-item recommendations (`GET /api/ai/recommendations`). Search uses catalog-backed category, price, brand, and tag filters with keyword fallback. Add brand and comma-separated search tags when creating or editing products to improve search relevance. Recommendations use recently viewed product IDs from the browser, the current cart/product, and—when signed in—paid order history; frequently-bought-together suggestions are based on paid orders. Configure `GROQ_API_KEY` and, optionally, `GROQ_MODEL` for generated chat replies. The default model is `openai/gpt-oss-20b`, with `openai/gpt-oss-120b` and `qwen/qwen3.6-27b` as fallbacks. Keep the model ID current with [Groq's supported models](https://console.groq.com/docs/models); product matching and recommendations continue to work without the AI provider.

## Visual review with Chromatic

The Storybook component previews can be reviewed locally with `npm run storybook` from the `frontend` directory. To publish visual snapshots, create a Chromatic project, set its project token in your shell as `CHROMATIC_PROJECT_TOKEN`, and run `npm run chromatic`. Do not commit the project token. For PowerShell, set it for the current terminal with `$env:CHROMATIC_PROJECT_TOKEN = "your-token"`.

## Backend load test

Install k6 using the instructions at [grafana.com/docs/k6](https://grafana.com/docs/k6/latest/set-up/install-k6/). Start the backend, then run `npm run test:load` from the `backend` directory. The test only targets localhost, exercises the read-only health and product-list endpoints, and ramps up to five virtual users. It checks for an available database and a non-empty product catalog.
