/** Prepared, generic observations. Values are display fixtures, not financial calculations. */
export interface Observation {
  id: string;
  time: Date;
  dateLabel: string;
  channel: string;
  sample: string;
  responseMs: number;
  referenceMs: number;
  note: string;
}

export const observations: readonly Observation[] = [
  { id: "s01", time: new Date("2026-09-01T12:00:00Z"), dateLabel: "01 Sep", channel: "North", sample: "Sample 01", responseMs: 118, referenceMs: 120, note: "A stable observation close to the reference." },
  { id: "s02", time: new Date("2026-09-03T12:00:00Z"), dateLabel: "03 Sep", channel: "North", sample: "Sample 02", responseMs: 116, referenceMs: 120, note: "The reading stays within the ordinary band." },
  { id: "s03", time: new Date("2026-09-05T12:00:00Z"), dateLabel: "05 Sep", channel: "East", sample: "Sample 03", responseMs: 123, referenceMs: 120, note: "A small rise appears in the prepared sequence." },
  { id: "s04", time: new Date("2026-09-07T12:00:00Z"), dateLabel: "07 Sep", channel: "East", sample: "Sample 04", responseMs: 128, referenceMs: 120, note: "This observation is above the reference line." },
  { id: "s05", time: new Date("2026-09-09T12:00:00Z"), dateLabel: "09 Sep", channel: "West", sample: "Sample 05", responseMs: 121, referenceMs: 120, note: "The sequence returns near its reference." },
  { id: "s06", time: new Date("2026-09-11T12:00:00Z"), dateLabel: "11 Sep", channel: "West", sample: "Sample 06", responseMs: 113, referenceMs: 120, note: "A lower reading is visible in the prepared data." },
  { id: "s07", time: new Date("2026-09-13T12:00:00Z"), dateLabel: "13 Sep", channel: "North", sample: "Sample 07", responseMs: 119, referenceMs: 120, note: "The reading returns to the reference band." },
  { id: "s08", time: new Date("2026-09-15T12:00:00Z"), dateLabel: "15 Sep", channel: "East", sample: "Sample 08", responseMs: 125, referenceMs: 120, note: "A second rise appears in the final observation." },
];
