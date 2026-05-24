import type { TemplateCategory } from "./types";

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  "сценарий",
  "съёмка",
  "хук",
  "структура публикации",
  "лид магнит",
  "доп материалы",
];

export const TEMPLATE_CATEGORY_COLORS: Record<TemplateCategory, string> = {
  "сценарий": "bg-violet-500/10 text-violet-700 border-violet-500/20 dark:text-violet-300",
  "съёмка": "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-300",
  "хук": "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300",
  "структура публикации": "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300",
  "лид магнит": "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-300",
  "доп материалы": "bg-slate-500/10 text-slate-700 border-slate-500/20 dark:text-slate-300",
};

const CATEGORY_MIGRATION: Record<string, TemplateCategory> = {
  "шаблоны сценариев": "сценарий",
  "шаблоны съёмки": "съёмка",
  "шаблоны хуков": "хук",
  "шаблоны структуры публикации": "структура публикации",
  "сценарий": "сценарий",
  "съёмка": "съёмка",
  "хук": "хук",
  "структура публикации": "структура публикации",
  "лид магнит": "лид магнит",
  "лид-магнит": "лид магнит",
  "доп материалы": "доп материалы",
  "доп. материалы": "доп материалы",
};

export function migrateTemplateCategory(category: string): TemplateCategory {
  return CATEGORY_MIGRATION[category] ?? "структура публикации";
}
