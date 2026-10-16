/**
 * Attribute and configuration serialisation.
 *
 * Web Components can only receive strings and booleans, and TradingView's own
 * schema converts them in specific ways (upper-cased symbols, comma-separated
 * lists, JSON for structured values). Those rules are transcribed from the
 * provider's public widget schema so a LUC prop and a pasted provider snippet
 * produce byte-identical attributes.
 */

import type { TradingViewAttributeSpec, TradingViewWidgetDefinition } from "./catalog";
import type { TradingViewLocale, TradingViewSymbolSector } from "./types";

export type AttributeValue = string | true | undefined;

/**
 * Convert one prop into the attribute value the provider expects.
 *
 * Returns `undefined` for "do not render this attribute" — an omitted prop must
 * not become `attr=""`, which the provider reads as an explicit empty value.
 */
export function serializeAttribute(
  spec: TradingViewAttributeSpec,
  value: unknown,
): AttributeValue {
  if (value === undefined || value === null) return undefined;

  switch (spec.encoding) {
    case "boolean":
      return value ? true : undefined;
    case "list": {
      if (!Array.isArray(value)) return undefined;
      const entries = value.map((entry) => String(entry).trim()).filter(Boolean);
      return entries.length > 0 ? entries.join(",") : undefined;
    }
    case "json": {
      if (typeof value === "string") return value;
      if (Array.isArray(value) && value.length === 0) return undefined;
      if (typeof value === "object") return JSON.stringify(value);
      return String(value);
    }
    case "upper": {
      const text = String(value).trim();
      return text ? text.toUpperCase() : undefined;
    }
    case "lower": {
      const text = String(value).trim();
      return text ? text.toLowerCase() : undefined;
    }
    default: {
      const text = String(value);
      return text.length > 0 ? text : undefined;
    }
  }
}

/**
 * Build the full attribute map for a widget.
 *
 * Provider configuration from the `config` escape hatch is merged *under* the
 * typed props: a caller cannot use it to overwrite a LUC-controlled attribute.
 */
export function buildWebComponentAttributes(options: {
  definition: TradingViewWidgetDefinition;
  props: Record<string, unknown>;
  extras?: Record<string, unknown>;
  config?: Record<string, unknown>;
}): Record<string, AttributeValue> {
  const { definition, props, extras = {}, config } = options;
  const specs = definition.attributes ?? {};
  const out: Record<string, AttributeValue> = {};

  // 1. The escape hatch, but only for attribute names the widget declares.
  if (config) {
    for (const [key, spec] of Object.entries(specs)) {
      if (key in config) out[spec.attribute] = serializeAttribute(spec, config[key]);
    }
  }
  // 2. Typed props and LUC-derived values win.
  for (const [key, value] of Object.entries({ ...extras, ...props })) {
    const spec = specs[key];
    if (!spec) continue;
    out[spec.attribute] = serializeAttribute(spec, value);
  }
  return out;
}

/** The provider's own symbol type, kept deliberately lightweight. */
export type TradingViewSymbol = string;

/**
 * Reject an obviously malformed symbol before it reaches the provider.
 *
 * LUC cannot validate the full symbol space offline (TradingView exposes tens of
 * thousands), so this only catches the cases that would render an error inside
 * the widget: empty values and values with characters that cannot appear in
 * `EXCHANGE:TICKER`.
 */
export function isValidTradingViewSymbol(symbol: string): boolean {
  const trimmed = symbol.trim();
  if (!trimmed) return false;
  return /^[A-Za-z0-9._\-+:!]+$/.test(trimmed);
}

export function assertTradingViewSymbol(symbol: string): string {
  const trimmed = symbol.trim();
  if (!isValidTradingViewSymbol(trimmed)) {
    throw new Error(
      `[luc-ui] "${symbol}" is not a valid TradingView symbol. Use the provider's EXCHANGE:TICKER form, e.g. "NASDAQ:AAPL".`,
    );
  }
  return trimmed;
}

/** Encode symbol sectors for the widgets whose sections arrive as an attribute. */
export function serializeSymbolSectors(sectors: readonly TradingViewSymbolSector[] | undefined) {
  if (!sectors || sectors.length === 0) return undefined;
  return sectors.map((sector) => ({
    sectionName: sector.sectionName,
    symbols: sector.symbols.map((symbol) => symbol.trim()).filter(Boolean),
  }));
}

/** The provider link for a symbol page, used by the attribution block. */
export function tradingViewSymbolHref(symbol: string, suffix = ""): string {
  const slug = symbol.trim().replace(":", "-");
  return `https://www.tradingview.com/symbols/${slug}/${suffix}`;
}

export function defaultLocale(locale: TradingViewLocale | undefined): TradingViewLocale {
  return locale ?? "en";
}
