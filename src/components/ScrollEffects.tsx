"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Wires up the page's scroll motion using data attributes, so sections stay
 * plain markup:
 *  - data-bg="#hex"   the page background drifts to this color as the section arrives
 *  - data-draw        an SVG path draws itself as you scroll past it
 *  - data-zoom        content scales up while scrolling (Raster vs Vector demo)
 *  - data-rise        fades and floats up into place once
 */
export default function ScrollEffects() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    const html = document.documentElement;

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // 1. One continuous background that shifts color, instead of stacked blocks.
      gsap.utils.toArray<HTMLElement>("[data-bg]").forEach((section) => {
        const color = section.dataset.bg!;
        ScrollTrigger.create({
          trigger: section,
          start: "top 65%",
          end: "bottom 65%",
          onToggle: (self) => {
            if (self.isActive) {
              gsap.to(html, { "--vg-page": color, duration: 0.9, ease: "sine.inOut", overwrite: true });
            }
          },
        });
      });

      // 2. Lines that draw themselves.
      gsap.utils.toArray<SVGPathElement>("[data-draw]").forEach((path) => {
        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
        gsap.to(path, {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: { trigger: path.closest("section") ?? path, start: "top 75%", end: "center 45%", scrub: 0.6 },
        });
      });

      // 3. Zoom demo.
      gsap.utils.toArray<HTMLElement>("[data-zoom]").forEach((el) => {
        gsap.fromTo(
          el,
          { scale: 1 },
          {
            scale: 2.2,
            ease: "none",
            scrollTrigger: { trigger: el.closest("section") ?? el, start: "top 60%", end: "bottom 60%", scrub: 0.5 },
          },
        );
      });

      // 4. Gentle entrances.
      gsap.utils.toArray<HTMLElement>("[data-rise]").forEach((el) => {
        gsap.from(el, {
          y: 40,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        });
      });
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      // Still change colors per section, just without the tween.
      gsap.utils.toArray<HTMLElement>("[data-bg]").forEach((section) => {
        ScrollTrigger.create({
          trigger: section,
          start: "top 65%",
          end: "bottom 65%",
          onToggle: (self) => {
            if (self.isActive) html.style.setProperty("--vg-page", section.dataset.bg!);
          },
        });
      });
    });

    return () => mm.revert();
  }, []);

  return null;
}
