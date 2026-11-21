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

// Zane's pixel cursor. Its tip sits this far into the image (as a fraction of its size).
const CURSOR = { src: "/brand/cursor.svg", w: 221.3, h: 293.5, tip: [48.1 / 221.3, 21.8 / 293.5] as [number, number] };

/** The pixel cursor, drawn with its tip at (0, 0). */
function Cursor({ height = 30 }: { height?: number }) {
  const k = height / CURSOR.h;
  return <image href={CURSOR.src} x={-48.1 * k} y={-21.8 * k} width={CURSOR.w * k} height={height} />;
}

/** 1. Send it: the cursor clicks Upload and the pixelated Silly file blasts off like a rocket. */
export function SendItArt() {
  const BTN = { x: 30, y: 98, w: 84, h: 30 };
  const ref = useScene((q) => {
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.4 });
    tl.set(q(".rocket"), { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1, transformOrigin: "50% 100%" })
      .set(q(".flame"), { scaleY: 0, opacity: 0, transformOrigin: "50% 0%" })
      .set(q(".puff"), { scale: 0, opacity: 0, x: 0, y: 0, transformOrigin: "50% 50%" })
      .set(q(".btn"), { scale: 1, transformOrigin: "50% 50%" })
      .set(q(".pen"), { x: 20, y: 60, opacity: 1, scale: 1, transformOrigin: "0% 0%" })
      .set(q(".check"), { scale: 0, transformOrigin: "50% 50%" })
      // cursor glides to the button
      .to(q(".pen"), { x: BTN.x + BTN.w * 0.62, y: BTN.y + BTN.h * 0.55, duration: 0.8, ease: "power2.inOut" })
      // click!
      .to(q(".pen"), { scale: 0.82, duration: 0.08, yoyo: true, repeat: 1 })
      .to(q(".btn"), { scale: 0.92, duration: 0.08, yoyo: true, repeat: 1 }, "<")
      // engines on: rumble and flicker
      .to(q(".flame"), { scaleY: 0.5, opacity: 1, duration: 0.15 })
      .to(q(".rocket"), { x: "+=1.5", duration: 0.04, repeat: 9, yoyo: true, ease: "none" }, "<")
      .to(q(".flame"), { scaleY: 0.8, duration: 0.07, repeat: 5, yoyo: true, ease: "none" }, "<")
      .to(q(".rocket"), { scaleY: 0.9, scaleX: 1.05, duration: 0.15, ease: "power2.in" }, "-=0.15")
      // liftoff
      .to(q(".puff"), {
        scale: (i) => [1.2, 1.5, 1.1, 1.4][i],
        x: (i) => [-22, -8, 10, 24][i],
        y: (i) => [2, 6, 6, 2][i],
        opacity: 0.9,
        duration: 0.25,
        ease: "power2.out",
      })
      .to(q(".flame"), { scaleY: 1.4, duration: 0.15 }, "<")
      .to(q(".rocket"), { scaleY: 1.12, scaleX: 0.92, duration: 0.1 }, "<")
      .to(q(".rocket"), { y: -190, rotation: 4, duration: 0.8, ease: "power3.in" }, "<0.05")
      .to(q(".rocket"), { opacity: 0, duration: 0.2 }, "-=0.2")
      .to(q(".puff"), { opacity: 0, scale: "+=0.6", y: "-=4", duration: 0.7, ease: "power1.out" }, "<-0.3")
      .to(q(".check"), { scale: 1, duration: 0.4, ease: "back.out(3)" }, "<0.2")
      .to(q(".pen"), { x: "-=8", y: "+=14", duration: 0.5, ease: "power1.out" }, "<")
      .to({}, { duration: 1.1 })
      // a fresh file drops back in for the next loop
      .set(q(".rocket"), { y: -30, rotation: 0, scaleX: 1, scaleY: 1 })
      .set(q(".flame"), { scaleY: 0, opacity: 0 })
      .to(q(".rocket"), { y: 0, opacity: 1, duration: 0.45, ease: "bounce.out" })
      .to(q(".check"), { scale: 0, duration: 0.2 }, "<");
    return tl;
  }, (q) => {
    gsap.set(q(".pen"), { x: BTN.x + BTN.w * 0.62, y: BTN.y + BTN.h * 0.55 });
    gsap.set(q(".flame"), { opacity: 0 });
    gsap.set(q(".puff"), { opacity: 0 });
    gsap.set(q(".check"), { scale: 1, transformOrigin: "50% 50%" });
  });

  return (
    <svg ref={ref} viewBox="20 40 210 120" className="h-44 w-full overflow-visible" role="img" aria-label="A cursor clicks Upload and a pixelated sun logo file blasts off like a rocket">
      {/* smoke puffs at the launch pad */}
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} className="puff" cx="172" cy="148" r="9" fill="#e9e3f5" />
      ))}
      {/* the rocket: Zane's pixel Silly file, with pixel flames underneath */}
      <g className="rocket">
        <g className="flame" shapeRendering="crispEdges">
          <rect x="154" y="141" width="36" height="8" fill="#FFD23F" />
          <rect x="158" y="149" width="28" height="8" fill="#FF9F1C" />
          <rect x="162" y="157" width="20" height="8" fill="#FF5A1F" />
          <rect x="166" y="165" width="12" height="8" fill={MAGENTA} />
          <rect x="170" y="173" width="4" height="6" fill={MAGENTA} />
        </g>
        <image href="/brand/silly-sun-pixel-file.svg" x="138" y="58" width="68" height="85" />
      </g>
      {/* the upload button */}
      <g className="btn">
        <rect x={BTN.x} y={BTN.y} width={BTN.w} height={BTN.h} rx={BTN.h / 2} fill={PURPLE} stroke={INK} strokeWidth="3" />
        <path d={`M${BTN.x + 20} ${BTN.y + 21} V${BTN.y + 9} M${BTN.x + 14} ${BTN.y + 14} l6 -6 l6 6`} stroke="#fff" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <text x={BTN.x + 54} y={BTN.y + 20} textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">Upload</text>
      </g>
      <g className="check">
        <circle cx={BTN.x + BTN.w - 4} cy={BTN.y - 2} r="11" fill={MAGENTA} />
        <path d={`M${BTN.x + BTN.w - 9.5} ${BTN.y - 2} l4 4 l7 -8`} stroke="#fff" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g className="pen">
        <Cursor height={30} />
      </g>
    </svg>
  );
}

/** 2. We get to work: the pointer traces part of the pixelated Silly as a smooth line. */
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
      .set(q(".pen"), { opacity: 1, scale: 1 })
      .to(q(".pen"), {
        motionPath: { path: rays, align: rays, alignOrigin: CURSOR.tip, start: 0, end: TRACE },
        duration: 2.4,
        ease: "power1.inOut",
      })
      .to(rays, { strokeDashoffset: len * (1 - TRACE), duration: 2.4, ease: "power1.inOut" }, "<")
      .to(q(".anchor"), { scale: 1, duration: 0.25, stagger: 2.4 / (STOPS.length - 1), ease: "back.out(3)" }, "<")
      .to(q(".handle"), { opacity: 1, duration: 0.2, stagger: 2.4 / (STOPS.length - 1) }, "<0.1")
      // click!
      .to(q(".pen"), { scale: 0.8, transformOrigin: "0% 0%", duration: 0.1, yoyo: true, repeat: 1 })
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
    <svg ref={ref} viewBox="20 24 210 136" className="h-44 w-full overflow-visible" role="img" aria-label="A pointer tracing the pixelated sun as a smooth vector line">
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
      {/* Zane's pixel cursor */}
      <g className="pen">
        <Cursor height={30} />
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
