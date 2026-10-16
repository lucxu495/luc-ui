/*
 * The chrome shared by every page under `/components`, `/charts` and `/motion`.
 *
 * It used to own the trail, the measure *and* the outline rail, and that is
 * exactly why fifty chart and component pages were narrower than they needed to
 * be. A route-group layout is decided before the router knows which page is
 * inside it, so it has to choose one width for everything underneath — and it
 * chose the reading width, which is right for a paragraph and wrong for a
 * fourteen-series time chart. The outline rail had the same problem in reverse:
 * a grid track is reserved whether or not there is anything in it, so a page
 * with one heading paid 280px for an outline that never rendered.
 *
 * The measure and the rail now live in `DocPage`, which is the only component
 * that knows both the page and the reader's viewport. What is left here is the
 * group's own boundary, kept deliberately empty so a future group-level concern
 * — a shared banner, a version notice — has an obvious home, and so the three
 * route layouts keep meaning what their names say.
 *
 * It does not render a landmark on purpose: the application shell already owns
 * `<main>`, and a second one is an accessibility defect rather than structure.
 */

export function DocsSection({ children }: { children: React.ReactNode }) {
  return <div className="flex w-full min-w-0 flex-col">{children}</div>;
}
