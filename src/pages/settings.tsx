import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/theme-provider";
import { motion } from "framer-motion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Download, Sun, Moon, Database, Info, RotateCcw, Cloud, LogOut, LogIn, ArrowRightLeft, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/app/page";
import { useAuth } from "@/lib/auth-context";
import { isSupabaseConfigured } from "@/lib/supabase";

const syncLabels = {
  idle: "—",
  saving: "Сохранение…",
  saved: "Сохранено в облаке",
  error: "Ошибка синхронизации",
} as const;

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const {
    exportData,
    resetData,
    state,
    syncStatus,
    migrationStatus,
    runLegacyMigration,
    applyDemoSeed,
    demoSeedApplied,
  } = useStore();
  const { configured, user, signOut } = useAuth();
  const cloudEnabled = configured && isSupabaseConfigured();
  const { toast } = useToast();
  const [resetDialog, setResetDialog] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [demoDialog, setDemoDialog] = useState(false);
  const [lastExport, setLastExport] = useState<string | null>(null);

  async function handleLoadDemo() {
    setSeedingDemo(true);
    try {
      await applyDemoSeed(true);
      setDemoDialog(false);
      toast({
        title: "Демо-данные загружены",
        description: "Платформы, идеи, публикации и шаблоны заменены демо-набором.",
      });
    } catch (error) {
      toast({
        title: "Не удалось загрузить демо",
        description: error instanceof Error ? error.message : "Попробуйте снова",
        variant: "destructive",
      });
    } finally {
      setSeedingDemo(false);
    }
  }

  async function handleLegacyMigration() {
    setMigrating(true);
    try {
      await runLegacyMigration();
      toast({
        title: "Миграция завершена",
        description: "Данные перенесены в нормализованные таблицы Supabase.",
      });
    } catch (error) {
      toast({
        title: "Ошибка миграции",
        description: error instanceof Error ? error.message : "Не удалось перенести данные",
        variant: "destructive",
      });
    } finally {
      setMigrating(false);
    }
  }

  function handleExport() {
    exportData();
    const now = new Date().toLocaleString("ru-RU");
    setLastExport(now);
    toast({ title: "Данные экспортированы", description: "JSON-файл скачан на ваше устройство." });
  }

  async function handleReset() {
    setResetting(true);
    try {
      await resetData();
      setResetDialog(false);
      toast({ title: "Данные сброшены", description: "Демо-данные восстановлены." });
    } catch {
      toast({
        title: "Не удалось сбросить данные",
        description: "Проверьте подключение и попробуйте снова.",
        variant: "destructive",
      });
    } finally {
      setResetting(false);
    }
  }

  const totalItems = state.platforms.length + state.goals.length + state.ideas.length + state.publications.length + state.templates.length;

  return (
    <div className="space-y-8 max-w-2xl">
      <PageHeader title="Настройки" />

      <div className="space-y-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                {theme === "dark" ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
                <CardTitle className="text-base">Внешний вид</CardTitle>
              </div>
              <CardDescription>Настройте отображение интерфейса</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Тёмная тема</Label>
                  <p className="text-xs text-muted-foreground">Переключить на тёмное оформление</p>
                </div>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={checked => setTheme(checked ? "dark" : "light")}
                  data-testid="switch-dark-mode"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Аккаунт и данные</CardTitle>
              </div>
              <CardDescription>
                {cloudEnabled ? "Локальная копия + синхронизация с облаком" : "Вход в облако или работа только в браузере"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {!cloudEnabled && (
                <div className="rounded-lg border border-dashed border-border p-4 space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    Подключите Supabase в <code className="text-xs bg-muted px-1 rounded">.env</code>, чтобы включить регистрацию и синхронизацию между устройствами.
                  </p>
                  <Button variant="default" size="sm" className="gap-2" asChild>
                    <Link href="/login">
                      <LogIn className="h-4 w-4" />
                      Войти или зарегистрироваться
                    </Link>
                  </Button>
                </div>
              )}
              {cloudEnabled && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3 text-sm">
                  <div className="flex items-center gap-2 font-medium">
                    <Cloud className="h-4 w-4 text-primary" />
                    Облако (Supabase)
                  </div>
                  <p className="text-muted-foreground">Аккаунт: <span className="text-foreground">{user?.email}</span></p>
                  <p className="text-muted-foreground">Статус: <span className="text-foreground">{syncLabels[syncStatus]}</span></p>

                  {migrationStatus?.state === "pending" && (
                    <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
                      <p className="text-foreground font-medium">Найден legacy workspace</p>
                      <p className="text-xs text-muted-foreground">
                        В JSONB сохранены: {migrationStatus.legacySummary}. Перенесите их в нормализованные таблицы.
                      </p>
                      <Button
                        size="sm"
                        className="gap-2"
                        disabled={migrating}
                        onClick={handleLegacyMigration}
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                        {migrating ? "Миграция…" : "Перенести в новую схему"}
                      </Button>
                    </div>
                  )}

                  {migrationStatus?.state === "completed" && (
                    <p className="text-xs text-muted-foreground">
                      Legacy-миграция выполнена: {new Date(migrationStatus.migratedAt).toLocaleString("ru-RU")}
                    </p>
                  )}

                  {migrationStatus?.state === "failed" && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 space-y-2">
                      <p className="text-destructive text-xs">{migrationStatus.message}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        disabled={migrating}
                        onClick={handleLegacyMigration}
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                        Повторить миграцию
                      </Button>
                    </div>
                  )}

                  <Button variant="outline" size="sm" className="gap-2" onClick={() => signOut()}>
                    <LogOut className="h-4 w-4" />
                    Выйти
                  </Button>
                </div>
              )}
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

              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: "Платформ", value: state.platforms.length },
                  { label: "Идей", value: state.ideas.length },
                  { label: "Публикаций", value: state.publications.length },
                ].map(item => (
                  <div key={item.label} className="rounded-lg border border-border p-3">
                    <p className="text-xl font-bold">{item.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button className="gap-2 w-full sm:w-auto" onClick={handleExport} data-testid="button-export">
                  <Download className="h-4 w-4" />Экспортировать данные (JSON)
                </Button>
                {cloudEnabled && (
                  <Button
                    variant="outline"
                    className="gap-2 w-full sm:w-auto"
                    onClick={() => setDemoDialog(true)}
                  >
                    <Sparkles className="h-4 w-4" />
                    Загрузить демо-данные
                  </Button>
                )}
              </div>
              {cloudEnabled && demoSeedApplied && (
                <p className="text-xs text-muted-foreground">
                  Демо-набор уже применялся к этому аккаунту. Повторная загрузка заменит текущие данные.
                </p>
              )}
              {lastExport && (
                <p className="text-xs text-muted-foreground">Последний экспорт: {lastExport}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Системная информация</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="divide-y divide-border text-sm">
                {[
                  { label: "Версия приложения", value: "1.0.0" },
                  { label: "Хранилище данных", value: cloudEnabled ? "Supabase + localStorage" : "Браузер (localStorage)" },
                  { label: "Всего записей", value: totalItems.toString() },
                  { label: "Последний экспорт", value: lastExport ?? "Не выполнялся" },
                ].map(row => (
                  <div key={row.label} className="flex justify-between py-3">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
          <Card className="border-destructive/30">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-destructive" />
                <CardTitle className="text-base text-destructive">Сброс данных</CardTitle>
              </div>
              <CardDescription>Вернуть приложение к начальному состоянию</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Все ваши данные (цели, идеи, платформы, публикации) будут удалены и заменены демо-данными. Это действие нельзя отменить.
              </p>
              <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive" onClick={() => setResetDialog(true)} data-testid="button-reset">
                Сбросить все данные
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <AlertDialog open={demoDialog} onOpenChange={setDemoDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Загрузить демо-данные?</AlertDialogTitle>
            <AlertDialogDescription>
              Текущие платформы, идеи, публикации и шаблоны будут заменены демо-набором «Иван Иванов / дизайн».
              Рекомендуем сначала экспортировать данные.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <Button disabled={seedingDemo} onClick={handleLoadDemo}>
              {seedingDemo ? "Загружаем…" : "Загрузить демо"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resetDialog} onOpenChange={setResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Сбросить все данные?</AlertDialogTitle>
            <AlertDialogDescription>
              Все ваши данные будут безвозвратно удалены. Рекомендуем сначала экспортировать их.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <Button variant="destructive" disabled={resetting} onClick={handleReset}>
              {resetting ? "Сбрасываем…" : "Сбросить"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
