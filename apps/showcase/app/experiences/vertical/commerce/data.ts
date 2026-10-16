/**
 * Northlight — one product, four variants, and the copy a storefront needs.
 *
 * Variants change the price and the stock line, which is the smallest model that
 * still demonstrates the thing that matters: a selector whose effect is visible
 * on the page rather than in a cart after a round trip.
 */

export interface Variant {
  id: string;
  label: string;
  price: number;
  stock: "in-stock" | "low" | "backorder";
  note: string;
}

export const PRODUCT = {
  name: "Northlight desk lamp",
  standfirst:
    "A lamp with one switch and one moving part. No app, no subscription, no firmware.",
  price: 148,
  currency: "USD",
  rating: 4.5,
  reviewCount: 86,
  description:
    "The arm is counterweighted rather than sprung, so it holds the position you leave it in for years instead of drifting down overnight. The diffuser is a single piece of opal glass; the rest is steel and paper cord.",
};

export const VARIANTS: Variant[] = [
  { id: "chalk", label: "Chalk white / oak", price: 148, stock: "in-stock", note: "Ships tomorrow" },
  { id: "graphite", label: "Graphite / oak", price: 148, stock: "in-stock", note: "Ships tomorrow" },
  { id: "brass", label: "Brass / walnut", price: 196, stock: "low", note: "Three left" },
  { id: "ink", label: "Ink / blackened steel", price: 232, stock: "backorder", note: "Ships in five weeks" },
];

export const SPECS = [
  { id: "height", label: "Reach", value: "620 mm" },
  { id: "bulb", label: "Bulb", value: "E27, 2700 K" },
  { id: "weight", label: "Weight", value: "2.4 kg" },
  { id: "warranty", label: "Warranty", value: "10 years" },
];

export const REVIEWS = [
  {
    id: "r1",
    author: "H. Lindqvist",
    score: 5,
    body: "Bought one in 2019 and a second in 2024. The first is indistinguishable from the new one.",
  },
  {
    id: "r2",
    author: "P. Achebe",
    score: 4,
    body: "Holds its position exactly as promised. The bulb it ships with is mediocre; replace it.",
  },
];

export const CHECKOUT_STEPS = [
  { id: "cart", label: "Cart" },
  { id: "delivery", label: "Delivery" },
  { id: "payment", label: "Payment" },
];
