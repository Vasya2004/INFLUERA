import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { AppLogo } from "@/components/app/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";

type AuthMode = "signin" | "signup" | "forgot";

function modeFromPath(path: string): AuthMode {
  if (path === "/register") return "signup";
  if (path === "/forgot-password") return "forgot";
  return "signin";
}

const titles: Record<AuthMode, string> = {
  signin: "Вход",
  signup: "Регистрация",
  forgot: "Восстановление пароля",
};

const descriptions: Record<AuthMode, string> = {
  signin: "Войдите, чтобы синхронизировать данные в облаке",
  signup: "Создайте аккаунт — ваши данные сохранятся в Supabase",
  forgot: "Мы отправим ссылку для сброса пароля на ваш email",
};

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const mode = useMemo(() => modeFromPath(location), [location]);
  const { configured, loading, session, signIn, signUp, resetPassword, resendConfirmation } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [signupBlocked, setSignupBlocked] = useState(false);

  useEffect(() => {
    if (configured && !loading && session) {
      setLocation("/app");
    }
  }, [configured, loading, session, setLocation]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      toast({ title: "Укажите email", variant: "destructive" });
      return;
    }

    if (mode === "forgot") {
      setBusy(true);
      try {
        const { error } = await resetPassword(trimmedEmail);
        if (error) {
          toast({ title: "Не удалось отправить письмо", description: error, variant: "destructive" });
        } else {
          setResetSent(true);
          toast({
            title: "Письмо отправлено",
            description: "Проверьте почту и перейдите по ссылке для сброса пароля.",
          });
        }
      } finally {
        setBusy(false);
      }
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Проверьте пароль",
        description: "Минимум 6 символов.",
        variant: "destructive",
      });
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      toast({ title: "Пароли не совпадают", variant: "destructive" });
      return;
    }

    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await signIn(trimmedEmail, password);
        if (error) {
          toast({ title: "Не удалось войти", description: error, variant: "destructive" });
        }
      } else {
        const { error, needsEmailConfirm, signupDisabled } = await signUp(trimmedEmail, password);
        if (signupDisabled) {
          setSignupBlocked(true);
          toast({
            title: "Регистрация отключена",
            description: "Создайте пользователя в Supabase Dashboard или войдите в существующий аккаунт.",
            variant: "destructive",
          });
        } else if (error) {
          toast({ title: "Не удалось зарегистрироваться", description: error, variant: "destructive" });
        } else if (needsEmailConfirm) {
          setAwaitingConfirm(true);
          toast({
            title: "Подтвердите email",
            description: "Мы отправили письмо со ссылкой для активации аккаунта.",
          });
        } else {
          toast({ title: "Аккаунт создан", description: "Добро пожаловать в Influera!" });
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;
    setBusy(true);
    try {
      const { error } = await resendConfirmation(trimmedEmail);
      if (error) {
        toast({ title: "Не удалось отправить", description: error, variant: "destructive" });
      } else {
        toast({ title: "Письмо отправлено повторно" });
      }
    } finally {
      setBusy(false);
    }
  }

  if (configured && loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Проверяем сессию…</p>
      </div>
    );
  }

  if (configured && session) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Вход выполнен, перенаправляем…</p>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-amber-500/30">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <AppLogo showWordmark size="sm" />
            </div>
            <div className="flex justify-center">
              <AlertCircle className="h-10 w-10 text-amber-500" />
            </div>
            <CardTitle>Нужна настройка Supabase</CardTitle>
            <CardDescription className="text-left space-y-2">
              <p>Для входа и регистрации создайте файл <code className="text-xs bg-muted px-1 rounded">.env</code> в корне проекта:</p>
              <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto text-left">
{`VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key`}
              </pre>
              <p className="text-xs">
                В Supabase Dashboard: Authentication → URL Configuration добавьте{" "}
                <strong>http://localhost:5173</strong> в Redirect URLs.
              </p>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/app">Продолжить без входа (локальные данные)</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === "signup" && signupBlocked) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-border/60 shadow-xl">
          <CardHeader className="space-y-3 text-center">
            <AppLogo showWordmark size="sm" />
            <CardTitle>Регистрация недоступна</CardTitle>
            <CardDescription>
              В Supabase отключена регистрация по email. Попросите администратора создать аккаунт в{" "}
              <strong>Authentication → Users → Add user</strong>, затем войдите на странице входа.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" asChild>
              <Link href="/login">Перейти ко входу</Link>
            </Button>
          </CardContent>
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
            <CardTitle>{titles[mode]}</CardTitle>
            <CardDescription>{descriptions[mode]}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {awaitingConfirm ? (
            <div className="space-y-4 text-center text-sm">
              <p className="text-muted-foreground">
                На <strong className="text-foreground">{email}</strong> отправлено письмо. Перейдите по ссылке, затем войдите.
              </p>
              <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={handleResend}>
                Отправить письмо ещё раз
              </Button>
              <Link href="/login" className="block text-primary hover:underline font-medium">
                Перейти ко входу
              </Link>
            </div>
          ) : resetSent && mode === "forgot" ? (
            <div className="space-y-4 text-center text-sm">
              <p className="text-muted-foreground">
                Если аккаунт существует, на <strong className="text-foreground">{email}</strong> придёт письмо со ссылкой.
              </p>
              <Link href="/login" className="block text-primary hover:underline font-medium">
                Вернуться ко входу
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>

                {mode !== "forgot" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Пароль</Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete={mode === "signin" ? "current-password" : "new-password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Минимум 6 символов"
                      required
                      minLength={6}
                    />
                  </div>
                )}

                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm">Повторите пароль</Label>
                    <Input
                      id="confirm"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                )}

                {mode === "signin" && (
                  <div className="text-right">
                    <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                      Забыли пароль?
                    </Link>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={busy}>
                  {busy
                    ? "Подождите…"
                    : mode === "signin"
                      ? "Войти"
                      : mode === "signup"
                        ? "Зарегистрироваться"
                        : "Отправить ссылку"}
                </Button>
              </form>

              <p className="mt-4 text-center text-sm text-muted-foreground">
                {mode === "signin" && (
                  <>
                    Нет аккаунта?{" "}
                    <Link href="/register" className="font-medium text-primary hover:underline">
                      Зарегистрироваться
                    </Link>
                  </>
                )}
                {mode === "signup" && (
                  <>
                    Уже есть аккаунт?{" "}
                    <Link href="/login" className="font-medium text-primary hover:underline">
                      Войти
                    </Link>
                  </>
                )}
                {mode === "forgot" && (
                  <>
                    <Link href="/login" className="font-medium text-primary hover:underline">
                      Вернуться ко входу
                    </Link>
                  </>
                )}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
