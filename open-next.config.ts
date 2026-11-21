// OpenNext turns the Next.js build into a Cloudflare Worker.
// No incremental cache is needed: pages are either fully static or rendered per request.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({});
