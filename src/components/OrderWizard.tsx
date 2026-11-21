"use client";

import { useEffect, useState, useTransition } from "react";
import { PACKAGE_LIST, PACKAGES, money, isPackageId, type PackageId, TURNAROUND } from "@/lib/config";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { startCheckout, type Brief, type Draft } from "@/app/order/actions";
import SignInForm from "@/components/SignInForm";
import FileTypeIcons from "@/components/FileTypeIcons";

// The guided order form: package → upload → brief → review and pay.
// Progress is kept in this browser, so a visitor can leave to open the
// sign-in email and come back to exactly where they were.

type Step = "package" | "upload" | "brief" | "review";
const STEPS: { id: Step; label: string }[] = [
  { id: "package", label: "Package" },
  { id: "upload", label: "Upload" },
  { id: "brief", label: "Brief" },
  { id: "review", label: "Review & pay" },
];
const KEY = "vg-order-draft";
const emptyBrief: Brief = { businessName: "", fonts: "", fontsUnsure: false, colors: "", priorities: "", notes: "" };

type Upload = { path: string; name: string; preview?: string; lowRes?: boolean };

export default function OrderWizard({
  signedInEmail,
  initialPackage,
  initialStep,
  cancelled,
}: {
  signedInEmail: string | null;
  initialPackage: PackageId | null;
  initialStep: Step | null;
  cancelled: boolean;
}) {
  const [step, setStep] = useState<Step>(initialPackage ? "upload" : "package");
  const [pkg, setPkg] = useState<PackageId | null>(initialPackage);
  const [files, setFiles] = useState<Upload[]>([]);
  const [brief, setBrief] = useState<Brief>(emptyBrief);
  const [loaded, setLoaded] = useState(false);

  // Restore progress.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
      if (saved) {
        if (!initialPackage && isPackageId(saved.package)) setPkg(saved.package);
        if (Array.isArray(saved.files)) setFiles(saved.files.map((f: Upload) => ({ path: f.path, name: f.name })));
        if (saved.brief) setBrief({ ...emptyBrief, ...saved.brief });
        if (initialStep) setStep(initialStep);
      }
    } catch {}
    setLoaded(true);
  }, [initialPackage, initialStep]);

  // Save progress.
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ package: pkg, files: files.map(({ path, name }) => ({ path, name })), brief }));
    } catch {}
  }, [loaded, pkg, files, brief]);

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const canGo = (s: Step) =>
    s === "package" || (s === "upload" && !!pkg) || (s === "brief" && !!pkg && files.length > 0) ||
    (s === "review" && !!pkg && files.length > 0 && !!brief.businessName.trim());

  return (
    <div>
      <h1 className="font-display text-4xl font-black sm:text-5xl">
        Let&apos;s fix that logo <span className="font-extralight">in four easy steps</span>
      </h1>

      <ol className="mt-8 flex flex-wrap gap-2" aria-label="Order steps">
        {STEPS.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              disabled={!canGo(s.id)}
              onClick={() => setStep(s.id)}
              aria-current={s.id === step ? "step" : undefined}
              className={`rounded-full border-2 px-4 py-1.5 text-sm font-medium transition disabled:opacity-40 ${
                s.id === step ? "border-purple bg-purple text-white" : i < stepIndex ? "border-purple text-purple" : "border-black/20"
              }`}
            >
              {i + 1}. {s.label}
            </button>
          </li>
        ))}
      </ol>

      {cancelled && step === "review" && (
        <p className="mt-6 rounded-xl bg-peach p-3 text-sm">No worries, nothing was charged. Your order is saved right here.</p>
      )}

      <div className="mt-8">
        {step === "package" && (
          <PackageStep
            selected={pkg}
            onPick={(id) => {
              setPkg(id);
              setStep("upload");
            }}
          />
        )}
        {step === "upload" && (
          <UploadStep files={files} setFiles={setFiles} onNext={() => setStep("brief")} onBack={() => setStep("package")} />
        )}
        {step === "brief" && (
          <BriefStep brief={brief} setBrief={setBrief} onNext={() => setStep("review")} onBack={() => setStep("upload")} />
        )}
        {step === "review" && pkg && (
          <ReviewStep
            draft={{ package: pkg, files, brief }}
            signedInEmail={signedInEmail}
            onEdit={setStep}
          />
        )}
      </div>
    </div>
  );
}

function PackageStep({ selected, onPick }: { selected: PackageId | null; onPick: (id: PackageId) => void }) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {PACKAGE_LIST.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onPick(p.id)}
          className={`vg-card flex flex-col p-6 text-left ${selected === p.id ? "ring-4 ring-magenta/60" : ""}`}
        >
          <FileTypeIcons formats={p.formats} brandSheet={p.id === "all"} />
          <span className="mt-4 font-display text-2xl font-black">{p.name}</span>
          <span className="mt-1 text-2xl font-bold text-purple">{money(p.priceCents)}</span>
          <span className="mt-3 flex-1 text-sm">{p.bestFor}</span>
          <ul className="mt-4 space-y-1 text-sm font-medium">
            <li>✓ {p.rounds === null ? "Unlimited revision rounds" : `${p.rounds} revision round${p.rounds > 1 ? "s" : ""}`}</li>
            <li>✓ {p.formats.join(", ")}</li>
            {p.extras.map((e) => (
              <li key={e}>✓ {e}</li>
            ))}
          </ul>
          <span className="vg-pill mt-5 justify-center">{selected === p.id ? "Selected" : "Choose"}</span>
        </button>
      ))}
    </div>
  );
}

function UploadStep({
  files,
  setFiles,
  onNext,
  onBack,
}: {
  files: Upload[];
  setFiles: React.Dispatch<React.SetStateAction<Upload[]>>;
  onNext: () => void;
  onBack: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function add(list: FileList | null) {
    if (!list?.length) return;
    setError(null);
    setBusy(true);
    try {
      for (const file of Array.from(list).slice(0, 5 - files.length)) {
        const res = await fetch("/api/uploads", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ type: file.type, size: file.size }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Upload failed.");
        const { error: upErr } = await supabaseBrowser().storage.from("uploads").uploadToSignedUrl(json.path, json.token, file, {
          contentType: file.type,
        });
        if (upErr) throw new Error("Upload failed. Please try again.");
        const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
        const lowRes = preview ? await isLowRes(preview) : false;
        setFiles((prev) => [...prev, { path: json.path, name: file.name, preview, lowRes }]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-2xl font-black">Send us your logo</h2>
      <p className="mt-1">Your best-quality file: JPG, PNG, GIF, WEBP, SVG or PDF, up to 25 MB. Got a few versions? Add up to five.</p>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          add(e.dataTransfer.files);
        }}
        className={`mt-5 flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 text-center transition ${
          dragging ? "border-purple bg-pink" : "border-black/30 hover:border-purple"
        }`}
      >
        <span className="font-display text-xl font-black">{busy ? "Uploading…" : "Drop your logo here"}</span>
        <span className="mt-1 text-sm opacity-70">or click to choose a file</span>
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,application/pdf"
          className="sr-only"
          disabled={busy || files.length >= 5}
          onChange={(e) => add(e.target.files)}
        />
      </label>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {files.length > 0 && (
        <ul className="mt-6 space-y-3">
          {files.map((f) => (
            <li key={f.path} className="flex items-center gap-4 rounded-2xl border-2 border-black/10 p-3">
              {f.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.preview} alt="" className="h-14 w-14 rounded-lg object-contain" />
              ) : (
                <span className="grid h-14 w-14 place-items-center rounded-lg bg-pink text-xs font-bold">FILE</span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{f.name}</p>
                {f.lowRes && (
                  <p className="text-sm text-magenta">Squint… this one&apos;s pretty small. Got a bigger or sharper version?</p>
                )}
              </div>
              <button type="button" className="text-sm underline" onClick={() => setFiles((prev) => prev.filter((x) => x !== f))}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 flex gap-3">
        <button type="button" className="vg-pill" onClick={onBack}>Back</button>
        <button type="button" className="vg-pill vg-pill--solid disabled:opacity-50" disabled={!files.length || busy} onClick={onNext}>
          Next: the brief
        </button>
      </div>
    </div>
  );
}

function isLowRes(src: string) {
  return new Promise<boolean>((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve(Math.max(img.naturalWidth, img.naturalHeight) < 500);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

function BriefStep({
  brief,
  setBrief,
  onNext,
  onBack,
}: {
  brief: Brief;
  setBrief: React.Dispatch<React.SetStateAction<Brief>>;
  onNext: () => void;
  onBack: () => void;
}) {
  const set = (k: keyof Brief) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setBrief((b) => ({ ...b, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));
  const field = "w-full rounded-2xl border-2 border-black/20 px-4 py-3 outline-none focus:border-purple";

  return (
    <form
      className="max-w-2xl space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        onNext();
      }}
    >
      <h2 className="font-display text-2xl font-black">Tell us about it</h2>
      <label className="block">
        <span className="font-medium">Business name *</span>
        <input required className={field} value={brief.businessName} onChange={set("businessName")} maxLength={120} />
      </label>
      <label className="block">
        <span className="font-medium">Fonts used</span>
        <input className={field} value={brief.fonts} onChange={set("fonts")} disabled={brief.fontsUnsure} placeholder="e.g. Futura Bold" />
        <span className="mt-2 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={brief.fontsUnsure} onChange={set("fontsUnsure")} /> Not sure, you figure it out
        </span>
      </label>
      <label className="block">
        <span className="font-medium">Brand colors</span>
        <input className={field} value={brief.colors} onChange={set("colors")} placeholder="Hex codes if you have them, e.g. #6F07E5" />
      </label>
      <label className="block">
        <span className="font-medium">What matters most?</span>
        <textarea className={field} rows={3} value={brief.priorities} onChange={set("priorities")} placeholder="Color accuracy, making this logo happy…" />
      </label>
      <label className="block">
        <span className="font-medium">Anything else?</span>
        <textarea className={field} rows={3} value={brief.notes} onChange={set("notes")} />
      </label>
      <div className="flex gap-3 pt-2">
        <button type="button" className="vg-pill" onClick={onBack}>Back</button>
        <button className="vg-pill vg-pill--solid">Next: review</button>
      </div>
    </form>
  );
}

function ReviewStep({
  draft,
  signedInEmail,
  onEdit,
}: {
  draft: { package: PackageId; files: Upload[]; brief: Brief };
  signedInEmail: string | null;
  onEdit: (s: Step) => void;
}) {
  const p = PACKAGES[draft.package];
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function pay() {
    setError(null);
    const payload: Draft = { package: draft.package, files: draft.files.map(({ path, name }) => ({ path, name })), brief: draft.brief };
    start(async () => {
      try {
        const res = await startCheckout(payload);
        if (res.url) window.location.assign(res.url);
        else setError(res.error ?? "Something went wrong. Please try again.");
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <Row title="Package" onEdit={() => onEdit("package")}>
          {p.name}: {p.formats.join(", ")}
        </Row>
        <Row title="Logo" onEdit={() => onEdit("upload")}>
          {draft.files.map((f) => f.name).join(", ")}
        </Row>
        <Row title="Brief" onEdit={() => onEdit("brief")}>
          <strong>{draft.brief.businessName}</strong>
          {draft.brief.fontsUnsure ? " · fonts: not sure" : draft.brief.fonts ? ` · fonts: ${draft.brief.fonts}` : ""}
          {draft.brief.colors && ` · colors: ${draft.brief.colors}`}
        </Row>
      </div>

      <aside className="vg-card h-fit p-6">
        <p className="text-sm opacity-70">Total</p>
        <p className="font-display text-4xl font-black">{money(p.priceCents)}</p>
        <p className="mt-3 text-sm">
          We reply {TURNAROUND.firstReply} with a review of your request, and your first proof follows {TURNAROUND.firstProof}.
          Full refund through the first round.
        </p>
        <div className="mt-5">
          {signedInEmail ? (
            <>
              <p className="mb-3 text-sm">Signed in as <strong>{signedInEmail}</strong></p>
              <button onClick={pay} disabled={pending} className="vg-pill vg-pill--solid w-full justify-center disabled:opacity-60">
                {pending ? "Heading to checkout…" : `Pay ${money(p.priceCents)}`}
              </button>
            </>
          ) : (
            <>
              <p className="mb-3 text-sm">
                Last thing: your email. We&apos;ll send a link that creates your account, where your proofs and files will live.
              </p>
              <SignInForm next="/order?step=review" cta="Send my link" />
            </>
          )}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      </aside>
    </div>
  );
}

function Row({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-black/10 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium opacity-70">{title}</p>
        <button type="button" className="text-sm underline" onClick={onEdit}>Edit</button>
      </div>
      <p className="mt-1">{children}</p>
    </div>
  );
}
