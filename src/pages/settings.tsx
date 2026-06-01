import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/components/theme-provider";
import { motion } from "framer-motion";
import { Download, Sun, Moon, Database, Monitor } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/app/page";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const THEME_OPTIONS = [
  { value: "system", label: "Как в системе", icon: Monitor },
  { value: "light", label: "Светлая", icon: Sun },
  { value: "dark", label: "Тёмная", icon: Moon },
] as const;

export default function Settings() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const {
    exportData,
    state,
  } = useStore();
  const { toast } = useToast();
  const [lastExport, setLastExport] = useState<string | null>(null);

  function handleExport() {
    exportData();
    const now = new Date().toLocaleString("ru-RU");
    setLastExport(now);
    toast({ title: "Данные экспортированы", description: "JSON-файл скачан на ваше устройство." });
  }

  return (
    <div className="max-w-5xl space-y-8">
      <PageHeader title="Настройки" />

      <div className="space-y-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                {resolvedTheme === "dark" ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
                <CardTitle className="text-base">Внешний вид</CardTitle>
              </div>
              <CardDescription>Настройте отображение интерфейса</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-3">
                {THEME_OPTIONS.map(option => {
                  const Icon = option.icon;
                  const active = theme === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTheme(option.value)}
                      className={cn(
                        "flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground shadow-[0_10px_30px_hsl(var(--primary)/0.20)]"
                          : "border-border/80 bg-background/60 text-muted-foreground hover:border-primary/35 hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Экспорт</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <p className="font-medium text-foreground/80">Что включает экспорт:</p>
                <ul className="text-muted-foreground space-y-1 text-xs leading-relaxed">
                  <li>Профиль блога и личного бренда</li>
                  <li>Цели и их прогресс</li>
                  <li>Платформы и метрики подписчиков</li>
                  <li>База идей для контента</li>
                  <li>Контент-план и публикации</li>
                  <li>Материалы: сценарии, хуки, съёмка и структуры публикаций</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button className="gap-2 w-full sm:w-auto" onClick={handleExport} data-testid="button-export">
                  <Download className="h-4 w-4" />Экспортировать данные
                </Button>
              </div>
              {lastExport && (
                <p className="text-xs text-muted-foreground">Последний экспорт: {lastExport}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}
