"use client";

import Image from "next/image";

import { Badge, Card, CardContent, Separator, Timeline } from "@luc/ui";
import { ProfileHero, PublicationList, SocialLinks } from "@luc/ui/experiences";
import { RiGoogleFill, RiLinksLine, RiMailLine, RiPlantLine } from "@remixicon/react";
import { useI18n } from "@/lib/i18n/provider";
import { INTERESTS, PROFILE, PUBLICATIONS, TALKS, TEACHING } from "./data";
import { placeholderArt } from "../../placeholder-art";

// Dr. Rita Silva — an academic profile.
//
// The bibliography is the product, so the page is quiet everywhere else: no
// cards around the publications, no colour on the years, and a single measure
// for the body text. The one expressive decision is the interest note under
// each heading, because that is the sentence a visitor actually reads first.
//
// Filters are the reason this page is not a static list: a visitor arrives
// looking for one topic, and the facets are derived from the entries rather than
// maintained by hand.

export function AcademicProfile() {
  const { tcs } = useI18n();

  return (
    <div data-slot="academic-profile" className="mx-auto flex w-full max-w-[var(--experience-max)] flex-col gap-12 px-6 py-12">
      <ProfileHero
        variant="instrument"
        eyebrow={tcs("Instituto Atlântico, Lisbon")}
        name={PROFILE.name}
        title={tcs(PROFILE.title)}
        lead={tcs(PROFILE.lead)}
        facts={[
          { id: "publications", label: tcs("Publications"), value: String(PUBLICATIONS.length) },
          { id: "citations", label: tcs("Citations"), value: "233" },
          { id: "since", label: tcs("First paper"), value: "2022" },
        ]}
        links={[
          { id: "scholar", label: "Scholar", href: "https://example.edu/scholar/rita", handle: "r-silva", icon: <RiGoogleFill aria-hidden="true" className="size-4" /> },
          { id: "orcid", label: "ORCID", href: "https://example.edu/orcid", handle: "0000-0000-0000-0000", icon: <RiLinksLine aria-hidden="true" className="size-4" /> },
          { id: "mail", label: "Email", href: `mailto:${PROFILE.email}`, handle: PROFILE.email, icon: <RiMailLine aria-hidden="true" className="size-4" /> },
        ]}
        portrait={
          <Image
            unoptimized
            {...placeholderArt("rita-silva", "R", "tall")}
            alt={tcs("Illustrated portrait of Dr. Rita Silva")}
            className="aspect-square w-40 rounded-lg object-cover sm:w-48"
          />
        }
      />

      <section aria-labelledby="research-interests" className="flex flex-col gap-5">
        <h2 id="research-interests" className="font-display text-heading font-semibold text-fg-primary">
          {tcs("What I am working on")}
        </h2>
        <ul className="grid list-none gap-4 sm:grid-cols-3">
          {INTERESTS.map((interest) => (
            <li key={interest.id} className="flex flex-col gap-1.5 border-t border-line-subtle pt-4">
              <span className="flex items-center gap-2 text-label font-semibold text-fg-primary">
                <RiPlantLine aria-hidden="true" className="size-4 text-fg-accent" />
                {tcs(interest.label)}
              </span>
              <span className="text-caption text-fg-secondary text-pretty">{tcs(interest.note)}</span>
            </li>
          ))}
        </ul>
      </section>

      <Separator />

      <section aria-labelledby="publications" className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 id="publications" className="font-display text-heading font-semibold text-fg-primary">
              {tcs("Publications")}
            </h2>
            <p className="max-w-[60ch] text-body text-fg-secondary text-pretty">
              {tcs(
                "Newest first, in the order the venues print them. Filter by year, type or topic; the counts are the entries themselves, not a number I maintain.",
              )}
            </p>
          </div>
        </div>
        <PublicationList
          publications={PUBLICATIONS.map((entry) => ({
            ...entry,
            title: tcs(entry.title),
            venue: tcs(entry.venue),
            kind: entry.kind ? tcs(entry.kind) : undefined,
            topics: entry.topics?.map((topic) => tcs(topic)),
            note: entry.note ? tcs(entry.note) : undefined,
          }))}
          filterLabel={tcs("Filter publications")}
          emptyText={tcs("No publications match these filters.")}
        />
      </section>

      <Separator />

      <div className="grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="talks" className="flex flex-col gap-5">
          <h2 id="talks" className="font-display text-heading font-semibold text-fg-primary">
            {tcs("Talks")}
          </h2>
          <Timeline
            density="compact"
            items={TALKS.map((talk) => ({
              id: talk.id,
              title: tcs(talk.title),
              description: (
                <span className="flex flex-col gap-1">
                  <span>{tcs(talk.venue)}</span>
                  <span className="text-caption text-fg-muted">{tcs(talk.note)}</span>
                </span>
              ),
              meta: talk.year,
              detail: null,
            }))}
          />
        </section>

        <section aria-labelledby="teaching" className="flex flex-col gap-5">
          <h2 id="teaching" className="font-display text-heading font-semibold text-fg-primary">
            {tcs("Teaching")}
          </h2>
          <ul className="flex list-none flex-col gap-3">
            {TEACHING.map((course) => (
              <li key={course.id}>
                <Card variant="default">
                  <CardContent className="flex flex-col gap-2 p-4">
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-title font-semibold text-fg-primary">
                        {tcs(course.title)}
                      </span>
                      <Badge tone="info" size="sm">
                        {tcs(course.level)}
                      </Badge>
                    </span>
                    <span className="text-caption text-fg-secondary text-pretty">
                      {tcs(course.detail)}
                    </span>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2 rounded-md border border-line-subtle bg-surface-sunken p-4">
            <span className="text-label font-semibold text-fg-primary">{tcs("Elsewhere")}</span>
            <SocialLinks
              links={[
                { id: "scholar", label: "Scholar", href: "https://example.edu/scholar/rita", handle: "r-silva" },
                { id: "orcid", label: "ORCID", href: "https://example.edu/orcid", handle: "0000-0000-0000-0000" },
                { id: "mail", label: "Email", href: `mailto:${PROFILE.email}`, handle: PROFILE.email },
              ]}
              orientation="column"
              size="sm"
            />
          </div>
        </section>
      </div>

      <p className="text-caption text-fg-muted">
        {tcs(
          "Every citation on this page is fictional: the identifiers are shaped like real ones so the layout can be judged, and they resolve nowhere.",
        )}
      </p>
    </div>
  );
}
