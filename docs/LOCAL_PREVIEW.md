# LUC UI Showcase — local Docker preview

A loopback-only production build of the Showcase on your own Mac, so the current
state of the tree can be reviewed in a browser at any time.

It **reuses** the existing `luc-ui/Dockerfile` and `luc-ui/docker-compose.yml`.
Nothing in this document replaces or edits the production stack; the local
preview is the base stack plus one small override file.

---

## 1. Why a production build, and when to use `next dev` instead

The preview runs a **production build**: the Showcase is served from the
`.next/standalone` bundle by `next start`, so an open browser tab behaves like the
shipped product — no dev overlay, no recompile pause, no hot-reload churn while
you look at a page.

`pnpm dev` also works, and hydrates (see [`DEV_MODE.md`](DEV_MODE.md)). Use it
while editing; use this preview when you want to look at the result the way a
consumer would.

> Historical note: `next dev` did *not* hydrate for a whole phase, and
> `DEV-001` recorded it as a blocker. The cause was a dev-server origin policy —
> the HMR websocket was refused for `http://127.0.0.1:<port>`, and the dev client
> defers hydration until that socket connects. `next.config.ts` now declares
> `allowedDevOrigins` and the defect is fixed, verified by `pnpm qa:dev`. The
> production build was unaffected throughout, which is why this preview worked
> while dev mode did not.

## 2. Prerequisites

```bash
docker version --format '{{.Server.Version}}'   # must print a version, not an error
docker ps                                       # Docker Desktop must be running
```

## 2b. Running dev mode (optional, for editing)

```bash
cd luc-ui/apps/showcase
PORT=3300 pnpm dev            # http://localhost:3300 — see docs/DEV_MODE.md
LUC_QA_DEV_URL=http://127.0.0.1:3300 pnpm qa:dev   # proves it hydrates
```

## 3. Start / rebuild

```bash
cd luc-ui
docker compose -p luc-ui-standalone-local -f docker-compose.yml -f docker-compose.local.yml up -d --build
```

`--build` is required after any source change. The three flags are not optional
either: `-p` gives the preview its own project identity, and the two `-f` files
layer the local override on the production definition.

## 4. Find the real URL (never guess the port)

Docker assigns an ephemeral loopback port, so **ask Docker**:

```bash
docker compose -p luc-ui-standalone-local -f docker-compose.yml -f docker-compose.local.yml port showcase 3000

# equivalent, without the compose flags:
docker port luc-ui-showcase-standalone-local 3000
```

That prints something like `127.0.0.1:49412`; open `http://127.0.0.1:49412`.

**If you would rather have one fixed URL**, replace the override's port line with
a concrete loopback port — after checking it is free — and re-run `up -d --build`:

```yaml
    ports: !override
      - "127.0.0.1:3200:3000"   # check first: lsof -nP -iTCP:3200 -sTCP:LISTEN
```

The trade-off is real: a fixed port gives you a bookmarkable URL, an ephemeral one
guarantees the preview starts even when something else has taken 3200. Both are
read back from `docker port`; neither is ever assumed.

## 5. Verify it is genuinely working

```bash
BASE=$(docker port luc-ui-showcase-standalone-local 3000 | sed 's/.*://')
for p in / /components/native-select /components/project-showcase /charts/line-chart \
         /motion/card-stack /visuals/elements /visuals/styles; do
  printf '%s %s\n' "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$BASE$p")" "$p"
done
```

Then, from `luc-ui/apps/showcase`, run the browser gates against the container:

```bash
cd luc-ui/apps/showcase
export LUC_QA_BASE_URL="http://127.0.0.1:$BASE"
node qa/preview-check.mjs     # 6 pages: HTTP 200 + hydration + a real interaction
node qa/route-health.mjs      # 326 documented routes: HTTP 200 + hydration + no console errors
node qa/outline.mjs --all     # the "On this page" rail, every registry route
node qa/playground.mjs        # control → code → Reset, presets, disabled reasons
node qa/card-stack.mjs        # the Card Stack interaction protocol
node qa/navigation.mjs        # related links, previous/next, sticky stage, catalogue anchors
node qa/standalone.mjs        # no product import, no request, no deployment variable
node qa/motion.mjs            # every motion tile has a specimen; replay; reduced motion
node qa/locale.mjs            # /zh routing, cookies and the language switch
node qa/locale.mjs --all      # every documented route under /zh hands out /zh links
```

`preview-check.mjs` is the quick answer to "is this build actually usable": on
`/components/native-select`, `/components/project-showcase`, `/charts/line-chart`,
`/motion/card-stack`, `/visuals/elements` and `/visuals/styles` it clicks or
selects something and records the observed change plus every console error. It is
also wired as `pnpm qa:preview` and writes
`artifacts/screenshots/showcase-transformation/preview-check.json`.

`locale.mjs --all` is the gate to run after touching any link, the i18n config or
`middleware.ts`: Next prefetches a `<Link>` in the viewport, so an unprefixed
internal link on a Chinese page is a 307 the client router caches — a break that
`curl` cannot see. It counts redirect hops and repeated requests as well.

`route-health.mjs` is the one that answers "is it really usable": it fails when
the hydration marker is missing, which is exactly what a static-only page does.

## 6. Logs

```bash
cd luc-ui
docker compose -p luc-ui-standalone-local -f docker-compose.yml -f docker-compose.local.yml logs -f showcase

# or directly
docker logs -f luc-ui-showcase-standalone-local
```

## 7. Stop / remove

```bash
cd luc-ui
# stop and remove the container and its network, keep the image
docker compose -p luc-ui-standalone-local -f docker-compose.yml -f docker-compose.local.yml down

# also drop the image when you want a clean rebuild next time
docker compose -p luc-ui-standalone-local -f docker-compose.yml -f docker-compose.local.yml down --rmi local
```

## 8. Isolation guarantees

| Concern | How it is handled |
|---|---|
| Host exposure | `127.0.0.1` only — `docker compose … config` shows `host_ip: 127.0.0.1` and no `0.0.0.0` binding |
| Port collisions | the host port is ephemeral and assigned by Docker; nothing else has to be stopped |
| Project identity | Compose project `luc-ui-standalone-local`, container `luc-ui-showcase-standalone-local`, network `luc-ui-standalone-local_default` — separate from the production service and its network |
| Data services | the stack declares no networks, volumes or env files: no Redis, ClickHouse, Prefect, no production credentials |
| Secrets | the build context ignores `.env*` (see the repository `.dockerignore`); specimens render in-repo fixtures |
| Production stack | untouched — `docker-compose.yml` starts `luc-ui-showcase-standalone` on `LUC_UI_SHOWCASE_PORT` |
