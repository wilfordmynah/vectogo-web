"use client";

import { useEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";

// The signature moment: a blocky, sad, pixelated face snaps into a smooth,
// happy vector face, with anchor points flashing on as it "gets vectorized".

const GRID = 14;
const SIZE = 200;
const CELL = SIZE / GRID;

type Pixel = { x: number; y: number; fill: string };

function buildPixels(): Pixel[] {
  const pixels: Pixel[] = [];
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      const cx = col * CELL + CELL / 2;
      const cy = row * CELL + CELL / 2;
      const inFace = Math.hypot(cx - 100, cy - 100) <= 100;
      if (!inFace) continue;
      const inEye =
        Math.hypot(cx - 70, cy - 78) <= 12 || Math.hypot(cx - 130, cy - 78) <= 12;
      const d = Math.hypot(cx - 100, cy - 172);
      const inFrown = d >= 36 && d <= 50 && cy < 152;
      pixels.push({
        x: col * CELL,
        y: row * CELL,
        fill: inEye || inFrown ? "#ffffff" : "var(--vg-purple)",
      });
    }
  }
  return pixels;
}

const FROWN = "M62 150 Q100 112 138 150";
const SMILE = "M62 126 Q100 172 138 126";

export default function HeroFace() {
  const root = useRef<SVGSVGElement>(null);
  const pixels = useMemo(buildPixels, []);

  useEffect(() => {
    const svg = root.current;
    if (!svg) return;
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const q = gsap.utils.selector(svg);
      const tl = gsap.timeline({ delay: 0.6, repeat: -1, repeatDelay: 2.5 });
      tl.set(q(".vg-smooth"), { opacity: 0, scale: 0.92, transformOrigin: "50% 50%" })
        .set(q(".vg-mouth"), { attr: { d: FROWN } })
        .set(q(".vg-pixel"), { opacity: 1, scale: 1, transformOrigin: "50% 50%" })
        .set(q(".vg-anchor"), { opacity: 0 })
        // a little sad wobble
        .to(q(".vg-pixels"), { x: -3, duration: 0.08, repeat: 5, yoyo: true, ease: "none" })
        // anchors appear around the face: "we're on it"
        .to(q(".vg-anchor"), { opacity: 1, duration: 0.25, stagger: 0.08 })
        // pixels snap away from the center out
        .to(q(".vg-pixel"), {
          opacity: 0,
          scale: 0.2,
          duration: 0.5,
          ease: "power2.in",
          stagger: { each: 0.004, from: "center", grid: "auto" },
        })
        .to(q(".vg-smooth"), { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(2)" }, "<0.3")
        // and it cheers up
        .to(q(".vg-mouth"), { attr: { d: SMILE }, duration: 0.7, ease: "elastic.out(1, 0.5)" }, "-=0.2")
        .to(q(".vg-anchor"), { opacity: 0, duration: 0.4, stagger: 0.05 }, "+=0.6")
        // hold the happy face, then go back to pixels for the next loop
        .to(q(".vg-smooth"), { opacity: 0, duration: 0.4 }, "+=3")
        .to(q(".vg-pixel"), { opacity: 1, scale: 1, duration: 0.3, stagger: { each: 0.002, from: "random" } }, "<");
      return () => tl.kill();
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      // No motion: just show the finished, happy face.
      gsap.set(svg.querySelectorAll(".vg-pixel"), { opacity: 0 });
      gsap.set(svg.querySelectorAll(".vg-smooth"), { opacity: 1 });
      gsap.set(svg.querySelectorAll(".vg-mouth"), { attr: { d: SMILE } });
    });

    return () => mm.revert();
  }, []);

  return (
    <svg
      ref={root}
      viewBox="-30 -30 260 260"
      className="w-full max-w-[420px] overflow-visible"
      role="img"
      aria-label="A blurry sad face turning into a crisp happy face"
    >
      <g className="vg-pixels">
        {pixels.map((p, i) => (
          <rect
            key={i}
            className="vg-pixel"
            x={p.x}
            y={p.y}
            width={CELL + 0.5}
            height={CELL + 0.5}
            fill={p.fill}
          />
        ))}
      </g>

      <g className="vg-smooth" style={{ opacity: 0 }}>
        <circle cx="100" cy="100" r="100" fill="var(--vg-purple)" />
        <circle cx="70" cy="78" r="12" fill="#fff" />
        <circle cx="130" cy="78" r="12" fill="#fff" />
        <path
          className="vg-mouth"
          d={FROWN}
          fill="none"
          stroke="#fff"
          strokeWidth="13"
          strokeLinecap="round"
        />
      </g>

      {/* Bezier anchor points and handles, like the spiky smiley artwork */}
      <g stroke="var(--vg-magenta)" strokeWidth="1.5" fill="#fff">
        {[
          [100, 0, 45, 0, 155, 0],
          [200, 100, 200, 45, 200, 155],
          [100, 200, 155, 200, 45, 200],
          [0, 100, 0, 155, 0, 45],
        ].map(([x, y, h1x, h1y, h2x, h2y], i) => (
          <g key={i} className="vg-anchor" style={{ opacity: 0 }}>
            <line x1={h1x} y1={h1y} x2={h2x} y2={h2y} />
            <circle cx={h1x} cy={h1y} r="4" />
            <circle cx={h2x} cy={h2y} r="4" />
            <rect x={x - 6} y={y - 6} width="12" height="12" />
          </g>
        ))}
      </g>
    </svg>
  );
}
