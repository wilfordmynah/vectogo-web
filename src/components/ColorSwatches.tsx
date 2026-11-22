import { parseColors } from "@/lib/colors";

/** Shows a brief's brand colors as little swatches. Falls back to the text as typed. */
export default function ColorSwatches({ value }: { value?: string }) {
  const colors = parseColors(value);
  if (!colors.length) return value ? <span>{value}</span> : null;
  return (
    <span className="flex flex-wrap gap-2">
      {colors.map((c) => (
        <span key={c} className="inline-flex items-center gap-1.5 rounded-full border border-black/15 py-0.5 pl-0.5 pr-2.5 text-xs font-medium">
          <span className="h-5 w-5 rounded-full border border-black/15" style={{ background: c }} aria-hidden />
          {c}
        </span>
      ))}
    </span>
  );
}
