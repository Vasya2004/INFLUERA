import type { Idea, Platform, Publication, Priority } from "@/lib/types";
import { IDEA_STATUS_LABELS, getPublicationsForIdea, migrateIdeaStatus } from "@/lib/ideas-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { PlatformAvatar } from "@/components/app/platform-avatar";
import { ideaStatusBadgeClass } from "@/components/ideas/idea-status-path";
import { PRIORITY_META, formatTagLabel } from "@/components/ideas/ideas-filters";

const priorityColors: Record<Priority, string> = {
  "высокий": PRIORITY_META.высокий.active,
  "средний": PRIORITY_META.средний.active,
  "низкий": PRIORITY_META.низкий.active,
};

type IdeaCardProps = {
  idea: Idea;
  platform?: Platform;
  publications: Publication[];
  compact?: boolean;
};

export function IdeaCard({
  idea,
  platform,
  publications,
  compact = false,
}: IdeaCardProps) {
  const linked = getPublicationsForIdea(publications, idea.id);
  const primaryPublication = linked[0];
  const status = migrateIdeaStatus(idea.status);

  return (
    <Link href={`/app/ideas/${idea.id}`} className="block h-full">
      <Card className={cn("flex h-full cursor-pointer flex-col transition-colors hover:border-primary/40", compact && "shadow-sm")}>
        <CardHeader className={cn("pb-2", compact && "p-3 pb-1")}>
          <CardTitle className="break-words text-base leading-snug">{idea.title}</CardTitle>
        </CardHeader>
        <CardContent className={cn("mt-auto space-y-3", compact && "space-y-2 p-3 pt-0")}>
          {idea.description && (
            <p className={cn("text-sm text-muted-foreground", compact ? "line-clamp-2" : "line-clamp-3")}>
              {idea.description}
            </p>
          )}

          {(idea.tags ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {(idea.tags ?? []).map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                >
                  {formatTagLabel(tag)}
                </span>
              ))}
            </div>
          )}

          {linked.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex min-h-8 items-center rounded-md border border-border bg-muted/40 px-2.5 text-xs font-medium text-foreground">
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                {linked.length === 1
                  ? `В плане · ${new Date(primaryPublication.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}`
                  : `В плане · ${linked.length} публикации`}
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
            <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium", ideaStatusBadgeClass(status))}>
              {IDEA_STATUS_LABELS[status]}
            </span>
            <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium", priorityColors[idea.priority])}>
              <span className={cn("h-1.5 w-1.5 rounded-full", PRIORITY_META[idea.priority].dot)} />
              {idea.priority}
            </span>
            <span className="inline-flex items-center rounded-md border border-border bg-muted/30 px-2 py-0.5 text-[11px] text-muted-foreground">
              {idea.format}
            </span>
            {platform && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2 py-0.5 text-[11px] text-muted-foreground">
                <PlatformAvatar platform={platform} size="xs" />
                {platform.name}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
