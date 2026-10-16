//#region src/experiences/project-showcase.d.ts
/**
 * LUC ProjectShowcase — a portfolio that opens in place.
 *
 * A portfolio has one interaction and it is always the same: choose a project,
 * see more about it. The two ways that gets built are both bad — a wall of cards
 * that each link away, losing the collection, or a modal that covers the work you
 * were comparing it with. This keeps the grid and grows the chosen tile into a
 * detail region beside it: the collection stays on screen, the URL can still
 * carry the choice, and closing returns focus to the tile that opened it.
 *
 * Composition is by slot, not by boolean. `media`, `body` and `meta` are
 * functions of the project, so a photography portfolio and a design portfolio
 * use the same component and produce different pages.
 */
export interface Project {
  id: string;
  title: string;
  /** One line under the title in the grid. */
  summary?: string;
  /** Year, client, discipline — rendered as a definition list in the detail. */
  meta?: ReadonlyArray<{
    id: string;
    label: string;
    value: React.ReactNode;
  }>;
  /** The project's own links: live site, repository, case study. */
  links?: ReadonlyArray<{
    id: string;
    label: string;
    href: string;
  }>;
  tags?: readonly string[];
  /** Marks an unfinished or archived project. */
  status?: string;
}
export interface ProjectShowcaseProps extends Omit<React.ComponentPropsWithRef<"div">, "defaultValue"> {
  projects: readonly Project[];
  /** Cover art per project. Falls back to a typographic tile. */
  renderMedia?: (project: Project) => React.ReactNode;
  /** The detail body per project. */
  renderDetail: (project: Project) => React.ReactNode;
  /** Controlled open project. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (id: string | null) => void;
  /** Opens the first project on mount. Default `false`. */
  defaultOpenFirst?: boolean;
  /** Accessible name for the grid. */
  label?: string;
  columns?: 1 | 2 | 3;
}
export declare function ProjectShowcase({ projects, renderMedia, renderDetail, value, defaultValue, onValueChange, defaultOpenFirst, label, columns, className, ...props }: ProjectShowcaseProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=project-showcase.d.ts.map