/*
 * The other configurations of a specimen.
 *
 * MOT-002. A page whose only specimen is the one the author liked best answers
 * "what is this component" and leaves "what can it do" to prose. These are the
 * two to four configurations worth seeing, each with its own live preview and
 * its own copyable snippet — the same frame the page's main demo uses, so the
 * Preview/Code control, the copy button and the reduced-motion behaviour are the
 * ones the reader already met.
 *
 * It is a server component: a spec's `examples` are ordinary elements of real
 * components, and only the genuinely interactive ones cross into the client
 * island they already had.
 */

import { Heading, Stack, Text } from "@luc/ui";
import { Demo } from "./demo";
import { Example } from "./example";
import { localizeSpecimen } from "@/lib/i18n/specimen";
import type { DemoExample } from "@/lib/demo/types";
import { getServerCopy } from "@/lib/i18n/server";

export interface DemoExamplesProps {
  examples: readonly DemoExample[];
  /** The section heading. Localized by the caller until it is in the dictionary. */
  title: string;
  description?: string;
  /**
   * Which frame each example wears.
   *
   * `demo` keeps the registry's own frame: the specimen and, under it, the
   * source, always in the reading path. That is right for a Motion page, where
   * the code *is* half the point of a replayable effect.
   *
   * `example` is the Components V2 frame (`docs/COMPONENTS_V2.md` §6): the same
   * specimen with its source behind a disclosure, so eight examples do not turn
   * a component page into a wall of snippets. A component page passes this; a
   * motion page does not.
   */
  frame?: "demo" | "example";
  /**
   * Whether this block owns its own `h2`.
   *
   * A Motion page renders the section on its own, so the heading belongs here.
   * A component page folds the same examples into its `Examples` section, where
   * a second `h2` ("Other configurations") named the same thing twice and the
   * `#examples` id had to stay unique on the page.
   */
  heading?: boolean;
}

export async function DemoExamples({
  examples,
  title,
  description,
  frame = "demo",
  heading: withHeading = true,
}: DemoExamplesProps) {
  if (examples.length === 0) return null;
  /* The example's own name is prose like any other, so it goes through the same
   * dictionary the note does — a page whose examples are named in English on the
   * Chinese site is the coverage gap this project keeps having to re-find. */
  const { tcs } = await getServerCopy();
  return (
    <section className="flex flex-col gap-5">
      {withHeading ? (
        <Stack gap="xs">
          <Heading size="title" as="h2" id="examples">
            {title}
          </Heading>
          {description ? (
            <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
              {description}
            </Text>
          ) : null}
        </Stack>
      ) : null}
      {examples.map((example) => (
        <div key={example.title} className="flex flex-col gap-2.5">
          {frame === "example" ? (
            /* `Example` owns its own `<h3>` and its own note, so this frame adds
             * nothing around it. The specimen's own stage layout is passed
             * through when the author declared one — see `DemoExample.layout`. */
            <Example
              title={example.title}
              code={example.code}
              layout={example.layout ?? "inline"}
              {...(example.note === undefined ? {} : { description: example.note })}
            >
              {/*
                * The spec's nodes are server-created elements, so the client
                * frame cannot see inside them: the localization happens here,
                * where the same `tcs` the titles use is already in scope.
                */}
              {localizeSpecimen(example.node, tcs)}
            </Example>
          ) : (
            <>
              {/* A real heading level: the page outline lists the examples, and a
               * screen reader can move between them. */}
              <Heading size="title" as="h3">
                {tcs(example.title)}
              </Heading>
              <Demo
                code={example.code}
                /* `Demo` has no `stage` frame of its own — it is the registry's
                 * frame, not the Components V2 one — so the widest layout it
                 * knows is what a `stage` example asks for. */
                {...(example.layout === undefined
                  ? {}
                  : { layout: example.layout === "stage" ? "block" : example.layout })}
                {...(example.note === undefined ? {} : { description: example.note })}
              >
                {localizeSpecimen(example.node, tcs)}
              </Demo>
            </>
          )}
        </div>
      ))}
    </section>
  );
}
