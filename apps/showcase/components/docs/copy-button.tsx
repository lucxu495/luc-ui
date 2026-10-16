"use client";

import { useState } from "react";
import { IconButton, Tooltip, cn } from "@luc/ui";
import { RiCheckLine, RiFileCopyLine } from "@remixicon/react";
import { useOptionalI18n } from "@/lib/i18n/provider";

export function CopyButton({ value, label, className }: { value: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const i18n = useOptionalI18n();
  const tcs = i18n?.tcs ?? ((source: string) => source);
  // The default is resolved through the dictionary rather than as a parameter
  // default, so the two strings stay visible to the coverage checker.
  const shown = tcs(label ?? tcs("Copy"));

  return (
    <Tooltip content={copied ? tcs("Copied") : shown}>
      <IconButton
        label={shown}
        variant="ghost"
        size="sm"
        showTooltip={false}
        className={className}
        icon={
          <span className="relative grid size-4 place-items-center">
            <RiFileCopyLine
              className={cn("absolute", "transition-[opacity,transform] duration-[var(--motion-fast)]", copied ? "scale-75 opacity-0" : "scale-100 opacity-100")}
            />
            <RiCheckLine
              className={cn(
                "absolute text-fg-positive",
                "transition-[opacity,transform] duration-[var(--motion-fast)]",
                copied ? "scale-100 opacity-100" : "scale-75 opacity-0",
              )}
            />
          </span>
        }
        onClick={() => {
          void navigator.clipboard?.writeText(value).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1400);
          });
        }}
      />
    </Tooltip>
  );
}
