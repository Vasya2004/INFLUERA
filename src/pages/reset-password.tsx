import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { AppLogo } from "@/components/app/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function ResetPassword() {
  const { updatePassword, configured, loading, session, recoveryMode } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (configured && !loading && session && !recoveryMode) {
      setLocation("/app");
    }
  }, [configured, loading, session, recoveryMode, setLocation]);

  if (configured && loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      </div>
    );
  }

  if (configured && session && !recoveryMode) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Перенаправляем…</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast({
        title: "Слишком короткий пароль",
        description: "Минимум 6 символов.",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirm) {
      toast({
        title: "Пароли не совпадают",
        variant: "destructive",
      });
      return;
    }

    setBusy(true);
    try {
      const { error } = await updatePassword(password);
      if (error) {
        toast({ title: "Не удалось обновить пароль", description: error, variant: "destructive" });
      } else {
        toast({ title: "Пароль обновлён", description: "Теперь можно пользоваться приложением." });
        setLocation("/app");
      }
    } finally {
      setBusy(false);
    }
  }

  if (!configured) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Supabase не настроен</CardTitle>
            <CardDescription>
              Добавьте переменные VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в файл .env
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-violet-500/15 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md border-border/60 shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <AppLogo showWordmark size="sm" />
          </div>
          <div>
            <CardTitle>Новый пароль</CardTitle>
            <CardDescription>Задайте новый пароль для вашего аккаунта</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">Новый пароль</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Минимум 6 символов"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Повторите пароль</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Сохраняем…" : "Сохранить пароль"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
