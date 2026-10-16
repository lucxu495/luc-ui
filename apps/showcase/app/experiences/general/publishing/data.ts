/**
 * Field notes — six articles with the metadata an index actually needs.
 *
 * Reading time is authored rather than computed: a word count divided by 200 is
 * a guess dressed as a fact, and the library has no business inventing one.
 */

export interface Article {
  id: string;
  title: string;
  standfirst: string;
  body: string[];
  topics: string[];
  author: { name: string; role: string };
  published: string;
  readingTime: string;
  featured?: boolean;
}

export const ARTICLES: Article[] = [
  {
    id: "quiet-infrastructure",
    title: "The quiet cost of a queue",
    standfirst:
      "A queue is not free capacity. It is a loan against your incident channel, and the interest compounds.",
    body: [
      "Every queue in a system is a promise that somebody will get to the work later. The promise is cheap to make and expensive to keep: the backlog becomes a second product with its own state, its own dashboards and its own on-call questions.",
      "The teams that stay calm under load are not the ones with the biggest buffers. They are the ones that can say, in one sentence, what happens when the buffer is full — and that answer is usually a decision about which work to refuse.",
      "So write the sentence down. If nobody can, the buffer is not a design, it is a hope.",
    ],
    topics: ["Reliability", "Architecture"],
    author: { name: "Priya Raman", role: "Platform engineering" },
    published: "2026-09-18",
    readingTime: "6 min",
    featured: true,
  },
  {
    id: "dashboards-nobody-reads",
    title: "Dashboards nobody reads",
    standfirst:
      "A dashboard is a question with a shape. If the question changed, the dashboard is now a decoration.",
    body: [
      "Most dashboards die of a slow, polite neglect. Someone asked a question once, panels were built, and then the question was answered permanently by a change upstream — while the panels stayed, still green.",
      "The cheap fix is a deletion pass with a date on it: every panel has to be defended by the last incident it helped with. Panels that cannot name one get archived, not deleted, because the next incident will tell you whether you were right.",
    ],
    topics: ["Observability", "Practice"],
    author: { name: "Tomas Lind", role: "Site reliability" },
    published: "2026-09-09",
    readingTime: "4 min",
  },
  {
    id: "naming-the-thing",
    title: "Naming the thing before you build it",
    standfirst:
      "Half of the arguments in a design review are vocabulary, not engineering, and they can be settled in advance.",
    body: [
      "A surprising share of review time goes to two people describing the same behaviour with different nouns. Nothing about the system is in dispute; the dictionary is.",
      "Writing the three or four nouns down — what a run is, what a window is, what counts as complete — costs an hour and removes the argument from every meeting afterwards.",
    ],
    topics: ["Practice", "Teams"],
    author: { name: "Rae Halloway", role: "Design" },
    published: "2026-08-30",
    readingTime: "5 min",
  },
  {
    id: "the-migration-that-did-not-happen",
    title: "The migration that did not happen",
    standfirst:
      "We spent a quarter preparing to move a database and shipped nothing. It was the right call, and here is the signal that made it one.",
    body: [
      "Two weeks before the cutover, the parity check disagreed by four rows out of ninety million. Every instinct said to ship and reconcile afterwards.",
      "What stopped us was arithmetic: four unexplained rows is not a rounding error, it is a class of bug we had not found. We traced it to a timezone boundary, fixed it, and then discovered two more of the same shape.",
      "The migration eventually happened six months later, in a week, with no incident. The quarter was not wasted — it was the price of knowing what we were moving.",
    ],
    topics: ["Reliability", "Databases"],
    author: { name: "Ifeoma Nwosu", role: "Data engineering" },
    published: "2026-08-21",
    readingTime: "8 min",
  },
  {
    id: "reading-the-room",
    title: "Reading the room in an incident",
    standfirst:
      "The hardest skill in an incident is not diagnosis. It is knowing when to stop diagnosing.",
    body: [
      "An incident has two clocks: the one measuring impact and the one measuring understanding. They rarely move at the same speed, and the mistake is to let the second one set the pace.",
      "Mitigate first when the impact is growing and the hypothesis is not. Then investigate, with the system already stable and the timer already stopped.",
    ],
    topics: ["Reliability", "Teams"],
    author: { name: "Aiko Tanaka", role: "Incident response" },
    published: "2026-08-12",
    readingTime: "5 min",
  },
  {
    id: "small-tools",
    title: "In defence of the small internal tool",
    standfirst:
      "A forty-line script with a proper output format outlives most platforms, because it can be read in one sitting.",
    body: [
      "Internal tools fail for a specific reason: nobody can hold the whole thing in their head, so the knowledge moves into the tool's documentation, and then out of the company.",
      "The counter-move is not discipline, it is size. Keep the tool small enough that one person can read it on a laptop screen and still understand the failure modes.",
    ],
    topics: ["Practice", "Architecture"],
    author: { name: "Samir Haddad", role: "Engineering" },
    published: "2026-08-01",
    readingTime: "3 min",
  },
];

export const TOPICS = ["Reliability", "Architecture", "Practice", "Teams", "Observability", "Databases"] as const;
