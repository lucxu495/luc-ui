"use client";

/*
 * One search, reachable from anywhere that is not the header.
 *
 * The command palette is owned by `AppFrame`: it holds the open state, the
 * ⌘K hotkey and the results. The header has a trigger beside it because it is
 * chrome; a *page* that wants to offer search — the front door's third action —
 * has no way to reach that state, and the tempting shortcut is a button that
 * looks like search and links to another introductory page.
 *
 * So the frame publishes the one thing a page needs. A page asks for it and gets
 * the real palette or `undefined`; it never gets a fake. The fallback is the
 * caller's business, and `/` chooses to say plainly where search lives rather
 * than pretend to be it.
 */

import { createContext, useContext, type ReactNode } from "react";

export interface SearchLauncher {
  /** Open the global command palette, focused on its query field. */
  openSearch: () => void;
}

const SearchContext = createContext<SearchLauncher | null>(null);

export function SearchProvider({
  launcher,
  children,
}: {
  launcher: SearchLauncher;
  children: ReactNode;
}) {
  return <SearchContext.Provider value={launcher}>{children}</SearchContext.Provider>;
}

/**
 * The launcher, or `null` outside the shell.
 *
 * Never throws: a component that ships in both the Showcase and a consumer's
 * page has to render without the frame, and a page that cannot open the palette
 * still has to be a working page.
 */
export function useSearchLauncher(): SearchLauncher | null {
  return useContext(SearchContext);
}
