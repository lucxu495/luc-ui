"use client";

import { useEffect, useLayoutEffect } from "react";

/**
 * useLayoutEffect on the client, useEffect on the server.
 *
 * Used for one job only: applying a value the server could not know (a stored
 * workspace layout) before the first client paint, instead of after it. On the
 * server it degrades to a passive effect, so React never warns about a layout
 * effect during server rendering.
 */
export const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
