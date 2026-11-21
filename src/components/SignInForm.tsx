"use client";

import { useActionState } from "react";
import { sendSignInLink, type LoginState } from "@/app/login/actions";

export default function SignInForm({ next, cta = "Email me a sign-in link" }: { next: string; cta?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendSignInLink, {});

  if (state.sent) {
    return (
      <div className="rounded-2xl bg-pink p-5" role="status">
        <p className="font-display text-xl font-black">Check your inbox!</p>
        <p className="mt-1">
          We sent a sign-in link to <strong>{state.sent}</strong>. Open it on this device to carry on.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="next" value={next} />
      <label className="sr-only" htmlFor="email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@yourbusiness.com"
        className="w-full rounded-full border-2 border-black px-5 py-3 outline-none focus:border-purple"
      />
      <button disabled={pending} className="vg-pill vg-pill--solid justify-center disabled:opacity-60">
        {pending ? "Sending…" : cta}
      </button>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.devLink && (
        <div className="rounded-2xl border-2 border-dashed border-purple p-4 text-sm">
          <p className="font-bold">Testing on your computer?</p>
          <p className="mt-1">Skip the email and sign in directly. This button only appears on your computer, never on the live site.</p>
          <a href={state.devLink} className="vg-pill vg-pill--solid mt-3 justify-center">Sign in as this email</a>
        </div>
      )}
    </form>
  );
}
