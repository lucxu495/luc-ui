# Luc UI brand assets

The official light and dark marks were supplied as transparent PNGs in
`luc-ui-logo-light-dark/`. The source directory is not part of this repository.
No SVG was supplied.

| Source file | Use in this repository |
| --- | --- |
| `luc-ui-logo-light-32.png` | light favicon and small light mark |
| `luc-ui-logo-light-64.png` | light navigation and hero mark |
| `luc-ui-logo-light-512.png` | README light logo and large light use |
| `luc-ui-logo-dark-32.png` | dark favicon and small dark mark |
| `luc-ui-logo-dark-64.png` | dark navigation and hero mark |
| `luc-ui-logo-dark-512.png` | README dark logo and large dark use |

The README uses a `<picture>` element keyed to `prefers-color-scheme`; the
Showcase uses the same pair with Tailwind's `dark:` variants. Both paths resolve
to files committed under `docs/assets/brand/` and `apps/showcase/public/brand/`.

`luc-ui-apple-touch-180.png` is a 180 px derivative of the supplied dark mark,
used as the Apple touch icon. The source set did not include a 180 px file. No
Open Graph image or PWA manifest was invented because the project does not
currently ship those surfaces.

Source checksums:

```text
506a5e56593f243a3cbfc6503eeffe4662bd3951b0b738fe49413ca7f7b6cf8e  luc-ui-logo-light-512.png
f6a9d559121f3c83d9db9ee1b12f3752dedcd065c55a967351e5f39858eea293  luc-ui-logo-dark-512.png
```
