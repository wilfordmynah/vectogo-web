import Image from "next/image";
import Link from "next/link";
import PortalShell from "@/components/PortalShell";
import ClearDraft from "@/components/ClearDraft";
import { TURNAROUND } from "@/lib/config";

export const metadata = { title: "Thanks! | Vectogo" };

export default async function ConfirmedPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  return (
    <PortalShell>
      <ClearDraft />
      <div className="mx-auto max-w-xl py-10 text-center">
        <Image src="/brand/heart.png" alt="" width={80} height={80} className="mx-auto h-20 w-20 object-contain" />
        <h1 className="mt-6 font-display text-5xl font-black">
          Thanks! <span className="font-extralight">We&apos;re on it.</span>
        </h1>
        <p className="mt-4 text-lg">
          Your logo is in good hands. We&apos;ll reply {TURNAROUND.firstReply} with a review of your request, and your first proof
          follows {TURNAROUND.firstProof}. A receipt is on its way to your inbox.
        </p>
        {order && /^[0-9a-f-]{36}$/.test(order) && (
          <Link href={`/account/orders/${order}`} className="vg-pill vg-pill--solid mt-8">See your order</Link>
        )}
      </div>
    </PortalShell>
  );
}
