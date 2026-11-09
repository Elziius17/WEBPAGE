import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

export function Container({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)} {...props} />
  );
}

export function Section({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("py-16 sm:py-24", className)} {...props} />;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div className={cn("mb-12 max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <p className="text-brand-cyan mb-3 text-xs font-semibold tracking-[0.2em] uppercase">
          {eyebrow}
        </p>
      )}
      <h2 className="text-fg text-3xl font-bold sm:text-4xl">{title}</h2>
      {description && (
        <p className="text-fg-muted mt-4 text-base leading-relaxed sm:text-lg">{description}</p>
      )}
    </div>
  );
}
