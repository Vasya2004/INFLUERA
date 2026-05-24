export type ApiErrorKind = "network" | "auth" | "rls" | "validation" | "unknown";

export class AppApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly cause?: unknown;

  constructor(kind: ApiErrorKind, message: string, cause?: unknown) {
    super(message);
    this.name = "AppApiError";
    this.kind = kind;
    this.cause = cause;
  }
}

type PostgresLikeError = {
  code?: string;
  message?: string;
  status?: number;
};

function isPostgresLikeError(error: unknown): error is PostgresLikeError {
  return typeof error === "object" && error !== null;
}

export function classifyApiError(error: unknown): AppApiError {
  if (error instanceof AppApiError) return error;

  if (error instanceof TypeError && /fetch|network/i.test(error.message)) {
    return new AppApiError("network", "Нет соединения с сервером. Проверьте интернет.", error);
  }

  if (!isPostgresLikeError(error)) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    return new AppApiError("unknown", message, error);
  }

  const code = error.code ?? "";
  const message = error.message ?? "Ошибка Supabase";
  const status = error.status;

  if (status === 401 || code === "PGRST301" || /jwt|session|not authenticated/i.test(message)) {
    return new AppApiError("auth", "Сессия истекла. Войдите снова.", error);
  }

  if (code === "42501" || /row-level security|permission denied/i.test(message)) {
    return new AppApiError("rls", "Нет доступа к данным. Проверьте вход в аккаунт.", error);
  }

  if (
    code === "23505"
    || code === "23503"
    || code === "23514"
    || code === "22P02"
    || code === "PGRST116"
  ) {
    return new AppApiError("validation", "Некорректные данные для сохранения.", error);
  }

  if (code === "42P01") {
    return new AppApiError("unknown", "Схема базы не обновлена. Примените миграции Supabase.", error);
  }

  return new AppApiError("unknown", message, error);
}

export function getApiErrorMessage(error: unknown): string {
  return classifyApiError(error).message;
}
