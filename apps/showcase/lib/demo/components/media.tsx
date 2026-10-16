/*
 * Live Demos — Media.
 *
 * `image-compare`, `image-gallery`.
 */

/*
 * Media components.
 *
 * Both specimens need real images, and this repository ships no photography —
 * deliberately, because a documentation site that hotlinks stock images breaks
 * when the host does. The demo therefore generates its figures: small SVG data
 * URIs, deterministic, offline, and obviously diagrams rather than photographs
 * passed off as content.
 */

import { ImageCompare, ImageGallery, Stack, Text } from "@luc/ui";
import { composition, type DemoSpec } from "../index";

/** A deterministic labelled figure, as a data URI. No network, no assets. */
function figure(label: string, from: string, to: string, ink: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/>
  </linearGradient></defs>
  <rect width="480" height="300" fill="url(#g)"/>
  <path d="M0 210 C80 170 140 240 220 190 C300 140 360 200 480 150" fill="none" stroke="${ink}" stroke-width="3" opacity="0.7"/>
  <text x="20" y="40" fill="${ink}" font-family="ui-sans-serif, system-ui" font-size="20">${label}</text>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const SHOTS = [
  { id: "contour", src: figure("Contour", "#1b2a4a", "#24507a", "#e8f1ff"), alt: "Contour plot", caption: "Contour" },
  { id: "matrix", src: figure("Matrix", "#2a1b3f", "#4b2a63", "#f3e8ff"), alt: "Correlation matrix", caption: "Matrix" },
  { id: "fan", src: figure("Fan", "#123024", "#1f5a3d", "#e6fff2"), alt: "Forecast fan", caption: "Fan" },
  { id: "spectro", src: figure("Spectrogram", "#3a2410", "#7a4315", "#fff3e0"), alt: "Spectrogram", caption: "Spectrogram" },
];

const BEFORE = { src: figure("Before", "#3a3a3f", "#6a6a72", "#ffffff"), alt: "Raw capture" };
const AFTER = { src: figure("After", "#102a44", "#1f6f9c", "#eaf6ff"), alt: "Processed capture" };

export const mediaDemos: readonly DemoSpec[] = [
  composition({
    id: "image-gallery",
    node: <ImageGallery images={SHOTS} label="Figures" columns={4} aspect="video" />,
    layout: "block",
    note: "Four figures on a video aspect; the caption is the accessible name's companion, not a replacement for it.",
    code: `<ImageGallery
  images={shots}
  label="Figures"
  columns={4}
  aspect="video"
/>`,
  }),
  composition({
    id: "image-compare",
    node: (
      <Stack gap="sm" className="w-full max-w-xl">
        <ImageCompare before={BEFORE} after={AFTER} label="Before and after processing" />
        <Text variant="caption" tone="muted" as="p">
          Drag the handle, or use the arrow keys once it has focus.
        </Text>
      </Stack>
    ),
    layout: "block",
    note: "A real draggable divider with a keyboard path, not a CSS mask.",
    code: `<ImageCompare before={before} after={after} label="Before and after processing" />`,
  }),
];
