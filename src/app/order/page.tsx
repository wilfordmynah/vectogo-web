import PortalShell from "@/components/PortalShell";
import OrderWizard from "@/components/OrderWizard";
import { currentUser } from "@/lib/supabase/server";
import { isPackageId } from "@/lib/config";

export const metadata = { title: "Start your order | Vectogo" };

export default async function OrderPage({
  searchParams,
}: {
  searchParams: Promise<{ package?: string; step?: string; cancelled?: string }>;
}) {
  const { package: pkg, step, cancelled } = await searchParams;
  let email: string | null = null;
  try {
    email = (await currentUser())?.email ?? null;
  } catch {
    email = null;
  }

  return (
    <PortalShell>
      <OrderWizard
        signedInEmail={email}
        initialPackage={isPackageId(pkg) ? pkg : null}
        initialStep={step === "review" ? "review" : null}
        cancelled={cancelled === "1"}
      />
    </PortalShell>
  );
}
