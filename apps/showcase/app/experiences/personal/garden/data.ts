/**
 * Field notebook — a digital garden's contents.
 *
 * Notes carry a `kind` because a garden is not a blog: a link with a sentence
 * beside it is a different object from a finished essay, and mixing them in one
 * undifferentiated stream is what makes most personal sites unreadable.
 */

export type NoteKind = "note" | "link" | "photo" | "essay";

export interface Note {
  id: string;
  kind: NoteKind;
  title: string;
  body: string;
  added: string;
  topics: string[];
  /** Present for `link` notes. */
  source?: { label: string; href: string };
}

export const NOTES: Note[] = [
  {
    id: "tide-tables",
    kind: "note",
    title: "Tide tables are the original API",
    body: "A tide table is a published contract with error bars: it tells you what will happen, how confident it is, and when it stops being usable. Most internal documentation tells you none of the three.",
    added: "2026-09-21",
    topics: ["Interfaces", "Writing"],
  },
  {
    id: "sourdough",
    kind: "essay",
    title: "Eighteen months of a sourdough starter",
    body: "The starter is a small, badly documented system with one operator and no monitoring. It has taught me more about slow feedback loops than any postmortem I have written: the signal arrives twelve hours after the decision.",
    added: "2026-09-12",
    topics: ["Cooking", "Practice"],
  },
  {
    id: "marginalia",
    kind: "link",
    title: "On marginalia in library books",
    body: "A short piece about what annotations in borrowed books do to the next reader. It argues the marginal note is a conversation with someone you will never meet, which is also the most accurate description of a public notebook.",
    added: "2026-09-04",
    topics: ["Reading", "Writing"],
    source: { label: "Read the piece", href: "https://example.org/marginalia" },
  },
  {
    id: "harbour-wall",
    kind: "photo",
    title: "The harbour wall at Newhaven",
    body: "Low tide, six in the morning, the wall casting a shadow you could measure. Taken on the walk where I decided to stop taking on consulting work in October.",
    added: "2026-08-29",
    topics: ["Photography", "Walking"],
  },
  {
    id: "maps-lie",
    kind: "note",
    title: "All maps are wrong about stairs",
    body: "Every route planner treats a staircase as an edge with a cost. None of them tell you that the staircase is closed, which is the only fact that mattered on the day.",
    added: "2026-08-19",
    topics: ["Interfaces", "Walking"],
  },
  {
    id: "listen",
    kind: "essay",
    title: "Learning to listen to a record twice",
    body: "The first play is for the arrangement; the second is for the room. Almost nothing I have listened to once has stayed with me, which is an uncomfortable argument for taking notes on everything.",
    added: "2026-08-07",
    topics: ["Music", "Practice"],
  },
];

export const NOW_ITEMS = [
  {
    id: "building",
    label: "Building",
    value: "A tide-table renderer for a sailing club, and the third rewrite of this notebook's index.",
  },
  {
    id: "reading",
    label: "Reading",
    value: "Two books at once, badly: a history of the Ordnance Survey and a field guide to coastal plants.",
  },
  {
    id: "location",
    label: "Location",
    value: "Leith, and for one week a month, wherever the ferry goes.",
  },
  {
    id: "not",
    label: "Not doing",
    value: "Taking on consulting work before October. The calendar is the whole system.",
  },
];

export const SHELF = [
  {
    id: "b1",
    title: "The Ordnance Survey and Modern Ireland",
    author: "F. O'Donovan",
    status: "reading" as const,
    progress: 0.38,
    progressLabel: "p. 148 of 390",
    note: "Chapter four is the one about the dispute over the six-inch scale. It is a thriller.",
  },
  {
    id: "b2",
    title: "Coastal Plants of the North Atlantic",
    author: "M. Eriksen",
    status: "reading" as const,
    progress: 0.12,
    progressLabel: "p. 44 of 366",
  },
  {
    id: "b3",
    title: "Notes on a Small Island",
    author: "J. Whitcombe",
    status: "queued" as const,
  },
  {
    id: "b4",
    title: "The Design of Everyday Things",
    author: "Don Norman",
    status: "finished" as const,
  },
];
