// All settings come from environment variables (see .env.example).
// Each one is read lazily so the marketing pages build without them.

function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name}. See .env.example.`);
  return v;
}

export const env = {
  siteUrl: () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  supabaseUrl: () => need("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () => need("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceKey: () => need("SUPABASE_SERVICE_ROLE_KEY"),
  stripeSecretKey: () => need("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: () => need("STRIPE_WEBHOOK_SECRET"),
  resendApiKey: () => process.env.RESEND_API_KEY ?? "",
  emailFrom: () => process.env.EMAIL_FROM ?? "Vectogo <hello@vectogo.com>",
  adminEmails: () =>
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
};
