/*
 * The handwritten half of discovery.
 *
 * `lib/docs/taxonomy.ts` says which family a module belongs to; this file says
 * *when a person would reach for it*. That is a judgement call, not a fact about
 * the package, so it is written by hand — and every id in it is validated by
 * `scripts/docs-registry.mjs` against the real registry, so a typo fails the
 * build instead of producing an empty category.
 *
 * Three layers, from cheapest to most specific:
 *
 *   FAMILY_META   a default for every entry in a family (27 families, so this
 *                 covers most of the catalogue in one line each)
 *   ENTRY_META    per-entry additions: aliases, extra tags, a different art
 *                 direction, or `featured: true`
 *   SITE_SECTIONS the pages that are not components at all — studios, blocks,
 *                 templates, experiences, patterns, guides, visual studies
 *
 * House rules:
 *
 *  - an alias is a *search* alias, not a translation of an API name. Component
 *    identifiers stay English (`LineChart` is `LineChart`); an alias exists so a
 *    Chinese reader can type 折线图 and a hurried English reader can type
 *    "timeseries" and both arrive at the same page.
 *  - a use case is a claim about applicability, so it is added only where the
 *    component really is used on that kind of page.
 *  - nothing is tagged `featured` unless it is something a visitor should see in
 *    their first minute.
 *
 * Dependency-free (type-only imports) so the generator can transpile it alone.
 */

import type { DiscoveryKind } from "./types";

/** A per-family default. Applied to every entry in the family. */
export interface FamilyMeta {
  useCases: readonly string[];
  artDirections: readonly string[];
  tags: readonly string[];
}

/** Per-entry additions. Everything here is additive except the scalars. */
export interface EntryMeta {
  /** Extra search terms, in either language. Lower case, no capitals: a
   * capitalised multi-word alias would be treated as a sentence to translate. */
  aliases?: readonly string[];
  tags?: readonly string[];
  useCases?: readonly string[];
  artDirections?: readonly string[];
  featured?: boolean;
}

/**
 * Non-component pages.
 *
 * `pages` are `[route, title]` pairs, and the generator verifies each route has
 * a `page.tsx` on disk before it becomes a catalog row. A registry entry that
 * already owns the route wins — the row is skipped rather than duplicated — so
 * this list may safely name a page the documentation registry also documents.
 */
export interface SiteSection {
  kind: DiscoveryKind;
  useCases: readonly string[];
  artDirections: readonly string[];
  tags: readonly string[];
  pages: readonly (readonly [route: string, title: string, aliases?: readonly string[]])[];
}

/* -------------------------------------------------------------------------- */
/* Family defaults                                                             */
/* -------------------------------------------------------------------------- */

export const FAMILY_META: Record<string, FamilyMeta> = {
  /* ---- components ------------------------------------------------------- */
  actions: {
    useCases: ["business", "marketing", "personal"],
    artDirections: ["editorial-modern", "scientific-precision"],
    tags: ["action", "interaction"],
  },
  forms: {
    useCases: ["business", "education", "finance"],
    artDirections: ["editorial-modern", "scientific-precision"],
    tags: ["form", "validation", "keyboard"],
  },
  "date-time": {
    useCases: ["business", "finance"],
    artDirections: ["scientific-precision", "editorial-modern"],
    tags: ["date", "time", "keyboard"],
  },
  layout: {
    useCases: ["business", "editorial"],
    artDirections: ["editorial-modern", "scientific-precision"],
    tags: ["layout", "structure"],
  },
  navigation: {
    useCases: ["business", "editorial"],
    artDirections: ["editorial-modern", "digital-futurism"],
    tags: ["navigation", "shell"],
  },
  feedback: {
    useCases: ["business", "education"],
    artDirections: ["editorial-modern", "digital-futurism"],
    tags: ["status", "feedback", "a11y"],
  },
  overlays: {
    useCases: ["business", "finance"],
    artDirections: ["editorial-modern", "refined-luxury"],
    tags: ["overlay", "focus", "keyboard"],
  },
  "data-display": {
    useCases: ["finance", "business", "research"],
    artDirections: ["scientific-precision", "editorial-modern"],
    tags: ["data", "table", "numbers"],
  },
  media: {
    useCases: ["portfolio", "editorial"],
    artDirections: ["organic-contemporary", "editorial-modern"],
    tags: ["image", "media"],
  },
  application: {
    useCases: ["business", "research"],
    artDirections: ["scientific-precision", "editorial-modern"],
    tags: ["shell", "state", "workspace"],
  },
  ai: {
    useCases: ["business", "research"],
    artDirections: ["digital-futurism"],
    tags: ["ai", "streaming", "provider-neutral"],
  },
  typography: {
    useCases: ["editorial", "marketing"],
    artDirections: ["editorial-modern", "refined-luxury"],
    tags: ["type", "editorial", "numbers"],
  },
  experiences: {
    useCases: ["personal", "portfolio", "editorial"],
    artDirections: ["refined-luxury", "organic-contemporary"],
    tags: ["personal site", "hero", "narrative"],
  },

  /* ---- motion ----------------------------------------------------------- */
  "motion-typography": {
    useCases: ["marketing", "editorial"],
    artDirections: ["bold-experimental", "digital-futurism"],
    tags: ["motion", "type", "reduced-motion"],
  },
  "motion-surfaces": {
    useCases: ["marketing", "portfolio"],
    artDirections: ["digital-futurism", "bold-experimental"],
    tags: ["motion", "surface", "pointer"],
  },
  "motion-spatial": {
    useCases: ["portfolio", "marketing"],
    artDirections: ["organic-contemporary", "bold-experimental"],
    tags: ["motion", "spatial", "depth"],
  },
  "motion-feedback": {
    useCases: ["business", "education"],
    artDirections: ["editorial-modern", "digital-futurism"],
    tags: ["motion", "feedback", "presence"],
  },

  /* ---- charts ----------------------------------------------------------- */
  "chart-general": {
    useCases: ["research", "finance", "business"],
    artDirections: ["scientific-precision", "editorial-modern"],
    tags: ["chart", "time series", "comparison"],
  },
  "chart-statistical": {
    useCases: ["research", "finance"],
    artDirections: ["scientific-precision"],
    tags: ["chart", "statistics", "distribution"],
  },
  "chart-scientific": {
    useCases: ["research", "education"],
    artDirections: ["scientific-precision"],
    tags: ["chart", "science", "field"],
  },
  "chart-financial": {
    useCases: ["finance"],
    artDirections: ["scientific-precision", "digital-futurism"],
    tags: ["chart", "finance", "risk"],
  },
  "chart-multidimensional": {
    useCases: ["research", "business"],
    artDirections: ["scientific-precision"],
    tags: ["chart", "network", "hierarchy"],
  },
  "chart-geographic": {
    useCases: ["research", "business"],
    artDirections: ["scientific-precision", "organic-contemporary"],
    tags: ["chart", "geography", "map"],
  },
  "chart-time": {
    useCases: ["finance", "research", "business"],
    artDirections: ["scientific-precision", "digital-futurism"],
    tags: ["chart", "time", "calendar"],
  },
  "chart-diagnostics": {
    useCases: ["research"],
    artDirections: ["scientific-precision"],
    tags: ["chart", "model evaluation", "statistics"],
  },
  "chart-workflow": {
    useCases: ["business", "education"],
    artDirections: ["editorial-modern", "scientific-precision"],
    tags: ["chart", "workflow", "comparison"],
  },

  /* ---- integrations ----------------------------------------------------- */
  tradingview: {
    useCases: ["finance"],
    artDirections: ["scientific-precision", "digital-futurism"],
    tags: ["provider", "markets", "widget"],
  },
};

/* -------------------------------------------------------------------------- */
/* Per-entry metadata                                                          */
/* -------------------------------------------------------------------------- */

/*
 * Deliberately short. A family default covers breadth; these entries exist
 * because a reader genuinely types the alias, or because the entry is one of the
 * handful a first-time visitor should meet.
 */
export const ENTRY_META: Record<string, EntryMeta> = {
  /* ---- featured: the first minute --------------------------------------- */
  button: { featured: true, aliases: ["按钮", "cta", "action"], tags: ["first-party"] },
  "data-table": {
    featured: true,
    aliases: ["表格", "datagrid", "grid", "列表"],
    tags: ["virtualised", "selection", "sorting"],
  },
  "line-chart": {
    featured: true,
    aliases: ["折线图", "timeseries", "trend"],
    tags: ["axes", "tooltip", "zoom"],
  },
  sheet: { featured: true, aliases: ["抽屉", "panel", "drawer", "侧边栏"], tags: ["directional"] },
  "kinetic-headline": {
    featured: true,
    aliases: ["动效标题", "type", "display"],
    tags: ["reduced-motion", "stagger"],
  },
  typography: {
    featured: true,
    aliases: ["字体排印", "text", "headings", "type scale"],
    tags: ["numeric", "roles"],
  },
  "candlestick-chart": {
    featured: true,
    aliases: ["k线", "蜡烛图", "ohlc", "candles"],
    tags: ["market data", "time axis"],
  },
  "profile-hero": { featured: true, aliases: ["个人主页", "resume", "cv"], tags: ["composite"] },

  /* ---- aliases a reader actually types --------------------------------- */
  input: { aliases: ["输入框", "textbox", "field"] },
  select: { aliases: ["下拉", "dropdown", "listbox"] },
  combobox: { aliases: ["组合框", "autocomplete", "typeahead"] },
  checkbox: { aliases: ["复选框", "tick"] },
  "radio-group": { aliases: ["单选", "radio"] },
  switch: { aliases: ["开关", "toggle"] },
  slider: { aliases: ["滑块", "range", "range slider"] },
  rating: { aliases: ["评分", "stars"] },
  "file-upload": { aliases: ["上传", "upload", "dropzone"] },
  "tag-input": { aliases: ["标签", "chips", "tokens"] },
  "date-picker": { aliases: ["日期选择", "calendar", "date"] },
  "time-picker": { aliases: ["时间", "clock", "time"] },
  calendar: { aliases: ["日历", "month grid"] },
  dialog: { aliases: ["对话框", "modal", "popup"] },
  "alert-dialog": { aliases: ["确认框", "confirm", "destructive"] },
  popover: { aliases: ["浮层", "floating", "anchored"] },
  tooltip: { aliases: ["提示", "hint", "hover help"] },
  "hover-card": { aliases: ["悬停卡片", "preview card"] },
  "dropdown-menu": { aliases: ["下拉菜单", "menu", "menu button"] },
  "context-menu": { aliases: ["右键菜单", "right click"] },
  accordion: { aliases: ["手风琴", "disclosure", "collapse"] },
  tabs: { aliases: ["标签页", "tablist", "panels"] },
  toast: { aliases: ["消息提示", "notification", "snackbar"] },
  alert: { aliases: ["提示条", "banner", "inline alert"] },
  badge: { aliases: ["徽标", "tag", "pill", "chip"] },
  avatar: { aliases: ["头像", "profile image", "initials"] },
  card: { aliases: ["卡片", "surface", "panel"] },
  metric: { aliases: ["指标", "kpi", "stat"] },
  delta: { aliases: ["变化量", "change", "variance"] },
  timeline: { aliases: ["时间线", "activity", "history"] },
  "kanban-board": { aliases: ["看板", "kanban", "board", "drag and drop"] },
  "tree-view": { aliases: ["树", "tree", "hierarchy"] },
  "virtual-data-table": { aliases: ["虚拟滚动", "virtualised", "windowing"] },
  pagination: { aliases: ["分页", "paging"] },
  stepper: { aliases: ["步骤", "wizard", "steps"] },
  progress: { aliases: ["进度", "loading", "bar"] },
  spinner: { aliases: ["加载", "loading", "busy"] },
  skeleton: { aliases: ["骨架屏", "placeholder", "loading"] },
  "empty-state": { aliases: ["空状态", "no data", "zero state"] },
  workspace: { aliases: ["工作区", "panes", "split view"] },
  "app-shell": { aliases: ["外壳", "layout", "sidebar", "topbar"] },
  "image-gallery": { aliases: ["图库", "photos", "lightbox", "gallery"] },
  "image-compare": { aliases: ["对比图", "before after", "slider"] },
  carousel: { aliases: ["轮播", "slider", "slides"] },
  sparkline: { aliases: ["迷你图", "micro chart", "inline chart"] },
  "small-multiples": { aliases: ["小倍数图", "facets", "trellis"] },
  "heatmap-chart": { aliases: ["热力图", "grid chart"] },
  "calendar-heatmap": { aliases: ["日历热力图", "github style", "activity"] },
  "violin-chart": { aliases: ["小提琴图", "density", "distribution"] },
  "box-plot-chart": { aliases: ["箱线图", "quartiles", "whiskers"] },
  "ecdf-chart": { aliases: ["累积分布", "ecdf", "cumulative"] },
  "qq-plot-chart": { aliases: ["qq图", "quantile", "normality"] },
  "roc-curve-chart": { aliases: ["roc", "auc", "classifier"] },
  "survival-curve-chart": { aliases: ["生存曲线", "kaplan meier", "hazard"] },
  "drawdown-chart": { aliases: ["回撤", "underwater", "peak to trough"] },
  "volatility-smile-chart": { aliases: ["波动率微笑", "implied vol", "options"] },
  "term-structure-chart": { aliases: ["期限结构", "yield curve", "rates"] },
  "factor-exposure-chart": { aliases: ["因子暴露", "attribution", "sign"] },
  "sankey-chart": { aliases: ["桑基图", "flow", "transfers"] },
  "chord-chart": { aliases: ["和弦图", "matrix flows"] },
  "treemap-chart": { aliases: ["矩形树图", "hierarchy", "composition"] },
  "sunburst-chart": { aliases: ["旭日图", "radial hierarchy"] },
  "dendrogram-chart": { aliases: ["树状图", "clustering"] },
  "radar-chart": { aliases: ["雷达图", "spider", "axes"] },
  "choropleth-chart": { aliases: ["地图", "map", "regions"] },
  "surface3-dchart": { aliases: ["三维曲面", "3d surface", "projection"] },
  "volatility-surface-chart": { aliases: ["波动率曲面", "3d vol", "options"] },
  "contour-chart": { aliases: ["等高线", "isoline", "field"] },
  "vector-field-chart": { aliases: ["向量场", "arrows", "flow field"] },
  "ternary-chart": { aliases: ["三元图", "composition", "three part"] },
  "gantt-chart": { aliases: ["甘特图", "schedule", "timeline"] },
  "waterfall-chart": { aliases: ["瀑布图", "bridge", "contributions"] },
  "gauge-chart": { aliases: ["仪表盘", "kpi", "dial"] },
  "regime-strip": { aliases: ["状态条", "regimes", "strip"] },
  "event-timeline": { aliases: ["事件轴", "events", "markers"] },
  "parallel-coordinates-chart": { aliases: ["平行坐标", "multivariate"] },

  /* ---- motion and AI ---------------------------------------------------- */
  "text-reveal": { aliases: ["文字揭示", "typewriter", "reveal"] },
  "number-ticker": { aliases: ["数字滚动", "counter", "odometer"] },
  marquee: { aliases: ["跑马灯", "ticker", "scroll"] },
  "parallax-scene": { aliases: ["视差", "depth", "layers"] },
  "spotlight-surface": { aliases: ["聚光", "pointer light"] },
  "border-glow": { aliases: ["边框发光", "glow", "focus"] },
  "magnetic": { aliases: ["磁吸", "snap", "pointer"] },
  "press-ripple": { aliases: ["点击涟漪", "ripple", "touch"] },
  "morphing-dialog": { aliases: ["形变对话框", "shared element"] },
  "card-stack": { aliases: ["卡片堆叠", "stack", "swipe"] },
  "orbit-field": { aliases: ["轨道场", "orbit", "radial"] },
  "magnify-dock": { aliases: ["放大坞", "dock", "magnify"] },
  /*
   * The AI surface is one module (`components/ai`) with one entry and one page,
   * so it carries the aliases for the whole family rather than pretending the
   * seven primitives inside it are separately addressable rows.
   */
  ai: {
    aliases: ["智能体", "agent", "chat", "streaming", "tool calls", "消息", "流式"],
    tags: ["chat", "tool calls", "interruptible"],
  },

  /* ---- personal-site composites ---------------------------------------- */
  "publication-list": { aliases: ["论文列表", "papers", "citations", "doi"] },
  "experience-timeline": { aliases: ["履历", "roles", "career"] },
  "project-showcase": { aliases: ["作品", "projects", "case studies"] },
  "reading-shelf": { aliases: ["书架", "reading", "books"] },
  "now-section": { aliases: ["近况", "now page", "status"] },
  "social-links": { aliases: ["社交链接", "contact", "profiles"] },
};

/* -------------------------------------------------------------------------- */
/* Site sections                                                               */
/* -------------------------------------------------------------------------- */

/*
 * Pages that are not a component. They still belong in one catalog, because a
 * reader searching for "dashboard" should find the productivity board and a
 * reader searching for "K线" should find the candlestick chart *and* the finance
 * reference product.
 */
export const SITE_SECTIONS: readonly SiteSection[] = [
  {
    kind: "studio",
    useCases: ["business", "research", "finance"],
    artDirections: ["scientific-precision", "editorial-modern"],
    tags: ["configuration", "code generation", "workspace"],
    pages: [
      ["/studios/charts", "Chart Studio", ["图表工作室", "chart builder"]],
      ["/studios/motion", "Motion Studio", ["动效工作室", "spring editor"]],
      ["/studios/themes", "Theme Studio", ["主题工作室", "palette editor"]],
      ["/studios/composer", "Template Composer", ["模板编排", "page builder"]],
    ],
  },
  {
    kind: "block",
    useCases: ["marketing", "business", "editorial"],
    artDirections: ["editorial-modern", "bold-experimental"],
    tags: ["page section", "composition"],
    pages: [
      ["/blocks", "Blocks", ["区块", "sections", "hero", "pricing"]],
    ],
  },
  {
    kind: "experience",
    useCases: ["marketing", "business", "personal"],
    artDirections: ["refined-luxury", "organic-contemporary"],
    tags: ["whole page", "starter"],
    pages: [
      ["/templates", "Templates", ["模板", "starters", "boilerplate"]],
      ["/experiences", "Experiences", ["范例", "reference products", "examples"]],
    ],
  },
  {
    kind: "experience",
    useCases: ["marketing", "business"],
    artDirections: ["editorial-modern", "digital-futurism"],
    tags: ["reference product", "general"],
    pages: [
      ["/experiences/general/marketing", "Marketing site", ["落地页", "landing page"]],
      ["/experiences/general/saas", "SaaS console", ["控制台", "admin", "dashboard"]],
      ["/experiences/general/publishing", "Publishing platform", ["出版", "blog", "articles"]],
      ["/experiences/general/community", "Community product", ["社区", "feed", "forum"]],
    ],
  },
  {
    kind: "experience",
    useCases: ["personal", "portfolio", "editorial"],
    artDirections: ["refined-luxury", "organic-contemporary"],
    tags: ["personal site", "website"],
    pages: [
      ["/experiences/personal/career", "Career profile", ["职业主页", "resume", "cv"]],
      ["/experiences/personal/academic", "Academic profile", ["学术主页", "publications", "research"]],
      ["/experiences/personal/portfolio", "Creative portfolio", ["作品集", "portfolio", "studio"]],
      ["/experiences/personal/garden", "Journal & digital garden", ["数字花园", "notes", "blog"]],
    ],
  },
  {
    kind: "experience",
    useCases: ["finance", "research", "education", "business"],
    artDirections: ["scientific-precision", "digital-futurism"],
    tags: ["vertical", "domain"],
    pages: [
      ["/experiences/vertical/ai", "AI workspace", ["智能体工作台", "agent session"]],
      ["/experiences/vertical/science", "Research bench", ["实验台", "instrument", "parameters"]],
      ["/experiences/vertical/finance", "Quantitative analytics", ["量化分析", "portfolio", "risk"]],
      ["/experiences/vertical/commerce", "Commerce flow", ["电商", "checkout", "cart"]],
      ["/experiences/vertical/education", "Learning module", ["课程", "lesson", "quiz"]],
      ["/experiences/vertical/media", "Creator studio", ["素材库", "assets", "gallery"]],
      ["/experiences/vertical/productivity", "Productivity board", ["看板", "tasks", "board"]],
      ["/experiences/vertical/forum", "Discussion forum", ["论坛", "threads", "replies"]],
    ],
  },
  {
    kind: "pattern",
    useCases: ["business", "research", "finance"],
    artDirections: ["scientific-precision", "editorial-modern"],
    tags: ["recipe", "composition"],
    pages: [
      ["/patterns", "Patterns", ["配方", "recipes"]],
      ["/patterns/research-workspace", "Research workspace", ["研究工作区", "flagship", "inspector"]],
      ["/patterns/command-palette", "Command palette", ["命令面板", "cmd k", "launcher"]],
      ["/patterns/table-filters", "Table filters", ["筛选", "facets", "filter bar"]],
      ["/patterns/chart-table", "Chart and table", ["图表与表格", "linked views"]],
      ["/patterns/industries", "Industries", ["行业", "domains"]],
      ["/patterns/data-details", "Data details", ["详情", "master detail"]],
      ["/patterns/settings-form", "Settings in a sheet", ["设置表单", "preferences"]],
      ["/patterns/table-date-filter", "Table with a date range", ["日期筛选", "date filter"]],
      ["/patterns/chart-date-filter", "Chart with a date range", ["区间图表", "range chart"]],
      ["/patterns/workspace", "Workspace", ["工作区", "panes", "split"]],
    ],
  },
  {
    kind: "pattern",
    useCases: ["research", "business"],
    artDirections: ["scientific-precision", "bold-experimental"],
    tags: ["experiment", "design lab"],
    pages: [
      ["/experiments/design-lab", "Design lab", ["设计实验", "treatments"]],
      ["/experiments/design-lab/precision-instrument", "Precision instrument", ["精密仪器"]],
      ["/experiments/design-lab/editorial-research", "Editorial research", ["编辑式研究"]],
      ["/experiments/design-lab/focused-workspace", "Focused workspace", ["聚焦工作区"]],
    ],
  },
  {
    kind: "doc",
    useCases: ["business", "research"],
    artDirections: ["editorial-modern"],
    tags: ["guide", "getting started"],
    pages: [
      ["/docs", "Documentation", ["文档", "getting started"]],
      ["/docs/installation", "Installation", ["安装", "setup", "pnpm"]],
      ["/docs/theming", "Theming", ["主题", "tokens", "dark mode"]],
      ["/docs/reference", "API reference", ["api", "exports", "types"]],
      ["/foundations", "Foundations", ["基础", "principles"]],
      ["/foundations/colors", "Colors", ["颜色", "palette", "contrast"]],
      ["/foundations/typography", "Typography", ["字体", "type scale", "numeric"]],
      ["/foundations/spacing", "Spacing", ["间距", "rhythm"]],
      ["/foundations/radius", "Radius", ["圆角", "corners"]],
      ["/foundations/surface", "Surface", ["表面", "elevation"]],
      ["/foundations/shadow", "Shadow", ["阴影", "elevation"]],
      ["/foundations/glow", "Glow", ["发光", "accent"]],
      ["/foundations/motion", "Motion", ["动效", "duration", "easing"]],
      ["/foundations/spatial", "Spatial language", ["空间语言", "depth"]],
      ["/foundations/themes", "Themes and type", ["主题与字体", "palettes", "voices"]],
      ["/foundations/personality", "Personality", ["性格", "material"]],
      ["/application", "Application", ["应用", "shell"]],
      ["/application/navigation", "Navigation", ["导航", "sidebar", "breadcrumbs"]],
      ["/application/workspace", "Workspace", ["工作区", "panes", "inspector"]],
      ["/application/url-state", "URL state", ["url 状态", "query params"]],
      ["/application/outline-drawer", "Outline drawer", ["大纲", "on this page"]],
      ["/application/packaging", "Packaging", ["打包", "bundle", "exports"]],
      ["/forms", "Forms overview", ["表单", "lifecycle"]],
      ["/forms/validation", "Validation", ["校验", "errors"]],
      ["/forms/async", "Async validation and submission", ["异步校验", "submit"]],
      ["/forms/sections", "Sections and repeating groups", ["分组", "repeaters"]],
      ["/data/table", "Data table", ["数据表", "grid"]],
      ["/data/table-virtualized", "Virtualised table", ["虚拟滚动", "windowed"]],
      ["/data/metrics", "Metrics", ["指标", "kpi"]],
      ["/data/statuses", "Statuses and freshness", ["新鲜度", "availability"]],
      ["/date-time/calendar", "Calendar", ["日历", "month"]],
      ["/date-time/date-picker", "Date picker", ["日期选择"]],
      ["/date-time/date-range", "Date range", ["日期区间"]],
      ["/date-time/time", "Time", ["时间", "clock"]],
      ["/integrations/tradingview", "TradingView integration", ["行情", "markets", "provider"]],
    ],
  },
];
