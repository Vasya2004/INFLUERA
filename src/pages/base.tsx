import { useSearchParams } from "wouter";
import { Database, LayoutTemplate, Share2, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/app/page";
import { useStore } from "@/lib/store";
import { Platforms } from "@/pages/platforms";
import { Templates } from "@/pages/templates";
import { References } from "@/pages/references";

type BaseTab = "platforms" | "templates" | "references";

function getTabFromSearch(searchParams: URLSearchParams): BaseTab {
  if (searchParams.get("tab") === "references") return "references";
  return searchParams.get("tab") === "templates" ? "templates" : "platforms";
}

export default function Base() {
  const { state } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = getTabFromSearch(searchParams);

  const totalSubscribers = state.platforms.reduce((sum, platform) => sum + platform.subscribers, 0);
  function handleTabChange(value: string) {
    if (value === "references") setSearchParams({ tab: "references" });
    else if (value === "templates") setSearchParams({ tab: "templates" });
    else setSearchParams({ tab: "platforms" });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="База" />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/80 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Платформы</p>
              <p className="text-xl font-semibold">{state.platforms.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Аудитория</p>
              <p className="text-xl font-semibold">{totalSubscribers.toLocaleString("ru-RU")}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <LayoutTemplate className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Материалы</p>
              <p className="text-xl font-semibold">{state.templates.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Референсы</p>
              <p className="text-xl font-semibold">{(state.references ?? []).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-5">
        <div className="rounded-2xl border border-border/80 bg-card/80 p-2 shadow-sm">
          <TabsList className="grid h-auto w-full grid-cols-3 rounded-xl bg-muted/45 p-1">
            <TabsTrigger value="platforms" className="min-h-10 min-w-0 gap-1.5 rounded-lg px-2 text-xs sm:gap-2 sm:px-4 sm:text-sm">
              <Share2 className="h-4 w-4 shrink-0 text-current" />
              <span className="min-w-0 truncate">Платформы</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="min-h-10 min-w-0 gap-1.5 rounded-lg px-2 text-xs sm:gap-2 sm:px-4 sm:text-sm">
              <LayoutTemplate className="h-4 w-4 shrink-0 text-current" />
              <span className="min-w-0 truncate">Материалы</span>
            </TabsTrigger>
            <TabsTrigger value="references" className="min-h-10 min-w-0 gap-1.5 rounded-lg px-2 text-xs sm:gap-2 sm:px-4 sm:text-sm">
              <Users className="h-4 w-4 shrink-0 text-current" />
              <span className="min-w-0 truncate">Референсы</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="platforms" className="mt-0">
          <Platforms embedded />
        </TabsContent>
        <TabsContent value="templates" className="mt-0">
          <Templates embedded />
        </TabsContent>
        <TabsContent value="references" className="mt-0">
          <References embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
}
