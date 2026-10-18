# Release v1.0.1 visual acceptance

Date: 2026-10-18

This review covers every visual-baseline failure reported by CI run
[`39071692666`](https://github.com/lucxu495/luc-ui/actions/runs/39071692666),
plus the three local Darwin failures reproduced at commit
`c7facb791b68d8cdf65ed57ce2bf6381e1394f4d`.

The source images came from the run's `visual-diffs` artifact
(`12116310788`) and from a local Playwright run against the production
Showcase image. Expected, actual and diff images were inspected for layout
overlap, clipping, missing content, incorrect images, broken theme contrast,
and unstable capture state. Browser QA independently covered 357 routes,
683 screenshots, 155 behaviour assertions and 556 axe scans.

## Decision

- **No unexplained visual regression was found.**
- The 15 existing Linux baselines were stale relative to approved brand,
  documentation and accessibility work. They are replaced with the reviewed
  Linux captures.
- The 10 Showcase-surface tests had Darwin baselines only. CI treated the
  missing Linux snapshots as failures and wrote unreviewed actuals into the
  runner workspace. This was a test-policy defect, not a product defect. Linux
  now has a reviewed, platform-local baseline for each surface, and a missing
  host baseline is reported as a skip rather than silently written.
- The three Darwin failures were reviewed and replaced. The other seven Darwin
  baselines still pass.

## macOS / Darwin

| Snapshot | Route | Dimensions, expected → actual | Diff | Cause | Decision |
| --- | --- | --- | --- | --- | --- |
| `showcase-home` | `/` | `1440×3188 → 1440×3170` | 3.0% | Official logo/navigation, public installation cards and corrected current-release copy | Update Darwin baseline |
| `showcase-chart-line` | `/charts/line-chart` | `1440×5665 → 1440×6951` | 20% | Added Data Contract, Usage, Guidelines and expanded API reference | Update Darwin baseline |
| `showcase-card-stack` | `/motion/card-stack` | `1440×4352 → 1440×4762` | 10% | Added complete Usage JSX and the expanded public API tables | Update Darwin baseline |

## Linux Showcase baselines added

These tests intentionally committed Darwin captures first. Their Linux
captures did not exist, so no cross-platform comparison was possible. Each
actual below was reviewed and adopted as the first Linux baseline.

| Snapshot | Route | Linux dimensions | Cause | Decision |
| --- | --- | --- | --- | --- |
| `showcase-build-blocks` | `/blocks` | `1440×2690` | Current blocks catalogue with the shared brand shell | Add Linux baseline |
| `showcase-chart-line` | `/charts/line-chart` | `1440×6902` | Complete chart documentation and examples | Add Linux baseline |
| `showcase-components-catalog` | `/components` | `1440×5468` | Complete canonical component catalogue | Add Linux baseline |
| `showcase-components-detail` | `/components/buttons` | `1440×3590` | Usage, API, Guidelines and accessibility sections | Add Linux baseline |
| `showcase-docs` | `/docs` | `1440×1152` | Installation-oriented documentation entry page | Add Linux baseline |
| `showcase-explore` | `/explore` | `1440×3422` | Current discovery surface | Add Linux baseline |
| `showcase-home` | `/` | `1440×3170` | Brand, installation and release-state changes | Add Linux baseline |
| `showcase-card-stack` | `/motion/card-stack` | `1440×4762` | Expanded Motion Usage and API | Add Linux baseline |
| `showcase-morphing-dialog-open` | `/motion/morphing-dialog` | `1440×1000` | Settled dialog state, unchanged interaction | Add Linux baseline |
| `showcase-motion-gallery` | `/motion` | `1440×3884` | Canonical Motion gallery and live specimens | Add Linux baseline |

## Linux visual baselines updated

| Snapshot | Route | Dimensions, expected → actual | Diff | Cause | Decision |
| --- | --- | --- | --- | --- | --- |
| `application-shell-dark` | `/application` | `1440×1791 → 1440×2227` | 22% | Import, composition, rules and API documentation added | Update Linux baseline |
| `application-workspace-dark` | `/application/workspace` | `1440×1461 → 1440×4650` | 69% | Full Usage, exports and public API reference added | Update Linux baseline |
| `buttons-dark` | `/components/buttons` | `1440×2726 → 1440×3590` | 27% | Usage, Guidelines and accessibility content added | Update Linux baseline |
| `inputs-dark` | `/components/inputs` | `1440×2602 → 1440×3494` | 27% | Usage, API and Guidelines content added | Update Linux baseline |
| `components-slider-dark` | `/components/slider` | `1440×2978 → 1440×5014` | 42% | Full slider/range documentation added | Update Linux baseline |
| `components-menus-dark` | `/components/menus` | `1440×2061 → 1440×3959` | 49% | Dropdown/context menu Usage and API added | Update Linux baseline |
| `components-alert-dark` | `/components/alert` | `1440×2929 → 1440×5270` | 45% | Usage, API, Guidelines and accessibility added | Update Linux baseline |
| `components-alert-light` | `/components/alert` (light) | `1440×2929 → 1440×5270` | Height changed | Same approved content in the light theme | Update Linux baseline |
| `components-empty-state-dark` | `/components/empty-state` | `1440×2366 → 1440×3496` | 34% | Usage, API and Guidelines added | Update Linux baseline |
| `data-metrics-dark` | `/data/metrics` | `1440×2248 → 1440×3070` | 29% | Metric import, Usage, rules and accessibility added | Update Linux baseline |
| `forms-overview-dark` | `/forms` | `1440×2636 → 1440×5780` | 55% | Form Usage, API and Guidelines added | Update Linux baseline |
| `foundations-colors-dark` | `/foundations/colors` | `1440×2183 → 1440×2198` | 7% | Shared brand navigation adds 15 px at the top; token content is unchanged | Update Linux baseline |
| `foundations-colors-light` | `/foundations/colors` (light) | `1440×2183 → 1440×2198` | 6% | Same shared brand-shell change in the light theme | Update Linux baseline |
| `foundations-typography-dark` | `/foundations/typography` | `1440×2300 → 1440×2424` | 8% | Updated type documentation and shared navigation | Update Linux baseline |
| `tradingview-charts-dark` | `/integrations/tradingview/charts` | `1440×3443 → 1440×7420` | 54% | Nine real widget usages, provider boundaries, guidelines and API tables under the deterministic provider stub | Update Linux baseline |

## Capture contract

Baselines remain:

- host-local (`chromium-darwin` and `chromium-linux` never diff each other);
- captured at `1440×1000`, device scale factor `1`, dark theme unless the test
  explicitly switches theme;
- settled after `data-luc-hydrated="1"`, fonts-ready and a fixed delay;
- animation-disabled by Playwright's screenshot assertion;
- compared at the existing threshold (no threshold was relaxed).

The Linux captures are asserted by the mandatory `visual regression (Linux
baselines)` GitHub Actions job. A missing baseline for another host is reported
as a skip with an ADR-036 reason instead of writing a new snapshot.
