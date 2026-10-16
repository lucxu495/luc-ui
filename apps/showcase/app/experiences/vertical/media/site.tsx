"use client";

import Image from "next/image";

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Field,
  ImageGallery,
  Rating,
  SortableList,
  Textarea,
  toast,
  type SortableItem,
} from "@luc/ui";
import { useI18n } from "@/lib/i18n/provider";
import { placeholderArt } from "../../placeholder-art";

// Reel — a creator studio.
//
// Two jobs in one screen: browse a library, and put a collection in order. The
// ordering is the interesting half, because a media library's real interaction
// is "this shot goes before that one" — pointer or keyboard — and the component
// reports the complete order rather than a delta, so an application can persist
// it without reconciling anything.
//
// The metadata form edits a title and a note that survive switching between
// items, which is the smallest honest version of an editor: no fake rich text,
// no preview that pretends to save somewhere.

interface Asset {
  id: string;
  title: string;
  note: string;
  rating: number;
  duration: string;
}

const ASSETS: Asset[] = [
  { id: "a1", title: "Harbour, 06:10", note: "Low tide, no wind. The one that made the sequence work.", rating: 5, duration: "0:42" },
  { id: "a2", title: "Ferry departure", note: "Handheld, deliberately. It carries the nervousness of the day.", rating: 4, duration: "1:15" },
  { id: "a3", title: "Rope and rivets", note: "Macro insert. Might be too on-the-nose.", rating: 3, duration: "0:28" },
  { id: "a4", title: "Crossing, wide", note: "The establishing shot. Lost two stops of sky, will grade later.", rating: 4, duration: "2:03" },
];

const REEL_ORDER = ["a1", "a4", "a2", "a3"];

export function CreatorStudio() {
  const { tcs } = useI18n();
  const [assets, setAssets] = useState(ASSETS);
  const [order, setOrder] = useState<string[]>(REEL_ORDER);
  const [selectedId, setSelectedId] = useState(ASSETS[0]!.id);

  const selected = assets.find((asset) => asset.id === selectedId) ?? assets[0]!;
  const ordered = order
    .map((id) => assets.find((asset) => asset.id === id))
    .filter((asset): asset is Asset => Boolean(asset));

  const reorder = (ids: string[]) => {
    setOrder(ids);
    toast.success(tcs("Reel order updated"), {
      description: `${tcs("New first shot:")} ${
        assets.find((asset) => asset.id === ids[0])?.title ?? ""
      }`,
    });
  };

  return (
    <div data-slot="creator-studio" className="flex flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <h2 className="font-display text-heading-sm font-semibold text-fg-primary">
            {tcs("Crossing")}
          </h2>
          <p className="text-caption text-fg-muted">
            {tcs("Four assets, three minutes, and an order that is still moving.")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="info" size="sm">
            {tcs("Draft")}
          </Badge>
          <Button size="sm" variant="accent" onClick={() => toast.success(tcs("Saved locally"))}>
            {tcs("Save")}
          </Button>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <section aria-labelledby="library" className="flex flex-col gap-3">
            <h3 id="library" className="text-label font-semibold text-fg-primary">
              {tcs("Library")}
            </h3>
            <ImageGallery
              label={tcs("Footage library")}
              columns={3}
              aspect="video"
              onOpen={(index) => setSelectedId(assets[index]?.id ?? selectedId)}
              lightbox={false}
              images={assets.map((asset) => {
                const art = placeholderArt(asset.id, asset.title);
                return {
                  id: asset.id,
                  src: art.src,
                  width: art.width,
                  height: art.height,
                  alt: tcs("Still frame from {title}").replace("{title}", tcs(asset.title)),
                  caption: `${tcs(asset.title)} · ${asset.duration}`,
                };
              })}
            />
          </section>

          <section aria-labelledby="reel" className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <h3 id="reel" className="text-label font-semibold text-fg-primary">
                {tcs("Reel order")}
              </h3>
              <span className="text-micro text-fg-muted">
                {tcs("Drag the handle, or focus it and use the arrow keys.")}
              </span>
            </div>
            <SortableList
              label={tcs("Reel order")}
              items={ordered.map<SortableItem>((asset) => ({
                id: asset.id,
                label: tcs(asset.title),
                description: asset.duration,
              }))}
              onReorder={reorder}
            />
            <p data-slot="reel-first-shot" aria-live="polite" className="text-caption text-fg-muted">
              {tcs("Current first shot:")} <span className="font-medium text-fg-secondary">{ordered[0]?.title}</span>
            </p>
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <Card variant="raised">
            <CardContent className="flex flex-col gap-4 p-4">
              <h3 className="text-label font-semibold text-fg-primary">{tcs("Asset")}</h3>
              <Image
                unoptimized
                {...placeholderArt(selected.id, selected.title)}
                alt={tcs("Still frame from {title}").replace("{title}", tcs(selected.title))}
                className="aspect-video w-full rounded-sm border border-line-subtle object-cover"
              />
              <Field label={tcs("Title")}>
                <Textarea
                  name="asset-title"
                  size="sm"
                  autoResize
                  value={tcs(selected.title)}
                  onChange={(event) =>
                    setAssets((current) =>
                      current.map((asset) =>
                        asset.id === selected.id ? { ...asset, title: event.target.value } : asset,
                      ),
                    )
                  }
                />
              </Field>
              <Field
                label={tcs("Note")}
                description={tcs("Kept with the asset. Nothing is uploaded anywhere.")}
              >
                <Textarea
                  name="asset-note"
                  autoResize
                  value={tcs(selected.note)}
                  onChange={(event) =>
                    setAssets((current) =>
                      current.map((asset) =>
                        asset.id === selected.id ? { ...asset, note: event.target.value } : asset,
                      ),
                    )
                  }
                />
              </Field>
              <Field label={tcs("Keep rating")}>
                <Rating
                  value={selected.rating}
                  onValueChange={(next) =>
                    setAssets((current) =>
                      current.map((asset) =>
                        asset.id === selected.id ? { ...asset, rating: next } : asset,
                      ),
                    )
                  }
                  label={tcs("Keep rating")}
                />
              </Field>
              <div className="flex flex-wrap gap-2 border-t border-line-subtle pt-3">
                {assets.map((asset) => (
                  <Button
                    key={asset.id}
                    size="sm"
                    variant={asset.id === selected.id ? "accent" : "outline"}
                    aria-pressed={asset.id === selected.id}
                    onClick={() => setSelectedId(asset.id)}
                  >
                    {asset.duration}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
