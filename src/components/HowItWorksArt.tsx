"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

// Three little looping cartoons for "How it works". Each one plays while it's
// on screen and pauses when it isn't. With "reduce motion" on, each shows its
// final frame instead.

const PURPLE = "var(--vg-purple)";
const MAGENTA = "var(--vg-magenta)";
const INK = "var(--vg-ink)";

const SUN = "#7034db";
const SUN_RAYS =
  "M560.78,265.54l81.79-119.38c14.19-20.72,46.64-10.18,45.95,14.93l-4.01,144.66c-.49,17.69,16.95,30.35,33.62,24.42l136.34-48.51c23.66-8.42,43.72,19.19,28.4,39.09l-88.27,114.68c-10.79,14.02-4.13,34.52,12.84,39.52l138.82,40.89c24.09,7.1,24.09,41.22,0,48.32l-138.82,40.89c-16.97,5-23.63,25.5-12.84,39.52l88.27,114.68c15.32,19.9-4.74,47.51-28.4,39.09l-136.34-48.51c-16.67-5.93-34.11,6.73-33.62,24.42l4.01,144.66c.69,25.11-31.76,35.65-45.95,14.93l-81.79-119.38c-10.01-14.6-31.55-14.6-41.56,0l-81.79,119.38c-14.19,20.72-46.64,10.18-45.95-14.93l4.01-144.66c.49-17.69-16.95-30.35-33.62-24.42l-136.34,48.51c-23.66,8.42-43.72-19.19-28.4-39.09l88.27-114.68c10.79-14.02,4.13-34.52-12.84-39.52l-138.82-40.89c-24.09-7.1-24.09-41.22,0-48.32l138.82-40.89c16.97-5,23.63-25.5,12.84-39.52l-88.27-114.68c-15.32-19.9,4.74-47.51,28.4-39.09l136.34,48.51c16.67,5.93,34.11-6.73,33.62-24.42l-4.01-144.66c-.69-25.11,31.76-35.65,45.95-14.93l81.79,119.38C529.23,280.14,550.77,280.14,560.78,265.54Z";

/**
 * Zane's silly sun, drawn at (cx, cy). size is the width it takes up.
 * Parts have class names so scenes can animate them: sun-rays, sun-eye
 * (the open one), sun-wink, sun-tongue.
 */
function SillySun({ cx, cy, size, className = "sun" }: { cx: number; cy: number; size: number; className?: string }) {
  const k = size / 840; // the drawing is about 840 units across
  const sw = 3.6 / k; // keep the line about as thick as the other drawings
  const line = { fill: "none", stroke: SUN, strokeWidth: sw, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <g className={className} transform={`translate(${cx} ${cy})`}>
      <g transform={`scale(${k}) translate(-540 -540)`}>
        <path className="sun-rays" d={SUN_RAYS} {...line} fill="#fff" />
        <circle className="sun-eye" cx="636.8" cy="482.45" r="57.55" {...line} />
        <path className="sun-wink" d="M500.75,482.45c0-31.79-25.76-57.56-57.55-57.56-31.79,0-57.55,25.77-57.55,57.56" {...line} />
        <path d="M445.83,609.01c15.47,36.75,51.8,62.55,94.17,62.55s78.7-25.8,94.17-62.55" {...line} />
        <path className="sun-tongue" d="M564.36,668.62s29.47,62.59,63.65,38.13c34.17-24.46-14.47-66.46-14.47-66.46" {...line} />
      </g>
    </g>
  );
}

/** 1. Send it: a pixelated Silly sun file hops into the upload tray. */
export function SendItArt() {
  const ref = useScene((q) => {
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.6 });
    tl.set(q(".file"), { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, transformOrigin: "50% 50%" })
      .set(q(".check"), { scale: 0, transformOrigin: "50% 50%" })
      .set(q(".speed"), { opacity: 0 })
      // nervous wiggle
      .to(q(".file"), { rotation: -6, duration: 0.12, repeat: 5, yoyo: true, ease: "sine.inOut" })
      // crouch, then jump
      .to(q(".file"), { scaleY: 0.85, y: 6, duration: 0.18, ease: "power2.in" })
      .to(q(".speed"), { opacity: 1, duration: 0.1 })
      .to(q(".file"), {
        motionPath: { path: q(".arc")[0] as SVGPathElement, align: q(".arc")[0] as SVGPathElement, alignOrigin: [0.5, 0.5] },
        scale: 0.35,
        rotation: 200,
        duration: 0.75,
        ease: "power1.inOut",
      })
      .to(q(".speed"), { opacity: 0, duration: 0.2 }, "<0.3")
      .to(q(".file"), { opacity: 0, duration: 0.1 })
      // tray gulps
      .to(q(".tray"), { scaleY: 0.8, scaleX: 1.12, transformOrigin: "50% 100%", duration: 0.12, yoyo: true, repeat: 1 })
      // tray gives a thumbs up
      .to(q(".check"), { scale: 1, duration: 0.4, ease: "back.out(3)" })
      .to({}, { duration: 1 });
    return tl;
  }, (q) => gsap.set(q(".check"), { scale: 1, transformOrigin: "50% 50%" }));

  return (
    <svg ref={ref} viewBox="20 40 210 120" className="h-44 w-full overflow-visible" role="img" aria-label="A pixelated sun logo jumping into the upload tray">
      <path className="arc" d="M62 120 C 80 20, 160 10, 186 62" fill="none" stroke="none" />
      {/* speed lines */}
      <g className="speed" stroke={MAGENTA} strokeWidth="4" strokeLinecap="round" opacity="0">
        <path d="M40 96 l-16 4" />
        <path d="M42 112 l-20 2" />
        <path d="M44 128 l-14 0" />
      </g>
      {/* upload tray */}
      <g className="tray">
        <rect x="150" y="62" width="76" height="52" rx="14" fill="#fff" stroke={INK} strokeWidth="4" />
        <path d="M188 100 V76 M178 86 l10 -10 l10 10" stroke={PURPLE} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g className="check">
        <circle cx="216" cy="56" r="14" fill={MAGENTA} />
        <path d="M209 56 l5 5 l9 -10" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* the file: a blurry, pixelly Silly */}
      <g className="file">
        <path d="M38 82 h34 l14 14 v46 a6 6 0 0 1 -6 6 h-42 a6 6 0 0 1 -6 -6 v-54 a6 6 0 0 1 6 -6 z" fill="#fff" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M72 82 v14 h14" fill="none" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <PixelSun cx={59} cy={118} size={40} fill={SUN} />
      </g>
    </svg>
  );
}

/** 2. We get to work: the pen traces part of the pixelated Silly as a smooth line. */
export function GetToWorkArt() {
  const CX = 125, CY = 92, SIZE = 124;
  const { k, transform } = sunTransform(CX, CY, SIZE);
  const TRACE = 0.42; // how much of the outline gets traced each loop
  const STOPS = [0, 0.14, 0.28, TRACE]; // where anchor points land

  const ref = useScene((q) => {
    const rays = q(".trace")[0] as SVGPathElement;
    const len = rays.getTotalLength();
    placeAnchors(q, rays, len, STOPS, k);
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.6 });
    tl.set(rays, { strokeDasharray: len, strokeDashoffset: len })
      .set(q(".anchor"), { scale: 0, transformOrigin: "50% 50%" })
      .set(q(".handle"), { opacity: 0 })
      .set(q(".pixels"), { opacity: 0.5 })
      .set(q(".pen"), { opacity: 1, x: 0, y: 0, rotation: 0 })
      .to(q(".pen"), {
        motionPath: { path: rays, align: rays, alignOrigin: [0.1, 0.9], start: 0, end: TRACE },
        duration: 2.4,
        ease: "power1.inOut",
      })
      .to(rays, { strokeDashoffset: len * (1 - TRACE), duration: 2.4, ease: "power1.inOut" }, "<")
      .to(q(".anchor"), { scale: 1, duration: 0.25, stagger: 2.4 / (STOPS.length - 1), ease: "back.out(3)" }, "<")
      .to(q(".handle"), { opacity: 1, duration: 0.2, stagger: 2.4 / (STOPS.length - 1) }, "<0.1")
      .to(q(".pen"), { y: "-=12", rotation: -15, duration: 0.2, yoyo: true, repeat: 1 })
      .to({}, { duration: 1.4 })
      .to([rays, q(".anchor"), q(".handle")].flat(), { opacity: 0, duration: 0.3 })
      .set([rays, q(".anchor"), q(".handle")].flat(), { opacity: 1 });
    return tl;
  }, (q) => {
    const rays = q(".trace")[0] as SVGPathElement;
    const len = rays.getTotalLength();
    placeAnchors(q, rays, len, STOPS, k);
    gsap.set(rays, { strokeDasharray: len, strokeDashoffset: len * (1 - TRACE) });
    gsap.set(q(".pixels"), { opacity: 0.5 });
  });

  return (
    <svg ref={ref} viewBox="20 24 210 136" className="h-44 w-full overflow-visible" role="img" aria-label="A pen tool tracing the pixelated sun as a smooth vector line">
      <PixelSun cx={CX} cy={CY} size={SIZE} fill={MAGENTA} className="pixels" />
      <g transform={transform}>
        <path className="trace" d={SUN_RAYS} fill="none" stroke={SUN} strokeWidth={5 / k} strokeLinecap="round" strokeLinejoin="round" />
        {STOPS.map((_, i) => (
          <g key={i}>
            <g className="handle" stroke={MAGENTA} strokeWidth={1.5 / k}>
              <line className="handle-line" />
              <circle className="handle-a" r={3.5 / k} fill="#fff" />
              <circle className="handle-b" r={3.5 / k} fill="#fff" />
            </g>
            <rect className="anchor" width={10 / k} height={10 / k} fill="#fff" stroke={INK} strokeWidth={2.5 / k} />
          </g>
        ))}
      </g>
      {/* pen nib */}
      <g className="pen">
        <path d="M0 0 l10 -26 h12 l10 26 l-16 12 z" fill="#fff" stroke={INK} strokeWidth="3" strokeLinejoin="round" transform="translate(-16 -12) rotate(20 16 12)" />
        <circle cx="0" cy="-4" r="3" fill={INK} transform="translate(0 -6)" />
      </g>
    </svg>
  );
}

/** Puts each anchor square (and its curve handles) at a point along the path. */
function placeAnchors(q: Q, path: SVGPathElement, len: number, stops: number[], k: number) {
  const anchors = q(".anchor");
  const handles = q(".handle");
  const half = 5 / k;
  const reach = 16 / k;
  stops.forEach((t, i) => {
    const at = Math.min(len - 1, Math.max(1, t * len));
    const p = path.getPointAtLength(at);
    const a = path.getPointAtLength(at - 1);
    const b = path.getPointAtLength(at + 1);
    const dx = b.x - a.x, dy = b.y - a.y;
    const d = Math.hypot(dx, dy) || 1;
    const ux = (dx / d) * reach, uy = (dy / d) * reach;
    anchors[i].setAttribute("x", String(p.x - half));
    anchors[i].setAttribute("y", String(p.y - half));
    const h = handles[i];
    const line = h.querySelector(".handle-line")!;
    line.setAttribute("x1", String(p.x - ux));
    line.setAttribute("y1", String(p.y - uy));
    line.setAttribute("x2", String(p.x + ux));
    line.setAttribute("y2", String(p.y + uy));
    h.querySelector(".handle-a")!.setAttribute("cx", String(p.x - ux));
    h.querySelector(".handle-a")!.setAttribute("cy", String(p.y - uy));
    h.querySelector(".handle-b")!.setAttribute("cx", String(p.x + ux));
    h.querySelector(".handle-b")!.setAttribute("cy", String(p.y + uy));
  });
}

/** 3. Good to go: the silly sun, files popping out, confetti. */
export function GoodToGoArt() {
  const ref = useScene((q) => {
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.8 });
    tl.set(q(".tile"), { x: 0, y: 0, scale: 0, rotation: 0, transformOrigin: "50% 50%" })
      .set(q(".confetti"), { x: 0, y: 0, opacity: 0, rotation: 0, transformOrigin: "50% 50%" })
      .set(q(".face"), { scale: 0.9, transformOrigin: "50% 50%" })
      .set(q(".face .sun-rays"), { rotation: 0, transformOrigin: "50% 50%" })
      .set(q(".face .sun-tongue"), { rotation: 0, transformOrigin: "0% 40%" })
      .to(q(".face"), { scale: 1.08, duration: 0.25, ease: "power2.out" })
      .to(q(".face"), { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.4)" })
      .to(q(".face .sun-rays"), { rotation: 180, duration: 1.6, ease: "power3.out" }, "<")
      .to(q(".tile"), {
        scale: 1,
        x: (i) => [-78, 0, 78][i],
        y: (i) => [-10, -64, -10][i],
        rotation: (i) => [-14, 0, 14][i],
        duration: 0.6,
        stagger: 0.08,
        ease: "back.out(2.5)",
      }, "<")
      .to(q(".confetti"), {
        opacity: 1,
        x: () => gsap.utils.random(-110, 110),
        y: () => gsap.utils.random(-80, -20),
        rotation: () => gsap.utils.random(-180, 180),
        duration: 0.6,
        ease: "power2.out",
      }, "<")
      .to(q(".confetti"), { y: "+=90", opacity: 0, duration: 1.1, ease: "power1.in" })
      .to(q(".face .sun-eye"), { scaleY: 0.1, transformOrigin: "50% 50%", duration: 0.1, yoyo: true, repeat: 1 }, "<0.2")
      .to(q(".face .sun-tongue"), { rotation: 20, duration: 0.12, yoyo: true, repeat: 5, ease: "sine.inOut" }, "<")
      .to({}, { duration: 1 });
    return tl;
  }, (q) => {
    gsap.set(q(".tile"), { scale: 1, x: (i: number) => [-78, 0, 78][i], y: (i: number) => [-10, -64, -10][i], rotation: (i: number) => [-14, 0, 14][i], transformOrigin: "50% 50%" });
    gsap.set(q(".confetti"), { opacity: 0 });
  });

  const tiles = ["JPG", "SVG", "PNG"];
  const confettiColors = [PURPLE, MAGENTA, "#FF0081", "#B000FF", "#FFD23F", "#2DD4BF"];
  return (
    <svg ref={ref} viewBox="20 40 200 120" className="h-44 w-full overflow-visible" role="img" aria-label="A silly sun with crisp files popping out">
      {tiles.map((t) => (
        <g key={t} className="tile">
          <rect x="98" y="96" width="44" height="34" rx="8" fill={INK} />
          <text x="120" y="118" textAnchor="middle" fontSize="13" fontWeight="800" fontStyle="italic" fill="#fff">{t}</text>
        </g>
      ))}
      {Array.from({ length: 14 }, (_, i) => (
        <rect key={i} className="confetti" x="117" y="100" width="7" height="11" rx="2" fill={confettiColors[i % confettiColors.length]} opacity="0" />
      ))}
      <SillySun cx={120} cy={110} size={96} className="face" />
    </svg>
  );
}

// Silly sun as a low-res bitmap: 26 x 26 blocks, "#" is filled.
const SUN_PIXELS = [
  "........##......##........",
  "........###....###........",
  "........#.##..##.#........",
  "........#..####..#........",
  "...#....#..####..#....#...",
  "..#####.#...##...#.#####..",
  "..##.####........####.##..",
  "..##.................###..",
  "...##................##...",
  "....##..####..####..##....",
  "....##..####..####..##....",
  ".#####..#..####..#..#####.",
  "###...........####.....###",
  "###............##......###",
  ".#####....#....#....#####.",
  "....##....#...##....##....",
  "....##....#######...##....",
  "...##.......#####....##...",
  "..###.........##.....###..",
  "..##.####........####.##..",
  "..#####.#...##...#.#####..",
  "..##....#..####..#....##..",
  "........#..####..#........",
  "........#.##..##.#........",
  "........###....###........",
  "........##......##........",
];
const SUN_CROP = { from: 110, size: 860 }; // the part of the 1080 drawing the bitmap covers

/** Silly sun drawn as chunky pixels, centered on (cx, cy), size units wide. */
function PixelSun({ cx, cy, size, fill, className }: { cx: number; cy: number; size: number; fill: string; className?: string }) {
  const n = SUN_PIXELS.length;
  const cell = size / n;
  const x0 = cx - size / 2;
  const y0 = cy - size / 2;
  // One path for all the blocks, so there are no hairline seams between them.
  let d = "";
  SUN_PIXELS.forEach((row, y) => {
    [...row].forEach((c, x) => {
      if (c === "#") d += `M${x0 + x * cell} ${y0 + y * cell}h${cell}v${cell}h${-cell}z`;
    });
  });
  return <path className={className} d={d} fill={fill} />;
}

/** Scale and offset that line the vector sun up exactly with PixelSun. */
function sunTransform(cx: number, cy: number, size: number) {
  const k = size / SUN_CROP.size;
  return { k, transform: `translate(${cx} ${cy}) scale(${k}) translate(-540 -540)` };
}

type Q = (selector: string) => Element[];

/** Runs a looping timeline while the SVG is on screen. */
function useScene(build: (q: Q) => gsap.core.Timeline, still: (q: Q) => void) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
    const q = gsap.utils.selector(el) as Q;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = build(q).pause();
      const st = ScrollTrigger.create({
        trigger: el,
        start: "top 90%",
        end: "bottom 10%",
        onToggle: (self) => (self.isActive ? tl.play() : tl.pause()),
      });
      return () => {
        st.kill();
        tl.kill();
      };
    });
    mm.add("(prefers-reduced-motion: reduce)", () => still(q));
    return () => mm.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ref;
}
