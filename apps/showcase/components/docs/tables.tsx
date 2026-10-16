"use client";

import { useOptionalI18n } from "@/lib/i18n/provider";
import { DataTable } from "./data-table";

export interface PropRow {
  name: string;
  type: string;
  default?: string;
  description: string;
}

export function PropsTable({ rows, className }: { rows: PropRow[]; className?: string }) {
  const i18n = useOptionalI18n();
  const tcs = i18n?.tcs ?? ((source: string) => source);

  return (
    <DataTable
      className={className}
      caption={tcs("Component props")}
      columns={[
        {
          key: "name",
          header: tcs("Prop"),
          className: "w-[18%]",
          render: (row: PropRow) => <code className="font-mono text-fg-primary">{row.name}</code>,
        },
        {
          key: "type",
          header: tcs("Type"),
          className: "w-[30%]",
          render: (row: PropRow) => <code className="font-mono text-fg-accent">{row.type}</code>,
        },
        {
          key: "default",
          header: tcs("Default"),
          className: "w-[14%]",
          render: (row: PropRow) => (
            <code className="font-mono text-fg-muted">{row.default ?? "—"}</code>
          ),
        },
        /*
         * The description is rendered as given.
         *
         * Every call site passes it through `tcs` already — all 39 of them — so
         * translating here meant a second lookup on an already-Chinese string:
         * the dictionary missed by definition, the provider logged a warning per
         * row in the console, and the value rendered unchanged. Rendering it
         * verbatim is also what keeps the string visible to the coverage
         * extractor, which can see `tcs("…")` at the call site but not a variable
         * passed into a component.
         */
        { key: "description", header: tcs("Notes"), render: (row: PropRow) => row.description },
      ]}
      rows={rows}
    />
  );
}

export interface TokenRow {
  token: string;
  variable: string;
  utility?: string;
  usage: string;
  sample?: React.ReactNode;
}

export function TokenTable({ rows, className }: { rows: TokenRow[]; className?: string }) {
  const i18n = useOptionalI18n();
  const tcs = i18n?.tcs ?? ((source: string) => source);

  return (
    <DataTable
      className={className}
      caption={tcs("Tokens")}
      columns={[
        {
          key: "sample",
          header: "",
          className: "w-12",
          render: (row: TokenRow) => row.sample ?? null,
        },
        {
          key: "token",
          header: tcs("Token"),
          render: (row: TokenRow) => <span className="font-mono text-fg-primary">{row.token}</span>,
        },
        {
          key: "variable",
          header: tcs("CSS"),
          render: (row: TokenRow) => <code className="font-mono text-fg-muted">{row.variable}</code>,
        },
        {
          key: "utility",
          header: tcs("Utility"),
          render: (row: TokenRow) =>
            row.utility ? <code className="font-mono text-fg-accent">{row.utility}</code> : "—",
        },
        { key: "usage", header: tcs("Use for"), render: (row: TokenRow) => tcs(row.usage) },
      ]}
      rows={rows}
    />
  );
}
