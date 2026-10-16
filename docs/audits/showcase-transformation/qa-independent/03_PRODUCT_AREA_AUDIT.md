# 03 — 九个产品区域的实测质量

度量口径：`artifacts/qa-independent/probe.mjs areas|detail`。所有数字来自真实浏览器
（Chromium 1440×900，容器 `127.0.0.1:60835`）。截图见 `artifacts/qa-independent/shots/`。

名词：**首景** = 页面内第一个真实示例（`data-slot=demo|demo-stage|card-stack|chart`、
`figure`、`canvas`，且排除 header/sidebar/rail 这些 chrome）相对文档顶部的位置。

## 汇总表

| 区域 | 首景位置 | 首景前词数 | 总词数 | 首屏控件 | 目录可用 | 控制台错误 |
|---|---|---|---|---|---|---|
| Home `/` | 1267px* | 190* | 846 | 多 | 侧边栏站点地图 8 行 | 0 |
| Explore `/explore` | 无示例 | — | 460 | 1 | 统计卡 + Featured | 0 |
| Components `/components` | 无预览 | — | 337 | 1 | 13 组 chip + 搜索 | 0 |
| Charts `/charts` | 522px | 82 | 228 | — | 12 张族卡 | 0 |
| Visuals `/visuals` | 350px | 43 | 331 | — | 9 族入口 | 0 |
| Motion `/motion` | **1169px** | **213** | 735 | 12 | 5 组 26 卡 | 0 |
| Blocks `/blocks` | 视口内（≈558px）* | — | 968 | 4 | 12 个 Block | 0 |
| Studios `/studios/charts` | 302px | 35 | 190 | 多 | 4 个 studio | 0 |
| Docs `/docs` | 无示例（索引页） | — | 220 | 0 | 4 个面 | 0 |

\* Home 与 Blocks 的自动度量**低估**了：Home 首屏右侧实际有一个实时组件拼贴
（Actions/Status/Numbers/Density，见 `shots/area-home.png`），Blocks 首屏下半已出现
真实的 Hero Block（见 `shots/area-blocks.png`）。两者都不是缺陷，但我把度量局限写出来，
以免读者据错误数字下结论。

---

## 1. Home — 良好

- 首屏 = 主张（"Precision meets expression."）+ 三个入口 + 实时组件拼贴 + 四个统计。
- 侧边栏列 8 个站点地图入口，可达性没问题。
- **问题**：统计卡写 `catalog entries 282 / components 106 / charts 76 / motion 35`。
  其中 `282` 是"注册表 217 + 站点 65"的合并数（`docs-registry` 输出可证），
  与 Explore 的 106/76/35/1/4 口径**不同源**——两个页面对同一批内容给出不同数字体系，
  属于口径不一致（P2，与 C-05 同源）。

## 2. Explore — 有明确缺陷（P1）

- 页面是"统计卡 + Featured 8 条 + 按用途/美术方向浏览"的**hub**，`Browse all capabilities`
  才是真正的目录（`/explore/browse`）。IA-006（`/explore` 本身成为筛选工具）**未实现**。
- **统计卡口径错误（实测）**：显示 `4 visual elements`、`1 block`。
  源码证据：`discovery.ts` 中 `kind:"visual"` 只有 4 条，全部是 `/visuals*` **页面**；
  `kind:"block"` 只有 1 条（`/blocks`）。而 Visuals 注册 79 个能力、`/blocks` 有 12 个 Block。
  读者会把 Visuals 和 Blocks 判为"几乎没有内容"。→ C-05，**P1**。
- 侧边栏同时列出 "By use case"（9）与 "By art direction"（6），而页面正文也有同名两节，
  存在重复导航（P3）。

## 3. Components — 目录可用但"看不见东西"（P2）

- `103 entries across 13 families`，13 组 chip，顶部有搜索框，侧边栏列同样 13 个族（重复但可接受）。
- **没有任何缩略预览**：读者必须在 13 组、103 个 chip 里点进去才知道长什么样。
  与 CP-09 相反，也与 LUC 自己 `/visuals/elements` 的做法不一致。→ C-08，**P2**。
- 右侧 rail 显示 0 行（目录页主动抑制，本轮 IA-001/UX-004 的结果），正确。
- **Motion 不在这里**：实测 `/components` 页面只有 1 条指向 `/motion` 的链接（侧边栏的区域行），
  目录内**没有 Motion 入口**。→ C-06，**P1**（产品要求已变为"Motion 属于 Components"）。

## 4. Charts — 良好

- `/charts` 首景 522px；12 张族卡；族名与用例一句话清楚。
- 详情页（line/bar）首景 395px、正文 1283–1422 词（偏长，见 C-12）。
- 图表轴标签、单位、legend 在 zh/en 两版都正常渲染（见 `shots/locale-zh-_charts_line-chart.png`）。

## 5. Visuals — 目录质量最好，但本地化与链接有硬伤

- `/visuals` 首景 350px；`/visuals/elements` 是**全站最好的目录**：真实预览卡 + 搜索 +
  9 族筛选 chip + 尺寸/风格信息，与 CP-09 一致。
- 计数三者一致：**79 / 79 / 79**（横幅 / 卡片 / 详情链接）✅
- 复制用法（Copy Usage）存在，`Sizes mini · medium · large · Styles 6/6` 一行信息密度合适。
- **缺陷 1（P1，B 侧）**：`/zh/visuals/elements` 有 **89** 条无前缀内部链接；
  `/zh/visuals` 18 条；`/zh/visuals/docs` 5 条。点击/预取会触发 307 回跳。
- **缺陷 2（P2，B 侧）**：卡片**文案未翻译**。中文页面里显示
  "Metric value / One stated figure with its label, unit and an optional movement — …"，
  家族 chip 里 `Tables` 仍是英文（其余 8 个已翻译）。

## 6. Motion — 图库改好了，详情页仍是一例独大（P1）

- 图库 26 张卡**全部**有真实示例（本轮改进，实测通过）✅；首个示例在 1169px → 一屏之外，
  前面是 213 词的介绍与"Loudness is scoped"卡片（P2）。
- Replay 控件存在；reduced-motion 开关（头部）能把 marquee 压平（实测）✅。
- **CardStack 与 MorphingDialog 的视觉缺陷是两个独立的 P1**，见 `04_FINDINGS.md` C-02/C-03。
- MOT-002（一页多例 + 每例 Preview/Code）**未实现**，而竞品该项是标配。

## 7. Blocks — 内容不错，度量口径要说明

- `/blocks` 首屏内（≈558px）就是真实 Hero Block；12 个 Block 分组清楚；
  每个 Block 标注 `N exports` + "You supply"。
- 侧边栏 "BUILD WITH IT" 下同时列 Blocks 与 Templates（区域声明把 4 个产品放在一个区域内，
  IA-007 未实现）——读者从侧边栏仍分不清 Blocks / Templates / Patterns / Experiences 的差别（P2）。

## 8. Studios — 首屏即有可用控件

- `/studios/charts` 首景 302px、190 词，是九个区域里最"直给"的页面之一。
- 未深入测试四个 studio 的编辑能力（预算所限），列为待验证。

## 9. Docs — 索引清楚，内容偏"内部视角"

- `/docs` 220 词，4 个面（启动/基础/应用外壳/集成）入口清楚；无示例属正常（索引页）。
- `/docs/reference` 是 217 条 symbol 的清单（单页 12 787px 的历史问题仍在：DOC-002 未做），
  但它已按族分组并可跳转。
- `/docs/theming`、`/docs/installation` 面向读者，可读性好。
