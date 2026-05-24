import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getAuthRedirectUrl } from "./auth-url";
import { isSupabaseConfigured, supabase } from "./supabase";

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  recoveryMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{
    error: string | null;
    needsEmailConfirm: boolean;
    signupDisabled: boolean;
  }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  resendConfirmation: (email: string) => Promise<{ error: string | null }>;
  clearRecoveryMode: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mapAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "Неверный email или пароль.";
  }
  if (lower.includes("user already registered")) {
    return "Пользователь с таким email уже зарегистрирован.";
  }
  if (lower.includes("email not confirmed")) {
    return "Подтвердите email — проверьте почту и перейдите по ссылке из письма.";
  }
  if (lower.includes("rate limit")) {
    return "Слишком много попыток. Подождите немного и попробуйте снова.";
  }
  if (lower.includes("signup") && lower.includes("disabled")) {
    return "Регистрация по email отключена в Supabase.";
  }
  if (lower.includes("signups not allowed")) {
    return "Регистрация по email отключена в Supabase.";
  }
  return message;
}

function isSignupDisabledError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    (lower.includes("signup") && lower.includes("disabled"))
    || lower.includes("signups not allowed")
    || lower.includes("email signups are disabled")
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();
  const [loading, setLoading] = useState(configured);
  const [session, setSession] = useState<Session | null>(null);
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    if (!configured || !supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [configured]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: "Supabase не настроен. Добавьте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в .env" };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? mapAuthError(error.message) : null };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      return { error: "Supabase не настроен", needsEmailConfirm: false, signupDisabled: false };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getAuthRedirectUrl("/"),
      },
    });

    if (error) {
      const mapped = mapAuthError(error.message);
      return {
        error: mapped,
        needsEmailConfirm: false,
        signupDisabled: isSignupDisabledError(error.message),
      };
    }

    // Supabase может вернуть user без session, если регистрация отключена
    const identities = data.user?.identities ?? [];
    if (data.user && identities.length === 0) {
      return {
        error: "Регистрация по email отключена в Supabase.",
        needsEmailConfirm: false,
        signupDisabled: true,
      };
    }

    const needsEmailConfirm = !data.session;
    return {
      error: null,
      needsEmailConfirm,
      signupDisabled: false,
    };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setRecoveryMode(false);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!supabase) return { error: "Supabase не настроен" };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAuthRedirectUrl("/reset-password"),
    });
    return { error: error ? mapAuthError(error.message) : null };
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    if (!supabase) return { error: "Supabase не настроен" };
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) setRecoveryMode(false);
    return { error: error ? mapAuthError(error.message) : null };
  }, []);

  const resendConfirmation = useCallback(async (email: string) => {
    if (!supabase) return { error: "Supabase не настроен" };
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: getAuthRedirectUrl("/"),
      },
    });
    return { error: error ? mapAuthError(error.message) : null };
  }, []);

  const clearRecoveryMode = useCallback(() => setRecoveryMode(false), []);

  return (
    <AuthContext.Provider
      value={{
        configured,
        loading,
        session,
        user: session?.user ?? null,
        recoveryMode,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        resendConfirmation,
        clearRecoveryMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
