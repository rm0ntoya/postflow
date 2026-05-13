"use client";
import * as React from "react";

const KEY = "nc:sidebar-pinned";

export function useSidebarPinned() {
  const [pinned, setPinned] = React.useState(false);
  React.useEffect(() => {
    try { setPinned(localStorage.getItem(KEY) === "1"); } catch {}
  }, []);
  const set = React.useCallback((v: boolean) => {
    setPinned(v);
    try { localStorage.setItem(KEY, v ? "1" : "0"); } catch {}
  }, []);
  return [pinned, set] as const;
}
