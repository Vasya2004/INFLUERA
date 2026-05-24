import { useSearchParams } from "wouter";
import { Database, LayoutTemplate, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/app/page";
import { useStore } from "@/lib/store";
import { Platforms } from "@/pages/platforms";
import { Templates } from "@/pages/templates";

type BaseTab = "platforms" | "templates";

function getTabFromSearch(searchParams: URLSearchParams): BaseTab {
  return searchParams.get("tab") === "templates" ? "templates" : "platforms";
}

export default function Base() {
  const { state } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = getTabFromSearch(searchParams);

  const totalSubscribers = state.platforms.reduce((sum, platform) => sum + platform.subscribers, 0);
  function handleTabChange(value: string) {
    setSearchParams(value === "templates" ? { tab: "templates" } : { tab: "platforms" });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="База" />

      <div className="grid gap-3 md:grid-cols-3">
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
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-5">
        <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card/80 p-2 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="h-auto w-full justify-start rounded-xl bg-muted/45 p-1 sm:w-auto">
            <TabsTrigger value="platforms" className="min-h-10 flex-1 gap-2 rounded-lg px-4 sm:flex-none">
              <Share2 className="h-4 w-4" />
              Платформы
            </TabsTrigger>
            <TabsTrigger value="templates" className="min-h-10 flex-1 gap-2 rounded-lg px-4 sm:flex-none">
              <LayoutTemplate className="h-4 w-4" />
              Материалы
            </TabsTrigger>
          </TabsList>
          <p className="px-2 text-xs text-muted-foreground">
            Рабочая база автора: каналы, аудитория, шаблоны и файлы.
          </p>
        </div>

        <TabsContent value="platforms" className="mt-0">
          <Platforms embedded />
        </TabsContent>
        <TabsContent value="templates" className="mt-0">
          <Templates embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
}
