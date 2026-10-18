# syntax=docker/dockerfile:1
#
# LUC UI Showcase — private review image.
#
# Runs the production Next.js server for `apps/showcase` from a self-contained
# `.next/standalone` bundle. This image is for visual review only; it is bound
# to loopback by `docker-compose.yml` and never published to the internet.
#
# Build context is this repository's root: the pnpm workspace is rooted here and
# `apps/` + `packages/` are its members (see `/pnpm-workspace.yaml`).
#
#   docker build -t luc-ui-standalone/showcase:1.0.1 .
#
# Until 2026-10-16 this file built inside the `luc-quant` monorepo, where the
# workspace root was the repository root and this directory was one package
# group (`luc-ui/`). The standalone repository is that directory promoted to a
# repository root, so every path below lost its `luc-ui/` prefix.
ARG NODE_VERSION=22.22.1-alpine
ARG PNPM_VERSION=12.6.0
FROM node:${NODE_VERSION} AS base
ARG PNPM_VERSION
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm install -g --no-fund --no-audit pnpm@${PNPM_VERSION}
WORKDIR /app
# ---------------------------------------------------------------------------
# deps — install the whole workspace from the lockfile only
# ---------------------------------------------------------------------------
FROM base AS deps
# Every workspace manifest, so `pnpm install --frozen-lockfile` resolves the
# exact importer set the lockfile was written for. A missing manifest would make
# pnpm skip that importer silently and the build would drift from the lockfile.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/showcase/package.json apps/showcase/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN --mount=type=cache,id=luc-ui-pnpm-store,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store --global && \
    pnpm install --frozen-lockfile
# ---------------------------------------------------------------------------
# builder — compile @luc/ui types and produce the standalone Showcase bundle
# ---------------------------------------------------------------------------
FROM deps AS builder
# `.dockerignore` keeps installs, build output and review artifacts out of this
# copy; `node_modules` resolved above is preserved because it is ignored.
COPY . .
RUN --mount=type=cache,id=luc-ui-pnpm-store,target=/pnpm/store \
    pnpm --filter @luc/showcase build
# ---------------------------------------------------------------------------
# runner — minimal production runtime, no dev deps, no browsers, no artifacts
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app
# `node` (uid/gid 1000) ships with the Node image; run unprivileged.
# The standalone bundle mirrors the workspace root, so the app server lives
# under `apps/showcase/`.
COPY --from=builder --chown=node:node /app/apps/showcase/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/showcase/.next/static ./apps/showcase/.next/static
COPY --from=builder --chown=node:node /app/apps/showcase/public ./apps/showcase/public
USER node
EXPOSE 3000
# Renders a statically prerendered page: proves the HTTP server and the built
# route manifest work without a browser or client-side JavaScript.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/showcase/server.js"]
