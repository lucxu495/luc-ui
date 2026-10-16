# Showcase deployment — Phase 2 (Community Edition)

Date: 2026-10-08 · Deployed at **20:16 Asia/Singapore** (`12:16:19Z`) ·
Status: **deployed and verified**

---

## 1. Revision and working tree

| | |
| --- | --- |
| Branch | `main` |
| Revision | `9cec3c2578911629e7fcf2248d50c35f8cb35240` (unchanged — nothing was committed) |
| Working tree | Dirty by design. LUC UI Phase 2 changes are uncommitted and were built into the image. Other subprojects (`luc-api`, `luc-web`, `luc-cron`, `luc-jobs`, `infra`) carry **another agent's** uncommitted work and were not touched. |
| Build inputs | The Docker build context is the monorepo root; `COPY luc-ui ./luc-ui` picks up the uncommitted working tree, so the image contains exactly the sources described in the Phase 2 report. |

## 2. Images

| Role | Image | Digest | Built |
| --- | --- | --- | --- |
| **Deployed** | `luc-ui/showcase:1.0.0` | `sha256:ab730c0932189903d8cfb8fc623d28d693743927b164005cbd3a75decda9f92f` | 2026-10-08 12:16 UTC |
| Rollback (Phase 1 state) | `luc-ui/showcase:rollback-20261008-pre-phase-2` | `sha256:f7ccb0b9a70ccd86eb5cc44b176321b2e638b73438222df48095969af1a19629` | 2026-10-08 11:32 UTC |
| Older rollback (pre catalog fix) | `luc-ui/showcase:rollback-20261008-pre-catalog-fix` | `sha256:5c9b98d48aa9…` | 2026-09-28 |

An intermediate Phase 2 build (`sha256:bfcc0f03ac81…`, 12:07 UTC) was superseded
by the final build above after two Showcase documentation pages were added. Only
the service container was recreated; nothing else was rebuilt.

## 3. Deployment mechanics

```bash
cd luc-ui
docker tag luc-ui/showcase:1.0.0 luc-ui/showcase:rollback-20261008-pre-phase-2
docker compose build showcase          # 1m25s, existing Dockerfile/compose, unchanged
docker compose up -d --no-deps showcase
```

- Compose project `luc-ui`, service `showcase`, container `luc-ui-showcase`.
- Image tag, port binding (`127.0.0.1:3000 -> 3000`), environment, restart policy
  and the build context were all left exactly as they were. No second stack, no
  routing change, no new port.
- The container reported `healthy` within 25s of each recreate (the image's own
  HTTP healthcheck).
- **No Cloudflare Tunnel exists on this host.** The service is loopback-only and
  is reached through the user's existing SSH port forwarding, as before.

## 4. Route checks (final deployed image)

All HTTP 200 from `http://127.0.0.1:3000`:

`/` · `/foundations` · `/foundations/themes` (new) · `/patterns/industries` (new) ·
`/experiments/design-lab` · `/experiments/design-lab/precision-instrument` ·
`/experiments/design-lab/editorial-research` ·
`/experiments/design-lab/focused-workspace` · `/components/buttons` · `/data/table` ·
`/charts/timeseries`

## 5. Browser verification on the deployed container

Two independent harnesses were run against `127.0.0.1:3000` (not a preview
instance):

1. **The repository's own QA tier** (`apps/showcase/qa/run.mjs`, provider stub):
   9 routes, 25 screenshots, **17 axe scans, 0 violations**, `problems: none`.
2. **The Phase 2 focused driver**: **25/25 checks passed, 14 axe runs, 0 console
   errors**, including:
   - palette scoping (7 distinct accents in sibling cards), document-level
     apply/persist across navigation;
   - no layout shift on a palette switch;
   - status colours identical inside all four industry vignettes;
   - `Enter`-to-select on Design Lab rows in all three treatments;
   - chart frame within 1.5px after selection;
   - reduced-motion removal of the button sheen;
   - no horizontal overflow at 390px;
   - light and dark on every route, 1440px and 390px.

Sidebar navigation was exercised by clicking, not by URL: the Experiments group
discloses four routes, and arriving directly on a nested Design Lab route leaves
it open with the current page marked `aria-current="page"`.

## 6. Incidents and rollback state

**Incident (self-inflicted, contained).** While freeing the isolated preview port,
a broad `pkill -f next-server` also matched the Next servers *inside* two running
containers. Docker's `unless-stopped` policy restarted both immediately.

| Container | Effect | Current state |
| --- | --- | --- |
| `luc-web` | Restarted | `Up … (healthy)`; `/` → 307 to `/en`, `/en` → 200; container log has no error lines |
| `luc-ui-showcase` | Restarted | `Up … (healthy)`; all routes 200 |

No other container was affected (`luc-api`, `luc-cron`/Prefect, `luc-redis`,
`luc-clickhouse`, `grafana`, `luc-news`, `luc-meme-listener` all retained their
previous uptimes). The preview server used a targeted PID afterwards, and it was
shut down before the end of the session; port 3100 is free.

**Rollback:** not needed. The rollback image is tagged and verified present
(`luc-ui/showcase:rollback-20261008-pre-phase-2`), and no previous image was
deleted. To roll back:

```bash
docker tag luc-ui/showcase:rollback-20261008-pre-phase-2 luc-ui/showcase:1.0.0
docker compose up -d --no-deps showcase
```

## 7. Remaining warnings

- Host disk is **88% used (19 GB free)**. The build used the existing cache; no
  prune was run, and none is recommended without the user's approval.
- `next start` prints a warning that it does not support `output: standalone`.
  It is how the preview server was run; the Docker image uses
  `node .next/standalone/server.js` and is unaffected.
- The deployed image has no git revision label (the Dockerfile/compose files were
  out of scope). Traceability for this deployment is the digest table above.
