const scopeKey = Symbol.for("luc-ui.cloudflare.request-scope");

interface RequestScopeGlobal {
  [key: symbol]: Map<string, string> | undefined;
}

function scope(): Map<string, string> {
  const globalObject = globalThis as typeof globalThis & RequestScopeGlobal;
  globalObject[scopeKey] ??= new Map<string, string>();
  return globalObject[scopeKey];
}

/**
 * The generated OpenNext cache doesn't receive the original request headers or
 * URL in `IncrementalCache.get()`. The custom Worker stamps a unique id onto the
 * request's `cf` object and records its path here, so the cache override can
 * distinguish `/zh/**` from its English rewrite without a process-global
 * mutable "current locale" that concurrent requests could overwrite.
 */
export async function runWithRequestPathname<T>(
  requestId: string,
  pathname: string,
  callback: () => Promise<T>,
): Promise<T> {
  scope().set(requestId, pathname);
  try {
    return await callback();
  } finally {
    scope().delete(requestId);
  }
}

export function currentRequestPathname(requestId: string | undefined): string | undefined {
  return requestId ? scope().get(requestId) : undefined;
}
