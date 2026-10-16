"use client";

/*
 * The three geographic demos.
 *
 * All of them need a base map, and LUC UI ships none on purpose: boundary data
 * is large, licensed, and carries a political point of view. Registering a map
 * is therefore an explicit step the consumer takes — and the honest demo is one
 * that takes it, in an effect, and then draws. The geometry is the Showcase's
 * own 6×4 grid, which is obviously a fixture rather than an implied world map.
 */

import { useEffect, useState } from "react";
import { ChoroplethChart, GeoScatterChart, GeoTrajectoryChart, Spinner } from "@luc/ui";
import { choroplethRegions, gridMapName, trajectoryRoutes } from "@/lib/chart-packs-v5-data";
import { ensureGridMap } from "@/lib/geo-map";
import { useI18n } from "@/lib/i18n/provider";

/** Register the fixture map once per client, and report readiness. */
function useGridMap(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    ensureGridMap()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return ready;
}

function Waiting() {
  return (
    <div className="grid h-full min-h-40 place-items-center">
      <Spinner size={18} />
    </div>
  );
}

export function ChoroplethDemo() {
  const { tcs } = useI18n();
  const ready = useGridMap();
  if (!ready) return <Waiting />;
  return (
    <ChoroplethChart
      mapName={gridMapName}
      regions={choroplethRegions}
      valueLabel="Index"
      format={{ kind: "number", decimals: 1 }}
      height={340}
      ariaLabel={tcs("Values on a grid map")}
      ariaDescription={tcs("One region has no value and is drawn as no-data rather than as zero.")}
    />
  );
}

export function GeoScatterDemo() {
  const { tcs } = useI18n();
  const ready = useGridMap();
  if (!ready) return <Waiting />;
  return (
    <GeoScatterChart
      mapName={gridMapName}
      points={[
        { name: "R2C3", coordinates: [-30, 45], value: 42 },
        { name: "R2C5", coordinates: [90, 45], value: 28 },
        { name: "R3C2", coordinates: [-60, 0], value: 35 },
        { name: "R3C4", coordinates: [60, 0], value: 19 },
      ]}
      valueFormat={{ kind: "integer" }}
      height={340}
      ariaLabel={tcs("Readings on a grid map")}
    />
  );
}

export function GeoTrajectoryDemo() {
  const { tcs } = useI18n();
  return (
    <GeoTrajectoryChart
      trajectories={trajectoryRoutes}
      xLabel="Longitude"
      yLabel="Latitude"
      format={{ kind: "number", decimals: 1 }}
      height={340}
      ariaLabel={tcs("Two routes")}
    />
  );
}
