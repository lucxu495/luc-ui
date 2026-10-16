"use client";

import { useCallback, useRef, useState } from "react";
import { useGroupRef, type Layout } from "react-resizable-panels";
import { usePersistentState } from "../hooks/use-persistent-state";
import { useIsomorphicLayoutEffect } from "../hooks/use-isomorphic-layout-effect";
import { structuralEquals } from "../url-state/codecs";
import type { KeyValueStorage } from "../utils/storage";

/**
 * Pane sizes are personal presentation state.
 *
 * They persist locally (never in the URL), they are versioned, and an
 * incompatible shape is discarded rather than migrated. Restoring happens in a
 * layout effect after hydration: the server cannot know the layout, and a
 * stored layout applied during render would be a hydration mismatch.
 */

export interface UseWorkspaceLayoutOptions {
  /** Unique id for this group; also the storage key suffix. */
  id: string;
  /** Every panel id, in render order. A stored layout must match it exactly. */
  panelIds: readonly string[];
  /** Bump to invalidate a stored layout after a layout change. */
  version?: number;
  storage?: KeyValueStorage;
  /** Fall back to an explicit layout instead of the equal-size default. */
  defaultLayout?: Layout;
  /** Persist at all. Default true. */
  persist?: boolean;
}

export interface UseWorkspaceLayoutResult {
  /** Attach to the group element. */
  groupRef: ReturnType<typeof useGroupRef>;
  /** Pass to the group element. */
  defaultLayout?: Layout;
  /** Pass to the group element. */
  onLayoutChanged: (layout: Layout) => void;
  /**
   * Remount key. A reset bumps it, which is the only way to make the engine
   * re-derive default sizes rather than reapply the last layout.
   */
  epoch: number;
  /** Forget the stored layout and rebuild the group at its defaults. */
  resetLayout: () => void;
  /** True once a stored layout has been applied. */
  restored: boolean;
}

function validateLayout(panelIds: readonly string[]) {
  return (raw: unknown): Layout | undefined => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
    const entries = Object.entries(raw as Record<string, unknown>);
    if (entries.length !== panelIds.length) return undefined;
    const layout: Layout = {};
    for (const [key, value] of entries) {
      if (!panelIds.includes(key) || typeof value !== "number" || !Number.isFinite(value)) return undefined;
      layout[key] = value;
    }
    return layout;
  };
}

export function useWorkspaceLayout({
  id,
  panelIds,
  version = 1,
  storage,
  defaultLayout,
  persist = true,
}: UseWorkspaceLayoutOptions): UseWorkspaceLayoutResult {
  const [stored, setStored] = usePersistentState<Layout | undefined>({
    // The pane set is part of the key: a workspace that swaps a pane keeps a
    // layout per combination instead of applying the old percentages to a
    // different shape. `decode` still validates the stored shape.
    key: `luc-ui:workspace:${id}:${panelIds.join("+") || "none"}`,
    version,
    defaultValue: undefined,
    storage: persist ? storage : undefined,
    decode: validateLayout(panelIds),
  });

  const groupRef = useGroupRef();
  const appliedRef = useRef(false);
  const [restored, setRestored] = useState(false);
  const [epoch, setEpoch] = useState(0);

  useIsomorphicLayoutEffect(() => {
    if (appliedRef.current || !stored) return;
    const group = groupRef.current;
    if (!group) return;
    appliedRef.current = true;
    group.setLayout(stored);
    setRestored(true);
  }, [groupRef, stored]);

  const onLayoutChanged = useCallback(
    (layout: Layout) => {
      if (!persist) return;
      setStored((previous) => (structuralEquals(previous, layout) ? previous : layout));
    },
    [persist, setStored],
  );

  const resetLayout = useCallback(() => {
    appliedRef.current = false;
    setRestored(false);
    setStored(undefined);
    setEpoch((value) => value + 1);
  }, [setStored]);

  return {
    groupRef,
    defaultLayout: stored ?? defaultLayout,
    onLayoutChanged,
    epoch,
    resetLayout,
    restored,
  };
}
