// Legacy shim — forwards to spec'd Toast in ./ui/Toast (DESIGN.md §3.7).
// The legacy default export keeps `<Toast msg={...} />` callsites compiling
// until they migrate to `useToast()` from the provider.
"use client";
import * as React from "react";
import Icon from "./Icon";

export { ToastProvider, useToast } from "./ui/Toast";
export type { ToastKind, ToastItem } from "./ui/Toast";

export default function Toast({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div className="toast">
      <Icon name="check" />
      {msg}
    </div>
  );
}
