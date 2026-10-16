# 05 — Action Plan 独立核对（43 项 + QA-005）

状态口径：**PASS** = 我按该项的验收标准第一手验证通过；**PARTIAL** = 部分达成或存在附加缺陷；
**FAIL** = 未达成；**BLOCKED** = 需所有者决策；**NOT_TESTED** = 本轮未验证（并说明原因）。

`IMPLEMENTED / SELF_TESTED` **不等于** VERIFIED；下表是我的独立结论，不改动原计划。

| ID | 声明状态 | 独立结论 | 我的证据 / 说明 |
|---|---|---|---|
| CMP-001 | IMPLEMENTED | **PASS** | 两条路由 200 且可交互（preview-check 6/6 覆盖 native-select、project-showcase） |
| IA-001 | IMPLEMENTED | **PASS** | 自跑 `outline --all`：0 失败；`/visuals/elements` 10 行、`/motion` 6、`/components` 0 |
| IA-002 | 委托 B | **PASS** | 自测 `/visuals/elements` 重复 id = `[]` |
| IA-004 | 委托 B | **PARTIAL** | 五个资源页仍靠 `/visuals/docs` 作为唯一入口（满足"≥1 入口"），但侧边栏只有 5 行、读者仍需一跳；未做独立可用性评审 |
| IA-005 | IMPLEMENTED | **FAIL** | 头部确为四一级项且四宽度不裁切；但**产品负责人本轮改判** Motion 不应是一级项 → 见 C-06 |
| IA-006 | TODO | **FAIL** | `/explore` 仍是 hub（统计卡 + Featured），真正的目录在 `/explore/browse`；且统计口径错误（C-05） |
| IA-007 | TODO | **FAIL** | Blocks/Templates/Patterns/Experiences 仍共用一个区域（C-12） |
| UX-001 | IMPLEMENTED | **PASS** | 自测 chart 详情页首景 395px（1440×900） |
| UX-002 | IMPLEMENTED | **PASS** | 生成的导语 20 词、不以类名开头（独立读到原文）；但它在中文页未翻译（C-04，独立问题） |
| UX-003 | TODO | **FAIL** | 手写页仍与注册表页结构不同（C-09，实测差 ~40 词/100px） |
| UX-004 | IMPLEMENTED | **PASS** | rail 行数实测：catalog 10 / motion 6 / components 0，326 路由 0 失败 |
| UX-005 | IMPLEMENTED | **PASS** | 7 条路由均有 2–4 个 Related + 前后翻页（自跑 navigation 门禁 + 独立查看页脚截图） |
| WB-001 | IMPLEMENTED | **PASS** | buttons/line-chart/cards 的 Reset 同时还原代码与示例（自写探针） |
| WB-002 | IMPLEMENTED | **PARTIAL** | 宽度控件是**容器宽度**（Full/768/390）且按 ADR-018 措辞诚实；不是真实视口，属已知取舍 |
| WB-003 | IMPLEMENTED | **PASS** | 预设 6/4/4/2、高级带默认折叠、控件分档（自写探针 + 单测 142 通过） |
| WB-004 | IMPLEMENTED | **PASS** | `disabled` 控件均带原因句子（playground 门禁 `silent=0`，我复跑通过） |
| WB-005 | IMPLEMENTED | **PASS** | 跨页持久化成立：line-chart 选 Dark → bar-chart 的 stage `data-theme="dark"` |
| MOT-001 | IMPLEMENTED（未复现） | **PARTIAL** | 交互层面仍无法复现故障（索引会变）；但**视觉缺陷已复现**（C-02）→ 该组件不应记为"通过" |
| MOT-002 | TODO | **FAIL** | Motion 详情页仍"一例独大"，无一页具备多例 Preview/Code（竞品标配） |
| MOT-003 | IMPLEMENTED | **PARTIAL** | 初始索引 0 ✓、Replay ✓（我复跑 motion 门禁通过）；"looping 时 pause" 未实现 |
| MOT-004 | IMPLEMENTED | **PASS** | 图库 26/26 tile 有真实示例（我复跑门禁 + 截图确认） |
| CMP/CHT-001 | IMPLEMENTED | **PASS** | chart 首景 395px；10 条 chart 路由测量一致 |
| CHT-002 | IMPLEMENTED | **PASS** | `/charts/catalog` 每行有 id，深链可定位（自跑 navigation 门禁通过） |
| VIS-001…003 | 委托 B | **NOT_TESTED** | 需逐页视觉评审 45+ 元素详情；本轮只审了目录与三条路由 |
| DOC-001 | PARTIAL | **PASS** | Motion 页与 `/visuals/elements` 已无阶段标签与全大写 QA 断言（中文横幅已翻译） |
| DOC-002 | TODO | **FAIL** | `/docs/reference` 仍是单页 217 symbol（12 787px 结构未拆） |
| DOC-003 | TODO | **FAIL** | 代表页词数 903–1422，全部超 700 词目标（C-10） |
| DOC-004 | TODO | **NOT_TESTED** | 侧边栏描述文案是否"≤12 词、用户语言"未逐条评审 |
| DOC-005 | TODO（需决策） | **FAIL** | 按新决定"活跃公共组件的用法说明必须中文化"，但生成导语 100% 英文（C-04）、Visuals 卡片文案英文（C-07） |
| LEG-001 | BLOCKED | **BLOCKED** | 决策表仍未写入；本审计不替代所有者决策 |
| LEG-002…004 | TODO | **NOT_TESTED** | 未做孤立路由与计数口径的完整盘点（部分见 C-05 的口径问题） |
| LEG-005 | TODO | **NOT_TESTED** | 涉及 `packages/visuals` 内文件，属 B 侧 |
| QA-001 | IMPLEMENTED | **PASS** | 自跑 326/326 healthy |
| QA-002 | TODO | **FAIL** | 无 journey 级验收套件；本轮我自写的探针只是临时替代 |
| QA-003 | TODO | **NOT_TESTED** | 未做 Firefox/WebKit 复核 |
| QA-004 | TODO | **NOT_TESTED** | 未评审视觉基线数量与平台一致性 |
| DEV-001 | IMPLEMENTED | **PASS** | 生产构建/容器水合正常；`allowedDevOrigins` 修复有源码证据（本轮未复跑 dev 门禁） |
| DEV-002 | IMPLEMENTED | **PASS** | 自跑 `qa/standalone.mjs`：0 导入 / 0 请求 / 0 部署变量 |
| DEV-003 | IMPLEMENTED | **PASS** | fixtures 边界规则已写入 `06_LOCAL_DEVELOPMENT_PLAN.md` §11 |
| QA-005（新增） | IMPLEMENTED | **PASS** | `/date-time/time` 在 TZ=UTC 容器中 326/326 通过且无 page error |
| **新发现（无 ID）** | — | — | **C-01（P0）**、**C-02/C-03（P1，组件默认视觉）**、**C-04/C-05/C-06/C-07（P1）**、C-08…C-13 |

## 统计

- PASS：20
- PARTIAL：6
- FAIL：12
- BLOCKED：1
- NOT_TESTED：7

## 需要"下调"的自我报告状态（重点）

1. **IA-005**：自报 IMPLEMENTED，但产品负责人的新决定使其**结论反转**（Motion 不该在顶层）。
   头部实现本身没问题（四宽度实测通过），是**需求变了**，不是实现坏了。
2. **MOT-001**：自报"未复现故障"，但用户投诉的**视觉**问题我复现了（C-02）。
   "无法复现"只对**交互**成立；该项不能作为"组件健康"的证据。
3. **MOT-003**：自报 IMPLEMENTED，实际是 PARTIAL（缺 pause）。
4. **DOC-001**：自报 PARTIAL，我判 PASS（Motion 与 Visuals 阶段标签均已清除）。
5. **UX-002**：其验收标准（≤25 词、不以类名开头）达标，但**中文页未翻译**属独立缺陷 C-04。
