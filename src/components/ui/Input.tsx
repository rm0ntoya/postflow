import * as React from "react";
import { cn } from "@/lib/cn";

type Size = "md" | "lg";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  helper?: string;
  error?: string;
  inputSize?: Size;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, helper, error, inputSize = "md", iconLeft, iconRight, className, id, ...rest },
  ref
) {
  const reactId = React.useId();
  const inputId = id ?? reactId;
  const heightCls = inputSize === "lg" ? "h-11" : "h-9";
  const hasError = !!error;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className={cn("text-caption", hasError ? "text-state-danger" : "text-text-secondary")}>
          {label}
        </label>
      )}
      <div className={cn(
        "relative flex items-center rounded-sm border bg-bg-surface-2 transition-colors duration-fast",
        heightCls,
        hasError ? "border-state-danger" : "border-border focus-within:border-accent focus-within:bg-bg-surface focus-within:ring-2 focus-within:ring-accent/30",
      )}>
        {iconLeft && <span className="pl-3 text-text-tertiary flex items-center">{iconLeft}</span>}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "peer w-full bg-transparent outline-none px-3 text-text-primary placeholder:text-text-tertiary text-[14px]",
            iconLeft ? "pl-2" : "",
            iconRight ? "pr-2" : "",
            className
          )}
          {...rest}
        />
        {iconRight && <span className="pr-3 text-text-tertiary flex items-center">{iconRight}</span>}
      </div>
      {(helper || error) && (
        <p className={cn("text-caption", hasError ? "text-state-danger" : "text-text-tertiary")}>
          {error ?? helper}
        </p>
      )}
    </div>
  );
});
