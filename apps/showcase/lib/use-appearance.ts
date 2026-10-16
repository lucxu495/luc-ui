"use client";

import { useSyncExternalStore } from "react";
import {
  DEFAULT_PERSONALITY,
  DEFAULT_PALETTE,
  DEFAULT_SPACE,
  DEFAULT_TYPEFACE,
  PERSONALITY_STORAGE_KEY,
  PALETTE_STORAGE_KEY,
  SPACE_STORAGE_KEY,
  TYPEFACE_STORAGE_KEY,
  isPalette,
  isPersonality,
  isSpace,
  isTypeface,
  type Palette,
  type Personality,
  type Space,
  type Typeface,
} from "./appearance";

export interface Appearance {
  palette: Palette;
  typeface: Typeface;
  personality: Personality;
  space: Space;
}

/**
 * The Showcase's appearance store.
 *
 * The DOM is the source of truth: `data-palette` / `data-typeface` on `<html>`
 * are set by `appearanceInitScript` before paint, and every reader (this hook,
 * the tokens, a screenshot) reads the same attribute. Module-level state is
 * enough because exactly one `<html>` exists per document — and it means the
 * topbar control and a page-level preview stay in sync without a provider.
 *
 * `useSyncExternalStore` is doing real work here: reading the attribute during
 * render would desynchronise server HTML from the client's stored choice, so the
 * server snapshot is the default and the client snapshot is read once, after
 * mount, from the element the init script already wrote.
 */

const SERVER_SNAPSHOT: Appearance = {
  palette: DEFAULT_PALETTE,
  typeface: DEFAULT_TYPEFACE,
  personality: DEFAULT_PERSONALITY,
  space: DEFAULT_SPACE,
};

let clientSnapshot: Appearance = SERVER_SNAPSHOT;
let initialised = false;

const listeners = new Set<() => void>();

function readDom(): Appearance {
  if (typeof document === "undefined") return SERVER_SNAPSHOT;
  const { palette, typeface, personality, space } = document.documentElement.dataset;
  return {
    palette: isPalette(palette) ? palette : DEFAULT_PALETTE,
    typeface: isTypeface(typeface) ? typeface : DEFAULT_TYPEFACE,
    personality: isPersonality(personality) ? personality : DEFAULT_PERSONALITY,
    space: isSpace(space) ? space : DEFAULT_SPACE,
  };
}

function ensureInitialised(): Appearance {
  if (!initialised) {
    initialised = true;
    clientSnapshot = readDom();
  }
  return clientSnapshot;
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  ensureInitialised();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function apply(next: Appearance) {
  const root = document.documentElement;
  root.dataset.palette = next.palette;
  root.dataset.typeface = next.typeface;
  root.dataset.personality = next.personality;
  root.dataset.space = next.space;
  try {
    localStorage.setItem(PALETTE_STORAGE_KEY, next.palette);
    localStorage.setItem(TYPEFACE_STORAGE_KEY, next.typeface);
    localStorage.setItem(PERSONALITY_STORAGE_KEY, next.personality);
    localStorage.setItem(SPACE_STORAGE_KEY, next.space);
  } catch {
    // Private mode, or storage disabled: the attribute still applies for this
    // session, which is the whole feature. Persistence is the optional part.
  }
  clientSnapshot = next;
  emit();
}

export function useAppearance() {
  const appearance = useSyncExternalStore(
    subscribe,
    () => ensureInitialised(),
    () => SERVER_SNAPSHOT,
  );

  return {
    ...appearance,
    setPalette: (palette: Palette) => apply({ ...ensureInitialised(), palette }),
    setTypeface: (typeface: Typeface) => apply({ ...ensureInitialised(), typeface }),
    setPersonality: (personality: Personality) => apply({ ...ensureInitialised(), personality }),
    setSpace: (space: Space) => apply({ ...ensureInitialised(), space }),
  };
}
