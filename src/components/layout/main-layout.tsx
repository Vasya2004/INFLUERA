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
  { name: "Главная", href: "/", icon: LayoutDashboard },
  { name: "Цели", href: "/goals", icon: Target },
  { name: "Идеи", href: "/ideas", icon: Lightbulb },
  { name: "Контент-план", href: "/content-plan", icon: CalendarDays },
  { name: "База", href: "/base", icon: Database, aliases: ["/platforms", "/templates"] },
];

function exportData(state: object) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "influera-data.json";
  a.click();
  URL.revokeObjectURL(url);
}

function SidebarContent({
  location,
  onNav,
}: {
  location: string;
  onNav?: () => void;
}) {
  const { theme, setTheme } = useTheme();
  const { state } = useStore();
  const { configured, user, signOut } = useAuth();
  const cloudEnabled = configured && isSupabaseConfigured();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const isDark = theme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");
  const profileName = state.profile?.name || "";
  const accountLine = cloudEnabled && user?.email ? user.email : (state.profile?.niche || "Мой блог");

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
        <AppLogo showWordmark size="xs" onClick={onNav} />
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {mainNav.map((item) => {
          const isActive = item.href === "/"
            ? location === "/"
            : location === item.href
              || location.startsWith(item.href + "/")
              || location.startsWith(item.href + "?")
              || item.aliases?.some(alias => location === alias || location.startsWith(alias + "/"));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNav}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 select-none",
                isActive
                  ? "bg-primary/12 text-foreground shadow-[inset_0_1px_0_hsl(0_0%_100%/.08)] ring-1 ring-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/60 dark:hover:bg-white/[0.05]"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary drop-shadow-[0_0_10px_hsl(var(--primary)/0.38)]" : "text-muted-foreground")} />
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
              className="glass-card mb-2 overflow-hidden rounded-3xl"
            >
              <Link
                href="/profile"
                onClick={() => { setProfileMenuOpen(false); onNav?.(); }}
                className="flex items-center gap-3 px-3.5 py-3.5 transition-colors hover:bg-primary/8"
              >
                <div className="h-9 w-9 shrink-0 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_24px_hsl(var(--primary)/0.24)]">
                  <span className="select-none text-xs font-bold text-primary-foreground">{initials}</span>
                </div>
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
                href="/profile"
                onClick={() => { setProfileMenuOpen(false); onNav?.(); }}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-3 text-sm font-medium transition-colors hover:bg-primary/8",
                  location === "/profile" && "bg-primary/10 text-foreground"
                )}
              >
                <UserCircle className="h-4 w-4 shrink-0" />
                Профиль
              </Link>
              <Link
                href="/settings"
                onClick={() => { setProfileMenuOpen(false); onNav?.(); }}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-3 text-sm font-medium transition-colors hover:bg-primary/8",
                  location === "/settings" && "bg-primary/10 text-foreground"
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
          className="glass-card group flex w-full items-center gap-3 rounded-3xl px-3.5 py-3 text-left transition-all duration-150 hover:border-primary/25 hover:bg-primary/8"
        >
          <div className="h-8 w-8 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-[0_0_22px_hsl(var(--primary)/0.22)]">
            <span className="text-primary-foreground text-xs font-bold select-none">{initials}</span>
          </div>
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

  const isActiveRoute = (item: typeof mainNav[number]) => item.href === "/"
    ? location === "/"
    : location === item.href
      || location.startsWith(item.href + "/")
      || location.startsWith(item.href + "?")
      || item.aliases?.some(alias => location === alias || location.startsWith(alias + "/"));

  return (
    <div className="app-shell flex h-[100dvh] min-h-[100dvh] w-full overflow-hidden text-foreground selection:bg-primary selection:text-primary-foreground">

      {/* ── Desktop sidebar ── */}
      <aside className="glass-sidebar hidden h-[100dvh] w-64 shrink-0 flex-col border-r md:flex">
        <SidebarContent location={location} />
      </aside>

      {/* ── Right side: mobile topbar + content ── */}
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">

        {/* Mobile top bar */}
        <header className="glass-card md:hidden flex items-center justify-between gap-3 px-4 h-14 rounded-none border-x-0 border-t-0 sticky top-0 z-30 shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <AppLogo size="sm" unlinked />
            <span className="font-bold text-sm tracking-tight">Influera</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              aria-label="Настройки"
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/80 bg-background/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <Settings className="h-5 w-5" />
            </Link>
            <Link
              href="/profile"
              aria-label="Профиль"
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-primary/25 bg-primary text-primary-foreground shadow-[0_0_24px_hsl(var(--primary)/0.24)] transition-opacity hover:opacity-90"
            >
              {state.profile?.avatarUrl ? (
                <img src={state.profile.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="select-none text-xs font-bold">{initials}</span>
              )}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="page-content-ambient mx-auto min-h-full w-full max-w-6xl p-4 pb-28 sm:p-6 sm:pb-32 md:p-8">
            {children}
          </div>
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] md:hidden">
          <div className="mx-auto grid w-full max-w-md grid-cols-5 gap-1 rounded-3xl border border-border/80 bg-card/92 p-1.5 shadow-2xl backdrop-blur-xl">
            {mainNav.map(item => {
              const Icon = item.icon;
              const active = isActiveRoute(item);
              const label = item.name === "Контент-план" ? "План" : item.name;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.name}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-semibold transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-[0_10px_30px_hsl(var(--primary)/0.28)]"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="leading-none">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
