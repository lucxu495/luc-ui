import { cn } from "../utils/cn";

export interface PanelProps extends React.ComponentPropsWithRef<"div"> {
  /** `sunken` sits inside cards; `default` sits on the canvas. */
  tone?: "default" | "sunken" | "raised";
  /** Hairline frame. Default `true`. */
  bordered?: boolean;
}

const toneClass = {
  default: "bg-surface-default",
  sunken: "bg-surface-sunken",
  raised: "bg-surface-raised shadow-rest",
} as const;

/**
 * LUC Panel — a dense, low-chrome surface for toolbars, sidebars, code blocks
 * and nested regions. Panels do not carry elevation by default; they are the
 * structural layer beneath Cards.
 */
export function Panel({ className, tone = "default", bordered = true, ...props }: PanelProps) {
  return (
    <div
      data-slot="panel"
      className={cn(
        "rounded-lg",
        toneClass[tone],
        bordered && "border border-line-subtle",
        className,
      )}
      {...props}
    />
  );
}

export interface PanelHeaderProps extends React.ComponentPropsWithRef<"div"> {
  actions?: React.ReactNode;
}

export function PanelHeader({ className, actions, children, ...props }: PanelHeaderProps) {
  return (
    <div
      data-slot="panel-header"
      className={cn(
        "flex min-h-11 flex-wrap items-center justify-between gap-3 border-b border-line-subtle px-3.5 py-2",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 items-center gap-2.5 text-label text-fg-secondary">{children}</div>
      {actions ? <div className="flex shrink-0 items-center gap-1.5">{actions}</div> : null}
    </div>
  );
}

export function PanelBody({ className, ...props }: React.ComponentPropsWithRef<"div">) {
  return <div data-slot="panel-body" className={cn("p-3.5", className)} {...props} />;
}
