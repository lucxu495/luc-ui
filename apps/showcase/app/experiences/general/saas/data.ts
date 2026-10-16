/**
 * Fixtures for the Ledgerline console.
 *
 * Deliberately twelve members and not four: a table only shows its density,
 * its column alignment and its empty state at a realistic row count, and a
 * filter bar is only worth having when filtering actually removes rows.
 */

export interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "invited" | "suspended";
  lastActive: string;
  seats: number;
}

export type Role = "Owner" | "Admin" | "Analyst" | "Viewer";

export const ROLES: readonly Role[] = ["Owner", "Admin", "Analyst", "Viewer"];

export const MEMBERS: Member[] = [
  { id: "m-01", name: "Priya Raman", email: "priya@vantia.example", role: "Owner", status: "active", lastActive: "2026-09-26T09:12:00Z", seats: 1 },
  { id: "m-02", name: "Tomas Lind", email: "tomas@vantia.example", role: "Admin", status: "active", lastActive: "2026-09-26T08:40:00Z", seats: 1 },
  { id: "m-03", name: "Rae Halloway", email: "rae@vantia.example", role: "Analyst", status: "active", lastActive: "2026-09-25T17:02:00Z", seats: 1 },
  { id: "m-04", name: "Mei Watanabe", email: "mei@vantia.example", role: "Analyst", status: "active", lastActive: "2026-09-25T13:31:00Z", seats: 1 },
  { id: "m-05", name: "Danilo Ferraro", email: "danilo@vantia.example", role: "Viewer", status: "active", lastActive: "2026-09-24T20:15:00Z", seats: 0 },
  { id: "m-06", name: "Ifeoma Nwosu", email: "ifeoma@vantia.example", role: "Admin", status: "active", lastActive: "2026-09-24T11:58:00Z", seats: 1 },
  { id: "m-07", name: "Jonas Weber", email: "jonas@vantia.example", role: "Viewer", status: "suspended", lastActive: "2026-08-02T10:04:00Z", seats: 0 },
  { id: "m-08", name: "Aiko Tanaka", email: "aiko@vantia.example", role: "Analyst", status: "active", lastActive: "2026-09-26T07:45:00Z", seats: 1 },
  { id: "m-09", name: "Léa Moreau", email: "lea@vantia.example", role: "Viewer", status: "invited", lastActive: "2026-09-26T06:00:00Z", seats: 0 },
  { id: "m-10", name: "Samir Haddad", email: "samir@vantia.example", role: "Analyst", status: "active", lastActive: "2026-09-23T15:27:00Z", seats: 1 },
  { id: "m-11", name: "Nora Berg", email: "nora@vantia.example", role: "Viewer", status: "invited", lastActive: "2026-09-26T06:00:00Z", seats: 0 },
  { id: "m-12", name: "Youssef Amrani", email: "youssef@vantia.example", role: "Viewer", status: "active", lastActive: "2026-09-22T09:09:00Z", seats: 0 },
];

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  Owner: "Everything, including billing and deleting the workspace.",
  Admin: "Members, integrations and every report.",
  Analyst: "Build and publish reports. Cannot change members.",
  Viewer: "Read published reports. Never counts as a seat.",
};

export interface WorkspaceNotification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  tone: "info" | "positive" | "warning";
  read: boolean;
}

export const NOTIFICATIONS: WorkspaceNotification[] = [
  {
    id: "n-1",
    title: "Import finished",
    description: "The September ledger import closed with 3 rows to review.",
    timestamp: "12 minutes ago",
    tone: "positive",
    read: false,
  },
  {
    id: "n-2",
    title: "Two invitations are waiting",
    description: "Léa Moreau and Nora Berg have not accepted yet.",
    timestamp: "2 hours ago",
    tone: "info",
    read: false,
  },
  {
    id: "n-3",
    title: "Reconciliation drift",
    description: "Balances diverged by more than the tolerance on 24 September.",
    timestamp: "Yesterday",
    tone: "warning",
    read: true,
  },
];

export const LEDGER_NAV = [
  { id: "overview", label: "Overview" },
  { id: "members", label: "Members" },
  { id: "reconciliation", label: "Reconciliation" },
  { id: "integrations", label: "Integrations" },
  { id: "audit", label: "Audit log" },
] as const;
