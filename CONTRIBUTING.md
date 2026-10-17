# Contributing to Luc UI

Luc UI is an open-source React and TypeScript design system. Contributions are
welcome when they preserve the public API, accessibility behavior and package
contracts.

## Before opening a pull request

1. Open an issue for a new component or any consumer-visible behavior change.
2. Keep changes focused; do not mix unrelated formatting or redesign work.
3. Preserve existing uncommitted work in the repository.
4. Add or update tests for behavior that changes.
5. Do not update committed visual baselines without maintainer approval.

## Local setup

```bash
git clone https://github.com/lucxu495/luc-ui.git
cd luc-ui
pnpm install
pnpm dev
```

The Showcase is available at `http://localhost:3000`.

## Verification

Run the checks relevant to the change, then the full gate:

```bash
pnpm verify
pnpm test:consumers
```

Browser and visual checks:

```bash
pnpm qa:changed
pnpm qa:full
pnpm qa:product
pnpm qa:baseline
```

Visual baselines are platform-specific. A macOS screenshot does not replace a
Linux baseline, and a changed screenshot must be reviewed before it is accepted.

## Pull requests

Include:

- the problem and the chosen fix;
- affected package subpaths or documentation routes;
- tests and browser checks run;
- any consumer-visible behavior change;
- screenshots for visual changes when useful.

Do not include generated caches, temporary consumer projects or local absolute
paths in a pull request.

## License

By contributing, you agree that your contribution is licensed under the MIT
License in this repository.
