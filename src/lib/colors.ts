// Brand color helpers. Colors are stored in the brief as "#RRGGBB, #RRGGBB".

/** "#6f07e5", "6F07E5" or "#abc" → "#6F07E5". Anything else → null. */
export function normalizeHex(input: string): string | null {
  let h = input.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.split("").map((c) => c + c).join("");
  return /^[0-9a-f]{6}$/i.test(h) ? `#${h.toUpperCase()}` : null;
}

/** Every hex color found in a brief's colors text, without repeats. */
export function parseColors(text: string | undefined): string[] {
  const found = (text ?? "").match(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi) ?? [];
  return [...new Set(found.map((c) => normalizeHex(c)).filter((c): c is string => !!c))];
}

export const formatColors = (colors: string[]) => colors.join(", ");

/** Picks a logo's main colors in the browser (ignoring white backgrounds and see-through areas). */
export async function extractTopColors(src: string, count = 3): Promise<string[]> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new window.Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });
  const natW = img.naturalWidth || 300;
  const natH = img.naturalHeight || 300;
  const scale = Math.min(1, 160 / Math.max(natW, natH));
  const w = Math.max(1, Math.round(natW * scale));
  const h = Math.max(1, Math.round(natH * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  // Group similar pixels into buckets, then take the biggest distinct ones.
  const buckets = new Map<number, { r: number; g: number; b: number; n: number }>();
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a < 200) continue; // see-through
    if (r > 235 && g > 235 && b > 235) continue; // white background
    const key = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
    const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 };
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    bucket.n++;
    buckets.set(key, bucket);
    total++;
  }
  const ranked = [...buckets.values()].filter((b) => b.n >= total * 0.005).sort((a, b) => b.n - a.n);
  const picked: [number, number, number][] = [];
  for (const b of ranked) {
    const c: [number, number, number] = [b.r / b.n, b.g / b.n, b.b / b.n];
    const distinct = picked.every((p) => Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]) > 56);
    if (distinct) picked.push(c);
    if (picked.length === count) break;
  }
  return picked.map(([r, g, b]) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase()}`);
}
