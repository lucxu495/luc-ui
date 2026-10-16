//#region src/url-state/adapter.d.ts
/**
 * The router boundary.
 *
 * `@luc/ui` must stay portable: no `next/navigation`, no React Router, no
 * TanStack Router import anywhere in the package. This file defines the *one*
 * interface the URL-state layer needs, plus a dependency-free browser
 * implementation built on `history` + `popstate`.
 *
 * A framework adapter (the Showcase uses nuqs for the Next App Router) only has
 * to satisfy `UrlStateAdapter` — or, more usually, it replaces the hook entirely
 * because the framework owns history. Both paths are documented in
 * `docs/URL_STATE_GUIDE.md`.
 */
export interface UrlStateSetOptions {
  /** `replace` keeps rapid updates out of the Back stack. Default `true`. */
  replace?: boolean;
}
export interface UrlStateAdapter {
  /** The current query string, including the leading `?` when non-empty. */
  getSearch(): string;
  /** Write a new query string. Must not reload the document. */
  setSearch(search: string, options: Required<UrlStateSetOptions>): void;
  /** Notify the hook when the history entry changes underneath it. */
  subscribe(onChange: () => void): () => void;
}
export interface BrowserUrlStateAdapterOptions {
  /** Fallback used on the server, where there is no address bar. */
  initialSearch?: string;
}
/**
 * A history-API adapter with no framework attached.
 *
 * It is SSR-safe: on the server every method is inert and `getSearch` returns
 * the supplied `initialSearch`, so the first client render matches the server.
 */
export declare function createBrowserUrlStateAdapter(options?: BrowserUrlStateAdapterOptions): UrlStateAdapter;
//#endregion
//# sourceMappingURL=adapter.d.ts.map