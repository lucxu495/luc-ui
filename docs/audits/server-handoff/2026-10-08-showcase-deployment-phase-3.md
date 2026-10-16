# Showcase deployment — Phase 3 (spatial motion)

**Date:** 2026-10-08 · **Time (Asia/Singapore):** 23:33:24 (final build of the cycle)
**Branch:** `main` · **HEAD:** `fce36146a1233c68de6a2c56d6f6965293c1d13e`
**Built from:** the uncommitted working tree (see §4), not from HEAD.

---

## 1. What is running

| Item | Value |
| --- | --- |
| Compose project / service | `luc-ui` / `showcase` |
| Container | `luc-ui-showcase` — **healthy** |
| Image | `luc-ui/showcase:1.0.0` |
| Image id | `sha256:4def6689c753c1e86af22cf6b31f1ce723a74847b4bb6824dda38146cd675e62` |
| Image built | 2026-10-08T15:33:18Z (23:33:18 SGT) |
| Container started | 2026-10-08T15:33:24Z (23:33:24 SGT) |
| Endpoint | `127.0.0.1:3000` (loopback only, unchanged) |

The image was rebuilt three times during the cycle (23:14, 23:23 and 23:33
SGT), each time because a Showcase-visible input changed. The identifiers above
are the final build; the earlier ones are superseded and were removed by Docker
when the same tag was rebuilt.

## 2. Rollback

| Tag | Image id | What it is |
| --- | --- | --- |
| `luc-ui/showcase:rollback-20261008-pre-visual-transform` | `ab730c093218` | The image that was live before the Phase 2 visual-transformation cycle |
| `luc-ui/showcase:rollback-20261008-pre-phase-2` | `f7ccb0b9a70c` | The image that was live before Phase 2 |

Both are retained. The image that was live at the start of *this* cycle
(`7edf35fcbaaf`, the Phase 2 visual-transformation build) is no longer present —
Docker removed it when the same tag was rebuilt during the cycle, which is why
the two older tags above are the usable rollback points.

Rollback command, if it is ever needed:

```bash
cd luc-ui
docker compose stop showcase
docker tag luc-ui/showcase:rollback-20261008-pre-visual-transform luc-ui/showcase:1.0.0
docker compose up -d showcase
```

## 3. How it was deployed, and what was not restarted

The Showcase is deployed through the repository's own harness rather than by
hand: `node scripts/qa-server.mjs` hashes every input the image copies, rebuilds
only when that hash changes, runs `docker compose up -d --build` for the
`showcase` service alone, and waits for the container to answer HTTP before any
test runs. This cycle the image was rebuilt three times (each time a
Showcase-visible input changed) and the final build is the one above.

No other service was touched. Container ages at the time of writing, which is
the evidence for that claim:

```
luc-ui-showcase     Up 7 minutes (healthy)   <- this deploy
luc-api             Up 23 minutes (healthy)
luc-web             Up 27 minutes (healthy)
prefect-worker      Up 4 hours (healthy)
luc-news            Up 5 days (healthy)
prefect-server      Up 2 weeks (healthy)
luc-redis           Up 2 weeks (healthy)
luc-clickhouse      Up 5 weeks (healthy)
```

No `docker prune`, no broad process kill, no network or tunnel change, no port
change and no domain change. Host resources after the deploy: disk 86G/150G used
(60%), memory 10G/15G used.

## 4. What the image contains

The build is from the **working tree**, which is uncommitted: 27 modified and
21 new paths inside `luc-ui/**`, plus one documentation-only change in
`.context/docs/luc-ui/index.md` and this cycle's audit documents. The worktree
also contains changes made by another agent in `luc-api/**` and `luc-web/**`;
those were neither touched nor built into this image.

Image traceability: `luc-ui/showcase:1.0.0` was built by the harness from that
tree at 15:23:20Z. There is no `--build-arg` revision label, so the source of
truth for *what* is in the image is the tree state plus the build timestamp
above; this is a pre-existing property of the Dockerfile, not something this
cycle changed.

## 5. Live verification on the deployed container

Everything below ran against `http://127.0.0.1:3000` — the production container,
not a temporary preview.

| Check | Result |
| --- | --- |
| Full sweep (`--mode=full`, final tree) | **105 routes · 324 screenshots · 81/81 behaviour checks · 160 axe scans · 0 violations · 0 problems** |
| Live provider tier (`--mode=providers --provider-mode=live`) | 6/6 checks, 147 widgets ready, 0 a11y violations — run on the tradingview fix, before the last two edits (slider labels, panel focus ring), neither of which touches the integration |
| `/`, `/components`, `/motion`, `/motion/spatial` | HTTP 200 |
| `/experiments/design-lab` and its three treatments | HTTP 200 |
| Console errors during the interaction pass | **0** |
| Table → chart → inspector (`/motion/spatial`) | Row `Americas` selected → inspector reads `AMERICAS 508 +3.1%`, beam path re-anchored |
| Orbit seat selection | `aria-pressed="true"` after click; hub follows |
| Language switch (EN → 简体中文) | URL `/zh/motion/spatial`, `<html lang="zh-Hans-CN">`, `h1` 空间动效, sidebar Chinese, slider label 深度 |
| Language persistence | Reload stays on `/zh/motion/spatial`; deep link works; Back works; switching back returns to `/motion/spatial` with the English heading |
| `/zh/components` | Chinese heading and body confirmed |

The one defect the sweep found on the new page — three Radix slider thumbs with
no accessible name (`aria-input-field-name`, serious) — was fixed by using the
library's `label` prop (which names the thumb) instead of `aria-label` (which
lands on the root), and the route was re-scanned: **0 violations**.

## 6. Residual warnings

- The image carries no revision label; traceability is the working-tree state
  plus the timestamp (§4).
- The container serves the *working tree*, so a later edit inside `luc-ui/**`
  silently makes the running Showcase one build behind until the harness rebuilds
  it. That is the intended workflow, but it means "the URL shows the newest code"
  is only true immediately after a run of `qa:*`.
- Nothing was committed or pushed. The worktree is dirty by design.
