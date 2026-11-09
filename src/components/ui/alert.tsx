import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const styles = {
  info: { cls: "border-info/25 bg-info/8 text-info", Icon: Info },
  success: { cls: "border-success/25 bg-success/8 text-success", Icon: CheckCircle2 },
  warning: { cls: "border-warning/25 bg-warning/8 text-warning", Icon: AlertTriangle },
  danger: { cls: "border-danger/25 bg-danger/8 text-danger", Icon: XCircle },
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: keyof typeof styles;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const { cls, Icon } = styles[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex gap-3 rounded-xl border p-4 text-sm", cls, className)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-fg-muted">{children}</div>}
      </div>
    </div>
  );
}
