# Admin Handbook

A complete, step-by-step guide to running the TN School Cart admin panel.

## 1. Logging in

1. Go to `tnschoolcart.com/login` and sign in with the admin account email and password.
2. You're taken straight to `/admin` — the admin panel replaces the normal marketplace navigation with an admin tab bar: **Dashboard · Users · Products · Services · Orders · Gigs · Jobs**.

### Changing the admin password

1. Click **Settings** in the top nav (visible for every logged-in role, including admin).
2. Enter your current password, then your new password twice.
3. Submit. You'll need the new password next time you log in. If you ever forget it, use **Forgot password?** on the login page — a reset link is emailed to the admin account's address.

## 2. The Dashboard tab — your daily starting point

`/admin` shows five at-a-glance cards, each a shortcut to the filtered list behind it:

| Card | What it means | Click it to... |
|---|---|---|
| Accounts awaiting approval | New Supplier/Worker/Teacher signups (Principals auto-approve, so they never appear here) | Jump to Users, pre-filtered to `PENDING` |
| Products awaiting review | New or edited product listings | Jump to Products, pre-filtered to `PENDING` |
| Services awaiting review | New or edited gig-worker service listings | Jump to Services, pre-filtered to `PENDING` |
| Total orders placed | Running count, all-time | Jump to Orders |
| Total gig requests posted | Running count, all-time | Jump to Gigs |

A one-line summary under the title shows total counts of Principals / Suppliers / Gig Workers registered. **A healthy routine is: check this page daily, and clear the two "awaiting approval/review" queues (Users and Products/Services) before they pile up** — nothing else on the marketplace works for a new seller until you act on these.

## 3. Users tab — approving and managing accounts

This is where Supplier, Gig Worker, and Teacher accounts (not Principals — they don't need approval) go through a one-time approval check.

### Step-by-step: reviewing a pending account

1. Go to **Users**. Use the **status** filter (defaults to showing all) and **role** filter to narrow down — e.g. `status=PENDING` to see everyone waiting on you.
2. For each pending account, check:
   - **Name, email, phone** — do they look like a real business, not spam/junk?
   - **Business name and service area** (Suppliers/Workers) — is the service area a real Tamil Nadu district?
   - **Qualification, subject specialization, experience, resume link** (Teachers) — click **View resume →** to open the actual PDF and sanity-check it matches the claimed qualification.
   - **School verification photo** (only shown for Principals, who don't actually need your approval — this field exists on their profile but isn't gated by you).
3. Click **Approve** to let them start listing publicly, or **Reject** — optionally typing a short reason first, which the user will see on their own dashboard so they know what to fix.
4. There's no follow-up step needed after Approve — the account is immediately usable.

### Suspending an account (misuse, complaints, fraud)

1. Find the account (filter by role/status if it's long since approved). Only `APPROVED` accounts show a **Suspend** button.
2. Click **Suspend**. This blocks them from logging in at all (their existing listings stay on the marketplace, still visible, until you separately deal with those — suspension doesn't auto-hide their products/services).
3. To undo it, find the account under `status=SUSPENDED` and click **Reinstate** — this sets them back to `APPROVED` immediately.

### Reversing a rejection

If you rejected someone by mistake, or they've since fixed the issue you flagged: find them under `status=REJECTED` and click **Reinstate** — same button and effect as un-suspending, it moves them straight to `APPROVED`.

## 4. Products tab — moderating marketplace listings

Every new or edited product (physical or digital) lands here as `PENDING` before it's visible in the public Marketplace.

### Step-by-step: reviewing a pending product

1. Go to **Products**. Filter by `status=PENDING` to see the review queue.
2. For each listing, check:
   - **Title, description, category** — accurate and not misleading?
   - **Price and unit** (physical items) — reasonable, not a typo (₹10 instead of ₹1000, etc.)?
   - **Photo** — click it to view full-size, if provided.
   - **If it's a digital product** (look for the **Digital** badge next to the title): click **Review digital file →** to actually open the uploaded PDF/ZIP/DOC/PPT and confirm it matches the description before approving — this is the one thing you can't sanity-check from the listing text alone, so don't skip it. Once approved, buyers get instant access to this exact file the moment they pay, so a bad file becomes a real complaint fast.
3. Click **Approve** or **Reject** (with an optional reason — it defaults to "Does not meet listing guidelines." if you leave it blank, so type something specific when you can).
4. A supplier who edits an approved listing sends it back through this same queue (status resets to `PENDING`) — so you'll see previously-approved products reappear here after a supplier changes them. That's expected, not a bug.

## 5. Services tab — moderating gig-worker listings

Same pattern as Products, for the standing "service" listings gig workers put in the **Find Services** directory.

1. Go to **Services**, filter by `status=PENDING`.
2. Check: category, title, description, and pricing (fixed / hourly / "quote per job") make sense for the category.
3. **Approve** or **Reject** (with an optional reason).

Note: this only moderates the *service directory listing*. It has no bearing on individual **Gig Requests** or **offers** — those aren't moderated at all; see the Gigs tab below.

## 6. Orders tab — oversight (read-only)

`/admin/orders` lists every order platform-wide (newest first, most recent 100), showing the buyer, school, item count, date, and total. **There are no action buttons here** — you can't cancel, refund, or edit an order from the admin panel today.

**What to use this for:** spotting patterns (a school placing an unusually large order, a spike in order volume) and pulling up order details when a buyer contacts you about a problem. If a buyer or supplier needs a refund or an order-level intervention, you currently have to handle that manually outside the app (bank/Razorpay dashboard for refunds, direct message to the supplier for fulfillment issues) — flag this as a known gap if it becomes a recurring need.

## 7. Gigs tab — oversight (read-only)

`/admin/gigs` lists every gig request platform-wide, with status (`OPEN / ASSIGNED / IN_PROGRESS / COMPLETED / CANCELLED`), the principal, school, district, and number of offers received. Job photos and completion-proof photos are shown as thumbnails — click either to view full-size.

Like Orders, this is **read-only** — the principal and assigned worker manage the actual lifecycle (accepting offers, marking progress/completion) themselves. Use this tab to monitor activity and investigate if a dispute comes in (e.g., checking whether a completion photo was actually uploaded).

## 8. Jobs tab — oversight (read-only)

`/admin/jobs` lists every teacher job vacancy platform-wide, with status (`OPEN / FILLED / CLOSED`), the posting principal, school, district, and application count. Also **read-only** — principals manage hiring themselves.

## 9. Daily / weekly routine (recommended)

1. **Daily**: Open the Dashboard. If "Accounts awaiting approval" or "Products/Services awaiting review" show a nonzero count, clear the queue the same day — a pending supplier or listing is dead weight until you act.
2. **Weekly**: Skim Orders, Gigs, and Jobs for anything unusual — a school with an outsized order, a gig stuck at `IN_PROGRESS` far past its preferred date, a job vacancy with zero applications after weeks (might be worth a nudge to the principal to check their listing).
3. **As needed**: Suspend accounts reported for misuse; reinstate ones that were suspended/rejected in error.

## 10. What's outside the admin panel

A few things affect the live site but aren't buttons inside `/admin` — they're managed directly by whoever holds the Vercel/Razorpay/Resend/Neon account credentials (not exposed to the in-app Admin role):

- **Payments**: Razorpay live-mode keys and webhook config, in the Vercel dashboard's Environment Variables and the Razorpay dashboard.
- **Email**: Resend API key and sending domain, also in Vercel env vars.
- **WhatsApp notifications**: Meta Business API credentials and template approval status.
- **File storage**: Vercel Blob (photos, resumes, digital-product files).
- **Database**: Neon Postgres — the single source of truth; local development and production currently share the same database.

These don't need daily attention, but if something site-wide breaks (e.g. no orders are getting marked paid, or no emails are going out), the fix lives in one of these places, not in the admin UI.

## Quick reference

| I want to... | Where |
|---|---|
| Approve a new Supplier/Worker/Teacher | Users → filter PENDING → Approve |
| Approve a new/edited product or service | Products or Services → filter PENDING → Approve (check the file for digital products first) |
| Block a misbehaving account | Users → find them → Suspend |
| Undo a suspension or rejection | Users → filter SUSPENDED/REJECTED → Reinstate |
| Check on a specific order | Orders (read-only; no action buttons) |
| Check on a gig job's progress | Gigs (read-only) |
| Check on a teacher hiring vacancy | Jobs (read-only) |
| Change my own password | Settings |
