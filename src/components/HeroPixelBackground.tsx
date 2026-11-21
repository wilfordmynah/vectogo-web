"use client";

import { useEffect, useRef } from "react";

// The hero background starts as big chunky pixels and gets sharper as you
// scroll, until it's a smooth iridescent gradient: the brand story
// (fuzzy logo → crisp logo) told by the page itself.

const BLOBS = [
  { x: 0.12, y: 0.18, r: 0.55, color: "246,176,240" }, // soft pink
  { x: 0.88, y: 0.3, r: 0.5, color: "170,240,214" }, // mint
  { x: 0.45, y: 0.95, r: 0.55, color: "255,198,166" }, // peach
  { x: 0.7, y: 0.75, r: 0.35, color: "205,184,255" }, // lavender
];

const MAX_BLOCK = 72; // pixel size at the top of the page
const SMOOTH_AT = 0.75; // fraction of the hero scrolled when it's fully smooth

export default function HeroPixelBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const source = document.createElement("canvas");
    const small = document.createElement("canvas");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;

    function paintSource(w: number, h: number) {
      source.width = w;
      source.height = h;
      const s = source.getContext("2d")!;
      s.fillStyle = "#ffffff";
      s.fillRect(0, 0, w, h);
      const size = Math.max(w, h);
      for (const b of BLOBS) {
        const g = s.createRadialGradient(b.x * w, b.y * h, 0, b.x * w, b.y * h, b.r * size);
        g.addColorStop(0, `rgba(${b.color},1)`);
        g.addColorStop(1, `rgba(${b.color},0)`);
        s.fillStyle = g;
        s.fillRect(0, 0, w, h);
      }
    }

    function draw() {
      frame = 0;
      const host = canvas!.parentElement!;
      const w = host.clientWidth;
      const h = host.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas!.width !== Math.round(w * dpr) || canvas!.height !== Math.round(h * dpr)) {
        canvas!.width = Math.round(w * dpr);
        canvas!.height = Math.round(h * dpr);
        paintSource(canvas!.width, canvas!.height);
      }

      const progress = reduce ? 1 : Math.min(1, Math.max(0, window.scrollY / (h * SMOOTH_AT)));
      // Ease out so it sharpens quickly at first, then settles.
      const eased = 1 - Math.pow(1 - progress, 2);
      const block = Math.max(1, MAX_BLOCK * dpr * (1 - eased));

      if (block <= 1.5) {
        ctx!.imageSmoothingEnabled = true;
        ctx!.drawImage(source, 0, 0);
        return;
      }
      // Draw tiny, then scale up without smoothing: instant pixel art.
      small.width = Math.max(1, Math.ceil(canvas!.width / block));
      small.height = Math.max(1, Math.ceil(canvas!.height / block));
      const sctx = small.getContext("2d")!;
      sctx.imageSmoothingEnabled = true;
      sctx.drawImage(source, 0, 0, small.width, small.height);
      ctx!.imageSmoothingEnabled = false;
      ctx!.drawImage(small, 0, 0, small.width * block, small.height * block);
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 -z-10 h-full w-full [mask-image:linear-gradient(to_bottom,black_75%,transparent)]" />;
}
