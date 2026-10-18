import { getCloudflareContext } from "@opennextjs/cloudflare";
import { currentRequestPathname } from "./request-scope";

const CACHE_DIR = "cdn-cgi/_next_cache";

type CacheType = "cache" | "fetch" | "composable";

function normalizedCacheKey(key: string): string {
  return key.replace(/^\/+/, "").replace(/\/+$/, "");
}

/**
 * Read-only cache for the prerendered documentation, separated by language.
 *
 * `/zh/**` is a middleware rewrite of `/**`, so Next hands the cache the same
 * key for both languages. Prefixing the asset key with `zh/` is the smallest
 * place to preserve that distinction; serving the English cache entry for a
 * Chinese URL would be a cross-language cache poisoning bug.
 */
export const localeAwareStaticAssetsCache = {
  name: "luc-locale-aware-static-assets-cache",

  async get(key: string, cacheType: CacheType = "cache") {
    const assets = getCloudflareContext().env.ASSETS;
    if (!assets) return null;

    const buildId = process.env.OPEN_NEXT_BUILD_ID ?? "static";
    const requestId = (
      getCloudflareContext().cf as { lucRequestId?: string } | undefined
    )?.lucRequestId;
    const isChinese = currentRequestPathname(requestId)?.match(/^\/zh(?:\/|$)/) !== null;
    const prefix = isChinese ? "zh/" : "";
    const normalized = normalizedCacheKey(key);
    const assetKey =
      cacheType === "fetch"
        ? `${CACHE_DIR}/__fetch/${buildId}/${prefix}${normalized}`
        : `${CACHE_DIR}/${buildId}/${prefix}${normalized}.cache`;

    try {
      const response = await assets.fetch(`http://assets.local/${assetKey}`, {
        method: "GET",
      });
      if (!response.ok) {
        await response.body?.cancel();
        return null;
      }
      return {
        value: await response.json(),
        lastModified:
          (globalThis as typeof globalThis & { __BUILD_TIMESTAMP_MS__?: number })
            .__BUILD_TIMESTAMP_MS__ ?? Date.now(),
      };
    } catch {
      return null;
    }
  },

  async set() {
    // The build output is immutable for the lifetime of this Worker version.
  },

  async delete() {
    // A new deployment replaces the whole static cache.
  },
};
