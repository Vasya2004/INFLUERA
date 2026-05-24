import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GlowDecor, type GlowAccent } from "@/components/app/glow-decor";
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
    <div className="relative">
      <div className="pointer-events-none absolute -left-16 -top-20 h-44 w-44 rounded-full bg-primary/16 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl break-words">{title}</h1>
          {description && (
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
    </div>
  );
}

export function SectionPanel({
  title,
  description,
  action,
  children,
  className,
  accent = "primary",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  accent?: GlowAccent;
}) {
  return (
    <section className={cn("glass-card electric-line relative overflow-hidden rounded-3xl", className)}>
      <GlowDecor accent={accent} />
      <div className="relative flex items-center justify-between gap-3 border-b border-border/70 px-5 py-4 dark:border-white/10">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className="relative">{children}</div>
    </section>
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
    <section className="glass-card electric-line relative overflow-hidden rounded-3xl">
      <GlowDecor accent="primary" intensity="soft" />
      <div className="relative flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/12 text-primary shadow-[0_0_34px_hsl(var(--primary)/0.22)]">
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
          <div key={index} className="glass-card rounded-3xl p-5">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-2xl" />
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
