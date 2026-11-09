import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";
import type { Tone } from "@/config/statuses";

const tones: Record<Tone, string> = {
  neutral: "bg-white/6 text-fg-muted border-white/10",
  info: "bg-info/12 text-info border-info/25",
  warning: "bg-warning/12 text-warning border-warning/25",
  success: "bg-success/12 text-success border-success/25",
  danger: "bg-danger/12 text-danger border-danger/25",
  accent: "bg-brand-cyan/12 text-brand-cyan border-brand-cyan/25",
};

export function Badge({ tone = "neutral", className, ...props }: ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
