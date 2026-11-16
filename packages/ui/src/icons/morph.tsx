"use client";

import { MorphIcon, type MorphIconProps } from "morphicons/react";
import { PanelLeftClose, PanelLeftOpen } from "lucide";

/** MorphIcons uses Lucide's *shape nodes*, without the outer SVG element.
 * Lucide's plain data package exposes ["svg", attrs, children]. Passing the
 * wrapper to MorphIcons causes an SSR prerender crash (.for is not iterable).
 */
function morphNodes(tree: unknown): MorphIconProps["icon"] {
  if (!Array.isArray(tree) || tree[0] !== "svg" || !Array.isArray(tree[2])) {
    throw new Error("Expected Lucide icon-node data");
  }
  return tree[2] as MorphIconProps["icon"];
}

const CLOSED = morphNodes(PanelLeftClose);
const OPEN = morphNodes(PanelLeftOpen);

/** Collapsing/expanding a panel is a stateful change, not a decorative hover. */
export function SidebarStateMorphIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <MorphIcon
      data-slot="sidebar-state-morph"
      icon={collapsed ? OPEN : CLOSED}
      size={16}
      className="size-4"
      reducedMotion="user"
    />
  );
}
