import { cn } from "@/lib/utils";

export type GlowAccent = "primary" | "violet" | "emerald" | "amber";

const orbColors: Record<GlowAccent, { main: string; secondary: string; line: string }> = {
  primary: {
    main: "bg-primary/20",
    secondary: "bg-violet-500/10",
    line: "bg-gradient-to-r from-transparent via-primary/55 to-transparent",
  },
  violet: {
    main: "bg-violet-500/18",
    secondary: "bg-primary/12",
    line: "bg-gradient-to-r from-transparent via-violet-500/45 to-transparent",
  },
  emerald: {
    main: "bg-emerald-500/16",
    secondary: "bg-primary/10",
    line: "bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent",
  },
  amber: {
    main: "bg-amber-500/14",
    secondary: "bg-primary/10",
    line: "bg-gradient-to-r from-transparent via-amber-500/38 to-transparent",
  },
};

export function GlowDecor({
  accent = "primary",
  className,
  intensity = "default",
}: {
  accent?: GlowAccent;
  className?: string;
  intensity?: "soft" | "default" | "strong";
}) {
  const colors = orbColors[accent];
  const mainSize = intensity === "soft" ? "h-40 w-40" : intensity === "strong" ? "h-56 w-56" : "h-48 w-48";
  const secondarySize = intensity === "soft" ? "h-28 w-28" : "h-36 w-36";

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]", className)}
    >
      <div className={cn("absolute -right-14 -top-20 rounded-full blur-3xl", mainSize, colors.main)} />
      <div className={cn("absolute -bottom-10 -left-10 rounded-full blur-3xl", secondarySize, colors.secondary)} />
      <div className={cn("absolute inset-x-0 top-0 h-px", colors.line)} />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent dark:via-white/10" />
    </div>
  );
}
