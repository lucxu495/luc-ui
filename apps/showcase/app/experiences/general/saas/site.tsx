"use client";

import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  DataTable,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  EmptyState,
  Field,
  Input,
  NativeSelect,
  NotificationCenter,
  SearchInput,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  StatusBadge,
  Switch,
  Tabs,
  dateColumn,
  textColumn,
  toast,
  type DataTableColumn,
  type StatusPreset,
} from "@luc/ui";
import { useI18n } from "@/lib/i18n/provider";
import { LEDGER_NAV, MEMBERS, NOTIFICATIONS, ROLES, ROLE_DESCRIPTIONS, type Member, type Role } from "./data";

/**
 * Ledgerline — the console a finance team works in all day.
 *
 * This is the opposite brief to the portfolio: nothing here may be expressive,
 * because the user is reading a number in row nine of a table and any movement
 * costs them their place. So the depth is `flat`, the density is compact, and the
 * spatial language shows up only where it carries meaning — the row under the
 * pointer, the dialog above the table, the notification badge that changed.
 *
 * Everything on the page is state: filtering the table, inviting a member (which
 * really adds a row), clearing notifications, and saving the workspace sheet.
 */

const STATUS_PRESET: Record<Member["status"], { status: StatusPreset; label: string }> = {
  active: { status: "healthy", label: "Active" },
  invited: { status: "pending", label: "Invited" },
  suspended: { status: "stale", label: "Suspended" },
};

export function LedgerlineConsole() {
  const { tcs } = useI18n();
  const [members, setMembers] = useState<Member[]>(MEMBERS);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<"all" | Role>("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("Analyst");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState("Vantia Research");
  const [strictTolerance, setStrictTolerance] = useState(true);

  const columns = useMemo<Array<DataTableColumn<Member>>>(
    () => [
      textColumn<Member, "name">("name", { header: tcs("Member"), locked: true, emphasis: true, size: 190 }),
      textColumn<Member, "email">("email", { header: tcs("Email"), size: 230 }),
      textColumn<Member, "role">("role", { header: tcs("Role"), size: 110 }),
      {
        id: "status",
        header: tcs("Status"),
        size: 120,
        cell: ({ row }) => (
          <StatusBadge
            status={STATUS_PRESET[row.original.status].status}
            size="sm"
            label={tcs(STATUS_PRESET[row.original.status].label)}
          />
        ),
      },
      dateColumn<Member, "lastActive">("lastActive", {
        header: tcs("Last active"),
        size: 160,
        style: "datetime",
      }),
      {
        id: "seats",
        header: tcs("Seat"),
        size: 80,
        cell: ({ row }) =>
          row.original.seats ? (
            <span className="luc-numeric text-fg-secondary">{tcs("Yes")}</span>
          ) : (
            <span className="luc-numeric text-fg-muted">{tcs("No")}</span>
          ),
      },
    ],
    [tcs],
  );

  const filtered = members.filter(
    (member) =>
      (role === "all" || member.role === role) &&
      (query.trim() === "" ||
        `${member.name} ${member.email}`.toLowerCase().includes(query.trim().toLowerCase())),
  );

  const unread = notifications.filter((item) => !item.read).length;

  const invite = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail.trim())) {
      setInviteError(tcs("An email address needs an @ and a domain before it can be invited."));
      return;
    }
    setInviteError(null);
    const handle = inviteEmail.trim().split("@")[0] ?? "new member";
    const next: Member = {
      id: `m-${members.length + 1}`,
      name: handle.replace(/[._]/g, " "),
      email: inviteEmail.trim(),
      role: inviteRole,
      status: "invited",
      lastActive: "2026-09-26T06:00:00Z",
      seats: inviteRole === "Viewer" ? 0 : 1,
    };
    setMembers((current) => [...current, next]);
    setInviteOpen(false);
    setInviteEmail("");
    toast.success(tcs("Invitation sent"));
  };

  return (
    <div data-slot="ledgerline" data-space="flat" className="flex min-h-[46rem] flex-col lg:flex-row">
      {/* --------------------------------------------------------- sidebar */}
      <nav
        aria-label={tcs("Workspace")}
        className="flex shrink-0 flex-col gap-1 border-b border-line-subtle bg-surface-sunken p-3 lg:w-56 lg:border-r lg:border-b-0"
      >
        <p className="px-2 py-1.5 text-micro text-fg-muted">{tcs("Workspace")}</p>
        {/*
          * The sidebar is chrome, not a control.
          *
          * These were buttons with no handler and a hardcoded current item —
          * focus stops that did nothing, which is the one thing a specimen may
          * not have, because the frame promises "every action below changes
          * local state". This console builds the Members area; the other four
          * are named for context and marked as the sheet of a product that
          * would exist, so they are not focusable and nothing is promised.
          */}
        {LEDGER_NAV.map((item) => {
          const current = item.id === "members";
          return (
            <span
              key={item.id}
              aria-current={current ? "page" : undefined}
              aria-disabled={current ? undefined : true}
              className={
                current
                  ? "rounded-sm bg-surface-selected px-2 py-1.5 text-left text-label font-medium text-fg-accent"
                  : "rounded-sm px-2 py-1.5 text-left text-label text-fg-muted"
              }
            >
              {tcs(item.label)}
            </span>
          );
        })}
        <div className="mt-auto flex flex-col gap-2 border-t border-line-subtle pt-3">
          <span className="px-2 text-micro text-fg-muted">{tcs("Seats in use")}</span>
          <span className="px-2 text-label text-fg-primary luc-numeric">
            {members.filter((member) => member.seats).length} / 20
          </span>
          <Button size="sm" variant="outline" onClick={() => setSettingsOpen(true)}>
            {tcs("Workspace settings")}
          </Button>
        </div>
      </nav>

      {/* -------------------------------------------------------- workspace */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-3 border-b border-line-subtle px-4 py-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-title font-semibold text-fg-primary">{tcs("Members")}</h2>
            <p className="text-caption text-fg-muted">
              {tcs("Who can see the ledger, and what they can change.")}
            </p>
          </div>
          <SearchInput
            aria-label={tcs("Search members")}
            placeholder={tcs("Name or email…")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full sm:w-56"
          />
          <NativeSelect
            aria-label={tcs("Filter by role")}
            value={role}
            onChange={(event) => setRole(event.target.value as "all" | Role)}
            options={[
              { value: "all", label: tcs("All roles") },
              ...ROLES.map((option) => ({ value: option, label: option })),
            ]}
            size="sm"
          />
          <NotificationCenter
            items={notifications.map((item) => ({
              id: item.id,
              title: tcs(item.title),
              description: tcs(item.description),
              timestamp: tcs(item.timestamp),
              tone: item.tone,
              read: item.read,
            }))}
            label={`${tcs("Notifications")}${unread ? ` (${unread})` : ""}`}
            emptyTitle={tcs("Nothing waiting")}
            emptyDescription={tcs("New activity will appear here.")}
            onRead={(id) =>
              setNotifications((current) =>
                current.map((item) => (item.id === id ? { ...item, read: true } : item)),
              )
            }
            onReadAll={() =>
              setNotifications((current) => current.map((item) => ({ ...item, read: true })))
            }
            onDismiss={(id) =>
              setNotifications((current) => current.filter((item) => item.id !== id))
            }
          />
          <Button size="sm" variant="accent" onClick={() => setInviteOpen(true)}>
            {tcs("Invite member")}
          </Button>
        </div>

        <Tabs defaultValue="table" className="flex min-h-0 flex-1 flex-col">
          <Tabs.List className="px-4 pt-3">
            <Tabs.Trigger value="table">{tcs("Directory")}</Tabs.Trigger>
            <Tabs.Trigger value="roles">{tcs("Roles")}</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="table" className="min-h-0 flex-1 p-4">
            {filtered.length === 0 ? (
              <EmptyState
                title={tcs("No members match that filter")}
                description={tcs(
                  "Clear the search or choose another role. Nothing was removed from the workspace.",
                )}
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setQuery("");
                      setRole("all");
                    }}
                  >
                    {tcs("Clear filters")}
                  </Button>
                }
              />
            ) : (
              <DataTable<Member>
                ariaLabel={tcs("Workspace members")}
                ariaDescription={tcs(
                  "Twelve names, their role and when they were last active.",
                )}
                data={filtered}
                columns={columns}
                getRowId={(row) => row.id}
                density="compact"
                stickyHeader
                maxHeight="34rem"
                emptyState={<EmptyState title={tcs("No members yet")} />}
              />
            )}
          </Tabs.Content>
          <Tabs.Content value="roles" className="p-4">
            <ul className="grid list-none gap-3 sm:grid-cols-2">
              {ROLES.map((option) => (
                <li
                  key={option}
                  className="luc-rest flex flex-col gap-1.5 rounded-sm border border-line-subtle bg-surface-raised p-4"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-label font-semibold text-fg-primary">{option}</span>
                    <Badge tone={option === "Owner" ? "accent" : "neutral"} size="sm">
                      {members.filter((member) => member.role === option).length}
                    </Badge>
                  </span>
                  <span className="text-caption text-fg-secondary text-pretty">
                    {tcs(ROLE_DESCRIPTIONS[option])}
                  </span>
                </li>
              ))}
            </ul>
          </Tabs.Content>
        </Tabs>
      </div>

      {/* ----------------------------------------------------- invite dialog */}
      <DialogRoot open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tcs("Invite a member")}</DialogTitle>
            <DialogDescription>
              {tcs("They receive one email. Viewers never take a seat.")}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-4">
            <Field
              label={tcs("Work email")}
              error={inviteError ?? undefined}
              required
            >
              <Input
                type="email"
                name="invite-email"
                autoComplete="off"
                spellCheck={false}
                placeholder={tcs("name@company.com")}
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
              />
            </Field>
            <Field label={tcs("Role")} description={tcs(ROLE_DESCRIPTIONS[inviteRole])}>
              <NativeSelect
                name="invite-role"
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value as Role)}
                options={ROLES.map((option) => ({ value: option, label: option }))}
              />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>
              {tcs("Cancel")}
            </Button>
            <Button variant="accent" onClick={invite}>
              {tcs("Send invitation")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* --------------------------------------------------- settings sheet */}
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="right" size="md">
          <SheetHeader>
            <SheetTitle>{tcs("Workspace settings")}</SheetTitle>
            <SheetDescription>
              {tcs("Saved locally. Nothing is sent to a server.")}
            </SheetDescription>
          </SheetHeader>
          <SheetBody className="flex flex-col gap-4">
            <Field label={tcs("Workspace name")}>
              <Input
                name="workspace"
                autoComplete="organization"
                value={workspaceName}
                onChange={(event) => setWorkspaceName(event.target.value)}
              />
            </Field>
            <Field
              label={tcs("Reconciliation tolerance")}
              description={tcs("Match balances to the cent rather than to the nearest unit.")}
            >
              <Switch
                checked={strictTolerance}
                onCheckedChange={setStrictTolerance}
                label={tcs("Match balances to the cent")}
              />
            </Field>
          </SheetBody>
          <SheetFooter>
            <Button variant="ghost" onClick={() => setSettingsOpen(false)}>
              {tcs("Close")}
            </Button>
            <Button
              variant="accent"
              onClick={() => {
                setSettingsOpen(false);
                toast.success(tcs("Settings saved"), { description: workspaceName });
              }}
            >
              {tcs("Save changes")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
