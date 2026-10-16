/**
 * Deterministic content for the Meridian marketing experience.
 *
 * The sentences live here rather than in the page so the copy can be read as a
 * block — a landing page fails on its writing before it fails on its layout —
 * and so the i18n coverage checker attributes every one of them to this route.
 * Names, plan identifiers and prices are data, not prose, and stay as they are in
 * both languages.
 */

export interface Feature {
  id: string;
  title: string;
  body: string;
  metric: string;
  metricLabel: string;
}

export const FEATURES: Feature[] = [
  {
    id: "traces",
    title: "Traces that survive a bad day",
    body: "Every request keeps its own timeline, so an incident reads as a sequence of causes instead of a wall of red numbers.",
    metric: "1.4s",
    metricLabel: "Median trace query",
  },
  {
    id: "budgets",
    title: "Error budgets the team can see",
    body: "Burn rate, remaining budget and the freeze date sit on one line, so the argument about reliability has a number in it.",
    metric: "0.02%",
    metricLabel: "Budget spent this week",
  },
  {
    id: "rollback",
    title: "Roll back from the alert",
    body: "The alert carries the deploy it came from, so the fix is a button next to the evidence rather than a separate tab and a guess.",
    metric: "18s",
    metricLabel: "Alert to rollback",
  },
];

export interface Plan {
  id: string;
  name: string;
  /** Monthly price in the smallest displayed unit, per seat. */
  monthly: number;
  annual: number;
  summary: string;
  features: string[];
  featured?: boolean;
  cta: string;
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    monthly: 0,
    annual: 0,
    summary: "One service, one person on call, and enough history to debug it.",
    features: ["7 days of trace retention", "1 alert route", "Community support"],
    cta: "Start free",
  },
  {
    id: "team",
    name: "Team",
    monthly: 24,
    annual: 19,
    summary: "The whole on-call rotation, with budgets and a rollback that takes seconds.",
    features: ["90 days of retention", "Error budgets and freeze windows", "Unlimited alert routes"],
    featured: true,
    cta: "Start 14-day trial",
  },
  {
    id: "scale",
    name: "Scale",
    monthly: 79,
    annual: 63,
    summary: "Multiple regions, an audit trail, and a support agreement with a number in it.",
    features: ["13 months of retention", "SSO and audit log", "99.95% response agreement"],
    cta: "Talk to us",
  },
];

export interface Faq {
  id: string;
  question: string;
  answer: string;
}

export const FAQS: Faq[] = [
  {
    id: "migration",
    question: "How long does migration take?",
    answer:
      "Point an exporter at your existing collector and both receive the same data until you are satisfied. There is no cutover date and nothing to rewrite.",
  },
  {
    id: "sampling",
    question: "Do you sample my traces?",
    answer:
      "Only if you ask us to. Sampling is configured per service, the decision is recorded on every span, and errors are never dropped by a sampler you did not set.",
  },
  {
    id: "pricing",
    question: "What counts as a seat?",
    answer:
      "Anyone who can change an alert, a budget or a dashboard. Reading an incident from a shared link is free and always will be.",
  },
  {
    id: "security",
    question: "Where does the data live?",
    answer:
      "In the region you choose at signup, encrypted at rest with a key you can rotate. Enterprise plans can bring their own.",
  },
];

export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  title: string;
  org: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "vantia",
    quote: "The freeze window did more for our release cadence than a year of process documents.",
    name: "Priya Raman",
    title: "Director of engineering",
    org: "Vantia",
  },
  {
    id: "ostmond",
    quote: "An alert arrives with the deploy that caused it attached. That one detail removed most of our triage.",
    name: "Tomas Lind",
    title: "Staff SRE",
    org: "Ostmond",
  },
  {
    id: "halloway",
    quote: "We moved three teams onto it in a fortnight and nobody asked for the old dashboard back.",
    name: "Rae Halloway",
    title: "Platform lead",
    org: "Halloway Labs",
  },
];

export const HERO_METRICS = [
  { id: "services", value: "2,400", label: "services instrumented" },
  { id: "incidents", value: "31%", label: "shorter incidents" },
  { id: "latency", value: "40ms", label: "added p99 overhead" },
] as const;
