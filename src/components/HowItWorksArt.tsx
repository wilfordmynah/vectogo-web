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

/** 1. Send it: a sad little file hops into the upload tray. */
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
      .to(q(".check"), { scale: 1, duration: 0.4, ease: "back.out(3)" })
      .to({}, { duration: 1.2 });
    return tl;
  }, (q) => gsap.set(q(".check"), { scale: 1, transformOrigin: "50% 50%" }));

  return (
    <svg ref={ref} viewBox="20 40 210 120" className="h-44 w-full" role="img" aria-label="A logo file jumping into the upload tray">
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

/** 2. We get to work: the pen tool redraws a blocky smile as a smooth curve. */
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
      .to(q(".anchor"), { scale: 1, duration: 0.3, stagger: 0.15, ease: "back.out(3)" })
      .to(q(".handle"), { opacity: 1, duration: 0.2 }, "-=0.1")
      .to(curve, { strokeDashoffset: 0, duration: 1.4, ease: "power1.inOut" })
      .to(
        q(".pen"),
        { motionPath: { path: curve, align: curve, alignOrigin: [0.1, 0.9] }, duration: 1.4, ease: "power1.inOut" },
        "<",
      )
      .to(q(".pixel"), { opacity: 0, scale: 0.2, duration: 0.35, stagger: { each: 0.03, from: "random" } }, "-=0.6")
      .to(q(".handle"), { opacity: 0, duration: 0.3 })
      .to(q(".pen"), { y: "-=14", rotation: -15, duration: 0.2, yoyo: true, repeat: 1 }, "<")
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
    <svg ref={ref} viewBox="20 24 210 136" className="h-44 w-full" role="img" aria-label="A pen tool redrawing a blocky smile as a smooth curve">
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
      {/* pen nib */}
      <g className="pen">
        <path d="M0 0 l10 -26 h12 l10 26 l-16 12 z" fill="#fff" stroke={INK} strokeWidth="3" strokeLinejoin="round" transform="translate(-16 -12) rotate(20 16 12)" />
        <circle cx="0" cy="-4" r="3" fill={INK} transform="translate(0 -6)" />
      </g>
    </svg>
  );
}

/** 3. Good to go: a happy face, files popping out, confetti. */
export function GoodToGoArt() {
  const ref = useScene((q) => {
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.8 });
    tl.set(q(".tile"), { x: 0, y: 0, scale: 0, rotation: 0, transformOrigin: "50% 50%" })
      .set(q(".confetti"), { x: 0, y: 0, opacity: 0, rotation: 0, transformOrigin: "50% 50%" })
      .set(q(".face"), { scale: 0.9, transformOrigin: "50% 50%" })
      .to(q(".face"), { scale: 1.08, duration: 0.25, ease: "power2.out" })
      .to(q(".face"), { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.4)" })
      .to(q(".tile"), {
        scale: 1,
        x: (i) => [-78, 0, 78][i],
        y: (i) => [-14, -46, -14][i],
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
      .to(q(".wink"), { scaleY: 0.1, transformOrigin: "50% 50%", duration: 0.1, yoyo: true, repeat: 1 }, "<0.2")
      .to({}, { duration: 1 });
    return tl;
  }, (q) => {
    gsap.set(q(".tile"), { scale: 1, x: (i: number) => [-78, 0, 78][i], y: (i: number) => [-14, -46, -14][i], rotation: (i: number) => [-14, 0, 14][i], transformOrigin: "50% 50%" });
    gsap.set(q(".confetti"), { opacity: 0 });
  });

  const tiles = ["JPG", "SVG", "PNG"];
  const confettiColors = [PURPLE, MAGENTA, "#FF0081", "#B000FF", "#FFD23F", "#2DD4BF"];
  return (
    <svg ref={ref} viewBox="20 40 200 120" className="h-44 w-full overflow-visible" role="img" aria-label="A happy face with crisp files popping out">
      {tiles.map((t) => (
        <g key={t} className="tile">
          <rect x="98" y="96" width="44" height="34" rx="8" fill={INK} />
          <text x="120" y="118" textAnchor="middle" fontSize="13" fontWeight="800" fontStyle="italic" fill="#fff">{t}</text>
        </g>
      ))}
      {Array.from({ length: 14 }, (_, i) => (
        <rect key={i} className="confetti" x="117" y="100" width="7" height="11" rx="2" fill={confettiColors[i % confettiColors.length]} opacity="0" />
      ))}
      <g className="face">
        <circle cx="120" cy="118" r="44" fill={PURPLE} />
        <circle cx="104" cy="106" r="6" fill="#fff" />
        <circle className="wink" cx="136" cy="106" r="6" fill="#fff" />
        <path d="M100 126 Q120 148 140 126" stroke="#fff" strokeWidth="7" fill="none" strokeLinecap="round" />
      </g>
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
