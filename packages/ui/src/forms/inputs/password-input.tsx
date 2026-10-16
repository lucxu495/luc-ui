"use client";

import { RiEyeLine, RiEyeOffLine } from "@remixicon/react";
import { useState } from "react";
import { IconButton } from "../../components/icon-button";
import { Input, type InputProps } from "../../components/input";
import { cn } from "../../utils/cn";

export interface PasswordInputProps extends Omit<InputProps, "type" | "trailingAction"> {
  /**
   * Accessible name for the visibility toggle. Override when the surrounding
   * language is not English; the default is `Show password` / `Hide password`.
   */
  toggleLabels?: { show: string; hide: string };
  /** Start in the revealed state (rarely what you want). */
  defaultVisible?: boolean;
}

/**
 * A password field with a reveal toggle.
 *
 * Three rules, deliberately: the field keeps `type="password"` semantics for
 * password managers, the toggle is a real button with an accessible name, and
 * no policy is enforced here — length rules, breach checks and strength meters
 * are the product's business, not the design system's. Paste is never blocked.
 */
export function PasswordInput({
  toggleLabels = { show: "Show password", hide: "Hide password" },
  defaultVisible = false,
  className,
  autoComplete = "current-password",
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(defaultVisible);

  return (
    <Input
      {...props}
      type={visible ? "text" : "password"}
      autoComplete={autoComplete}
      spellCheck={false}
      // Nothing here touches onPaste/onCopy: a password field that refuses
      // paste breaks password managers and long passphrases alike.
      className={className}
      trailingAction={
        <IconButton
          label={visible ? toggleLabels.hide : toggleLabels.show}
          variant="ghost"
          size="sm"
          showTooltip={false}
          aria-pressed={visible}
          className={cn("text-fg-muted")}
          onClick={() => setVisible((current) => !current)}
          icon={visible ? <RiEyeOffLine /> : <RiEyeLine />}
        />
      }
    />
  );
}
