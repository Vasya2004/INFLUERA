import type { AppState, Platform } from "./types";
import { buildDefaultPrimaryGoal } from "./primary-goal";
import { sanitizePlatforms } from "./platform-utils";
import { nextSunday } from "./content-plan-utils";
import { createDemoPlatformMetrics } from "./platform-metrics-utils";

function createDemoPlatforms(): Platform[] {
  return sanitizePlatforms([
    { id: "p1", name: "Telegram", username: "@designerthoughts", url: "https://t.me/designerthoughts", subscribers: 1200, targetSubscribers: 5000, role: "основная площадка", weeklyPlan: 5, accentColor: "#0088cc", mirrorPlatformIds: ["p2", "p3"] },
    { id: "p2", name: "Instagram", username: "@ivan.designs", url: "https://instagram.com/ivan.designs", subscribers: 850, targetSubscribers: 3000, role: "дополнительная", weeklyPlan: 3, accentColor: "#E1306C" },
    { id: "p3", name: "YouTube", username: "@ivandesigns", url: "https://youtube.com/@ivandesigns", subscribers: 450, targetSubscribers: 1000, role: "дополнительная", weeklyPlan: 1, accentColor: "#FF0000" },
    { id: "p4", name: "LinkedIn", username: "ivan-ivanov-design", url: "https://linkedin.com/in/ivan-ivanov-design", subscribers: 320, targetSubscribers: 2000, role: "дополнительная", weeklyPlan: 2, accentColor: "#0077B5" },
  ]);
}

/** Пустое рабочее пространство без демо-контента. */
export function createEmptyAppState(): AppState {
  return {
    platforms: [],
    platformMetrics: [],
    goals: [],
    ideas: [],
    publications: [],
    checkpoints: [],
    templates: [],
    references: [],
    profile: {
      name: "",
      niche: "",
      positioning: "",
      description: "",
      targetAudience: "",
      mainTopics: "",
      rubrics: "",
      tone: "",
      expertise: "",
      opportunities: "",
    },
  };
}

/** Демо-набор для нового аккаунта и кнопки «Загрузить демо». */
export function createDemoAppState(): AppState {
  const platforms = createDemoPlatforms();

  return {
    platforms,
    platformMetrics: createDemoPlatformMetrics(platforms),
    goals: [
      buildDefaultPrimaryGoal(platforms),
      { id: "g1", title: "Вырастить Telegram до 5000", type: "подписчики", currentValue: 1200, targetValue: 5000, deadline: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(), platformId: "p1" },
      { id: "g2", title: "Регулярный постинг на YouTube", type: "частота публикаций", currentValue: 1, targetValue: 4, deadline: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(), platformId: "p3" },
      { id: "g3", title: "Instagram до 3000 подписчиков", type: "подписчики", currentValue: 850, targetValue: 3000, deadline: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString(), platformId: "p2" },
      { id: "g4", title: "Привлечение клиентов через блог", type: "другое", currentValue: 0, targetValue: 5, deadline: new Date(new Date().setMonth(new Date().getMonth() + 2)).toISOString() },
    ],
    ideas: [
      { id: "i1", title: "Топ 5 ошибок начинающих дизайнеров", description: "Разобрать самые частые ошибки, которые делают новички при старте", format: "Reels/Shorts/TikTok", priority: "высокий", status: "сценарий", createdAt: new Date().toISOString(), platformId: "p2", tags: ["ux", "ошибки"] },
      { id: "i2", title: "Мой путь из джуна в синьора", description: "Личная история о том, как я прошёл путь от новичка до опытного специалиста", format: "пост", priority: "средний", status: "новая", createdAt: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(), platformId: "p1" },
      { id: "i3", title: "Дизайн-система за 30 минут", description: "Практический гайд по созданию базовой дизайн-системы с нуля", format: "видео", priority: "высокий", status: "новая", createdAt: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), platformId: "p3" },
      { id: "i4", title: "Карусель: UX-законы которые нужно знать", description: "10 базовых законов UX в формате карусели — просто и наглядно", format: "карусель", priority: "средний", status: "монтаж", createdAt: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(), platformId: "p2", tags: ["карусель", "ux"] },
      { id: "i5", title: "Разбор портфолио подписчика", description: "Живой разбор работ — показать типичные ошибки и как их исправить", format: "видео", priority: "низкий", status: "сценарий", createdAt: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString(), platformId: "p3" },
      { id: "i6", title: "Пост о важности типографики", description: "Почему большинство интерфейсов проваливаются из-за текста", format: "пост", priority: "средний", status: "новая", createdAt: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(), platformId: "p1" },
    ],
    publications: [
      { id: "pub1", title: "Анонс нового курса по UX", date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(), platformId: "p1", format: "Telegram-пост", status: "запланировано", note: "Прикрепить ссылку на лендинг" },
      { id: "pub2", title: "Бэкстейдж съёмки выпуска", date: new Date().toISOString(), platformId: "p2", format: "сторис", status: "в работе" },
      { id: "pub3", title: "UX-законы которые нужно знать", date: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString(), platformId: "p2", format: "карусель", status: "готово", ideaId: "i4" },
      { id: "pub4", title: "Дизайн-система за 30 минут", date: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(), platformId: "p3", format: "видео", status: "запланировано", ideaId: "i3" },
      { id: "pub5", title: "Итоги апреля: цифры и выводы", date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(), platformId: "p1", format: "Telegram-пост", status: "опубликовано", url: "https://t.me/designerthoughts/123" },
      { id: "pub6", title: "Про важность пауз в карьере", date: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString(), platformId: "p1", format: "Telegram-пост", status: "запланировано" },
    ],
    checkpoints: [
      { id: "chk1", type: "обновление_подписчиков", date: new Date(new Date().getFullYear(), new Date().getMonth(), 15).toISOString() },
      { id: "chk2", type: "день_съемок", date: nextSunday().toISOString() },
    ],
    templates: [
      { id: "t1", name: "Проблема → решение → вывод", category: "структура публикации", format: ["пост", "Telegram-пост", "Reels/Shorts/TikTok"], description: "Классическая экспертная структура для обучающего контента", usage: "Идеально для ответов на частые вопросы аудитории и образовательных постов", content: "1. Озвучиваем боль / проблему\n2. Объясняем почему это происходит\n3. Предлагаем решение (шаги 1-2-3)\n4. Вывод и призыв к действию" },
      { id: "t2", name: "Миф → правда → пример", category: "сценарий", format: ["Reels/Shorts/TikTok", "видео"], description: "Разрушение стереотипов в нише через экспертную позицию", usage: "Когда нужно показать свою экспертность через нестандартный взгляд", content: "1. Миф: «Все думают, что...»\n2. Правда: «На самом деле...»\n3. Пример: «Вот как это работает...»\n4. Мораль / вывод" },
      { id: "t3", name: "Личный опыт → ошибка → урок", category: "сценарий", format: ["пост", "Telegram-пост"], description: "Storytelling через личный опыт с извлечением урока", usage: "Для постов о личном росте, карьере, профессиональных инсайтах", content: "1. Контекст: где я был тогда\n2. Что я сделал (ошибка или решение)\n3. Что произошло в итоге\n4. Чему это меня научило\n5. Как это поможет тебе" },
      { id: "t4", name: "Список из 5 пунктов", category: "структура публикации", format: ["пост", "карусель", "Telegram-пост"], description: "Структурированный список с ценностью в каждом пункте", usage: "Когда нужно дать практическую пользу компактно и наглядно", content: "Заголовок: «5 [вещей/способов/ошибок]...»\n1. Пункт + краткое объяснение\n2. Пункт + краткое объяснение\n3. Пункт + краткое объяснение\n4. Пункт + краткое объяснение\n5. Пункт + краткое объяснение\nВывод / призыв" },
      { id: "t5", name: "Talking head", category: "съёмка", format: ["Reels/Shorts/TikTok", "видео"], description: "Говорящая голова — прямое обращение к камере", usage: "Для экспертных разборов, мнений, быстрых советов в прямом эфире", content: "Съёмка: камера на уровне глаз\nФон: чистый или релевантный рабочий\nОсвещение: мягкий источник спереди-сбоку\nЗвук: петличка или качественный микрофон\nДлина: 30–90 секунд\nХук в первые 3 секунды" },
      { id: "t6", name: "Видео за ноутбуком", category: "съёмка", format: ["Reels/Shorts/TikTok", "видео"], description: "Рабочий процесс на экране — показываю как делаю", usage: "Для туториалов, разборов кейсов, демонстрации инструментов", content: "Съёмка: камера сбоку или сверху на рабочий стол\nЗапись экрана: Loom / OBS / QuickTime\nГолос: озвучка поверх скринкаста\nМонтаж: вырезать паузы, ускорить рутинные части\nТемп: динамично, без затянутых моментов" },
      { id: "t7", name: "Хук — вопрос к аудитории", category: "хук", format: ["Reels/Shorts/TikTok", "пост", "карусель"], description: "Начало с вопроса, который задевает аудиторию", usage: "Для постов с высоким вовлечением и комментариями", content: "«А ты знаешь, почему [проблема]?»\n«Сколько раз ты [делал ошибку]?»\n«Ты уже [пробовал это]?»\n\nПравило: вопрос должен касаться боли или любопытства аудитории" },
      { id: "t8", name: "Хук — смелое утверждение", category: "хук", format: ["Reels/Shorts/TikTok", "пост", "Telegram-пост"], description: "Начало с провокационного или неожиданного тезиса", usage: "Для постов, которые хочется остановиться и прочитать до конца", content: "«[X] — это полная ерунда. Вот почему.»\n«Я перестал [делать привычное] — и не жалею»\n«Большинство [экспертов/блогеров] ошибаются в этом»\n\nПравило: утверждение должно удивлять, но быть обоснованным" },
    ],
    references: [
      {
        id: "ref1",
        name: "Антон Лапенко",
        handle: "@lapenko",
        platform: "Instagram",
        url: "https://instagram.com/lapenko",
        type: "блогер",
        niche: "юмор и персонажи",
        contentFocus: "Серийность, узнаваемые герои, короткие сценки",
        whyRelevant: "Хороший пример цельного авторского мира и повторяемых форматов.",
        notes: "Посмотреть, как строятся рубрики и визуальные повторения.",
        tags: ["персонажи", "сериализация", "юмор"],
        rating: 5,
        favorite: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: "ref2",
        name: "Редакция Reminder",
        handle: "@reminder_media",
        platform: "Telegram",
        url: "https://t.me/reminder_media",
        type: "эксперт",
        niche: "здоровье и продуктивность",
        contentFocus: "Экспертные разборы, подборки исследований, спокойный тон",
        whyRelevant: "Можно ориентироваться на структуру длинных полезных постов.",
        notes: "Разобрать вступления и формулы заголовков.",
        tags: ["экспертность", "лонгрид", "структура"],
        rating: 4,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
      },
      {
        id: "ref3",
        name: "Notion",
        handle: "@notionhq",
        platform: "YouTube",
        url: "https://youtube.com/@Notion",
        type: "бренд",
        niche: "продуктивность и софт",
        contentFocus: "Кейсы пользователей, туториалы, продуктовые сценарии",
        whyRelevant: "Хороший ориентир для понятной демонстрации продукта без перегруза.",
        notes: "Посмотреть, как показывают интерфейс через реальные задачи.",
        tags: ["продукт", "туториалы", "кейсы"],
        rating: 4,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 8)).toISOString(),
      },
    ],
    profile: {
      name: "Иван Иванов",
      niche: "Дизайн интерфейсов",
      positioning: "Делаю сложный софт понятным для людей",
      description: "Блог о продуктовом дизайне, UX-исследованиях и карьере в IT. Пишу честно, без воды — делюсь реальным опытом из проектов.",
      targetAudience: "Начинающие и middle дизайнеры, продакт-менеджеры, разработчики которые хотят понять дизайн",
      mainTopics: "UX паттерны, разбор кейсов, карьера в дизайне, дизайн-системы, инструменты",
      rubrics: "#ux_разбор, #карьера, #инструменты, #кейсы, #мысли_вслух",
      tone: "Дружелюбный и профессиональный — как разговор с умным коллегой, без снобизма",
      expertise: "Проектирование сложных B2B систем, дизайн-системы, UX-исследования, работа с командами",
      opportunities: "Консалтинг и менторство, нетворкинг с потенциальными клиентами, личный бренд для фриланса",
    },
  };
}

/** @deprecated Используйте createDemoAppState */
export const createInitialState = createDemoAppState;
