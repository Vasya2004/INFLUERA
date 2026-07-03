import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold tracking-tight break-words sm:text-3xl">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        )}
      </div>
      {action && (
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">
          {action}
        </div>
      )}
    </div>
  );
}

export function SectionPanel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("surface-card relative overflow-hidden rounded-xl", className)}>
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3 sm:gap-3 sm:px-5 sm:py-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold leading-snug">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div>{children}</div>
    </section>
  );
}

export function PanelAction({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 shrink-0 border-border bg-muted/50 px-3 text-xs font-medium text-foreground shadow-none hover:bg-muted/80"
      asChild
    >
      <Link href={href}>{children}</Link>
    </Button>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <section className="surface-card relative overflow-hidden rounded-xl">
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-muted/50 text-primary">
          <Icon className="h-7 w-7" />
        </div>
        <h3 className="mb-1 text-lg font-semibold">{title}</h3>
        <p className="mb-4 max-w-sm text-sm text-muted-foreground">{description}</p>
        {actionLabel && onAction && <Button onClick={onAction}>{actionLabel}</Button>}
      </div>
    </section>
  );
}

export function PageSkeleton({
  rows = 3,
  title = true,
}: {
  rows?: number;
  title?: boolean;
}) {
  return (
    <div className="space-y-6">
      {title && (
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-xl" />
          <Skeleton className="h-4 w-full max-w-md rounded-lg" />
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="surface-card rounded-xl p-5">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-full rounded-lg" />
                <Skeleton className="h-4 w-2/3 rounded-lg" />
              </div>
            </div>
            <Skeleton className="mt-5 h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AccentProgress({
  value,
  accent,
  className,
}: {
  value: number;
  accent?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(value, 100));
  return (
    <div className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: accent ?? "hsl(var(--primary))" }}
      />
    </div>
  );
}
