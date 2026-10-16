"use client";

import { useState } from "react";
import { Button, Card, ImageCompare, ImageGallery, Lightbox, Section, Text } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { EntryFooter } from "@/components/docs/entry-footer";
import { ImportLine } from "@/components/docs/family-imports";
import { Example } from "@/components/docs/example";
import { PropsTable } from "@/components/docs/tables";
import { useI18n } from "@/lib/i18n/provider";

/*
 * The samples are generated SVG data URIs, not fetched photographs: a
 * documentation page should not need the network, and an inline SVG is honest
 * about being a placeholder while still being a real, decodable image.
 */
function figure(label: string, from: string, to: string, accent: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 300" role="img">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>` +
    `</linearGradient></defs>` +
    `<rect width="480" height="300" fill="url(#g)"/>` +
    `<g stroke="${accent}" fill="none" stroke-width="2">` +
    `<path d="M20 240 C120 210 160 90 240 120 S380 240 460 60"/>` +
    `<path d="M20 210 C140 190 190 70 260 100 S400 210 460 30" opacity="0.55"/>` +
    `</g>` +
    `<text x="24" y="40" fill="${accent}" font-family="sans-serif" font-size="20">${label}</text>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const shots = [
  { id: "contour", src: figure("Contour", "#1b2a4a", "#24507a", "#e8f1ff"), alt: "Contour plot of a fitted surface", caption: "Contour, 12 levels" },
  { id: "matrix", src: figure("Matrix", "#2a1b3f", "#4b2a63", "#f3e8ff"), alt: "Heatmap of a correlation matrix", caption: "Correlation matrix" },
  { id: "fan", src: figure("Fan", "#123024", "#1f5a3d", "#e6fff2"), alt: "Fan chart of a forecast", caption: "Fan chart, 80 / 95" },
  { id: "spectrogram", src: figure("Spectrogram", "#3a2410", "#7a4315", "#fff3e0"), alt: "Spectrogram of a signal", caption: "Spectrogram" },
];

const before = { src: figure("Before", "#3a3a3f", "#6a6a72", "#ffffff"), alt: "Raw capture before processing" };
const after = { src: figure("After", "#102a44", "#1f6f9c", "#eaf6ff"), alt: "Same capture after processing" };

export default function MediaPage() {
  const { tc, tcs } = useI18n();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  return (
    <DocPage>
      <PageHeader eyebrow={tcs("Components")} title="Gallery, lightbox and compare" lead={tc("components.media.lead")} />

      <ImportLine line={'import { ImageCompare, ImageGallery, Lightbox } from "@luc/ui";'} />

      <Example
        title={tc("components.media.gallery.title")}
        description={tc("components.media.gallery.lead")}
        layout="block"
        code={'<ImageGallery images={shots} label="Figures" columns={4} />'}
      >

        <ImageGallery images={shots} label={tc("components.media.gallery.label")} columns={4} aspect="video" />
      </Example>

      <Example
        title={tc("components.media.lightbox.title")}
        description={tc("components.media.lightbox.lead")}
        layout="block"
        code={'<Lightbox images={shots} index={index} open={open} onOpenChange={…} onIndexChange={…} />'}
      >

        <Card variant="outline" className="flex flex-wrap items-center gap-3 p-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setIndex(0);
              setOpen(true);
            }}
          >
            {tc("components.media.lightbox.open")}
          </Button>
          <Text variant="caption" tone="muted">
            {tc("components.media.lightbox.hint")}
          </Text>
        </Card>
      </Example>

      <Lightbox
        images={shots}
        index={index}
        open={open}
        onOpenChange={setOpen}
        onIndexChange={setIndex}
        label={tc("components.media.lightbox.label")}
      />

      <Example
        title={tc("components.media.compare.title")}
        description={tc("components.media.compare.lead")}
        layout="block"
        code={'<ImageCompare before={before} after={after} />'}
      >

        <ImageCompare before={before} after={after} label={tc("components.media.compare.label")} />
      </Example>

      <Section title={tc("components.media.api.title")} description={tc("components.media.api.lead")}>
        <PropsTable
          rows={[
            { name: "GalleryImage.alt", type: "string", description: tc("components.media.api.alt") },
            { name: "ImageGallery.columns", type: "2 | 3 | 4", description: tc("components.media.api.columns") },
            { name: "ImageGallery.lightbox", type: "boolean", description: tc("components.media.api.lightbox") },
            { name: "ImageCompare.value", type: "number", description: tc("components.media.api.value") },
            { name: "ImageCompare.before/after", type: "CompareImage", description: tc("components.media.api.pair") },
          ]}
        />
      </Section>
          <EntryFooter />
    </DocPage>
  );
}
