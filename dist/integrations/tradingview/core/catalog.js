//#region src/integrations/tradingview/core/catalog.ts
const TRADINGVIEW_SCRIPT_HOST = "https://s3.tradingview.com/external-embedding";
const TRADINGVIEW_MODULE_HOST = "https://widgets.tradingview-widget.com";
const TRADINGVIEW_WIDGET_HOST = "https://www.tradingview-widget.com";
const TRADINGVIEW_SITE_HOST = "https://www.tradingview.com";
/**
* Attribute encodings, transcribed from TradingView's own public widget schema
* (`toAttribute`/`fromAttribute` in the wizard runtime):
*  - `list`  -> comma-separated, trimmed, empty entries dropped
*  - `json`  -> `JSON.parse` on read, `JSON.stringify` on write
*  - `upper` -> upper-cased on read
*  - `lower` -> lower-cased on read
*  - `boolean` -> presence
*/
function spec(attribute, encoding) {
	return {
		attribute,
		encoding
	};
}
const kebab = (value) => value.replaceAll(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
/** Build the attribute contract for a widget from its setting names. */
function attributes(names, encodings = {}) {
	return Object.fromEntries(names.map((name) => [name, spec(kebab(name), encodings[name] ?? "string")]));
}
const CHART_ATTRIBUTES = attributes([
	"symbol",
	"lineChartType",
	"timeFrame",
	"showTimeScale",
	"showTimeRange",
	"chartOnly"
], {
	symbol: "upper",
	timeFrame: "upper",
	lineChartType: "string",
	showTimeScale: "boolean",
	showTimeRange: "boolean",
	chartOnly: "boolean"
});
/** Provider settings that are presence attributes rather than values. */
const BOOLEAN_SETTINGS = "boolean";
const TRADINGVIEW_CATALOG = [
	{
		id: "advanced-chart",
		name: "AdvancedChart",
		category: "charts",
		format: "iframe",
		docsUrl: "https://www.tradingview.com/widget-docs/widgets/charts/advanced-chart/",
		scriptUrl: `${TRADINGVIEW_SCRIPT_HOST}/embed-widget-advanced-chart.js`,
		minSize: {
			width: 400,
			height: 500
		},
		defaultHeight: 560,
		supports: {
			theme: true,
			transparent: true,
			symbol: true,
			symbols: false,
			symbolUrl: false,
			locale: true
		},
		summary: "The full TradingView chart: candles, studies, drawing tools, comparison symbols and a watchlist side panel."
	},
	{
		id: "symbol-overview",
		name: "SymbolOverview",
		category: "charts",
		format: "iframe",
		docsUrl: "https://www.tradingview.com/widget-docs/widgets/charts/symbol-overview/",
		scriptUrl: `${TRADINGVIEW_SCRIPT_HOST}/embed-widget-symbol-overview.js`,
		minSize: {
			width: 300,
			height: 300
		},
		defaultHeight: 420,
		supports: {
			theme: true,
			transparent: true,
			symbol: false,
			symbols: true,
			symbolUrl: false,
			locale: true
		},
		summary: "A compact multi-symbol chart with date ranges, volume and moving-average overlays."
	},
	{
		id: "mini-chart",
		name: "MiniChart",
		category: "charts",
		format: "web-component",
		docsUrl: "https://www.tradingview.com/widget-docs/widgets/charts/mini-chart/",
		moduleUrl: `${TRADINGVIEW_MODULE_HOST}/w/{locale}/tv-mini-chart.js`,
		element: "tv-mini-chart",
		minSize: {
			width: 250,
			height: 78
		},
		defaultHeight: 180,
		supports: {
			theme: true,
			transparent: true,
			symbol: true,
			symbols: false,
			symbolUrl: true,
			locale: true
		},
		attributes: CHART_ATTRIBUTES,
		summary: "Price, change and a sparkline-sized chart. The widget for market cards and overview grids.",
		replaces: ["embed-widget-mini-symbol-overview.js"]
	},
	{
		id: "seasonal-chart",
		name: "SeasonalChart",
		category: "charts",
		format: "web-component",
		docsUrl: "https://www.tradingview.com/widget-docs/widgets/charts/seasonal-chart/",
		moduleUrl: `${TRADINGVIEW_MODULE_HOST}/w/{locale}/tv-seasonal-chart.js`,
		element: "tv-seasonal-chart",
		minSize: {
			width: 350,
			height: 300
		},
		defaultHeight: 400,
		supports: {
			theme: true,
			transparent: true,
			symbol: true,
			symbols: false,
			symbolUrl: true,
			locale: true
		},
		attributes: attributes([
			"symbol",
			"showSeriesLabels",
			"showAverage",
			"hidePriceScale",
			"hideHeader"
		], {
			symbol: "upper",
			showSeriesLabels: BOOLEAN_SETTINGS,
			showAverage: BOOLEAN_SETTINGS,
			hidePriceScale: BOOLEAN_SETTINGS,
			hideHeader: BOOLEAN_SETTINGS
		}),
		summary: "Multi-year seasonal pattern by asset — the research view of seasonality."
	},
	{
		id: "market-summary",
		name: "MarketSummary",
		category: "watchlists",
		format: "web-component",
		docsUrl: "https://www.tradingview.com/widget-docs/widgets/watchlists/market-summary/",
		moduleUrl: `${TRADINGVIEW_MODULE_HOST}/w/{locale}/tv-market-summary.js`,
		element: "tv-market-summary",
		minSize: {
			width: 300,
			height: 100
		},
		defaultHeight: 220,
		supports: {
			theme: true,
			transparent: true,
			symbol: false,
			symbols: true,
			symbolUrl: true,
			locale: true
		},
		attributes: attributes([
			"exchange",
			"symbolSectors",
			"timeFrame",
			"showTimeRange",
			"direction",
			"hideMarketStatus",
			"layoutMode",
			"itemSize",
			"mode",
			"assetsType"
		], {
			symbolSectors: "json",
			exchange: "upper",
			timeFrame: "upper",
			showTimeRange: BOOLEAN_SETTINGS,
			hideMarketStatus: BOOLEAN_SETTINGS,
			direction: "lower",
			layoutMode: "lower",
			itemSize: "lower",
			mode: "lower",
			assetsType: "lower"
		}),
		summary: "A dense market row: movers or your own symbol groups, in flow or grid layout."
	},
	{
		id: "market-overview",
		name: "MarketOverview",
		category: "watchlists",
		format: "web-component",
		docsUrl: "https://www.tradingview.com/widget-docs/widgets/watchlists/market-overview/",
		moduleUrl: `${TRADINGVIEW_MODULE_HOST}/w/{locale}/tv-market-overview.js`,
		element: "tv-market-overview",
		minSize: {
			width: 320,
			height: 300
		},
		defaultHeight: 550,
		supports: {
			theme: true,
			transparent: true,
			symbol: false,
			symbols: true,
			symbolUrl: true,
			locale: true
		},
		attributes: attributes([
			"exchange",
			"symbolSectors",
			"timeFrame",
			"hideMarketStatus",
			"itemSize",
			"mode",
			"assetsType",
			"chartSize"
		], {
			symbolSectors: "json",
			exchange: "upper",
			timeFrame: "upper",
			hideMarketStatus: BOOLEAN_SETTINGS,
			itemSize: "lower",
			mode: "lower",
			assetsType: "lower",
			chartSize: "lower"
		}),
		summary: "A sidebar of markets with a chart for the selected instrument.",
		replaces: ["embed-widget-market-overview.js"]
	},
	{
		id: "market-data",
		name: "MarketData",
		category: "watchlists",
		format: "web-component",
		docsUrl: "https://www.tradingview.com/widget-docs/widgets/watchlists/market-data/",
		moduleUrl: `${TRADINGVIEW_MODULE_HOST}/w/{locale}/tv-market-data.js`,
		element: "tv-market-data",
		minSize: {
			width: 300,
			height: 180
		},
		defaultHeight: 320,
		supports: {
			theme: true,
			transparent: true,
			symbol: false,
			symbols: true,
			symbolUrl: true,
			locale: true
		},
		attributes: attributes([
			"symbolSectors",
			"view",
			"heatmap"
		], {
			symbolSectors: "json",
			view: "lower",
			heatmap: BOOLEAN_SETTINGS
		}),
		summary: "Global market sections as a quote table, optionally with a performance heatmap.",
		replaces: ["embed-widget-market-quotes.js"]
	},
	{
		id: "world-market-summary",
		name: "WorldMarketSummary",
		category: "watchlists",
		format: "web-component",
		docsUrl: "https://www.tradingview.com/widget-docs/widgets/watchlists/world-market-summary/",
		moduleUrl: `${TRADINGVIEW_MODULE_HOST}/w/{locale}/tv-world-market-summary.js`,
		element: "tv-world-market-summary",
		minSize: {
			width: 400,
			height: 360
		},
		defaultHeight: 520,
		supports: {
			theme: true,
			transparent: true,
			symbol: false,
			symbols: false,
			symbolUrl: true,
			locale: true
		},
		attributes: attributes([
			"hideLegend",
			"view",
			"hideViewToggle",
			"focusedCountries",
			"sort",
			"countries",
			"hoverType"
		], {
			view: "lower",
			sort: "lower",
			hoverType: "lower",
			countries: "json",
			focusedCountries: "json",
			hideLegend: BOOLEAN_SETTINGS,
			hideViewToggle: BOOLEAN_SETTINGS
		}),
		summary: "World equity performance as a map or a table, by country."
	},
	{
		id: "ticker-tape",
		name: "TickerTape",
		category: "tickers",
		format: "web-component",
		docsUrl: "https://www.tradingview.com/widget-docs/widgets/tickers/ticker-tape/",
		moduleUrl: `${TRADINGVIEW_MODULE_HOST}/w/{locale}/tv-ticker-tape.js`,
		element: "tv-ticker-tape",
		minSize: {
			width: 300,
			height: 70
		},
		defaultHeight: 104,
		supports: {
			theme: true,
			transparent: true,
			symbol: false,
			symbols: true,
			symbolUrl: true,
			locale: true
		},
		attributes: attributes([
			"symbols",
			"direction",
			"hideChart",
			"lineChartType",
			"itemSize",
			"hoverType",
			"showHover",
			"hideLogo",
			"noLinks"
		], {
			symbols: "list",
			lineChartType: "string",
			direction: "lower",
			itemSize: "lower",
			hoverType: "lower",
			hideChart: BOOLEAN_SETTINGS,
			showHover: BOOLEAN_SETTINGS,
			hideLogo: BOOLEAN_SETTINGS,
			noLinks: BOOLEAN_SETTINGS
		}),
		summary: "A scrolling strip of quotes. Horizontal or vertical, with optional hover charts.",
		replaces: ["embed-widget-ticker-tape.js"]
	},
	{
		id: "tickers",
		name: "Tickers",
		category: "tickers",
		format: "web-component",
		docsUrl: "https://www.tradingview.com/widget-docs/widgets/tickers/tickers/",
		moduleUrl: `${TRADINGVIEW_MODULE_HOST}/w/{locale}/tv-tickers.js`,
		element: "tv-tickers",
		minSize: {
			width: 300,
			height: 100
		},
		defaultHeight: 140,
		supports: {
			theme: true,
			transparent: true,
			symbol: false,
			symbols: true,
			symbolUrl: true,
			locale: true
		},
		attributes: attributes([
			"symbols",
			"direction",
			"hideChart",
			"lineChartType",
			"itemSize",
			"hoverType",
			"showHover",
			"hideLogo",
			"noLinks"
		], {
			symbols: "list",
			lineChartType: "string",
			direction: "lower",
			itemSize: "lower",
			hoverType: "lower",
			hideChart: BOOLEAN_SETTINGS,
			showHover: BOOLEAN_SETTINGS,
			hideLogo: BOOLEAN_SETTINGS,
			noLinks: BOOLEAN_SETTINGS
		}),
		summary: "A ticker strip with price, change and an optional inline chart.",
		replaces: ["embed-widget-tickers.js"]
	},
	{
		id: "single-ticker",
		name: "SingleTicker",
		category: "tickers",
		format: "web-component",
		docsUrl: "https://www.tradingview.com/widget-docs/widgets/tickers/single-ticker/",
		moduleUrl: `${TRADINGVIEW_MODULE_HOST}/w/{locale}/tv-single-ticker.js`,
		element: "tv-single-ticker",
		minSize: {
			width: 250,
			height: 100
		},
		defaultHeight: 114,
		supports: {
			theme: true,
			transparent: true,
			symbol: true,
			symbols: false,
			symbolUrl: true,
			locale: true
		},
		attributes: attributes(["symbol", "hideMarketStatus"], {
			symbol: "upper",
			hideMarketStatus: BOOLEAN_SETTINGS
		}),
		summary: "One instrument: name, price and change, in the smallest useful footprint."
	},
	{
		id: "ticker-tag",
		name: "TickerTag",
		category: "tickers",
		format: "web-component",
		docsUrl: "https://www.tradingview.com/widget-docs/widgets/tickers/ticker-tag/",
		moduleUrl: `${TRADINGVIEW_MODULE_HOST}/w/{locale}/tv-ticker-tag.js`,
		element: "tv-ticker-tag",
		minSize: {
			width: 96,
			height: 28
		},
		defaultHeight: 32,
		supports: {
			theme: true,
			transparent: true,
			symbol: true,
			symbols: false,
			symbolUrl: true,
			locale: true
		},
		attributes: attributes([
			"symbol",
			"size",
			"hideChange",
			"hideBackground",
			"preserveText"
		], {
			symbol: "upper",
			size: "lower",
			hideChange: BOOLEAN_SETTINGS,
			hideBackground: BOOLEAN_SETTINGS,
			preserveText: BOOLEAN_SETTINGS
		}),
		summary: "An inline market chip for prose, tables and metadata rows."
	},
	{
		id: "stock-heatmap",
		name: "StockHeatmap",
		category: "heatmaps",
		format: "iframe",
		docsUrl: "https://www.tradingview.com/widget-docs/widgets/heatmaps/stock-heatmap/",
		scriptUrl: `${TRADINGVIEW_SCRIPT_HOST}/embed-widget-stock-heatmap.js`,
		minSize: {
			width: 400,
			height: 400
		},
		defaultHeight: 590,
		supports: {
			theme: true,
			transparent: true,
			symbol: false,
			symbols: false,
			symbolUrl: true,
			locale: true
		},
		summary: "S&P 500 constituents as a market-cap heatmap, coloured by change."
	},
	{
		id: "crypto-heatmap",
		name: "CryptoHeatmap",
		category: "heatmaps",
		format: "iframe",
		docsUrl: "https://www.tradingview.com/widget-docs/widgets/heatmaps/crypto-heatmap/",
		scriptUrl: `${TRADINGVIEW_SCRIPT_HOST}/embed-widget-crypto-coins-heatmap.js`,
		minSize: {
			width: 400,
			height: 400
		},
		defaultHeight: 590,
		supports: {
			theme: true,
			transparent: true,
			symbol: false,
			symbols: false,
			symbolUrl: true,
			locale: true
		},
		summary: "The crypto market as a heatmap, sized by market cap and coloured by change."
	},
	{
		id: "etf-heatmap",
		name: "EtfHeatmap",
		category: "heatmaps",
		format: "iframe",
		docsUrl: "https://www.tradingview.com/widget-docs/widgets/heatmaps/etf-heatmap/",
		scriptUrl: `${TRADINGVIEW_SCRIPT_HOST}/embed-widget-etf-heatmap.js`,
		minSize: {
			width: 400,
			height: 400
		},
		defaultHeight: 540,
		supports: {
			theme: true,
			transparent: true,
			symbol: false,
			symbols: false,
			symbolUrl: true,
			locale: true
		},
		summary: "US ETFs grouped by asset class, sized by volume."
	},
	{
		id: "forex-table",
		name: "ForexTable",
		category: "heatmaps",
		format: "web-component",
		docsUrl: "https://www.tradingview.com/widget-docs/widgets/heatmaps/forex-table/",
		moduleUrl: `${TRADINGVIEW_MODULE_HOST}/w/{locale}/tv-forex-table.js`,
		element: "tv-forex-table",
		minSize: {
			width: 360,
			height: 300
		},
		defaultHeight: 400,
		supports: {
			theme: true,
			transparent: true,
			symbol: false,
			symbols: false,
			symbolUrl: true,
			locale: true
		},
		attributes: attributes([
			"currencies",
			"displayedValue",
			"heatmap"
		], {
			currencies: "list",
			displayedValue: "lower",
			heatmap: BOOLEAN_SETTINGS
		}),
		summary: "A currency cross-rate matrix, optionally heat-coloured by daily change.",
		replaces: ["embed-widget-forex-cross-rates.js", "embed-widget-forex-heat-map.js"]
	},
	{
		id: "screener",
		name: "Screener",
		category: "screeners",
		format: "iframe",
		docsUrl: "https://www.tradingview.com/widget-docs/widgets/screeners/screener/",
		scriptUrl: `${TRADINGVIEW_SCRIPT_HOST}/embed-widget-screener.js`,
		minSize: {
			width: 400,
			height: 400
		},
		defaultHeight: 560,
		supports: {
			theme: true,
			transparent: true,
			symbol: false,
			symbols: false,
			symbolUrl: false,
			locale: true
		},
		summary: "A filterable market screener with the provider's own columns and presets."
	},
	{
		id: "crypto-mkt-screener",
		name: "CryptocurrencyMarket",
		category: "screeners",
		format: "iframe",
		docsUrl: "https://www.tradingview.com/widget-docs/widgets/screeners/crypto-mkt-screener/",
		scriptUrl: `${TRADINGVIEW_SCRIPT_HOST}/embed-widget-screener.js`,
		minSize: {
			width: 400,
			height: 400
		},
		defaultHeight: 520,
		supports: {
			theme: true,
			transparent: true,
			symbol: false,
			symbols: false,
			symbolUrl: false,
			locale: true
		},
		summary: "The cryptocurrency market table: price, market cap, volume and change."
	},
	{
		id: "symbol-info",
		name: "SymbolInfo",
		category: "symbol-details",
		format: "iframe",
		docsUrl: "https://www.tradingview.com/widget-docs/widgets/symbol-details/symbol-info/",
		scriptUrl: `${TRADINGVIEW_SCRIPT_HOST}/embed-widget-symbol-info.js`,
		minSize: {
			width: 300,
			height: 200
		},
		defaultHeight: 282,
		supports: {
			theme: true,
			transparent: true,
			symbol: true,
			symbols: false,
			symbolUrl: false,
			locale: true
		},
		summary: "Key facts for one symbol: price, ranges, market cap, P/E."
	},
	{
		id: "technical-analysis",
		name: "TechnicalAnalysis",
		category: "symbol-details",
		format: "web-component",
		docsUrl: "https://www.tradingview.com/widget-docs/widgets/symbol-details/technical-analysis/",
		moduleUrl: `${TRADINGVIEW_MODULE_HOST}/w/{locale}/tv-technical-analysis.js`,
		element: "tv-technical-analysis",
		minSize: {
			width: 300,
			height: 300
		},
		defaultHeight: 400,
		supports: {
			theme: true,
			transparent: true,
			symbol: true,
			symbols: false,
			symbolUrl: true,
			locale: true
		},
		attributes: attributes([
			"symbol",
			"interval",
			"ratingsMode",
			"ratingsDisplayMode",
			"hideLogoAndName",
			"hideIntervals",
			"noLinks"
		], {
			symbol: "upper",
			interval: "upper",
			ratingsMode: "lower",
			ratingsDisplayMode: "lower",
			hideLogoAndName: BOOLEAN_SETTINGS,
			hideIntervals: BOOLEAN_SETTINGS,
			noLinks: BOOLEAN_SETTINGS
		}),
		summary: "Provider-computed technical ratings with an interval selector and score breakdown.",
		replaces: ["embed-widget-technical-analysis.js"]
	},
	{
		id: "fundamental-data",
		name: "FundamentalData",
		category: "symbol-details",
		format: "iframe",
		docsUrl: "https://www.tradingview.com/widget-docs/widgets/symbol-details/fundamental-data/",
		scriptUrl: `${TRADINGVIEW_SCRIPT_HOST}/embed-widget-financials.js`,
		minSize: {
			width: 320,
			height: 400
		},
		defaultHeight: 620,
		supports: {
			theme: true,
			transparent: true,
			symbol: true,
			symbols: false,
			symbolUrl: false,
			locale: true
		},
		summary: "Income statement, balance sheet and cash-flow figures for one symbol."
	},
	{
		id: "company-profile",
		name: "CompanyProfile",
		category: "symbol-details",
		format: "web-component",
		docsUrl: "https://www.tradingview.com/widget-docs/widgets/symbol-details/company-profile/",
		moduleUrl: `${TRADINGVIEW_MODULE_HOST}/w/{locale}/tv-company-profile.js`,
		element: "tv-company-profile",
		minSize: {
			width: 320,
			height: 400
		},
		defaultHeight: 530,
		supports: {
			theme: true,
			transparent: true,
			symbol: true,
			symbols: false,
			symbolUrl: true,
			locale: true
		},
		attributes: attributes(["symbol"], { symbol: "upper" }),
		summary: "Company description, sector and key figures for one listed instrument.",
		replaces: ["embed-widget-symbol-profile.js"]
	},
	{
		id: "top-stories",
		name: "TopStories",
		category: "news",
		format: "iframe",
		docsUrl: "https://www.tradingview.com/widget-docs/widgets/news/top-stories/",
		scriptUrl: `${TRADINGVIEW_SCRIPT_HOST}/embed-widget-timeline.js`,
		minSize: {
			width: 300,
			height: 400
		},
		defaultHeight: 620,
		supports: {
			theme: true,
			transparent: true,
			symbol: false,
			symbols: false,
			symbolUrl: false,
			locale: true
		},
		summary: "The provider's market news timeline. LUC never renders or stores the stories itself."
	},
	{
		id: "economic-calendar",
		name: "EconomicCalendar",
		category: "calendars",
		format: "iframe",
		docsUrl: "https://www.tradingview.com/widget-docs/widgets/calendars/economic-calendar/",
		scriptUrl: `${TRADINGVIEW_SCRIPT_HOST}/embed-widget-events.js`,
		minSize: {
			width: 350,
			height: 450
		},
		defaultHeight: 620,
		supports: {
			theme: true,
			transparent: true,
			symbol: false,
			symbols: false,
			symbolUrl: false,
			locale: true
		},
		summary: "Upcoming macro events with importance and country filters."
	},
	{
		id: "economic-map",
		name: "EconomicMap",
		category: "economics",
		format: "web-component",
		docsUrl: "https://www.tradingview.com/widget-docs/widgets/economics/economic-map/",
		moduleUrl: `${TRADINGVIEW_MODULE_HOST}/w/{locale}/tv-economic-map.js`,
		element: "tv-economic-map",
		minSize: {
			width: 500,
			height: 400
		},
		defaultHeight: 475,
		supports: {
			theme: true,
			transparent: true,
			symbol: false,
			symbols: false,
			symbolUrl: true,
			locale: true
		},
		attributes: attributes([
			"region",
			"metric",
			"metrics",
			"hideLegend",
			"hideSelection"
		], {
			region: "lower",
			metric: "lower",
			metrics: "list",
			hideLegend: BOOLEAN_SETTINGS,
			hideSelection: BOOLEAN_SETTINGS
		}),
		summary: "A world map of macro indicators, by region and metric."
	},
	{
		id: "broker-rating",
		name: "BrokerRating",
		category: "brokers",
		format: "web-component",
		docsUrl: "https://www.tradingview.com/widget-docs/widgets/brokers/rating/",
		moduleUrl: `${TRADINGVIEW_WIDGET_HOST}/widget/broker-rating.js?locale={locale}&broker={broker}`,
		element: "tv-broker-rating",
		minSize: {
			width: 220,
			height: 120
		},
		defaultHeight: 190,
		supports: {
			theme: true,
			transparent: true,
			symbol: false,
			symbols: false,
			symbolUrl: false,
			locale: true
		},
		attributes: attributes([
			"broker",
			"showBrokerName",
			"showReviews"
		], {
			showBrokerName: BOOLEAN_SETTINGS,
			showReviews: BOOLEAN_SETTINGS
		}),
		summary: "A broker partner's TradingView star rating and awards."
	},
	{
		id: "broker-reviews",
		name: "BrokerReviews",
		category: "brokers",
		format: "web-component",
		docsUrl: "https://www.tradingview.com/widget-docs/widgets/brokers/reviews/",
		moduleUrl: `${TRADINGVIEW_WIDGET_HOST}/widget/broker-reviews.js?locale={locale}&broker={broker}`,
		element: "tv-broker-reviews",
		minSize: {
			width: 260,
			height: 260
		},
		defaultHeight: 460,
		supports: {
			theme: true,
			transparent: true,
			symbol: false,
			symbols: false,
			symbolUrl: false,
			locale: true
		},
		attributes: attributes([
			"broker",
			"showBrokerName",
			"showReviews"
		]),
		summary: "A broker partner's rating plus their most recent 4- and 5-star reviews."
	}
];
/**
* Widgets TradingView still serves but has replaced.
*
* Recorded so a future reader does not "restore" one of them, and so the
* Showcase can explain why the catalog has no wrapper for them. None of these
* get a component: the rule is one wrapper per capability.
*/
const TRADINGVIEW_LEGACY_EMBEDS = [
	{
		script: "embed-widget-tickers.js",
		replacedBy: "tickers",
		status: "served",
		note: "Iframe ticker strip — superseded by the tv-tickers Web Component."
	},
	{
		script: "embed-widget-ticker-tape.js",
		replacedBy: "ticker-tape",
		status: "served",
		note: "Iframe ticker tape — superseded by tv-ticker-tape."
	},
	{
		script: "embed-widget-mini-symbol-overview.js",
		replacedBy: "mini-chart",
		status: "served",
		note: "Iframe mini chart — superseded by tv-mini-chart."
	},
	{
		script: "embed-widget-market-overview.js",
		replacedBy: "market-overview",
		status: "served",
		note: "Iframe market overview — superseded by tv-market-overview."
	},
	{
		script: "embed-widget-market-quotes.js",
		replacedBy: "market-data",
		status: "served",
		note: "Iframe market quotes — superseded by tv-market-data (overview/performance views)."
	},
	{
		script: "embed-widget-forex-cross-rates.js",
		replacedBy: "forex-table",
		status: "served",
		note: "Iframe cross rates — superseded by tv-forex-table."
	},
	{
		script: "embed-widget-forex-heat-map.js",
		replacedBy: "forex-table",
		status: "served",
		note: "Iframe forex heat map — superseded by tv-forex-table's heatmap colouring."
	},
	{
		script: "embed-widget-symbol-profile.js",
		replacedBy: "company-profile",
		status: "served",
		note: "Iframe symbol profile — superseded by tv-company-profile."
	},
	{
		script: "embed-widget-ticker.js",
		replacedBy: "single-ticker",
		status: "withdrawn",
		note: "Legacy single ticker. TradingView no longer serves it (HTTP 403)."
	},
	{
		script: "embed-widget-market-summary.js",
		replacedBy: "market-summary",
		status: "withdrawn",
		note: "Legacy iframe market summary. Not served (HTTP 403); the canonical widget is tv-market-summary."
	},
	{
		script: "embed-widget-single-ticker.js",
		replacedBy: "single-ticker",
		status: "withdrawn",
		note: "Legacy iframe single ticker. Not served (HTTP 403); the canonical widget is tv-single-ticker."
	}
];
const TRADINGVIEW_CATEGORIES = [
	{
		id: "charts",
		label: "Charts",
		description: "Provider-hosted price charts, from a sparkline to the full terminal."
	},
	{
		id: "watchlists",
		label: "Watchlists",
		description: "Market summaries, overviews and section-based quote tables."
	},
	{
		id: "tickers",
		label: "Tickers",
		description: "Ticker strips, inline tags and single-instrument readouts."
	},
	{
		id: "heatmaps",
		label: "Heatmaps",
		description: "Stock, crypto, ETF and FX heatmaps. Provider colour semantics are preserved."
	},
	{
		id: "screeners",
		label: "Screeners",
		description: "Filterable market tables with provider columns and presets."
	},
	{
		id: "symbol-details",
		label: "Symbol details",
		description: "Facts, ratings, fundamentals and company profile for one instrument."
	},
	{
		id: "news",
		label: "News",
		description: "The provider's news timeline. Content stays provider-owned."
	},
	{
		id: "calendars",
		label: "Calendars",
		description: "Macro event calendars — distinct from LUC's own Calendar component."
	},
	{
		id: "brokers",
		label: "Brokers",
		description: "Broker partner rating and review embeds."
	},
	{
		id: "economics",
		label: "Economics",
		description: "Macro indicators on a world map."
	}
];
function tradingViewWidgetById(id) {
	return TRADINGVIEW_CATALOG.find((widget) => widget.id === id);
}
function tradingViewWidgetsByCategory(category) {
	return TRADINGVIEW_CATALOG.filter((widget) => widget.category === category);
}
/**
* Resolve a module URL template. `{locale}` comes from the caller; any other
* placeholder (currently only `{broker}`) must be supplied in `extras`.
*/
function tradingViewModuleUrl(definition, locale, extras = {}) {
	if (!definition.moduleUrl) return "";
	return definition.moduleUrl.replace(/\{(\w+)\}/g, (match, key) => extras[key] ?? (key === "locale" ? locale : match));
}
/** The provider's own default sectors, used when a caller supplies none. */
const TRADINGVIEW_DEFAULT_SECTORS = [
	{
		sectionName: "Indices",
		symbols: [
			"FOREXCOM:SPXUSD",
			"FOREXCOM:NSXUSD",
			"FOREXCOM:DJI",
			"INDEX:NKY"
		]
	},
	{
		sectionName: "Forex",
		symbols: [
			"FX:EURUSD",
			"FX:GBPUSD",
			"FX:USDJPY"
		]
	},
	{
		sectionName: "Crypto",
		symbols: ["BITSTAMP:BTCUSD", "BITSTAMP:ETHUSD"]
	}
];
//#endregion
export { TRADINGVIEW_CATALOG, TRADINGVIEW_CATEGORIES, TRADINGVIEW_DEFAULT_SECTORS, TRADINGVIEW_LEGACY_EMBEDS, TRADINGVIEW_MODULE_HOST, TRADINGVIEW_SCRIPT_HOST, TRADINGVIEW_SITE_HOST, TRADINGVIEW_WIDGET_HOST, tradingViewModuleUrl, tradingViewWidgetById, tradingViewWidgetsByCategory };

//# sourceMappingURL=catalog.js.map