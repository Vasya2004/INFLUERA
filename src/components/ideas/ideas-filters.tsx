import { Search, X } from "lucide-react";
import type { IdeaStatus, Priority } from "@/lib/types";
import { IDEA_PIPELINE, IDEA_STATUS_LABELS } from "@/lib/ideas-utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const PRIORITIES: Priority[] = ["высокий", "средний", "низкий"];

const PRIORITY_META: Record<
  Priority,
  { label: string; dot: string; active: string }
> = {
  высокий: {
    label: "Высокий",
    dot: "bg-red-500",
    active: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
  },
  средний: {
    label: "Средний",
    dot: "bg-amber-500",
    active: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  },
  низкий: {
    label: "Низкий",
    dot: "bg-slate-400",
    active: "border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  },
};

function formatTagLabel(tag: string) {
  return tag.startsWith("#") ? tag : `#${tag}`;
}

const compactSelectClass = "h-9 w-full min-w-0 rounded-md border-border bg-background text-xs shadow-none sm:h-8 sm:min-w-[7.5rem] sm:w-[8.5rem]";

export function IdeasFilters({
  search,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
  statusFilter,
  onStatusFilterChange,
  tagFilter,
  onTagFilterChange,
  availableTags,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  priorityFilter: Priority | "all";
  onPriorityFilterChange: (value: Priority | "all") => void;
  statusFilter: IdeaStatus | "all";
  onStatusFilterChange: (value: IdeaStatus | "all") => void;
  tagFilter: string;
  onTagFilterChange: (value: string) => void;
  availableTags: string[];
}) {
  const hasActiveFilters =
    search.trim().length > 0
    || priorityFilter !== "all"
    || statusFilter !== "all"
    || tagFilter !== "all";

  function clearFilters() {
    onSearchChange("");
    onPriorityFilterChange("all");
    onStatusFilterChange("all");
    onTagFilterChange("all");
  }

  return (
    <section className="surface-card rounded-xl p-3 sm:p-3">
      <div className="flex flex-col gap-2">
        <div className="relative min-w-0 w-full">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 w-full rounded-md border-border bg-background pl-8 text-sm shadow-none"
            placeholder="Поиск..."
            value={search}
            onChange={event => onSearchChange(event.target.value)}
            data-testid="input-search-ideas"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Select value={statusFilter} onValueChange={value => onStatusFilterChange(value as IdeaStatus | "all")}>
            <SelectTrigger className={compactSelectClass} aria-label="Этап">
              <SelectValue placeholder="Этап" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Активные</SelectItem>
              {IDEA_PIPELINE.map(status => (
                <SelectItem key={status} value={status}>
                  {IDEA_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={value => onPriorityFilterChange(value as Priority | "all")}>
            <SelectTrigger className={compactSelectClass} aria-label="Приоритет">
              <SelectValue placeholder="Приоритет" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все приоритеты</SelectItem>
              {PRIORITIES.map(priority => (
                <SelectItem key={priority} value={priority}>
                  <span className="inline-flex items-center gap-1.5">
                    <span className={cn("h-1.5 w-1.5 rounded-full", PRIORITY_META[priority].dot)} />
                    {PRIORITY_META[priority].label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {availableTags.length > 0 && (
            <Select value={tagFilter} onValueChange={onTagFilterChange}>
              <SelectTrigger className={cn(compactSelectClass, "sm:w-[9rem]")} aria-label="Хэштег">
                <SelectValue placeholder="Хэштег" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все хэштеги</SelectItem>
                {availableTags.map(tag => (
                  <SelectItem key={tag} value={tag}>
                    {formatTagLabel(tag)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="col-span-2 h-9 w-full border-border bg-muted/50 text-xs sm:col-span-1 sm:h-8 sm:w-auto"
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Сбросить
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

export { PRIORITY_META, formatTagLabel };
