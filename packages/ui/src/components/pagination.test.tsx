import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Pagination, PaginationSummary, paginationWindow } from "./pagination";

describe("paginationWindow", () => {
  it("shows a single page when there is only one", () => {
    expect(paginationWindow(1, 1)).toEqual([1]);
  });

  it("keeps the current page in the middle of its siblings", () => {
    expect(paginationWindow(5, 10, 1)).toEqual([1, "start-gap", 4, 5, 6, "end-gap", 10]);
  });

  it("never grows a gap at an edge it is already touching", () => {
    expect(paginationWindow(1, 5)).toEqual([1, 2, "end-gap", 5]);
    expect(paginationWindow(2, 5)).toEqual([1, 2, 3, "end-gap", 5]);
    /* A five-page set is always fully expanded — there is nothing to collapse. */
    expect(paginationWindow(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("clamps an out-of-range page rather than rendering an empty window", () => {
    expect(paginationWindow(99, 5)).toContain(5);
    expect(paginationWindow(-3, 5)).toContain(1);
  });
});

describe("Pagination", () => {
  it("marks exactly one current page and names the landmark", () => {
    render(<Pagination page={3} pageCount={9} />);
    const nav = screen.getByRole("navigation", { name: "Pagination" });
    expect(nav).toBeInTheDocument();
    expect(screen.getAllByRole("button", { current: "page" })).toHaveLength(1);
    expect(screen.getByRole("button", { current: "page" })).toHaveTextContent("3");
  });

  it("calls back with the next page and never with the current one", async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={3} pageCount={9} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Page 3" }));
    expect(onPageChange).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Page 4" }));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it("disables the arrows at the ends", () => {
    const { rerender } = render(<Pagination page={1} pageCount={9} />);
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    rerender(<Pagination page={9} pageCount={9} />);
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("replaces the window with a status in compact mode", () => {
    render(<Pagination page={2} pageCount={7} compact />);
    expect(screen.queryByRole("button", { name: "Page 3" })).not.toBeInTheDocument();
    expect(screen.getByText("2 / 7")).toBeInTheDocument();
  });
});

/*
 * The two `edges` controls.
 *
 * The regression these cover was a *duplicate page number*, which is why the
 * assertion is about the sequence rather than about any one control: the earlier
 * implementation printed the window's own last page and then printed it again as
 * the "jump to the last page" button, so page 4 of 24 rendered `1 … 3 4 5 … 24
 * 24`. `paginationWindow` always ends on the last page, so the numbered copy
 * could only ever be a duplicate — what `edges` owes the reader is the jump, and
 * it renders it the way `DataTablePagination` does, as a double chevron.
 */
describe("Pagination edges", () => {
  /** The numbered controls, by the name they expose. */
  const printedPages = () =>
    screen
      .getAllByRole("button")
      .map((button) => button.getAttribute("aria-label") ?? "")
      .filter((label) => /^Page \d+$/.test(label));

  it("prints every page number exactly once, at every boundary", () => {
    const cases = [
      [1, 24],
      [4, 24],
      [24, 24],
      [3, 9],
      [1, 5],
      [5, 5],
      [1, 1],
      [2, 2],
      [37, 40],
    ] as const;
    for (const [page, pageCount] of cases) {
      const { unmount } = render(<Pagination page={page} pageCount={pageCount} />);
      const labels = printedPages();
      expect(new Set(labels).size, `page ${page} of ${pageCount} prints a number twice`).toBe(
        labels.length,
      );
      expect(labels, `page ${page} of ${pageCount} loses the last page`).toContain(`Page ${pageCount}`);
      expect(labels, `page ${page} of ${pageCount} loses the first page`).toContain("Page 1");
      unmount();
    }
  });

  it("renders the ends as jump controls rather than as page numbers", () => {
    render(<Pagination page={4} pageCount={24} />);
    expect(screen.getByRole("button", { name: "First page" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Last page" })).toBeEnabled();
    /* The old control's accessible name, which was the duplicate. */
    expect(screen.queryByRole("button", { name: "Last page, 24" })).not.toBeInTheDocument();
  });

  it("disables an end control at that end", () => {
    const { rerender } = render(<Pagination page={1} pageCount={24} />);
    expect(screen.getByRole("button", { name: "First page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Last page" })).toBeEnabled();
    rerender(<Pagination page={24} pageCount={24} />);
    expect(screen.getByRole("button", { name: "Last page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "First page" })).toBeEnabled();
  });

  it("keeps the compact shape reachable from both ends", () => {
    /* A compact row is arrows and a status — which is precisely the case the
     * ends controls exist for, so `compact` does not remove them. */
    render(<Pagination page={12} pageCount={24} compact />);
    expect(screen.getByText("12 / 24")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "First page" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Last page" })).toBeEnabled();
  });

  it("drops both end controls when edges is false", () => {
    render(<Pagination page={4} pageCount={24} edges={false} />);
    expect(screen.queryByRole("button", { name: "First page" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Last page" })).not.toBeInTheDocument();
  });

  it("reports the jump instead of the current page", async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={4} pageCount={24} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Last page" }));
    expect(onPageChange).toHaveBeenCalledWith(24);
    onPageChange.mockClear();
    await userEvent.click(screen.getByRole("button", { name: "First page" }));
    expect(onPageChange).toHaveBeenCalledWith(1);
    onPageChange.mockClear();
    /* Visiting the page you are already on is not a navigation. */
    await userEvent.click(screen.getByRole("button", { name: "Page 4" }));
    expect(onPageChange).not.toHaveBeenCalled();
  });
});

describe("PaginationSummary", () => {
  it("states the range with deterministic grouping", () => {
    render(<PaginationSummary from={21} to={40} total={312} unit="rows" />);
    expect(screen.getByText(/21–40/)).toBeInTheDocument();
    expect(screen.getByText(/312 rows/)).toBeInTheDocument();
  });

  it("says none rather than 0–0", () => {
    render(<PaginationSummary from={0} to={0} total={0} unit="rows" />);
    expect(screen.getByText("No rows")).toBeInTheDocument();
  });
});
