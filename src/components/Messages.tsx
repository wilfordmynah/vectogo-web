"use client";

import { useRef, useState, useTransition } from "react";
import { messageUploadUrl, sendMessage } from "@/app/account/actions";
import { adminSendMessage } from "@/app/admin/actions";
import type { MessageRow } from "@/lib/orders";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { fileNameOf, isImagePath } from "@/lib/uploads";

export default function Messages({
  orderId,
  messages,
  fileUrls = {},
  asAdmin = false,
}: {
  orderId: string;
  messages: MessageRow[];
  /** Short-lived download links for attached files, by storage path. */
  fileUrls?: Record<string, string>;
  asAdmin?: boolean;
}) {
  const [body, setBody] = useState("");
  const [attached, setAttached] = useState<{ path: string; name: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);

  async function attach(list: FileList | null) {
    if (!list?.length) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(list).slice(0, 10 - attached.length)) {
        const res = await messageUploadUrl(orderId, { name: file.name, size: file.size });
        if (!res.path || !res.token) throw new Error(res.error ?? "Upload failed.");
        const { error: upErr } = await supabaseBrowser()
          .storage.from("uploads")
          .uploadToSignedUrl(res.path, res.token, file, { contentType: file.type || "application/octet-stream" });
        if (upErr) throw new Error(`Upload failed: ${upErr.message}`);
        const path = res.path;
        setAttached((prev) => [...prev, { path, name: file.name }]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (picker.current) picker.current.value = "";
    }
  }

  const canSend = !pending && !uploading && (!!body.trim() || attached.length > 0);

  return (
    <section>
      <h2 className="font-display text-2xl font-black">Messages</h2>
      <ul className="mt-4 space-y-3">
        {messages.length === 0 && <li className="opacity-60">No messages yet.</li>}
        {messages.map((m) => {
          const mine = asAdmin ? m.from_vectogo : !m.from_vectogo;
          return (
            <li key={m.id} className={`max-w-[85%] rounded-2xl p-3 ${mine ? "ml-auto bg-purple text-white" : "bg-pink"}`}>
              {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
              {!!m.attachments?.length && (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {m.attachments.map((p) => (
                    <li key={p}>
                      <AttachmentChip path={p} url={fileUrls[p]} light={mine} />
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-1 text-xs opacity-70">
                {m.from_vectogo ? "Vectogo" : asAdmin ? "Customer" : "You"} · {new Date(m.created_at).toLocaleString()}
              </p>
            </li>
          );
        })}
      </ul>
      <form
        className="mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          start(async () => {
            const res = await (asAdmin
              ? adminSendMessage(orderId, body)
              : sendMessage(orderId, body, attached.map((a) => a.path)));
            if (res.error) setError(res.error);
            else {
              setBody("");
              setAttached([]);
            }
          });
        }}
      >
        <textarea
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={asAdmin ? "Message the customer…" : "Ask us anything, or send another file…"}
          className="w-full rounded-2xl border-2 border-black/20 p-3 outline-none focus:border-purple"
        />
        {attached.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-2">
            {attached.map((a) => (
              <li key={a.path} className="flex items-center gap-1 rounded-full bg-pink py-1 pl-3 pr-1 text-sm">
                📎 {a.name}
                <button
                  type="button"
                  className="grid h-6 w-6 place-items-center rounded-full text-lg leading-none hover:bg-white"
                  aria-label={`Remove ${a.name}`}
                  onClick={() => setAttached((prev) => prev.filter((x) => x !== a))}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {!asAdmin && (
            <>
              <input ref={picker} type="file" multiple className="sr-only" id={`attach-${orderId}`} onChange={(e) => attach(e.target.files)} />
              <label htmlFor={`attach-${orderId}`} className={`vg-pill cursor-pointer ${uploading ? "opacity-60" : ""}`}>
                {uploading ? "Uploading…" : "📎 Attach files"}
              </label>
            </>
          )}
          <button disabled={!canSend} className="vg-pill vg-pill--solid ml-auto justify-center disabled:opacity-50">
            {pending ? "Sending…" : "Send"}
          </button>
        </div>
        {!asAdmin && <p className="mt-1 text-xs opacity-60">Images, PDF, AI, EPS, PSD, fonts or ZIP, up to 25 MB each.</p>}
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  );
}

function AttachmentChip({ path, url, light }: { path: string; url?: string; light: boolean }) {
  const name = fileNameOf(path);
  const inner =
    url && isImagePath(path) ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={name} className="h-20 w-20 rounded-lg bg-white object-contain" />
    ) : (
      <span className={`inline-block rounded-full px-3 py-1 text-sm ${light ? "bg-white/20" : "bg-white"}`}>📎 {name}</span>
    );
  return url ? (
    <a href={url} target="_blank" rel="noreferrer" title={name}>
      {inner}
    </a>
  ) : (
    inner
  );
}
