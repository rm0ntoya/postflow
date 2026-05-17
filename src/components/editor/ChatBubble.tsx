import * as React from "react";
import { cn } from "@/lib/cn";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

export function ChatBubble({ role, content, streaming }: ChatBubbleProps) {
  return (
    <div className={cn("flex w-full", role === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] px-3 py-2 text-body text-text-primary rounded-lg",
          role === "user"
            ? "bg-accent-muted rounded-tr-xs"
            : "bg-bg-surface-2 rounded-tl-xs border border-border-subtle"
        )}
      >
        {content}
        {streaming && (
          <span className="inline-block ml-0.5 w-0.5 h-3.5 bg-accent animate-pulse align-middle" />
        )}
      </div>
    </div>
  );
}
