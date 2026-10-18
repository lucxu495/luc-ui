import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import { localeAwareStaticAssetsCache } from "./lib/cloudflare/locale-aware-static-cache";

/*
 * The public documentation is build-time content. Both language trees are
 * prerendered and shipped in Workers Static Assets; the adapter can serve those
 * entries without invoking the Next renderer. This keeps the Free Plan's 10ms
 * per-request CPU budget out of the React Server Components path.
 *
 * There is no ISR or on-demand revalidation: a deployment always replaces the
 * complete static cache, so a read-only static-assets incremental cache needs
 * no R2 bucket, queue or tag database.
 */
export default defineCloudflareConfig({
  incrementalCache: localeAwareStaticAssetsCache,
  enableCacheInterception: true,
});
