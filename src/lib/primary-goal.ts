import type { AppState, Goal, Platform } from "./types";

export function sumPlatformSubscribers(platforms: AppState["platforms"]) {
  return platforms.reduce((acc, p) => acc + p.subscribers, 0);
}

export function sumPlatformTargets(platforms: AppState["platforms"]) {
  return platforms.reduce((acc, p) => acc + p.targetSubscribers, 0);
}

export function getPrimaryGoal(goals: Goal[]): Goal | undefined {
  return goals.find(g => g.isPrimary);
}

export function buildDefaultPrimaryGoal(platforms: AppState["platforms"]): Goal {
  const currentValue = sumPlatformSubscribers(platforms);
  const targetValue = sumPlatformTargets(platforms) || 10_000;

  return {
    id: "g-primary",
    title: "Общая аудитория",
    type: "подписчики",
    currentValue,
    targetValue,
    deadline: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString(),
    isPrimary: true,
  };
}

export function ensurePrimaryGoal(data: AppState): AppState {
  const goals = data.goals.map(g => ({ ...g, isPrimary: Boolean(g.isPrimary) }));
  const primary = goals.find(g => g.isPrimary);

  if (primary) {
    return {
      ...data,
      goals: [
        primary,
        ...goals.filter(g => g.id !== primary.id).map(g => ({ ...g, isPrimary: false })),
      ],
    };
  }

  const defaultPrimary = buildDefaultPrimaryGoal(data.platforms);
  const hasDefaultId = goals.some(g => g.id === defaultPrimary.id);

  return {
    ...data,
    goals: [
      defaultPrimary,
      ...goals.map(g => ({ ...g, isPrimary: false, id: g.id === defaultPrimary.id && hasDefaultId ? `g-${g.id}` : g.id })),
    ],
  };
}

export function goalProgress(goal: Goal) {
  return goal.targetValue > 0 ? Math.min((goal.currentValue / goal.targetValue) * 100, 100) : 0;
}

export function goalRemaining(goal: Goal) {
  return Math.max(goal.targetValue - goal.currentValue, 0);
}

/** Цель берёт текущее и целевое значение из метрик площадок */
export function isSubscriberGoalSynced(goal: Pick<Goal, "type" | "platformId" | "isPrimary">) {
  return Boolean(goal.isPrimary) || (goal.type === "подписчики" && Boolean(goal.platformId));
}

/** Распределяет новую сумму подписчиков по площадкам пропорционально текущим долям */
export function distributeAudienceTotal(platforms: Platform[], newTotal: number): Platform[] {
  if (platforms.length === 0) return platforms;

  const total = Math.max(0, Math.round(newTotal));
  const oldTotal = sumPlatformSubscribers(platforms);

  if (oldTotal <= 0) {
    return platforms.map((p, i) => ({ ...p, subscribers: i === 0 ? total : 0 }));
  }

  let assigned = 0;
  return platforms.map((p, i) => {
    if (i === platforms.length - 1) {
      return { ...p, subscribers: Math.max(0, total - assigned) };
    }
    const share = Math.round((p.subscribers / oldTotal) * total);
    assigned += share;
    return { ...p, subscribers: share };
  });
}

export function syncAudienceGoals(platforms: Platform[], goals: Goal[]): Goal[] {
  const totalSubscribers = sumPlatformSubscribers(platforms);
  const totalTarget = sumPlatformTargets(platforms);

  return goals.map(goal => {
    if (goal.isPrimary) {
      return {
        ...goal,
        currentValue: totalSubscribers,
        targetValue: totalTarget > 0 ? totalTarget : goal.targetValue,
      };
    }
    if (goal.type === "подписчики" && goal.platformId) {
      const platform = platforms.find(p => p.id === goal.platformId);
      if (platform) {
        return {
          ...goal,
          currentValue: platform.subscribers,
          targetValue: platform.targetSubscribers > 0 ? platform.targetSubscribers : goal.targetValue,
        };
      }
    }
    return goal;
  });
}
