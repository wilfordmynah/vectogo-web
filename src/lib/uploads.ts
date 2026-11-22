// What customers can upload, shared by the order form and order messages.

export const LOGO_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/gif", "gif"],
  ["image/webp", "webp"],
  ["image/svg+xml", "svg"],
  ["application/pdf", "pdf"],
]);

/** Extra files sent in messages: logos plus design files, fonts and zips. */
export const EXTRA_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "svg", "pdf", "ai", "eps", "psd", "zip", "ttf", "otf", "woff", "woff2"];

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/** A file name that's safe to use in a storage path, keeping its extension. */
export function safeFileName(name: string) {
  const clean = name.normalize("NFKD").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^[-.]+/, "");
  return (clean || "file").slice(-100);
}

export const extraPathPattern = (orderId: string) =>
  new RegExp(`^orders/${orderId}/extra/[0-9a-f-]{36}/[A-Za-z0-9._-]{1,100}$`);

export const isImagePath = (p: string) => /\.(jpe?g|png|gif|webp|svg)$/i.test(p);
export const fileNameOf = (p: string) => p.split("/").pop() ?? p;
