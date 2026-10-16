# Showcase deployment — Phase 2 visual transformation

**Deployed:** 2026-10-08 21:41 Asia/Singapore (13:41 UTC) — final image, after a
second build that picked up the last navigation-label and dictionary edits. The
first build of this cycle was deployed at 21:34 and served the same feature set.
**Branch / revision:** `main` · `9cec3c2578911629e7fcf2248d50c35f8cb35240`
**Working tree:** dirty by design — this cycle's changes are **uncommitted** and
were built into the image from the working tree.

---

## 1. What changed in the deployment

| | |
| --- | --- |
| Compose project | `luc-ui` |
| Compose file | `luc-ui/docker-compose.yml` |
| Service | `showcase` |
| Container | `luc-ui-showcase` |
| Endpoint | `127.0.0.1:3000` (loopback only; reached through the user's SSH forward) |
| Build context | monorepo root, `luc-ui/Dockerfile` |

Image identifiers:

| | tag | image id |
| --- | --- | --- |
| Previous (rollback reference) | `luc-ui/showcase:rollback-20261008-pre-visual-transform` | `ab730c093218` (digest `sha256:ab730c0932189903d8cfb8fc623d28d693743927b164005cbd3a75decda9f92f`) |
| Deployed now | `luc-ui/showcase:1.0.0` | `7edf35fcbaaf` (digest `sha256:7edf35fcbaaf3dd0b7bbcc3c95fb1cbef05d2540ced21fe3ccb5b56005456552`) |
| Superseded intermediate build (this cycle) | `luc-ui/showcase:1.0.0` was `79475770e009` between 21:34 and 21:41 | `79475770e009` |
| Older rollback (kept) | `luc-ui/showcase:rollback-20261008-pre-phase-2` | `f7ccb0b9a70c` |

Commands used:

```
docker tag luc-ui/showcase:1.0.0 luc-ui/showcase:rollback-20261008-pre-visual-transform
cd luc-ui && docker compose build showcase
cd luc-ui && docker compose up -d --no-deps showcase
```

No compose file, port, network, volume, environment variable or routing rule was
modified. No second Showcase was created.

## 2. Post-deployment verification

Container: `Up (healthy)`, health check green within the start period.

| route | status |
| --- | --- |
| `/` | 200 |
| `/motion` (new) | 200 |
| `/motion/signature` (new) | 200 |
| `/foundations/personality` (new) | 200 |
| `/foundations/themes` | 200 |
| `/patterns/industries` | 200 |
| `/components/buttons` | 200 |
| `/experiments/design-lab` | 200 |
| `/zh` (new) | 200 |
| `/zh/motion/signature` (new) | 200 |

Live interaction QA against the **deployed** container (not the preview server):
**26/26 checks passed** — light theme, dock magnification (34.0 to 52.7px),
marquee motion, press ink, intensity scoping, beam rail, reduced motion, Chinese
deep link (`<h1>` is 标志性动效), `lang="zh-Hans-CN"`, unprefixed-URL redirect for a
Chinese visitor, language switch and back/forward, keyboard navigation, 390px
Chinese layout with no page-level overflow, axe clean on four routes, Design Lab
selection, and no console or hydration errors.

## 3. Other services

Only `showcase` was rebuilt and recreated. Verified after the deploy: `luc-api`,
`luc-web`, `prefect-worker`, `prefect-server`, `luc-redis`, `luc-clickhouse`,
`grafana`, `luc-news`, `luc-meme-listener` and `luc-liquidation-collector` all
kept their previous start times.

Host disk after the build: 74G used of 150G (52%), 71G available. No Docker
prune was run.

## 4. Rollback

The previous working image is tagged and **kept**. To roll back:

```
cd luc-ui
docker tag luc-ui/showcase:rollback-20261008-pre-visual-transform luc-ui/showcase:1.0.0
docker compose up -d --no-deps showcase
```

Rollback was **not** needed: every check passed on the first deployment.

## 5. Warnings carried forward

1. The deployed revision is uncommitted. Anyone reproducing this image needs the
   working tree as it stands, not `HEAD`.
2. TradingView widget pages stack a second iframe on a theme flip. This is a
   pre-existing defect (reproduced on the previous image before the deploy) and
   is unchanged by this deployment.
3. Bundle baselines were re-recorded deliberately (see the phase 2 report,
   section 3.3). The `button-only` entry grew by about 1.6 KB gzip.
