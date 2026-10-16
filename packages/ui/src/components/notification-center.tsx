"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { RiBellLine, RiCheckDoubleLine, RiCloseLine } from "@remixicon/react";
import { cn } from "../utils/cn";
import { Badge } from "./badge";
import { IconButton } from "./icon-button";
import { PopoverContent, PopoverRoot, PopoverTrigger } from "./popover";
import { Text } from "./typography";

/**
 * LUC NotificationCenter — the inbox a bell icon opens.
 *
 * A toast is for something the user just caused; this is for everything that
 * accumulated while they were elsewhere. That difference is why it is a list
 * with state (`read`, `tone`, `timestamp`) rather than a queue that expires:
 * nothing here disappears on a timer, and "mark all read" is an explicit act.
 *
 * The list is fully controlled — the application owns persistence, the badge
 * count and what "read" means for its product — while the open/closed state of
 * the panel stays local, because a popover is not a route.
 */

export interface NotificationTone {
  tone?: "neutral" | "info" | "positive" | "warning" | "negative";
}

export interface NotificationItem extends NotificationTone {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  /** Pre-formatted by the caller — a relative time is a product decision. */
  timestamp?: ReactNode;
  read?: boolean;
  icon?: ReactNode;
  /** Renders the row as a link. */
  href?: string;
}

export interface NotificationCenterProps {
  items: readonly NotificationItem[];
  onRead?: (id: string) => void;
  onReadAll?: () => void;
  onDismiss?: (id: string) => void;
  onOpenItem?: (id: string) => void;
  label?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  footer?: ReactNode;
  className?: string;
}

const toneDot = {
  neutral: "bg-fg-muted",
  info: "bg-info",
  positive: "bg-positive",
  warning: "bg-warning",
  negative: "bg-negative",
} as const;

export function NotificationCenter({
  items,
  onRead,
  onReadAll,
  onDismiss,
  onOpenItem,
  label = "Notifications",
  emptyTitle = "You are up to date",
  emptyDescription = "New notifications will appear here.",
  footer,
  className,
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const headingId = useId();
  const unread = useMemo(() => items.filter((item) => !item.read).length, [items]);

  return (
    <PopoverRoot open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={unread > 0 ? `${label}, ${unread} unread` : label}
          className={cn(
            "luc-transition luc-focus relative inline-grid size-8 place-items-center rounded-md text-fg-secondary",
            "hover:bg-surface-interactive-hover hover:text-fg-primary",
            className,
          )}
        >
          <RiBellLine aria-hidden="true" className="size-4" />
          {unread > 0 ? (
            <span
              aria-hidden="true"
              className="absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full bg-accent-default px-1 text-[10px] leading-4 font-semibold text-fg-on-accent luc-numeric"
            >
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent width="md" align="end" className="flex max-h-[70vh] w-80 flex-col overflow-hidden p-0">
        <header className="flex items-center justify-between gap-3 border-b border-line-subtle px-3.5 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <h2 id={headingId} className="text-label text-fg-primary">
              {label}
            </h2>
            {unread > 0 ? <Badge tone="accent">{unread}</Badge> : null}
          </div>
          {unread > 0 && onReadAll ? (
            <button
              type="button"
              onClick={onReadAll}
              className="luc-transition luc-focus inline-flex items-center gap-1 rounded-sm px-1.5 py-1 text-caption text-fg-muted hover:bg-surface-interactive-hover hover:text-fg-primary"
            >
              <RiCheckDoubleLine aria-hidden="true" className="size-3.5" />
              Mark all read
            </button>
          ) : null}
        </header>

        <ul aria-labelledby={headingId} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {items.length === 0 ? (
            <li className="flex flex-col items-center gap-1 px-4 py-10 text-center">
              <span
                aria-hidden="true"
                className="grid size-9 place-items-center rounded-full bg-surface-interactive text-fg-muted"
              >
                <RiCheckDoubleLine className="size-4" />
              </span>
              <Text variant="label" className="text-fg-primary">
                {emptyTitle}
              </Text>
              <Text variant="caption" tone="muted">
                {emptyDescription}
              </Text>
            </li>
          ) : (
            items.map((item) => {
              const Row = (item.href ? "a" : "div") as React.ElementType;
              return (
                <li
                  key={item.id}
                  className={cn("group/notification relative border-b border-line-subtle last:border-b-0")}
                >
                  <Row
                    {...(item.href ? { href: item.href } : {})}
                    onClick={() => {
                      onOpenItem?.(item.id);
                      if (!item.read) onRead?.(item.id);
                    }}
                    onKeyDown={(event: React.KeyboardEvent) => {
                      if (!item.href && (event.key === "Enter" || event.key === " ")) {
                        event.preventDefault();
                        onOpenItem?.(item.id);
                        if (!item.read) onRead?.(item.id);
                      }
                    }}
                    role={item.href ? undefined : "button"}
                    tabIndex={item.href ? undefined : 0}
                    className={cn(
                      "luc-transition luc-focus-inset flex cursor-pointer gap-2.5 px-3.5 py-2.5 pr-9",
                      "hover:bg-surface-interactive-hover",
                      !item.read && "bg-surface-selected/40",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-1 size-1.5 shrink-0 rounded-full",
                        item.read ? "bg-transparent" : toneDot[item.tone ?? "neutral"],
                      )}
                    />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex items-baseline gap-2">
                        <span
                          className={cn(
                            "min-w-0 flex-1 truncate text-label",
                            item.read ? "text-fg-secondary" : "text-fg-primary",
                          )}
                        >
                          {item.title}
                        </span>
                        {item.timestamp ? (
                          <span className="shrink-0 text-micro text-fg-muted luc-numeric">{item.timestamp}</span>
                        ) : null}
                      </span>
                      {item.description ? (
                        <span className="line-clamp-2 text-caption text-fg-muted">{item.description}</span>
                      ) : null}
                    </span>
                  </Row>
                  {onDismiss ? (
                    <IconButton
                      variant="ghost"
                      size="sm"
                      /*
                       * Revealed on hover and on focus — and *always* on a
                       * device without hover.
                       *
                       * The reveal is an optical nicety on a pointer device: the
                       * row stays calm until the reader is on it. On a touch
                       * screen there is no hover to reveal it with, so the
                       * control existed, was tappable, and was invisible — an
                       * affordance nobody can find. There, it is simply shown.
                       */
                      className="absolute top-1.5 right-1.5 opacity-0 group-hover/notification:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
                      label={`Dismiss ${typeof item.title === "string" ? item.title : label}`}
                      icon={<RiCloseLine />}
                      onClick={() => onDismiss(item.id)}
                    />
                  ) : null}
                </li>
              );
            })
          )}
        </ul>

        {footer ? <div className="border-t border-line-subtle px-3.5 py-2">{footer}</div> : null}
      </PopoverContent>
    </PopoverRoot>
  );
}
