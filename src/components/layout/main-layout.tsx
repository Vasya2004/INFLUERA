import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { isSupabaseConfigured } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Target, Database, Lightbulb, CalendarDays,
  UserCircle, Settings, Sun, Moon, Download,
  ChevronRight, ChevronUp, LogOut,
} from "lucide-react";
import { AppLogo } from "@/components/app/logo";

const mainNav = [
  { name: "Главная", href: "/app", icon: LayoutDashboard },
  { name: "Цели", href: "/app/goals", icon: Target },
  { name: "Идеи", href: "/app/ideas", icon: Lightbulb },
  { name: "Контент-план", href: "/app/content-plan", icon: CalendarDays },
  { name: "База", href: "/app/base", icon: Database, aliases: ["/app/platforms", "/app/templates"] },
];

const mobileBottomNav = mainNav;

function isMainNavItemActive(item: typeof mainNav[number], location: string) {
  if (item.href === "/app") return location === "/app";
  return location === item.href
    || location.startsWith(item.href + "/")
    || location.startsWith(item.href + "?")
    || item.aliases?.some(alias => location === alias || location.startsWith(alias + "/"));
}

function exportData(state: object) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "influera-data.json";
  a.click();
  URL.revokeObjectURL(url);
}

function ProfileAvatar({ avatarUrl, initials, className }: {
  avatarUrl?: string;
  initials: string;
  className?: string;
}) {
  return (
    <div className={cn(
      "shrink-0 overflow-hidden rounded-xl bg-primary flex items-center justify-center",
      className,
    )}>
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="select-none text-xs font-bold text-primary-foreground">{initials}</span>
      )}
    </div>
  );
}

function SidebarContent({
  location,
  onNav,
}: {
  location: string;
  onNav?: () => void;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const { state } = useStore();
  const { configured, user, signOut } = useAuth();
  const cloudEnabled = configured && isSupabaseConfigured();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const isDark = resolvedTheme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");
  const profileName = state.profile?.name || "";
  const accountLine = cloudEnabled && user?.email ? user.email : (state.profile?.niche || "Мой блог");
  const avatarUrl = state.profile?.avatarUrl;

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      setProfileMenuOpen(false);
      onNav?.();
    } finally {
      setSigningOut(false);
    }
  }

  const initials = profileName
    ? profileName.trim().split(/\s+/).map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "IN";

  return (
    <>
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 shrink-0">
        <AppLogo showWordmark size="xs" href="/app" onClick={onNav} />
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {mainNav.map((item) => {
          const isActive = isMainNavItemActive(item, location);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNav}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 select-none",
                isActive
                  ? "bg-primary/10 text-foreground ring-1 ring-primary/15"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Account menu */}
      <div className="px-3 pb-3 shrink-0">
        <AnimatePresence initial={false}>
          {profileMenuOpen && (
            <motion.div
              key="profile-menu"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="surface-card mb-2 overflow-hidden rounded-xl"
            >
              <Link
                href="/app/profile"
                onClick={() => { setProfileMenuOpen(false); onNav?.(); }}
                className="flex items-center gap-3 px-3.5 py-3.5 transition-colors hover:bg-primary/8"
              >
                <ProfileAvatar avatarUrl={avatarUrl} initials={initials} className="h-9 w-9" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold leading-tight">{profileName || "Твой профиль"}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{accountLine}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>

              <div className="mx-3.5 h-px bg-border/70" />

              <button
                type="button"
                onClick={toggleTheme}
                className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-primary/8"
              >
                {isDark ? <Moon className="h-4 w-4 shrink-0" /> : <Sun className="h-4 w-4 shrink-0" />}
                <span className="min-w-0">
                  <span className="block text-sm font-medium">Персонализация</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {isDark ? "Тёмная тема" : "Светлая тема"}
                  </span>
                </span>
              </button>
              <Link
                href="/app/profile"
                onClick={() => { setProfileMenuOpen(false); onNav?.(); }}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-3 text-sm font-medium transition-colors hover:bg-primary/8",
                  location === "/app/profile" && "bg-primary/10 text-foreground"
                )}
              >
                <UserCircle className="h-4 w-4 shrink-0" />
                Профиль
              </Link>
              <Link
                href="/app/settings"
                onClick={() => { setProfileMenuOpen(false); onNav?.(); }}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-3 text-sm font-medium transition-colors hover:bg-primary/8",
                  location === "/app/settings" && "bg-primary/10 text-foreground"
                )}
              >
                <Settings className="h-4 w-4 shrink-0" />
                Настройки
              </Link>

              <div className="mx-3.5 h-px bg-border/70" />

              <button
                type="button"
                onClick={() => { exportData(state); setProfileMenuOpen(false); onNav?.(); }}
                className="flex w-full items-center gap-3 px-3.5 py-3 text-left text-sm font-medium transition-colors hover:bg-primary/8"
              >
                <Download className="h-4 w-4 shrink-0" />
                Экспорт данных
              </button>
              {cloudEnabled ? (
                <button
                  type="button"
                  disabled={signingOut}
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 px-3.5 py-3 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  {signingOut ? "Выход…" : "Выйти"}
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => { setProfileMenuOpen(false); onNav?.(); }}
                  className="flex items-center gap-3 px-3.5 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/8"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  Войти
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setProfileMenuOpen(open => !open)}
          aria-expanded={profileMenuOpen}
          className="surface-card group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-all duration-150 hover:bg-muted/50"
        >
          <ProfileAvatar avatarUrl={avatarUrl} initials={initials} className="h-8 w-8" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight truncate">
              {profileName || "Твой профиль"}
            </p>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">
              {profileName ? accountLine : "Заполни профиль"}
            </p>
          </div>
          <ChevronUp
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:text-foreground",
              profileMenuOpen && "rotate-180"
            )}
          />
        </button>
      </div>
    </>
  );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { state } = useStore();
  const profileName = state.profile?.name || "";
  const initials = profileName
    ? profileName.trim().split(/\s+/).map((word: string) => word[0]).join("").toUpperCase().slice(0, 2)
    : "IN";
  const avatarUrl = state.profile?.avatarUrl;
  const isSettingsActive = location === "/app/settings";

  const isActiveRoute = (item: typeof mainNav[number]) => isMainNavItemActive(item, location);

  return (
    <div className="app-shell flex h-[100dvh] min-h-[100dvh] w-full overflow-hidden text-foreground selection:bg-primary selection:text-primary-foreground">

      {/* ── Desktop sidebar ── */}
      <aside className="glass-sidebar hidden h-[100dvh] w-64 shrink-0 flex-col border-r md:flex">
        <SidebarContent location={location} />
      </aside>

      {/* ── Right side: mobile topbar + content ── */}
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">

        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-2 border-b border-border/70 bg-background/95 px-3 py-2 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 md:hidden">
          <Link
            href="/app/profile"
            aria-label="Профиль"
            className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-card"
          >
            <ProfileAvatar avatarUrl={avatarUrl} initials={initials} className="h-full w-full rounded-xl" />
          </Link>

          <Link
            href="/app"
            aria-label="Influera"
            className="flex min-h-10 min-w-0 flex-1 items-center justify-center rounded-xl px-3"
          >
            <AppLogo showWordmark size="xs" unlinked />
          </Link>

          <Link
            href="/app/settings"
            aria-label="Настройки"
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card transition-colors",
              isSettingsActive && "border-primary/30 bg-primary text-primary-foreground",
            )}
          >
            <Settings className="h-5 w-5" />
          </Link>
        </header>

        {/* Page content */}
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain">
          <div className="mx-auto min-h-full w-full max-w-[1680px] px-3 py-4 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:px-5 sm:py-5 sm:pb-[calc(env(safe-area-inset-bottom)+5.75rem)] md:p-6 md:pb-6 xl:p-8">
            {children}
          </div>
        </main>

        <nav
          aria-label="Основная навигация"
          className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] z-40 flex justify-center px-3 md:hidden"
        >
          <div className="pointer-events-auto mx-auto grid w-full max-w-[28rem] grid-cols-5 gap-1 rounded-[1.75rem] border border-border/80 bg-card/95 p-1.5 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.18),0_2px_8px_-2px_rgba(0,0,0,0.08)] backdrop-blur-xl supports-[backdrop-filter]:bg-card/88 dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.55),0_2px_8px_-2px_rgba(0,0,0,0.35)]">
            {mobileBottomNav.map(item => {
              const Icon = item.icon;
              const active = isActiveRoute(item);
              const label = item.name === "Контент-план" ? "План" : item.name;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.name}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-[3.125rem] flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 text-[10px] font-medium leading-none transition-all",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground active:scale-95 active:bg-muted/60",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="max-w-full truncate px-0.5">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
