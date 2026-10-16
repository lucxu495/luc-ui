"use client";

import { tradingViewWidgetById } from "../core/catalog";
import type { TradingViewWidgetBaseProps } from "../core/types";
import { TradingViewWebComponent } from "../web-components/web-component";

const DEFINITIONS = {
  rating: tradingViewWidgetById("broker-rating")!,
  reviews: tradingViewWidgetById("broker-reviews")!,
};

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
export function TradingViewBrokerRating({
  broker,
  showBrokerName,
  showReviews,
  theme,
  ...base
}: TradingViewBrokerRatingProps) {
  return (
    <TradingViewWebComponent
      {...base}
      definition={DEFINITIONS.rating}
      urlParams={{ broker }}
      settings={{ broker, showBrokerName, showReviews }}
      theme={theme}
    />
  );
}

export interface TradingViewBrokerReviewsProps extends TradingViewWidgetBaseProps {
  broker: string;
  showBrokerName?: boolean;
  showReviews?: boolean;
  transparent?: boolean;
}

/** A broker partner's rating plus recent reviews. */
export function TradingViewBrokerReviews({
  broker,
  showBrokerName,
  showReviews,
  theme,
  ...base
}: TradingViewBrokerReviewsProps) {
  return (
    <TradingViewWebComponent
      {...base}
      definition={DEFINITIONS.reviews}
      urlParams={{ broker }}
      settings={{ broker, showBrokerName, showReviews }}
      theme={theme}
    />
  );
}
