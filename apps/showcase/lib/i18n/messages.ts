/*
 * Showcase copy, in both languages.
 *
 * Shape, and why:
 *
 *  - `ui` is keyed by a stable symbol, and the **English dictionary is the
 *    canonical source** for every key. A translation that is missing from
 *    `zh-CN` therefore degrades to English rather than to a raw key, and a
 *    reviewer can see exactly what is untranslated by diffing the two maps.
 *  - `nav` is keyed by the English label itself. The sidebar is generated from
 *    one navigation model (`lib/navigation.ts`) whose labels double as the
 *    source strings, so a new page gets an English label for free and a
 *    translated one by adding a single line here.
 *  - `content` carries long-form page copy, keyed by symbol, for the pages that
 *    are translated in full. Prose lives in the dictionary rather than inline so
 *    a translator never has to read a component to find a sentence.
 *
 * Deliberately **not** translated: component names, prop names, import paths,
 * token names, command names and any code sample. Those are identifiers: a
 * Chinese-speaking developer types `<Button variant="primary">` exactly as an
 * English-speaking one does, and translating them would break the API contract
 * the documentation exists to describe.
 *
 * One more boundary, and it is a judgement rather than an identifier rule:
 * **specimen fixture text that a printed snippet also contains stays as
 * written.** A demo whose preview says `运行回测` while the code beside it says
 * `Run backtest` has desynchronised the two things the page promises are the
 * same, which is worse than an English word inside a live example. Fixture copy
 * that no snippet prints — the CardStack deck's card labels, for instance — *is*
 * translated, because nothing has to stay in step with it.
 *
 * Two tests guard the surfaces that are data rather than literals, and both read
 * the runtime dictionary rather than the source file, because a key that lands
 * outside the exported map is a translation no page ever sees:
 * `tests/unit/install-i18n.test.ts` (installation and API copy) and
 * `tests/unit/registry-lead-i18n.test.ts` (registry leads).
 */

import { routesZh } from "./routes.zh";
import { proseZh } from "./prose.zh";

export interface Dictionary {
  ui: Record<string, string>;
  nav: Record<string, string>;
  routes: Record<string, { title?: string; lead?: string }>;
  content: Record<string, string>;
  /** Long-form documentation prose, keyed by its English source sentence. */
  prose: Record<string, string>;
}

/* -------------------------------------------------------------------------- */
/* Chrome — the English canon.                                                */
/* -------------------------------------------------------------------------- */

const uiEn: Record<string, string> = {
  "nav.filterPlaceholder": "Filter navigation…",
  "nav.filterLabel": "Filter navigation",
  "nav.noMatch": "No section matches “{query}”.",
  "nav.sections": "Showcase sections",
  "nav.clearFilter": "Clear the navigation filter",
  "nav.designSystem": "Design system",
  "nav.skipToContent": "Skip to content",

  "shell.home": "Home",
  "shell.more": "More",
  "shell.morePanel": "The rest of the Showcase: reference products, patterns, the application shell, studios and the guides.",
  "shell.search": "Search",
  "shell.primaryNav": "Primary navigation",
  "shell.openArea": "Show what is in {area}",
  "shell.andMore": "{count} more in this area",
  "shell.siteMap": "Site map",
  "shell.partOf": "Part of",
  "shell.entries": "{count} catalog entries",
  "shell.routes": "{count} routes",
  "shell.theme": "{theme} theme",
  "shell.appearance": "{palette} palette · {typeface} type",
  "shell.version": "LUC UI v1.0",
  "shell.tokens": "tokens · components · charts",
  "shell.status": "Shell status",
  "shell.language": "Language",

  "appearance.label": "Brand palette, type voice and personality",
  "appearance.paletteTitle": "Brand palette",
  "appearance.paletteHint": "Sets the accent family. Status colours never move.",
  "appearance.typeTitle": "Type voice",
  "appearance.typeHint": "Re-points the sans, display and mono roles.",
  "appearance.personalityTitle": "Visual personality",
  "appearance.personalityHint": "Geometry, density, proportions and motion physics.",
  "appearance.spaceTitle": "Spatial depth",
  "appearance.spaceHint": "How far a surface is allowed to travel. `data-space` on any subtree.",
  "space.flat.note": "No travel: depth is borders and light only.",
  "space.layered.note": "The default. A few pixels of lift and press.",
  "space.deep.note": "More travel, for editorial and display surfaces.",
  "appearance.apply": "Use {label}",
  "appearance.inUse": "In use",

  "theme.aria": "Colour theme",
  "theme.system": "System theme",
  "theme.light": "Light theme",
  "theme.dark": "Dark theme",

  "motion.aria": "Motion preference",
  "motion.auto": "Motion auto",
  "motion.reduced": "Reduced",
  "motion.hintAuto": "Motion follows your OS preference",
  "motion.hintReduced": "Reduced motion is forced on for review",

  "command.label": "Command menu",
  "command.description": "Search across navigation, actions and settings.",
  "command.placeholder": "Search navigation, actions and settings…",
  "command.empty": "Nothing matches “{query}”.",
  "command.navigate": "Navigate",

  "charts.catalog.status.public": "Public",
  "charts.catalog.status.engine": "Engine",
  "charts.catalog.status.planned": "Planned",
  "charts.catalog.status.blocked": "Blocked",
  "command.jumpTo": "Jump to",
  "command.settings": "Settings",
  "command.theme": "Theme",
  "command.chartSystem": "Chart system",
  "command.dataTable": "Data table",
  "command.virtualisedTable": "Virtualised table",
  "command.switchTheme": "Switch theme",
  "command.testToast": "Fire a test toast",
  "command.toastTitle": "Command menu",
  "command.toastBody": "This toast came from the palette.",
  "command.light": "Light",
  "command.dark": "Dark",
  "command.system": "System",
  "command.moveHint": "to move",
  "command.runHint": "to run",
  "command.closeHint": "to close",
  "command.themeIntent": "Theme intent:",
  "command.painted": "painted",

  "language.title": "Language",
  "language.hint": "The URL carries the language, so links stay shareable.",
  "language.switch": "Switch language",
  "language.current": "Current language",
  "language.coverage":
    "Navigation, page titles and every control are translated. Long-form body copy is translated for the homepage, the motion gallery and the personality page; the rest renders in English.",

  "docs.onThisPage": "On this page",
  "docs.copyCode": "Copy code",
  "docs.copied": "Copied",

  /* Appearance notes. The palette, type and personality *names* are brand
     names and stay as they are in every language; only the notes translate. */
  "palette.cyan.note": "The default. Cool, technical, quiet.",
  "palette.violet.note": "AI products, creative tools, consumer.",
  "palette.cobalt.note": "Enterprise software and infrastructure.",
  "palette.emerald.note": "Health, growth, sustainability.",
  "palette.rose.note": "Commerce, community, publishing.",
  "palette.ember.note": "Warm editorial, high energy.",
  "palette.graphite.note": "Monochrome — the content is the colour.",
  "typeface.inter.note": "Neutral, complete, self-hosted.",
  "typeface.humanist.note": "No webfont: the platform's own sans.",
  "typeface.editorial.note": "Serif voice with looser leading.",
  "typeface.technical.note": "Monospaced display for engineering surfaces.",
  "personality.instrument.note": "Calibrated geometry, precise motion — the default.",
  "personality.editorial.note": "Generous curves, unhurried motion, looser leading.",
  "personality.dense.note": "Tight geometry, faster motion, closer rows.",
  "personality.expressive.note": "Large curves, springy motion, stronger light.",
};

const uiZh: Record<string, string> = {
  "nav.filterPlaceholder": "筛选导航…",
  "nav.filterLabel": "筛选导航",
  "nav.noMatch": "没有匹配“{query}”的栏目。",
  "nav.sections": "展示站栏目",
  "nav.clearFilter": "清除导航筛选",
  "nav.designSystem": "设计系统",
  "nav.skipToContent": "跳到正文",

  "shell.home": "首页",
  "shell.more": "更多",
  "shell.morePanel": "Showcase 的其余部分：产品范例、模式、应用外壳、工作室与各类指南。",
  "shell.search": "搜索",
  "shell.primaryNav": "主导航",
  "shell.openArea": "展开「{area}」的内容",
  "shell.andMore": "该区域还有 {count} 项",
  "shell.siteMap": "站点地图",
  "shell.partOf": "所属",
  "shell.entries": "{count} 个目录条目",
  "shell.routes": "{count} 个路由",
  "shell.theme": "{theme} 主题",
  "shell.appearance": "{palette} 色板 · {typeface} 字体",
  "shell.version": "LUC UI v1.0",
  "shell.tokens": "令牌 · 组件 · 图表",
  "shell.status": "外壳状态",
  "shell.language": "语言",

  "appearance.label": "品牌色板、字体角色与视觉人格",
  "appearance.paletteTitle": "品牌色板",
  "appearance.paletteHint": "设置强调色家族，状态色永不随之改变。",
  "appearance.typeTitle": "字体角色",
  "appearance.typeHint": "重新指向正文、标题与等宽三类角色。",
  "appearance.personalityTitle": "视觉人格",
  "appearance.personalityHint": "几何、密度、排版比例与动效物理。",
  "appearance.spaceTitle": "空间深度",
  "appearance.spaceHint": "表面允许位移多少。任意子树都可以用 `data-space` 覆盖。",
  "space.flat.note": "不位移：深度只由描边与光表达。",
  "space.layered.note": "默认值。几个像素的抬起与按压。",
  "space.deep.note": "更大的位移，适合编辑与展示型页面。",
  "appearance.apply": "启用 {label}",
  "appearance.inUse": "使用中",

  "theme.aria": "颜色主题",
  "theme.system": "跟随系统主题",
  "theme.light": "浅色主题",
  "theme.dark": "深色主题",

  "motion.aria": "动效偏好",
  "motion.auto": "动效自动",
  "motion.reduced": "减弱动效",
  "motion.hintAuto": "动效跟随你的系统偏好",
  "motion.hintReduced": "已为评审强制开启减弱动效",

  "command.label": "命令菜单",
  "command.description": "搜索导航、操作与设置。",
  "command.placeholder": "搜索导航、操作与设置…",
  "command.empty": "没有匹配“{query}”的结果。",
  "command.navigate": "导航",

  "charts.catalog.status.public": "公开",
  "charts.catalog.status.engine": "引擎支持",
  "charts.catalog.status.planned": "计划中",
  "charts.catalog.status.blocked": "受阻",
  "command.jumpTo": "快速前往",
  "command.settings": "设置",
  "command.theme": "主题",
  "command.chartSystem": "图表系统",
  "command.dataTable": "数据表格",
  "command.virtualisedTable": "虚拟化表格",
  "command.switchTheme": "切换主题",
  "command.testToast": "触发一条测试提示",
  "command.toastTitle": "命令菜单",
  "command.toastBody": "这条提示来自命令面板。",
  "command.light": "浅色",
  "command.dark": "深色",
  "command.system": "跟随系统",
  "command.moveHint": "移动",
  "command.runHint": "执行",
  "command.closeHint": "关闭",
  "command.themeIntent": "主题意图：",
  "command.painted": "实际绘制",

  "language.title": "语言",
  "language.hint": "语言写在 URL 里，所以链接始终可以直接分享。",
  "language.switch": "切换语言",
  "language.current": "当前语言",
  "language.coverage":
    "导航、页面标题与所有控件均已翻译。首页、动效画廊与视觉人格页的正文也已翻译，其余页面正文暂以英文呈现。",

  "docs.onThisPage": "本页内容",
  "docs.copyCode": "复制代码",
  "docs.copied": "已复制",

  "palette.cyan.note": "默认色板。冷静、技术、克制。",
  "palette.violet.note": "适合 AI 产品、创作工具与消费级应用。",
  "palette.cobalt.note": "适合企业软件与基础设施。",
  "palette.emerald.note": "适合健康、成长与可持续主题。",
  "palette.rose.note": "适合电商、社区与内容出版。",
  "palette.ember.note": "温暖的编辑气质，能量更高。",
  "palette.graphite.note": "纯中性——内容本身就是颜色。",
  "typeface.inter.note": "中性、完整、自托管。",
  "typeface.humanist.note": "不加载网络字体，使用系统无衬线。",
  "typeface.editorial.note": "衬线声线，行距更宽松。",
  "typeface.technical.note": "面向工程界面的等宽标题。",
  "personality.instrument.note": "刻度分明的几何与精确的动效——默认。",
  "personality.editorial.note": "更大的圆角、从容的动效、更松的行距。",
  "personality.dense.note": "更紧凑的几何、更快的动效、更近的行高。",
  "personality.expressive.note": "更大的圆角、带回弹的动效、更强的光。",
};

/* -------------------------------------------------------------------------- */
/* Navigation — keyed by the English label, which is also the source string.   */
/* -------------------------------------------------------------------------- */

const navZh: Record<string, string> = {

  /* LUC Visuals */
  "Every capability, rendered live, grouped by the job it does.": "每一项能力都现场渲染，并按用途归类。",


  "Progress and goals": "进度与目标",
  "Charts and data": "图表与数据",
  "Time and calendar": "时间与日历",
  "Editorial and text": "编辑与文本",
  "Annotation and publication": "标注与出版",

  "Artifact gallery": "作品画廊",
  "not implemented for this composition: {list}": "此构图未实现的风格：{list}",
  "none": "无",
  "Editorial": "编辑型",

  /* 产品范例 */
  "Experiences": "产品范例",
  "Marketing site": "营销站点",
  "SaaS console": "SaaS 控制台",
  "Publishing platform": "内容出版平台",
  "Community product": "社区产品",
  "Career profile": "职业主页",
  "Academic profile": "学术主页",
  "Creative portfolio": "创意作品集",
  "Journal & garden": "日志与花园",
  "AI workspace": "AI 工作台",
  "Research bench": "研究工作台",
  "Quantitative desk": "量化交易台",
  "Commerce flow": "电商流程",
  "Learning module": "学习模块",
  "Creator studio": "创作者工作台",
  "Productivity board": "效率看板",
  "Discussion forum": "讨论论坛",
  "Sixteen reference products built from the public API.": "十六个用公开 API 搭建的产品范例。",
  "Hero, features, pricing, FAQ and a lead form.": "首屏、能力、定价、常见问题与线索表单。",
  "Shell, table, dialog, sheet and notifications.": "外壳、表格、对话框、抽屉与通知。",
  "An index, a reading view and a share control.": "索引、阅读视图与分享控件。",
  "Feed, reactions, replies and moderation.": "信息流、回应、回复与治理。",
  "A professional site: timeline, work, CV action.": "职业主页：时间线、作品、简历动作。",
  "A filterable bibliography and a research identity.": "可筛选的文献列表与研究身份。",
  "The expressive one: spatial hero and gallery.": "最具表现力的一页：空间首屏与画廊。",
  "A now block, a reading shelf and tagged notes.": "近况区块、书架与带标签的笔记。",
  "Streaming answers, tool calls, agent state.": "流式回答、工具调用、智能体状态。",
  "Parameters that drive figures, never data.": "参数驱动的是图形，而不是数据。",
  "A window, a book and an inspector.": "一个窗口、一本持仓与一个检查面板。",
  "Variants, a basket and a three-step checkout.": "变体、购物车与三步结算。",
  "Lessons, progress and a self-scoring check.": "课程、进度与自评分检验。",
  "A media library and a reorderable reel.": "素材库与可重排的成片顺序。",
  "A kanban board, bulk selection and a roll-up.": "看板、批量选择与状态汇总。",
  "Topics, a thread and a moderation path.": "话题、帖子与治理流程。",
  TreeView: "TreeView",
  Board: "看板与排序",
  "Colour & transfer": "取色与穿梭框",
  Notifications: "通知与引导",
  "AI surface": "AI 界面",
  Diagnostics: "诊断图",
  Networks: "网络图",
  Geospatial: "地理图",
  Inputs: "输入",
  "Date & time": "日期与时间",
  Data: "数据",
  Experiments: "实验",

  Home: "首页",
  Colors: "颜色",
  Spacing: "间距",
  Radius: "圆角",
  Surface: "表面",
  Shadow: "阴影",
  Glow: "辉光",

  "Themes & type": "主题与字体",
  Personality: "视觉人格",

  Buttons: "按钮",
  Selection: "选择控件",
  Select: "下拉选择",
  Combobox: "组合框",
  Slider: "滑块",
  Tabs: "选项卡",
  Badges: "徽标",
  Cards: "卡片",
  Alerts: "提示条",

  "Empty states": "空状态",
  Overlay: "浮层",
  Dialog: "对话框",
  Sheet: "侧边面板",
  Toast: "轻提示",
  Command: "命令面板",
  "Text inputs": "文本输入",
  Number: "数字",
  Password: "密码",
  "One-time codes": "一次性验证码",
  "File upload": "文件上传",
  Tags: "标签输入",

  Validation: "校验",
  Async: "异步",
  Sections: "分组",
  Calendar: "日历",
  "Date picker": "日期选择器",
  "Date range": "日期区间",
  Time: "时间",
  Metrics: "指标",
  Statuses: "状态",
  "Data table": "数据表格",
  "Virtualised table": "虚拟化表格",
  "App shell": "应用外壳",
  Workspace: "工作区",
  "Outline drawer": "大纲抽屉",
  "URL state": "URL 状态",
  Packaging: "打包发布",
  Kinetic: "动感交互",
  "Signature motion": "标志性动效",
  "Spatial motion": "空间动效",
  "Depth, geometry, morphing, kinetic type and linked data — the spatial gallery.":
    "深度、几何、形变、动态排版与联动数据——空间动效画廊。",
  "Spatial language": "空间语言",
  "Depth, elevation rungs and the press gesture — library-wide.":
    "全库统一的深度、层级台阶与按压手势。",
  Accordion: "折叠面板",
  "Sections that open and close.": "可开合的区块。",
  Toggle: "开关控件",
  "Pressed controls, groups and toolbars.": "按压控件、按钮组与工具栏。",
  Avatar: "头像",
  "Identity, groups and rating.": "身份标识、头像组与评分。",
  Pagination: "分页",
  "Paging and themed scroll regions.": "分页与主题化滚动区域。",
  AlertDialog: "确认对话框",
  "Confirmation for the irreversible.": "用于不可逆操作的确认。",
  Timeline: "时间线",
  "Sequences and progress steps.": "事件序列与进度步骤。",
  Carousel: "轮播",
  "A rail of items, on native scroll-snap.": "基于原生 scroll-snap 的横向内容轨。",
  "Field parts": "表单零件",
  "InputGroup, Label, NativeSelect, Kbd.": "InputGroup、Label、NativeSelect、Kbd。",
  "A hierarchy you can walk with the keyboard.": "可以用键盘走完的层级结构。",
  "Sortable lists and a kanban board.": "可排序列表与看板。",
  "ColorPicker and TransferList.": "取色器与穿梭框。",
  "Gallery, lightbox and before/after.": "图库、灯箱与前后对照。",
  "Inbox and guided tour.": "通知中心与引导巡览。",
  "Messages, streaming, tools, agent state.": "消息、流式文本、工具调用与 agent 状态。",
  "Autocorrelation, survival, precision–recall, importance.": "自相关、生存曲线、精确率—召回率与特征重要性。",
  "Chord diagrams and dendrograms.": "和弦图与树状图。",
  "Choropleth and trajectory maps.": "分级统计图与轨迹图。",
  "A projected 3D surface, with no 3D engine.": "投影三维曲面，不需要三维引擎。",
  "ECDF, Q–Q, violin, intervals, ROC, calibration, confusion.":
    "ECDF、Q–Q、小提琴、区间、ROC、校准与混淆矩阵。",
  Scientific: "科学图",
  "Parallel coordinates, ternary, vector fields, contours, spectra.":
    "平行坐标、三元图、向量场、等高线与频谱。",
  Workflow: "流程图",
  "Gantt, dumbbell, bullet, slope, bump, Mekko.": "甘特、哑铃、子弹、斜率、凹凸与 Mekko。",
  Quantitative: "量化图",
  "Candles, drawdown, smiles, frontier, factors, attribution.":
    "K 线、回撤、波动率微笑、有效前沿、因子与归因。",
  Multidimensional: "多维图",
  "Scatterplot matrix, hierarchy, geography.": "散点矩阵、层级与地理。",
  "Chart catalogue": "图表目录",
  "Every type, with an honest status.": "每一种类型，以及诚实的状态标注。",
  "Border Glow": "边缘辉光",
  Spotlight: "聚光表面",
  Shimmer: "微光",
  "Number Ticker": "数字滚动",
  Reveal: "入场动效",
  "Symbol details": "标的信息",
  "News & calendars": "新闻与日历",
  Watchlists: "自选列表",
  Themes: "主题",
  "Composed pages": "组合页",
  Compositions: "组合示例",
  "Research workspace": "研究工作区",
  "Table + filters": "表格 + 筛选",
  "Table + dates": "表格 + 日期",
  "Chart + dates": "图表 + 日期",
  "Command palette": "命令面板",
  "Chart + table": "图表 + 表格",
  "Data details": "数据明细",
  "Cross-industry": "跨行业",
  "Settings sheet": "设置面板",
  "Design Lab": "设计实验室",
  "Precision Instrument": "精密仪器",
  "Editorial Research": "编辑式研究",
  "Focused Workspace": "专注工作区",
  Architecture: "体系结构",
  "Time series": "时间序列",
  Comparison: "对比",
  Distribution: "分布",
  Relationship: "关系",
  Uncertainty: "不确定性",
  Matrix: "矩阵",
  Composition: "构成",
  Flow: "流向",
  Radial: "径向",
  Composed: "组合图",
  Research: "研究",
  Financial: "金融",
  Synchronised: "同步联动",
  Interaction: "交互",
  Performance: "性能",
  Sizing: "尺寸",

  /* Item and group descriptions — the sidebar's second line. */
  "The principles behind LUC UI.": "LUC UI 背后的原则。",
  "Semantic surfaces, text and accents.": "语义化表面、文字与强调色。",
  "Roles, scale and numeric text.": "字体角色、字号阶梯与数字文本。",
  "The 4pt rhythm and density modes.": "4pt 节奏与密度模式。",
  "One radius scale, applied with intent.": "一套圆角阶梯，按用途使用。",
  "The luminance hierarchy.": "以明度分层表达高度。",
  "Restrained elevation levels.": "克制的层级阴影。",
  "Where the accent is allowed to shine.": "强调色被允许发光的地方。",
  "Duration and easing vocabulary.": "时长与缓动词汇表。",
  "Seven brand palettes and four type voices, live.": "七套品牌色板与四种字体声线，实时切换。",
  "Geometry, density and motion physics as one attribute.":
    "用一个属性切换几何、密度与动效物理。",
  "Every public component family, in one map.": "一张图看完全部公开组件家族。",
  "Button, IconButton, Link.": "Button、IconButton、Link。",
  "Checkbox, Radio, Switch.": "Checkbox、Radio、Switch。",
  "One value from a known set.": "从已知集合中选一个值。",
  "Search, then choose.": "先搜索，再选择。",
  "Single values and ranges.": "单值与区间。",
  "Dropdown menu and context menu.": "下拉菜单与右键菜单。",
  "Tabs and SegmentedControl.": "Tabs 与 SegmentedControl。",
  "Badge and Tag.": "Badge 与 Tag。",
  "Card states and Panel.": "卡片状态与面板。",
  "Inline status messages and callouts.": "行内状态信息与说明块。",
  "The reusable nothing-here-yet surface.": "可复用的“暂无内容”表面。",
  "Tooltip and Popover.": "Tooltip 与 Popover。",
  "One dialog foundation.": "一个对话框底座。",
  "Edge-anchored panels.": "贴边面板。",
  "Skeleton, Spinner, Progress.": "骨架屏、加载指示与进度。",
  "Non-blocking feedback.": "不打断操作的反馈。",
  "Run things from a palette.": "在面板里执行操作。",
  "Input, Textarea, SearchInput, Field.": "Input、Textarea、SearchInput、Field。",
  "Number, currency, percentage.": "数字、货币与百分比。",
  "A field with a reveal toggle.": "带显示切换的密码字段。",
  "Six slots, one real input.": "六个格子，一个真实输入框。",
  "File fields and drop zones.": "文件字段与拖放区域。",
  "Short values, typed into a row.": "在一行里输入的短值。",
  "Field anatomy, states, submit lifecycle.": "字段结构、状态与提交生命周期。",
  "Field rules, summaries, server errors.": "字段规则、汇总与服务器错误。",
  "Availability checks and slow saves.": "可用性校验与慢速保存。",
  "Sectioned forms and repeating rows.": "分组表单与可重复行。",
  "Day grids, ranges, month and year.": "日期网格、区间、月与年。",
  "Dates, local and zoned times.": "日期、本地时间与带时区时间。",
  "Presets, ranges, boundaries.": "预设、区间与边界。",
  "Wall clocks with no time zone.": "不带时区的墙上时间。",
  "Metric, MetricValue, Delta, StatCard.": "Metric、MetricValue、Delta、StatCard。",
  "Status and data freshness.": "状态与数据新鲜度。",
  "Sorting, filters, selection, paging.": "排序、筛选、选择与分页。",
  "10,000 rows without 10,000 elements.": "一万行数据，不渲染一万个节点。",
  "Frame, sidebar, topbar, status bar.": "外框、侧边栏、顶栏与状态栏。",
  "One model, three surfaces.": "一套模型，三种呈现。",
  "Resizable panes and an inspector.": "可调整大小的分栏与检查器。",
  "A collapsible report navigator.": "可折叠的报告导航。",
  "Shareable, local, ephemeral.": "可分享、本地、瞬时三种状态。",
  "Subpaths, CSS, tree shaking.": "子路径、CSS 与摇树优化。",
  "Premium interaction: magnets, tilt, morphs, bursts.":
    "高级交互：磁吸、倾斜、形变与迸发。",
  "The signature interactions, with live controls.": "标志性交互，可现场调参。",
  "Light on the perimeter.": "在边缘流动的光。",
  "Pointer-proximity surfaces.": "感知指针接近的表面。",
  "A single soft sweep.": "一次轻柔的掠过。",
  "Numbers that move, without jitter.": "数字会动，但不会抖动。",
  "Content entering with intent.": "有意图的内容入场。",
  "Every motion primitive, in one gallery.": "所有动效原语，集中在一页画廊中。",
  "Provider market data: charts, screeners, heatmaps, news, calendars.":
    "提供商行情数据：图表、筛选器、热力图、新闻与日历。",
  "Catalog, formats and policy.": "组件目录、用法与策略。",
  "Advanced, mini, overview, seasonal.": "高级、迷你、概览与季节性图表。",
  "Market sections and overviews.": "市场板块与总览。",
  "Tape, strip, chip, single.": "滚动条、行情带、紧凑标签与单值。",
  "Stock, crypto, ETF, FX.": "股票、加密、ETF 与外汇。",
  "Filterable market tables.": "可筛选的市场表格。",
  "Facts, ratings, fundamentals.": "关键数据、评级与基本面。",
  "Feed, events, macro map.": "新闻流、事件与宏观地图。",
  "Token bridge vs provider config.": "令牌桥接与提供商配置的两种深度。",
  "Composed market pages.": "组合出的市场页面。",
  "Small, real assemblies.": "小而真实的组合。",
  "The whole system in one screen.": "一个屏幕看完整套系统。",
  "A filter bar over a table.": "表格上方的筛选栏。",
  "A period over a table.": "表格上方的时间区间。",
  "A window over a chart.": "图表上方的时间窗口。",
  "Quick actions over rows.": "针对行的快捷操作。",
  "The accessible data view.": "无障碍的数据视图。",
  "Exact rows behind a surface.": "表面背后的精确数据行。",
  "One component set, four products, four palettes.":
    "一套组件，四个产品，四套色板。",
  "A validated form in a Sheet.": "侧边面板里的校验表单。",
  "Every part in one screen.": "每个部件同屏呈现。",
  "Three treatments of one linked selection flow.": "同一个联动选择流程的三种处理方式。",
  "The premise, the shared dataset and the three treatments.":
    "前提、共享数据集与三种处理方式。",
  "Calibrated lines; the measurement leads.": "刻度分明，测量本身说话。",
  "The finding leads; the evidence follows.": "结论先行，证据随后。",
  "Selection linked across table, chart and inspector.":
    "选择在表格、图表与检查器之间联动。",
  "The whole chart system in one screen.": "一个屏幕看完整套图表系统。",
  "Engines, adapters and the token bridge.": "引擎、适配器与令牌桥。",
  "Line, area, bands, events.": "折线、面积、区间与事件。",
  "Bars, stacking, waterfall.": "柱状、堆叠与瀑布。",
  "Histogram and box plot.": "直方图与箱线图。",
  "Scatter, bubble, quadrants.": "散点、气泡与象限。",
  "Fan bands, regression, regimes, event studies.": "扇形区间、回归、状态与事件研究。",
  "Heatmap, correlation, calendar.": "热力图、相关性与日历。",
  "Donut, treemap, sunburst, funnel.": "环形、矩形树图、旭日与漏斗。",
  "Sankey and network.": "桑基图与关系网络。",
  "Radar and gauge.": "雷达图与仪表盘。",
  "Mixed marks and dual axes.": "混合标记与双轴。",
  "Drawdown, regimes, curves, depth.": "回撤、状态、曲线与深度。",
  "Candles, volume, overlays, panes.": "K 线、成交量、叠加与分栏。",
  "Cross-engine crosshair and range.": "跨引擎的十字光标与可视区间。",
  "Tooltips, zoom, brush, fullscreen.": "提示、缩放、框选与全屏。",
  "Dense time series at 10k points.": "一万点的密集时间序列。",
  "Semantic heights, robust domains, positions.": "语义化高度、稳健量程与位置。",
  /* ---- Phase 9 navigation: product-level destinations -------------------- */
  "Start here": "从这里开始",
  "Documentation": "文档",
  "Installation": "安装",
  "Theming": "主题定制",
  "API reference": "API 参考",
  "Intro": "简介",
  "Anatomy": "结构",
  "Variants": "变体",
  "States": "状态",
  "Accessibility": "无障碍",
  "SSR and rendering": "服务端渲染",
  "Usage": "用法",
  "Overview": "总览",

  /* ---- Phase 9 navigation: library groups and families ------------------- */
  "Components": "组件",
  "Actions": "操作",
  "Forms": "表单",
  "Date and time": "日期与时间",
  "Layout": "布局",
  "Navigation": "导航",
  "Feedback": "反馈",
  "Feedback overview": "反馈总览",
  "Overlays": "覆盖层",
  "Overlay patterns": "覆盖层模式",
  "Menus": "菜单",
  "Selection controls": "选择控件",
  "Data display": "数据展示",
  "Media": "媒体",
  "Media overview": "媒体总览",
  "Application": "应用框架",
  "AI": "AI",
  /* The registry's title for the AI family, which the sidebar renders through
   * `tn()`. It is a family *label* rather than a component identifier, so it is
   * translated; the exports under it (AiMessage, AiToolCall, …) are not. */
  "AI surfaces": "AI 界面",
  "Typography": "排版",
  "Charts": "图表",
  "Motion": "动效",
  "Motion gallery": "动效图库",
  "Every kinetic primitive, grouped by what it is for.": "按用途分组的全部动效原语。",
  "Integrations": "集成",
  "Foundations": "设计基础",
  /*
   * The four sections of the Components sidebar (IA V3).
   *
   * An area names its own sections (`NavArea.sectionLabels`), and the heading is
   * looked up here like every other navigation label. They are not the same words
   * as the group titles they override — "UI components" is one of four sections,
   * where "Components" is the whole product on `/charts` — which is exactly why
   * the area, not the group, owns the wording.
   */
  "Design foundations": "设计基础",
  "UI components": "界面组件",
  "Motion and interaction": "动效与交互",
  "Installation, theming, the generated API reference, and the design laboratory.": "安装、主题、自动生成的 API 参考，以及设计实验室。",
  /*
   * The Visuals gallery rows (IA V3).
   *
   * A navigation group's row description is looked up by `tn`, so it belongs
   * here rather than in the prose dictionary — the same split as every other row
   * in this file.
   */

  "Patterns": "模式",
  "Surfaces": "表面",
  "Spatial": "空间",

  /* ---- Phase 9 navigation: studios and building blocks ------------------ */
  "Studios": "工作室",
  /* NAV-002/IA-007: the family that owns Blocks, Templates, Patterns and
   * Experiences. The four are destinations; "Build" is the word they share. */
  "Build": "搭建",
  "Build with it": "用它来搭",
  "Chart Studio": "图表工作室",
  "Motion Studio": "动效工作室",
  "Theme Studio": "主题工作室",
  "Template Composer": "模板编排器",
  "Blocks": "区块",
  "Templates": "模板",

  /* ---- Phase 9 navigation: integration pages --------------------------- */
  "Watchlists and market data": "自选表与市场数据",
  "Tickers": "行情条",
  "Heatmaps": "热力图",
  "Screeners": "筛选器",
  "News and calendars": "新闻与日历",
  "Theme bridge": "主题桥接",

  /* ---- Phase 9 navigation: chart and integration family headings -------- */
  "General": "通用",
  "Statistical": "统计",
  "Scientific & mathematical": "科学与数学",
  "Diagnostics, ML & risk": "诊断、机器学习与风险",
  "Financial & quantitative": "金融与量化",
  "Multidimensional, network & hierarchy": "多维、网络与层级",
  "Workflow & operations": "流程与运营",
  "Time series & sequence": "时间序列与序列",
  "Geographic": "地理",
  "TradingView": "TradingView",
  "Typography motion": "文字动效",

  /*
   * Labels that were never rendered: the sidebar showed these in English in the
   * Chinese locale because the dictionary lacked them — a gap the coverage
   * summary under-counted, which is exactly the kind of claim Phase 9 is meant
   * to stop making.
   */
  "Themes and type": "主题与字体",
  "Table filters": "表格筛选",
  "Chart and table": "图表与表格",
  "Industries": "行业",

  /* ---- Phase 9 hardening: the sidebar's second line, completed ---------- */
  /*
   * These 39 descriptions were rendered in English on the Chinese site. The
   * coverage summary reported "navigation descriptions 12/51" — the measure was
   * correct and the gap was real, so this is the other half of the dictionary.
   * Wording follows the same voice as the sentences above: a description says
   * what the destination is for, in the register the docs themselves use.
   */
  "What LUC UI is, and how to find the thing you need.":
    "LUC UI 是什么，以及如何找到你需要的部分。",
  "Install, import the styles, install the provider.": "安装、引入样式、挂载 Provider。",
  "Palettes, type voices, personality and depth.": "配色、字体声线、视觉人格与层次。",
  "Every public export, grouped by family and generated from the package.":
    "全部公开导出，按家族分组，直接从包里生成。",
  "Which surface for which job.": "什么场景用哪种浮层。",
  "Dropdown and context menus side by side.": "下拉菜单与右键菜单并列对比。",
  "Checkbox, radio, switch and segmented control compared.":
    "复选框、单选框、开关与分段控件的对比。",
  "Avatars, galleries and comparison.": "头像、图库与前后对照。",
  "Alerts, progress and the quiet states.": "提示、进度，以及那些安静的状态。",
  "Configure a chart from real data, then copy the code.": "用真实数据配置图表，然后复制代码。",
  "Tune duration, spring, depth and intensity against the real props.":
    "直接对着真实 props 调时长、弹簧、层次与强度。",
  "Palette, type voice, personality, depth and radius — live.":
    "配色、字体声线、视觉人格、层次与圆角，全部实时可调。",
  "Rearrange real Blocks into a page and copy the result.":
    "把真实的 Block 重排成一个页面，再复制结果。",
  "Page sections: a hero, a pricing band, a feed.":
    "用组件拼出的页面区块：首屏、定价带、信息流。",
  "Whole-page starters: personal site, marketing page, product console.":
    "整页起点：个人站点、营销页、产品控制台。",
  "Sixteen working reference products built from the public API.":
    "十六个用公开 API 搭出的可运行参考产品。",
  "The flagship composition: shell, table, chart, inspector, URL state.":
    "旗舰级组合：外壳、表格、图表、检查面板与 URL 状态。",
  "Compositions that solve a whole problem.": "用来解决完整问题的组合。",
  "⌘K over your own pages.": "在你自己的页面上用 ⌘K。",
  "Facets, search and column control.": "分面、搜索与列控制。",
  "A chart with its data view.": "图表与它的数据视图。",
  "The same primitives in three domains.": "同一套基础件在三个领域里的样子。",
  "A master list and its detail pane.": "主列表与它的详情面板。",
  "The frame a product lives in.": "产品所依托的那层外框。",
  "Shell, sidebar and breadcrumbs.": "外壳、侧边栏与面包屑。",
  "Resizable panes and inspectors.": "可调整大小的窗格与检查器。",
  "Typed, shareable state.": "有类型、可分享的状态。",
  "On-this-page navigation.": "本页导航。",
  "How the package is built and consumed.": "这个包如何构建、如何被使用。",
  "Provider widgets behind a LUC contract.": "用 LUC 契约包住的第三方组件。",
  "Advanced, mini and seasonal charts.": "高级图表、迷你图表与季节性图表。",
  "Watchlist and market summaries.": "自选列表与市场概览。",
  "Tape, single ticker and tags.": "滚动行情、单个代码与标签。",
  "Stock, crypto, ETF and forex.": "股票、加密货币、ETF 与外汇。",
  "Market and crypto screeners.": "股票与加密市场的筛选器。",
  "Info, fundamentals and technicals.": "资料、基本面与技术面。",
  "Top stories, calendar and economic map.": "头条、日历与经济地图。",
  "How LUC tokens reach a widget.": "LUC 的设计令牌如何传到组件里。",
  "Whole-page recipes.": "整页配方。",

  /* ---- Phase 10A: the areas, the header and the new groups ---------------- */
  "Docs": "文档",
  "Explore": "浏览",
  "All capabilities": "全部能力",
  "By use case": "按用例",
  "By art direction": "按艺术方向",

  /* Phase 10B.2 — the Visuals library, rebuilt as a visual inventory. */
  "All elements": "全部元素",
  "Tables": "表格",
  "Art library": "素材库",
  "Materials": "材质",
  "Illustrations": "插画",
  "Motifs": "母题",
  "Stickers": "贴纸",
  "Warm Autumn Storybook": "暖秋绘本",
  "Cyberpunk Night": "赛博霓虹之夜",


  /* Phase 10B — the Visuals library group. */
  "Skins": "皮肤",
  "Gallery": "画廊",
  "All experiences": "全部范例",
  "Journal & digital garden": "日志与数字花园",
  "Quantitative analytics": "量化分析",
  "Settings in a sheet": "抽屉中的设置",
  "Table with a date range": "带日期区间的表格",
  "Chart with a date range": "带日期区间的图表",
  "Async validation and submission": "异步校验与提交",
  "Sections and repeating groups": "分组与重复组",
  "Statuses and freshness": "状态与新鲜度",
  "Design lab": "设计实验室",
  "Precision instrument": "精密仪器",
  "Editorial research": "编辑式研究",
  "Focused workspace": "聚焦工作区",

  "Featured work, the two browsing axes, and what is new.":
    "精选内容、两条浏览轴线，以及最新的变化。",
  "Every component, chart, block, studio and guide in one filterable index.":
    "所有组件、图表、区块、工作室与指南，集中在同一个可筛选的索引里。",
  "Sixteen working products built from the public API.": "十六个用公开 API 构建的可运行产品。",
  "A long form kept out of the page it configures.": "把长表单从它所配置的页面里移出去。",
  "A range that filters rows rather than columns.": "用区间筛选行，而不是筛选列。",
  "The same range, driving the x domain instead of a filter.":
    "同一个区间，用来驱动横轴范围，而不是当成筛选条件。",
  "Resizable panes with a real keyboard contract.": "可调整大小的窗格，并有完整的键盘契约。",
  "The lifecycle a form actually has.": "表单真正拥有的生命周期。",
  "Errors where the field is, not in a summary.": "错误出现在字段旁，而不是集中在一处摘要里。",
  "Work that travels, and what the field shows while it does.":
    "必须走一趟服务端的工作，以及它进行时字段该显示什么。",
  "Long forms, addressed as parts.": "长表单，按部分来处理。",
  "Sorting, selection and column control.": "排序、选择与列控制。",
  "Rows that stay cheap at scale.": "数据量再大也保持廉价的渲染。",
  "One number, its unit and its comparison.": "一个数字、它的单位，以及它的对比。",
  "Freshness, availability and issues as separate ideas.": "新鲜度、可用性与问题，三者分开表达。",
  "A month grid with a real keyboard path.": "带真实键盘路径的月历网格。",
  "One date, typed or chosen.": "一个日期，可输入也可以选择。",
  "Two ends, one control.": "两个端点，一个控件。",
  "Segments, not a text field.": "分段输入，而不是一个文本框。",
  "Three treatments of the same observations and the same selection model.":
    "同一批观测数据、同一套选择模型下的三种处理方案。",
  "Calibrated lines and exact feedback put the measurements first.":
    "精确的线与明确的反馈，把测量值放在第一位。",
  "A clear question and a readable finding lead into the evidence.":
    "先提出清楚的问题与可读的结论，再引出证据。",
  "Select an observation to link its row, chart cursor and context.":
    "选中一条观测，把它的行、图表游标与上下文关联起来。",
  "What LUC UI is, what it contains and where to start.": "LUC UI 是什么、包含什么，以及从哪里开始。",
  "Find the right thing by name, use case or art direction.":
    "按名字、用例或艺术方向，找到需要的内容。",
  "Every public component, by the job it does.":
    "每个公开组件，按它承担的工作组织。",
  "The visual layer: typography, geometry, image treatment, infographics, diagrams and publication.":
    "视觉层：字体排印、几何、图像处理、信息图、图解与出版物组件。",
  "The charting surface — time series, distributions, statistics, finance, geospatial and science.":
    "图表体系：时间序列、分布、统计、金融、地理与科学。",
  "Type in motion, surfaces that answer a pointer, spatial depth and presence.":
    "运动中的文字、回应指针的表面、空间深度与存在感。",
  "Page sections, templates, patterns and reference products.":
    "页面区块、模板、模式，以及产品范例。",
  "Workspaces that configure the real components: charts, motion, theme and page composition.":
    "直接配置真实组件的工作室：图表、动效、主题与页面编排。",
  "Installation, foundations, the application frame, form and data guides, provider integrations.":
    "安装、基础、应用外壳、表单与数据指南，以及第三方集成。",
};

/* -------------------------------------------------------------------------- */
/* Long-form page copy.                                                       */
/* -------------------------------------------------------------------------- */

const contentEn: Record<string, string> = {









  "home.personalities.title": "One system, four materials",






















































  /* Spatial motion — the Phase 3 gallery. */
  "spatial.eyebrow": "Motion",
  "spatial.title": "Spatial motion",
  "spatial.lead":
    "Depth as a coordinate system, not a decoration. Six capability families, each one a public @luc/ui export, all driven by the control board below — change the depth, switch the material, freeze the orbit, and watch the page answer.",
  "spatial.board.title": "Control board",
  "spatial.board.lead":
    "One panel drives every tile, so two treatments can be compared under identical settings instead of hunting for per-demo knobs.",
  "spatial.board.intensity":
    "Intensity scopes how loud everything below it may be. Reduced motion still resolves every level to none, and the arrangements stay intact.",
  "spatial.board.reset": "Reset the demo",
  "spatial.control.depth": "Depth",
  "spatial.control.tilt": "Tilt",
  "spatial.control.orbit": "Orbit speed",
  "spatial.control.material": "Glass material",
  "spatial.control.pause": "Freeze the orbit",
  "spatial.control.intensity": "Motion intensity",

  "spatial.a.title": "Surfaces, materials and layered depth",
  "spatial.a.lead":
    "ParallaxScene publishes one pointer offset as custom properties; each ParallaxLayer multiplies it by its own depth. One rAF loop, zero React renders per frame, and the whole scene still composes when nothing moves.",
  "spatial.a.note":
    "Readable content sits at depth 0 and never shifts. The grid and the aurora recede, the workspace card travels with the pointer, and the badge moves against it — the classic foreground read, all from the same two numbers.",
  "spatial.a.badge": "depth -1.4",
  "spatial.a.headline": "Text stays still",
  "spatial.a.body":
    "Moving the layer you read is the fastest way to make a page feel cheap. Depth belongs to decoration.",
  "spatial.a.card1.title": "One rAF loop",
  "spatial.a.card1.body":
    "The scene owns the frame loop and stops it when the pointer leaves and the motion settles.",
  "spatial.a.card2.title": "No per-frame renders",
  "spatial.a.card2.body":
    "Positions travel as inherited custom properties, so layers are ordinary divs.",
  "spatial.a.card3.title": "Flat, but composed",
  "spatial.a.card3.body":
    "Without a pointer every offset resolves to zero and the layers keep their translateZ separation.",

  "spatial.b.title": "Geometric motion",
  "spatial.b.lead":
    "An orbit is a layout: things are arranged on rings, the rings turn, and any seat can be a real control. Rotation runs on the compositor, and every label counter-rotates at the ring's exact period so it stays upright.",
  "spatial.b.label": "Regional revenue, orbiting by ring",
  "spatial.b.note":
    "The outer ring is trackless — a ring without a visible track still arranges its seats, which is how a second tier is built without drawing a circle nobody asked for.",
  "spatial.b.legend.title": "Why it reads as a system",
  "spatial.b.legend.1": "Seats are real buttons: click, Tab and Enter all work, and aria-pressed carries the choice.",
  "spatial.b.legend.2": "A seat is named with its value, so the orbit is fully legible to a screen reader.",
  "spatial.b.legend.3": "Freezing the orbit keeps the arrangement — waiting for a turning chip is not an interaction.",
  "spatial.b.selection": "Select a region on the middle ring; the hub reads the same identity.",

  "spatial.c.title": "Morphing and continuity",
  "spatial.c.lead":
    "ExpandableSurface keeps a compact summary and its expanded detail in one grid cell with one shared layout identity, so the surface grows out of its own rectangle and settles back — in flow, with no portal, no scroll lock and no focus trap.",
  "spatial.c.badge": "ExpandableSurface",
  "spatial.c.hint": "Activate to expand in place",
  "spatial.c.cardTitle": "Q3 review — the compact face",
  "spatial.c.cardBody":
    "Enter or Space expands it. Opening moves focus into the panel; Escape collapses it and returns focus here.",
  "spatial.c.openTitle": "The expanded face",
  "spatial.c.openBody":
    "Same component, same identity, more surface. Nothing here is an entrance animation on top of an exit animation — motion projects the trigger's rectangle onto the panel.",
  "spatial.c.close": "Collapse",
  "spatial.c.metric1": "time to read",
  "spatial.c.metric2": "extra bundle",
  "spatial.c.metric3": "motion chunk",
  "spatial.c.rules.title": "Design rules",
  "spatial.c.rules.1": "In flow, never a modal: a dashboard card that reveals detail should not take the page away.",
  "spatial.c.rules.2": "The trigger stays mounted — it is the focus target we return to and the element that carries aria-expanded.",
  "spatial.c.rules.3": "Reduced motion drops the shared layout rather than slowing it, so the surface simply swaps.",
  "spatial.c.reject":
    "Rejected: a full-screen morphing overlay for this content. It hides the surrounding context that makes the detail meaningful.",

  "spatial.d.title": "Kinetic typography",
  "spatial.d.lead":
    "KineticHeadline animates a change of words with a direction and a reading rhythm. Word granularity, real text nodes, and one accessible string — never a character split across nine spans.",
  "spatial.d.change": "Change the headline",
  "spatial.d.note":
    "The animated layer is aria-hidden; a visually hidden copy carries the text and announces it politely when live is on, so a screen reader hears a sentence rather than a spelling.",
  "spatial.d.contrast": "The same string, static",
  "spatial.d.contrastBody":
    "Read both. The kinetic version must never be harder to read than the plain one — a headline that only works in motion is not a headline.",

  "spatial.e.title": "Depth and spatial navigation",
  "spatial.e.lead":
    "CardStack makes depth the navigation: the active card is largest and closest, the deck behind it recedes on three axes, and stepping moves the whole deck. Arrow keys, Home and End, and a 48px touch drag all work.",
  "spatial.e.label": "CardStack",
  "spatial.e.card1": "Depth is state",
  "spatial.e.card1Body": "The deck answers how much is left without a progress bar.",
  "spatial.e.card2": "Keyboard first",
  "spatial.e.card2Body": "Cards behind the active one are inert, so Tab can never land inside a hidden card.",
  "spatial.e.card3": "Touch, not scroll theft",
  "spatial.e.card3Body": "touch-action: pan-y keeps vertical scrolling native while a horizontal drag steps the deck.",
  "spatial.e.note":
    "CardStackControls is a separate component rather than a controls boolean: it reads the same context and can be placed under the deck, beside it, or in a toolbar. The deck is also the one place the glass material is refused — overlapping translucent surfaces show each other's text.",
  "spatial.e.rules.title": "What it deliberately is not",
  "spatial.e.rules.1": "Not a carousel: there is no track, no autoplay and no slide transition.",
  "spatial.e.rules.2": "Not a modal: the deck stays in the document, so the page keeps its scroll position.",
  "spatial.e.rules.3": "Not pointer-only: every position is reachable from the keyboard and from the controls.",
  "spatial.e.prev": "Previous card",
  "spatial.e.next": "Next card",

  "spatial.f.title": "Interactive data motion",
  "spatial.f.lead":
    "SelectionBeam measures two live DOM nodes and draws a travelling packet between them. Selection, marker and inspector stop being three separate highlights and become one gesture.",
  "spatial.f.listLabel": "Revenue by region",
  "spatial.f.keyboard": "Arrow through the rows — the link follows the selection",
  "spatial.f.inspector": "Inspector",
  "spatial.f.period": "quarter over quarter",
  "spatial.f.inspectorBody":
    "Nothing here is a finance calculation: the beam takes two refs and knows nothing about tables or charts.",
  "spatial.f.beam": "Selection linked to the inspector",
  "spatial.f.note":
    "The overlay is position: fixed, so it needs no positioned ancestor and cannot be clipped by one. Measurement is rAF-coalesced and re-runs on resize and on any scroll, captured at the window so a beam inside a scrolling pane stays attached.",

  "spatial.g.title": "The contract behind all six",
  "spatial.g.lead":
    "Spatial motion is expensive if it is careless. These are the rules these primitives are built to, and the ones a product can rely on.",
  "spatial.g.1.title": "Compositor only",
  "spatial.g.1.body": "Transform and opacity. No animated filters, no per-frame layout reads, no React render per pointer move.",
  "spatial.g.2.title": "Reduced motion keeps the composition",
  "spatial.g.2.body": "Positions, rings and layers still resolve to a deliberate arrangement — the motion stops, the design does not disappear.",
  "spatial.g.3.title": "Nothing decorative carries meaning",
  "spatial.g.3.body": "Every effect layer is aria-hidden and pointer-events-none; state is carried by semantics, colour and text.",

  /* Components overview — the library's front door. */




































  /* ------------------------------------------------- Phase 4 · spatial */
  "foundations.spatial.lead":
    "Depth is a system, not a decoration. One depth scale, four elevation rungs and a single press gesture cover every surface in the library — from a Button to a Dialog to a table row — so a product can change how deep it feels with one attribute, and nothing has to be re-tuned per component.",
  "foundations.spatial.idea.title": "The change, side by side",
  "foundations.spatial.idea.lead":
    "Before V4.0 an interactive surface answered the pointer with Tailwind's own grey shadow — a value the theme could not move — and a fixed one-pixel lift. The spatial language replaces both with tokens: the shadow is a rung of the theme's ladder, and the lift is a distance the personality (and data-space) owns.",
  "foundations.spatial.before": "Before · pre-V4 recipe",
  "foundations.spatial.after": "After · @luc/ui",
  "foundations.spatial.sampleAction": "Run the pipeline",
  "foundations.spatial.beforeNote":
    "A default shadow that never changes between themes, and a hover transform that ignores reduced motion and personality.",
  "foundations.spatial.afterNote":
    "A theme-owned rung, a distance the personality scales, and an instant settle when reduced motion is requested.",
  "foundations.spatial.rungs.title": "Four rungs, one well",
  "foundations.spatial.rungs.lead":
    "A surface names its layer instead of choosing a shadow value. Because the rung is a token, a palette change, a personality change and data-space all move it together — which is what makes the library read as one object.",
  "foundations.spatial.rung.rest.title": "Resting",
  "foundations.spatial.rung.rest.body": "The default state of a card, a control or a row. Quiet by construction.",
  "foundations.spatial.rung.hover.title": "Answered",
  "foundations.spatial.rung.hover.body": "The same surface once a pointer or a keyboard highlight reaches it.",
  "foundations.spatial.rung.float.title": "Floating",
  "foundations.spatial.rung.float.body": "Menus, popovers, tooltips and hover cards — detached from the page.",
  "foundations.spatial.rung.modal.title": "Modal",
  "foundations.spatial.rung.modal.body": "Dialogs, sheets and the command palette: the highest layer in the system.",
  "foundations.spatial.rung.well.title": "Sunken",
  "foundations.spatial.rung.well.body":
    "A surface the content sits inside: text fields, progress tracks, segmented controls, a pressed toggle.",
  "foundations.spatial.depth.title": "One attribute, a whole subtree",
  "foundations.spatial.depth.lead":
    "data-space scales every distance in a subtree without touching a single component: flat for a print view or a dense table, layered by default, deep for a hero or a gallery. Reduced motion keeps the end state and drops the trip.",
  "foundations.spatial.states.title": "States answer in the same language",
  "foundations.spatial.states.lead":
    "Hover rises, press sinks, focus lights, disabled flattens. The same three gestures appear on a Button, a Card, a menu row and a calendar day — which is why a page built from many families still feels like one surface.",
  "foundations.spatial.tokens.title": "What to use",
  "foundations.spatial.tokens.lead":
    "Everything below is public: a consumer can build its own surface with the same rungs, and it will follow the palette, the personality and data-space exactly as the built-in components do.",
  "foundations.spatial.reduced.title": "Reduced motion",
  "foundations.spatial.reduced.lead":
    "The travel is transform-only and one-shot, so the clamp in base.css lands on the end state rather than a half-raised surface.",
  "foundations.spatial.reduced.body":
    "Hover no longer animates a lift, press no longer springs, and the disclosure panels open instantly. Nothing disappears: contrast, focus visibility, layout and every state remain exactly as legible as the animated version, because the animation was never carrying information.",

  /* --------------------------------------------- Phase 4 · components */
  "components.accordion.lead":
    "A section that opens and closes, with the ARIA, the arrow keys and the roving focus handled once. The panel does not pop — it settles, using the same layer rise as the Popover and the Card stack.",
  "components.accordion.when.title": "One section at a time",
  "components.accordion.when.lead":
    "Single mode is the settings pattern: opening one section closes the last, and collapsible lets the reader close everything.",
  "components.accordion.flush.title": "One surface, many sections",
  "components.accordion.flush.lead":
    "Card gives every section its own surface; flush keeps one and separates rows with a hairline, which is what long-form documentation and an FAQ want.",
  "components.accordion.row.title": "A disclosure without an item",
  "components.accordion.row.lead":
    "Collapsible is the same behaviour for one region — no item wrapper, no roving focus, and an aside slot that can hold a control.",


  "components.toggle.pressed.lead":
    "A pressed toggle keeps its surface and takes the inset well, so it reads as a switch that has been pushed rather than a tab that has been selected.",

  "components.toggle.group.lead":
    "Multiple keeps every item independent. Single is a radiogroup — one tab stop, arrow keys, aria-checked — which is a different contract from a sliding segmented control.",
  "components.toggle.multiple": "Any number of options may be on at once (column visibility, overlays, layers).",
  "components.toggle.single": "Exactly one option is on (aggregation, density, mode).",
  "components.toggle.vsSegmented":
    "SegmentedControl is one value with a sliding indicator. ToggleGroup is a set of independent options. They look related and are not interchangeable: a segmented control that allowed two selections would be a lie about the state.",


  "components.toggle.toolbarNote":
    "A toolbar is one tab stop. A screen-reader user should not have to press Tab eleven times to cross a formatting strip.",
  "components.avatar.lead":
    "Identity for a person, a team or an agent. The fallback is designed rather than tolerated, the tint is deterministic so the same name is always the same colour, and the accessible name is one string.",
  "components.avatar.fallback.title": "Initials are the normal case",
  "components.avatar.fallback.lead":
    "The fallback is not a failure state: on a cold cache it is what most readers see. It is rendered immediately when there is no image, and after a short delay when there is one, so a slow network does not flash initials before the picture.",
  "components.avatar.tint":
    "The tint is hashed from the name and picked from six semantic surfaces, so it survives every palette and does not move when a list is re-sorted — which is exactly what a random colour would do.",
  "components.avatar.group.title": "Groups count in the open",
  "components.avatar.group.lead":
    "Overflow is real text (+3), not a hidden badge. Give the group a total when the children are paginated.",
  "components.avatar.list.title": "In a list",
  "components.avatar.list.lead":
    "The same avatar in a table row, a header and a comment thread, with a read-only Rating beside it — a score that cannot be changed is data, so it is announced as an image rather than a control.",
  "components.avatar.rating.title": "Rating is a radiogroup",
  "components.avatar.rating.lead":
    "One tab stop, arrow keys to change the value, Home and End for the ends. Chosen again, the value clears.",
  "components.alertDialog.lead":
    "Confirmation for an action that cannot be undone. It is not a Dialog with a flag — it is a different contract, with the safe answer in the first focus position and no way to dismiss it by clicking the scrim.",
  "components.alertDialog.default.title": "A decision, not a page",
  "components.alertDialog.default.lead":
    "Two shapes: a destructive confirm that defaults to danger, and an important-but-reversible confirm that takes the primary button. Escape still closes; a stray click does not.",
  "components.alertDialog.form.title": "When the confirmation needs input",
  "components.alertDialog.form.lead":
    "A field inside the dialog is fine — it is still one decision, and the action button carries the verb.",
  "components.alertDialog.rules.title": "When to use it",
  "components.alertDialog.rules.lead":
    "The test is reversibility. If the action can be undone in place, use a button and a toast instead; the dialog is for the case where there is nothing to undo.",
  "components.timeline.lead":
    "A dated sequence and a progress stepper. Both are ordered lists, because a sequence has an order and a screen reader should be told so. Timeline owns the rail and the rhythm; you own the content.",
  "components.timeline.run.title": "A pipeline run",
  "components.timeline.run.lead":
    "Changelogs, activity feeds, job runs and agent traces share one shape: a marker, a title, a supporting line and a right-aligned time or duration. The rail stops at the last item instead of running past it.",
  "components.timeline.stepper.title": "Progress through a known sequence",
  "components.timeline.stepper.lead":
    "Completed and current steps are buttons; a future step is static text, so nobody jumps into a step whose prerequisites are not met.",
  "components.timeline.stepperNote": "Only steps at or before the current one are reachable.",
  "components.carousel.lead":
    "A horizontal rail of items, built on the platform's own scroll-snap engine — so momentum, touch, trackpad gestures and RTL come for free — plus the two things it does not have: controls and a keyboard contract.",
  "components.carousel.rail.title": "A real rail",
  "components.carousel.rail.lead":
    "The track is a labelled region with a tab stop, so a keyboard user can arrow-scroll it. Dots are a tablist, arrows disable at the ends, and the live region announces the current slide only when it changes.",
  "components.carousel.manual.title": "Autoplay, when it is on",
  "components.carousel.manual.lead":
    "Autoplay is opt-in, pauses on hover and focus, stops while the tab is hidden, and never starts at all under prefers-reduced-motion.",
  "components.carousel.autoplayNote": "advanced automatically",
  "components.carousel.aspect.title": "AspectRatio",
  "components.carousel.aspect.lead":
    "Space is reserved before the media loads, so a card grid never shifts under a slow image. Use a preset, or pass any number.",
  "components.carousel.usePreset": "Copy the preset",
  "components.fieldParts.lead":
    "Field is where LUC decides label semantics: it generates the control's id and wires the description, the pending check and the message to it. The rest of the page is the parts a form is assembled from — one field shell with addons, a standalone label for third-party controls, the platform's own picker, and the keyboard hints that make a shortcut discoverable.",
  "components.fieldParts.group.title": "One shell, many addons",
  "components.fieldParts.group.lead":
    "InputGroup is the same shell every other text control uses, exposed as composition: a prefix, a separator, a suffix, an icon — with the focus ring, the invalid state and the sunk surface already correct.",
  "components.fieldParts.label.title": "Labels and keycaps",
  "components.fieldParts.label.lead":
    "Label exists for the control LUC does not own, and its required asterisk is aria-hidden so the name is not read twice. KbdGroup joins a shortcut into one announced chord.",
  "components.fieldParts.labelNote":
    "A Field already renders the label for a LUC control. Use Label for a third-party or composite widget, where you assemble the ARIA yourself.",
  "components.fieldParts.native.title": "When native is better",
  "components.fieldParts.native.lead":
    "Select is right nine times out of ten. The tenth is a mobile form, where the platform picker is a wheel the user already knows and the custom popup is worse than either.",
  "components.fieldParts.hover.title": "HoverCard is not a Tooltip",
  "components.fieldParts.hover.lead":
    "A tooltip labels a control; a HoverCard previews something with content and actions, and follows focus as well as the pointer.",
  "components.fieldParts.hoverNote":
    "Never the only way to reach the content: the trigger is focusable and the same information belongs on the page it previews.",

  /* ------------------------------------------------ Phase 4 · charts */
  "charts.catalog.lead":
    "Every chart LUC UI can draw, with an honest status. Public means a typed component exists in @luc/ui/charts today; engine means the renderer supports it but LUC has not wrapped it; planned and blocked are not shipped, and the reason is stated. No aliases and no cosmetic variants are counted as distinct types.",
  "charts.catalog.status.title": "How to read this",
  "charts.catalog.status.lead":
    "Four statuses, and the counts below are the current truth rather than a target.",
  "charts.catalog.status.public.note": "A public component with types, tests and a Showcase example.",
  "charts.catalog.status.engine.note": "The engine can draw it; LUC has not wrapped it yet.",
  "charts.catalog.status.planned.note": "Agreed as valuable, not started. The note says what blocks it.",
  "charts.catalog.status.blocked.note": "Needs a dependency or data LUC deliberately does not ship.",









  "charts.catalog.variants.title": "Variants, not types",
  "charts.catalog.variants.lead":
    "Deliberately excluded from the count above: these reuse a renderer with different semantics, and counting them as separate plot types would inflate the catalogue without adding a capability.",
  "charts.catalog.variants.badge": "Variant",
  "charts.catalog.status.public.symbols": "Naming {count} distinct public components",
  "charts.catalog.rules.title": "Two rules that never bend",
  "charts.catalog.rules.lead":
    "They are what separates this catalogue from a gallery of pictures.",
  "charts.catalog.rules.body":
    "First: the library renders, it does not estimate. No chart in this list bins, smooths, fits, differences or optimises — every value arrives prepared, and a transform that is unavoidable (a log axis, a streamgraph's own layout) is a display mapping that is named in the contract. Second: no alias is a type. Two components count as two chart types only when a reader would use them for different questions.",
  "charts.statistical.lead":
    "Distributions, agreement and uncertainty. Every value here is prepared by the caller: the library draws the ECDF it is given, the quantiles it is given and the interval it is given, because that keeps a number in a chart answerable to exactly one place.",
  "charts.statistical.how.title": "Compare two samples",
  "charts.statistical.how.lead":
    "The empirical CDF and the Q–Q plot answer different questions about the same pair. The CDF shows where one sample sits relative to the other; the Q–Q plot shows where the shape stops agreeing, which is usually the tails.",
  "charts.statistical.ecdf": "240 synthetic sessions per sample. Drawn as a step — interpolating between order statistics invents mass the sample does not have.",
  "charts.statistical.qq": "Sample quantiles against normal quantiles. Departure from the 45° line is the finding.",
  "charts.statistical.shape.title": "Shape, spread and uncertainty",
  "charts.statistical.shape.lead":
    "A violin is a density outline the caller computed, an error bar is an interval the caller supplied, and a residual plot is the model's own leftovers. None of them fit anything.",
  "charts.statistical.violin": "Three prepared density outlines with a supplied median marker.",
  "charts.statistical.intervals": "Point estimates with supplied intervals. The interval drawn is exactly the interval given.",
  "charts.statistical.residual": "Residual against fitted value, with the zero line a well-behaved model sits around.",
  "charts.statistical.classifier.title": "Classifiers",
  "charts.statistical.classifier.lead":
    "ROC, calibration and the confusion matrix are the three views of one classifier. The AUC is printed from the caller's number rather than integrated here, and the matrix can normalise per row so a large class cannot dominate a small one.",
  "charts.statistical.roc": "Two curves with their supplied AUC. The diagonal is chance, not a score.",
  "charts.statistical.calibration": "Observed frequency against predicted probability. Bubble area is the bin count, so a sparse bin cannot masquerade as a strong one.",
  "charts.statistical.confusion": "Row-normalised, so a 900-sample class and a 40-sample class are comparable.",
  "charts.scientific.lead":
    "Shapes a business chart cannot express: a phase portrait, a field of arrows, a spectrogram, a ternary composition. All of them take prepared data, and the one transform that is unavoidable — a streamgraph's layout — is the engine's and is named in the contract.",
  "charts.scientific.many.title": "More than three dimensions",
  "charts.scientific.many.lead":
    "Parallel coordinates stay readable where a scatterplot matrix stops being: every axis is independent, so an observation is a polyline through its own values, and a crossing is a real trade-off.",
  "charts.scientific.parallel": "Sixty synthetic strategies across six axes. Invert an axis when lower is better.",
  "charts.scientific.geometry.title": "Geometry",
  "charts.scientific.geometry.lead":
    "Ternary compositions, polar histograms and vector fields. Each one states its coordinate convention, and the tooltip prints the value the caller supplied rather than a re-derived one.",
  "charts.scientific.ternary": "Three shares that sum to one. A point whose shares do not sum to one is drawn at its normalised position, and the tooltip reports the shares it was given.",
  "charts.scientific.rose": "Nightingale rose: the radius is the measurement, the angle is only the category.",
  "charts.scientific.wind": "A stacked polar histogram — a wind rose for speed bins per direction.",
  "charts.scientific.vector": "An arrow per sample, at the magnitude supplied. Scale is the caller's explicit choice and is reported in the tooltip.",
  "charts.scientific.density.title": "Density and spectra",
  "charts.scientific.density.lead":
    "Contours, hexbins and spectrograms all answer 'where is the mass'. The rings, the bins and the samples are computed upstream; LUC owns the geometry, the ramp and the tooltip.",
  "charts.scientific.contour": "Iso-lines of a sampled saddle. The level is drawn on the line, so two adjacent contours are distinguishable without a legend.",
  "charts.scientific.hexbin": "Pre-binned hexagons at a radius in data units, so the geometry matches the bin at any zoom.",
  "charts.scientific.spectrogram": "Time against frequency with a fixed decibel range, so two spectrograms are comparable. Progressive rendering keeps a long capture responsive.",
  "charts.scientific.flow.title": "Flow and many distributions",
  "charts.scientific.flow.lead":
    "A theme river shows composition over time as one shape; a ridgeline stacks many distributions along one axis. The vertical offset is a drawing transform, never a value change — which is why it is capped.",
  "charts.scientific.river": "The band layout is the engine's, because it places the caller's numbers rather than deriving them.",
  "charts.scientific.ridgeline": "Overlap is capped at 1 so one row can never fully hide the one beneath it.",
  "charts.workflow.lead":
    "The shapes an operations product reaches for: which task ran when, how two periods compare, what moved and by how much. None of them infers a state — every one shows a supplied number at a supplied position.",
  "charts.workflow.schedule.title": "Schedule",
  "charts.workflow.schedule.lead":
    "One row per task on a real time axis, drawn top-to-bottom in the order given. Progress is an inner bar rather than a second series, which is what keeps a two-hundred-task plan legible.",
  "charts.workflow.gantt": "Five stages of the daily pipeline, with the current task partially complete.",
  "charts.workflow.compare.title": "Compare",
  "charts.workflow.compare.lead":
    "A dumbbell measures a quantity at two moments; a slope chart measures a rank or an index, so its lines are free to cross and the crossing is the message.",
  "charts.workflow.dumbbell": "Start and end per metric, with the change drawn as the connector.",
  "charts.workflow.slope": "Weight change between two reviews. The value axis is shared, so a crossing is genuine.",
  "charts.workflow.bullet": "A measured value, a target and the qualitative bands between them.",
  "charts.workflow.lollipop": "A bar reduced to a stem and a head, for a long ranked list.",
  "charts.workflow.rank.title": "Rank and weight",
  "charts.workflow.rank.lead":
    "A bump chart inverts its axis so rank 1 is at the top, and a null is a genuine gap that breaks the line rather than an interpolated position. A Mekko makes the column width the group size, which is the honest version of a stacked bar.",
  "charts.workflow.bump": "Six quarters of factor ranks. Size is missing in Q4 and the line breaks instead of guessing.",
  "charts.workflow.mekko": "Channel mix where the width is the channel's size, so a small share inside a big column is visibly not the same fact as a small share inside a tiny one.",
  "charts.quantitative.lead":
    "Presentation only. Not one metric on this page is computed by the library: the drawdown is supplied, the implied volatility is supplied, the frontier is supplied, and the factor loadings are supplied. That is what keeps a number in a chart answerable to the analysis layer that owns a data version.",
  "charts.quantitative.price.title": "Price",
  "charts.quantitative.price.lead":
    "This is the ECharts rendition of a candle chart, beside the interactive Lightweight Charts one in @luc/ui/financial-chart. Two engines, two jobs: this one composes inside a grid, a dashboard or a print view.",
  "charts.quantitative.candles": "Synthetic daily candles with two prepared moving averages. The gain/loss pair is the theme's own, so a candle can never disagree with a delta cell.",
  "charts.quantitative.drawdown": "Supplied drawdown, anchored at zero, with no headroom above it — a percentage gain in an underwater chart is a number that does not exist.",
  "charts.quantitative.surface.title": "Curves and surfaces",
  "charts.quantitative.surface.lead":
    "A volatility smile is drawn from the quotes it is given; nothing is interpolated between strikes. A true 3D volatility surface needs echarts-gl, which remains outside the base entry point.",
  "charts.quantitative.smile": "Four expiries, thirteen strikes each, already in percent. A missing strike is simply fewer points.",
  "charts.quantitative.portfolio.title": "Portfolio",
  "charts.quantitative.portfolio.lead":
    "The efficient frontier is supplied as ordered points, so the caller states the constraints it used. The current portfolio is a marker rather than a second chart, which makes 'where am I relative to the frontier' a glance.",
  "charts.quantitative.frontier": "Six assets against a supplied frontier with the current portfolio marked.",
  "charts.quantitative.factors": "Zero-centred, coloured by sign, because an exposure is a signed quantity.",
  "charts.quantitative.pnl": "Signed contributions per month. A losing factor subtracts from the column instead of being stacked on top of the winners.",
  "charts.multidimensional.lead":
    "The three families here need something outside the rows — a shared scale, a parent/child relation, or a map — so each one states exactly what the caller must supply and refuses to guess.",
  "charts.multidimensional.matrix.title": "Pairwise relationships",
  "charts.multidimensional.matrix.lead":
    "A scatterplot matrix is n × (n − 1) grids: the diagonal is left out because a variable against itself carries no information, and a diagonal of histograms would double the render cost for a decoration.",
  "charts.multidimensional.splom": "Four measures, twelve cells, shared axes per row and column so a correlation reads as a slope. Past six variables, use parallel coordinates.",
  "charts.multidimensional.tree.title": "Hierarchy",
  "charts.multidimensional.tree.lead":
    "A dendrogram, a file tree or an org chart. The engine supplies the layout and the collapse interaction — geometry, not statistics — and LUC supplies the label model and the tone contract.",
  "charts.multidimensional.tree": "Leaves take their colour from their own tone, so the same shape can serve an editing tree and a JSON inspector.",
  "charts.multidimensional.geo.title": "Geography",
  "charts.multidimensional.geo.lead":
    "LUC ships no map data: a boundary file is large, it carries a licence, and bundling one would impose a particular political boundary set on every consumer. Registration is therefore the caller's explicit step.",
  "charts.multidimensional.geo.registered": "Registered by this page from a synthetic grid, which proves the mechanism without shipping a boundary set.",
  "charts.multidimensional.geo.rules.title": "How to use it",
  "charts.multidimensional.geo.rules.body":
    "Register once, before the first render, then scatter. A choropleth additionally needs a value per region, which is a different contract — see the roadmap below.",
  "charts.multidimensional.geo.blocked":
    "Blocked: a choropleth needs region data plus a registered map, and a 3D surface needs echarts-gl (~180 KB). Neither is in the base entry point, and neither will be bundled by default.",

  "components.board.lead":
    "Reordering without a drag library: the pointer uses the platform's own drag protocol and the keyboard uses pick up, move, drop, narrated through a polite live region.",
  "components.board.list.title": "Sortable list",
  "components.board.list.lead":
    "The order on the left is the array read back on the right: `onReorder` receives the complete order rather than a delta, so a caller never has to replay the move itself.",
  "components.board.list.label": "Pipeline step order",
  "components.board.list.order": "Current order",
  "components.board.list.hint": "Drag the handle with a pointer, or press Space to pick up, the arrow keys to move, Space to drop and Escape to cancel.",
  "components.board.kanban.title": "Kanban board",
  "components.board.kanban.lead": "A board is a two-axis sortable: Up/Down reorders inside a column and Left/Right carries the card into the neighbouring column at the same depth.",
  "components.board.kanban.label": "Roadmap board",
  "components.board.api.title": "Public API",
  "components.board.api.lead": "Both components are controlled: they report the intent and the application decides how the model changes.",
  "components.board.api.items": "List items: an id, a label and optional description and disabled.",
  "components.board.api.reorder": "The complete id order after the move.",
  "components.board.api.columns": "Columns and cards; each column has an id, a title and its cards.",
  "components.board.api.move": "One move's intent: the card id, the source column, the destination column and the destination index.",
  "components.board.api.note":
    "Dragging uses only native browser events, the keyboard uses `aria-pressed` plus a live announcement, and neither needs an extra dependency.",

  "components.media.lead": "Three components about pictures: the gallery is the index, the lightbox is one item, and the compare slider is the difference between two.",
  "components.media.gallery.title": "Gallery",
  "components.media.gallery.lead":
    "A grid of thumbnails is an index; every image carries an `alt`, because a set of unlabelled pictures is a blank page to a screen reader.",
  "components.media.gallery.label": "Research figures",
  "components.media.lightbox.title": "Lightbox",
  "components.media.lightbox.lead":
    "The viewer is built on the shared Dialog, so focus trapping, Escape, scroll locking and focus restore all come from the same place; the arrow keys walk the set and + / − zoom.",
  "components.media.lightbox.open": "Open the viewer",
  "components.media.lightbox.hint": "Arrow keys walk the set, + and − zoom, Escape closes.",
  "components.media.lightbox.label": "Image viewer",
  "components.media.compare.title": "Before and after",
  "components.media.compare.lead":
    "The wipe is a real `range` input rather than custom pointer handling, which is why keyboard stepping, click-to-position and the accessible name all come from the platform.",
  "components.media.compare.label": "Before and after processing",
  "components.media.api.title": "Public API",
  "components.media.api.lead": "All three render; none of them decodes, resizes, caches or uploads.",
  "components.media.api.alt": "Required on every image — a gallery without labels is unusable.",
  "components.media.api.columns": "Grid column preset.",
  "components.media.api.lightbox": "Whether the built-in viewer opens on activation; turn it off to handle `onOpen` yourself.",
  "components.media.api.value": "0–100, the share of the frame given to the “before” image.",
  "components.media.api.pair": "The `src` and `alt` of each of the two images.",

  "components.ai.lead":
    "A provider-neutral set of AI surfaces — messages, streaming text, tool calls and agent state — with no model, no transport and no vendor SDK.",
  "components.ai.thread.title": "A conversation",
  "components.ai.thread.lead":
    "`MessageList` is a `role=\"log\"` region that follows new content only while the reader is already at the bottom — scrolling up to re-read an answer is never yanked back down by a new token.",
  "components.ai.thread.label": "Conversation",
  "components.ai.thread.question": "Summarise BTCUSD's recent volatility and tell me whether the term structure is still upward sloping.",
  "components.ai.thread.errorAuthor": "System",
  "components.ai.thread.error": "The second tool call returned nothing. Retry it, or narrow the query.",
  "components.ai.thread.replay": "Replay",
  "components.ai.thread.replayHint": "The demo text is written out by a timer; no request is made.",
  "components.ai.tools.label": "Tool calls in this turn",
  "components.ai.agent.title": "Agent state",
  "components.ai.agent.lead":
    "`AgentActivity` renders the steps the application declares. It has no “show reasoning” affordance because there is nothing to reveal: the only text it can display is text its caller passed in.",
  "components.ai.agent.running": "Analysing",
  "components.ai.agent.compact": "Compact mode",
  "components.ai.agent.s1": "Read the brief",
  "components.ai.agent.s2": "Fetch metrics",
  "components.ai.agent.s2d": "12 of 40 symbols",
  "components.ai.agent.s3": "Write the conclusion",
  "components.ai.agent.s4": "Deliver",
  "components.ai.composer.title": "Composer",
  "components.ai.composer.lead":
    "Enter sends and Shift + Enter adds a line; while a response is in flight the send button becomes a stop button, and the toolbar slot is left for model pickers and attachments.",
  "components.ai.composer.label": "Prompt",
  "components.ai.composer.placeholder": "Ask anything…",
  "components.ai.composer.hint": "Enter sends, Shift + Enter adds a line",
  "components.ai.composer.send": "Send prompt",
  "components.ai.composer.model": "Model: local demo",
  "components.ai.api.title": "Public API",
  "components.ai.api.lead": "The prop set stays small on purpose: composition points matter more than boolean switches.",
  "components.ai.api.from":
    "Who the turn came from. Deliberately not called `role`: on a component that renders a DOM element, `role` collides with the ARIA attribute and makes every consumer with `eslint-plugin-jsx-a11y` report a false error.",
  "components.ai.api.status": "The render state of the turn; `error` also changes the border and surface.",
  "components.ai.api.speed": "Characters per second; under `prefers-reduced-motion` the whole string appears at once.",
  "components.ai.api.submit": "Receives the trimmed text on submit; the component then clears the field.",
  "components.ai.api.calls": "Tool records: name, status, input, result and duration, all supplied by the caller.",
  "components.ai.api.note":
    "`StreamingText` always renders a single text node: a screen reader reads the sentence once instead of spelling it out.",




































  "charts.diagnostics.lead":
    "The figures that answer “is this model or process sane?”. As with every family: LUC renders, it does not estimate.",
  "charts.diagnostics.time.title": "Time-series diagnostics",
  "charts.diagnostics.time.lead":
    "The lag correlations are computed by the caller and the significance band is drawn at the half-width the caller supplied — no sample size, no band.",
  "charts.diagnostics.acf": "Autocorrelation and partial autocorrelation over one axis; both series draw a stem from zero.",
  "charts.diagnostics.pacf": "The partial autocorrelation alone, for reading against the panel on the left.",
  "charts.diagnostics.survival.title": "Survival and risk",
  "charts.diagnostics.survival.lead":
    "The step is mandatory: survival is constant between events, so interpolating between two estimates would invent a risk the sample does not have.",
  "charts.diagnostics.survival.note": "Censoring marks are supplied points, never inferred from the data.",
  "charts.diagnostics.ranking.title": "Ranking and model quality",
  "charts.diagnostics.ranking.lead":
    "Two machine-learning diagnostics: one measures ranking quality, the other measures each feature's direction and uncertainty.",
  "charts.diagnostics.pr": "Recall on x, precision on y; the dashed line is the caller's no-skill prevalence.",
  "charts.diagnostics.importance": "Ranked horizontal bars; `signed` colours by coefficient direction, and the intervals are the caller's too.",
  "charts.diagnostics.rule.title": "Scientific correctness",
  "charts.diagnostics.rule.lead": "These charts will not do the statistics on your behalf.",
  "charts.diagnostics.rule.body":
    "Lag correlations, survival estimates, precision and recall, feature importances and their intervals are all drawn exactly as supplied. Binning, fitting, resampling and correction happen where the data lives, which is what stops the picture and the report from disagreeing.",

  "charts.networks.lead":
    "Two network and hierarchy figures. Each does the one thing the engine cannot: it computes a layout from numbers the caller already owns.",
  "charts.networks.chord.title": "Chord diagram",
  "charts.networks.chord.lead":
    "Arc length is the outgoing plus incoming total; the first part of each arc is what the group sends and the rest is what it receives. The matrix must be square, and the caller's row and column order is preserved exactly.",
  "charts.networks.chord.note": "Cross-holdings between five asset classes, straight from the supplied matrix.",
  "charts.networks.dendrogram.title": "Dendrogram",
  "charts.networks.dendrogram.lead":
    "LUC draws the tree, it does not cluster: `merges` is the linkage the caller computed — the two children and the join height — so the picture cannot disagree with the analysis.",
  "charts.networks.dendrogram.note": "Six factors, hierarchically clustered; branch height is the supplied join height.",
  "charts.networks.rule.title": "Scientific correctness",
  "charts.networks.rule.lead": "A layout is geometry, not statistics.",
  "charts.networks.rule.body":
    "The chord layout turns a matrix into angles and the dendrogram turns merges into coordinates. Both are pure functions, both are exported on their own, and both can be tested without a browser — or reused by a caller that wants its own rendering.",

  "charts.geospatial.lead":
    "Two geographic figures. LUC ships no boundary data: the map name is registered by the caller, and a region without a value is drawn as no-data rather than as zero.",
  "charts.geospatial.choropleth.title": "Choropleth",
  "charts.geospatial.choropleth.lead":
    "Pass the name of a registered map plus a value per region; a `null` value means no data and takes its own colour.",
  "charts.geospatial.choropleth.note": "The map registered by this page is a synthetic grid, which proves the contract without shipping a boundary set.",
  "charts.geospatial.choropleth.value": "Measure",
  "charts.geospatial.choropleth.loading": "Registering the sample map…",
  "charts.geospatial.routes.title": "Trajectories",
  "charts.geospatial.routes.lead":
    "Routes arrive as longitude/latitude polylines, and a leg that crosses ±180° is unwrapped so 179°E to 179°W is a short hop rather than a line across the whole chart.",
  "charts.geospatial.routes.note":
    "The second route crosses the date line and is drawn unwrapped — the tooltip still reports the longitude the caller supplied.",
  "charts.geospatial.policy.title": "Map policy",
  "charts.geospatial.policy.lead": "Boundary data is the caller's decision.",
  "charts.geospatial.policy.body":
    "A world or country boundary file is large, carries a licence, and bundling one would choose a political boundary set on every consumer's behalf. `registerEChartsMap` is therefore an explicit, once-only call, and the projection and simplification stay on the caller's side.",

  "charts.surfaces.lead":
    "A true 3D surface with no 3D engine: rotate, project orthographically, sort by depth and paint back to front, all inside the same ChartSurface shell as every other chart.",
  "charts.surfaces.view.title": "A surface you can turn",
  "charts.surfaces.view.lead":
    "The pointer can drag it, the arrow keys rotate it (Shift with the arrows changes elevation), and both angles are fully controllable.",
  "charts.surfaces.view.azimuth": "Azimuth",
  "charts.surfaces.view.elevation": "Elevation",
  "charts.surfaces.wire.title": "Wireframe and volatility",
  "charts.surfaces.wire.lead": "Two readings of one grid: the wireframe shows the shape, the surface shows the values.",
  "charts.surfaces.wire.note": "Mesh lines only, which makes the topology easy to read.",
  "charts.surfaces.vol.note":
    "Implied volatilities arrive as a grid: interpolating a surface out of quotes is modelling, and a component library should not hide the model.",
  "charts.surfaces.rule.title": "Why not echarts-gl",
  "charts.surfaces.rule.lead": "The dependency cost was measured.",
  "charts.surfaces.rule.body":
    "echarts-gl is a substantial WebGL dependency that would add a second renderer and a GPU context to every consumer of `@luc/ui/charts`. A gridded surface is already a solved two-dimensional problem, so it is replaced here with about 120 lines of arithmetic: no renderer, no GPU context, deterministic output, and the same shell as every other chart (tooltip, export, reduced motion, aria). A missing cell is a hole in the surface, not a zero.",
};

const contentZh: Record<string, string> = {









  "home.personalities.title": "一套系统，四种材质",






















































  /* 空间动效 —— Phase 3 画廊。 */
  "spatial.eyebrow": "动效",
  "spatial.title": "空间动效",
  "spatial.lead":
    "把「深度」当作一套坐标系，而不是装饰。六个能力族各对应一个公开的 @luc/ui 导出，全部由下方控制面板驱动：调整深度、切换材质、冻结轨道，页面会立刻给出回应。",
  "spatial.board.title": "控制面板",
  "spatial.board.lead":
    "一个面板驱动所有展台，因此可以在完全相同的参数下对比两种处理方式，而不必逐个去找示例自己的旋钮。",
  "spatial.board.intensity":
    "强度决定其下方所有效果的“音量上限”。减少动态仍然会把每个档位解析为 none，而构图本身保持不变。",
  "spatial.board.reset": "重置演示",
  "spatial.control.depth": "深度",
  "spatial.control.tilt": "倾斜",
  "spatial.control.orbit": "轨道速度",
  "spatial.control.material": "玻璃材质",
  "spatial.control.pause": "冻结轨道",
  "spatial.control.intensity": "动效强度",

  "spatial.a.title": "表面、材质与分层深度",
  "spatial.a.lead":
    "ParallaxScene 把一个指针偏移量发布为自定义属性，每个 ParallaxLayer 再乘以自己的深度。整个场景只有一个 rAF 循环、每帧零次 React 渲染，静止时构图依旧成立。",
  "spatial.a.note":
    "需要阅读的内容放在 depth 0，永不位移。网格与极光后退，工作区卡片随指针移动，徽标逆向移动——经典的“前景反向”读法，全部来自同样的两个数字。",
  "spatial.a.badge": "深度 -1.4",
  "spatial.a.headline": "文字保持不动",
  "spatial.a.body": "让用户正在读的图层跟着指针移动，是最快让页面显得廉价的方式。深度属于装饰。",
  "spatial.a.card1.title": "只有一个 rAF 循环",
  "spatial.a.card1.body": "帧循环由场景持有，指针离开且运动收敛后会自动停止。",
  "spatial.a.card2.title": "逐帧零渲染",
  "spatial.a.card2.body": "位置以可继承的自定义属性传递，因此每个图层都只是普通 div。",
  "spatial.a.card3.title": "静止但仍有层次",
  "spatial.a.card3.body": "没有指针时所有偏移解析为 0，而 translateZ 带来的层间分离依然存在。",

  "spatial.b.title": "几何动效",
  "spatial.b.lead":
    "轨道本身是一种布局：元素排列在环上，环在旋转，而每个座位都可以是真实控件。旋转跑在合成线程上，每个标签以完全相同的周期反向旋转，因此始终水平可读。",
  "spatial.b.label": "按环排列的区域营收",
  "spatial.b.note":
    "外圈是无轨道的——看不到描边的环依然在安排座位，这就是“第二层级”的实现方式：不必画一个没人要求的圆。",
  "spatial.b.legend.title": "为什么它像一套系统",
  "spatial.b.legend.1": "座位就是真实按钮：点击、Tab 与 Enter 都可用，选择状态由 aria-pressed 承载。",
  "spatial.b.legend.2": "座位的可访问名称包含数值，因此轨道对屏幕阅读器完全可读。",
  "spatial.b.legend.3": "冻结轨道会保留构图——等一个旋转中的标签停下来不算交互。",
  "spatial.b.selection": "在中环上选择一个区域，中心枢纽会读取同一个身份。",

  "spatial.c.title": "形变与连续性",
  "spatial.c.lead":
    "ExpandableSurface 让紧凑摘要与展开详情共用一个网格单元和同一个布局身份，于是表面从自己的矩形里长出来、再收缩回去——始终在文档流中，没有 portal、没有滚动锁定、没有焦点陷阱。",
  "spatial.c.badge": "ExpandableSurface",
  "spatial.c.hint": "激活可在原地展开",
  "spatial.c.cardTitle": "Q3 复盘——紧凑面",
  "spatial.c.cardBody":
    "按 Enter 或空格展开。展开时焦点进入面板；按 Escape 收起并把焦点还给这里。",
  "spatial.c.openTitle": "展开面",
  "spatial.c.openBody":
    "同一个组件、同一个身份，只是更多表面。这里没有“入场动画叠在出场动画之上”——Motion 把触发元素的矩形投影到面板上。",
  "spatial.c.close": "收起",
  "spatial.c.metric1": "阅读耗时",
  "spatial.c.metric2": "额外包体积",
  "spatial.c.metric3": "动效分块",
  "spatial.c.rules.title": "设计规则",
  "spatial.c.rules.1": "在文档流里，而不是模态：一块展开细节的仪表盘卡片不该把整页拿走。",
  "spatial.c.rules.2": "触发元素保持挂载——它既是我们归还焦点的目标，也是承载 aria-expanded 的元素。",
  "spatial.c.rules.3": "减少动态时直接去掉共享布局，而不是放慢它，表面只是瞬时切换。",
  "spatial.c.reject": "已否决：为这段内容使用全屏形变浮层。它会隐藏真正让细节有意义的上下文。",

  "spatial.d.title": "动态排版",
  "spatial.d.lead":
    "KineticHeadline 让文字变化带有方向与阅读节奏。以词为单位、使用真实文本节点，并且只给屏幕阅读器一个字符串——绝不会把一段话拆成九个 span 逐字拼读。",
  "spatial.d.change": "切换标题",
  "spatial.d.note":
    "参与动画的图层是 aria-hidden；真正承载文本的是视觉隐藏的副本，开启 live 时会礼貌播报，所以屏幕阅读器听到的是一句话，而不是一次拼写。",
  "spatial.d.contrast": "同一句话，静态版本",
  "spatial.d.contrastBody":
    "请把两者都读一遍。动态版本绝不能比静态版本更难读——只有在动效里才成立的标题不算标题。",

  "spatial.e.title": "深度与空间导航",
  "spatial.e.lead":
    "CardStack 把深度本身变成导航：当前卡片最大、最近，其后的卡组沿三个轴向后退，翻页移动的是整副牌。方向键、Home / End 与 48px 触摸拖拽都可用。",
  "spatial.e.label": "CardStack",
  "spatial.e.card1": "深度即状态",
  "spatial.e.card1Body": "不需要进度条，卡组本身就回答了“还剩多少”。",
  "spatial.e.card2": "键盘优先",
  "spatial.e.card2Body": "当前卡片之后的层是 inert，Tab 永远不会落进看不见的卡片里。",
  "spatial.e.card3": "触摸但不抢滚动",
  "spatial.e.card3Body": "touch-action: pan-y 保留原生纵向滚动，横向拖拽才用于翻页。",
  "spatial.e.note":
    "CardStackControls 是独立组件而不是 controls 布尔属性：它读取同一份上下文，可以放在卡组下方、旁边或工具栏里。卡组也是唯一拒绝玻璃材质的地方——互相重叠的半透明表面会透出彼此的正文。",
  "spatial.e.rules.title": "它刻意不是什么",
  "spatial.e.rules.1": "不是轮播：没有轨道、没有自动播放、没有滑动切换。",
  "spatial.e.rules.2": "不是模态：卡组留在文档中，因此页面保持滚动位置。",
  "spatial.e.rules.3": "不只支持指针：每个位置都能通过键盘和控件到达。",
  "spatial.e.prev": "上一张",
  "spatial.e.next": "下一张",

  "spatial.f.title": "交互式数据动效",
  "spatial.f.lead":
    "SelectionBeam 测量两个真实 DOM 节点，并在它们之间绘制一条流动的光束。选择、标记与检查面板不再是三个互不相关的强调态，而成为同一个手势。",
  "spatial.f.listLabel": "各区域营收",
  "spatial.f.keyboard": "用方向键浏览各行，连接会跟随选择",
  "spatial.f.inspector": "检查面板",
  "spatial.f.period": "环比",
  "spatial.f.inspectorBody": "这里没有任何金融计算：光束只接收两个 ref，完全不知道表格或图表的存在。",
  "spatial.f.beam": "选择与检查面板之间的连线",
  "spatial.f.note":
    "浮层使用 position: fixed，因此不需要定位祖先，也不会被祖先裁剪。测量经 rAF 合并，并在 resize 与任意滚动时重算（滚动在 window 上捕获），所以滚动容器内的光束也能保持附着。",

  "spatial.g.title": "六个能力族共同的契约",
  "spatial.g.lead":
    "空间动效一旦粗心就会变得昂贵。以下是这些原语遵循的规则，也是产品可以依赖的保证。",
  "spatial.g.1.title": "只用合成属性",
  "spatial.g.1.body": "只动 transform 与 opacity。没有滤镜动画、没有逐帧读取布局、指针移动不触发 React 渲染。",
  "spatial.g.2.title": "减少动态仍保留构图",
  "spatial.g.2.body": "位置、环与图层依旧解析为一个经过设计的构图——运动停止，设计不会消失。",
  "spatial.g.3.title": "装饰层不承载任何语义",
  "spatial.g.3.body": "每个效果层都是 aria-hidden 与 pointer-events-none；状态始终由语义、颜色与文字承载。",

  /* 组件总览 —— 组件库的门面页。 */




































  /* ------------------------------------------------- Phase 4 · 空间语言 */
  "foundations.spatial.lead":
    "深度是一套系统，不是装饰。一个深度标尺、四个层级台阶、一种按压手势，覆盖了组件库里从 Button 到 Dialog 再到表格行的每一个表面——所以一个产品可以用一个属性改变自己的深浅感，而不必逐组件调参。",
  "foundations.spatial.idea.title": "前后对照",
  "foundations.spatial.idea.lead":
    "V4.0 之前，可交互表面回应指针用的是 Tailwind 自带的灰色阴影（主题无法改变它）加上固定的 1px 位移。空间语言把这两件事都换成令牌：阴影变成主题阶梯上的一级，位移变成由人格（以及 data-space）决定的距离。",
  "foundations.spatial.before": "之前 · V4 之前的写法",
  "foundations.spatial.after": "之后 · @luc/ui",
  "foundations.spatial.sampleAction": "运行流水线",
  "foundations.spatial.beforeNote":
    "一个在任何主题下都不变的默认阴影，以及一个既不考虑减弱动效、也不考虑人格的 hover 位移。",
  "foundations.spatial.afterNote":
    "由主题拥有的台阶、由人格缩放的位移，以及在请求减弱动效时立刻落位而不是慢慢移动。",
  "foundations.spatial.rungs.title": "四个台阶，一口井",
  "foundations.spatial.rungs.lead":
    "表面声明自己属于哪一层，而不是挑一个阴影值。因为台阶是令牌，换色板、换人格、换 data-space 都会一起移动——这正是整库读起来像同一个物件的原因。",
  "foundations.spatial.rung.rest.title": "静置",
  "foundations.spatial.rung.rest.body": "卡片、控件、行的默认状态。默认就是安静的。",
  "foundations.spatial.rung.hover.title": "回应",
  "foundations.spatial.rung.hover.body": "指针或键盘高亮到达时，同一个表面向上抬起一级。",
  "foundations.spatial.rung.float.title": "浮动",
  "foundations.spatial.rung.float.body": "菜单、Popover、Tooltip、HoverCard——脱离页面的那一层。",
  "foundations.spatial.rung.modal.title": "模态",
  "foundations.spatial.rung.modal.body": "Dialog、Sheet 与命令面板：系统中的最高层。",
  "foundations.spatial.rung.well.title": "下沉",
  "foundations.spatial.rung.well.body": "内容位于其中的表面：输入框、进度条轨道、分段控件、被按下的 Toggle。",
  "foundations.spatial.depth.title": "一个属性，一整棵子树",
  "foundations.spatial.depth.lead":
    "data-space 缩放子树中的每一个距离，而不需要改任何组件：flat 用于打印视图或密集表格，layered 是默认，deep 用于 hero 或画廊。减弱动效时保留最终状态、去掉过程。",
  "foundations.spatial.states.title": "状态用同一种语言回答",
  "foundations.spatial.states.lead":
    "hover 抬起、press 下沉、focus 点亮、disabled 压平。同三种手势同时出现在 Button、Card、菜单行和日历日期上——所以由许多家族拼出的页面仍然像一个表面。",
  "foundations.spatial.tokens.title": "该用什么",
  "foundations.spatial.tokens.lead":
    "下面全部是公开的：调用方可以用同样的台阶构建自己的表面，它会和内置组件一样跟随色板、人格与 data-space。",
  "foundations.spatial.reduced.title": "减弱动效",
  "foundations.spatial.reduced.lead":
    "位移只用 transform 且只播一次，所以 base.css 里的钳制会落在最终状态，而不是停在抬到一半。",
  "foundations.spatial.reduced.body":
    "hover 不再动画、press 不再回弹、展开面板瞬时打开。但没有任何东西消失：对比度、焦点可见性、布局与每一个状态都和动画版本一样清晰，因为动画从来就不承载信息。",

  /* --------------------------------------------- Phase 4 · 组件 */
  "components.accordion.lead":
    "可开合的区块，ARIA、方向键与 roving focus 只实现一次。面板不会弹出，而是像 Popover 和 CardStack 一样落位。",
  "components.accordion.when.title": "一次只开一个",
  "components.accordion.when.lead": "single 模式是设置页的写法：打开一个就关掉上一个；collapsible 允许读者全部收起。",
  "components.accordion.flush.title": "一个表面，多个区块",
  "components.accordion.flush.lead":
    "card 让每个区块各有一层表面；flush 保留同一层，用发丝线分隔行——长文档与 FAQ 需要后者。",
  "components.accordion.row.title": "没有 item 的展开",
  "components.accordion.row.lead":
    "Collapsible 是同一套行为，针对单个区域：没有 item 包装、没有 roving focus，aside 槽位可以放控件。",


  "components.toggle.pressed.lead":
    "按下的 Toggle 保留自己的表面并取用内凹井，读起来像被推下去的开关，而不是被选中的标签页。",

  "components.toggle.group.lead":
    "multiple 让每一项彼此独立；single 是 radiogroup——一个 Tab 停靠点、方向键、aria-checked——这和带滑动指示器的分段控件是完全不同的契约。",
  "components.toggle.multiple": "可以同时开任意多项（列可见性、叠加层、图层）。",
  "components.toggle.single": "只能开一项（聚合粒度、密度、模式）。",
  "components.toggle.vsSegmented":
    "SegmentedControl 表示一个值，并带滑动指示器；ToggleGroup 表示一组独立选项。两者看起来相关但不可互换：允许同时选中两项的分段控件，是在说谎。",


  "components.toggle.toolbarNote": "工具栏是一个 Tab 停靠点。屏幕阅读器用户不应该按十一次 Tab 才能穿过一条格式条。",
  "components.avatar.lead":
    "人、团队或 agent 的身份标识。回退态是被设计过的而不是被容忍的，色相由名字确定（同一个名字永远是同一个颜色），可访问名称只有一个字符串。",
  "components.avatar.fallback.title": "首字母才是常态",
  "components.avatar.fallback.lead":
    "回退态不是失败态：在冷缓存下它才是大多数读者看到的东西。没有图片时立刻渲染，有图片时稍作延迟——这样慢网络不会先闪出首字母。",
  "components.avatar.tint":
    "色相由名字哈希后从六个语义表面中选取，因此它在任何色板下都成立，也不会因为列表重新排序而变——随机颜色恰恰会这样。",
  "components.avatar.group.title": "溢出数量直接写出来",
  "components.avatar.group.lead": "溢出是真实文本（+3），不是被隐藏的徽标。子项分页时请给出 total。",
  "components.avatar.list.title": "在列表中",
  "components.avatar.list.lead":
    "同一个 Avatar 出现在表格行、页头和评论区，旁边是只读的 Rating——不能修改的评分是数据，所以它作为图像朗读，而不是控件。",
  "components.avatar.rating.title": "Rating 是 radiogroup",
  "components.avatar.rating.lead": "一个 Tab 停靠点，方向键改变分值，Home / End 跳到两端。再次点击当前分值即清空。",
  "components.alertDialog.lead":
    "用于无法撤销的操作确认。它不是加了开关的 Dialog——它是一份不同的契约：安全答案位于首个焦点位置，且无法通过点击遮罩关掉。",
  "components.alertDialog.default.title": "一个决定，而不是一个页面",
  "components.alertDialog.default.lead":
    "两种形态：默认 danger 的破坏性确认，以及使用主按钮的重要但可逆的确认。Esc 仍然可以关闭；误点遮罩不行。",
  "components.alertDialog.form.title": "确认时需要输入",
  "components.alertDialog.form.lead": "在对话框里放输入框没有问题——它仍然只是一个决定，而操作按钮承载动词。",
  "components.alertDialog.rules.title": "什么时候用",
  "components.alertDialog.rules.lead":
    "判据是可逆性。如果操作可以就地撤销，请改用按钮加 toast；对话框留给没有东西可撤销的场景。",
  "components.timeline.lead":
    "带时间的事件序列与进度步骤条。两者都是有序列表，因为序列有顺序，屏幕阅读器应该被告知。Timeline 负责轨道与节奏，你负责内容。",
  "components.timeline.run.title": "一次流水线运行",
  "components.timeline.run.lead":
    "变更日志、活动流、任务运行与 agent 轨迹共用一个形状：标记、标题、说明行，以及右对齐的时间或耗时。轨道在最后一项停止，而不是继续延伸。",
  "components.timeline.stepper.title": "在已知序列中前进",
  "components.timeline.stepper.lead":
    "已完成与当前步骤是按钮；未来步骤是静态文本，所以没有人会跳进前置条件尚未满足的步骤。",
  "components.timeline.stepperNote": "只有当前步骤及其之前的步骤可达。",
  "components.carousel.lead":
    "基于平台自带 scroll-snap 的横向内容轨——惯性、触摸、触控板手势与 RTL 全部免费——再加上它缺少的两件事：控件与键盘契约。",
  "components.carousel.rail.title": "一条真正的轨道",
  "components.carousel.rail.lead":
    "轨道是一个带 Tab 停靠点的具名 region，键盘用户可以用方向键滚动。圆点是 tablist，箭头在两端禁用，live region 只在当前页变化时播报。",
  "components.carousel.manual.title": "开启自动播放时",
  "components.carousel.manual.lead":
    "自动播放需要显式开启，hover 与聚焦时暂停，标签页隐藏时停止，而在 prefers-reduced-motion 下根本不会启动。",
  "components.carousel.autoplayNote": "自动前进",
  "components.carousel.aspect.title": "AspectRatio",
  "components.carousel.aspect.lead":
    "在媒体加载前就预留空间，所以卡片网格不会因为慢速图片而位移。可以用预设，也可以传任意数值。",
  "components.carousel.usePreset": "复制该预设",
  "components.fieldParts.lead":
    "Field 是 LUC 决定标签语义的地方：它生成控件的 id，并把说明、进行中的检查与消息接到控件上。页面其余部分，就是表单用来拼装的那些零件——带附加件的统一输入外壳、给第三方控件用的独立 Label、平台原生选择器，以及让快捷键可被发现的键帽提示。",
  "components.fieldParts.group.title": "一个外壳，多种附加件",
  "components.fieldParts.group.lead":
    "InputGroup 就是其他文本控件共用的那个外壳，以组合的方式暴露：前缀、分隔线、后缀、图标——焦点环、错误态与下沉表面都已经正确。",
  "components.fieldParts.label.title": "标签与键帽",
  "components.fieldParts.label.lead":
    "Label 用于 LUC 不拥有的控件，它的必填星号是 aria-hidden，因此名称不会被读两遍。KbdGroup 把一个快捷键拼成一次播报。",
  "components.fieldParts.labelNote": "Field 已经为 LUC 控件渲染标签。第三方或复合控件请用 Label，由你自己组装 ARIA。",
  "components.fieldParts.native.title": "什么时候原生更好",
  "components.fieldParts.native.lead":
    "十分之九的情况下 Select 是对的。剩下那一次是移动端表单：平台选择器是用户已经熟悉的滚轮，而自定义浮层两头不讨好。",
  "components.fieldParts.hover.title": "HoverCard 不是 Tooltip",
  "components.fieldParts.hover.lead":
    "Tooltip 给控件命名；HoverCard 预览有内容和操作的对象，并且同时跟随焦点与指针。",
  "components.fieldParts.hoverNote":
    "它永远不是获取内容的唯一途径：触发器可聚焦，同样的信息也应该出现在它所预览的页面上。",

  /* ------------------------------------------------ Phase 4 · 图表 */
  "charts.catalog.lead":
    "LUC UI 能画的每一种图表，以及诚实的状态标注。public 表示今天就能在 @luc/ui/charts 里导入带类型的组件；engine 表示渲染引擎支持但 LUC 尚未封装；planned 与 blocked 尚未交付，并写明原因。别名与单纯外观变体不计入不同图表类型。",
  "charts.catalog.status.title": "如何阅读本页",
  "charts.catalog.status.lead": "四种状态，下面的数字是当前事实，而不是目标。",
  "charts.catalog.status.public.note": "有类型、有测试、有 Showcase 示例的公开组件。",
  "charts.catalog.status.engine.note": "引擎可以绘制，LUC 还未封装。",
  "charts.catalog.status.planned.note": "已确认有价值但尚未开始，注释写明它的阻碍。",
  "charts.catalog.status.blocked.note": "需要 LUC 刻意不打包的依赖或数据。",









  "charts.catalog.variants.title": "变体，而不是新类型",
  "charts.catalog.variants.lead":
    "刻意不列入上面的计数：它们复用同一个渲染器，只是语义不同。把它们算成独立的图表类型只会让目录变大，而不会增加任何能力。",
  "charts.catalog.variants.badge": "变体",
  "charts.catalog.status.public.symbols": "共命名 {count} 个不同的公开组件",
  "charts.catalog.rules.title": "两条不会让步的规则",
  "charts.catalog.rules.lead": "它们把这本目录和一堆好看的截图区分开来。",
  "charts.catalog.rules.body":
    "第一：组件库只做渲染，不做估计。这份清单里的图表不会分箱、平滑、拟合、差分或优化——所有数值都是准备好的；不可避免的变换（对数轴、河流图自身的布局）是展示映射，并在契约中明确写出。第二：别名不算类型。只有当读者会用它们回答不同问题时，两个组件才算两种图表类型。",
  "charts.statistical.lead":
    "分布、一致性与不确定性。这里每个数值都由调用方准备好：组件库画出给它的 ECDF、给它的分位数、给它的区间，这样图表里的数字只对一个地方负责。",
  "charts.statistical.how.title": "比较两个样本",
  "charts.statistical.how.lead":
    "经验 CDF 与 Q–Q 图对同一对样本回答不同问题。CDF 显示一个样本相对另一个的位置；Q–Q 图显示形状从哪里开始不一致，通常是尾部。",
  "charts.statistical.ecdf":
    "每个样本 240 个合成交易日。以阶梯绘制——在次序统计量之间插值会凭空造出样本中不存在的概率质量。",
  "charts.statistical.qq": "样本分位数对正态分位数。偏离 45° 线的地方就是结论。",
  "charts.statistical.shape.title": "形状、离散与不确定性",
  "charts.statistical.shape.lead":
    "小提琴图是调用方算好的密度轮廓，误差条是调用方给的区间，残差图是模型自己的剩余。它们都不做拟合。",
  "charts.statistical.violin": "三条准备好的密度轮廓，附一个由调用方提供的中位数标记。",
  "charts.statistical.intervals": "点估计与给定的区间。画出来的区间就是传进来的区间。",
  "charts.statistical.residual": "残差对拟合值，并给出表现良好的模型应当围绕的零线。",
  "charts.statistical.classifier.title": "分类器",
  "charts.statistical.classifier.lead":
    "ROC、校准曲线与混淆矩阵是同一个分类器的三个视角。AUC 直接打印调用方给的数字而不是在这里积分；混淆矩阵可以按行归一化，避免大类压过小类。",
  "charts.statistical.roc": "两条曲线与它们各自的 AUC。对角线代表随机，不是一个分数。",
  "charts.statistical.calibration":
    "观测频率对预测概率。气泡面积是分箱样本量，所以样本稀疏的箱子无法伪装成强证据。",
  "charts.statistical.confusion": "按行归一化，所以 900 样本的类别和 40 样本的类别可以比较。",
  "charts.scientific.lead":
    "商业图表表达不了的形状：相图、箭头场、频谱图、三元组成。它们都接收准备好的数据，而唯一不可避免的变换——河流图的布局——由引擎完成并在契约中写明。",
  "charts.scientific.many.title": "超过三个维度",
  "charts.scientific.many.lead":
    "当散点矩阵开始不可读时，平行坐标依然清晰：每个轴独立，一个观测就是穿过自身数值的折线，而交叉就是真实的取舍。",
  "charts.scientific.parallel": "六十个合成策略、六个维度。当数值越低越好时可以把轴反转。",
  "charts.scientific.geometry.title": "几何",
  "charts.scientific.geometry.lead":
    "三元组成、极坐标直方图与向量场。每一个都写明坐标约定，tooltip 打印调用方给的值，而不是重新推导的值。",
  "charts.scientific.ternary":
    "三个和为 1 的份额。份额不为 1 的点按其归一化位置绘制，而 tooltip 报告的是传入的份额。",
  "charts.scientific.rose": "南丁格尔玫瑰图：半径是测度，角度只是分类。",
  "charts.scientific.wind": "堆叠的极坐标直方图——按方向分速度区间的风玫瑰图。",
  "charts.scientific.vector": "每个样本一个箭头，长度就是给定的模。缩放倍数是调用方的显式选择，并在 tooltip 中说明。",
  "charts.scientific.density.title": "密度与频谱",
  "charts.scientific.density.lead":
    "等值线、六边形分箱与频谱图都在回答「质量在哪里」。环线、分箱与采样都在上游算好；LUC 负责几何、色带与 tooltip。",
  "charts.scientific.contour": "采样鞍面的等值线。层级直接标在线条上，所以相邻两条等值线无需图例即可区分。",
  "charts.scientific.hexbin": "以数据单位为半径的预分箱六边形，任何缩放级别下几何都与分箱一致。",
  "charts.scientific.spectrogram": "时间对频率，使用固定的分贝范围，因此两张频谱图可以比较。渐进渲染让长采样保持流畅。",
  "charts.scientific.flow.title": "流动与多分布",
  "charts.scientific.flow.lead":
    "河流图把一段时间内的构成画成一个整体形状；山脊图把多个分布沿一条轴堆叠。垂直偏移是绘制变换，从不改变数值——所以它有上限。",
  "charts.scientific.river": "带状布局由引擎负责，因为它只是摆放调用方的数字，而不是推导它们。",
  "charts.scientific.ridgeline": "重叠上限为 1，因此一行永远无法完全遮住下面一行。",
  "charts.workflow.lead":
    "运维产品常用的形状：哪个任务在什么时候运行、两个周期如何对比、什么发生了变化、变化多少。它们都不推断状态——每一个都只是在给定位置显示给定数值。",
  "charts.workflow.schedule.title": "排期",
  "charts.workflow.schedule.lead":
    "每个任务一行，落在真实时间轴上，按给定顺序自上而下绘制。进度是内部条形而不是第二条系列，这正是两百个任务的计划仍然可读的原因。",
  "charts.workflow.gantt": "每日流水线的五个阶段，当前任务部分完成。",
  "charts.workflow.compare.title": "对比",
  "charts.workflow.compare.lead":
    "哑铃图衡量两个时刻的量；斜率图衡量排名或指数，所以它的线可以交叉，而交叉本身就是结论。",
  "charts.workflow.dumbbell": "每个指标的起点与终点，变化由连线表示。",
  "charts.workflow.slope": "两次评审之间的权重变化。值轴共享，因此交叉是真实的。",
  "charts.workflow.bullet": "测量值、目标值，以及两者之间的定性区间。",
  "charts.workflow.lollipop": "把条形简化为茎与头，用于很长的排序列表。",
  "charts.workflow.rank.title": "排名与权重",
  "charts.workflow.rank.lead":
    "凹凸图反转坐标轴，让第 1 名位于顶部；null 是真实的缺失，会断线而不是插值。Mekko 让列宽等于组规模，这是堆叠条形图的诚实版本。",
  "charts.workflow.bump": "六个季度的因子排名。Size 在 Q4 缺失，线条中断而不是猜测。",
  "charts.workflow.mekko":
    "渠道构成，宽度等于渠道规模——所以大列里的小份额与极小列里的小份额在视觉上明显不是同一件事。",
  "charts.quantitative.lead":
    "只做展示。本页没有任何一个指标由组件库计算：回撤是传入的、隐含波动率是传入的、有效前沿是传入的、因子暴露也是传入的。这正是图表里的数字只对拥有数据版本的分析层负责的原因。",
  "charts.quantitative.price.title": "价格",
  "charts.quantitative.price.lead":
    "这是 K 线图的 ECharts 版本，与 @luc/ui/financial-chart 里可交互的 Lightweight Charts 版本并存。两个引擎、两种用途：这一个可以嵌进网格、仪表盘或打印视图。",
  "charts.quantitative.candles":
    "合成日 K 线加两条准备好的均线。涨跌配色来自主题本身，所以 K 线永远不会和涨跌单元格的说法冲突。",
  "charts.quantitative.drawdown":
    "传入的回撤值，锚定在零，上方不留空——水下图里出现百分比正收益，是一个不存在的数字。",
  "charts.quantitative.surface.title": "曲线与曲面",
  "charts.quantitative.surface.lead":
    "波动率微笑完全由传入的报价绘制，行权价之间不做插值。真正的三维波动率曲面需要 echarts-gl，它仍然在基础入口之外。",
  "charts.quantitative.smile": "四个到期日、每个十三个行权价，已是百分比。缺失的行权价就是少几个点。",
  "charts.quantitative.portfolio.title": "组合",
  "charts.quantitative.portfolio.lead":
    "有效前沿以有序点传入，因此调用方需要说明它使用的约束。当前组合是一个标记而不是第二张图，这让「我相对前沿在哪里」一眼可见。",
  "charts.quantitative.frontier": "六个资产对一条传入的前沿，并标出当前组合。",
  "charts.quantitative.factors": "以零为中心，按符号着色，因为暴露是有正负的量。",
  "charts.quantitative.pnl": "每月带符号的贡献。亏损因子会从柱子里减去，而不是堆在盈利因子之上。",
  "charts.multidimensional.lead":
    "这里的三个家族都需要行数据之外的某种东西——共享标尺、父子关系或地图——因此每一个都写明调用方必须提供什么，并拒绝猜测。",
  "charts.multidimensional.matrix.title": "两两关系",
  "charts.multidimensional.matrix.lead":
    "散点矩阵是 n × (n − 1) 个网格：对角被省略，因为变量和自己不携带信息，而对角线放直方图会让渲染成本翻倍只为了一处装饰。",
  "charts.multidimensional.splom":
    "四个指标、十二个单元，行列共享坐标轴，因此相关性表现为斜率。超过六个变量请改用平行坐标。",
  "charts.multidimensional.tree.title": "层级",
  "charts.multidimensional.tree.lead":
    "树状图、文件树或组织架构图。布局与折叠交互由引擎提供——那是几何而不是统计——LUC 提供标签模型与色调契约。",
  "charts.multidimensional.tree": "叶子按自身色调着色，所以同一个形状可以同时服务编辑树与 JSON 检视器。",
  "charts.multidimensional.geo.title": "地理",
  "charts.multidimensional.geo.lead":
    "LUC 不打包任何地图数据：边界文件很大、带许可证，而且打包一份就等于把某种政治边界设定强加给所有调用方。因此注册地图是调用方的显式步骤。",
  "charts.multidimensional.geo.registered": "本页注册的是一张合成网格，用来验证机制，而不是打包边界数据。",
  "charts.multidimensional.geo.rules.title": "如何使用",
  "charts.multidimensional.geo.rules.body":
    "在首次渲染前注册一次，然后打点。分级统计图还需要按区域提供数值，那是另一份契约——见下方路线图。",
  "charts.multidimensional.geo.blocked":
    "受阻：分级统计图需要区域数据加已注册地图，三维曲面需要 echarts-gl（约 180 KB）。两者都不在基础入口中，也不会被默认打包。",

  "components.board.lead":
    "拖拽排序不需要引入拖拽库：指针走浏览器原生的拖放协议，键盘走「拿起—移动—放下」，并由礼貌的实时区域逐句播报。",
  "components.board.list.title": "可排序列表",
  "components.board.list.lead":
    "左侧的顺序就是右侧读出的数组：onReorder 收到的是完整顺序，而不是一个增量，因此调用方不需要自己推演。",
  "components.board.list.label": "流水线步骤顺序",
  "components.board.list.order": "当前顺序",
  "components.board.list.hint": "指针可以拖动句柄；键盘按空格拿起，方向键移动，再按空格放下，Esc 取消。",
  "components.board.kanban.title": "看板",
  "components.board.kanban.lead": "看板是二维排序：上下在同一列内换位，左右把卡片带到相邻列的同一深度。",
  "components.board.kanban.label": "路线图看板",
  "components.board.api.title": "公开 API",
  "components.board.api.lead": "两个组件都是受控的：它们报告意图，由调用方决定模型如何变化。",
  "components.board.api.items": "列表项：id、label，以及可选的 description 与 disabled。",
  "components.board.api.reorder": "移动之后的完整 id 顺序。",
  "components.board.api.columns": "列与卡片；每一列有 id、title 与 cards。",
  "components.board.api.move": "一次移动的意图：卡片 id、来源列、目标列与目标下标。",
  "components.board.api.note":
    "拖拽只使用浏览器原生事件，键盘使用 aria-pressed 与实时播报，两者都不需要额外依赖。",

  "components.media.lead": "三个与图片有关的组件：图库是索引，灯箱是单张，对照滑块是两张图之间的差值。",
  "components.media.gallery.title": "图库",
  "components.media.gallery.lead":
    "缩略图网格即索引；每张图都必须带 alt，因为一组没有标签的图片对屏幕阅读器等于空白。",
  "components.media.gallery.label": "研究配图",
  "components.media.lightbox.title": "灯箱",
  "components.media.lightbox.lead":
    "灯箱建立在共用的 Dialog 之上：焦点陷阱、Esc、滚动锁定与焦点归还都来自同一个地方；方向键切换图片，+ / − 缩放。",
  "components.media.lightbox.open": "打开查看器",
  "components.media.lightbox.hint": "打开后用方向键切换，+ 与 − 缩放，Esc 关闭。",
  "components.media.lightbox.label": "图片查看器",
  "components.media.compare.title": "前后对照",
  "components.media.compare.lead":
    "对照滑块的本质是一个真实的 range 输入框，而不是自定义指针处理：键盘步进、点击跳转与无障碍名称因此都是平台自带的。",
  "components.media.compare.label": "处理前后对照",
  "components.media.api.title": "公开 API",
  "components.media.api.lead": "三个组件都只负责展示，不涉及解码、缩放、缓存或上传。",
  "components.media.api.alt": "每张图片都必需，否则返回的是一组无法使用的图片。",
  "components.media.api.columns": "网格列数预设。",
  "components.media.api.lightbox": "是否启用内置查看器；关闭时可以自己处理 onOpen。",
  "components.media.api.value": "0–100，表示「之前」占据的比例。",
  "components.media.api.pair": "两张图各自的 src 与 alt。",

  "components.ai.lead":
    "一组与模型无关的 AI 界面原语——消息、流式文本、工具调用与 agent 状态——不含模型、传输层与厂商 SDK。",
  "components.ai.thread.title": "一次对话",
  "components.ai.thread.lead":
    "MessageList 是一个 role=\"log\" 区域，只在用户已经位于底部时自动跟随新内容——向上回看时不会被新的 token 拽回去。",
  "components.ai.thread.label": "对话记录",
  "components.ai.thread.question": "帮我概括一下 BTCUSD 最近的波动，并说明期限结构是否仍然向上。",
  "components.ai.thread.errorAuthor": "系统",
  "components.ai.thread.error": "第二条工具调用没有返回结果。可以重试，或换一个更窄的查询。",
  "components.ai.thread.replay": "重放一次",
  "components.ai.thread.replayHint": "演示文本由定时器逐字写出，不调用任何接口。",
  "components.ai.tools.label": "这一步调用的工具",
  "components.ai.agent.title": "Agent 状态",
  "components.ai.agent.lead":
    "AgentActivity 只渲染调用方声明的步骤。它没有「查看推理过程」的入口，因为没有东西可以展示：组件只能显示传进来的文本。",
  "components.ai.agent.running": "正在分析",
  "components.ai.agent.compact": "紧凑模式",
  "components.ai.agent.s1": "读取任务说明",
  "components.ai.agent.s2": "抓取指标",
  "components.ai.agent.s2d": "已完成 12 / 40 个标的",
  "components.ai.agent.s3": "撰写结论",
  "components.ai.agent.s4": "交付",
  "components.ai.composer.title": "输入框",
  "components.ai.composer.lead":
    "Enter 发送、Shift + Enter 换行；请求进行中时发送按钮换成停止按钮，toolbar 插槽留给模型选择器与附件。",
  "components.ai.composer.label": "提示词",
  "components.ai.composer.placeholder": "想问点什么…",
  "components.ai.composer.hint": "Enter 发送，Shift + Enter 换行",
  "components.ai.composer.send": "发送提示词",
  "components.ai.composer.model": "模型：本地演示",
  "components.ai.api.title": "公开 API",
  "components.ai.api.lead": "属性刻意保持精炼，因为组合点比布尔开关更重要。",
  "components.ai.api.from":
    "这条消息来自谁。刻意不叫 role：在会渲染 DOM 的组件上，叫 role 会与 ARIA 属性冲突，并让所有使用 jsx-a11y 的调用方误报。",
  "components.ai.api.status": "该轮的渲染状态；error 会同时改变边框与底色。",
  "components.ai.api.speed": "每秒显示多少个字符；prefers-reduced-motion 下直接显示全文。",
  "components.ai.api.submit": "提交时收到去除首尾空格的文本，组件随后清空输入。",
  "components.ai.api.calls": "工具调用记录：名称、状态、输入、结果与耗时，全部由调用方提供。",
  "components.ai.api.note":
    "StreamingText 始终只有一个文本节点：屏幕阅读器会把这句话读一遍，而不是逐字拼出来。",




































  "charts.diagnostics.lead": "回答「这个模型或过程是否正常」的那一类图。与所有图表家族一样：LUC 负责渲染，不负责估计。",
  "charts.diagnostics.time.title": "时间序列诊断",
  "charts.diagnostics.time.lead": "滞后相关性由调用方算好；显著性带也只画调用方给出的半宽——没有样本量，就没有带。",
  "charts.diagnostics.acf": "自相关与偏自相关叠在同一坐标上，两条系列都从 0 出发画茎线。",
  "charts.diagnostics.pacf": "单独的偏自相关，便于与左侧对照阅读。",
  "charts.diagnostics.survival.title": "生存与风险",
  "charts.diagnostics.survival.lead": "阶梯曲线是必须的：两次事件之间生存率保持不变，插值会凭空造出样本里并不存在的风险。",
  "charts.diagnostics.survival.note": "删失标记是调用方传入的点，不由数据推断。",
  "charts.diagnostics.ranking.title": "排序与模型质量",
  "charts.diagnostics.ranking.lead": "两条机器学习诊断线：一条衡量排序质量，一条衡量每个特征的方向与不确定性。",
  "charts.diagnostics.pr": "召回率在 x 轴、精确率在 y 轴；虚线是调用方提供的无技能基线（正类占比）。",
  "charts.diagnostics.importance": "按重要性排序的横向柱；signed 表示按系数方向着色，区间同样由调用方给出。",
  "charts.diagnostics.rule.title": "科学正确性",
  "charts.diagnostics.rule.lead": "这些图不会替调用方做统计。",
  "charts.diagnostics.rule.body":
    "自相关、生存估计、精确率与召回率、特征重要性及其区间，全部按传入值绘制。分箱、拟合、重采样与校正发生在数据所在的地方——这样图与报告里的数字不可能互相矛盾。",

  "charts.networks.lead": "两个网络与层级图形。它们各自做了引擎做不到的一件事：从调用方已经拥有的数字算出一个布局。",
  "charts.networks.chord.title": "和弦图",
  "charts.networks.chord.lead":
    "弧长是「流出 + 流入」的合计，每组弧的前一段是流出、后一段是流入；必须传入方阵，行与列的顺序会被原样保留。",
  "charts.networks.chord.note": "五个资产类别之间的交叉持有，数值直接来自传入矩阵。",
  "charts.networks.dendrogram.title": "树状图",
  "charts.networks.dendrogram.lead":
    "LUC 画树，不做聚类：merges 是调用方算出的连接关系——子节点与合并高度——因此图不可能与分析结论不一致。",
  "charts.networks.dendrogram.note": "六个因子的层级聚类；分支高度就是传入的合并高度。",
  "charts.networks.rule.title": "科学正确性",
  "charts.networks.rule.lead": "布局属于几何，不属于统计。",
  "charts.networks.rule.body":
    "和弦布局把方阵变成角度，树状图把合并记录变成坐标；两者都是纯函数并且单独导出，可以在没有浏览器的情况下测试，也可以被调用方用于自己的渲染。",

  "charts.geospatial.lead": "两个地理图形。LUC 不打包任何边界数据：地图名称由调用方注册，缺值区域会被画成「无数据」而不是 0。",
  "charts.geospatial.choropleth.title": "分级统计图",
  "charts.geospatial.choropleth.lead": "传入注册过的地图名称以及每个区域的数值；value 为 null 表示无数据，并走单独的一套配色。",
  "charts.geospatial.choropleth.note": "本页注册的是一张合成网格，用来验证契约，而不是打包边界数据。",
  "charts.geospatial.choropleth.value": "指标值",
  "charts.geospatial.choropleth.loading": "正在注册示例地图…",
  "charts.geospatial.routes.title": "轨迹",
  "charts.geospatial.routes.lead":
    "以经纬度传入折线；跨越 ±180° 的航段会被展开，因此 179°E 到 179°W 是一条短跳，而不是横穿整张图的长线。",
  "charts.geospatial.routes.note": "第二条航线跨过国际日期变更线，并被展开显示——tooltip 仍然报告调用方传入的经度。",
  "charts.geospatial.policy.title": "地图政策",
  "charts.geospatial.policy.lead": "边界数据是调用方的决定。",
  "charts.geospatial.policy.body":
    "世界或国家边界文件体积大、带许可证，而且打包一份就等于替所有调用方选定了一种政治边界。因此 registerEChartsMap 是一个显式的、只做一次的调用，投影与简化也留在调用方一侧。",

  "charts.surfaces.lead": "真正的三维曲面，没有三维引擎：旋转、正交投影、按深度排序后从后往前绘制，全部在同一个 ChartSurface 外壳里完成。",
  "charts.surfaces.view.title": "可旋转的曲面",
  "charts.surfaces.view.lead": "指针可以拖动，键盘可以用方向键旋转（Shift + 方向键改变仰角），两个角度也都可以完全受控。",
  "charts.surfaces.view.azimuth": "方位角",
  "charts.surfaces.view.elevation": "仰角",
  "charts.surfaces.wire.title": "线框与波动率曲面",
  "charts.surfaces.wire.lead": "同一个网格的两种读法：线框看形状，曲面看取值。",
  "charts.surfaces.wire.note": "只画网格线，便于观察拓扑。",
  "charts.surfaces.vol.note": "隐含波动率以网格形式传入：从一堆报价插值出曲面涉及建模，而组件库不应该隐瞒模型。",
  "charts.surfaces.rule.title": "为什么不是 echarts-gl",
  "charts.surfaces.rule.lead": "依赖成本是实测出来的。",
  "charts.surfaces.rule.body":
    "echarts-gl 是一个体积可观的 WebGL 依赖，会给每个使用 @luc/ui/charts 的调用方再引入一个渲染器与一个 GPU 上下文。网格曲面本来就是一个已解决的二维问题，因此这里用约 120 行算术替代它：没有渲染器、没有 GPU 上下文、输出确定，并且与其它图表共用同一个外壳（tooltip、导出、减弱动效、aria）。缺失的格子是曲面上的一个洞，而不是 0。",

};

export const en: Dictionary = {
  ui: uiEn,
  nav: {},
  routes: {},
  content: contentEn,
  prose: {},
};

export const zhCN: Dictionary = {
  ui: uiZh,
  nav: navZh,
  routes: routesZh,
  content: contentZh,
  prose: proseZh,
};

export const dictionaries: Record<string, Dictionary> = {
  en,
  "zh-CN": zhCN,
};
