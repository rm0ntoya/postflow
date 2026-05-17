import * as React from "react";

interface InspectorHeaderProps {
  icon: React.ReactNode;
  label: string;
}

export function InspectorHeader({ icon, label }: InspectorHeaderProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle sticky top-0 bg-bg-surface z-10">
      <span className="text-text-tertiary" aria-hidden="true">{icon}</span>
      <span className="text-body-strong text-text-primary">{label}</span>
    </div>
  );
}
