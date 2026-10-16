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

const PROJECTS: readonly Project[] = [
  {
    id: "luc",
    title: "LUC UI",
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
  return (
    <ProjectShowcase
      projects={PROJECTS}
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
