/*
 * A `DemoSpec`, rendered.
 *
 * The frame (`demo.tsx`) is the client island that owns the copy button and the
 * layout; this is the one place a spec's fields are mapped onto it, so every
 * generated page stages its specimen the same way and a change to the chrome
 * lands in one file rather than 157.
 *
 * It is a server component. The specimen inside it is an element of real
 * components — mostly server-rendered, with only the genuinely interactive ones
 * crossing into the client — so the demo costs a page no JavaScript beyond the
 * frame it already had.
 */

import { Demo } from "./demo";
import type { DemoSpec } from "@/lib/demo/types";
import { localizeSpecimen } from "@/lib/i18n/specimen";
import { getServerCopy } from "@/lib/i18n/server";

export interface DemoStageProps {
  spec: DemoSpec;
  /**
   * Drop the source block and the spec's note, keeping the specimen.
   *
   * For a catalogue preview: the reader is deciding *whether* to open the page,
   * and the code belongs on the page they open. It also keeps thirteen previews
   * from turning the index into a wall of snippets.
   */
  compact?: boolean;
}

export async function DemoStage({ spec, compact = false }: DemoStageProps) {
  /*
   * The spec's node is a server-created element tree, so the frame cannot reach
   * the strings inside it: the specimen is translated here, in the one place
   * every catalogue, chart and motion page stages its preview. See
   * `lib/i18n/specimen.tsx`.
   */
  const { tcs } = await getServerCopy();
  if (compact) {
    return (
      <Demo layout={spec.layout === undefined || spec.layout === "stage" ? "block" : spec.layout} {...(spec.bare ? { bare: true } : {})}>
        {localizeSpecimen(spec.node, tcs)}
      </Demo>
    );
  }
  return (
    <Demo
      code={spec.code}
      /* `stage` is the demo's word for "give it the full width"; the frame's
       * own vocabulary calls that a block. */
      layout={spec.layout === undefined || spec.layout === "stage" ? "block" : spec.layout}
      {...(spec.note === undefined ? {} : { description: spec.note })}
      {...(spec.bare ? { bare: true } : {})}
    >
      {localizeSpecimen(spec.node, tcs)}
    </Demo>
  );
}
