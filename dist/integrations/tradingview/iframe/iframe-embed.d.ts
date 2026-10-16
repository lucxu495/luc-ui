import { TradingViewRawConfig, TradingViewWidgetBaseProps } from "../core/types.js";
import { TradingViewWidgetDefinition } from "../core/catalog.js";
import { ReactNode } from "react";
//#region src/integrations/tradingview/iframe/iframe-embed.d.ts
export interface TradingViewIframeProps extends TradingViewWidgetBaseProps {
  definition: TradingViewWidgetDefinition;
  /** The provider configuration, already themed and typed by the wrapper. */
  providerConfig: TradingViewRawConfig;
  /** Provider attribution: the link and label of the official copyright block. */
  attribution: {
    href: string;
    label: string;
    trailing?: readonly {
      href: string;
      label: string;
    }[];
  };
  /** Extra LUC-side description appended after the provider's trademark text. */
  footnote?: ReactNode;
}
/**
 * The one iframe adapter.
 *
 * React owns a single empty host; everything inside it — the provider's
 * container, its `__widget` element, the attribution block and the embed script
 * — is built imperatively, because the provider *replaces* the node it is given
 * with its iframe. Letting React manage those nodes would leave React's tree
 * describing elements that no longer exist, and the resulting removal error
 * would only show up on unmount (and in StrictMode).
 *
 * The attribution block is part of that markup on purpose: it is the provider's
 * own copyright element, exactly as the official snippet ships it, and nothing
 * here can cover it.
 */
export declare function TradingViewIframe({ definition, providerConfig, attribution, footnote, height, minHeight, className, title, theme: themeProp, loading, timeoutMs, onStatusChange, fallback }: TradingViewIframeProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=iframe-embed.d.ts.map