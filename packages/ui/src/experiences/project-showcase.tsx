"use client";

import { cn } from "../utils/cn";
import { useControllableState } from "../hooks/use-controllable-state";

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
  meta?: ReadonlyArray<{ id: string; label: string; value: React.ReactNode }>;
  /** The project's own links: live site, repository, case study. */
  links?: ReadonlyArray<{ id: string; label: string; href: string }>;
  tags?: readonly string[];
  /** Marks an unfinished or archived project. */
  status?: string;
}

export interface ProjectShowcaseProps
  extends Omit<React.ComponentPropsWithRef<"div">, "defaultValue"> {
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

export function ProjectShowcase({
  projects,
  renderMedia,
  renderDetail,
  value,
  defaultValue,
  onValueChange,
  defaultOpenFirst = false,
  label = "Projects",
  columns = 2,
  className,
  ...props
}: ProjectShowcaseProps) {
  const [openId, setOpenId] = useControllableState<string | null>({
    value,
    defaultValue: defaultValue ?? (defaultOpenFirst ? (projects[0]?.id ?? null) : null),
    onChange: onValueChange,
  });
  const open = projects.find((project) => project.id === openId) ?? null;

  return (
    <div
      data-slot="project-showcase"
      data-open={open ? "true" : "false"}
      className={cn(
        "flex flex-col gap-6",
        open && "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start lg:gap-8",
        className,
      )}
      {...props}
    >
      <ul
        aria-label={label}
        className={cn(
          "grid list-none gap-4",
          columns === 1 && "sm:grid-cols-1",
          columns === 2 && "sm:grid-cols-2",
          columns === 3 && "sm:grid-cols-2 xl:grid-cols-3",
          open && "sm:grid-cols-1",
        )}
      >
        {projects.map((project) => {
          const isOpen = project.id === openId;
          return (
            <li key={project.id} className="min-w-0">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenId(isOpen ? null : project.id)}
                className={cn(
                  "luc-rest luc-hover luc-settle luc-focus group flex w-full flex-col overflow-hidden text-left",
                  "rounded-md border bg-surface-raised",
                  isOpen ? "border-line-accent" : "border-line-subtle hover:border-line-default",
                )}
              >
                <span className="relative block aspect-[4/3] w-full overflow-hidden bg-surface-sunken">
                  {renderMedia ? (
                    renderMedia(project)
                  ) : (
                    <span className="flex size-full items-center justify-center bg-gradient-to-br from-accent-soft to-surface-sunken">
                      <span className="px-4 text-center font-display text-heading font-semibold text-fg-accent">
                        {project.title}
                      </span>
                    </span>
                  )}
                </span>
                <span className="flex min-w-0 flex-col gap-1 p-4">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-title font-semibold text-fg-primary">
                      {project.title}
                    </span>
                    {project.status ? (
                      <span className="shrink-0 text-micro text-fg-muted">{project.status}</span>
                    ) : null}
                  </span>
                  {project.summary ? (
                    <span className="text-caption text-fg-secondary">{project.summary}</span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {open ? (
        <section
          key={open.id}
          aria-label={open.title}
          className="luc-float flex flex-col gap-4 rounded-md border border-line-subtle bg-surface-overlay p-5 lg:sticky lg:top-24"
        >
          <header className="flex flex-col gap-2">
            <h3 className="font-display text-heading-sm font-semibold text-fg-primary text-balance">
              {open.title}
            </h3>
            {open.summary ? (
              <p className="text-body text-fg-secondary text-pretty">{open.summary}</p>
            ) : null}
          </header>
          <div className="flex flex-col gap-3 text-body text-fg-secondary">{renderDetail(open)}</div>
          {open.meta && open.meta.length > 0 ? (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line-subtle pt-4">
              {open.meta.map((fact) => (
                <div key={fact.id} className="flex min-w-0 flex-col gap-0.5">
                  <dt className="text-micro text-fg-muted">{fact.label}</dt>
                  <dd className="truncate text-label text-fg-primary">{fact.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {open.links && open.links.length > 0 ? (
            <ul className="flex list-none flex-wrap gap-3 border-t border-line-subtle pt-4">
              {open.links.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.href}
                    className="text-label font-medium text-fg-accent underline decoration-line-accent underline-offset-4 hover:decoration-accent-default"
                    {...(/^https?:\/\//i.test(link.href)
                      ? { target: "_blank", rel: "noreferrer noopener" }
                      : {})}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          {open.tags && open.tags.length > 0 ? (
            <ul className="flex list-none flex-wrap gap-1.5">
              {open.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-xs border border-line-subtle bg-surface-interactive px-2 py-0.5 text-micro text-fg-muted"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
