import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { iconFor, iconNames } from "../components/icon";
import { RiSearchLine, RiSidebarUnfoldLine, RiDownloadLine } from "./animated";
import { SidebarStateMorphIcon } from "./morph";

describe("built-in icon assets", () => {
  it("renders genuine AnimateIcons components, not static Remix SVGs", () => {
    for (const Glyph of [RiSearchLine, RiSidebarUnfoldLine, RiDownloadLine]) {
      const html = renderToStaticMarkup(<Glyph className="size-4" aria-hidden="true" />);
      expect(html).toContain('data-animated-icon=');
      expect(html).toContain('<svg');
      expect(html).not.toContain('data-remixicon');
    }
  });
  it("resolves each public built-in icon name to the animated adapter", () => {
    expect(iconNames).toHaveLength(39);
    for (const name of iconNames) {
      const Glyph = iconFor(name);
      expect(Glyph).toBeDefined();
      const html = renderToStaticMarkup(Glyph ? <Glyph /> : null);
      expect(html).toContain('data-animated-icon=');
    }
  });
  it("renders MorphIcons paths for both sidebar states", () => {
    const open = renderToStaticMarkup(<SidebarStateMorphIcon collapsed={true} />);
    const closed = renderToStaticMarkup(<SidebarStateMorphIcon collapsed={false} />);
    expect(open).toContain('data-slot="sidebar-state-morph"');
    expect(open).toContain('<path');
    expect(closed).toContain('<path');
    expect(open).not.toEqual(closed);
  });
});
