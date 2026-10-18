import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "../../../..");
const read = (relative: string) => readFileSync(path.join(root, relative), "utf8");
const exists = (relative: string) => existsSync(path.join(root, relative));

function pngSize(relative: string): { width: number; height: number } {
  const bytes = readFileSync(path.join(root, relative));
  expect(bytes.subarray(1, 4).toString("ascii")).toBe("PNG");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

describe("open-source README and brand assets", () => {
  it("uses the official light/dark logo pair and resolves every relative README link", () => {
    const readme = read("README.md");
    expect(readme).toContain("luc-ui-logo-light-512.png");
    expect(readme).toContain("luc-ui-logo-dark-512.png");
    expect(readme).toContain("@luc/ui@github:lucxu495/luc-ui#v1.0.1");
    expect(readme.replace(/\s+/g, " ")).toContain("not published to an npm registry");
    expect(readme).not.toMatch(/(?:^|[\s("'])\/(?:Users|home)\//);

    for (const match of readme.matchAll(/\]\(([^)]+)\)/g)) {
      const target = match[1]!.split("#")[0]!;
      if (target === "" || /^(?:https?:|mailto:)/.test(target)) continue;
      expect(exists(target.replace(/^\.\//, "")), target).toBe(true);
    }
  });

  it("ships favicon, header and Apple touch assets at their intended sizes", () => {
    const files = [
      ["apps/showcase/public/brand/luc-ui-logo-light-32.png", 32],
      ["apps/showcase/public/brand/luc-ui-logo-dark-32.png", 32],
      ["apps/showcase/public/brand/luc-ui-logo-light-64.png", 64],
      ["apps/showcase/public/brand/luc-ui-logo-dark-64.png", 64],
      ["apps/showcase/public/brand/luc-ui-apple-touch-180.png", 180],
      ["docs/assets/brand/luc-ui-logo-light-512.png", 512],
      ["docs/assets/brand/luc-ui-logo-dark-512.png", 512],
    ] as const;
    for (const [file, size] of files) {
      expect(exists(file), file).toBe(true);
      expect(pngSize(file), file).toEqual({ width: size, height: size });
    }
  });

  it("points metadata and both navigation surfaces at those assets", () => {
    const layout = read("apps/showcase/app/layout.tsx");
    expect(layout).toContain('url: "/brand/luc-ui-logo-light-32.png"');
    expect(layout).toContain('url: "/brand/luc-ui-logo-dark-32.png"');
    expect(layout).toContain('url: "/brand/luc-ui-apple-touch-180.png"');

    const shell = read("apps/showcase/components/shell/app-frame.tsx");
    const hero = read("apps/showcase/components/home/hero-section.tsx");
    for (const source of [shell, hero]) {
      expect(source).toContain('src="/brand/luc-ui-logo-light-64.png"');
      expect(source).toContain('src="/brand/luc-ui-logo-dark-64.png"');
      expect(source).toContain("dark:hidden");
      expect(source).toContain("dark:block");
    }
  });
});
