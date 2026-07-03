import type { Idea, Platform, Publication } from "@/lib/types";
import { IDEA_KANBAN_COLUMNS, IDEA_STATUS_LABELS } from "@/lib/ideas-utils";
import { IdeaCard } from "./idea-card";

type IdeasKanbanProps = {
  groups: Map<Idea["status"], Idea[]>;
  platforms: Platform[];
  publications: Publication[];
};

export function IdeasKanban({
  groups,
  platforms,
  publications,
}: IdeasKanbanProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {IDEA_KANBAN_COLUMNS.map(status => {
        const columnIdeas = groups.get(status) ?? [];
        return (
          <div
            key={status}
            className="flex w-[min(100%,20rem)] shrink-0 flex-col rounded-xl border border-border bg-muted/30"
          >
            <div className="border-b border-border/70 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{IDEA_STATUS_LABELS[status]}</p>
                <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
                  {columnIdeas.length}
                </span>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2 p-2 min-h-[12rem]">
              {columnIdeas.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-muted-foreground">Пусто</p>
              ) : (
                columnIdeas.map(idea => (
                  <div key={idea.id} className="space-y-1">
                    <IdeaCard
                      idea={idea}
                      platform={platforms.find(platform => platform.id === idea.platformId)}
                      publications={publications}
                      compact
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
