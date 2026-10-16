import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { ThemeProvider, useTheme } from "./theme-provider";

function Probe() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button type="button" onClick={() => setTheme("light")}>
        light
      </button>
      <button type="button" onClick={() => setTheme("system")}>
        system
      </button>
      <button type="button" onClick={toggleTheme}>
        toggle
      </button>
    </div>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.className = "";
    delete document.documentElement.dataset.theme;
  });

  it("applies an explicit theme to the document", async () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <Probe />
      </ThemeProvider>,
    );
    await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
    await userEvent.click(screen.getByRole("button", { name: "light" }));
    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe("light");
      expect(document.documentElement).not.toHaveClass("dark");
    });
    expect(window.localStorage.getItem("luc-ui-theme")).toBe("light");
  });

  it("toggles between light and dark", async () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <Probe />
      </ThemeProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("resolved")).toHaveTextContent("dark"));
    await userEvent.click(screen.getByRole("button", { name: "toggle" }));
    await waitFor(() => expect(screen.getByTestId("resolved")).toHaveTextContent("light"));
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("light"));
  });

  it("restores the stored theme", async () => {
    window.localStorage.setItem("luc-ui-theme", "light");
    render(
      <ThemeProvider defaultTheme="dark">
        <Probe />
      </ThemeProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("theme")).toHaveTextContent("light"));
  });

  it("throws a helpful error outside the provider", () => {
    expect(() => render(<Probe />)).toThrow(/ThemeProvider/);
  });
});
