/**
 * Common room — the feed's fixtures.
 *
 * Reactions are stored as a count plus whether *this* reader reacted, which is
 * the smallest honest model: the number is the community's, the flag is yours,
 * and the component never has to invent a list of who pressed what.
 */

export interface Post {
  id: string;
  author: { name: string; handle: string; role: string; following: boolean };
  body: string;
  posted: string;
  topics: string[];
  reactions: Record<ReactionId, { count: number; mine: boolean }>;
  comments: Comment[];
  pinned?: boolean;
}

export interface Comment {
  id: string;
  author: string;
  body: string;
  posted: string;
}

export type ReactionId = "insightful" | "same" | "solved";

export const REACTIONS: ReadonlyArray<{ id: ReactionId; label: string }> = [
  { id: "insightful", label: "Insightful" },
  { id: "same", label: "Same here" },
  { id: "solved", label: "Solved it" },
];

export const FEED: Post[] = [
  {
    id: "post-1",
    author: {
      name: "Mei Watanabe",
      handle: "mei",
      role: "Build systems",
      following: true,
    },
    body: "We deleted the build cache last week to see what would happen. Two hours of pain, then a 40% faster median build — because half of what was cached was never correct in the first place.",
    posted: "28 minutes ago",
    topics: ["Build systems", "War story"],
    reactions: {
      insightful: { count: 24, mine: false },
      same: { count: 6, mine: true },
      solved: { count: 2, mine: false },
    },
    comments: [
      {
        id: "c1",
        author: "Tomas Lind",
        body: "How did you find the incorrect entries? We suspect the same but have no evidence.",
        posted: "21 minutes ago",
      },
      {
        id: "c2",
        author: "Mei Watanabe",
        body: "We hashed the inputs twice with different environment orderings. Anything that produced two hashes was suspect.",
        posted: "14 minutes ago",
      },
    ],
    pinned: true,
  },
  {
    id: "post-2",
    author: { name: "Rae Halloway", handle: "rae", role: "Design systems", following: false },
    body: "A design system's real output is not components. It is the sentence a reviewer can say in a meeting: that is not a token, that is a decision we have not made yet.",
    posted: "3 hours ago",
    topics: ["Design systems", "Practice"],
    reactions: {
      insightful: { count: 41, mine: false },
      same: { count: 12, mine: false },
      solved: { count: 0, mine: false },
    },
    comments: [],
  },
  {
    id: "post-3",
    author: { name: "Samir Haddad", handle: "samir", role: "Incident response", following: true },
    body: "Postmortem finding of the week: the alert was correct, the runbook was correct, and the person on call had never been told the runbook existed. Documentation is not documentation until somebody has failed with it once.",
    posted: "Yesterday",
    topics: ["Incidents", "Practice"],
    reactions: {
      insightful: { count: 18, mine: true },
      same: { count: 9, mine: false },
      solved: { count: 3, mine: false },
    },
    comments: [
      {
        id: "c3",
        author: "Ifeoma Nwosu",
        body: "We now run every runbook once during onboarding, on a fake incident. It is uncomfortable and it works.",
        posted: "20 hours ago",
      },
    ],
  },
];
