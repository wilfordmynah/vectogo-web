# Vectogo website

The new vectogo.com: a flowing, animated marketing site (phase 1), with the customer portal, admin area and Stripe checkout to follow (phase 2).

Built with Next.js, Tailwind CSS and GSAP. Deployed on Vercel.

## Run it on your computer (VS Code)

1. Install [Node.js](https://nodejs.org) 20 or newer.
2. Open this folder in VS Code, then open the terminal (View → Terminal).
3. Run `npm install` once.
4. Run `npm run dev` and open http://localhost:3000.

Edits show up in the browser as soon as you save.

## Where things live

| What | Where |
| --- | --- |
| Brand colors | `src/app/globals.css` (the `--vg-` variables at the top) |
| Fonts | `src/app/layout.tsx` |
| Homepage sections and copy | `src/app/page.tsx` |
| Pixel-to-vector hero animation | `src/components/HeroFace.tsx` |
| Scroll color shifts, drawing lines, zoom | `src/components/ScrollEffects.tsx` |
| Logo, icons, images | `public/brand/` |
| Redirects from the old Squarespace pages | `next.config.ts` |

Animations switch to simple, still versions when a visitor has "reduce motion" turned on.
