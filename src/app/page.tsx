import Image from "next/image";
import HeroFace from "@/components/HeroFace";
import ScrollEffects from "@/components/ScrollEffects";
import HeroPixelBackground from "@/components/HeroPixelBackground";
import { SendItArt, GetToWorkArt, GoodToGoArt } from "@/components/HowItWorksArt";

// Page background colors per section. The page drifts between these as you
// scroll, so there are no hard-edged blocks.
const BG = {
  hero: "#ffffff",
  why: "#fcdef9",
  how: "#ffffff",
  packages: "#1c0640",
  footer: "#000000",
};

const packages = [
  {
    name: "Just the basics",
    icon: "/brand/pkg-basics.png",
    bestFor: "Best for simple logos. Flat colors, clean shapes, a font we can find.",
    includes: ["1 review round", "JPG, PNG, EPS"],
  },
  {
    name: "Oh yeah!",
    icon: "/brand/pkg-oh-yeah.png",
    bestFor: "Best for simple logos that need a few more file types and a second look.",
    includes: ["2 review rounds", "JPG, PNG, EPS, SVG, AI", "Full color, black and white versions"],
  },
  {
    name: "I want it all!",
    icon: "/brand/pkg-want-it-all.png",
    bestFor:
      "Best for complex logos, and anyone who wants the works. Gradients, shading, custom lettering? This is your package.",
    includes: ["Unlimited review rounds", "Every file type and color version", "A brand sheet: versions, colors, usage"],
    featured: true,
  },
];

export default function Home() {
  return (
    <>
      <ScrollEffects />

      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 px-5 py-4 sm:px-10">
        <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-full bg-white/80 px-5 py-2.5 shadow-sm ring-1 ring-black/5 backdrop-blur">
          <a href="#top" aria-label="Vectogo home">
            <Image src="/brand/logo.png" alt="vectogo" width={130} height={32} priority />
          </a>
          <div className="flex items-center gap-5 text-sm font-medium">
            <a href="#why" className="hidden hover:text-purple sm:inline">Why vector?</a>
            <a href="#how" className="hidden hover:text-purple sm:inline">How it works</a>
            <a href="#packages" className="vg-pill vg-pill--solid !py-2 !px-4">Get started</a>
          </div>
        </nav>
      </header>

      <main id="top" className="overflow-x-clip">
        {/* Hero */}
        <section data-bg={BG.hero} className="relative isolate min-h-[100svh] px-5 pt-32 sm:px-10">
          {/* pixelated backdrop that smooths out as you scroll */}
          <HeroPixelBackground />

          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
            <div data-rise>
              <p className="mb-4 font-medium text-magenta">Logo vectorizing, by a real designer</p>
              <h1 className="font-display text-5xl font-black leading-[0.95] sm:text-7xl">
                Still your logo,
                <br />
                <span className="font-extralight">we just make it</span>{" "}
                <span className="bg-gradient-to-r from-purple to-[#8d2b9b] bg-clip-text text-transparent">better!</span>
              </h1>
              <p className="mt-6 max-w-md text-lg">
                Send us the fuzzy one. We redraw it as crisp vector artwork that looks sharp on a business card or a billboard.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a href="#packages" className="vg-pill vg-pill--solid">Get started</a>
                <a href="#why" className="vg-pill">Um, what&apos;s a vector?</a>
              </div>
            </div>
            <div className="flex justify-center">
              <HeroFace />
            </div>
          </div>

        </section>

        {/* Why vector: raster vs vector */}
        <section id="why" data-bg={BG.why} className="px-5 py-32 sm:px-10">
          <div className="mx-auto max-w-6xl">
            <h2 data-rise className="font-display text-4xl font-black sm:text-6xl">
              Raster <span className="font-extralight">vs</span> <span className="text-purple">Vector</span>
            </h2>
            <p data-rise className="mt-4 max-w-xl text-lg">
              First, let&apos;s meet Raster. Raster is made of pixels, so it gets blocky when you blow it up. Vectors use math (nerd!), so they stay sharp at any size.
            </p>

            <div className="mt-14 grid gap-8 md:grid-cols-2">
              <figure data-rise className="vg-card overflow-hidden">
                <div className="relative grid h-72 place-items-center overflow-hidden">
                  <svg data-zoom viewBox="0 0 16 16" className="h-40 w-40" shapeRendering="crispEdges" aria-hidden>
                    {/* a pixel V */}
                    {[
                      [2, 3], [3, 3], [12, 3], [13, 3], [3, 5], [4, 5], [11, 5], [12, 5], [4, 7], [5, 7], [10, 7], [11, 7],
                      [5, 9], [6, 9], [9, 9], [10, 9], [6, 11], [7, 11], [8, 11], [9, 11], [7, 13], [8, 13],
                      [2, 4], [3, 4], [12, 4], [13, 4], [3, 6], [4, 6], [11, 6], [12, 6], [4, 8], [5, 8], [10, 8], [11, 8],
                      [5, 10], [6, 10], [9, 10], [10, 10], [6, 12], [7, 12], [8, 12], [9, 12],
                    ].map(([x, y]) => (
                      <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="var(--vg-magenta)" />
                    ))}
                  </svg>
                </div>
                <figcaption className="border-t-2 border-black px-6 py-4">
                  <strong className="font-display text-xl text-magenta">Raster</strong>
                  <span className="ml-2 font-display font-extralight">Made of pixels / limited scale</span>
                </figcaption>
              </figure>

              <figure data-rise className="vg-card overflow-hidden">
                <div className="relative grid h-72 place-items-center overflow-hidden">
                  <svg data-zoom viewBox="0 0 16 16" className="h-40 w-40" aria-hidden>
                    <path d="M2.4 3 L8 13.6 L13.6 3" fill="none" stroke="var(--vg-purple)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
                  </svg>
                </div>
                <figcaption className="border-t-2 border-black px-6 py-4">
                  <strong className="font-display text-xl text-purple">Vector</strong>
                  <span className="ml-2 font-display font-extralight">Made of math / any size</span>
                </figcaption>
              </figure>
            </div>
            <p className="mt-8 text-center text-sm opacity-70">Keep scrolling, we&apos;re zooming in.</p>
          </div>
        </section>

        {/* How it works */}
        <section id="how" data-bg={BG.how} className="relative px-5 py-32 sm:px-10">
          <div className="mx-auto max-w-6xl">
            <h2 data-rise className="font-display text-4xl font-black sm:text-6xl">
              How it works <span className="font-extralight">(it&apos;s easy)</span>
            </h2>

            <div className="mt-16">

              <ol className="grid gap-8 md:grid-cols-3">
                {[
                  ["Send it", "Pick a package, upload your best logo file and tell us what matters most."],
                  ["We get to work", "We reply within 24 hours, and your first proof follows 1 to 2 days later. Ask for changes or approve it."],
                  ["Good to go", "Download your crisp new files from your account, any time, ready for print, web and everything else."],
                ].map(([title, body], i) => (
                  <li key={title} data-rise className="vg-card p-6">
                    {[<SendItArt key="a" />, <GetToWorkArt key="b" />, <GoodToGoArt key="c" />][i]}
                    <span className="mt-4 block font-display text-5xl font-black text-purple">{i + 1}</span>
                    <h3 className="mt-2 font-display text-2xl font-black">{title}</h3>
                    <p className="mt-2">{body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Packages */}
        <section id="packages" data-bg={BG.packages} className="px-5 py-32 text-white sm:px-10">
          <div className="mx-auto max-w-6xl">
            <h2 data-rise className="font-display text-4xl font-black sm:text-6xl">
              Pick your package <span className="font-extralight">no surprise, no nonsense</span>
            </h2>

            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {packages.map((p) => (
                <article
                  key={p.name}
                  data-rise
                  className={`vg-card flex flex-col p-7 text-ink ${p.featured ? "ring-4 ring-magenta/60" : ""}`}
                >
                  <Image src={p.icon} alt="" width={64} height={64} className="h-16 w-16 object-contain" />
                  <h3 className="mt-5 font-display text-3xl font-black">{p.name}</h3>
                  <p className="mt-3 flex-1">{p.bestFor}</p>
                  <ul className="mt-5 space-y-1 text-sm font-medium">
                    {p.includes.map((item) => (
                      <li key={item}>✓ {item}</li>
                    ))}
                  </ul>
                  {/* Pricing and checkout come in phase 2 */}
                  <a href="#contact" className="vg-pill mt-6 justify-center">Choose {p.name}</a>
                </article>
              ))}
            </div>

            <blockquote data-rise className="mx-auto mt-16 max-w-2xl text-center text-lg">
              <strong className="font-display text-2xl font-black">A real designer redraws every logo by hand.</strong>
              <br />
              Not loving it after the first round? Get a full refund. Out of rounds? Upgrade for the price difference, or add One More Thing! for $29.
            </blockquote>
          </div>
        </section>

        {/* Footer */}
        <footer id="contact" data-bg={BG.footer} className="px-5 py-28 text-white sm:px-10">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 text-center">
            <Image src="/brand/heart.png" alt="" width={72} height={72} className="h-16 w-16 object-contain" />
            <h2 className="font-display text-4xl font-black sm:text-6xl">
              Questions? <span className="font-extralight">Let&apos;s chat.</span>
            </h2>
            <a href="mailto:hello@vectogo.com" className="vg-pill">hello@vectogo.com</a>
            <p className="text-sm opacity-70">
              Follow us, or whatever:{" "}
              <a className="underline" href="https://www.instagram.com/vectortogo">Instagram</a> ·{" "}
              <a className="underline" href="https://www.facebook.com/vectortogo">Facebook</a>
            </p>
            <p className="text-xs opacity-50">© {new Date().getFullYear()} Vectogo</p>
          </div>
        </footer>
      </main>
    </>
  );
}
