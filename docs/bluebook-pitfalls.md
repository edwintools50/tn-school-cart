# The TN School Cart Bluebook — Pitfalls & What Not To Do

Companion to the main Bluebook. Everything here actually happened during this build. The main manual shows the clean path; this file exists so the next person (or future you) doesn't lose hours to the same dead ends.

---

## 1. Vercel's env var UI can lie to you — visually

**What happened:** An environment variable's Value box showed grey placeholder text (e.g. `https://api.example.com`) that looked exactly like a real saved value at a glance. It wasn't — the field was actually empty. This cost real time before it was noticed, because everything else about the app *looked* correctly configured.

**What not to do:** Don't trust a value box's appearance from a distance. Click into it. Placeholder/hint text in Vercel's UI is a lighter grey than real content, but it's easy to miss, especially on a screenshot or a quick glance.

**What to do instead:** Click into the field and confirm there's real, selectable text before assuming a variable is set.

---

## 2. `NEXT_PUBLIC_` variables need a *real* rebuild, not just a redeploy

**What happened:** Updated a `NEXT_PUBLIC_RAZORPAY_KEY_ID` value multiple times, redeployed each time via Vercel's default **Redeploy** button, and the app kept behaving as if the old value were still set.

**Why:** `NEXT_PUBLIC_` variables are inlined into the JavaScript bundle *at build time*, not read at runtime. Vercel's default Redeploy reuses the existing build cache, so a cached build keeps shipping whatever value was baked in during the last real build — the new environment variable value never gets compiled in.

**What not to do:** Don't assume "Redeploy" always picks up a new `NEXT_PUBLIC_` value.

**What to do instead:** When a `NEXT_PUBLIC_` variable changes, redeploy with **"Use existing Build Cache" unchecked**, forcing a genuine rebuild. (Server-only variables, without the `NEXT_PUBLIC_` prefix, are read at runtime and don't have this problem — though redeploying is still the safest habit either way.)

---

## 3. Marking a `NEXT_PUBLIC_` variable "Sensitive" quietly breaks it

**What happened:** After finally getting a `NEXT_PUBLIC_RAZORPAY_KEY_ID` value to stick, checkout still failed. The variable had been marked **Sensitive** in Vercel — a toggle that seemed like reasonable extra security for an API-related credential.

**Why this breaks things:** Vercel's Sensitive environment variables are explicitly *not* exposed during the build step, only at runtime. But `NEXT_PUBLIC_` variables are inlined at build time by Next.js. Marking one Sensitive means the build process can't see it when compiling — the value gets baked in as empty/undefined regardless of what's actually stored.

**What not to do:** Don't mark `NEXT_PUBLIC_` (public, build-time) variables as Sensitive. It's not "more secure" for a variable that's going to be visible in the browser's JS bundle anyway — it's actively counterproductive.

**What to do instead:** Keep `NEXT_PUBLIC_` variables non-sensitive (they're public by design). Reserve Sensitive for genuine server-only secrets (API secret keys, webhook secrets) that are read at runtime, not build time.

---

## 4. The dashboard's "edit in place" flow can silently fail to save

**What happened:** Retyped a variable's value directly in its existing edit panel, saved, and — per the issues above — it later turned out the edit hadn't actually persisted, even with no visible error.

**What not to do:** Don't assume a save succeeded just because no error appeared.

**What to do instead:** For anything that's misbehaving after a dashboard edit, stop trusting the dashboard as ground truth. Use the CLI to set it deterministically instead:

```bash
npx vercel env rm VARIABLE_NAME production --yes
npx vercel env add VARIABLE_NAME production --value "the-value" --no-sensitive --yes
```

(drop `--no-sensitive` for genuine secrets). Then trigger a real rebuild (`vercel --prod`, or the dashboard redeploy with build cache unchecked). The CLI writes directly, with no UI rendering quirks in the way — this was the move that finally broke the debugging loop.

---

## 5. A wrong Key Secret produces a generic, unhelpful error

**What happened:** A mismatched or malformed `RAZORPAY_KEY_SECRET` (at one point a completely wrong value, formatted like a different provider's key entirely) produced only:

```
Error: {"statusCode":401,"error":{"description":"Authentication failed","code":"BAD_REQUEST_ERROR"}}
```

— with no indication of *which* credential was wrong, or whether it was a code bug versus a configuration problem.

**What not to do:** Don't assume a 401 from a payment provider means the integration code is broken. Don't spend time re-reading the integration code before checking the credentials themselves.

**What to do instead:** Test credentials directly and independently of the app, with a minimal script:

```js
const Razorpay = require('razorpay');
const client = new Razorpay({ key_id: '...', key_secret: '...' });
client.orders.create({ amount: 100, currency: 'INR', receipt: 'test' })
  .then(r => console.log('SUCCESS', r))
  .catch(e => console.error('FAILED', e));
```

If this succeeds with the same values the app is using, the app's code is fine and the problem is purely in how the credentials reached (or didn't reach) the deployed environment.

---

## 6. Local dev and production sharing one database is a real risk

**Setup note, not a bug:** In this build, `DATABASE_URL`/`DIRECT_URL` pointed at the same Neon database from both the local dev machine and the deployed production app. Convenient for quick verification, dangerous for careless testing.

**What not to do:** Don't run exploratory test flows (placing test orders, creating test accounts, uploading test files) without a plan to clean them up. Don't assume "it's just local dev" protects production data.

**What to do instead:** Tag test data unmistakably (e.g. `TEST-DELETE-ME` prefixes in titles) so it's easy to find and remove afterward, and actually remove it once verification is done. Query before destructive operations to confirm exactly what will be affected.

---

## 7. UI text and actual logic can silently drift apart

**What happened:** The checkout page displayed "Payment is simulated for this demo" **unconditionally** — hardcoded — even after live Razorpay credentials were fully working. The actual payment logic (`isRazorpayConfigured()`) was correct; the *message shown to the user* had just never been wired to check it.

**What not to do:** Don't assume UI copy reflects current app state just because the underlying logic is correct elsewhere.

**What to do instead:** When debugging "it says X but does Y," check the display code and the logic code as two separate, independently-verifiable things — they can genuinely disagree.

---

## 8. WhatsApp Business Verification is easy to skip and hard to diagnose

**What happened:** WhatsApp notifications failed site-wide with `"API access blocked"` (OAuthException code 200). Root cause: the Meta Business app's **Business Verification** had never been started — a step that's separate from generating an access token and phone number ID, both of which can be obtained and configured *before* verification, giving the false impression everything's ready.

**What not to do:** Don't assume a working access token means the integration is fully live.

**What to do instead:** Confirm Business Verification status directly in Meta Business Settings before relying on WhatsApp sending in production. It can take 2–10 business days once submitted — start it early, well before go-live.

---

## 9. "Can't reach database server" isn't always a real outage

**What happened:** Occasional `PrismaClientKnownRequestError: Can't reach database server` / `P1001` errors appeared mid-session, unrelated to any code change.

**Why:** Neon's serverless compute auto-suspends after a period of inactivity and needs a moment to wake back up on the next query — a cold start, not a failure.

**What not to do:** Don't immediately assume a code regression when this specific error appears right after a period of no database activity.

**What to do instead:** Retry once. If it persists past a retry, then investigate further.

---

## 10. Automated browser-testing clicks can silently fail

**Testing note, not a production issue:** Roughly half of automated `click` actions on submit buttons failed to register during this session, with no visible error — the page just stayed exactly as it was, looking like nothing was clicked.

**What not to do:** Don't trust a single click attempt when verifying a form submission, especially after a page has been open and interacted with for a while.

**What to do instead:** After any click meant to submit a form or trigger navigation, verify the actual result independently (check the database, check the resulting page state) rather than trusting that the click "must have worked." Opening a fresh browser tab for each new test sequence reduced the failure rate substantially.

---

## 11. Losing admin access is easier than it looks

**What happened, across two separate incidents:**
- The admin account's login email didn't match the site's own domain (`@tnschoolcart.in` on a `tnschoolcart.com` site) — confusing enough that it looked like the wrong account entirely, even though it was correct.
- After a legitimate password-reset email arrived and was used, login still failed — most likely a typo or a stray character introduced while manually retyping the new password.

**What not to do:** Don't assume a "wrong password" error means the account, database, or app is broken — check the simple explanations first (typos, autofill, caps lock).

**What to do instead:**
- If the admin login email doesn't match the site's domain, that's not necessarily wrong — email addresses don't have to match a website's domain. Confirm against the database directly (`SELECT email FROM "User" WHERE role = 'ADMIN'`) rather than guessing from appearances.
- When a password reset *should* have worked but login still fails, isolate the variable: set a known password directly (hashed the same way the app does — bcrypt, cost factor matching `hashPassword()`) and hand over the exact plaintext to test with. If that exact string works, the previous failures were entry/typo issues, not a system bug — and you've confirmed the account itself is healthy.
