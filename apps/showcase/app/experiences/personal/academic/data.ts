/**
 * Dr. Rita Silva's research page.
 *
 * Every citation, DOI and venue here is fictional and clearly shaped like one
 * (`10.0000/…`, `example.edu`). A demonstration that invented plausible-looking
 * real citations would be worse than useless: a reader could copy one, and a
 * reviewer could not tell the fixture from the record.
 */

import type { Publication } from "@luc/ui/experiences";

export const PROFILE = {
  name: "Dr. Rita Silva",
  title: "Computational linguistics, Instituto Atlântico",
  lead: "I study how language models lose information as documents get longer, and what can be measured about that loss without asking the model how it feels.",
  email: "r.silva@example.edu",
};

export const INTERESTS = [
  {
    id: "attention",
    label: "Long-context attention",
    note: "Sparse and hierarchical attention, and the cost of the approximation.",
  },
  {
    id: "evaluation",
    label: "Evaluation without a benchmark",
    note: "Measurements that survive the next model, and the ones that do not.",
  },
  {
    id: "morphology",
    label: "Morphology and low-resource languages",
    note: "What a tokeniser does to a language it was not trained on.",
  },
];

export const PUBLICATIONS: Publication[] = [
  {
    id: "p1",
    title: "Sparse attention degrades at the seventh hop",
    authors: "R. Silva, M. Okonkwo",
    venue: "Transactions on Language Technology",
    year: 2026,
    kind: "Journal article",
    topics: ["Long-context attention", "Evaluation"],
    doi: "10.0000/fictional.tlt.2026.14",
    citations: 24,
  },
  {
    id: "p2",
    title: "A tokeniser audit for agglutinative languages",
    authors: "R. Silva, A. Tan",
    venue: "Workshop on Low-Resource Language Technology",
    year: 2025,
    kind: "Conference paper",
    topics: ["Morphology and low-resource languages"],
    doi: "10.0000/fictional.wlrt.2025.3",
    citations: 11,
    note: "Best paper, runner-up",
  },
  {
    id: "p3",
    title: "Holding the evaluation fixed while the model changes",
    authors: "A. Tan, R. Silva",
    venue: "Preprint",
    year: 2025,
    kind: "Preprint",
    topics: ["Evaluation"],
    url: "https://example.edu/preprints/holding-fixed",
  },
  {
    id: "p4",
    title: "Retrieval is not a substitute for context",
    authors: "R. Silva",
    venue: "Conference on Computational Semantics",
    year: 2024,
    kind: "Conference paper",
    topics: ["Long-context attention", "Evaluation"],
    doi: "10.0000/fictional.ccs.2024.88",
    citations: 47,
  },
  {
    id: "p5",
    title: "What a tokeniser costs a language",
    authors: "R. Silva, J. Pereira, A. Tan",
    venue: "Journal of Computational Morphology",
    year: 2023,
    kind: "Journal article",
    topics: ["Morphology and low-resource languages"],
    doi: "10.0000/fictional.jcm.2023.6",
    citations: 63,
  },
  {
    id: "p6",
    title: "Measuring long-context recall without a needle",
    authors: "R. Silva, M. Okonkwo",
    venue: "Symposium on Evaluation Methods",
    year: 2022,
    kind: "Conference paper",
    topics: ["Evaluation"],
    doi: "10.0000/fictional.sem.2022.9",
    citations: 88,
  },
];

export const TALKS = [
  {
    id: "t1",
    title: "The seventh hop",
    venue: "Keynote, Language Technology Conference",
    year: "2026",
    note: "Presented the degradation result and the replication attempt that failed.",
  },
  {
    id: "t2",
    title: "Auditing a tokeniser in a week",
    venue: "Workshop on Low-Resource Language Technology",
    year: "2025",
    note: "Hands-on session with the audit scripts, released under an open licence.",
  },
  {
    id: "t3",
    title: "Why retrieval did not replace context",
    venue: "Institute seminar series",
    year: "2024",
    note: "A shorter version of the 2024 paper, aimed at a non-specialist audience.",
  },
];

export const TEACHING = [
  {
    id: "c1",
    title: "Measurement in natural language processing",
    level: "Graduate",
    detail: "Fifteen weeks on building an evaluation that outlives the model it was written for.",
  },
  {
    id: "c2",
    title: "Statistical methods for linguists",
    level: "Masters",
    detail: "A course written for people who can read a paper but have never fitted a model.",
  },
];
