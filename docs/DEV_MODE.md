# Local development mode (`next dev`)

`pnpm dev` in `luc-ui/apps/showcase` starts the Showcase with hot reload. This
document records the one trap that made it look broken for a whole phase, how it
was diagnosed, and how to check that it stays fixed.

---

## 1. Use `localhost`, not `127.0.0.1` — or rely on the fix

`next.config.ts` now declares:

```ts
allowedDevOrigins: ["127.0.0.1", "[::1]", "localhost"],
```

With that in place, either URL works. Without it, **`http://127.0.0.1:<port>`
renders but never hydrates**: buttons do nothing, controls do not respond, and
the only console output is a failing HMR websocket. `http://localhost:<port>` was
always fine. This is the whole of `DEV-001`.

## 2. What was actually happening

1. `next dev` picks its development origin from the hostname it prints as
   `Local:` — `localhost`.
2. A browser opened at `http://127.0.0.1:3300` sends
   `Origin: http://127.0.0.1:3300` on the HMR websocket at `/_next/hmr`.
3. The dev server refuses the upgrade and writes the body `Unauthorized` **with
   no HTTP status line**. The server log says so directly:

   ```
   ⚠ Blocked cross-origin request to Next.js dev resource /_next/hmr from "127.0.0.1".
     Cross-origin access to Next.js dev resources is blocked by default for safety.
   ```
4. A well-formed WebSocket refusal would be `HTTP/1.1 401 …`. A bare body is not
   parseable as HTTP, so Chrome reports
   `Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE`.
5. Next's dev client waits for the HMR handshake before calling `hydrateRoot` —
   it needs the session's build hash so it does not hydrate a stale tree. The
   socket never connects, so hydration is deferred forever. The page keeps its
   server HTML: React's DevTools banner still prints (the dev bundle evaluated),
   no exception is thrown, and `document.documentElement.dataset.lucHydrated`
   stays unset.

The production server (`next build && next start`, and the Docker preview) has no
HMR socket, which is why it hydrated the whole time and why the defect survived
every production-build measurement.

## 3. Why it was easy to misattribute

Every symptom pointed somewhere else. There is no stack trace, no failed request
for a `.js` file, no server error, and the page looks correct in "View Source".
Neither `Turbopack` nor webpack mattered, and removing `middleware.ts` changed
nothing, because the middleware matcher already excludes `_next/`. The failing
websocket is the *only* symptom, and a handshake failure looks like a server
problem rather than an origin-policy problem — `curl` with the same path upgrades
successfully, because curl sends no `Origin`.

## 4. Verify the fix

```bash
cd luc-ui/apps/showcase
PORT=3300 pnpm dev            # terminal 1

LUC_QA_DEV_URL=http://127.0.0.1:3300 node qa/dev-hmr.mjs   # terminal 2
# or: pnpm qa:dev
```

The gate does two things in the order the failure happens:

1. it sends a real WebSocket upgrade carrying `Origin: http://127.0.0.1:<port>`
   over a raw socket and requires `HTTP/1.1 101 Switching Protocols` back
   (printing the raw bytes when it does not), and
2. it opens a browser at that origin and requires
   `document.documentElement.dataset.lucHydrated === "1"` with no page error and
   no `/_next/hmr` console error.

Expected output:

```
PASS websocket upgrade with Origin: http://127.0.0.1:3300
PASS http://127.0.0.1:3300/ hydrated (HMR errors: 0)

dev server hydrates at http://127.0.0.1:3300 — DEV-001 stays fixed.
```

## 5. If it regresses

Restart the dev server first: `allowedDevOrigins` is read at startup, so a server
started before the change keeps the old policy.

If it still fails, collect the same two facts the diagnosis needed:

```bash
# 1. what the server writes back to an upgrade that carries an Origin header
LUC_QA_DEV_URL=http://127.0.0.1:3300 node qa/dev-hmr.mjs

# 2. what the dev server itself says
#    (look for "Blocked cross-origin request to Next.js dev resource")
```

A bare `Unauthorized` with no status line means the origin policy is still the
cause. A `101` followed by a failed hydration is a different defect and needs a
new investigation.

## 5b. The other "hydration failure": a stale server module

Diagnosed on 2026-10-12, while changing the shared shell. `next dev` keeps the
**server** copy of a module it has already evaluated, and it does not always
notice that the file changed on disk. The browser, meanwhile, gets the new client
bundle. React then reports:

```
Encountered a script tag while rendering React component.
Hydration failed because the server rendered HTML didn't match the client.
```

…with a diff that shows **exactly the value you just edited**: the server's old
`className`, the old string, the old URL. It is not a hydration bug — the two
sides are rendering two different versions of one file.

The tell is that the mismatch names your change, and that the same route is clean
in the Docker preview (which is built from source, not from a long-lived process).
It reproduces most reliably after editing anything under `packages/ui/**` or
`lib/**` — modules the dev server compiled early and then kept.

**Restart the dev server after such an edit; do not debug the page.** Five minutes
were spent in this session chasing a `<Stack>` that the server "did not render",
and every later measurement was taken against a restarted server for this reason.

## 6. Recorded evidence (2026-10-11)

| Probe | `http://127.0.0.1:3300` before | after `allowedDevOrigins` |
|---|---|---|
| Raw upgrade with that `Origin` | body `"Unauthorized"`, no status line | `HTTP/1.1 101 Switching Protocols` |
| Same upgrade with `Origin: http://localhost:3300` | `101` | `101` |
| Same upgrade with no `Origin` at all | `101` | `101` |
| Browser hydration marker | unset | `"1"` |
| Console | `ERR_INVALID_HTTP_RESPONSE` ×6 | `[HMR] connected` |

`next dev` interaction smoke on the fixed server:
`LUC_QA_BASE_URL=http://127.0.0.1:3300 node qa/preview-check.mjs` → 6/6 surfaces
OK (native-select changes value, the project tile opens in place, a chart control
rewrites the code panel, Card Stack advances, the Visuals catalogue renders).

Raw-response evidence and the full transcript are in
`docs/audits/showcase-transformation/progress/agent-a-ledger.md` §15.

## 7. Two development sessions at once (CONCURRENCY-001)

Luc UI has two development tracks that run at the same time — the shared platform
and the Visuals library — and until 2026-10-13 both of them used `next dev` with
the one output directory `apps/showcase/.next`. That directory is not a build
artifact they share politely; it is one Turbopack cache, one `static/chunks`
tree and one set of manifests, written by two processes that each compiled their
own module graph.

### 7.1 What actually goes wrong, and what does not

Measured rather than assumed, because the obvious explanation turned out to be
wrong in an important detail:

1. **`next dev` does guard the directory.** A second `next dev` on the same
   `distDir` refuses to start and says so:

   ```
   ⨯ Another next dev server is already running.
     - Local:  http://localhost:3300
     - PID:    40050
     - Dir:    …/luc-ui/apps/showcase
   ```

   So two *clean* sessions never collide. The guard is weaker than it looks,
   though, in the next two ways.
2. **A lock whose pid is gone does not block anything.** Next writes
   `<distDir>/dev/lock` (`{pid, port, appUrl}`); after `kill -9` a new server
   starts normally on the same directory.
3. **The lock lives inside the directory the disk guard prunes.** `.next/dev`
   is exactly what `pnpm cache:prune:safe` deletes — that is why the guard grew
   its own refusal to prune behind a live server in the first place. A prune
   that ran anyway (an emergency cleanup before that refusal existed, or a
   manual delete) removes the lock and leaves the server running. The next
   `next dev` then starts with nothing in its way, and two servers own one
   directory.

   This is also how a **stray** server appears: `next dev` alive in
   `apps/showcase` with no lock claiming it. `pnpm dev:guard` reports those by
   pid (one is running on this machine right now, left over from 2026-10-11)
   and deliberately does not kill them — it may be somebody's browser session.

What the collision looks like from outside, recorded on 2026-10-13 against the
real `.next`: the first server served `/components/button` as `200`,
214 597 bytes, 49 chunks. After the second server took over the directory the
same URL on the first server returned **`404` with a 99 188-byte not-found
page** (48 chunks) while the second returned `200`, 214 597 bytes — and the two
chunk sets did not agree (`luc-ui_apps_showcase_18x7jxu._.js` versus
`luc-ui_apps_showcase_0ir-jga._.js`). Seconds later the first process was gone,
with nothing in its own log to explain it.

The probe below reproduces it on demand, and under load it is not subtle: in
four consecutive runs the first server **stopped answering a route it had
served seconds earlier** while the second compiled the same routes into the
same directory.

Two related facts worth keeping separate, because they have different fixes:

- a **stale server module** inside one healthy session (§5b above) — restart
  that server; and
- a **shared output directory** between two sessions — this section.

### 7.2 The fix: one output directory per session

Next supports an explicitly configured `distDir`, so isolation is a
configuration value, not an architecture change:

```ts
distDir: process.env.LUC_NEXT_DIST_DIR || ".next",
```

Each session gets its own dev cache, its own lock, its own manifests. Nothing
else changed: the default is still `.next`, so `pnpm dev`, the production build
and the Dockerfile's `.next/standalone` copy behave exactly as before.

| Command | Output directory | Port | Owner |
| --- | --- | --- | --- |
| `pnpm dev` | `.next` | 3000 (Next's default — clashes with the Docker preview) | the default session |
| `pnpm dev:a` | `.next-a` | 3300 | shared platform |
| `pnpm dev:b` | `.next-b` | 3301 | Visuals |
| `pnpm qa:dev-isolation` | `.next-qa-*` (throwaway) | 3400–3403 | the probe |
| Docker `luc-ui-showcase-standalone` | image-local `.next` | **3000** | the canonical preview |

Run them from the `luc-ui` root. A session never blocks, and is never blocked
by, another session's lock:

```bash
pnpm dev:a                       # terminal 1 — http://localhost:3300
pnpm dev:b                       # terminal 2 — http://localhost:3301
```

Port 3000 belongs to the Docker preview container, so a dev session cannot take
it by accident. Both session directories are gitignored (`.next-*/` in
`luc-ui/.gitignore`) and both are covered by the disk guard and
`pnpm cache:prune:safe`.

**A session directory has to be invisible to every tool, not only to Git.**
Measured the day this landed: `pnpm lint` went from clean to *2322 problems,
1370 of them errors*, because ESLint ignored only the default output directory
and every Turbopack chunk written into `.next-b` was linted as source; `tsc` was
next in line, since `**/*.ts` matches `.next-b/dev/types/validator.ts`. Three
places hold the line, and `pnpm qa:dev-isolation` fails if any of them loses it:

| file | what it keeps out |
| --- | --- |
| `luc-ui/.gitignore` | untracked session directories in every `git status` |
| `apps/showcase/eslint.config.mjs` | generated chunks in `pnpm lint` |
| `apps/showcase/tsconfig.json` | generated dev types in `pnpm typecheck` |

### 7.3 Verify it, rather than trusting it

```bash
pnpm qa:dev-isolation                 # both halves
pnpm qa:dev-isolation --mode=collision # the historical failure, on purpose
```

`--mode=isolation` starts two sessions on `.next-qa-a` / `.next-qa-b` and
asserts, for three routes: both serve them; each holds its own lock naming its
own port; and every chunk the returned HTML points at resolves **on the server
that returned it** — the cross-check that a foreign module graph fails. It then
edits a shared stylesheet and requires both sessions to keep serving the page.

`--mode=collision` starts one session on `.next-qa-c`, moves its lock aside
(what a cleanup behind a live server leaves), starts a second session on the
same directory, and compiles the same routes into it. It exits 0 only when the
first server is demonstrably no longer serving what it served before — status,
a chunk that no longer resolves, a changed chunk set, or a process that stopped
answering. **If it cannot reproduce the damage it exits 2**, because then this
section is wrong and the claim has to change with it. It never touches `.next`,
the Docker preview, or any server of the owner's, and it removes its own
`.next-qa-*` directories afterwards (`--keep` leaves them).

### 7.4 The guard, now that a checkout can hold several sessions

`node scripts/dev-guard.mjs` measures and reports **every** `.next*` directory,
with each session's cache size, lock state, pid and port, plus any stray server
whose working directory is this app:

```
Luc UI — dev cache guard
  free space: 59.08 GiB
  dev cache : 3.09 GiB across 2 session(s)
    .next         3.09 GiB  running (pid 41423, port 3300)  (apps/showcase/.next)
    .next-b         3.0 MB  not running  (apps/showcase/.next-b)
  stray     : pid 20780 — next-server (v16.3.6)
```

A prune refuses while any session's lock names a live pid, and names the
directory that server owns. `--stop-server` still stops that one exact pid.
`--strict` fails when the cache is over its limit, the disk is under the floor,
**or** a lockless server is running — that last one is the state that makes the
collision possible, so it belongs in a gate rather than in a footnote.

### 7.5 The limits of this, stated plainly

- Both sessions watch the same source tree, so someone else's edit *does*
  invalidate your session's compiled output — that is correct behaviour, not a
  defect, but it means a long-lived session should be restarted before
  measurement (§5b).
- A **production** `next build` still writes `.next`. Never run it while a dev
  session owns `.next`; use a session directory (`LUC_NEXT_DIST_DIR=.next-build
  next build`) or let Docker build, which is what `pnpm qa:rebuild` does.
- Isolation fixes the *tooling* collision. It does not make concurrent edits to
  one file safe, and it does not merge two agents' work — Git does that, by
  hand, with the ownership boundaries in `AGENTS.md`.
