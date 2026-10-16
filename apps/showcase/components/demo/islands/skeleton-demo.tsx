"use client";

/*
 * A skeleton that keeps its geometry when the data lands.
 *
 * The rule a skeleton lives or dies by is that the placeholder and the content
 * have the same shape, and the only honest way to show that is to swap one for
 * the other in place. Press the button: the rows are replaced by the same rows
 * with real values, the avatar by a real initial, and nothing moves — which is
 * the whole reason to reach for a skeleton instead of a spinner.
 *
 * The load is a timer, not a fetch: the specimen has to be deterministic, and
 * what is being demonstrated is the geometry, not the network.
 */

import { useState } from "react";
import { Avatar, Button, Card, Inline, Skeleton, SkeletonText, Stack, Text } from "@luc/ui";
import { useI18n } from "@/lib/i18n/provider";

const ROWS = [
  { id: "btc", name: "BTCUSDT 1h", rows: "1,284,902", lag: "2 s" },
  { id: "eth", name: "ETHUSDT 1h", rows: "1,190,441", lag: "4 s" },
  { id: "sol", name: "SOLUSDT 1h", rows: "842,118", lag: "11 s" },
];

export function SkeletonDemo() {
  const { tcs } = useI18n();
  const [loaded, setLoaded] = useState(false);

  return (
    <Stack gap="md" className="w-full max-w-lg">
      <Card variant="outline" className="gap-4 p-4">
        <Inline gap="sm" align="center" justify="between" className="w-full">
          {loaded ? (
            <Avatar size="sm" fallback="BT" />
          ) : (
            <Skeleton variant="circle" className="size-8" />
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            {loaded ? (
              <>
                <Text variant="label" as="p">
                  {tcs("Ingest pipeline")}
                </Text>
                <Text variant="caption" tone="muted" as="p">
                  {tcs("Three providers · hourly")}
                </Text>
              </>
            ) : (
              <>
                <Skeleton variant="text" className="h-3.5 w-40" />
                <Skeleton variant="text" className="h-3 w-28" />
              </>
            )}
          </div>
        </Inline>

        <div className="flex flex-col gap-2">
          {ROWS.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[minmax(0,1fr)_6rem_4rem] items-center gap-3 border-t border-line-subtle pt-2 first:border-t-0 first:pt-0"
            >
              {loaded ? (
                <>
                  <Text variant="caption" as="p">
                    {row.name}
                  </Text>
                  <Text variant="caption" tone="muted" as="p" className="luc-numeric text-right">
                    {row.rows}
                  </Text>
                  <Text variant="caption" tone="muted" as="p" className="luc-numeric text-right">
                    {row.lag}
                  </Text>
                </>
              ) : (
                <>
                  <Skeleton variant="text" className="h-3.5 w-full" />
                  <Skeleton variant="text" className="h-3.5 w-full" />
                  <Skeleton variant="text" className="h-3.5 w-full" />
                </>
              )}
            </div>
          ))}
        </div>

        {!loaded ? <SkeletonText lines={2} /> : null}
      </Card>

      <Inline gap="sm" align="center">
        <Button size="sm" variant="secondary" onClick={() => setLoaded((current) => !current)}>
          {loaded ? tcs("Show the placeholder") : tcs("Show the data")}
        </Button>
        <Text variant="caption" tone="muted">
          {loaded
            ? tcs("Nothing moved: the placeholder reserved the row's own height.")
            : tcs("Every line is drawn at the height of the line it stands in for.")}
        </Text>
      </Inline>
    </Stack>
  );
}
