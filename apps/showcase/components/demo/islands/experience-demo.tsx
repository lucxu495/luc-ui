"use client";

/*
 * The `ProjectShowcase` specimen.
 *
 * `ProjectShowcase` is a client component that composes itself from *slots*:
 * `renderMedia`, `renderDetail` and `renderMeta` are functions of a project, so
 * a photography portfolio and a design portfolio share one component. A
 * function cannot cross the server → client boundary, so the specimen has to be
 * a client component that owns the slots — exactly as a product would write it.
 * The two projects below are one plausible person's, and obviously fictional.
 */

import { Stack, Text } from "@luc/ui";
import { ProjectShowcase, type Project } from "@luc/ui/experiences";
import { useI18n } from "@/lib/i18n/provider";

const PROJECTS: readonly Project[] = [
  {
    id: "luc",
    title: "Luc UI",
    summary: "A component library with a charting surface.",
    tags: ["react", "charts"],
    status: "Active",
  },
  {
    id: "tape",
    title: "Tape reader",
    summary: "A message-by-message replay tool for one exchange feed.",
    tags: ["rust", "market data"],
    status: "Archived",
  },
];

export function ProjectShowcaseDemo() {
  /*
   * The summaries below are copy, and an island has no other way to reach the
   * dictionary: the server-side specimen walker sees `<ProjectShowcaseDemo />`
   * and nothing inside it, and `fixture()` cannot cross into a client module
   * either. So the island localizes its own data — the explicit entry point
   * `lib/i18n/specimen.tsx` documents for a client component — and passes the
   * component the localized records rather than the English literals.
   */
  const { tcs } = useI18n();
  /*
   * `summary` is optional on `Project`, so a project without one keeps
   * `undefined` rather than growing an empty string the component would render.
   */
  const projects = PROJECTS.map((project) =>
    project.summary === undefined ? project : { ...project, summary: tcs(project.summary) },
  );
  return (
    <ProjectShowcase
      projects={projects}
      label="Projects"
      columns={2}
      defaultOpenFirst
      renderDetail={(project: Project) => (
        <Stack gap="xs">
          <Text variant="body" tone="muted" as="p">
            {project.summary}
          </Text>
        </Stack>
      )}
    />
  );
}
