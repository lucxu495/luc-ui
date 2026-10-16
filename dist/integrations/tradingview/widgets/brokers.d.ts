import { TradingViewWidgetBaseProps } from "../core/types.js";
//#region src/integrations/tradingview/widgets/brokers.d.ts
export interface TradingViewBrokerRatingProps extends TradingViewWidgetBaseProps {
  /** Your TradingView broker slug, e.g. `sample`. Required by the provider. */
  broker: string;
  showBrokerName?: boolean;
  showReviews?: boolean;
  transparent?: boolean;
}
/**
 * A broker partner's TradingView rating.
 *
 * The broker slug is part of the provider's *script URL*, which is why this
 * wrapper resolves a per-broker module address instead of sharing one: two
 * brokers on one page really are two modules.
 */
export declare function TradingViewBrokerRating({ broker, showBrokerName, showReviews, theme, ...base }: TradingViewBrokerRatingProps): import("react").JSX.Element;
export interface TradingViewBrokerReviewsProps extends TradingViewWidgetBaseProps {
  broker: string;
  showBrokerName?: boolean;
  showReviews?: boolean;
  transparent?: boolean;
}
/** A broker partner's rating plus recent reviews. */
export declare function TradingViewBrokerReviews({ broker, showBrokerName, showReviews, theme, ...base }: TradingViewBrokerReviewsProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=brokers.d.ts.map