import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createMemoryStorage, readVersioned, writeVersioned } from "../utils/storage";
import { usePersistentState } from "./use-persistent-state";

function Counter({ storage, version = 1 }: { storage: ReturnType<typeof createMemoryStorage>; version?: number }) {
  const [count, setCount] = usePersistentState<number>({
    key: "luc-ui:test-counter",
    version,
    defaultValue: 0,
    storage,
    decode: (raw) => (typeof raw === "number" ? raw : undefined),
  });
  return (
    <button type="button" onClick={() => setCount((value) => value + 1)}>
      count {count}
    </button>
  );
}

describe("usePersistentState", () => {
  it("starts at the default, then restores the stored value", async () => {
    const storage = createMemoryStorage();
    writeVersioned(storage, "luc-ui:test-counter", 1, 7);
    render(<Counter storage={storage} />);
    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("count 7"));
  });

  it("writes through on change", async () => {
    const user = userEvent.setup();
    const storage = createMemoryStorage();
    render(<Counter storage={storage} />);
    await user.click(screen.getByRole("button"));
    expect(readVersioned<number>(storage, "luc-ui:test-counter", 1)).toBe(1);
  });

  it("discards a value from an older version", async () => {
    const storage = createMemoryStorage();
    writeVersioned(storage, "luc-ui:test-counter", 0, 99);
    render(<Counter storage={storage} version={1} />);
    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("count 0"));
  });

  it("survives unparseable storage and a throwing adapter", async () => {
    const broken = createMemoryStorage({ "luc-ui:test-counter": "{not json" });
    render(<Counter storage={broken} />);
    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("count 0"));

    const hostile = {
      getItem: () => {
        throw new Error("storage disabled");
      },
      setItem: () => {
        throw new Error("quota");
      },
    };
    expect(() => render(<Counter storage={hostile} />)).not.toThrow();
  });

  it("renders the default on the server so hydration cannot mismatch", () => {
    const storage = createMemoryStorage();
    writeVersioned(storage, "luc-ui:test-counter", 1, 42);
    // The server knows nothing about local storage, so it must emit the default.
    const html = renderToString(<Counter storage={storage} />);
    expect(html).toMatch(/count (<!-- -->)?0/);
    expect(html).not.toContain("count 42");
  });
});
