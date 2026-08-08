"use client";

import { useState } from "react";

/**
 * Snapshot of Date.now() taken once at mount. Reading Date.now() directly in a
 * render body violates React's component-purity rule (impure function during
 * render); a useState lazy initializer only runs once, so this is the sanctioned
 * escape hatch for "now" used to derive past/expired/new-item badges.
 */
export function useNow(): number {
  const [now] = useState(() => Date.now());
  return now;
}
