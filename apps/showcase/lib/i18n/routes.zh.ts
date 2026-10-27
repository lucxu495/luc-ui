/*
 * Simplified Chinese copy for every documented route's page header.
 *
 * The English strings stay in the page files (they are the source of truth for
 * the English page and the fallback for anything not listed here); this table
 * only overrides `title` and `lead` for the Chinese rendering. Keeping it in one
 * file makes the translation coverage auditable: every key is a real route, and
 * a route that is missing from this map renders in English rather than breaking.
 *
 * Component identifiers, prop names and code are never translated.
 */

type RouteCopy = { title?: string; lead?: string };

export const routesZh: Record<string, RouteCopy> = {

  /* ------------------------------------------------------------ 产品范例 */
  "/experiences": {
    title: "产品范例",
    lead: "十六个用公开 API 搭建的可运行产品，按你想做的东西分组。每个范例都会列出它用到的组件，跑在确定的本地数据上，并由真实的浏览器测试驱动，而不是一张截图。",
  },
  "/experiences/general/marketing": {
    title: "一个真正要说服人的落地页",
    lead: "导航、围绕产品自身界面的首屏、能力叙事、社会证明、随计费周期变化的定价、可展开的常见问题，以及先校验再道谢的线索表单。",
  },
  "/experiences/general/saas": {
    title: "一个真实工具所居住的控制台",
    lead: "侧边栏、筛选栏、即为产品本体的表格、真的会新增一行的邀请对话框、设置抽屉，以及带已读状态的通知收件箱。以 flat 深度渲染。",
  },
  "/experiences/general/publishing": {
    title: "索引、阅读视图与分享控件",
    lead: "在六篇文章的索引上做搜索与主题筛选，使用编辑衬线体、行宽舒适的阅读视图，按共同主题挑选的相关文章，以及复制读者当前地址的分享控件。",
  },
  "/experiences/general/community": {
    title: "每一次操作都会改变结果的信息流",
    lead: "发布框、会计数的表情回应、会追加的回复、会翻转的关注，以及一个会引用原帖、可以取消的治理确认流程。",
  },
  "/experiences/personal/career": {
    title: "一段读起来像职业生涯的职业经历",
    lead: "编辑风格的首屏、带有真实开放终点的时间线、原地展开的精选作品，以及一个打印本页、而不是承诺一个从未打包的文件的简历动作。",
  },
  "/experiences/personal/academic": {
    title: "一份可以收窄的文献列表",
    lead: "研究方向、六篇文献（分面由条目自身推导）、报告、教学，以及只在作者确实提供了标识符时才出现的标识符。",
  },
  "/experiences/personal/portfolio": {
    title: "最具表现力的一页",
    lead: "由指针驱动的空间首屏、只组装一次的动态标题、客户跑马灯、原地展开的项目、带真实大图查看器的完整封面系列。",
  },
  "/experiences/personal/garden": {
    title: "一座花园，而不是一个博客",
    lead: "会自己标注日期的「近况」区块、在同一条可筛选流里的四类笔记、能收窄整页的主题标签、带真实进度的书架，以及一个解释缺口的空状态。",
  },
  "/experiences/vertical/ai": {
    title: "一场把过程摊开给你看的智能体会话",
    lead: "会播报新消息的消息列表、带光标的流式回答、含耗时与输出的工具调用、从进行中走向完成的智能体步骤，以及会切换发送与停止的输入器。",
  },
  "/experiences/vertical/science": {
    title: "仪器一变，图形就跟着变",
    lead: "左边是参数，右边是图形，同一个控件后面还挂着每一行观测的表格。滑块改变的是显示，而从来不是数据。",
  },
  "/experiences/vertical/finance": {
    title: "一个区间、一本持仓，以及一行背后的数字",
    lead: "带外部传入叠加线的 K 线、真正日期轴上的水下曲线、带符号的因子暴露、持仓表，以及跟随选中行的检查面板。",
  },
  "/experiences/vertical/commerce": {
    title: "带真实购物车的商品页",
    lead: "四种变体，会改变价格、库存提示与到货预计；数量会改变小计；三步结算随时可以回退，页面上没有任何卡号输入框。",
  },
  "/experiences/vertical/education": {
    title: "先讲清楚，再检验的课程",
    lead: "带累计进度的课程导航、三段短阅读，以及会解释每个选项（包括错误选项）的两题检验。",
  },
  "/experiences/vertical/media": {
    title: "一个素材库，和一份还在变动的顺序",
    lead: "素材画廊、可用指针或键盘重排的成片顺序，以及会编辑选中素材、并在切换素材后依然保留的元数据。",
  },
  "/experiences/vertical/productivity": {
    title: "真的能挪得动的工作",
    lead: "四列看板，指针与键盘都能移动卡片，完成度汇总随之更新，而批量选择会改变工具栏自称将要作用的对象。",
  },
  "/experiences/vertical/forum": {
    title: "话题列表，以及一条可以被治理的帖子",
    lead: "带活跃度的话题列表、回复可计分的帖子、回复输入器，以及会显示被举报内容、且可以取消的举报流程。",
  },
  "/": {
    title: "Luc UI — 默认即美，设计即表达",
  },

  /* ---------------------------------------------------------------- 基础 */
  "/foundations": {
    title: "组件背后的系统",
    lead: "Luc UI 是一小组被一致执行的规则。这些页面就是契约：这里没有的东西，就还不属于这套系统。",
  },
  "/foundations/colors": {
    title: "颜色",
    lead: "组件从不直接使用原始颜色，而是使用语义令牌，由主题决定它最终解析成什么。深色是基准主题，浅色是单独设计的，而不是简单反相。",
  },
  "/foundations/typography": {
    title: "排版",
    lead: "三个字族，一种声音：界面用 Inter，层级用 Inter Tight，代码与数字用 JetBrains Mono。每个角色都有固定的字号、行高与字距。",
  },
  "/foundations/spacing": {
    title: "间距",
    lead: "以 4px 为基准节奏，没有例外。密集的产品界面本就该密集——有利于扫读的地方给足空间，不必要的地方收紧。",
  },
  "/foundations/radius": {
    title: "圆角",
    lead: "七个档位，每一档对应一个角色。圆角正是让系统显得一致的关键——一个多余的 10px 圆角，比一个错误的颜色更显眼。",
  },
  "/foundations/surface": {
    title: "表面",
    lead: "Luc UI 的深度来自一次明度跃迁加一条极细的描边。层级是有序的，组件占据明确的层级，而不是随手挑一个灰色。",
  },
  "/foundations/shadow": {
    title: "阴影",
    lead: "阴影是配角。在深色模式下它主要用于强化分层，真正的深度线索是表面明度差。Luc UI 中没有任何地方使用大而通用的投影。",
  },
  "/foundations/glow": {
    title: "辉光",
    lead: "辉光是 LUC 身份的一部分，并且被严格配给。它只用于标记焦点与选中——不做装饰，不做被动表面，同一时刻不超过一个元素。",
  },
  "/foundations/motion": {
    title: "动效",
    lead: "一套动效语法：简短的时长词汇、少量缓动曲线，以及为每个动画准备好的减弱动效答案。没有组件自行发明时长。",
  },
  "/foundations/spatial": {
    title: "空间语言",
    lead: "深度是一套系统，不是装饰。一个深度标尺、四个层级台阶、一种按压手势，覆盖了从 Button 到 Dialog 再到表格行的每一个表面。",
  },
  "/foundations/themes": {
    title: "主题与排版",
    lead: "主题是一个属性，而不是一份样式表。一个色板就能改变所有组件的品牌强调色，一个字体属性就能重新指向正文、标题与等宽角色。两者都可以限定作用域，因此既能作用于整个文档，也能只作用于一张卡片。",
  },
  "/foundations/personality": {
    title: "视觉人格",
    lead: "色板改变色相，字体改变声线，视觉人格改变材质。一个属性同时移动几何、密度、排版比例与动效物理，组件本身无需分叉。",
  },

  /* ---------------------------------------------------------------- 组件 */
  "/components": {
    title: "Luc UI 提供什么",
    lead: "公开组件家族的全景图。每一项都链接到对应的文档页，而它们全都是从 @luc/ui 真实导出的——这一页没有任何组件是重新实现的。",
  },
  "/components/buttons": {
    title: "按钮",
    lead: "下一步要执行的动作：六种变体、三种尺寸，每个区域只用一个主要按钮，其余依次退让。",
  },
  "/components/cards": {
    title: "卡片与面板",
    lead: "承载单个对象的容器：默认安静，只有整块表面真的可点击时才表现为可交互。",
  },
  "/components/badges": {
    title: "徽标与标签",
    lead: "徽标陈述它所依附内容的既成事实，标签是可以移除的可编辑标记。两者都限定在语义色范围内，没有装饰色。",
  },
  "/components/tabs": {
    title: "选项卡",
    lead: "在相关内容的多个面板之间切换，并带完整的标签键盘契约。一个共享指示器在触发器之间滑动并缩放：Tabs 用于导航，SegmentedControl 用于选择。",
  },
  "/components/selection": {
    title: "选择控件",
    lead: "复选框、单选框与开关是密集界面里用户读得最多的组件。每一次状态变化都只做一次快速动画，而且只作用于真正变化的那部分。",
  },
  "/components/select": {
    title: "下拉选择",
    lead: "从一个已知的有限集合中选一个值。Radix 提供 listbox 的 ARIA 模型、首字匹配与焦点行为；LUC 提供触发器外观（与 Input 完全一致）与菜单表面。需要搜索就用 Combobox，需要执行操作就用 CommandMenu。",
  },
  "/components/combobox": {
    title: "组合框",
    lead: "先搜索，再选择。Downshift 负责 WAI-ARIA combobox 契约——活动项记账、游走高亮、Home/End、首字匹配、Escape 与 Enter；LUC 负责字段、菜单、分组行以及加载与无结果状态。这里不会发起任何请求。",
  },
  "/components/slider": {
    title: "滑块",
    lead: "用于阈值、回看窗口与权重的连续数值控件：滑块很小，命中区域大得多，数值只在使用过程中显示。",
  },
  "/components/inputs": {
    title: "输入",
    lead: "所有文本输入共用一套外观，相邻字段不会长得不一样。",
  },
  "/components/number": {
    title: "数字、货币与百分比",
    lead: "一个数值控件，三种单位契约。组件上报的值永远是规范单位下的纯数字——格式化只是呈现，永远不会改写你存下来的东西。",
  },
  "/components/password": {
    title: "密码输入框",
    lead: "带显示切换的密码字段，没有别的花样。没有密码策略，没有强度表演，也从不阻止粘贴——拒绝粘贴的字段会同时毁掉密码管理器与长口令。",
  },
  "/components/otp": {
    title: "一次性验证码",
    lead: "六个可见格子叠在一个真实输入框上。可以输入、可以整段粘贴、可以用方向键移动——屏幕阅读器听到的是一个带标签的字段，而不是六个无标签的盒子。",
  },
  "/components/file-upload": {
    title: "文件选择与上传",
    lead: "两种词汇表，加一个传输界面：普通附件用紧凑行，拖放本身是重点时用更大的投放目标，需要让列表本身显示进度时用 FileUpload。它们都不上传任何东西——把 File 对象交给你，然后就停下。",
  },
  "/components/tags": {
    title: "标签输入",
    lead: "把一组短值输入到同一行：关键词、代码、地址。回车或逗号提交，退格删除最后一个标签，粘贴一整串会自动拆成多个标签。",
  },
  "/components/overlay": {
    title: "提示与浮层",
    lead: "两者都从触发元素出现，而不是凭空降临：提示从它展开的一侧滑入 3px，浮层从锚点放大。定位、碰撞处理与焦点行为都由 Radix 提供。",
  },
  "/components/dialog": {
    title: "对话框",
    lead: "一个做得足够扎实的对话框底座：克制的遮罩、平滑的进入、焦点捕获与还原，Escape 与点击外部开箱即用。减弱动效下会收缩为一次淡入。",
  },
  "/components/sheet": {
    title: "侧边面板",
    lead: "用于设置、筛选、详情与导航的贴边面板。它与 Dialog 基于同一个 Radix Dialog 原语，因此焦点捕获、焦点还原、Escape 与遮罩行为都是 LUC 已经交付的成熟实现。手势抽屉不在范围内：Sheet 是面板，不是可滑动卡片。",
  },
  "/components/menus": {
    title: "菜单",
    lead: "DropdownMenu 与 ContextMenu 是同一套菜单语言的两种触发方式：附着在触发器上的操作，或附着在目标上的操作。Radix 负责焦点、首字匹配、子菜单与 Escape，LUC 负责表面。",
  },
  "/components/command": {
    title: "命令面板",
    lead: "用于执行操作的面板：导航、动作、开关。cmdk 负责过滤、排序、活动项模型与滚动定位；LUC 负责面板布局、搜索框、分组节奏、活动行语言与快捷键列。",
  },
  "/components/accordion": {
    title: "折叠面板与展开区",
    lead: "可开合的区块，ARIA、方向键与 roving focus 只实现一次。面板不会弹出，而是像 Popover 和 CardStack 一样落位。",
  },
  "/components/toggle": {
    title: "Toggle、ToggleGroup 与 Toolbar",
    lead: "相互独立的开关控件，以及一个观点：按下的控件应该陷进面板，而不是翻转颜色。",
  },
  "/components/avatar": {
    title: "头像与评分",
    lead: "人、团队或 agent 的身份标识。回退态是被设计过的，色相由名字确定，可访问名称只有一个字符串。",
  },
  "/components/pagination": {
    title: "分页",
    lead: "在已知总量的结果集里翻页，使用人们真正会用的每页行数。窗口是推导出来的：当前页停在相邻页中间，两端只在确实很远时才收成省略号。",
  },
  "/components/alert-dialog": {
    title: "确认对话框",
    lead: "用于无法撤销的操作确认：安全答案位于首个焦点位置，且无法通过点击遮罩关掉。",
  },
  "/components/timeline": {
    title: "时间线与步骤条",
    lead: "带时间的事件序列与进度步骤条。两者都是有序列表，因为序列有顺序，屏幕阅读器应该被告知。",
  },
  "/components/carousel": {
    title: "轮播与宽高比",
    lead: "基于平台自带 scroll-snap 的横向内容轨，再加上它缺少的两件事：控件与键盘契约。",
  },
  "/components/field-parts": {
    title: "字段",
  },
  "/components/toast": {
    title: "轻提示",
    lead: "不抢焦点的反馈。所有语气共用一个不透明表面，语义色由 2px 色条与图标承载，而不是一整片绿色。提示通过实时区域播报、自动消失、悬停暂停，并尊重减弱动效。",
  },
  "/components/alert": {
    title: "提示条与说明块",
    lead: "一个表面，两种意图。Alert 报告已经发生的事情，Callout 解释长期有效的信息。除非你主动要求，两者都不会向辅助技术播报。",
  },
  "/components/empty-state": {
    title: "空状态",
    lead: "可复用的“这里还没有内容”表面，让页面、卡片、分栏与表格区域不必第四次重新拼出图标＋标题＋段落＋按钮。",
  },
  "/components/feedback": {
    title: "反馈",
    lead: "按用户需要理解的内容选择指示器。骨架屏展示形状，加载指示说明有小事正在发生，进度条说明还要多久。",
  },

  /* ---------------------------------------------------------------- 表单 */
  "/forms": {
    title: "表单",
    lead: "Luc UI 不接管表单状态——React Hook Form、TanStack Form 或一个 reducer 都能用。它负责的是每个产品都要重写的那部分：统一的字段结构、统一的提交生命周期、统一的错误汇总，以及与系统其余部分一致的输入控件。",
  },
  "/forms/validation": {
    title: "校验",
    lead: "每条消息只有一个归宿。必填与格式错误放在字段下方，提交失败会生成一个汇总并把链接指回出错的字段，而服务器自身的失败是表单级消息——不是一条转瞬即逝的提示。",
  },
  "/forms/async": {
    title: "异步校验与提交",
    lead: "可用性检查、慢速保存与服务器拒绝——全部是模拟的，没有一个真实网络请求。有意思的是规则：进行中的检查是一条安静的状态，成功只对真正校验过的东西显示，拒绝则是表单级消息。",
  },
  "/forms/sections": {
    title: "分组与可重复行",
    lead: "长表单是一份文档：有真实标题的分组、需要时使用的 fieldset，以及带添加、删除与重排的可重复行。外观是 LUC 的，数组住在你的状态里——或者住在 useFieldArray 里。",
  },

  /* ------------------------------------------------------------ 日期时间 */
  "/date-time/calendar": {
    title: "日历",
    lead: "日期网格比看起来难得多：键盘导航、随语言变化的周起始日、仍可聚焦的不可用日期，以及不需要点 120 次的年份跳转。网格语义由 React Aria 提供，每一个像素由 LUC 决定。",
  },
  "/date-time/date-picker": {
    title: "日期选择器",
    lead: "一个带日历的分段字段。每一段都是有标签的 spinbutton，因此整个值都能用键盘编辑——也不存在需要猜的 “2/3/4”，因为顺序由语言环境决定。",
  },
  "/date-time/date-range": {
    title: "日期区间",
    lead: "两个日期，首尾都包含，日历旁是调用方自己定义的预设。LUC 不写死任何业务窗口：“最近 7 天”是你传进来的预设，而不是组件的功能。",
  },
  "/date-time/time": {
    title: "时间",
    lead: "一天中的时间就是墙上时间：没有日期，没有时区。14:30 在哪里读都是 14:30——所以这个控件没有时区选择，也没有换算。",
  },

  /* ---------------------------------------------------------------- 数据 */
  "/data/metrics": {
    title: "指标",
    lead: "同样的四个原语既能渲染金融数字，也能渲染 SaaS 与基础设施数字。这一层完全不知道比特币是什么。",
  },
  "/data/statuses": {
    title: "状态与新鲜度",
    lead: "在数据产品里，“这个有多旧”是数字含义的一部分。两个原语都能让时效与健康度可见，而不必发明新的颜色。",
  },
  "/data/table": {
    title: "数据表格",
    lead: "一张真正的表格，而不是电子表格。语义化标记让屏幕阅读器与浏览器的页内查找继续可用，列则描述意图——数值、货币、百分比、状态、迷你图——而不是在每一屏重复对齐与格式化规则。",
  },
  "/data/table-virtualized": {
    title: "虚拟化表格",
    lead: "当瓶颈是 DOM 而不是数据时的可选虚拟化。可见行仍然是真正的表格行——两行隐藏的占位行维持布局——所以语义不会退化成绝对定位的 div。",
  },

  /* ------------------------------------------------------------ 应用框架 */
  "/application": {
    title: "应用外壳",
    lead: "应用外框：侧栏一列、吸顶顶栏、可滚动主区域与可选状态条。它负责地标、跳过链接、切换到抽屉式导航的响应式行为，以及滚动模型。",
  },
  "/application/navigation": {
    title: "AppShell",
    lead: "产品的各个地标——侧边栏栏位、吸顶顶栏、可滚动的主区域，以及可选的状态条——再加上填充它们的导航模型。模型是数据，路由器由产品注入：三者分开，页面才不会只存在于某一个入口。",
  },
  "/application/workspace": {
    title: "工作区",
    lead: "可调整大小的分栏、专注模式、检查器，以及刷新后仍然保留的本地布局。它不是拖拽式仪表盘：布局就是组件树，所以一个分栏不会被拖到代码没有描述的地方。",
  },
  "/application/outline-drawer": {
    title: "大纲抽屉",
    lead: "可折叠的右侧导航器：分组用于跳转，条目用于锚点，同一时刻只展开一组。同一棵树在移动端复用为 Sheet。",
  },
  "/application/url-state": {
    title: "URL 状态",
    lead: "URL 应该描述一个可复现的视图，而不是一棵 React 树。可分享状态放进地址栏，个人呈现偏好放进本地存储，瞬时交互状态哪里都不放。",
  },
  "/application/packaging": {
    title: "打包发布",
    lead: "一个真正的包，而不是一堆 TypeScript 文件。编译后的 ESM、生成的类型声明、精心规划的子路径导出、一份公开样式表，以及一个证明 import Button 仍然只是 import Button 的消费者冒烟测试。",
  },

  /* ---------------------------------------------------------------- 动效 */
  "/motion": {
    title: "动效与创意效果",
    lead: "Luc UI 的动效词汇表。每一项都是公开原语，都有减弱动效路径，而且每一项都能在页面上现场触发、重复与对比。",
  },
  "/motion/signature": {
    title: "标志性动效",
    lead: "V2.0 新增的交互层：按下墨迹、极光表面、数据光束、放大停靠栏与无缝滚动带。全部由公开 API 驱动，全部尊重减弱动效，全部可以现场调参。",
  },
  "/motion/spatial": {
    title: "空间动效",
    lead: "V3.0 新增的第二代创意交互：视差分层、几何轨道、原地形变、动态排版、卡组深度与选择光束。六个能力族各对应一个公开导出，全部由同一块控制面板驱动。",
  },
  "/motion/kinetic": {
    title: "高级动效与动感交互",
    lead: "@luc/ui 里全部动感效果，都由同一份强度配置驱动——并且在减弱动效下都会立即切换状态。",
  },
  "/motion/border-glow": {
    title: "边缘辉光",
    lead: "边缘上的一束光。静止时什么都没有，悬停或聚焦时出现一条细强调线，选中时保持一圈平静的环。没有 canvas，没有常驻的 JavaScript——只有一个被遮罩的圆锥渐变。",
  },
  "/motion/spotlight": {
    title: "聚光表面",
    lead: "会察觉指针的表面。光层在表面颜色之上、内容之下，透明度只有个位数百分比，所以任何需要阅读的内容都不会失去对比度。",
  },
  "/motion/shimmer": {
    title: "微光",
    lead: "一次轻柔的高光从表面掠过。这是 Luc UI 的加载语言——一个承载形状的骨架屏，而不是只会说“等等”的转圈。",
  },
  "/motion/number-ticker": {
    title: "数字滚动",
    lead: "数字移动到新状态，而周围什么都不会动。宽度被预留，数字等宽，滚动快到足以读作精确而不是表演。",
  },
  "/motion/reveal": {
    title: "入场动效",
    lead: "有意图的内容入场：一次短暂的淡入加几像素位移，只在第一次被看到时发生。减弱动效下元素只是出现在那里。",
  },

  /* ---------------------------------------------------------------- 图表 */
  "/charts": {
    title: "图表系统",
    lead: "一个是渲染层，两种引擎：分析图形用 Apache ECharts，金融分栏用 TradingView Lightweight Charts。渲染只是基础设施——提示、图例、区间、标注、同步与全屏都由 Luc UI 提供。",
  },
  "/charts/architecture": {
    title: "图表系统如何组成",
    lead: "两种引擎，一种体验。渲染引擎属于基础设施：它们只画像素；而读者真正感知的一切——提示、图例、区间、标注、同步、全屏——都由 Luc UI 负责。",
  },
  "/charts/timeseries": {
    title: "折线与面积",
    lead: "一个组件覆盖整条折线家族：平滑、阶梯、面积、区间带、堆叠、正负值与缺失值，都是序列的属性，而不是独立的图表类型。",
  },
  "/charts/comparison": {
    title: "按分类比较大小",
    lead: "柱状图只回答一个问题：这些分类之间差多少？分组、堆叠与方向是同一个组件的属性；瀑布图与正负柱状图有自己的词汇表，因为它们的形状本身承载含义。",
  },
  "/charts/distribution": {
    title: "样本的形状",
    lead: "直方图与箱线图回答不同的问题：直方图展示形状，箱线图同时比较多个样本。两者都只接收准备好的数值——Luc UI 从不分箱，也从不判定什么是离群点。",
  },
  "/charts/statistical": {
    title: "统计图",
    lead: "分布、一致性与不确定性。这里每个数值都由调用方准备好：组件库画出给它的 ECDF、给它的分位数、给它的区间，这样图表里的数字只对一个地方负责。",
  },
  "/charts/scientific": {
    title: "科学图",
    lead: "商业图表表达不了的形状：相图、箭头场、频谱图、三元组成。它们都接收准备好的数据，而唯一不可避免的变换——河流图的布局——由引擎完成并在契约中写明。",
  },
  "/charts/workflow": {
    title: "流程图",
    lead: "运维产品常用的形状：哪个任务在什么时候运行、两个周期如何对比、什么发生了变化、变化多少。它们都不推断状态。",
  },
  "/charts/quantitative": {
    title: "量化图",
    lead: "只做展示。本页没有任何一个指标由组件库计算：回撤、隐含波动率、有效前沿与因子暴露全部是传入的。",
  },
  "/charts/multidimensional": {
    title: "多维、层级与地理",
    lead: "这三个家族都需要行数据之外的某种东西——共享标尺、父子关系或地图——因此每一个都写明调用方必须提供什么，并拒绝猜测。",
  },
  "/charts/catalog": {
    title: "图表目录",
    lead: "Luc UI 能画的每一种图表，以及诚实的状态标注。别名与单纯外观变体不计入不同图表类型。",
  },
  "/charts/relationship": {
    title: "散点与气泡",
    lead: "当两个准备好的度量可能一起变化时，关系图就是正确答案。象限与回归线属于标注，图表本身从不拟合模型。",
  },
  "/charts/uncertainty": {
    title: "不确定性与证据",
    lead: "预测锥、拟合好的曲线、状态条、事件研究与分布——当一条线已经不够用时，研究页面需要的图表都在这里。这里的任何数值都不是在 UI 里算出来的。",
  },
  "/charts/matrix": {
    title: "热力图、相关性与日历",
    lead: "矩阵是这套系统里最密集、也最容易做坏的图表。单元格保持接近正方，标签宁可截断也不旋转到互相重叠，每个矩阵都带一个说明颜色含义的图例。",
  },
  "/charts/composition": {
    title: "整体与部分",
    lead: "构成类图表最容易被误用。只有当各部分确实构成整体、而且数量不多时，环形图才成立；矩形树图与旭日图承载层级；漏斗图展示阶段性流失。",
  },
  "/charts/flow": {
    title: "桑基图与关系网络",
    lead: "当路径比总量更重要时，流向图才值得占地方。连线保持安静，颜色由节点承载，两种图都不会被当作装饰使用。",
  },
  "/charts/radial": {
    title: "雷达图与仪表盘",
    lead: "径向图表用途专一，因此保持克制：两到三个不带标记点的雷达序列，以及细轨道、单条强调描边和等宽读数的仪表盘。没有高光圆弧，没有指针，没有彩虹渐变。",
  },
  "/charts/composed": {
    title: "混合标记与双轴",
    lead: "第二条轴等于宣称两个度量共享形状但不共享单位。API 强迫这个宣称显式表达：每个序列都要说明自己属于哪条轴，而轴自带格式化器。",
  },
  "/charts/research": {
    title: "研究型图表",
    lead: "这些是组合而不是新引擎：回撤是面积图，状态图是带参考带的 z-score，期限结构是曲线对比。每个数值到手时都是准备好的。",
  },
  "/charts/financial": {
    title: "价格、成交量与分栏",
    lead: "LUC 适配器背后的 Lightweight Charts：K 线颜色、十字光标、分栏、叠加、区间与同步全部来自设计系统。调用方永远不直接调用 createChart，也永远拿不到引擎句柄——除非它明确要求。",
  },
  "/charts/sync": {
    title: "同步研究栈",
    lead: "三张图表、两种不同引擎、一个十字光标、一个可视区间。同步属于 LUC 而不是引擎：总线传递规范化后的时间戳与窗口，因此 ECharts 与 Lightweight Charts 能互相跟随，而彼此都不知道对方存在。",
  },
  "/charts/interaction": {
    title: "提示、缩放、框选与全屏",
    lead: "交互是图表不再只是图片的地方。提示表面、十字光标、缩放行为与全屏研究视图都由 LUC 拥有，因此没有一个交给引擎的默认实现。",
  },
  "/charts/crosshair": {
    title: "专业金融十字光标",
    lead: "在指针位置读取时间与数值，让 Tooltip 继续显示真实观测，并通过拖动各个笛卡尔坐标轴来缩放视图。",
  },
  "/charts/performance": {
    title: "密集时间序列",
    lead: "图表必须扛得住真实的数据量。ECharts 用自己的渐进渲染路径绘制这些数据，动画被限流，超过几百个点后直接丢弃标记点，而不是画出来再隐藏。",
  },
  "/charts/sizing": {
    title: "语义化图表尺寸",
    lead: "高度跟随图表的信息几何：矩阵随年份行增长，横向柱状图随分类数增长，紧凑读数保持紧凑。色域可以设为稳健模式，避免一个离群点把其余全部压平。",
  },

  /* ------------------------------------------------------------ 组合模式 */
  "/patterns": {
    title: "组合示例",
    lead: "小而真实的组合，展示这套系统协同工作的样子。每一个都只由 @luc/ui 组件构成——没有页面私有的样式语言。",
  },
  "/patterns/research-workspace": {
    title: "动量研究 — BTC-USD",
  },
  "/patterns/industries": {
    title: "跨行业",
    lead: "Luc UI 成长于密集的分析场景，这一点体现在它的表格、图表与工作区中。但它不只属于这个领域。下面每个小品都由相同的公开组件搭建——只有色板与字体声线不同。",
  },
  "/patterns/table-filters": {
    title: "带筛选的表格",
    lead: "一张密集表格配一条读起来像一个整体的筛选栏。时间窗口与标的分用 Select 与 Combobox 选择，多选维度是建立在表格自身分面值之上的 facet filter。每个控件都是 LUC 组件，表格始终是你要读的东西。",
  },
  "/patterns/table-date-filter": {
    title: "带日期区间的表格",
    lead: "表格上方的时间筛选。区间是两个日历日期，标的是可搜索列表，而表格本身仍然是表格：格式化后的值进去，不拉取数据，不重新计算。",
  },
  "/patterns/chart-date-filter": {
    title: "带日期区间的图表",
    lead: "在一个准备好的序列上加一个研究窗口。区间选择器是唯一会改变绘制内容的控件，数据层始终属于调用方：LUC 只渲染数据行，不负责获取。",
  },
  "/patterns/chart-table": {
    title: "图表加数据表",
    lead: "canvas 里没有文字，因此图表无法向屏幕阅读器描述自己。诚实的做法不是写一个聪明的 aria-label，而是把同一份数据放进语义化表格，只差一次按键。在图例里隐藏一个序列，也应当隐藏对应的列。",
  },
  "/patterns/data-details": {
    title: "表面背后的数据",
    lead: "每个研究表面都是对某个数据集的一次读取。数据集本身始终可达——以受限面板的形式、从表面自己的控件打开，而不把页面往下推。",
  },
  "/patterns/command-palette": {
    title: "表格快捷操作",
    lead: "在密集表格上按下 ⌘K。面板负责排序、显示列、清除筛选并对选中项执行操作——每个命令都只是几行普通的表格状态，因为面板不过是工具栏所用的同一套公开 API 的另一个消费者。",
  },
  "/patterns/settings-form": {
    title: "面板中的设置",
    lead: "V0.3 给了 LUC 一个 Sheet，V0.4 给了它表单。吸底操作区、可滚动主体、保持面板打开的校验，以及只有在保存真正成功之后才出现的轻提示。",
  },
  "/patterns/workspace": {
    title: "研究工作区",
    lead: "一个通用组合：设置在 Sheet 里，控件在工具栏里，图表在表格上方，反馈通过轻提示传达。没有业务逻辑，也没有 Luc Quant 的导航——只有 V0.3 的组件作为一个系统工作。",
  },

  /* ---------------------------------------------------------------- 实验 */
  "/experiments/design-lab": {
    title: "设计实验室",
    lead: "同一个联动选择流程的三种处理方式：表格选择驱动图表高亮与检查器详情。数据、交互模型与可访问性完全相同，改变的只有视觉语言。",
  },
  "/experiments/design-lab/precision-instrument": {
    title: "精密仪器",
    lead: "刻度分明，测量本身说话。极细的描边、精确的几何、克制的界面外壳，以及清晰的选中与焦点状态。",
  },
  "/experiments/design-lab/editorial-research": {
    title: "编辑式研究",
    lead: "结论先行，证据随后。排版承载层级，证据以阅读顺序排列，装饰性表面降到最低。",
  },
  "/experiments/design-lab/focused-workspace": {
    title: "专注工作区",
    lead: "选择在表格、图表与检查器之间联动。多栏组合、上下文检查器、受控状态，以及有目的的过渡。",
  },

  /* ------------------------------------------------------------ 第三方集成 */
  "/integrations/tradingview": {
    title: "提供商行情数据，LUC 形态",
    lead: "TradingView 嵌入组件覆盖了产品不该自己重建的市场视图：标准图表、报价、筛选器、热力图、新闻与宏观日历。它们补充而非替代 LUC 自己的图表引擎，并且始终是提供商数据——LUC 从不读取组件来获取数值。",
  },
  "/integrations/tradingview/charts": {
    title: "提供商图表",
    lead: "四种图表组件，从卡片里的迷你走势到完整的 TradingView 终端。当一张标准行情图就足够时使用它们——一旦数据、叠加或交互必须由你掌控，LUC 自己的引擎就会接手。",
  },
  "/integrations/tradingview/heatmaps": {
    title: "颜色即数据",
    lead: "热力图是 LUC 刻意不重新着色的家族：红与绿代表涨跌，用 LUC 的强调色重绘会毁掉含义。只有周边的外壳会被主题化。",
  },
  "/integrations/tradingview/screeners": {
    title: "可筛选的市场",
    lead: "筛选器就是一张带提供商自有列、预设与过滤条件的表格。LUC 给它一个有边界的容器和一个主题；筛选逻辑、列与数据都仍属于 TradingView。",
  },
  "/integrations/tradingview/symbol-details": {
    title: "一个标的，四个层次",
    lead: "关键数据、提供商计算的评级、基本面与公司简介。LUC 不计算也不存储其中任何一个值——它们是 TradingView 的数据，呈现在 LUC 的布局里。",
  },
  "/integrations/tradingview/news-calendars": {
    title: "价格之外的信息",
    lead: "新闻、宏观事件与全球宏观地图。这些内容都不经过 LUC：新闻流、日历与指标数据都归提供商所有，封装层只决定它们放在哪里。",
  },
  "/integrations/tradingview/themes": {
    title: "两个层次的定制",
    lead: "Web Components 通过提供商公开的 CSS 自定义属性接收 LUC 的令牌；iframe 组件只能使用提供商自己的主题配置。切换主题，看看哪些部分跟着动。",
  },
  "/integrations/tradingview/tickers": {
    title: "行情条、紧凑标签与卡片",
    lead: "四种行情组件对应四种空间形状。四者都是 Web Components，因此通过提供商公开的令牌桥接继承 LUC 的颜色与字体。",
  },
  "/integrations/tradingview/watchlists": {
    title: "市场板块",
    lead: "自选列表组件把市场总览放进面板：指数、外汇、加密与个股，同时保留提供商自己的交易时段状态与涨跌计算。",
  },
  "/integrations/tradingview/patterns": {
    title: "组合出的市场页面",
    lead: "三个把提供商组件组合成页面的示例。重点不是组件本身，而是把状态串联起来的是调用方，而不是提供商。",
  },

  /* -------------------------------------------------- 组件（Phase 5） */
  "/components/tree-view": {
    title: "TreeView",
    lead: "一个带游走焦点、展开状态与选中态的层级结构。整棵树只有一个 Tab 停靠点，方向键沿着当前可见的行移动，选中态用同一套「井」深度表达。",
  },
  "/components/board": {
    title: "排序与看板",
    lead: "拖拽排序不需要拖拽库：指针走浏览器原生拖放协议，键盘走「拿起—移动—放下」，并由实时区域逐步播报。",
  },
  "/components/color-picker": {
    title: "取色器",
    lead: "把颜色变成十六进制字符串：一个色块触发器、由调用方提供的调色板，以及始终能作为文本取得的取值。",
  },
  "/components/transfer-list": {
    title: "穿梭框",
    lead: "用键盘在两个集合之间移动条目：右侧的 id 就是全部取值，因此表单只需保存一个数组。",
  },
  "/components/media": {
    title: "图库、灯箱与对照",
    lead: "图库是索引，灯箱是单张，对照滑块是两张图之间的差值——三者都建立在共用 Dialog 与真实 range 输入框之上。",
  },
  "/components/notifications": {
    title: "通知与引导巡览",
    lead: "通知中心承载累积下来的状态，引导巡览解释界面本身；两者都不把文案写死在组件里。",
  },
  "/components/ai": {
    title: "AI 界面",
    lead: "一组与模型无关的界面原语：消息、流式文本、工具调用与 agent 状态，不含模型、传输层与厂商 SDK。",
  },

  /* -------------------------------------------------- 图表（Phase 5） */
  "/charts/diagnostics": {
    title: "诊断图表",
    lead: "自相关、生存曲线、精确率—召回率与特征重要性。全部按传入值绘制：库负责渲染，不负责估计。",
  },
  "/charts/networks": {
    title: "网络与层级图",
    lead: "和弦图把传入的方阵变成角度，树状图把传入的合并记录变成坐标——布局是几何，不是统计。",
  },
  "/charts/geospatial": {
    title: "地理图表",
    lead: "分级统计图使用调用方注册的地图；轨迹图会展开跨越 ±180° 的航段。LUC 不打包任何边界数据。",
  },
  "/charts/surfaces": {
    title: "三维曲面",
    lead: "真正的三维曲面，没有三维引擎：旋转、正交投影、按深度排序后从后往前绘制，并与其它图表共用同一个外壳。",
  },

  /* -------------------------------------------------- 文档（Phase 9） */
  "/docs": {
    title: "快速开始",
    lead: "Luc UI 是一个 React 与 TypeScript 设计系统：令牌、无障碍原语、空间动效、数据展示与图表，一个组件一个组件地写文档。",
  },
  "/docs/installation": {
    title: "安装",
    lead: "一张样式表、一个 provider，以及从各自子路径引入的组件。这里没有猜测：命令与组件页用的是同一个模块。",
  },
  "/docs/theming": {
    title: "主题定制",
    lead: "主题是文档元素上的四个属性。令牌据此解析，所以一个产品可以换掉整体外观，而不必覆盖任何一个组件。",
  },
  "/docs/reference": {
    title: "API 参考",
    lead: "把每一个有文档的条目放在一处，按侧边栏的分组方式分组。组件名、引入路径与导出名都是标识符，保持英文。",
  },
  "/blocks": {
    title: "区块",
    lead: "一个区块是页面中的一节，由公开组件拼装而成。区块是供你阅读和复制的源码，而不是包导出——所以每一个区块都会列出它用到的导出，以及你必须提供的数据。",
  },
  "/templates": {
    title: "模板",
    lead: "一个模板是一整个页面：组件与区块已经接好线，布局和内容结构都已确定。每一个模板都是本站里可以真实打开的参考页——打开它、读源码、复制你需要的那部分。",
  },

  /* -------------------------------------------------- 工作室（Phase 9） */
  "/studios/charts": {
    title: "图表工作室",
    lead: "把你的数据喂给真实图表，再把画出它的代码复制走。预览与代码来自同一份状态。",
  },
  "/studios/motion": {
    title: "动效工作室",
    lead: "用动效原语真实的 props 对照它读取的强度档位来调——看到差别，而不是争论差别。",
  },
  "/studios/themes": {
    title: "主题工作室",
    lead: "选一个色板、一种字体语气、一种性格和一层纵深，同一批组件随之变化，然后复制产生它的那一行。",
  },
  "/studios/composer": {
    title: "模板编排器",
    lead: "从页面原型开始，移动或移除画廊里已有的区块，然后复制这份排布。",
  },

  /* ------------------------------------- 浏览与视觉层（Phase 10A） */
  "/explore": {
    title: "找到需要的东西",
    lead: "Luc UI 是一份目录，而目录只有能让你从当前位置进入才有用：按名字、按你要构建的东西，或按它应该长成的样子。最上面是目录的真实规模，接着是为初次到访挑选的条目，最后是两条浏览轴线。",
  },
  "/explore/browse": {
    title: "全部能力",
    lead: "目录中的每一条目，配以这套库能够诚实支持的三类筛选：它是什么、你在构建什么、它应该长什么样。筛选结果保存在 URL 里，所以可以直接分享。",
  },
};
