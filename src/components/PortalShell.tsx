import Image from "next/image";
import Link from "next/link";
import { currentUser, isAdminEmail } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { redirect } from "next/navigation";

// Calm layout for the order form, the customer account and the admin area:
// same colors and type as the site, without the scroll motion.
export default async function PortalShell({ children }: { children: React.ReactNode }) {
  let user = null;
  try {
    user = await currentUser();
  } catch {
    // Supabase not configured yet; show the shell signed out.
  }
  const admin = isAdminEmail(user?.email);

  async function doSignOut() {
    "use server";
    await signOut();
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b-2 border-black/5 px-5 py-4 sm:px-10">
        <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <Link href="/" aria-label="Vectogo home">
            <Image src="/brand/logo.png" alt="vectogo" width={120} height={30} />
          </Link>
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
            {user ? (
              <>
                <Link href="/account" className="hover:text-purple">My orders</Link>
                <Link href="/account/billing" className="hover:text-purple">Billing</Link>
                {admin && <Link href="/admin" className="hover:text-purple">Admin</Link>}
                <form action={doSignOut}>
                  <button className="opacity-70 hover:opacity-100">Sign out</button>
                </form>
              </>
            ) : (
              <Link href="/login" className="hover:text-purple">Sign in</Link>
            )}
            <Link href="/order" className="vg-pill vg-pill--solid !px-4 !py-2">New order</Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-10">{children}</main>
    </div>
  );
}
