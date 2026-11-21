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

/** 1. Send it: a sad little file hops into the upload tray. */
export function SendItArt() {
  const ref = useScene((q) => {
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.6 });
    tl.set(q(".file"), { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, transformOrigin: "50% 50%" })
      .set(q(".check"), { scale: 0, transformOrigin: "50% 50%" })
      .set(q(".speed"), { opacity: 0 })
      .set(q(".check .sun-rays"), { rotation: 0, transformOrigin: "50% 50%" })
      .set(q(".check .sun-tongue"), { rotation: 0, transformOrigin: "0% 40%" })
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
      // the silly sun pops up to cheer
      .to(q(".check"), { scale: 1, duration: 0.4, ease: "back.out(3)" })
      .to(q(".check .sun-rays"), { rotation: 360, duration: 1, ease: "power2.out" }, "<")
      .to(q(".check .sun-tongue"), { rotation: 18, duration: 0.12, yoyo: true, repeat: 5, ease: "sine.inOut" }, "<0.2")
      .to({}, { duration: 1 });
    return tl;
  }, (q) => gsap.set(q(".check"), { scale: 1, transformOrigin: "50% 50%" }));

  return (
    <svg ref={ref} viewBox="20 40 210 120" className="h-44 w-full overflow-visible" role="img" aria-label="A logo file jumping into the upload tray, and a silly sun cheering">
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
      <SillySun cx={206} cy={56} size={46} className="check" />
      {/* the file, with a pixelly sad face */}
      <g className="file">
        <path d="M38 82 h34 l14 14 v46 a6 6 0 0 1 -6 6 h-42 a6 6 0 0 1 -6 -6 v-54 a6 6 0 0 1 6 -6 z" fill="#fff" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M72 82 v14 h14" fill="none" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <rect x="46" y="104" width="6" height="6" fill={PURPLE} />
        <rect x="66" y="104" width="6" height="6" fill={PURPLE} />
        <path d="M48 132 h4 v-4 h14 v4 h4" stroke={PURPLE} strokeWidth="4" fill="none" />
      </g>
    </svg>
  );
}

/** 2. We get to work: the pen tool redraws a blocky smile while the sun watches. */
export function GetToWorkArt() {
  const ref = useScene((q) => {
    const curve = q(".curve")[0] as SVGPathElement;
    const len = curve.getTotalLength();
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.8 });
    tl.set(curve, { strokeDasharray: len, strokeDashoffset: len })
      .set(q(".pixel"), { opacity: 1, scale: 1, transformOrigin: "50% 50%" })
      .set(q(".anchor"), { scale: 0, transformOrigin: "50% 50%" })
      .set(q(".handle"), { opacity: 0 })
      .set(q(".pen"), { opacity: 1 })
      .set(q(".sun"), { scale: 0.85, transformOrigin: "50% 50%" })
      .set(q(".sun .sun-rays"), { rotation: 0, transformOrigin: "50% 50%" })
      .set(q(".sun .sun-eye"), { scaleY: 1, transformOrigin: "50% 50%" })
      .set(q(".sun .sun-tongue"), { rotation: 0, transformOrigin: "0% 40%" })
      .to(q(".anchor"), { scale: 1, duration: 0.3, stagger: 0.15, ease: "back.out(3)" })
      .to(q(".handle"), { opacity: 1, duration: 0.2 }, "-=0.1")
      .to(curve, { strokeDashoffset: 0, duration: 1.4, ease: "power1.inOut" })
      .to(
        q(".pen"),
        { motionPath: { path: curve, align: curve, alignOrigin: [0.1, 0.9] }, duration: 1.4, ease: "power1.inOut" },
        "<",
      )
      // the sun watches the line go, rays turning
      .to(q(".sun .sun-rays"), { rotation: 120, duration: 1.4, ease: "power1.inOut" }, "<")
      .to(q(".pixel"), { opacity: 0, scale: 0.2, duration: 0.35, stagger: { each: 0.03, from: "random" } }, "-=0.6")
      .to(q(".handle"), { opacity: 0, duration: 0.3 })
      .to(q(".pen"), { y: "-=14", rotation: -15, duration: 0.2, yoyo: true, repeat: 1 }, "<")
      // and approves
      .to(q(".sun"), { scale: 1.15, duration: 0.2, yoyo: true, repeat: 1, ease: "power2.out" }, "<")
      .to(q(".sun .sun-eye"), { scaleY: 0.1, duration: 0.1, yoyo: true, repeat: 1 }, "<")
      .to(q(".sun .sun-tongue"), { rotation: 18, duration: 0.12, yoyo: true, repeat: 3, ease: "sine.inOut" }, "<0.1")
      .to({}, { duration: 1.4 });
    return tl;
  }, (q) => {
    gsap.set(q(".pixel"), { opacity: 0 });
    gsap.set(q(".handle"), { opacity: 0 });
  });

  // a chunky pixel smile underneath
  const pixels = [
    [60, 70], [72, 82], [84, 94], [96, 100], [108, 104], [120, 104], [132, 104], [144, 100], [156, 94], [168, 82], [180, 70],
  ];
  return (
    <svg ref={ref} viewBox="20 24 210 136" className="h-44 w-full overflow-visible" role="img" aria-label="A pen tool redrawing a blocky smile as a smooth curve">
      {pixels.map(([x, y]) => (
        <rect key={x} className="pixel" x={x - 6} y={y - 6} width="12" height="12" fill={MAGENTA} opacity="0.85" />
      ))}
      <g className="handle" stroke={MAGENTA} strokeWidth="1.5">
        <line x1="60" y1="70" x2="90" y2="130" />
        <line x1="180" y1="70" x2="150" y2="130" />
        <circle cx="90" cy="130" r="4" fill="#fff" />
        <circle cx="150" cy="130" r="4" fill="#fff" />
      </g>
      <path className="curve" d="M60 70 C 90 130, 150 130, 180 70" fill="none" stroke={PURPLE} strokeWidth="10" strokeLinecap="round" />
      <rect className="anchor" x="53" y="63" width="14" height="14" fill="#fff" stroke={INK} strokeWidth="3" />
      <rect className="anchor" x="173" y="63" width="14" height="14" fill="#fff" stroke={INK} strokeWidth="3" />
      <SillySun cx={120} cy={46} size={40} />
      {/* pen nib */}
      <g className="pen">
        <path d="M0 0 l10 -26 h12 l10 26 l-16 12 z" fill="#fff" stroke={INK} strokeWidth="3" strokeLinejoin="round" transform="translate(-16 -12) rotate(20 16 12)" />
        <circle cx="0" cy="-4" r="3" fill={INK} transform="translate(0 -6)" />
      </g>
    </svg>
  );
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
