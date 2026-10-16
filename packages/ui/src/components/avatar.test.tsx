import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar, AvatarGroup, initialsOf } from "./avatar";

describe("initialsOf", () => {
  it("takes one letter per word", () => {
    expect(initialsOf("Ada Lovelace")).toBe("AL");
    /* Only the first two words contribute, so a long name stays two letters. */
    expect(initialsOf("luc-ui maintainer")).toBe("LU");
  });

  it("keeps a CJK name intact rather than inventing two letters", () => {
    expect(initialsOf("谢健")).toBe("谢");
  });

  it("never renders an empty chip", () => {
    expect(initialsOf(undefined)).toBe("?");
    expect(initialsOf("   ")).toBe("?");
  });
});

describe("Avatar", () => {
  it("exposes the name once, as the accessible name", () => {
    render(<Avatar name="Ada Lovelace" />);
    const avatar = screen.getByRole("img", { name: "Ada Lovelace" });
    expect(avatar).toBeInTheDocument();
    /* The initials are decoration: they must not be announced on top of the name. */
    expect(screen.getByText("AL")).toHaveAttribute("aria-hidden", "true");
  });

  it("gives the same name the same deterministic tint", () => {
    const { container: first } = render(<Avatar name="Ada Lovelace" />);
    const { container: second } = render(<Avatar name="Ada Lovelace" />);
    const tintOf = (root: HTMLElement) =>
      root.querySelector("[data-slot=avatar-fallback]")?.getAttribute("data-tint");
    expect(tintOf(first)).toBe(tintOf(second));
  });

  it("renders a status dot that is decorative", () => {
    render(<Avatar name="Market bot" status="online" />);
    const dot = document.querySelector("[data-slot=avatar-status]")!;
    expect(dot).toHaveAttribute("aria-hidden", "true");
  });
});

describe("AvatarGroup", () => {
  it("counts the overflow as text, not as a hidden badge", () => {
    render(
      <AvatarGroup max={2} total={5}>
        <Avatar name="Ada Lovelace" />
        <Avatar name="Grace Hopper" />
        <Avatar name="Alan Turing" />
      </AvatarGroup>,
    );
    expect(screen.getByText("+3")).toBeInTheDocument();
    expect(screen.queryByText("AL")).toBeInTheDocument();
    expect(screen.queryByText("AT")).not.toBeInTheDocument();
  });

  it("shows no counter when the set fits", () => {
    render(
      <AvatarGroup max={4}>
        <Avatar name="Ada Lovelace" />
      </AvatarGroup>,
    );
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });
});
