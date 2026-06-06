import type { ReactNode } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useStore } from "@/lib/store";
import { AppLogo } from "@/components/app/logo";

export function AppLoading({ label = "Загрузка…" }: { label?: string }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-background">
      <AppLogo showWordmark size="sm" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

/** Защищает основное приложение; страницы /, /login, /register и т.д. — в RootRouter (App.tsx). */
export function AppGate({ children }: { children: ReactNode }) {
  const { configured, loading, session, recoveryMode } = useAuth();
  const { ready } = useStore();

  if (!configured) {
    return <>{children}</>;
  }

  if (loading) {
    return <AppLoading label="Проверяем сессию…" />;
  }

  if (recoveryMode) {
    return <Redirect to="/reset-password" />;
  }

  if (!session) {
    return <Redirect to="/" />;
  }

  if (!ready) {
    return <AppLoading label="Загружаем ваши данные…" />;
  }

  return <>{children}</>;
}
