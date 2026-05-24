/** Базовый URL приложения для redirect Supabase (подтверждение email, сброс пароля). */
export function getAppOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

export function getAuthRedirectUrl(path = "/"): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "") || "";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getAppOrigin()}${base}${normalizedPath}`;
}

export const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"] as const;

export function isAuthRoute(path: string): boolean {
  return (AUTH_ROUTES as readonly string[]).includes(path);
}
