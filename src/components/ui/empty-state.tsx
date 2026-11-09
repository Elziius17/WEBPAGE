import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="surface flex flex-col items-center px-6 py-14 text-center">
      <div className="bg-brand-cyan/10 text-brand-cyan mb-4 grid size-12 place-items-center rounded-2xl">
        <Icon className="size-6" aria-hidden />
      </div>
      <h3 className="text-fg text-base font-semibold">{title}</h3>
      {description && <p className="text-fg-muted mt-1.5 max-w-sm text-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
