export interface PriceLineOptions {
  price: number;
  color: string;
  lineWidth: 1;
  lineStyle: number;
  axisLabelVisible: boolean;
  title: string;
}

export interface PriceLineLike {
  applyOptions(options: Partial<PriceLineOptions>): void;
}

export interface PriceLineSeriesLike {
  createPriceLine(options: PriceLineOptions): PriceLineLike;
  removePriceLine(line: PriceLineLike): void;
}

/**
 * Owns one price-line object per logical series and level.
 *
 * Theme changes update the existing object. Level changes remove only the
 * lines that disappeared and create only the ones that appeared. A replaced or
 * removed series explicitly forgets/disposes its association, so a later data
 * update cannot mutate a line owned by a removed engine series.
 */
export class IndicatorReferenceLines {
  private readonly bySeries = new Map<string, Map<number, PriceLineLike>>();

  sync(seriesKey: string, series: PriceLineSeriesLike, levels: readonly number[], color: string): void {
    let lines = this.bySeries.get(seriesKey);
    if (!lines) {
      lines = new Map();
      this.bySeries.set(seriesKey, lines);
    }
    const desired = new Set(levels);
    for (const [level, line] of lines) {
      if (desired.has(level)) continue;
      series.removePriceLine(line);
      lines.delete(level);
    }
    levels.forEach((level, index) => {
      const options: PriceLineOptions = {
        price: level,
        color,
        lineWidth: 1,
        lineStyle: 1,
        axisLabelVisible: index === 0,
        title: "",
      };
      const line = lines.get(level);
      if (line) line.applyOptions(options);
      else lines.set(level, series.createPriceLine(options));
    });
  }

  /** The engine already removed the series; discard stale object handles. */
  forget(seriesKey: string): void {
    this.bySeries.delete(seriesKey);
  }

  /** Remove every line while its series is still alive. */
  dispose(seriesKey: string, series: PriceLineSeriesLike): void {
    const lines = this.bySeries.get(seriesKey);
    if (!lines) return;
    for (const line of lines.values()) series.removePriceLine(line);
    this.bySeries.delete(seriesKey);
  }

  size(seriesKey: string): number {
    return this.bySeries.get(seriesKey)?.size ?? 0;
  }
}
