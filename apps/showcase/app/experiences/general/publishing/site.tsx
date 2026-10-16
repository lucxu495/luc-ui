"use client";

import { useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  IconButton,
  SearchInput,
  Separator,
  Tag,
  toast,
} from "@luc/ui";
import { RiArrowLeftLine, RiBookmarkLine, RiLinkM } from "@remixicon/react";
import { useI18n } from "@/lib/i18n/provider";
import { ARTICLES, TOPICS, type Article } from "./data";

/**
 * Field notes — a publishing platform.
 *
 * The typography is the product here, so the palette is the warm editorial one
 * and the type voice is the serif preset, which also loosens the leading. The
 * index is a list, not a card wall: an article index that boxes every headline
 * turns a reading surface into a product grid.
 *
 * Opening an article is local state rather than a route, on purpose — the URL
 * for these pages is the Showcase route, and faking a permalink inside a demo
 * would teach the wrong lesson. The share control copies the address the reader
 * is actually on.
 */

export function FieldNotesSite() {
  const { tcs } = useI18n();
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<string | null>(null);

  const open = ARTICLES.find((article) => article.id === openId) ?? null;
  const visible = ARTICLES.filter(
    (article) =>
      (!topic || article.topics.includes(topic)) &&
      (query.trim() === "" ||
        `${article.title} ${article.standfirst} ${article.topics.join(" ")}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())),
  );
  const related = open
    ? ARTICLES.filter(
        (article) =>
          article.id !== open.id && article.topics.some((entry) => open.topics.includes(entry)),
      ).slice(0, 2)
    : [];

  const share = async (article: Article) => {
    const url = `${window.location.origin}${window.location.pathname}#${article.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(tcs("Link copied"), { description: article.title });
    } catch {
      toast.error(tcs("The browser refused clipboard access"), {
        description: tcs("Select the address bar and copy from there instead."),
      });
    }
    window.history.replaceState(null, "", url);
  };

  if (open) {
    return (
      <article
        data-slot="field-notes-article"
        className="mx-auto flex w-full max-w-[var(--experience-max)] flex-col gap-6 px-6 py-10"
      >
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={() => setOpenId(null)}>
            <RiArrowLeftLine aria-hidden="true" className="size-4" />
            {tcs("All articles")}
          </Button>
          <div className="flex items-center gap-1">
            <IconButton
              variant="ghost"
              size="sm"
              label={tcs("Copy a link to this article")}
              icon={<RiLinkM aria-hidden="true" />}
              onClick={() => void share(open)}
            />
            <IconButton
              variant="ghost"
              size="sm"
              label={tcs("Save for later")}
              icon={<RiBookmarkLine aria-hidden="true" />}
              onClick={() => toast.info(tcs("Saved to your reading list"))}
            />
          </div>
        </div>

        <header className="flex flex-col gap-4">
          <ul className="flex list-none flex-wrap gap-1.5">
            {open.topics.map((entry) => (
              <li key={entry}>
                <Tag>{entry}</Tag>
              </li>
            ))}
          </ul>
          <h2 className="font-display text-display-sm font-semibold tracking-[-0.02em] text-fg-primary text-balance">
            {tcs(open.title)}
          </h2>
          <p className="max-w-[62ch] text-body-lg text-fg-secondary text-pretty">
            {tcs(open.standfirst)}
          </p>
          <div className="flex flex-wrap items-center gap-3 border-y border-line-subtle py-3">
            <Avatar name={open.author.name} size="sm" fallback={open.author.name.slice(0, 1)} />
            <div className="flex flex-col">
              <span className="text-label font-medium text-fg-primary">{open.author.name}</span>
              <span className="text-caption text-fg-muted">{tcs(open.author.role)}</span>
            </div>
            <time dateTime={open.published} className="ml-auto text-caption text-fg-muted luc-numeric">
              {open.published}
            </time>
            <span className="text-caption text-fg-muted">{tcs(open.readingTime)}</span>
          </div>
        </header>

        <div className="flex flex-col gap-5">
          {open.body.map((paragraph) => (
            <p
              key={paragraph}
              className="max-w-[68ch] text-body-lg leading-[1.75] text-fg-secondary text-pretty"
            >
              {tcs(paragraph)}
            </p>
          ))}
        </div>

        {related.length > 0 ? (
          <>
            <Separator />
            <section aria-label={tcs("Related")} className="flex flex-col gap-3">
              <h3 className="text-label font-semibold text-fg-primary">
                {tcs("More on these topics")}
              </h3>
              <ul className="flex list-none flex-col gap-3">
                {related.map((article) => (
                  <li key={article.id}>
                    <button
                      type="button"
                      onClick={() => setOpenId(article.id)}
                      className="luc-focus luc-transition group flex w-full flex-col items-start gap-1 rounded-sm border border-line-subtle bg-surface-raised p-4 text-left hover:border-line-default"
                    >
                      <span className="font-display text-title font-semibold text-fg-primary">
                        {tcs(article.title)}
                      </span>
                      <span className="text-caption text-fg-secondary text-pretty">
                        {tcs(article.standfirst)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : null}
      </article>
    );
  }

  return (
    <div data-slot="field-notes" className="flex flex-col">
      <header className="flex flex-col gap-5 px-6 py-10 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-micro text-fg-accent">{tcs("An occasional journal")}</p>
            <h2 className="font-display text-display font-semibold tracking-[-0.03em] text-fg-primary">
              Field notes
            </h2>
            <p className="max-w-[56ch] text-body-lg text-fg-secondary text-pretty">
              {tcs(
                "Long-form writing about the parts of software that are decided by people rather than by compilers.",
              )}
            </p>
          </div>
          <SearchInput
            aria-label={tcs("Search articles")}
            placeholder={tcs("Search titles and topics…")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full sm:w-72"
          />
        </div>

        <ul className="flex list-none flex-wrap items-center gap-1.5">
          <li>
            <Button
              size="sm"
              variant={topic === null ? "accent" : "ghost"}
              aria-pressed={topic === null}
              onClick={() => setTopic(null)}
            >
              {tcs("Everything")}
            </Button>
          </li>
          {TOPICS.map((entry) => (
            <li key={entry}>
              <Button
                size="sm"
                variant={topic === entry ? "accent" : "ghost"}
                aria-pressed={topic === entry}
                onClick={() => setTopic(topic === entry ? null : entry)}
              >
                {entry}
              </Button>
            </li>
          ))}
        </ul>
      </header>

      <div className="px-6 pb-12 lg:px-10">
        {visible.length === 0 ? (
          <EmptyState
            title={tcs("Nothing matches that search")}
            description={tcs(
              "Try a shorter word, or clear the topic filter to search the whole journal again.",
            )}
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setTopic(null);
                }}
              >
                {tcs("Clear the search")}
              </Button>
            }
          />
        ) : (
          <>
            {visible
              .filter((article) => article.featured)
              .map((article) => (
                <button
                  key={article.id}
                  type="button"
                  onClick={() => setOpenId(article.id)}
                  className="luc-focus luc-transition group mb-8 flex w-full flex-col items-start gap-3 rounded-md border border-line-subtle bg-surface-raised p-6 text-left hover:border-line-default lg:flex-row lg:items-center lg:gap-8"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-2">
                    <span className="flex items-center gap-2">
                      <Badge tone="accent" size="sm">
                        {tcs("Lead story")}
                      </Badge>
                      <span className="text-micro text-fg-muted">
                        {article.topics.join(" · ")}
                      </span>
                    </span>
                    <span className="font-display text-display-sm font-semibold tracking-[-0.02em] text-fg-primary text-balance">
                      {tcs(article.title)}
                    </span>
                    <span className="max-w-[62ch] text-body text-fg-secondary text-pretty">
                      {tcs(article.standfirst)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <Avatar
                      name={article.author.name}
                      size="sm"
                      fallback={article.author.name.slice(0, 1)}
                    />
                    <span className="flex flex-col">
                      <span className="text-caption font-medium text-fg-primary">
                        {article.author.name}
                      </span>
                      <span className="text-micro text-fg-muted">{tcs(article.readingTime)}</span>
                    </span>
                  </span>
                </button>
              ))}

            <ul className="flex list-none flex-col">
              {visible
                .filter((article) => !article.featured)
                .map((article) => (
                  <li key={article.id} className="border-t border-line-subtle first:border-t-0">
                    <button
                      type="button"
                      onClick={() => setOpenId(article.id)}
                      className="luc-focus luc-transition flex w-full items-start gap-4 rounded-sm px-2 py-5 text-left hover:bg-surface-interactive lg:gap-8"
                    >
                      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <span className="font-display text-heading-sm font-semibold text-fg-primary text-balance">
                          {tcs(article.title)}
                        </span>
                        <span className="max-w-[64ch] text-body text-fg-secondary text-pretty">
                          {tcs(article.standfirst)}
                        </span>
                        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-micro text-fg-muted">
                          <span>{article.author.name}</span>
                          <span aria-hidden="true">·</span>
                          <time dateTime={article.published} className="luc-numeric">
                            {article.published}
                          </time>
                          <span aria-hidden="true">·</span>
                          <span>{tcs(article.readingTime)}</span>
                        </span>
                      </span>
                      <span className="hidden shrink-0 pt-1 text-caption text-fg-muted sm:block">
                        {article.topics.join(" · ")}
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
