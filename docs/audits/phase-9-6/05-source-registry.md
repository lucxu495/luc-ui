# Phase 9.6 — source registry status

`pnpm verify:registry` → `registry: up to date (4 items)` ·
`registry-verify` → 4 items, 6 files installed into a clean fixture, typecheck
clean.

## What the registry is

`packages/ui/scripts/registry-generate.mjs` walks the real import graph of
`packages/ui/src` from an item's entry files, follows relative imports to their
transitive closure, rewrites them onto the consumer's alias, and records the
external packages with the versions this repository pins. The item is
**derived**, never retyped — the generator's own comment says it best: a
hand-maintained second copy of a component is a copy that drifts.

`registry-verify.mjs` then installs the items by their declared targets into a
directory outside the workspace and typechecks the result.

## What the four items are

| Item | Contents | Why it is viable as source |
| --- | --- | --- |
| `luc-utils` | `utils/cn.ts`, `hooks/use-reduced-motion.ts` | pure TypeScript, two dependencies (`clsx`, `tailwind-merge`) |
| `luc-badge` | the badge primitive | one file plus the shared utility item |
| `luc-spinner` | the spinner primitive | no provider, no engine, no plugin |
| `luc-skeleton` | the skeleton primitive | same |

The pattern is deliberate: the four items are the primitives whose closure is
**files**. A button looks like it belongs on that list and does not — its recipe,
its variants and its token layer are what make the styled result, and copying the
`.tsx` alone produces a component that typechecks and renders unstyled.

## What would break, and how it would break

Three failure modes were looked for, and each of them is a reason to keep a
component npm-only rather than to ship a broken item:

1. **A plugin or preset dependency.** A component whose styles are produced by a
   Tailwind plugin needs that plugin in the consumer's build. Copying the file
   without the plugin produces a component that renders unstyled and looks
   correct in the diff.
2. **A provider or CSS-layer requirement.** Anything that depends on a layer
   being declared in the consumer's stylesheet fails in a way the typecheck
   cannot see. `registry-verify` deliberately does not claim to catch it.
3. **A closure that is not files.** A chart family drags an engine and an
   adapter; copying it is copying a build system.

## Conclusion, stated plainly

**The registry is a verified proof of concept with four items, not a
distribution channel.** It is honest about that in three places: the generator's
scope note, `docs/SOURCE_POLICY.md`, and here. The npm package remains the
supported way to consume LUC UI.

Expanding it is *not* on the critical path for publication, and this phase did
not expand it: adding items until the count looks impressive would either
duplicate the library into manually-maintained copies or publish items that
typecheck in a fixture and render wrong in a real application. The right way to
grow it is per-component, with a consumer that needs source distribution and a
browser check for each new item — which is a task for whoever asks for it, with
the name of the component they asked for.
