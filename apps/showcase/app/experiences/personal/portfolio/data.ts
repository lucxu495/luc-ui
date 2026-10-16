/**
 * Studio Kestrel — four commissions and the words the studio wrote about them.
 *
 * A portfolio's fixtures have to be specific to be useful: "a rebrand for a
 * client" tells a reviewer nothing about whether the layout survives a long
 * project title, a short one, and a case study with five paragraphs.
 */

export interface Commission {
  id: string;
  title: string;
  summary: string;
  detail: string;
  year: string;
  discipline: string;
  client: string;
}

export const COMMISSIONS: Commission[] = [
  {
    id: "tideline",
    title: "Tideline",
    summary: "An identity for a ferry company that had not changed its livery since 1971.",
    detail:
      "The commission was a new mark and turned into a timetable. The old livery worked because the boats were slow and the paint faded at sea; both of those things are still true, so the mark kept the fade and lost the serif.",
    year: "2026",
    discipline: "Identity",
    client: "Tideline Ferries",
  },
  {
    id: "harrow-index",
    title: "The Harrow Index",
    summary: "A quarterly publication about land use, set in two columns and printed on newsprint.",
    detail:
      "Two columns, forty-eight pages, no images. The constraint came from the press rather than the brief, and it produced the best thing about the publication: every chart has to be argued in words first.",
    year: "2025",
    discipline: "Editorial",
    client: "Harrow Institute",
  },
  {
    id: "north-yard",
    title: "North Yard",
    summary: "Wayfinding for a converted shipyard, using the building's own rivet pattern.",
    detail:
      "Every sign in the yard is cut from the same grid the sheds were riveted to, so a visitor reads the site's history without being told it. The grid is one number: 240 millimetres.",
    year: "2025",
    discipline: "Environmental",
    client: "North Yard Trust",
  },
  {
    id: "quiet-loud",
    title: "Quiet/Loud",
    summary: "A record sleeve series where the loudest track gets the quietest cover.",
    detail:
      "Twelve sleeves, one rule: the visual weight of the cover is inversely proportional to the peak loudness of the record. The rule is legible in the set and invisible on any single sleeve, which is the point.",
    year: "2024",
    discipline: "Art direction",
    client: "Hemlock Records",
  },
];

export const CLIENTS = [
  "Tideline Ferries",
  "Harrow Institute",
  "North Yard Trust",
  "Hemlock Records",
  "Bramble & Co",
  "The Long Room",
];

export const APPROACH = [
  {
    id: "read",
    title: "Read the material",
    body: "Nothing is drawn in the first two weeks. We read what the client already has, including the parts they are embarrassed by.",
  },
  {
    id: "constrain",
    title: "Find the one constraint",
    body: "A project needs one number or rule that everything else obeys. Ours is usually inherited from the press, the site or the archive.",
  },
  {
    id: "show",
    title: "Show the set, not the sample",
    body: "A single cover can flatter anything. We present the whole run so the rule is visible before it is explained.",
  },
];
