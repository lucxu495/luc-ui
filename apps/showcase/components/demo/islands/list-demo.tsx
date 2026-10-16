"use client";

/*
 * The reorderable-list demo.
 *
 * `SortableList` is *controlled*: it reports the complete new id order and the
 * caller owns the state. A documentation specimen therefore has to own that
 * state too — which is the honest thing to show, because it is exactly the code
 * the reader will write.
 *
 * Its sibling here used to be a `TransferList` specimen. That component gained a
 * written page of its own in the Forms review (`/components/transfer-list`), so
 * the specimen lives there now rather than twice.
 *
 * The fixtures are a fixed five-item list; nothing is fetched and nothing is
 * randomised, so the specimen is the same on every render and in every
 * screenshot.
 */

import { useState } from "react";
import { SortableList } from "@luc/ui";

const DECK = [
  { id: "intro", label: "Introduction", description: "Four slides" },
  { id: "data", label: "The dataset", description: "Six slides" },
  { id: "method", label: "Method", description: "Five slides" },
  { id: "results", label: "Results", description: "Nine slides" },
  { id: "next", label: "Next steps", description: "Two slides" },
] as const;

export function SortableListDemo() {
  const [order, setOrder] = useState<readonly string[]>(DECK.map((item) => item.id));
  const items = order.flatMap((id) => {
    const item = DECK.find((candidate) => candidate.id === id);
    return item ? [item] : [];
  });
  return <SortableList label="Talk outline" items={items} onReorder={setOrder} />;
}
