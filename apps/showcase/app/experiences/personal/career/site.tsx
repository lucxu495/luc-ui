"use client";

import Image from "next/image";

import { Badge, Button, Card, CardContent, Separator, buttonVariants, toast } from "@luc/ui";
import {
  ExperienceTimeline,
  ProfileHero,
  ProjectShowcase,
  SocialLinks,
} from "@luc/ui/experiences";
import { RiGithubLine, RiLinkedinBoxLine, RiMailLine } from "@remixicon/react";
import { useI18n } from "@/lib/i18n/provider";
import { CAREER, PROJECTS, SKILL_GROUPS } from "./data";
import { placeholderArt } from "../../placeholder-art";

// Ada Okonkwo — a professional profile.
//
// A career page is not an admin dashboard and must not look like one: the
// hierarchy is editorial, the numbers are few, and the timeline earns its length
// because a career genuinely is a sequence.
//
// The résumé action is the detail worth getting right. A "Download CV" button
// that points at a file that is not bundled is the single most common broken
// promise on a personal site, so this one prints the page instead — with the
// print styles doing the work of hiding the controls — and says so.

export function CareerProfile() {
  const { tcs } = useI18n();

  return (
    <div data-slot="career-profile" className="mx-auto flex w-full max-w-[var(--experience-max)] flex-col gap-12 px-6 py-12">
      <ProfileHero
        eyebrow={tcs("Available for consulting from January")}
        name="Ada Okonkwo"
        title={tcs("Distributed systems engineer")}
        lead={tcs(
          "I build storage layers that keep working when a region does not. Twelve years across two continents, most of it on the part of a system that is only interesting at 3am.",
        )}
        facts={[
          { id: "base", label: tcs("Based in"), value: "Lisbon" },
          { id: "since", label: tcs("Since"), value: "2014" },
          { id: "focus", label: tcs("Focus"), value: tcs("Replication, consensus") },
        ]}
        links={[
          { id: "github", label: "GitHub", href: "https://github.com/", handle: "ada-okonkwo", icon: <RiGithubLine aria-hidden="true" className="size-4" /> },
          { id: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/", handle: "adaokonkwo", icon: <RiLinkedinBoxLine aria-hidden="true" className="size-4" /> },
          { id: "mail", label: "Email", href: "mailto:ada@example.com", handle: "ada@example.com", icon: <RiMailLine aria-hidden="true" className="size-4" /> },
        ]}
        actions={
          <>
            <Button
              variant="accent"
              onClick={() => {
                toast.info(tcs("Opening the print dialog"), {
                  description: tcs("Choose “Save as PDF” to keep a copy."),
                });
                window.print();
              }}
            >
              {tcs("Print a CV")}
            </Button>
            <a
              href="mailto:ada@example.com?subject=Consulting"
              className={buttonVariants({ variant: "outline" })}
            >
              {tcs("Start a conversation")}
            </a>
          </>
        }
        portrait={
          <Image
            unoptimized
            {...placeholderArt("ada-okonkwo", "A", "tall")}
            alt={tcs("Illustrated portrait of Ada Okonkwo")}
            className="aspect-[3/4] w-44 rounded-lg object-cover sm:w-52"
          />
        }
      />

      <Separator />

      {/*
       * The chronology and the credentials sit side by side on a wide screen.
       * Both are short, both are read by skimming, and stacking them was what
       * left two thirds of a 1920px window blank below the hero. The timeline
       * takes the ragged column because it is a sequence; the rail is fixed
       * width because a list of skills has a natural size and stretching it
       * would be the same mistake in the other direction.
       */}
      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_22rem] xl:gap-14">
        <section aria-labelledby="career-history" className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 id="career-history" className="font-display text-heading font-semibold text-fg-primary">
              {tcs("Where the work has been")}
            </h2>
            <p className="max-w-[62ch] text-body text-fg-secondary text-pretty">
              {tcs(
                "Three roles, each one a longer problem than the last. The highlights are the things I would still defend in a review.",
              )}
            </p>
          </div>
          {/*
           * A published composite renders the strings it is given — it has no
           * dictionary and should not have one. So the *caller* localises: the
           * entries are mapped through `tcs` here rather than inside the library.
           */}
          <ExperienceTimeline
            items={CAREER.map((entry) => ({
              ...entry,
              role: tcs(entry.role),
              summary: entry.summary ? tcs(entry.summary) : undefined,
              highlights: entry.highlights?.map((highlight) => tcs(highlight)),
              tags: entry.tags?.map((tag) => tcs(tag)),
            }))}
            currentLabel={tcs("Present")}
          />
        </section>

        <aside className="flex min-w-0 flex-col gap-8 xl:sticky xl:top-8 xl:self-start">
          <section aria-labelledby="career-skills" className="flex flex-col gap-6">
            <h2 id="career-skills" className="font-display text-heading-sm font-semibold text-fg-primary">
              {tcs("What I work with")}
            </h2>
            <ul className="flex list-none flex-col gap-5">
              {SKILL_GROUPS.map((group) => (
                <li key={group.id} className="flex flex-col gap-2.5">
                  <h3 className="text-label font-semibold text-fg-primary">{tcs(group.label)}</h3>
                  <ul className="flex list-none flex-wrap gap-1.5">
                    {group.skills.map((skill) => (
                      <li key={skill}>
                        <Badge tone="neutral" size="md">
                          {skill}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>

          <Card variant="raised">
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="flex flex-col gap-1">
                <h2 className="font-display text-heading-sm font-semibold text-fg-primary">
                  {tcs("Working on something that has to stay up?")}
                </h2>
                <p className="text-body text-fg-secondary text-pretty">
                  {tcs(
                    "I take one consulting engagement at a time, usually a review of a replication or migration plan before it is committed to.",
                  )}
                </p>
              </div>
              <SocialLinks
                links={[
                  { id: "mail", label: "Email", href: "mailto:ada@example.com", handle: "ada@example.com" },
                  { id: "github", label: "GitHub", href: "https://github.com/", handle: "ada-okonkwo" },
                ]}
                orientation="column"
                size="sm"
              />
            </CardContent>
          </Card>
        </aside>
      </div>

      <Separator />

      <section aria-labelledby="career-work" className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 id="career-work" className="font-display text-heading font-semibold text-fg-primary">
            {tcs("Selected work")}
          </h2>
          <p className="max-w-[62ch] text-body text-fg-secondary text-pretty">
            {tcs(
              "Choose a project to read the reasoning behind it. The grid stays on screen so the work can be compared rather than replaced.",
            )}
          </p>
        </div>
        <ProjectShowcase
          projects={PROJECTS.map((project) => ({
            ...project,
            title: tcs(project.title),
            summary: tcs(project.summary),
            tags: project.tags.map((tag) => tcs(tag)),
            meta: project.meta.map((fact) => ({ ...fact, label: tcs(fact.label) })),
          }))}
          defaultOpenFirst
          label={tcs("Selected projects")}
          renderMedia={(project) => (
            <Image
              unoptimized
              {...placeholderArt(project.id, project.title)}
              alt={tcs("Cover artwork for {name}").replace("{name}", tcs(project.title))}
              className="size-full object-cover"
            />
          )}
          renderDetail={(project) => (
            <p className="text-pretty">
              {tcs(PROJECTS.find((entry) => entry.id === project.id)?.detail ?? project.summary ?? "")}
            </p>
          )}
        />
      </section>
    </div>
  );
}
