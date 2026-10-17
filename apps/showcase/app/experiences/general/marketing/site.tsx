"use client";

import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Badge, Button, Callout, Card, CardContent, Field, Input, Progress, Rating, NativeSelect, buttonVariants } from "@luc/ui";
import { useI18n } from "@/lib/i18n/provider";
import { FAQS, FEATURES, HERO_METRICS, PLANS, TESTIMONIALS } from "./data";

/**
 * Meridian — a deployment-monitoring landing page.
 *
 * The design decision that matters is the hero. The obvious treatment for a
 * developer tool is a gradient headline with three stat cards under it, which is
 * what every generated landing page does. The most characteristic thing in this
 * product's world is a *status board* — who is green, who deployed last, what is
 * burning — so the hero leads with a working ledger of four services and the
 * headline sits beside it. The type is the technical mono face at display scale
 * because the product's own output is monospaced, and cobalt rather than the
 * default cyan keeps it from reading as the analytics product.
 *
 * Three things are interactive and nothing else: the billing period, the FAQ,
 * and the lead form. A landing page that animates everything animates nothing.
 */

const LEDGER = [
  { id: "edge", name: "edge-router", status: "healthy", detail: "deployed 6m ago", value: 99.99 },
  { id: "ingest", name: "ingest-api", status: "healthy", detail: "deployed 1h ago", value: 99.94 },
  { id: "billing", name: "billing-worker", status: "degraded", detail: "burn 2.4× budget", value: 98.2 },
  { id: "search", name: "search-index", status: "healthy", detail: "deployed 3h ago", value: 99.97 },
] as const;

const LEDGER_TONE = {
  healthy: "positive",
  degraded: "warning",
  down: "negative",
} as const;

export function MeridianSite() {
  const { tcs } = useI18n();
  const [annual, setAnnual] = useState(false);
  const [submitted, setSubmitted] = useState<{ email: string; company: string } | null>(null);
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [teamSize, setTeamSize] = useState("2-10");
  const [error, setError] = useState<string | null>(null);

  const periodLabel = annual ? tcs("Annual") : tcs("Monthly");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    /*
     * The validation is deliberately the smallest thing that can still be
     * demonstrated: one required field, one format rule, an error that names the
     * fix, and a success state that repeats what was submitted. Nothing is sent
     * anywhere.
     */
    if (!email.trim()) {
      setError(tcs("Enter a work email so we can reply."));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(tcs("That address is missing an @ or a domain — check it and try again."));
      return;
    }
    setError(null);
    setSubmitted({ email: email.trim(), company: company.trim() });
  };

  return (
    <div data-slot="meridian" className="flex flex-col">
      {/* ------------------------------------------------------------ nav */}
      <nav
        aria-label={tcs("Product")}
        className="flex flex-wrap items-center justify-between gap-4 border-b border-line-subtle px-6 py-4 lg:px-10"
      >
        <span className="flex items-baseline gap-2">
          <span className="font-display text-title font-semibold text-fg-primary">Meridian</span>
          <span className="text-micro text-fg-muted">Deployment monitoring</span>
        </span>
        <ul className="flex list-none items-center gap-5 text-label text-fg-secondary">
          {[
            { href: "#features", label: tcs("Product") },
            { href: "#pricing", label: tcs("Pricing") },
            { href: "#faq", label: tcs("Questions") },
          ].map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="luc-focus rounded-xs hover:text-fg-primary"
              >
                {item.label}
              </a>
            </li>
          ))}
          <li>
            <a href="#walkthrough" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              {tcs("Sign in")}
            </a>
          </li>
        </ul>
      </nav>

      {/* ------------------------------------------------------------ hero */}
      <section className="grid gap-10 px-6 py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] lg:items-center lg:gap-14 lg:px-10 lg:py-20">
        <div className="flex flex-col gap-6">
          <p className="text-micro font-medium text-fg-accent">
            {tcs("Observability for teams on call")}
          </p>
          <h2 className="max-w-[18ch] font-display text-display font-semibold tracking-[-0.03em] text-fg-primary text-balance">
            {tcs("Know which deploy broke it, before the pager tells you")}
          </h2>
          <p className="max-w-[52ch] text-body-lg text-fg-secondary text-pretty">
            {tcs(
              "Meridian keeps the deploy, the trace and the alert in one timeline, so the first question of an incident already has an answer on screen.",
            )}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a href="#walkthrough" className={buttonVariants({ variant: "accent", size: "lg" })}>
              {tcs("Start free")}
            </a>
            <a href="#walkthrough" className={buttonVariants({ variant: "outline", size: "lg" })}>
              {tcs("See a live incident")}
            </a>
          </div>
          <p className="text-caption text-fg-muted">
            {tcs("No card, no collector to install, and a 40 ms p99 budget you can measure first.")}
          </p>
        </div>

        {/* The status ledger: the product's own surface, not a stock hero image. */}
        <Card variant="raised" className="overflow-hidden">
          <CardContent className="flex flex-col gap-0 p-0">
            <div className="flex items-center justify-between gap-4 border-b border-line-subtle px-5 py-3">
              <span className="text-label font-semibold text-fg-primary">production</span>
              <span className="flex items-center gap-2 text-micro text-fg-muted">
                <span className="size-1.5 rounded-full bg-positive-default" aria-hidden="true" />
                {tcs("3 of 4 healthy")}
              </span>
            </div>
            <ul className="flex list-none flex-col">
              {LEDGER.map((service) => (
                <li
                  key={service.id}
                  className="flex items-center gap-3 border-b border-line-subtle px-5 py-3 last:border-b-0"
                >
                  <Badge tone={LEDGER_TONE[service.status]} size="sm" dot>
                    {service.status}
                  </Badge>
                  <span className="min-w-0 flex-1 truncate font-mono text-caption text-fg-primary">
                    {service.name}
                  </span>
                  <span className="hidden shrink-0 text-micro text-fg-muted sm:block">
                    {service.detail}
                  </span>
                  <span className="w-14 shrink-0 text-right text-caption text-fg-secondary luc-numeric">
                    {service.value.toFixed(2)}%
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2 bg-surface-sunken px-5 py-4">
              <span className="flex items-center justify-between text-micro text-fg-muted">
                <span>{tcs("Error budget this week")}</span>
                <span className="luc-numeric">2%</span>
              </span>
              <Progress value={2} aria-label={tcs("Error budget consumed")} />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* --------------------------------------------------------- metrics */}
      <section
        aria-label={tcs("Adoption in numbers")}
        className="grid gap-6 border-y border-line-subtle bg-surface-sunken px-6 py-8 sm:grid-cols-3 lg:px-10"
      >
        {HERO_METRICS.map((metric) => (
          <div key={metric.id} className="flex flex-col gap-1">
            <span className="font-display text-heading font-semibold text-fg-primary luc-numeric">
              {metric.value}
            </span>
            <span className="text-caption text-fg-muted">{metric.label}</span>
          </div>
        ))}
      </section>

      {/* -------------------------------------------------------- features */}
      <section id="features" className="flex flex-col gap-12 px-6 py-14 lg:px-10 lg:py-20">
        {FEATURES.map((feature, index) => (
          <article
            key={feature.id}
            className="grid gap-6 lg:grid-cols-2 lg:items-center lg:gap-14"
          >
            <div className={index % 2 === 1 ? "lg:order-2" : undefined}>
              <h3 className="max-w-[24ch] font-display text-heading font-semibold text-fg-primary text-balance">
                {tcs(feature.title)}
              </h3>
              <p className="mt-3 max-w-[54ch] text-body text-fg-secondary text-pretty">
                {tcs(feature.body)}
              </p>
            </div>
            <div
              className={`flex items-center justify-between gap-6 rounded-lg border border-line-subtle bg-surface-raised p-6 ${
                index % 2 === 1 ? "lg:order-1" : ""
              }`}
            >
              <span className="font-display text-display-sm font-semibold text-fg-primary luc-numeric">
                {feature.metric}
              </span>
              <span className="max-w-[16ch] text-caption text-fg-muted">{feature.metricLabel}</span>
            </div>
          </article>
        ))}
      </section>

      {/* ---------------------------------------------------- testimonials */}
      <section
        aria-label={tcs("What teams say")}
        className="border-y border-line-subtle bg-surface-sunken px-6 py-14 lg:px-10"
      >
        <ul className="grid list-none gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <li key={item.id} className="flex flex-col gap-4">
              <Rating value={5} readOnly size="sm" label={tcs("Rated 5 out of 5")} />
              <blockquote className="text-body-lg text-fg-primary text-pretty">
                {tcs(item.quote)}
              </blockquote>
              <footer className="mt-auto flex flex-col">
                <span className="text-label font-medium text-fg-primary">{item.name}</span>
                <span className="text-caption text-fg-muted">
                  {item.title}, {item.org}
                </span>
              </footer>
            </li>
          ))}
        </ul>
      </section>

      {/* --------------------------------------------------------- pricing */}
      <section id="pricing" className="flex flex-col gap-8 px-6 py-14 lg:px-10 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-heading font-semibold text-fg-primary">
              {tcs("Priced per seat, on call or not")}
            </h2>
            <p className="max-w-[56ch] text-body text-fg-secondary text-pretty">
              {tcs(
                "Anyone who can change an alert is a seat. Anyone reading an incident from a shared link never is.",
              )}
            </p>
          </div>
          {/* The billing period is one control with two states, not a checkbox. */}
          <div className="flex items-center gap-3">
            <span className="text-caption text-fg-muted">{periodLabel}</span>
            <Button
              variant="outline"
              size="sm"
              aria-pressed={annual}
              onClick={() => setAnnual((value) => !value)}
            >
              {annual ? tcs("Switch to monthly") : tcs("Switch to annual")}
            </Button>
          </div>
        </div>

        <ul className="grid list-none gap-5 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const price = annual ? plan.annual : plan.monthly;
            return (
              <li key={plan.id} className="min-w-0">
                <Card
                  variant={plan.featured ? "raised" : "default"}
                  className={plan.featured ? "flex h-full flex-col border-line-accent" : "flex h-full flex-col"}
                >
                  <CardContent className="flex h-full flex-col gap-5 p-6">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-title font-semibold text-fg-primary">{plan.name}</h3>
                      {plan.featured ? <Badge tone="accent" size="sm">{tcs("Most teams")}</Badge> : null}
                    </div>
                    <p className="flex items-baseline gap-1.5">
                      <span
                        data-slot="plan-price"
                        className="font-display text-display-sm font-semibold text-fg-primary luc-numeric"
                      >
                        ${price}
                      </span>
                      <span className="text-caption text-fg-muted">
                        {price === 0 ? tcs("forever, for one service") : tcs("per seat / month")}
                      </span>
                    </p>
                    <p className="text-body text-fg-secondary text-pretty">{tcs(plan.summary)}</p>
                    <ul className="flex list-none flex-col gap-2 text-caption text-fg-secondary">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex gap-2">
                          <span aria-hidden="true" className="text-fg-accent">
                            ·
                          </span>
                          {tcs(feature)}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto pt-2">
                      <a
                        href="#walkthrough"
                        className={buttonVariants({
                          variant: plan.featured ? "accent" : "outline",
                          className: "w-full",
                        })}
                      >
                        {tcs(plan.cta)}
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
        {annual ? (
          <p aria-live="polite" className="text-caption text-fg-accent">
            {tcs("Annual billing takes 20% off every paid plan, charged once a year.")}
          </p>
        ) : null}
      </section>

      {/* ------------------------------------------------------------- faq */}
      <section id="faq" className="grid gap-8 border-t border-line-subtle px-6 py-14 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-14 lg:px-10 lg:py-20">
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-heading font-semibold text-fg-primary">
            {tcs("Questions we get before the trial")}
          </h2>
          <p className="text-body text-fg-secondary text-pretty">
            {tcs("Answers are short on purpose. Anything longer belongs in a conversation.")}
          </p>
        </div>
        <Accordion type="single" collapsible>
          {FAQS.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id}>
              <AccordionTrigger>{tcs(faq.question)}</AccordionTrigger>
              <AccordionContent>
                <p className="max-w-[70ch] text-body text-fg-secondary text-pretty">
                  {tcs(faq.answer)}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* ------------------------------------------------------ lead form */}
      <section
        id="walkthrough"
        aria-label={tcs("Request a walkthrough")}
        className="grid gap-8 scroll-mt-6 bg-surface-sunken px-6 py-14 lg:grid-cols-2 lg:gap-14 lg:px-10 lg:py-20"
      >
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-heading font-semibold text-fg-primary text-balance">
            {tcs("See it against your own traffic")}
          </h2>
          <p className="max-w-[46ch] text-body text-fg-secondary text-pretty">
            {tcs(
              "We will point Meridian at one of your services, run it beside what you have, and leave you the comparison.",
            )}
          </p>
        </div>

        {submitted ? (
          <Callout tone="success" title={tcs("Request received")}>
            <p className="text-body text-fg-secondary text-pretty">
              {tcs("We will reply within one working day.")}{" "}
              <span className="font-medium text-fg-primary luc-numeric">{submitted.email}</span>
              {submitted.company ? (
                <>
                  {" "}
                  {tcs("We will include a setup sketch for your environment.")}{" "}
                  <span className="font-medium text-fg-primary">{submitted.company}</span>
                </>
              ) : null}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => {
                setSubmitted(null);
                setEmail("");
                setCompany("");
              }}
            >
              {tcs("Send another")}
            </Button>
          </Callout>
        ) : (
          <form onSubmit={submit} noValidate className="flex flex-col gap-4">
            <Field
              label={tcs("Work email")}
              error={error ?? undefined}
              description={tcs("We reply from a real address, not a no-reply one.")}
              required
            >
              <Input
                type="email"
                name="email"
                autoComplete="email"
                spellCheck={false}
                placeholder={tcs("you@company.com")}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Field label={tcs("Company")} description={tcs("Optional, and only used for the setup sketch.")}>
              <Input
                name="organization"
                autoComplete="organization"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
              />
            </Field>
            <Field label={tcs("Engineering team size")}>
              <NativeSelect
                name="teamSize"
                value={teamSize}
                onChange={(event) => setTeamSize(event.target.value)}
              >
                {["1", "2-10", "11-50", "51-200", "200+"].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <div className="flex items-center gap-3">
              <Button type="submit" variant="accent">
                {tcs("Request a walkthrough")}
              </Button>
              <span className="text-caption text-fg-muted">
                {tcs("No sales sequence. One reply from an engineer.")}
              </span>
            </div>
          </form>
        )}
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-line-subtle px-6 py-6 text-caption text-fg-muted lg:px-10">
        <span>Meridian — {tcs("a fictional product, for demonstrating Luc UI")}</span>
        <span className="luc-numeric">1429</span>
      </footer>
    </div>
  );
}
