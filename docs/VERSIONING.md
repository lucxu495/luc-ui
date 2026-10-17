# Versioning

`@luc/ui` is versioned with SemVer. The rules below are what "major" means for a
design system, which is not quite what it means for a library of functions: a
token rename or a CSS behaviour change is as breaking as a removed prop.

## What the version covers

| Surface | Breaking change looks like |
| --- | --- |
| Component props | Renaming or removing a prop, changing a default, narrowing a type |
| Component behaviour | Changing what a control does on an interaction a product relies on |
| Public exports | Removing an export, moving it to another subpath, adding a required peer |
| Tokens (CSS) | Renaming or removing a custom property; changing what a token *means* |
| Token values | Adjusting a value inside the same meaning (a colour tweak, a radius) |
| CSS classes / `data-slot` | Renaming a documented hook the QA suite or a product targets |
| Package shape | Changing the entry points, the module format, or the CSS entry |
| Accessibility | Removing a shortcut, changing an ARIA role, altering focus order |

## How the number moves

* **Patch** — a bug fix, a token value adjustment, documentation. The published
  API is unchanged and a product needs no work.
* **Minor** — a new component, a new optional prop, a new subpath, a new
  additive hook. Nothing existing changes shape or meaning.
* **Major** — anything in the table above that changes what already exists, and
  any change that requires a consumer to edit code.

Token schema changes carry `LUC_UI_TOKEN_VERSION` / `--luc-token-version`. A
major release that changes the token schema bumps that number too; a patch that
tunes a value does not.

## Deprecations

A deprecation is announced in `CHANGELOG.md` and, where it is cheap, marked with
`@deprecated` in the type. A deprecated export is removed no earlier than the
next major. There is no separate "deprecated" build.

## Pre-release policy

While the version is below 1.0 this repository allowed small breaking cleanups;
V1.0 closed that. From here, `MIGRATION_*.md` is created for any release that
requires consumer work.

## The TradingView caveat

The `@luc/ui/tradingview` entry is versioned with the package, but the widgets
themselves are owned by TradingView and can change without notice — attribute
names, minimum sizes, theming surface. Luc UI's half of the contract (typed props,
the registry, the loader allow-list, the theme bridge) follows SemVer; the
provider's half does not. `docs/research/v0.6-tradingview-policy-audit.md`
records what was verified, and `docs/TRADINGVIEW_GUIDE.md` documents the
boundary.

## Publishing

V1.0 is release-ready but unpublished. Building, packing, publint, Are The Types
Wrong and consumer smoke tests all run locally; no registry is configured, and
choosing one is a separate decision.
