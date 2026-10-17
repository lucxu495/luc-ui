/*
 * The specimen localizer's standing contract.
 *
 * This file exists because of a measured regression: the first implementation
 * walked children with `Children.map`, which always returns an array, so a Radix
 * `asChild` trigger received `[<button/>]` instead of `<button/>` — and every
 * overlay page in the Showcase answered HTTP 500 with "Primitive.button failed
 * to slot onto its children" (eight routes, found by the V2 page sweep against
 * the built image). A helper that reads a tree must not reshape it, and that is
 * what these assertions hold:
 *
 *   1. arity is preserved — one child stays one child, a string stays a string;
 *   2. an unchanged tree is returned by identity, so React sees no new elements;
 *   3. `code` and behavioural props are left alone;
 *   4. the copy a reader sees is translated, including a caption prop.
 *   5. a marked fixture translates only the fields it names, and never
 *      reshapes the records around them (see `fixture()`).
 */

import { isValidElement } from "react";
import { describe, expect, it } from "vitest";
import { fixture, localizeSpecimen } from "@/lib/i18n/specimen";

/** A stand-in for the dictionary: a few hits, everything else unchanged. */
const tcs = (source: string) =>
  source === "Settings"
    ? "设置"
    : source === "A longer sentence about runs."
      ? "一句关于运行的话。"
      : source === "Queue imbalance"
        ? "队列失衡"
        : source === "Journal article"
          ? "期刊论文"
          : source === "Active"
            ? "活跃"
            : source;

function Slot({ children }: { children: React.ReactNode }) {
  /* The shape Radix's Slot demands: exactly one element child. */
  if (Array.isArray(children)) throw new Error("Primitive.button failed to slot onto its children");
  if (!isValidElement(children)) throw new Error("Primitive.button failed to slot onto its children");
  return children;
}

describe("localizeSpecimen", () => {
  it("keeps one child as one child", () => {
    const node = (
      <Slot>
        <button type="button">{tcs("Settings")}</button>
      </Slot>
    );
    const localized = localizeSpecimen(node, tcs) as React.ReactElement<{ children: unknown }>;
    const child = localized.props.children;
    expect(Array.isArray(child)).toBe(false);
    /* Rendering the localized tree is the real assertion: an array here is what
     * threw on eight routes. */
    expect(() => Slot({ children: child })).not.toThrow();
  });

  it("returns an unchanged tree by identity", () => {
    const node = (
      <div className="gap-2">
        <span>no dictionary entry here</span>
      </div>
    );
    expect(localizeSpecimen(node, tcs)).toBe(node);
  });

  it("translates text nodes and caption props", () => {
    const node = (
      <div title={tcs("Settings")}>
        <p>{tcs("A longer sentence about runs.")}</p>
      </div>
    );
    const localized = localizeSpecimen(node, tcs) as React.ReactElement<Record<string, unknown>>;
    expect(localized.props.title).toBe("设置");
    const paragraph = localized.props.children as React.ReactElement<{ children: unknown }>;
    expect(paragraph.props.children).toBe("一句关于运行的话。");
  });

  it("leaves literals and behaviour alone", () => {
    const node = (
      <div data-status="live" aria-hidden="true">
        <code>{'toast.success("Saved")'}</code>
        <span>Settings</span>
      </div>
    );
    const localized = localizeSpecimen(node, tcs) as React.ReactElement<Record<string, unknown>>;
    const [code, span] = localized.props.children as [
      React.ReactElement<{ children: unknown }>,
      React.ReactElement<{ children: unknown }>,
    ];
    expect(code.props.children).toBe('toast.success("Saved")');
    expect(span.props.children).toBe("设置");
    expect(localized.props["data-status"]).toBe("live");
    expect(localized.props["aria-hidden"]).toBe("true");
  });

  it("preserves an array's length", () => {
    const node = [<span key="a">Settings</span>, <span key="b">Nothing to translate</span>];
    const localized = localizeSpecimen(node, tcs) as React.ReactNode[];
    expect(Array.isArray(localized)).toBe(true);
    expect(localized).toHaveLength(2);
    expect((localized[0] as React.ReactElement<{ children: unknown }>).props.children).toBe("设置");
  });

  /*
   * The fixture contract.
   *
   * `<PublicationList publications={[…]} />` carries its visible words inside an
   * array of records, where neither the text-node rule nor `TEXT_PROPS` can
   * reach them. `fixture(value, fields)` is how the author declares which fields
   * are copy — and the three cases below are the three ways that declaration can
   * go wrong: it can translate a field nobody named, it can drop a field, or it
   * can replace a record instead of copying it.
   */
  describe("fixture", () => {
    const publication = {
      id: "imbalance",
      title: "Queue imbalance",
      kind: "Journal article",
      year: 2025,
      tags: ["microstructure"],
      citations: 14,
    };

    const read = (node: React.ReactNode) => {
      const localized = localizeSpecimen(node, tcs) as React.ReactElement<{ publications: typeof publication[] }>;
      return localized.props.publications[0];
    };

    it("translates the named field and leaves the record's other fields alone", () => {
      const node = <PublicationList publications={fixture([publication], ["title"])} />;
      expect(read(node)).toEqual({
        ...publication,
        title: "队列失衡",
        /* Not named, therefore not translated — even though the dictionary has
         * a rendering for it. `kind` is a facet the reader filters by, and a
         * fixture is not a place to decide that. */
        kind: "Journal article",
      });
    });

    it("translates every named field, including one nested a level down", () => {
      const node = (
        <PublicationList
          publications={fixture([{ ...publication, meta: { kind: "Journal article" } }], ["title", "kind"])}
        />
      );
      const first = read(node);
      expect(first.title).toBe("队列失衡");
      expect(first.kind).toBe("期刊论文");
      expect((first as unknown as { meta: { kind: string } }).meta.kind).toBe("期刊论文");
    });

    it("gives back the same value when nothing in it matches the dictionary", () => {
      const value = fixture([{ id: "now", title: "Nothing translatable here" }], ["title"]);
      const node = <PublicationList publications={value} />;
      const localized = localizeSpecimen(node, tcs) as React.ReactElement<{ publications: unknown }>;
      expect(localized).toBe(node);
      expect(localized.props.publications).toBe(value);
    });

    it("does not mutate the caller's literal, and does not mark it", () => {
      const marked = fixture([publication], ["title"]);
      localizeSpecimen(<PublicationList publications={marked} />, tcs);
      expect(publication.title).toBe("Queue imbalance");
      expect(Object.keys(marked[0])).toEqual(Object.keys(publication));
      expect(Object.getOwnPropertySymbols(marked[0])).toHaveLength(0);
    });

    it("leaves an unmarked array alone", () => {
      const node = <PublicationList publications={[publication]} />;
      expect(localizeSpecimen(node, tcs)).toBe(node);
    });
  });
});

/** A stand-in for the fixture-bearing component; only its prop shape matters. */
function PublicationList({ publications }: { publications: readonly Record<string, unknown>[] }) {
  return <div data-count={publications.length} />;
}
