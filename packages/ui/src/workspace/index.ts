/**
 * LUC Workspace — resizable panes, an inspector, and local layout persistence.
 *
 * See `docs/WORKSPACE_GUIDE.md`. This is a structured application layout, not a
 * drag-and-drop dashboard and not a DataGrid.
 */

export {
  useWorkspace,
  useWorkspaceGroup,
  Workspace,
  WorkspaceFocusBanner,
  WorkspaceGroup,
  WorkspacePane,
  WorkspacePaneBody,
  WorkspacePaneFooter,
  WorkspacePaneHeader,
  WorkspaceResizeHandle,
  type WorkspaceFocusBannerProps,
  type WorkspaceGroupProps,
  type WorkspacePaneBodyProps,
  type WorkspacePaneHeaderProps,
  type WorkspacePaneProps,
  type WorkspaceProps,
  type WorkspaceResizeHandleProps,
} from "./workspace";

export {
  InspectorPane,
  InspectorRow,
  InspectorSection,
  InspectorSkeleton,
  InspectorToggle,
  type InspectorPaneProps,
  type InspectorRowProps,
  type InspectorSectionProps,
  type InspectorToggleProps,
} from "./inspector";

export {
  OutlineDrawer,
  OutlineDrawerToggle,
  type OutlineDrawerProps,
  type OutlineNavGroup,
  type OutlineNavItem,
} from "./outline-drawer";

export {
  useWorkspaceLayout,
  type UseWorkspaceLayoutOptions,
  type UseWorkspaceLayoutResult,
} from "./use-workspace-layout";
