/**
 * Ada Okonkwo's career fixtures.
 *
 * One fictional person throughout, because a career page's job is coherence: a
 * timeline, three projects and a skills list that belong to the same engineer
 * read as a career, and four unrelated examples read as a component demo.
 */

/*
 * The fixture is typed with plain strings rather than the composite's own
 * `ExperienceEntry`, because its `summary` is a `ReactNode` and this data is
 * authored copy. The page localises it by mapping the strings through `tcs`,
 * which needs to know they are strings — a fixture that could be a node would
 * have to be cast at every call site instead.
 */
export interface CareerEntry {
  id: string;
  role: string;
  org: string;
  from: string;
  to?: string;
  location?: string;
  summary?: string;
  highlights?: readonly string[];
  tags?: readonly string[];
  current?: boolean;
}

export const CAREER: CareerEntry[] = [
  {
    id: "northwind",
    role: "Staff engineer, storage platform",
    org: "Northwind",
    from: "2023",
    current: true,
    location: "Remote, Lisbon",
    summary:
      "Own the replication layer that keeps four regions consistent. Two engineers, one on-call rotation, no database vendor.",
    highlights: [
      "Cut p99 write latency from 180 ms to 74 ms by moving quorum acknowledgement off the request path",
      "Ran the migration of 2.4 PB to a new log format with no read outage",
    ],
    tags: ["Raft", "Rust", "Postgres", "On-call"],
  },
  {
    id: "contoso",
    role: "Senior backend engineer",
    org: "Contoso",
    from: "2019",
    to: "2023",
    location: "Berlin",
    summary:
      "Grew the ingestion pipeline from 40 to 9,000 events a second and, more usefully, wrote down why it had stopped scaling twice.",
    highlights: [
      "Replaced a queue-then-batch worker with a backpressured stream: 60 % less memory, same throughput",
      "Introduced the deploy-attached alert that halved mean time to identification",
    ],
    tags: ["Go", "Kafka", "ClickHouse"],
  },
  {
    id: "lumen",
    role: "Backend engineer",
    org: "Lumen Analytics",
    from: "2017",
    to: "2019",
    location: "Lisbon",
    summary:
      "First infrastructure hire. Everything from the CI pipeline to the on-call document that nobody had written yet.",
    highlights: ["Moved a monthly batch report from 9 hours to 40 minutes"],
    tags: ["Python", "Airflow", "Terraform"],
  },
];

export interface CareerProject {
  id: string;
  title: string;
  summary: string;
  detail: string;
  meta: Array<{ id: string; label: string; value: string }>;
  tags: string[];
  link?: { label: string; href: string };
}

export const PROJECTS: CareerProject[] = [
  {
    id: "pelican",
    title: "Pelican",
    summary: "A log-structured store that survives a region loss without an operator awake.",
    detail:
      "Written to answer one question: what does a store do when the network is not merely slow but wrong? Pelican keeps a single writer per shard and lets readers fall back to a quorum that tolerates one region answering from a stale epoch.",
    meta: [
      { id: "role", label: "Role", value: "Design and implementation" },
      { id: "year", label: "Year", value: "2024" },
    ],
    tags: ["Rust", "Distributed systems"],
    link: { label: "Design notes", href: "https://example.com/pelican" },
  },
  {
    id: "tidewater",
    title: "Tidewater",
    summary: "A backpressure library for stream processors that refuses to buffer silently.",
    detail:
      "Most streaming frameworks make the buffer somebody else's problem. Tidewater makes it explicit: every stage declares the depth it is willing to hold and what it does when that depth is reached, and the answer cannot be 'grow'.",
    meta: [
      { id: "role", label: "Role", value: "Maintainer" },
      { id: "year", label: "Year", value: "2022" },
    ],
    tags: ["Go", "Streaming"],
    link: { label: "Repository", href: "https://example.com/tidewater" },
  },
  {
    id: "fieldlog",
    title: "Fieldlog",
    summary: "A tiny incident notebook that attaches the deploy to the alert.",
    detail:
      "Forty lines of Go and a convention: a service writes what it deployed and when, and the alerting rule reads that file. It replaced a much larger internal tool and is still running.",
    meta: [
      { id: "role", label: "Role", value: "Author" },
      { id: "year", label: "Year", value: "2021" },
    ],
    tags: ["Go", "Operations"],
  },
];

export const SKILL_GROUPS = [
  {
    id: "systems",
    label: "Distributed systems",
    skills: ["Consensus and replication", "Backpressure", "Failure modes", "Capacity planning"],
  },
  {
    id: "languages",
    label: "Languages",
    skills: ["Rust", "Go", "Python", "SQL", "TypeScript"],
  },
  {
    id: "operations",
    label: "Running things",
    skills: ["Kubernetes", "Terraform", "On-call design", "Incident review"],
  },
];
