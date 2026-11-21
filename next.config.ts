import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Old Squarespace URLs, sent to their new homes so links and search results keep working.
  async redirects() {
    return [
      { source: "/get-started", destination: "/#packages", permanent: true },
      { source: "/contact-1", destination: "/#contact", permanent: true },
      { source: "/one-more", destination: "/#packages", permanent: true },
      { source: "/thanks-for-chosing", destination: "/", permanent: true },
      { source: "/thanks-for-contacting", destination: "/", permanent: true },
      { source: "/store/:path*", destination: "/#packages", permanent: true },
    ];
  },
};

export default nextConfig;
