import { Redirect, Link } from "wouter";
import { motion } from "framer-motion";
import {
  BarChart3,
  Bot,
  CalendarDays,
  CheckCircle2,
  Database,
  FileText,
  Lightbulb,
  Target,
} from "lucide-react";
import { AppLogo } from "@/components/app/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const painCards = [
  "Идеи есть, но они теряются в заметках и голове",
  "Не понимаешь, растёт ли аудитория и за счёт чего",
  "Контент выходит хаотично, без системы",
  "Нет понимания, какой формат работает лучше",
];

const featureCards = [
  {
    icon: CalendarDays,
    title: "Контент-план",
    description: "Планируй публикации в календаре. Месяц, неделя или список — как удобно.",
  },
  {
    icon: Target,
    title: "Цели по платформам",
    description: "Ставь цели по подписчикам и отслеживай прогресс по каждой платформе.",
  },
  {
    icon: Lightbulb,
    title: "Банк идей",
    description: "Сохраняй идеи с описанием и сценарием. Одним кликом переводи в контент-план.",
  },
  {
    icon: Database,
    title: "База материалов",
    description: "Храни сценарии, шаблоны, хуки и структуры публикаций в одном месте.",
  },
  {
    icon: Bot,
    title: "AI Producer (скоро)",
    description: "Генерация сценариев и идей с помощью AI прямо внутри сервиса.",
  },
];

const audienceCards = [
  "Ведёшь блог на нескольких платформах одновременно",
  "Хочешь выстроить систему и перестать действовать хаотично",
  "Готовишься к монетизации и хочешь расти осознанно",
];

const previews = [
  {
    title: "Главная",
    accent: "from-blue-500/25 to-cyan-400/10",
    content: ["Аудитория 12 480", "Активных целей 3", "В контент-плане 18"],
  },
  {
    title: "Контент-план",
    accent: "from-violet-500/20 to-blue-500/10",
    content: ["Пн 12 · сценарий", "Ср 14 · пост", "Пт 16 · чекпоинт"],
  },
  {
    title: "База",
    accent: "from-emerald-500/20 to-cyan-500/10",
    content: ["Шаблоны", "Платформы", "Материалы"],
  },
];

function FadeSection({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export default function Landing() {
  const { configured, loading, session } = useAuth();

  if (configured && !loading && session) {
    return <Redirect to="/app" />;
  }

  return (
    <div className="h-[100dvh] overflow-y-auto overflow-x-hidden scroll-smooth bg-[#050914] text-white">
      <div className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#050914]/75 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <AppLogo showWordmark size="xs" />
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="text-white/80 hover:bg-white/10 hover:text-white" asChild>
              <Link href="/login">Войти</Link>
            </Button>
            <Button className="shadow-[0_12px_34px_hsl(var(--primary)/0.28)]" asChild>
              <Link href="/register">Попробовать бесплатно</Link>
            </Button>
          </div>
        </nav>
      </div>

      <main>
        <section className="relative overflow-hidden pt-28">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(7,13,30,.98),rgba(10,16,38,.92)_52%,rgba(28,18,74,.82))]" />
          <div className="relative mx-auto grid min-h-[660px] max-w-7xl items-center gap-10 px-4 pb-20 sm:px-6 lg:grid-cols-[1fr_0.88fr] lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <h1 className="max-w-4xl text-5xl font-bold leading-[1.02] tracking-normal sm:text-6xl lg:text-7xl">
                Система для блогера, который хочет расти
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72 sm:text-xl">
                Контент-план, цели, сценарии и аналитика аудитории — всё в одном месте.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="min-h-12 px-6 text-base" asChild>
                  <Link href="/register">Попробовать бесплатно</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="min-h-12 border-white/18 bg-white/5 px-6 text-base text-white hover:bg-white/10 hover:text-white"
                  asChild
                >
                  <a href="#preview">Посмотреть как работает</a>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="rounded-[2rem] border border-white/12 bg-white/[0.055] p-4 shadow-2xl backdrop-blur"
            >
              <div className="rounded-[1.5rem] border border-white/10 bg-[#071021] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/55">Главная</p>
                    <p className="text-2xl font-bold">314 · 10 000</p>
                  </div>
                  <BarChart3 className="h-9 w-9 text-primary" />
                </div>
                <div className="h-36 rounded-2xl border border-white/10 bg-gradient-to-br from-primary/20 to-cyan-400/5 p-4">
                  <div className="mt-16 h-2 rounded-full bg-white/10">
                    <div className="h-2 w-2/3 rounded-full bg-primary" />
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-2">
                    {[42, 68, 88].map(value => (
                      <div key={value} className="h-10 rounded-xl bg-white/8" style={{ opacity: value / 100 }} />
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {["Идеи", "Платформы", "Публикации", "Цели"].map(item => (
                    <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
                      <p className="text-sm font-semibold">{item}</p>
                      <p className="mt-1 text-xs text-white/50">Всё под контролем</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <FadeSection className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold sm:text-4xl">Узнаёшь себя?</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {painCards.map(text => (
              <div key={text} className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 text-white/78">
                <CheckCircle2 className="mb-5 h-6 w-6 text-primary" />
                {text}
              </div>
            ))}
          </div>
        </FadeSection>

        <FadeSection className="border-y border-white/10 bg-white/[0.025]">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold sm:text-4xl">Influera — твой штаб для ведения блога</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featureCards.map(({ icon: Icon, title, description }) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-[#091224] p-5">
                  <Icon className="h-7 w-7 text-primary" />
                  <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                  <p className="mt-3 leading-7 text-white/64">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeSection>

        <FadeSection id="preview" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold sm:text-4xl">Как это выглядит</h2>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {previews.map(preview => (
              <div key={preview.title} className="rounded-[1.75rem] border border-white/10 bg-[#071021] p-4 shadow-xl">
                <div className={cn("rounded-[1.25rem] bg-gradient-to-br p-5", preview.accent)}>
                  <div className="mb-8 flex items-center justify-between">
                    <h3 className="text-xl font-semibold">{preview.title}</h3>
                    <FileText className="h-5 w-5 text-white/70" />
                  </div>
                  <div className="space-y-3">
                    {preview.content.map(line => (
                      <div key={line} className="rounded-xl border border-white/10 bg-black/18 px-4 py-3 text-sm text-white/78">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </FadeSection>

        <FadeSection className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold sm:text-4xl">Influera подойдёт, если ты...</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {audienceCards.map(text => (
              <div key={text} className="rounded-2xl border border-white/10 bg-white/[0.045] p-6 text-lg font-semibold leading-8">
                {text}
              </div>
            ))}
          </div>
        </FadeSection>

        <FadeSection className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl rounded-[2rem] border border-primary/30 bg-primary/12 px-6 py-14 text-center shadow-[0_28px_90px_rgba(59,130,246,.16)]">
            <h2 className="text-4xl font-bold">Начни вести блог системно</h2>
            <p className="mt-4 text-lg text-white/72">Бесплатно. Без кредитной карты</p>
            <Button size="lg" className="mt-8 min-h-12 px-7 text-base" asChild>
              <Link href="/register">Зарегистрироваться бесплатно</Link>
            </Button>
          </div>
        </FadeSection>
      </main>

      <footer className="border-t border-white/10 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <AppLogo showWordmark size="xs" />
          <div className="flex flex-wrap gap-4 text-sm text-white/60">
            <Link href="/login" className="hover:text-white">Войти</Link>
            <a href="#" className="hover:text-white">Политика конфиденциальности</a>
          </div>
          <p className="text-sm text-white/45">© 2026 Influera</p>
        </div>
      </footer>
    </div>
  );
}
