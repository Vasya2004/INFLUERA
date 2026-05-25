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

export function getAudienceGoalSummary(platforms: Platform[], goals: Goal[]): Goal {
  const platformSubscriberGoals = goals.filter(goal =>
    !goal.isPrimary && goal.type === "подписчики" && Boolean(goal.platformId),
  );
  const targetByPlatform = new Map<string, number>();

  for (const goal of platformSubscriberGoals) {
    const current = targetByPlatform.get(goal.platformId!) ?? 0;
    targetByPlatform.set(goal.platformId!, Math.max(current, goal.targetValue));
  }

  const goalsTarget = [...targetByPlatform.values()].reduce((sum, value) => sum + value, 0);
  const targetValue = goalsTarget > 0 ? goalsTarget : sumPlatformTargets(platforms);

  return {
    id: "audience-summary",
    title: "Общая аудитория",
    type: "подписчики",
    currentValue: sumPlatformSubscribers(platforms),
    targetValue: targetValue || 10_000,
    deadline: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString(),
  };
}

export function buildDefaultPrimaryGoal(platforms: AppState["platforms"]): Goal {
  const summary = getAudienceGoalSummary(platforms, []);

  return {
    id: "g-primary",
    title: "Общая аудитория",
    type: "подписчики",
    currentValue: summary.currentValue,
    targetValue: summary.targetValue,
    deadline: summary.deadline,
    isPrimary: true,
  };
}

export function buildPlatformSubscriberGoal(platform: Platform): Goal {
  return {
    id: `g-platform-${platform.id}`,
    title: `${platform.name} до ${Math.max(platform.targetSubscribers, 1).toLocaleString("ru-RU")}`,
    type: "подписчики",
    currentValue: platform.subscribers,
    targetValue: Math.max(platform.targetSubscribers, 1),
    deadline: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(),
    platformId: platform.id,
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
  const platformById = new Map(platforms.map(platform => [platform.id, platform]));
  const prunedGoals = goals.filter(goal => {
    if (!goal.id.startsWith("g-platform-") || !goal.platformId) return true;
    const platform = platformById.get(goal.platformId);
    return Boolean(platform && platform.targetSubscribers > 0);
  });

  const syncedGoals = prunedGoals.map(goal => {
    if (goal.type === "подписчики" && goal.platformId) {
      const platform = platformById.get(goal.platformId);
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

  const existingSubscriberGoalPlatformIds = new Set(
    syncedGoals
      .filter(goal => !goal.isPrimary && goal.type === "подписчики" && Boolean(goal.platformId))
      .map(goal => goal.platformId),
  );

  const generatedPlatformGoals = platforms
    .filter(platform => platform.targetSubscribers > 0 && !existingSubscriberGoalPlatformIds.has(platform.id))
    .map(platform => buildPlatformSubscriberGoal(platform));

  const withPlatformGoals = [...syncedGoals, ...generatedPlatformGoals];
  const audienceSummary = getAudienceGoalSummary(platforms, withPlatformGoals);

  return withPlatformGoals.map(goal => {
    if (goal.isPrimary) {
      return {
        ...goal,
        currentValue: audienceSummary.currentValue,
        targetValue: audienceSummary.targetValue > 0 ? audienceSummary.targetValue : goal.targetValue,
      };
    }
    return goal;
  });
}
