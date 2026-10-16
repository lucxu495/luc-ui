/*
 * Locale overrides for the labels the library ships in English.
 *
 * The contract is deliberate: the default stays English, and a product that
 * ships another language passes its own strings instead of forking the
 * component. These tests pin the overrides so a refactor cannot quietly drop
 * them — a hardcoded label is invisible until someone reads the page in a
 * language it was never written for.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Carousel, CarouselControls, CarouselItem, CarouselTrack } from "./carousel";
import { Combobox } from "./combobox";
import { FullscreenButton } from "../charts/chart-card";
import { SearchInput } from "./search-input";
import { TooltipProvider } from "./tooltip";

/** A tooltip needs its provider; an app gets one from `LucProvider`. */
function withProvider(node: React.ReactElement) {
  return <TooltipProvider>{node}</TooltipProvider>;
}

describe("FullscreenButton", () => {
  it("ships an English name and accepts a localised one", () => {
    const { unmount } = render(withProvider(<FullscreenButton onClick={() => {}} />));
    expect(screen.getByRole("button", { name: "Toggle fullscreen" })).toBeInTheDocument();
    unmount();

    render(withProvider(<FullscreenButton onClick={() => {}} label="切换全屏" tooltip="全屏" />));
    expect(screen.getByRole("button", { name: "切换全屏" })).toBeInTheDocument();
  });
});

describe("SearchInput", () => {
  it("accepts a localised clear label", () => {
    render(<SearchInput aria-label="筛选" defaultValue="acme" clearLabel="清除搜索" />);
    expect(screen.getByRole("button", { name: "清除搜索" })).toBeInTheDocument();
  });
});

describe("Combobox", () => {
  it("accepts localised clear and open labels", () => {
    render(
      <Combobox
        aria-label="标的"
        options={[{ value: "btc", label: "BTC-USD" }]}
        value={{ value: "btc", label: "BTC-USD" }}
        clearLabel="清除选择"
        openLabel="展开选项"
      />,
    );
    expect(screen.getByRole("button", { name: "清除选择" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "展开选项" })).toBeInTheDocument();
  });
});

describe("CarouselControls", () => {
  it("accepts a localised dot-list label", () => {
    render(
      <Carousel label="轮播">
        <CarouselTrack>
          <CarouselItem>一</CarouselItem>
          <CarouselItem>二</CarouselItem>
        </CarouselTrack>
        <CarouselControls dotsLabel="幻灯片" />
      </Carousel>,
    );
    expect(screen.getByRole("tablist", { name: "幻灯片" })).toBeInTheDocument();
  });
});
