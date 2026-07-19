# TN School Cart

An Edu-commerce marketplace for Tamil Nadu schools. School principals and head
masters (buyers) can order stationery, furniture, notebooks, educational
content and health & hygiene supplies from verified suppliers, and post
gig-work requests (plumbing, electrical, cleaning, etc.) that gig workers can
bid on. An admin panel handles moderation of accounts, product listings and
service listings.

## Stack

- Next.js 16 (App Router, Server Actions, TypeScript, Tailwind CSS v4)
- Prisma 7 + PostgreSQL (via `@prisma/adapter-pg`)
- Custom auth: bcrypt password hashing + `jose` JWT httpOnly session cookie
- No external payment gateway — checkout is simulated (orders are marked paid immediately)

## Getting started

You need a Postgres database — a free one from [Neon](https://neon.tech) or
[Supabase](https://supabase.com) works fine (Neon can also be provisioned
directly from Vercel's Storage tab, see below).

```bash
npm install
# Set DATABASE_URL in .env to your Postgres connection string first.
npx prisma migrate dev --name init   # creates the tables
npm run seed                          # creates an admin account + sample suppliers/workers/products/services
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo accounts

All seeded passwords are shown below. New accounts can also be created via
**Sign up** — Principal accounts are auto-approved, Supplier/Worker accounts
require admin approval (visible in `/admin/users`).

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@tnschoolcart.in | admin123 |
| Supplier (Stationery/Notebooks/Health) | supplier.saraswathi@tnschoolcart.in | supplier123 |
| Supplier (Furniture) | supplier.annafurniture@tnschoolcart.in | supplier123 |
| Supplier (Educational Content) | supplier.edutech@tnschoolcart.in | supplier123 |
| Supplier (pending approval) | supplier.newmart@tnschoolcart.in | supplier123 |
| Gig worker (Plumbing) | worker.murugan@tnschoolcart.in | worker123 |
| Gig worker (Electrical/IT) | worker.brightspark@tnschoolcart.in | worker123 |
| Gig worker (Cleaning) | worker.cleanpro@tnschoolcart.in | worker123 |
| Gig worker (pending approval) | worker.newcarpentry@tnschoolcart.in | worker123 |
| Principal | principal.selvam@tnschoolcart.in | principal123 |
| Supplier (IT/Electronics/Printing) | supplier.digitalprint@tnschoolcart.in | supplier123 |
| Supplier (RO Water Purifiers) | supplier.aquapure@tnschoolcart.in | supplier123 |
| Supplier (Uniforms & Sports Merch) | supplier.championsports@tnschoolcart.in | supplier123 |
| Gig worker (IT/Smart Board/CCTV/Printing/RO) | worker.techcare@tnschoolcart.in | worker123 |
| Gig worker (Painting/Whitewashing) | worker.colortouch@tnschoolcart.in | worker123 |
| Gig worker (Catering) | worker.annapoorna@tnschoolcart.in | worker123 |
| Gig worker (Transport) | worker.safetransit@tnschoolcart.in | worker123 |

## Categories

**Products** (`/marketplace`): Stationery, Furniture, Educational Content &
Exam Guides, Notebooks & Books, Health & Hygiene, Sports Equipment, IT/
Electronics & Appliances (printers, PCs, toner, smart boards, CCTV, RO
purifiers), Exam & Print Stationery (A4/OMR sheets, exam booklets), Uniforms
& Merchandise (shoes, T-shirts, trophies, shields), Other.

**Gig work** (`/services` to browse providers, `/gigs` to post/track job
requests): Plumbing, Electrical, Toilet Cleaning, General & Room Cleaning,
Carpentry, Painting/Whitewashing, Pest Control, Gardening, IT/Computer/
Printer Support, RO Water Purifier Sales & Service, Smart Board/CCTV/
Broadband Installation, Printing & Banner/Certificate Services, Catering
(tea/snacks/lunch vendor supply), Student & Staff Commute Vehicle, Goods
Transport/Carrier Service, Other.

Anything that doesn't fit an existing category should go under **Other** —
new dedicated categories can be added later the same way (extend the
`ProductCategory`/`GigCategory` enums in `prisma/schema.prisma`, then add
labels in `src/lib/constants.ts`).

## Data model

See `prisma/schema.prisma`. Key entities: `User` (role + approval status),
`Product` (supplier listing, admin-moderated), `Order`/`OrderItem` (cart
checkout, per-supplier fulfillment status), `GigService` (worker listing,
admin-moderated), `GigRequest`/`GigOffer` (principal job posting → worker
bids → accepted offer assigns the job).

## Useful commands

```bash
npm run dev             # start dev server
npm run build            # production build
npm run seed             # (re)seed demo data — safe to re-run, upserts by email
npx prisma studio         # browse the database
npx prisma migrate dev    # create a new migration after editing schema.prisma
npx prisma migrate deploy # apply pending migrations to production (no prompts)
```

## Deploying to Vercel

See the deployment guide the assistant provided in-session, or in short:

1. Provision a Postgres database (Vercel → Storage tab → Neon, or Supabase).
2. Push this repo to GitHub and import it in Vercel.
3. In Vercel project settings, set `DATABASE_URL` (usually auto-set by the
   Neon integration) and `SESSION_SECRET` (a long random string — don't reuse
   the dev one in this repo).
4. Run `npx prisma migrate deploy` once against the production `DATABASE_URL`
   (from your machine, with `DATABASE_URL` pointed at prod) to create the
   tables, then optionally `npm run seed` for demo data.
5. Deploy. Vercel runs `npm install` (which triggers `postinstall: prisma
   generate`) then `npm run build` automatically.
