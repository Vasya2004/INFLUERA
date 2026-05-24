import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Profile } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Image, Upload, UserCircle, X } from "lucide-react";
import { PageHeader } from "@/components/app/page";
import { validateFile } from "@/lib/file-validation";

const PROFILE_FIELDS: { key: keyof Profile; label: string; placeholder: string; multiline?: boolean }[] = [
  { key: "name", label: "Имя / Бренд", placeholder: "Иван Иванов" },
  { key: "niche", label: "Ниша", placeholder: "Дизайн интерфейсов, маркетинг..." },
  { key: "positioning", label: "Позиционирование", placeholder: "Одним предложением — кто вы и для кого" },
  { key: "description", label: "Описание блога", placeholder: "О чём ваш блог...", multiline: true },
  { key: "targetAudience", label: "Целевая аудитория", placeholder: "Кто ваши читатели, их боли и интересы", multiline: true },
  { key: "mainTopics", label: "Главные темы", placeholder: "UX, карьера, инструменты..." },
  { key: "rubrics", label: "Рубрики / Хэштеги", placeholder: "#карьера, #разбор, #инструменты" },
  { key: "tone", label: "Тон коммуникации", placeholder: "Дружелюбный, профессиональный..." },
  { key: "expertise", label: "Ключевая экспертиза", placeholder: "В чём вы действительно разбираетесь", multiline: true },
  { key: "opportunities", label: "Что хочу получить через блог", placeholder: "Клиенты, нетворкинг, менторство...", multiline: true },
];

function completeness(profile: Profile): number {
  const filled = PROFILE_FIELDS.filter(f => profile[f.key] && String(profile[f.key]).trim().length > 0).length;
  return Math.round((filled / PROFILE_FIELDS.length) * 100);
}

export default function ProfilePage() {
  const { state, updateProfile } = useStore();
  const { toast } = useToast();
  const [form, setForm] = useState<Profile>({ ...state.profile });
  const [saved, setSaved] = useState(false);
  const [assetError, setAssetError] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const pct = completeness(form);

  const set = (k: keyof Profile, v: string) => {
    setSaved(false);
    setForm(f => ({ ...f, [k]: v }));
  };

  function handleSave() {
    updateProfile(form);
    setSaved(true);
    toast({ title: "Профиль сохранён", description: "Изменения успешно применены." });
  }

  function pickAsset(kind: "avatar" | "cover") {
    (kind === "avatar" ? avatarInputRef : coverInputRef).current?.click();
  }

  function handleAssetChange(kind: "avatar" | "cover", e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const validationError = validateFile(file, "profile-assets");
    if (validationError) {
      setAssetError(validationError);
      e.target.value = "";
      return;
    }
    setAssetError("");
    const reader = new FileReader();
    reader.onload = () => {
      setSaved(false);
      setForm(current => kind === "avatar"
        ? { ...current, avatarUrl: reader.result as string, avatarStoragePath: undefined }
        : { ...current, coverUrl: reader.result as string, coverStoragePath: undefined });
    };
    reader.onerror = () => setAssetError("Не удалось прочитать файл");
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <PageHeader
        title="Профиль блога"
        action={
          <Button onClick={handleSave} data-testid="button-save-profile" className="gap-2">
            {saved ? <CheckCircle2 className="h-4 w-4" /> : null}
            {saved ? "Сохранено" : "Сохранить"}
          </Button>
        }
      />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <CardTitle>Визуальные материалы</CardTitle>
            <CardDescription>Аватар и обложка профиля</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input ref={avatarInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="sr-only" onChange={e => handleAssetChange("avatar", e)} />
            <input ref={coverInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="sr-only" onChange={e => handleAssetChange("cover", e)} />
            <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
              <div className="relative h-32 bg-muted sm:h-40">
                {form.coverUrl ? (
                  <img src={form.coverUrl} alt="Обложка профиля" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <Image className="h-8 w-8" />
                  </div>
                )}
                <Button type="button" size="sm" variant="secondary" className="absolute right-3 top-3 gap-1.5" onClick={() => pickAsset("cover")}>
                  <Upload className="h-3.5 w-3.5" />
                  Обложка
                </Button>
                {form.coverUrl && (
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute right-3 top-14 h-8 w-8"
                    onClick={() => setForm(current => ({ ...current, coverUrl: undefined, coverStoragePath: undefined }))}
                    aria-label="Удалить обложку"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <div className="-mt-8 flex items-end justify-between gap-3 px-4 pb-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-background bg-background shadow-sm">
                  {form.avatarUrl ? (
                    <img src={form.avatarUrl} alt="Аватар профиля" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <UserCircle className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => pickAsset("avatar")}>
                    <Upload className="h-3.5 w-3.5" />
                    Аватар
                  </Button>
                  {form.avatarUrl && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setForm(current => ({ ...current, avatarUrl: undefined, avatarStoragePath: undefined }))}
                    >
                      Удалить
                    </Button>
                  )}
                </div>
              </div>
            </div>
            {assetError && (
              <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {assetError}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-2 border-dashed">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Заполненность профиля</span>
              </div>
              <span className={`text-sm font-semibold ${pct === 100 ? "text-emerald-600 dark:text-emerald-400" : pct >= 70 ? "text-primary" : "text-muted-foreground"}`}>
                {pct}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {pct === 100 ? "Профиль полностью заполнен" : `Заполните оставшиеся поля для полного профиля`}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <Card>
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
            <CardDescription>Базовые данные о вас и вашем блоге</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              {["name", "niche"].map(k => {
                const f = PROFILE_FIELDS.find(x => x.key === k)!;
                return (
                  <div key={k} className="space-y-1.5">
                    <Label htmlFor={k}>{f.label}</Label>
                    <Input id={k} placeholder={f.placeholder} value={form[f.key]} onChange={e => set(f.key, e.target.value)} data-testid={`input-profile-${k}`} />
                  </div>
                );
              })}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="positioning">{PROFILE_FIELDS.find(x => x.key === "positioning")!.label}</Label>
              <Input id="positioning" placeholder={PROFILE_FIELDS.find(x => x.key === "positioning")!.placeholder} value={form.positioning} onChange={e => set("positioning", e.target.value)} data-testid="input-profile-positioning" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">{PROFILE_FIELDS.find(x => x.key === "description")!.label}</Label>
              <Textarea id="description" rows={3} placeholder={PROFILE_FIELDS.find(x => x.key === "description")!.placeholder} value={form.description} onChange={e => set("description", e.target.value)} data-testid="input-profile-description" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
        <Card>
          <CardHeader>
            <CardTitle>Аудитория и контент</CardTitle>
            <CardDescription>Кто вас читает и о чём вы пишете</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="targetAudience">Целевая аудитория</Label>
              <Textarea id="targetAudience" rows={2} placeholder="Кто ваши читатели, их боли и интересы" value={form.targetAudience} onChange={e => set("targetAudience", e.target.value)} data-testid="input-profile-audience" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mainTopics">Главные темы</Label>
              <Input id="mainTopics" placeholder="UX, карьера, инструменты..." value={form.mainTopics} onChange={e => set("mainTopics", e.target.value)} data-testid="input-profile-topics" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="rubrics">Рубрики / Хэштеги</Label>
                <Input id="rubrics" placeholder="#карьера, #разбор" value={form.rubrics} onChange={e => set("rubrics", e.target.value)} data-testid="input-profile-rubrics" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tone">Тон коммуникации</Label>
                <Input id="tone" placeholder="Дружелюбный, профессиональный" value={form.tone} onChange={e => set("tone", e.target.value)} data-testid="input-profile-tone" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle>Стратегия и цели</CardTitle>
            <CardDescription>Ваша экспертиза и то, что хотите получить через блог</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="expertise">Ключевая экспертиза</Label>
              <Textarea id="expertise" rows={2} placeholder="В чём вы действительно разбираетесь" value={form.expertise} onChange={e => set("expertise", e.target.value)} data-testid="input-profile-expertise" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="opportunities">Что хочу получить через блог</Label>
              <Textarea id="opportunities" rows={2} placeholder="Клиенты, нетворкинг, менторство..." value={form.opportunities} onChange={e => set("opportunities", e.target.value)} data-testid="input-profile-opportunities" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="flex justify-end pb-4">
        <Button onClick={handleSave} size="lg" data-testid="button-save-profile-bottom">
          {saved ? "Сохранено" : "Сохранить изменения"}
        </Button>
      </div>
    </div>
  );
}
