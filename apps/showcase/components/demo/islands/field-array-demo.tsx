"use client";

/*
 * `FieldArray`, demonstrated with the array it needs.
 *
 * The component owns the controls, the row labels and the keyboard path; the
 * array lives in the consumer's form engine. A server-rendered specimen cannot
 * show that — add, remove and move are handlers, and handlers do not cross the
 * RSC boundary — so this island holds the smallest honest version of the caller's
 * own code: `useState<string[]>` plus three functions.
 *
 * The fixture is deterministic (three rows, same text every render), which is
 * what a documentation specimen has to be.
 */

import { useState } from "react";
import { FieldArray, Input } from "@luc/ui";
import { useI18n } from "@/lib/i18n/provider";

function move<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  if (item !== undefined) next.splice(to, 0, item);
  return next;
}

const INITIAL = ["Sector: Technology", "Region: North America", "Market cap: > 10B"];

export function FieldArrayDemo() {
  /* The island's own words are still words a reader reads: a specimen that
   * renders its copy at runtime is outside both the extractor and the shared
   * specimen localizer, so it translates itself. */
  const { tcs } = useI18n();
  const [filters, setFilters] = useState<string[]>(INITIAL);

  return (
    <div className="w-full max-w-xl">
      <FieldArray
        legend={tcs("Filters")}
        description={tcs("Each row is one filter; the order is the evaluation order.")}
        count={filters.length}
        addLabel={tcs("Add filter")}
        minRows={1}
        onAdd={() => setFilters([...filters, ""])}
        onRemove={(index) => setFilters(filters.filter((_, position) => position !== index))}
        onMove={(from, to) => setFilters(move(filters, from, to))}
      >
        {filters.map((filter, index) => (
          <Input
            key={`filter-${index}`}
            defaultValue={filter}
            placeholder="Sector: Technology"
            aria-label={tcs("Filter {number}").replace("{number}", String(index + 1))}
          />
        ))}
      </FieldArray>
    </div>
  );
}
