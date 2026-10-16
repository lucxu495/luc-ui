/*
 * Live Demos — Data display.
 *
 * `column-visibility-menu`, `data-details`, `data-table-pagination`,
 * `data-table-toolbar`, `delta`, `facet-filter`, `sortable-list`, `stat-card`,
 * `timestamp`, `transfer-list`.
 */

import {
  Badge,
  Delta,
  Icon,
  List,
  ListFooter,
  ListHeader,
  ListItem,
  StatCard,
  Timestamp,
  type DeltaProps,
  type StatCardProps,
  type TimestampProps,
} from "@luc/ui";
import type { DemoSpec } from "../types";
import { DataDetailsDemo } from "@/components/demo/islands/details-demo";
import { SortableListDemo } from "@/components/demo/islands/list-demo";
import { TableContextDemo } from "@/components/demo/islands/table-demo";
import { composition, demo } from "../jsx";

/*
 * The four table parts (`DataTableToolbar`, `DataTablePagination`,
 * `ColumnVisibilityMenu`, `FacetFilter`) are documented where they belong —
 * inside a real table — because that is the only way they render at all. The
 * note on each one says so, so a reader is not left wondering why a toolbar
 * arrives with a table attached.
 */
const TABLE_NOTE = "Shown inside a real table, which is the only context the component renders in.";

export const dataDisplayDemos: readonly DemoSpec[] = [
  demo<DeltaProps>({
    id: "delta",
    component: "Delta",
    props: { value: 2.47 },
    render: (props) => <Delta {...props} />,
  }),
  demo<StatCardProps>({
    id: "stat-card",
    component: "StatCard",
    props: { label: "Sharpe", value: 1.24, delta: 0.06, kind: "decimal" },
    render: (props) => <StatCard {...props} />,
  }),
  demo<TimestampProps>({
    id: "timestamp",
    component: "Timestamp",
    props: { value: "2026-10-06T14:05:00Z", style: "datetime", timeZone: "UTC" },
    render: (props) => <Timestamp {...props} />,
  }),
  composition({
    id: "data-details",
    node: <DataDetailsDemo />,
    note: "The rows behind a surface, one control away, without pushing the page down.",
    code: `<DataDetails title="Close, eight sessions" description="The exact rows behind the chart." size="md">
  <table className="w-full text-caption tabular-nums">
    <thead>
      <tr className="text-left text-fg-muted">
        <th scope="col">Date</th>
        <th scope="col">Close</th>
      </tr>
    </thead>
    <tbody>
      {rows.map((row) => (
        <tr key={row.date} className="border-t border-line-subtle">
          <td>{row.date}</td>
          <td>{row.close.toFixed(1)}</td>
        </tr>
      ))}
    </tbody>
  </table>
</DataDetails>`,
  }),
  composition({
    id: "data-table-toolbar",
    node: <TableContextDemo part="toolbar" />,
    note: TABLE_NOTE,
    code: `<DataTable
  columns={columns}
  data={runs}
  ariaLabel="Research runs"
  toolbar={
    <DataTableToolbar
      search={{ label: "Search runs", placeholder: "Search runs…" }}
      actions={<DataTableSelectionCount label="selected" />}
    />
  }
/>`,
  }),
  composition({
    id: "data-table-pagination",
    node: <TableContextDemo part="pagination" />,
    note: TABLE_NOTE,
    code: `<DataTable
  columns={columns}
  data={runs}
  ariaLabel="Research runs"
  footer={<DataTablePagination rowLabel="runs" />}
/>`,
  }),
  composition({
    id: "column-visibility-menu",
    node: <TableContextDemo part="columns" />,
    note: TABLE_NOTE,
    code: `<DataTable
  columns={columns}
  data={runs}
  ariaLabel="Research runs"
  enableColumnVisibility
  toolbar={<DataTableToolbar actions={<ColumnVisibilityMenu />} />}
/>`,
  }),
  composition({
    id: "facet-filter",
    node: <TableContextDemo part="facets" />,
    note: TABLE_NOTE,
    code: `<DataTable
  columns={columns}
  data={runs}
  ariaLabel="Research runs"
  enableFiltering
  toolbar={
    <DataTableToolbar>
      <FacetFilter columnId="status" label="Status" />
    </DataTableToolbar>
  }
/>`,
  }),
  composition({
    id: "sortable-list",
    node: <SortableListDemo />,
    note: "The list is controlled: it reports the complete new order and the caller owns it.",
    code: `const [order, setOrder] = useState(items.map((item) => item.id));

<SortableList
  label="Talk outline"
  items={order.map((id) => items.find((item) => item.id === id)!)}
  onReorder={setOrder}
/>`,
  }),
  /*
   * `transfer-list` has no demo here any more.
   *
   * The Forms review split `/components/color-picker` (which documented
   * `TransferList` as its second half) and gave the component a written page at
   * `/components/transfer-list` with three configurations of its own. A demo
   * spec here as well would be a second, silently-unrendered copy of the same
   * specimen — the generated route no longer runs, because a static `page.tsx`
   * wins — so the entry keeps its registry row and loses the duplicate.
   */
  composition({
    id: "list",
    node: (
      <List bordered divided aria-label="Recent backtests">
        <ListItem
          leading={<Icon name="play" tone="muted" />}
          title="Momentum, 90 days"
          description="12 symbols · annualised 14.2%"
          meta="2m ago"
          trailing={
            <Badge tone="positive" size="sm">
              Passed
            </Badge>
          }
        />
        <ListItem
          leading={<Icon name="refresh" tone="muted" />}
          title="Mean reversion, 30 days"
          description="8 symbols · annualised 6.1%"
          meta="1h ago"
          trailing={
            <Badge tone="neutral" size="sm">
              Running
            </Badge>
          }
        />
        <ListItem
          leading={<Icon name="alert" tone="muted" />}
          title="Carry, 180 days"
          description="Provider returned 503 for the last session"
          meta="Yesterday"
          trailing={
            <Badge tone="negative" size="sm">
              Failed
            </Badge>
          }
        />
      </List>
    ),
    code: `<List aria-label="Recent backtests" bordered divided>
  <ListItem
    leading={<Icon name="play" />}
    title="Momentum, 90 days"
    description="12 symbols · annualised 14.2%"
    meta="2m ago"
    trailing={<Badge tone="positive">Passed</Badge>}
  />
  <ListItem
    leading={<Icon name="alert" />}
    title="Carry, 180 days"
    description="Provider returned 503 for the last session"
    meta="Yesterday"
    trailing={<Badge tone="negative">Failed</Badge>}
  />
</List>`,
    note: "A real list, not a column of cards: one hairline between rows, and the same five slots on every row so the eye can run down the column.",
    examples: [
      {
        title: "Edges and a count",
        node: (
          <div className="overflow-hidden rounded-lg border border-line-subtle">
            <ListHeader
              title="Recent runs"
              description="Last 24 hours"
              actions={<Badge tone="neutral" size="sm">Live</Badge>}
            />
            <List divided aria-label="Recent runs, shorter">
              <ListItem title="Run 128" meta="09:14" />
              <ListItem title="Run 127" meta="08:52" />
            </List>
            <ListFooter>Showing 2 of 1,284</ListFooter>
          </div>
        ),
        code: `<ListHeader title="Recent runs" description="Last 24 hours" actions={<Badge>Live</Badge>} />
<List divided aria-label="Recent runs">
  <ListItem title="Run 128" meta="09:14" />
  <ListItem title="Run 127" meta="08:52" />
</List>
<ListFooter>Showing 2 of 1,284</ListFooter>`,
        note: "The header and footer are the list's own edges — a title with the one action it is about, and the count that says whether to keep reading.",
      },
      {
        title: "Bare rows",
        node: (
          <List aria-label="Symbols without a frame">
            <ListItem title="BTCUSDT" description="1h · 1,284 bars" meta="0.4%" />
            <ListItem title="ETHUSDT" description="1h · 1,284 bars" meta="−0.2%" />
          </List>
        ),
        code: `<List aria-label="Symbols">
  <ListItem title="BTCUSDT" description="1h · 1,284 bars" meta="0.4%" />
  <ListItem title="ETHUSDT" description="1h · 1,284 bars" meta="−0.2%" />
</List>`,
        note: "Without `bordered` the list is just the rows, which is what a panel or a sidebar wants.",
      },
    ],
  }),
];
