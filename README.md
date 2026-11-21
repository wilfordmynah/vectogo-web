# Vectogo website

The new vectogo.com: the flowing marketing site, the order form, customer accounts, Stripe payments and the admin order queue, all in one Next.js app.

- **Code:** this GitHub repo. You edit locally in VS Code and push.
- **Hosting:** Cloudflare Workers, built with [OpenNext](https://opennext.js.org/cloudflare). Every push to `main` deploys the live site; every other branch gets its own preview link.
- **Accounts, database and files:** Supabase.
- **Payments:** Stripe Checkout. **Email:** Resend.

## Your everyday workflow

1. In VS Code, pull the latest (`git pull`).
2. To try a branch Claude pushed: `git fetch` then `git checkout branch-name` (for example `git checkout phase-2-ordering`).
3. `npm install` (only when `package.json` changed), then `npm run dev` and open http://localhost:3000.
4. Commit and push. Cloudflare builds it: pushes to `main` go live, other branches get a preview link on the pull request.

`npm run preview` runs the site on the real Cloudflare runtime locally (port 8787), if you ever want to double-check before pushing.

## First-time setup

### 1. On your computer

1. Install [Node.js](https://nodejs.org) 20 or newer.
2. In VS Code: View → Command Palette → "Git: Clone" → `https://github.com/wilfordmynah/vectogo-web`.
3. Open the terminal (View → Terminal) and run `npm install`.
4. Copy `.env.example` to a new file called `.env.local` and fill in the values from the steps below. This file stays on your computer and is never pushed.

The homepage works without any keys. The order form, accounts and admin need Supabase; checkout needs Stripe.

### 2. Supabase (accounts, database, files)

1. At [supabase.com](https://supabase.com), create a project called `vectogo`.
2. **SQL Editor** → New query → paste all of `supabase/migrations/0001_orders.sql` → Run. This creates the tables, the security rules and the three private file buckets.
   Then do the same with `supabase/migrations/0002_grants.sql`, which lets the site use those tables (newer Supabase projects need this).
3. **Project Settings → API**: copy the Project URL, the `anon` key and the `service_role` key into `.env.local`. Keep the service role key secret.
4. **Authentication → URL Configuration**: set Site URL to `https://vectogo.com` and add these Redirect URLs:
   `http://localhost:3000/**`, `https://vectogo.com/**`, `https://*.workers.dev/**`
5. **Authentication → Emails → Magic Link** template: change the link to
   `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next={{ .RedirectTo }}`
   so sign-in links work even when opened on a different device. (Optional, but recommended.)

**Check your setup:** with `npm run dev` running, open http://localhost:3000/setup-check. It lists any missing or mistyped settings and checks the Supabase tables, file storage and Stripe key, without ever showing the keys. (Only works on your computer, not on the live site.)

Your keys go in `.env.local` in the main project folder, next to `package.json`. The site doesn't read keys from `.dev.vars`. After changing `.env.local`, stop `npm run dev` with Ctrl+C and start it again.

### 3. Stripe (payments)

1. In your Stripe dashboard, switch on **Test mode**.
2. **Developers → API keys**: copy the secret key (`sk_test_…`) into `STRIPE_SECRET_KEY`.
3. To test payments locally, install the [Stripe CLI](https://docs.stripe.com/stripe-cli), run `stripe login` once, then run
   `stripe listen --forward-to localhost:3000/api/stripe/webhook`. It prints a `whsec_…` secret: put it in `STRIPE_WEBHOOK_SECRET`.
4. For the live site: **Developers → Webhooks → Add endpoint** → `https://vectogo.com/api/stripe/webhook`, with the events
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`.
   Use that endpoint's signing secret on Cloudflare.
5. Test card: `4242 4242 4242 4242`, any future date, any CVC.

No products need creating in Stripe: prices come from `src/lib/config.ts`. Customers get Stripe's normal emailed receipt. Invoice PDFs are off (Stripe charges per invoice); see `src/lib/stripe.ts` to turn them on. Prices are in USD, and Stripe Tax is off (Alaska has no state sales tax).

### 4. Cloudflare (hosting)

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Import a repository** → pick GitHub → `vectogo-web`.
2. Build settings:
   - Build command: `npx opennextjs-cloudflare build`
   - Deploy command: `npx opennextjs-cloudflare deploy`
   - Non-production branch deploy command: `npx opennextjs-cloudflare upload` (this is what gives pull requests a preview link)
   - Production branch: `main`
3. **Settings → Variables and Secrets**: add every name from `.env.example` with its real value (mark the keys as Secret). Set `NEXT_PUBLIC_SITE_URL` to `https://vectogo.com`.
   Because `NEXT_PUBLIC_…` values are baked in at build time, also add those three under **Settings → Build → Variables and secrets**.
4. When the domain is on Cloudflare: **Settings → Domains & Routes → Add → Custom domain** → `vectogo.com` (and `www.vectogo.com`).

### 5. Resend (emails)

Optional until launch: without a key, emails are printed in the terminal instead. At [resend.com](https://resend.com), add the domain `vectogo.com` and add its DNS records in Cloudflare (Resend uses a `send.vectogo.com` subdomain, so it doesn't clash with Zoho Mail). Put the API key in `RESEND_API_KEY`.

### 6. Admin access

Put your email in `ADMIN_EMAILS`. Sign in with it and an **Admin** link appears: that's the order queue.

## How ordering works

The rules follow the "Vectogo ordering flow" doc:

1. Customer picks a package, uploads their logo, fills the brief, gets a sign-in link by email (that creates their account) and pays with Stripe Checkout.
2. Stripe's webhook marks the order **Paid**. You get an email; the customer gets a receipt and the promise of a reply within 24 hours.
3. In **Admin**, you start work and upload proofs. The customer approves or asks for changes; each change request uses one round (Just the basics 1, Oh yeah! 2, I want it all! unlimited).
4. Out of rounds, the customer can upgrade for the price difference or buy **One More Thing!** ($29: one more round, then final). One More Thing! is also offered after delivery for alterations.
5. Once approved, you upload the final files and press **Deliver**. The customer downloads them (one by one or as a zip) any time.
6. Full refunds are available through the first round (until a second proof is sent). The customer can request one; you press **Full refund** in the order workspace and Stripe does the rest.

## Where things live

| What | Where |
| --- | --- |
| Packages, prices, One More Thing! | `src/lib/config.ts` |
| Ordering rules (rounds, refunds, upgrades) | `src/lib/rules.ts` |
| Brand colors | `src/app/globals.css` |
| Fonts | `src/app/layout.tsx` |
| Homepage | `src/app/page.tsx` |
| Order form | `src/components/OrderWizard.tsx` |
| Customer account | `src/app/account/` |
| Admin area | `src/app/admin/` |
| Stripe webhook and payment handling | `src/app/api/stripe/webhook/route.ts`, `src/lib/payments.ts` |
| Emails | `src/lib/email.ts` and the actions that call it |
| Database tables and security rules | `supabase/migrations/0001_orders.sql` |
| Redirects from old Squarespace pages | `next.config.ts` |
| Cloudflare settings | `wrangler.jsonc`, `open-next.config.ts` |
