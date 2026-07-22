# The TN School Cart Bluebook
### A reference manual for taking an e-commerce marketplace from an empty folder to a live Razorpay payment gateway

This is the clean, successful path — exactly the sequence that worked, with the detours and dead ends stripped out. For what went wrong along the way and how to avoid repeating it, see the companion file: **Pitfalls & What Not To Do**.

> **A note on screenshots:** this manual references the exact screens you'll see at each step (Vercel's environment variable panel, Razorpay's activation screen, the Checkout payment modal, etc.), described precisely from what actually appeared during this build. It doesn't embed the specific screenshots shared in chat during development, since those were transient chat attachments, not saved files — screenshot callouts are marked `[SCREEN: ...]` so you can drop your own in when printing or adapting this manual.

---

## Part 1 — Prerequisites: Software & Accounts

### 1.1 Software to install (once, on your development machine)

| # | Install | Why |
|---|---|---|
| 1 | **Node.js** (LTS or current — v20+) | Runs the app, installs packages, runs build/dev scripts. Includes `npm`. |
| 2 | **Git** | Version control; required to push to GitHub, which Vercel deploys from. |
| 3 | **A code editor** (VS Code recommended) | Where you'll actually write and read the code. |
| 4 | **Vercel CLI** *(optional, install on demand)* | `npx vercel` works without a permanent install — useful for direct deploys and environment-variable management from the terminal instead of the dashboard. |

`[SCREEN: terminal output of "node --version" and "git --version" confirming both are installed]`

### 1.2 Accounts to create (before you write a line of code)

| # | Account | What it provides |
|---|---|---|
| 1 | **GitHub** | Hosts your source code; Vercel deploys automatically from pushes to it. |
| 2 | **Vercel** | Hosting, serverless functions, file storage (Blob), environment variable management. Sign up with your GitHub account so the two link automatically. |
| 3 | **Neon** | Managed Postgres database. |
| 4 | **Razorpay** | Payment gateway — the destination of this whole manual. |
| 5 | **Resend** | Transactional email (password resets, order/download emails). |
| 6 | **Meta Business** (for WhatsApp Cloud API) | WhatsApp order/gig notifications — optional, not required to reach a working payment gateway. |

---

## Part 2 — Project Foundation

### 2.1 Scaffold the project

Create a Next.js project with the App Router, TypeScript, and Tailwind CSS. This build used:

- **Next.js 16** (App Router, Server Actions, Turbopack)
- **TypeScript**
- **Tailwind CSS v4**
- **Prisma 7** as the ORM, with a driver adapter (`@prisma/adapter-pg`) rather than Prisma's older built-in connection handling — Prisma 7 requires this for Postgres.

Install the core dependencies your marketplace needs beyond the framework itself: `bcryptjs` (password hashing), `jose` (JWT session cookies), `zod` (form/schema validation), `pg` (Postgres client, used directly for scripts and alongside Prisma), `@vercel/blob` (file storage), `resend` (email), `razorpay` (the official SDK, added later in Part 5).

### 2.2 Design the database schema

Model your core entities in `prisma/schema.prisma`. For a marketplace like this, the backbone is:

- **User** — one table for every role (buyer, seller, service worker, etc.), with a `role` enum and a `status` field (`PENDING` / `APPROVED` / `REJECTED` / `SUSPENDED`) so new sellers can be moderated before going live.
- **Product** — listings, each tied to a seller, each moderated the same way (`PENDING → APPROVED`).
- **Order** and **OrderItem** — the purchase record and its line items, with a `paid` boolean and fields to hold the payment gateway's order/payment IDs once Part 5 wires that up.
- Supporting tables for whatever else your marketplace needs (this build also had gig-work requests/offers and job vacancies/applications, each following the same request → offer/application → accept pattern).

### 2.3 Connect to Postgres — two URLs, not one

Neon (and most serverless-friendly Postgres providers) gives you **two connection strings**:

- A **pooled** URL (routed through PgBouncer, hostname usually has `-pooler` in it) — use this as `DATABASE_URL`, the one your running app uses. Serverless functions spin up and down constantly; without pooling you exhaust the database's connection limit almost immediately.
- A **direct/unpooled** URL — use this as `DIRECT_URL`, reserved for migrations and CLI tools (`prisma migrate deploy`, `prisma studio`). Migrations need session-level features that transaction-mode pooling doesn't support.

Put both in a `.env` file at the project root (never commit this file — confirm it's in `.gitignore`).

### 2.4 First migration and seed data

Run your first migration against `DIRECT_URL` to create the schema in the actual database, then seed a handful of demo accounts and listings so you have something to click through immediately:

```bash
npx prisma migrate deploy
npm run seed
```

### 2.5 Run it locally

```bash
npm install
npm run dev
```

Confirm the app loads at `localhost:3000`, you can register an account, and the seeded demo data shows up. This is your baseline — everything from here is additive.

`[SCREEN: localhost:3000 homepage loading successfully]`

---

## Part 3 — Building the Marketplace Itself

With the foundation running locally, build out the actual product:

1. **Auth** — registration (role-specific fields), login, logout, session cookie (httpOnly JWT via `jose`), and role-based route protection.
2. **Buying flow** — browse/search products, cart, checkout form, an order confirmation page. At this stage, payment is *simulated*: orders are marked `paid: true` immediately on checkout, since Razorpay isn't wired in yet. This lets you build and test the entire buyer journey without a payment gateway blocking you.
3. **Selling flow** — a seller dashboard to list products/services, edit them, and track orders against their listings.
4. **Moderation** — an admin area to approve new seller accounts and new listings before they go public, keeping the marketplace's quality bar controlled from day one.

Everything in this part runs entirely on your local machine against the same Neon database — there's no need to deploy yet.

---

## Part 4 — Shipping to Production

### 4.1 Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 4.2 Import into Vercel

From the Vercel dashboard, **Add New → Project**, select your GitHub repo. Vercel detects it's a Next.js project automatically and sets the build command for you.

`[SCREEN: Vercel "Import Git Repository" screen with the repo selected]`

### 4.3 Add environment variables

Before the first deploy succeeds, add every variable from your local `.env` to Vercel's **Settings → Environment Variables**, scoped to **Production** (and Preview if you want preview deployments to work too): `DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET`, and so on.

`[SCREEN: Vercel Environment Variables panel with the variable list]`

### 4.4 Deploy

Click **Deploy**. Once it finishes, visit the generated `*.vercel.app` URL (or your connected custom domain) and confirm the site loads and login works against the real production database.

### 4.5 Point your domain

If you have a custom domain, add it under **Settings → Domains** and follow Vercel's DNS instructions. Confirm both the bare domain and `www` resolve correctly.

`[SCREEN: Vercel Domains tab showing the domain connected and verified]`

---

## Part 5 — Making Payments Real: Razorpay

This is the destination of the manual — taking checkout from "simulated" to a genuine, money-moving payment gateway.

### 5.1 Build the integration in code

Three pieces, all server-side:

1. **Create an order** — when a buyer checks out, call Razorpay's Orders API (`orders.create()`) to create a pending payment order, and store the returned `razorpayOrderId` against your own order record. Your own `Order` row is created `paid: false` at this point — it only flips to `true` once payment is actually confirmed.
2. **Render the Checkout modal** — pass the `razorpayOrderId` and your **public** key (the Key ID) to Razorpay's Checkout.js on the order page, gated behind a check like `isRazorpayConfigured()` so the UI degrades gracefully to the simulated flow when keys aren't set.
3. **Verify payment on success** — Razorpay's Checkout modal hands back a payment ID and a signature on success. Verify that signature server-side (HMAC-SHA256, using your **secret** key) before marking the order paid — never trust the client-side callback alone. Also add a webhook endpoint that Razorpay calls directly, and make the "mark as paid" logic idempotent (checking `WHERE paid = false` in the update) so it's safe whichever path — client callback or webhook — fires first.

At this point, with no real Razorpay credentials configured yet, checkout still works exactly as before (simulated) — nothing breaks.

### 5.2 Activate your Razorpay account (KYC)

In the Razorpay dashboard, complete **Account & Settings → Activation Details** — this is Razorpay's business verification (KYC), separate from any in-app "payment gateway setup" checklist you might see elsewhere in their UI. You need **Account Access: Complete** before live-mode keys will actually authenticate.

`[SCREEN: Razorpay Activation Details showing "Account Activated" with the activation date]`

### 5.3 Generate live API keys

Once activated, go to **Settings → API Keys** and generate a **live** Key ID and Key Secret. Razorpay shows the Key Secret exactly once — copy both immediately.

`[SCREEN: Razorpay API Keys screen showing the newly generated Key ID and Key Secret]`

### 5.4 Set up the webhook

Under **Settings → Webhooks**, add an endpoint pointing at your deployed site (e.g. `https://yourdomain.com/api/webhooks/razorpay`), subscribe to `payment.captured`, and copy the webhook secret Razorpay generates for it.

`[SCREEN: Razorpay Webhooks screen showing the endpoint added and subscribed to payment.captured]`

### 5.5 Add the three credentials to Vercel

In Vercel's Environment Variables (Production), add:

- `NEXT_PUBLIC_RAZORPAY_KEY_ID` — the public Key ID. **Not** marked Sensitive (it needs to be readable at build time, since `NEXT_PUBLIC_` variables get inlined into the app at build time).
- `RAZORPAY_KEY_SECRET` — the secret key. Marked Sensitive — it's a real secret, never exposed to the browser.
- `RAZORPAY_WEBHOOK_SECRET` — the webhook secret. Also Sensitive.

`[SCREEN: Vercel Environment Variables list showing all three Razorpay entries]`

### 5.6 Redeploy with a full rebuild

Trigger a new deployment and make sure it's a genuine rebuild, not one reusing a cached build — `NEXT_PUBLIC_` variables are baked into the JavaScript bundle at build time, so a cached build keeps serving whatever value was baked in previously, even after you update the variable.

### 5.7 Verify: place a real test order

1. Add a product to the cart as a buyer and go through checkout.
2. Confirm the order is created with `razorpayOrderId` populated (not null) — this proves the server successfully created a Razorpay order via the API.
3. Open the order page and confirm the **Pay now** button appears and opens Razorpay's real Checkout modal, showing genuine payment options (UPI QR code, cards, netbanking, wallets) for the correct amount.

`[SCREEN: Razorpay Checkout modal open, showing a live UPI QR code and payment method tabs for the order amount]`

At this point, the payment gateway is fully live: a real payment can be completed by a real buyer, verified server-side, and the order marked paid automatically — either the instant the Checkout modal reports success, or via the webhook as a backup, whichever arrives first.

---

## Part 6 — Go-Live Checklist

You have a genuinely working e-commerce site once every line here is true:

- [ ] Site loads on your production domain
- [ ] Registration, login, and role-based dashboards all work against the production database
- [ ] File uploads (product photos, verification documents) save and display correctly
- [ ] Password-reset emails arrive
- [ ] A test order creates a real Razorpay order (`razorpayOrderId` populated)
- [ ] The Checkout modal opens and shows real payment methods for the correct amount
- [ ] A completed payment marks the order `paid: true` and the buyer sees confirmation
- [ ] Admin can log in and moderate new sellers/listings

From here, everything else — more payment methods, refunds, WhatsApp notifications, analytics — is expansion, not foundation.
