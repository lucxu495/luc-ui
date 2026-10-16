import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Carousel, CarouselControls, CarouselItem, CarouselTrack } from "./carousel";
import { Card } from "./card";

function Fixture({ autoplay = false }: { autoplay?: boolean }) {
  return (
    <Carousel label="Featured workspaces" autoplay={autoplay}>
      <CarouselTrack>
        {["Research", "Trading", "Ops"].map((name) => (
          <CarouselItem key={name}>
            <Card className="p-4">{name}</Card>
          </CarouselItem>
        ))}
      </CarouselTrack>
      <CarouselControls />
    </Carousel>
  );
}

describe("Carousel", () => {
  it("is a named carousel landmark with labelled slides", () => {
    render(<Fixture />);
    expect(screen.getByRole("region", { name: "Featured workspaces" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Slide 1 of 3" })).toBeInTheDocument();
  });

  it("makes the track a focusable keyboard-scrollable region", () => {
    render(<Fixture />);
    const track = document.querySelector("[data-slot=carousel-track]") as HTMLElement;
    expect(track).toHaveAttribute("tabindex", "0");
    expect(track.className).toContain("snap-x");
  });

  it("renders one dot per slide, derived from the track children", async () => {
    render(<Fixture />);
    await waitFor(() => expect(screen.getAllByRole("tab")).toHaveLength(3));
    expect(screen.getByRole("tab", { selected: true })).toHaveAccessibleName("Go to slide 1");
  });

  it("disables the previous arrow on the first slide", async () => {
    render(<Fixture />);
    await waitFor(() => expect(screen.getAllByRole("tab")).toHaveLength(3));
    expect(screen.getByRole("button", { name: "Previous slide" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next slide" })).toBeEnabled();
  });

  it("never leaves the carousel without an accessible announcement region", () => {
    render(<Fixture />);
    const live = document.querySelector("[aria-live=polite]")!;
    expect(live).toHaveAttribute("aria-atomic", "true");
  });

  it("announces the current slide through one polite region", async () => {
    render(<Fixture />);
    await waitFor(() => expect(screen.getAllByRole("tab")).toHaveLength(3));
    const live = document.querySelector("[aria-live=polite]")!;
    expect(live).toHaveTextContent("Slide 1 of 3");
    await userEvent.click(screen.getByRole("tab", { name: "Go to slide 3" }));
    expect(live).toHaveTextContent("Slide 3 of 3");
  });
});

describe("CarouselControls label overrides", () => {
  it("accepts localised button and dot labels", () => {
    render(
      <Carousel label="轮播">
        <CarouselTrack>
          <CarouselItem>
            <Card>一</Card>
          </CarouselItem>
          <CarouselItem>
            <Card>二</Card>
          </CarouselItem>
        </CarouselTrack>
        <CarouselControls previousLabel="上一张" nextLabel="下一张" dotsLabel="幻灯片" />
      </Carousel>,
    );
    expect(screen.getByRole("tablist", { name: "幻灯片" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "上一张" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下一张" })).toBeInTheDocument();
  });
});
