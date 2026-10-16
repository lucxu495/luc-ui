import { cn } from "@luc/ui";

export function Swatch({
  variable,
  label,
  detail,
  className,
  bordered = true,
  /** Render the swatch as the *text* colour on an accent fill instead. */
  onAccent = false,
}: {
  variable: string;
  label: string;
  detail?: string;
  className?: string;
  bordered?: boolean;
  onAccent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          "flex h-16 w-full items-center justify-center rounded-md text-caption",
          bordered && "border border-line-subtle",
          "shadow-[inset_0_1px_0_0_var(--line-subtle)]",
          className,
        )}
        style={
          onAccent
            ? { background: "var(--accent-default)", color: `var(${variable})` }
            : { background: `var(${variable})` }
        }
      >
        {onAccent ? "Aa" : null}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="font-mono text-caption text-fg-primary">{label}</span>
        <span className="font-mono text-micro text-fg-muted">{variable}</span>
        {detail ? <span className="text-micro text-fg-muted">{detail}</span> : null}
      </div>
    </div>
  );
}

export function SwatchGrid({
  items,
  columns = 4,
}: {
    items: { variable: string; label: string; detail?: string; bordered?: boolean; onAccent?: boolean }[];
  columns?: 2 | 3 | 4 | 6;
}) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-3",
        columns === 4 && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
        /*
         * Two columns at phone width, not three.
         *
         * A swatch carries its token name underneath, and `status.positive.soft`
         * is 145px of unbreakable identifier: three columns at 390px leaves
         * ~106px each, so the longest names overflowed their cell and pushed the
         * document 19px sideways on `/foundations/colors`. Two columns fit them,
         * and a token name is not something to hyphenate.
         */
        columns === 6 && "grid-cols-2 sm:grid-cols-4 lg:grid-cols-6",
      )}
    >
      {items.map((item) => (
        <Swatch key={item.variable} {...item} />
      ))}
    </div>
  );
}

export function ColorChip({ variable, className }: { variable: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-3.5 rounded-[4px] border border-line-subtle", className)}
      style={{ background: `var(${variable})` }}
    />
  );
}
