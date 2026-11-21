import type { Metadata } from "next";
import { Archivo, Poppins } from "next/font/google";
import "./globals.css";

// Headlines: a heavy grotesk with a thin partner weight, like the social graphics.
// Swap for the exact face in the .ai artwork once it's confirmed.
const display = Archivo({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["200", "800", "900"],
});

// Body text: Poppins, as on the current site.
const body = Poppins({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Vectogo | Still your logo, we just make it better",
  description:
    "Vectogo turns your fuzzy logo into crisp vector artwork, redrawn by a real designer. Flat rates, 100% refundable.",
  icons: { icon: "/brand/favicon.jpg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
