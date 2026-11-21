import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { clean } from "@/lib/env";

// A local-only page that checks your .env.local settings and connections.
// It never shows the keys themselves. Open http://localhost:3000/setup-check
// while `npm run dev` is running. It doesn't exist on the live site.

export const dynamic = "force-dynamic";

type Check = { name: string; ok: boolean; note: string };

const VARS = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "ADMIN_EMAILS",
];

async function run(): Promise<Check[]> {
  const checks: Check[] = [];
  for (const name of VARS) {
    const raw = process.env[name];
    const v = clean(raw);
    let note = v ? "set" : "missing: add it to .env.local, then restart npm run dev";
    if (v && raw !== v) note = "set (had extra spaces or quotes, which the site now ignores)";
    if (v && /\s/.test(v)) note = "has a space or line break inside it: paste it again on one line";
    checks.push({ name, ok: !!v && !/\s/.test(v), note });
  }

  const url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (url && !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url.replace(/\/$/, ""))) {
    checks.push({ name: "Supabase URL format", ok: false, note: "should look like https://abcdefgh.supabase.co (the Project URL, nothing after it)" });
  }

  const service = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const anon = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (service && anon && service === anon) {
    checks.push({ name: "Supabase keys", ok: false, note: "the anon key and service_role key are the same: the service_role one is the secret key" });
  }
  if (url && service) {
    try {
      const db = createClient(url, service, { auth: { persistSession: false } });
      const { error: tableErr } = await db.from("orders").select("id").limit(1);
      checks.push({
        name: "Supabase tables",
        ok: !tableErr,
        note: tableErr ? `can't read orders: ${tableErr.message}. Re-run supabase/migrations/0001_orders.sql in the SQL Editor.` : "orders table found",
      });
      const { data: buckets, error: bucketErr } = await db.storage.listBuckets();
      const have = new Set((buckets ?? []).map((b) => b.id));
      const missing = ["uploads", "proofs", "finals"].filter((b) => !have.has(b));
      checks.push({
        name: "Supabase file storage",
        ok: !bucketErr && missing.length === 0,
        note: bucketErr
          ? `can't list storage: ${bucketErr.message}`
          : missing.length
            ? `missing storage buckets: ${missing.join(", ")}. Re-run the last part of 0001_orders.sql.`
            : "uploads, proofs and finals buckets found",
      });
    } catch (e) {
      checks.push({ name: "Supabase connection", ok: false, note: e instanceof Error ? e.message : "failed" });
    }
  }

  const sk = clean(process.env.STRIPE_SECRET_KEY);
  if (sk) {
    if (!sk.startsWith("sk_test_") && !sk.startsWith("rk_test_")) {
      checks.push({ name: "Stripe key", ok: false, note: "use the test secret key (starts with sk_test_) while testing" });
    } else {
      try {
        await new Stripe(sk, { httpClient: Stripe.createFetchHttpClient() }).balance.retrieve();
        checks.push({ name: "Stripe connection", ok: true, note: "test key works" });
      } catch (e) {
        checks.push({ name: "Stripe connection", ok: false, note: e instanceof Error ? e.message : "failed" });
      }
    }
  }
  const wh = clean(process.env.STRIPE_WEBHOOK_SECRET);
  if (wh && !wh.startsWith("whsec_")) {
    checks.push({ name: "Stripe webhook secret", ok: false, note: "should start with whsec_ (from the stripe listen window)" });
  }
  return checks;
}

export default async function SetupCheck() {
  if (process.env.NODE_ENV === "production") notFound();
  const checks = await run();
  const bad = checks.filter((c) => !c.ok).length;
  return (
    <main className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="font-display text-4xl font-black">Setup check</h1>
      <p className="mt-2">{bad ? `${bad} thing${bad > 1 ? "s" : ""} to fix.` : "Everything looks good."} Keys are never shown here.</p>
      <ul className="mt-8 space-y-3">
        {checks.map((c) => (
          <li key={c.name} className="vg-card flex gap-3 p-4">
            <span className="text-xl">{c.ok ? "✅" : "❌"}</span>
            <span>
              <strong className="font-display">{c.name}</strong>
              <br />
              <span className="text-sm">{c.note}</span>
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
