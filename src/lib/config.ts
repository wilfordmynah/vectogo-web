// Packages and prices live here, in one place. Change a price here and the
// order form, checkout and upgrade math all follow.
// TODO(Zane): confirm prices. These are the current Squarespace prices.

export type PackageId = "basic" | "oh_yeah" | "all";

export type Package = {
  id: PackageId;
  name: string;
  priceCents: number;
  /** Revision rounds included. null = unlimited (within the original direction). */
  rounds: number | null;
  formats: string[];
  extras: string[];
  bestFor: string;
  icon: string;
  rank: number;
};

export const PACKAGES: Record<PackageId, Package> = {
  basic: {
    id: "basic",
    name: "Just the basics",
    priceCents: 4900,
    rounds: 1,
    formats: ["JPG", "PNG", "EPS"],
    extras: [],
    bestFor: "Best for simple logos. Flat colors, clean shapes, a font we can find.",
    icon: "/brand/pkg-basics.png",
    rank: 1,
  },
  oh_yeah: {
    id: "oh_yeah",
    name: "Oh yeah!",
    priceCents: 9900,
    rounds: 2,
    formats: ["JPG", "PNG", "EPS", "SVG", "AI"],
    extras: ["Full color, black and white/reversed versions"],
    bestFor: "Best for simple logos that need every file type and a second look.",
    icon: "/brand/pkg-oh-yeah.png",
    rank: 2,
  },
  all: {
    id: "all",
    name: "I want it all!",
    priceCents: 14900,
    rounds: null,
    formats: ["JPG", "PNG", "EPS", "SVG", "AI"],
    extras: ["Full color, black and white/reversed versions", "Brand sheet: version names, colors and a usage guide"],
    bestFor: "Best for complex logos, and anyone who wants the works.",
    icon: "/brand/pkg-want-it-all.png",
    rank: 3,
  },
};

export const PACKAGE_LIST = Object.values(PACKAGES).sort((a, b) => a.rank - b.rank);

export const ONE_MORE_THING = {
  name: "One More Thing!",
  priceCents: 2900,
  description: "One more revision round, then final.",
};

export const CURRENCY = "usd";

export const TURNAROUND = {
  firstReply: "within 24 hours",
  firstProof: "1 to 2 days after that",
};

export function isPackageId(v: unknown): v is PackageId {
  return v === "basic" || v === "oh_yeah" || v === "all";
}

export function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function upgradeOptions(current: PackageId) {
  const from = PACKAGES[current];
  return PACKAGE_LIST.filter((p) => p.rank > from.rank).map((p) => ({
    to: p,
    differenceCents: p.priceCents - from.priceCents,
  }));
}
