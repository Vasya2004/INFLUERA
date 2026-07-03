import { Check } from "lucide-react";
import type { IdeaStatus } from "@/lib/types";
import {
  IDEA_PIPELINE,
  IDEA_STATUS_LABELS,
  getIdeaStatusIndex,
} from "@/lib/ideas-utils";
import { cn } from "@/lib/utils";

const STAGE_STYLES: Record<
  IdeaStatus,
  { dot: string; active: string; complete: string }
> = {
  новая: {
    dot: "bg-blue-500",
    active: "border-blue-500/35 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    complete: "bg-blue-500 text-white",
  },
  сценарий: {
    dot: "bg-violet-500",
    active: "border-violet-500/35 bg-violet-500/10 text-violet-700 dark:text-violet-300",
    complete: "bg-violet-500 text-white",
  },
  монтаж: {
    dot: "bg-amber-500",
    active: "border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-300",
    complete: "bg-amber-500 text-white",
  },
  опубликовано: {
    dot: "bg-emerald-500",
    active: "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    complete: "bg-emerald-500 text-white",
  },
};

export function ideaStatusBadgeClass(status: IdeaStatus) {
  return STAGE_STYLES[status].active;
}

const IDEA_STATUS_SHORT_LABELS: Record<IdeaStatus, string> = {
  новая: "Новая",
  сценарий: "Сценарий",
  монтаж: "Монтаж",
  опубликовано: "Публ.",
};

export function IdeaStatusPath({
  value,
  onChange,
  className,
  compact = false,
}: {
  value: IdeaStatus;
  onChange: (status: IdeaStatus) => void;
  className?: string;
  compact?: boolean;
}) {
  const currentIndex = getIdeaStatusIndex(value);

  return (
    <div className={cn("w-full overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}>
      <div className="flex min-w-[17.5rem] items-start sm:min-w-0">
        {IDEA_PIPELINE.map((status, index) => {
          const isActive = status === value;
          const isComplete = index < currentIndex;
          const isLast = index === IDEA_PIPELINE.length - 1;
          const styles = STAGE_STYLES[status];

          return (
            <div key={status} className={cn("flex min-w-0 items-start", isLast ? "shrink-0" : "flex-1")}>
              <button
                type="button"
                onClick={() => onChange(status)}
                className={cn(
                  "group flex shrink-0 flex-col items-center gap-1.5 text-center transition-colors sm:gap-2",
                  compact ? "w-14 sm:w-20" : "w-14 sm:w-24",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors sm:h-8 sm:w-8 sm:text-xs",
                    isComplete && styles.complete,
                    isActive && !isComplete && cn("border-2", styles.active),
                    !isActive && !isComplete && "border-border bg-background text-muted-foreground group-hover:border-foreground/20 group-hover:text-foreground",
                  )}
                >
                  {isComplete ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : index + 1}
                </span>
                <span
                  className={cn(
                    "max-w-[3.5rem] text-[10px] font-medium leading-tight sm:max-w-none sm:text-xs",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  <span className="sm:hidden">{IDEA_STATUS_SHORT_LABELS[status]}</span>
                  <span className="hidden sm:inline">{IDEA_STATUS_LABELS[status]}</span>
                </span>
              </button>
              {!isLast && (
                <div
                  className={cn(
                    "mx-0.5 mt-3.5 h-0.5 min-w-2 flex-1 rounded-full sm:mx-1 sm:mt-4 sm:min-w-3",
                    index < currentIndex ? "bg-emerald-500" : "bg-border",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
