/**
 * Deterministic placeholder artwork for the reference experiences.
 *
 * The alternative was broken images or a wall of empty grey boxes, and both are
 * worse than saying so plainly. Each cover is an inline SVG data URI — a real
 * `<img>` with real intrinsic dimensions and real `alt` text, so layout
 * reservation, light, dark and the accessibility tree all behave exactly as they
 * would with a photograph. Nothing is fetched.
 *
 * **What changed, and why.** The first version was a saturated gradient with a
 * large centred monogram and one blurred circle. It was technically sound and it
 * read as exactly what it was — a placeholder — which is the impression the whole
 * page then carried. This is a small *system* instead of a recipe:
 *
 *   1. **A palette, not a hue wheel.** Six deep, desaturated bases with one
 *      restrained accent each, chosen as a set so a page of covers looks like one
 *      art direction rather than six unrelated downloads.
 *   2. **A composition per seed** — a diagonal band, a field of rules, arcs from a
 *      corner, an offset grid — so a set of covers has rhythm instead of being
 *      the same gradient at four hues.
 *   3. **A mark, not a watermark.** The monogram moves to the bottom-left at
 *      masthead scale, under a short accent rule, where an identity sits.
 *
 * The seed still decides everything, so a cover is stable across renders and
 * identical between the grid and the lightbox.
 */

function hash(seed: string): number {
  let value = 0;
  for (let index = 0; index < seed.length; index += 1) {
    value = (value * 31 + seed.charCodeAt(index)) % 1_000_003;
  }
  return Math.abs(value);
}

export interface PlaceholderArt {
  src: string;
  width: number;
  height: number;
}

/** Deep base, mid tone, one accent, and the ink the mark is drawn in. */
const PALETTE: readonly { base: string; mid: string; accent: string; ink: string }[] = [
  { base: "#111826", mid: "#1b2740", accent: "#7aa2f7", ink: "#e7ecf5" },
  { base: "#15121c", mid: "#241b30", accent: "#c79bf0", ink: "#f0e9f7" },
  { base: "#0f1a18", mid: "#16302c", accent: "#7fd8c0", ink: "#e6f4ef" },
  { base: "#1a1410", mid: "#33241a", accent: "#f0b072", ink: "#f7ece0" },
  { base: "#101820", mid: "#1a2c38", accent: "#79c7e0", ink: "#e6f1f5" },
  { base: "#181220", mid: "#2b1c33", accent: "#e58fc0", ink: "#f5e9f1" },
];

/** One of four compositions, chosen by the seed. */
function composition(kind: number, width: number, height: number, accent: string, ink: string): string {
  switch (kind % 4) {
    case 0: {
      /* A diagonal band with a hairline edge — a poster, not a gradient. */
      return (
        `<path d="M0 ${height} L${width * 0.72} 0 L${width} 0 L${width * 0.3} ${height} Z" fill="${accent}" opacity="0.16" />` +
        `<path d="M${width * 0.3} ${height} L${width} 0" stroke="${ink}" stroke-opacity="0.22" stroke-width="1" />`
      );
    }
    case 1: {
      /* A field of rules at two weights, like a printed staff. */
      return Array.from({ length: 9 }, (_, index) => {
        const y = Math.round(((index + 1) / 10) * height);
        const strong = index % 3 === 0;
        return `<line x1="${Math.round(width * 0.08)}" y1="${y}" x2="${Math.round(width * 0.92)}" y2="${y}" stroke="${
          strong ? accent : ink
        }" stroke-opacity="${strong ? 0.34 : 0.14}" stroke-width="${strong ? 2 : 1}" />`;
      }).join("");
    }
    case 2: {
      /* Arcs from the lower-right corner, cropped by the frame. */
      const cx = Math.round(width * 0.94);
      const cy = Math.round(height * 0.96);
      return Array.from({ length: 5 }, (_, index) => {
        const radius = Math.round(width * (0.22 + index * 0.17));
        const strong = index === 2;
        return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${strong ? accent : ink}" stroke-opacity="${
          strong ? 0.4 : 0.16
        }" stroke-width="${strong ? 2 : 1}" />`;
      }).join("");
    }
    default: {
      /* An offset grid: squares that step by a third of their own size. */
      const size = width / 7;
      const cells: string[] = [];
      for (let column = 0; column < 6; column += 1) {
        for (let row = 0; row < 4; row += 1) {
          const offset = (column + row) % 3;
          const x = Math.round(column * size + offset * (size / 3));
          const y = Math.round(row * size + offset * (size / 3));
          const side = Math.round(size * 0.62);
          cells.push(
            (column * 4 + row) % 5 === 0
              ? `<rect x="${x}" y="${y}" width="${side}" height="${side}" fill="${accent}" opacity="0.22" />`
              : `<rect x="${x}" y="${y}" width="${side}" height="${side}" fill="none" stroke="${ink}" stroke-opacity="0.12" />`,
          );
        }
      }
      return cells.join("");
    }
  }
}

export function placeholderArt(seed: string, label: string, ratio: "wide" | "tall" = "wide"): PlaceholderArt {
  const width = ratio === "wide" ? 720 : 520;
  const height = ratio === "wide" ? 405 : 780;
  const offset = hash(seed);
  const tone = PALETTE[offset % PALETTE.length]!;
  const initial = (label.trim()[0] ?? "L").toUpperCase();
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<defs>` +
    `<linearGradient id="g" x1="0" y1="0" x2="0.85" y2="1">` +
    `<stop offset="0" stop-color="${tone.mid}" />` +
    `<stop offset="1" stop-color="${tone.base}" />` +
    `</linearGradient>` +
    /* The vignette keeps the frame from reading as a flat fill at any size. */
    `<radialGradient id="v" cx="0.5" cy="0.42" r="0.78">` +
    `<stop offset="0.55" stop-color="#000000" stop-opacity="0" />` +
    `<stop offset="1" stop-color="#000000" stop-opacity="0.42" />` +
    `</radialGradient>` +
    `</defs>` +
    `<rect width="${width}" height="${height}" fill="url(#g)" />` +
    composition(offset, width, height, tone.accent, tone.ink) +
    `<rect width="${width}" height="${height}" fill="url(#v)" />` +
    `<line x1="${Math.round(width * 0.08)}" y1="${Math.round(height * 0.82)}" x2="${Math.round(width * 0.2)}" y2="${Math.round(
      height * 0.82,
    )}" stroke="${tone.accent}" stroke-opacity="0.8" stroke-width="2" />` +
    `<text x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.93)}" font-family="Georgia, 'Times New Roman', serif" ` +
    `font-size="${Math.round(height * 0.1)}" letter-spacing="2" fill="${tone.ink}" fill-opacity="0.9">${initial}</text>` +
    `</svg>`;
  return {
    src: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    width,
    height,
  };
}
