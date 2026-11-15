import { describe, expect, it } from "vitest";
import { navigation } from "@/lib/navigation";
import { lightweightExamples, lightweightExampleIds } from "@/lib/charts/lightweight-examples";
import { officialLightweightPlugins } from "@/lib/charts/lightweight-plugins";

describe("Lightweight Charts is discoverable", () => {
  it("has a dedicated group with a working route for every shipped example", () => {
    const group = navigation.find((item) => item.id === "lightweight-charts");
    expect(group).toBeDefined();
    const targets = group!.items.flatMap((item) => [
      ...(item.href ? [item.href] : []),
      ...(item.children?.flatMap((child) => child.href ? [child.href] : []) ?? []),
    ]);
    expect(targets).toContain("/charts/lightweight");
    expect(targets).toContain("/charts/lightweight/plugins");
    for (const id of lightweightExampleIds) {
      expect(targets).toContain(`/charts/lightweight/${id}`);
    }
    expect(lightweightExamples).toHaveLength(6);
  });

  it("tracks published upstream plugins without claiming any is shipped", () => {
    expect(officialLightweightPlugins).toHaveLength(19);
    expect(new Set(officialLightweightPlugins.map((item) => item.id)).size).toBe(19);
    const group = navigation.find((item) => item.id === "lightweight-charts");
    const routes = group!.items.flatMap((item) => item.children?.map((child) => child.href) ?? []);
    for (const plugin of officialLightweightPlugins) {
      expect(routes).not.toContain(`/charts/lightweight/${plugin.id}`);
    }
  });
});
