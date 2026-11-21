"use client";

import { useState, useTransition } from "react";
import { sendMessage } from "@/app/account/actions";
import { adminSendMessage } from "@/app/admin/actions";
import type { MessageRow } from "@/lib/orders";

export default function Messages({ orderId, messages, asAdmin = false }: { orderId: string; messages: MessageRow[]; asAdmin?: boolean }) {
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <section>
      <h2 className="font-display text-2xl font-black">Messages</h2>
      <ul className="mt-4 space-y-3">
        {messages.length === 0 && <li className="opacity-60">No messages yet.</li>}
        {messages.map((m) => {
          const mine = asAdmin ? m.from_vectogo : !m.from_vectogo;
          return (
            <li key={m.id} className={`max-w-[85%] rounded-2xl p-3 ${mine ? "ml-auto bg-purple text-white" : "bg-pink"}`}>
              <p className="whitespace-pre-wrap">{m.body}</p>
              <p className="mt-1 text-xs opacity-70">
                {m.from_vectogo ? "Vectogo" : asAdmin ? "Customer" : "You"} · {new Date(m.created_at).toLocaleString()}
              </p>
            </li>
          );
        })}
      </ul>
      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          start(async () => {
            const res = await (asAdmin ? adminSendMessage(orderId, body) : sendMessage(orderId, body));
            if (res.error) setError(res.error);
            else setBody("");
          });
        }}
      >
        <textarea
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={asAdmin ? "Message the customer…" : "Ask us anything…"}
          className="min-w-0 flex-1 rounded-2xl border-2 border-black/20 p-3 outline-none focus:border-purple"
        />
        <button disabled={pending || !body.trim()} className="vg-pill vg-pill--solid justify-center disabled:opacity-50">Send</button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  );
}
