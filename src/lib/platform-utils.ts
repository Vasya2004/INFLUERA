import type { Platform, PlatformRole } from "./types";

export const PLATFORM_ROLES: PlatformRole[] = ["основная площадка", "дополнительная"];

export const ROLE_LABELS: Record<PlatformRole, string> = {
  "основная площадка": "Основная",
  "дополнительная": "Дополнительная",
};

export function isMainPlatform(platform: Pick<Platform, "role">) {
  return platform.role === "основная площадка";
}

export function migratePlatformRole(role: string): PlatformRole {
  return role === "основная площадка" ? "основная площадка" : "дополнительная";
}

/** Нормализует роли и чистит списки дублей (одна доп. площадка может быть у нескольких основных) */
export function sanitizePlatforms(platforms: Platform[]): Platform[] {
  const next = platforms.map(p => ({
    ...p,
    role: migratePlatformRole(p.role),
    mirrorPlatformIds: isMainPlatform({ role: migratePlatformRole(p.role) })
      ? [...(p.mirrorPlatformIds ?? [])]
      : undefined,
  }));

  return next.map(p => {
    if (!isMainPlatform(p)) {
      return { ...p, mirrorPlatformIds: undefined };
    }

    const mirrorPlatformIds = [...new Set((p.mirrorPlatformIds ?? []).filter(id => {
      if (id === p.id) return false;
      const target = next.find(x => x.id === id);
      return target?.role === "дополнительная";
    }))];

    return {
      ...p,
      mirrorPlatformIds: mirrorPlatformIds.length > 0 ? mirrorPlatformIds : undefined,
    };
  });
}

export function getMirrorPlatforms(platforms: Platform[], main: Platform) {
  return (main.mirrorPlatformIds ?? [])
    .map(id => platforms.find(p => p.id === id))
    .filter((p): p is Platform => Boolean(p));
}

export function getAvailableMirrorCandidates(platforms: Platform[], mainId?: string) {
  return platforms.filter(p => p.id !== mainId && p.role === "дополнительная");
}
