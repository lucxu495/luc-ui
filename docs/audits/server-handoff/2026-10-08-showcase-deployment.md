# LUC UI Showcase — Docker deployment record

Date: 2026-10-08 (Asia/Singapore 19:32). This is the standard completion step for
any future LUC UI task that changes visible components, styling, motion, charts,
layouts or Showcase routes: **Implement → Test → Build → Deploy Showcase →
Browser QA → Report**. Documentation-only and research-only tasks do not need it
unless the documentation is rendered by the Showcase or the user asks.

A deployed Showcase is a preview of the UI framework. It is **not** a deployment
of any consuming application; `@luc/ui` changes still need a separate Luc Web
compatibility assessment.

## 1. Existing deployment (inspected before any change)

| | |
| --- | --- |
| Compose project / file | `luc-ui` — `/home/luc/code/luc-quant/luc-ui/docker-compose.yml` (working dir `/home/luc/code/luc-quant/luc-ui`) |
| Service / container | `showcase` → `luc-ui-showcase` |
| Image (before) | `luc-ui/showcase:1.0.0` → `sha256:5c9b98d48aa99475a719c142917597f006546ebc4c43776b268eec7f695cbd10` (built 2026-09-28 15:44 UTC) |
| Build context / Dockerfile | context `/home/luc/code/luc-quant`, `luc-ui/Dockerfile` (multi-stage; production build in Docker, standalone runner, non-root `node`) |
| Environment | `NODE_ENV=production`, `PORT=3000`, `HOSTNAME=0.0.0.0`, `NEXT_TELEMETRY_DISABLED=1` |
| Ports | `127.0.0.1:3000 -> 3000/tcp` (loopback only — never `0.0.0.0`) |
| Network | `luc-ui_default` (default bridge; no shared data network, no volumes) |
| Mounts | none |
| Restart policy | `unless-stopped` |
| Health | `healthy` (image `HEALTHCHECK` fetches `/`) |
| Pre-deploy HTTP | `/` 200, `/components/buttons` 200, `/experiments/design-lab` **404** |
| Host resources | disk `/` 125 G used / 19 G available (87 %); memory 15 Gi total, 8.8 Gi available |

### Revision mapping

The running image was built 2026-09-28, before the current HEAD
`9cec3c2578911629e7fcf2248d50c35f8cb35240`; it served no Design Lab routes
(`/experiments/design-lab` returned 404) and it predated the uncertainty-page JSX
fix. That is why the redeploy was required.

The image carries **no embedded git revision label**, and adding one would mean
editing the Dockerfile or compose file (outside this task's write ownership), so
traceability is established instead by: the build timestamp, the image ID, the
route manifest inside the image, and a marker file (`labelMode=&quot;auto&quot;` in
the deployed uncertainty bundle).

### Cloudflare Tunnel

There is **no Cloudflare Tunnel on this host**: no `cloudflared` binary or
process, no `/etc/cloudflared` or `~/.cloudflared` configuration, and no
tunnel/reverse-proxy container. The Showcase is published on loopback only, so
browser access is via SSH port-forward, exactly as the compose header documents.
Routing was therefore **not** changed — there was nothing to change, and nothing
was invented.

## 2. Deployment performed

```bash
# 1. keep a rollback reference for the currently running image
docker tag luc-ui/showcase:1.0.0 luc-ui/showcase:rollback-20261008-pre-catalog-fix

# 2. rebuild + recreate only the existing service, with the existing config
cd /home/luc/code/luc-quant/luc-ui
docker compose up -d --build
```

Only the `showcase` service of the `luc-ui` compose project was rebuilt and
recreated. No other compose file, service, network, volume, port or environment
variable was touched.

## 3. Post-deployment verification

| Check | Result |
| --- | --- |
| Container | `luc-ui-showcase` running, `health: healthy`, restart `unless-stopped` |
| Ports unchanged | `127.0.0.1:3000 -> 3000/tcp` |
| Environment unchanged | `NODE_ENV=production`, `PORT=3000`, `HOSTNAME=0.0.0.0`, `NEXT_TELEMETRY_DISABLED=1` |
| Network unchanged | `luc-ui_default` |
| `GET /` | 200 |
| `GET /components/buttons` | 200 |
| `GET /charts/uncertainty` | 200 — rendered description contains `labelMode="auto"` (the Phase 1B JSX fix is live) |
| `GET /experiments/design-lab` | 200 (was 404 before) |
| `GET /experiments/design-lab/precision-instrument` | 200 |
| `GET /experiments/design-lab/editorial-research` | 200 |
| `GET /experiments/design-lab/focused-workspace` | 200 |
| Route manifest inside the image | `.next/server/app-paths-manifest.json` lists all four `/experiments/design-lab*` pages |
| Unrelated containers | `luc-web`, `luc-api`, `luc-clickhouse`, `luc-redis`, `prefect-server`, `prefect-worker`, `grafana`, `luc-news`, `luc-meme-listener` all kept their previous start times — none restarted |

### Browser verification (against the deployed service on 127.0.0.1:3000)

The same Playwright + axe-core driver used for Design Lab Phase 1 was re-run
against the deployed container: **14 records, 0 findings.**

| Check | Result |
| --- | --- |
| 3 treatments × {1440×900, 390×900} × {dark, light} | correct treatment attribute and resolved theme |
| Table → chart → inspector | row click selects `Sample 04`; chart live status `Selected: Sample 04, 128 milliseconds`; inspector shows `128 ms / 07 Sep / East / 120 ms` |
| Chart repainted on selection | yes, 12/12 |
| Layout stability | chart region moved 0 px in x/y/w/h, 12/12 |
| Non-colour selected cue | `▸` + bold label + `SELECTED` badge, 12/12 |
| Keyboard | row `Enter` selects; chart `Enter` pins, `ArrowLeft` steps, `Escape` clears |
| Light / dark | both themes render; theme switches applied correctly |
| axe-core (wcag2a/aa, wcag21a/aa, wcag22aa) | **0 violations** across rest + selected states |
| Browser console | **0** errors, 0 page errors, no hydration mismatch |
| Reduced motion | pins/steps/clears correctly under `prefers-reduced-motion: reduce` |

Deeper HTTP-only checks were not needed: the browser driver ran against the
deployed service, so these are real interaction results, not inference.

## 4. Deployment facts

| | |
| --- | --- |
| Git revision | `9cec3c2578911629e7fcf2248d50c35f8cb35240` plus the uncommitted LUC UI working-tree changes of this task (catalog generator/`lib`, regenerated `docs/component-catalog.json`, report docs) and the earlier uncommitted LUC UI changes (`charts/uncertainty` fix, Design Lab screenshots/README) |
| Previous image | `luc-ui/showcase:1.0.0` = `sha256:5c9b98d48aa9…` (2026-09-28 15:44 UTC) |
| Rollback image | `luc-ui/showcase:rollback-20261008-pre-catalog-fix` = `sha256:5c9b98d48aa9…` |
| New image | `luc-ui/showcase:1.0.0` = `sha256:f7ccb0b9a70c…` (image config `59a1fa1bdf42…`), built 2026-10-08 11:32:52 UTC |
| Deployment timestamp | 2026-10-08 19:32 (Asia/Singapore) / 11:32 UTC |
| Container / service | `luc-ui-showcase` / compose service `showcase` (project `luc-ui`) |
| URL | `http://127.0.0.1:3000` (loopback only; reachable to the user through the existing SSH port-forward) |
| Rollback status | not required — the deployment is healthy and verified; the previous image is retained under the rollback tag |

## 5. How to roll back (if ever needed)

```bash
docker tag luc-ui/showcase:rollback-20261008-pre-catalog-fix luc-ui/showcase:1.0.0
cd /home/luc/code/luc-quant/luc-ui && docker compose up -d --force-recreate
```

That restores the 2026-09-28 image without a rebuild.

## 6. Remaining warnings

- The image carries no git revision label (see §1). Adding one needs a Dockerfile
  or compose edit, which is outside this task's write ownership.
- Host disk is 87 % full (19 G free). The rebuild succeeded, but future builds
  should keep watching space; `docker builder prune` / `docker image prune` would
  free cache, and neither was run here because it can affect other projects'
  images.
- The Showcase is loopback-only by design; the user needs the existing SSH
  port-forward to view it. No Cloudflare Tunnel exists on this host.
