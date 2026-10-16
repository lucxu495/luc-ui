import { KeyValueStorage } from "../utils/storage.js";
import { Layout, useGroupRef } from "react-resizable-panels";
//#region src/workspace/use-workspace-layout.d.ts
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
export declare function useWorkspaceLayout({ id, panelIds, version, storage, defaultLayout, persist }: UseWorkspaceLayoutOptions): UseWorkspaceLayoutResult;
//#endregion
//# sourceMappingURL=use-workspace-layout.d.ts.map