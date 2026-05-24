import type { Idea, Platform, Publication } from "@/lib/types";
import { IDEA_STATUS_LABELS, getPublicationsForIdea } from "@/lib/ideas-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const statusColors: Record<Idea["status"], string> = {
  "новая": "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-300",
  "в работе": "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300",
  "превращена в публикацию": "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300",
  "отложена": "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-300",
  "архив": "bg-muted text-muted-foreground border-border",
};

const priorityColors: Record<Idea["priority"], string> = {
  "высокий": "bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-300",
  "средний": "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300",
  "низкий": "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-300",
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

  return (
    <Link href={`/ideas/${idea.id}`} className="block h-full">
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
            <div className="flex flex-wrap gap-1">
              {(idea.tags ?? []).map(tag => (
                <Badge key={tag} variant="outline" className="rounded-md px-1.5 py-0 text-[10px] font-normal">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {linked.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="min-h-8 rounded-xl px-2.5 text-xs font-medium">
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                {linked.length === 1
                  ? `В плане · ${new Date(primaryPublication.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}`
                  : `В плане · ${linked.length} публикации`}
              </Badge>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 border-t border-border/50 pt-2">
            <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", statusColors[idea.status])}>
              {IDEA_STATUS_LABELS[idea.status]}
            </span>
            <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", priorityColors[idea.priority])}>
              {idea.priority}
            </span>
            <Badge variant="outline" className="text-xs font-normal">{idea.format}</Badge>
            {platform && <Badge variant="secondary" className="text-xs font-normal">{platform.name}</Badge>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
