import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

export function Card({
  className,
  interactive,
  ...props
}: ComponentProps<"div"> & { interactive?: boolean }) {
  return (
    <div className={cn("surface p-6", interactive && "surface-hover", className)} {...props} />
  );
}

export function CardTitle({ className, ...props }: ComponentProps<"h3">) {
  return <h3 className={cn("text-fg text-lg font-semibold", className)} {...props} />;
}

export function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("text-fg-muted text-sm leading-relaxed", className)} {...props} />;
}
