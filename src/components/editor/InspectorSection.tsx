import * as React from "react";

interface InspectorSectionProps {
  label: string;
  children: React.ReactNode;
}

export function InspectorSection({ label, children }: InspectorSectionProps) {
  return (
    <div className="px-4 py-3 border-b border-border-subtle flex flex-col gap-3 last:border-b-0">
      <span className="text-micro text-text-tertiary">{label.toUpperCase()}</span>
      {children}
    </div>
  );
}
