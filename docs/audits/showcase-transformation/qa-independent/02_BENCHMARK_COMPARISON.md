# 02 — 与成熟组件站的对照

## 1. 方法与限制

- 仓库既有研究：`02_COMPETITOR_RESEARCH.md`（9 个站点，CP-01…CP-10 模式）。
- **我自己的补充观测**（可复现）：对竞品文档页取初始 HTML 并统计结构关键词。
  这只能证明"这些能力出现在服务端渲染的 HTML 里"，不能证明交互细节。

| 站点/页面 | HTTP | 静态 HTML 词数 | 观测到的结构关键词 |
|---|---|---|---|
| `motion-primitives.com/docs/text-effect` | 200 | 7115 | `Preview`×16、`Code`×16、`Installation`、`npx`、`Props`、`Variant`×97 |
| `mantine.dev/core/button` | 200 | 2737 | `Code`×437、`Copy`×25、`Props`×12、`Usage` |
| `radix-ui.com/primitives/docs/components/dialog` | 200 | 7553 | `Code`×97、`Copy`×16、`Accessibility`×3、`Preview`×3 |
| `reactbits.dev` | 200 | **568** | 客户端渲染 → **不予结论** |
| `ui.shadcn.com/docs/components/button` | 307 | — | 重定向，未跟随 → 不予结论 |

> 限制声明：本文没有截取竞品的截图，也没有观察其交互。凡涉及交互的判断均来自仓库既有
> 研究（标注 CP-xx），我的观测只用于确认"多示例 + 预览/代码切换 + 复制 + Props 表"
> 在这些站点的服务端 HTML 中确实存在。

## 2. 逐项对照

| 维度 | 成熟做法 | LUC UI 现状（实测） | 差距 |
|---|---|---|---|
| **首屏是否看到真东西** | 首页/详情页首屏就是活体组件 | 详情页首景 369–500px ✅；`/motion` 图库首个示例在 **1169px** ❌；`/components` 目录**只有 chip，无缩略预览** ❌ | **P2**（发现面弱） |
| **一个页面多个具名示例** | Motion Primitives：6 个示例，各自 Preview/Code（HTML 观测 `Preview`×16 / `Code`×16） | Motion 详情页是"1 个大示例 + 长文"；MOT-002 未实现 | **P1**（CP-07） |
| **目录卡片即发现面** | Magic UI / 21st（CP-09）；LUC 自己的 `/visuals/elements` 就是这么做的 | `/components` = 13 组 chip；`/charts` = 12 张文字卡；只有 `/visuals/elements` 有真实预览卡 | **P2**（CP-09） |
| **Props 表位置** | shadcn/Mantine：用法在前、API 在后 | LUC 已是 purpose→preview→usage→API ✅ | 已达标（CP-06） |
| **代码与示例同屏可切换** | shadcn/Radix/Motion 均有 | Workbench 有 Code 折叠 + 复制；但详情页**没有 Preview/Code 标签切换** | **P2**（CP-01） |
| **右侧目录只列页面章节** | Radix Themes 9 行 | 实测 `/visuals/elements` 10 行、`/motion` 6 行、`/components` 0 行、326 路由 0 失败 ✅ | 已达标（CP-04） |
| **安装命令集中** | Mantine/Radix 每页重复 | LUC 集中在 `/docs/installation` 并在详情页链接 ✅ | 已达标（CP-05） |
| **统计性目录页** | 竞品通常不把"页面数"当"能力数" | `/explore` 把 4 个 Visuals **页面**写成 "4 visual elements"，把 `/blocks` 1 页写成 "1 block" ❌ | **P1**（见 C-05） |
| **中文/多语言** | 成熟的展示站要么不做多语言，要么整页一致 | LUC 支持 `/zh` 且 chrome/sidebar/大部分正文已翻译，但**注册表生成的导语 100% 仍是英文** ❌ | **P1**（见 C-04） |
| **动效页的可理解性** | Motion Primitives：每个效果一个可触发的小例子 | 图库已 26/26 有示例（本轮改进 ✅），但**详情页一例独大**，且 CardStack 的默认视觉不可读 ❌ | **P1**（见 C-02） |

## 3. 结论性判断

LUC UI 在**信息架构与章节纪律**上已经达到成熟站的水平（CP-04/CP-05/CP-06 达标，
右侧目录、安装集中、API 靠后）。它在**"发现面"与"一页多例"**上明显落后：

- 成熟站的做法是"让读者在目录页就看到东西、在一页里看到多个例子"；
- LUC 的目录页仍在"列名字"，Motion 详情页仍是"一个大示例 + 长文"。

这两点是本审计建议优先投入的 UX 方向，且成本可控（MOT-002 与目录预览卡）。
**不建议**照搬竞品的视觉风格或市场页外壳（CP-09 的"marketplace chrome"已被前一轮研究
明确拒绝，我同意）。
