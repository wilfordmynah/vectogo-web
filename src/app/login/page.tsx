import SignInForm from "@/components/SignInForm";
import PortalShell from "@/components/PortalShell";

export const metadata = { title: "Sign in | Vectogo" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next = "/account", error } = await searchParams;
  return (
    <PortalShell>
      <div className="mx-auto max-w-lg py-10">
        <h1 className="font-display text-4xl font-black">
          Welcome back <span className="font-extralight">no passwords here</span>
        </h1>
        <p className="mt-3">Pop in your email and we&apos;ll send you a link that signs you straight in.</p>
        {error === "link" && (
          <p className="mt-4 rounded-xl bg-peach p-3 text-sm">
            That link has expired or was already used. No prob, grab a fresh one below.
          </p>
        )}
        <div className="mt-6">
          <SignInForm next={next} />
        </div>
      </div>
    </PortalShell>
  );
}
