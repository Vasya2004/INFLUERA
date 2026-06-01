import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { AppState, Platform, PlatformMetric, Goal, Idea, Publication, Checkpoint, Template, Profile, CreatorReference } from "./types";
import { useAuth } from "./auth-context";
import { isSupabaseConfigured } from "./supabase";
import { loadNormalizedWorkspace, loadWorkspace, saveWorkspace } from "./workspace-api";
import { createCloudSync } from "./sync/cloud-sync";
import { useWorkspaceCache } from "./queries/use-workspace-query";
import {
  getWorkspaceMigrationStatus,
  migrateLegacyWorkspaceToNormalized,
  type WorkspaceMigrationStatus,
} from "./workspace-migration";
import { parseAppState } from "./app-state-schema";
import { migrateTemplateCategory } from "./template-utils";
import { ensurePublicationChecklist, migrateContentFormat, migratePublicationStatus } from "./content-plan-utils";
import { distributeAudienceTotal, ensurePrimaryGoal, syncAudienceGoals } from "./primary-goal";
import { migratePlatformRole, sanitizePlatforms } from "./platform-utils";
import { createDemoAppState } from "./demo-seed";
import { withTimeout } from "./async-utils";
import { applyDemoWorkspaceSeed, isDemoSeedApplied, recordDemoSeedApplied } from "./workspace-seed";
import { workspaceHasMeaningfulData } from "./workspace-migration";
import { metricIdFor, syncPlatformSubscribersFromMetrics } from "./platform-metrics-utils";

export { createInitialState, createDemoAppState } from "./demo-seed";

export const STORE_KEY = "influera_data_v2";
const PROFILE_ASSETS_KEY = "influera_profile_assets_v1";

function readProfileAssets(): Pick<Profile, "avatarUrl" | "avatarStoragePath" | "coverUrl" | "coverStoragePath"> {
  try {
    const raw = localStorage.getItem(PROFILE_ASSETS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Pick<Profile, "avatarUrl" | "avatarStoragePath" | "coverUrl" | "coverStoragePath">;
    return {
      avatarUrl: typeof parsed.avatarUrl === "string" ? parsed.avatarUrl : undefined,
      avatarStoragePath: typeof parsed.avatarStoragePath === "string" ? parsed.avatarStoragePath : undefined,
      coverUrl: typeof parsed.coverUrl === "string" ? parsed.coverUrl : undefined,
      coverStoragePath: typeof parsed.coverStoragePath === "string" ? parsed.coverStoragePath : undefined,
    };
  } catch {
    return {};
  }
}

function writeProfileAssets(profile: Profile) {
  const assets = {
    avatarUrl: profile.avatarUrl,
    avatarStoragePath: profile.avatarStoragePath,
    coverUrl: profile.coverUrl,
    coverStoragePath: profile.coverStoragePath,
  };
  if (Object.values(assets).some(Boolean)) {
    localStorage.setItem(PROFILE_ASSETS_KEY, JSON.stringify(assets));
  } else {
    localStorage.removeItem(PROFILE_ASSETS_KEY);
  }
}

function withLocalProfileAssets(state: AppState): AppState {
  const assets = readProfileAssets();
  if (!Object.values(assets).some(Boolean)) return state;
  return {
    ...state,
    profile: {
      ...state.profile,
      avatarUrl: state.profile.avatarUrl || assets.avatarUrl,
      avatarStoragePath: state.profile.avatarStoragePath || assets.avatarStoragePath,
      coverUrl: state.profile.coverUrl || assets.coverUrl,
      coverStoragePath: state.profile.coverStoragePath || assets.coverStoragePath,
    },
  };
}

export function normalizeState(data: AppState): AppState {
  const withTemplates = {
    ...data,
    platforms: sanitizePlatforms(data.platforms.map(p => ({
      ...p,
      role: migratePlatformRole(p.role),
    }))),
    platformMetrics: data.platformMetrics ?? [],
    publications: (data.publications ?? []).map(p => ensurePublicationChecklist({
      ...p,
      status: migratePublicationStatus(p.status),
      format: migrateContentFormat(p.format),
    })),
    ideas: (data.ideas ?? []).map(i => ({
      ...i,
      format: migrateContentFormat(i.format),
    })),
    checkpoints: data.checkpoints ?? [],
    references: data.references ?? [],
    templates: data.templates.map((template) => ({
      ...template,
      category: migrateTemplateCategory(template.category),
      format: (template.format ?? []).map(f => migrateContentFormat(f)),
      files: template.files ?? [],
    })),
  };

  const withPrimary = ensurePrimaryGoal(withTemplates);
  return {
    ...withPrimary,
    goals: syncAudienceGoals(withPrimary.platforms, withPrimary.goals),
  };
}

export type SyncStatus = "idle" | "saving" | "saved" | "error";

type StoreContextType = {
  state: AppState;
  ready: boolean;
  syncStatus: SyncStatus;
  migrationStatus: WorkspaceMigrationStatus | null;
  runLegacyMigration: () => Promise<void>;
  completeOnboarding: (nextState: AppState) => Promise<void>;
  addPlatform: (p: Omit<Platform, "id">) => void;
  updatePlatform: (p: Platform) => void;
  updatePlatformSubscribers: (id: string, subscribers: number) => void;
  upsertPlatformMetric: (metric: PlatformMetric) => void;
  removePlatformMetric: (metricId: string) => void;
  setAudienceTotal: (total: number) => void;
  setAudienceTarget: (target: number) => void;
  deletePlatform: (id: string) => void;
  addGoal: (g: Omit<Goal, "id">) => void;
  updateGoal: (g: Goal) => void;
  deleteGoal: (id: string) => void;
  addIdea: (i: Omit<Idea, "id" | "createdAt">) => void;
  updateIdea: (i: Idea) => void;
  deleteIdea: (id: string) => void;
  addPublication: (p: Omit<Publication, "id">) => void;
  updatePublication: (p: Publication) => void;
  deletePublication: (id: string) => void;
  addCheckpoint: (c: Omit<Checkpoint, "id">) => void;
  updateCheckpoint: (c: Checkpoint) => void;
  deleteCheckpoint: (id: string) => void;
  addTemplate: (t: Omit<Template, "id">) => void;
  updateTemplate: (t: Template) => void;
  deleteTemplate: (id: string) => void;
  addReference: (r: Omit<CreatorReference, "id" | "createdAt">) => void;
  updateReference: (r: CreatorReference) => void;
  deleteReference: (id: string) => void;
  updateProfile: (p: Profile) => void;
  exportData: () => void;
  resetData: () => Promise<void>;
  applyDemoSeed: (force?: boolean) => Promise<void>;
  demoSeedApplied: boolean;
};

const StoreContext = createContext<StoreContextType | null>(null);
const RESUME_REFRESH_INTERVAL_MS = 15_000;

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

function withSyncedPlatforms(s: AppState, platforms: Platform[]): AppState {
  const sanitized = sanitizePlatforms(platforms);
  return {
    ...s,
    platforms: sanitized,
    goals: syncAudienceGoals(sanitized, s.goals),
  };
}

function withSyncedGoals(s: AppState, goals: Goal[]): AppState {
  return { ...s, goals: syncAudienceGoals(s.platforms, goals) };
}

function readLocalState(): AppState | null {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (!saved) return null;
    const parsed = parseAppState(JSON.parse(saved));
    return parsed ? withLocalProfileAssets(normalizeState(parsed)) : null;
  } catch {}
  return null;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user, configured } = useAuth();
  const cloudEnabled = configured && isSupabaseConfigured();
  const [ready, setReady] = useState(!cloudEnabled);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [migrationStatus, setMigrationStatus] = useState<WorkspaceMigrationStatus | null>(null);
  const [demoSeedApplied, setDemoSeedApplied] = useState(false);
  const [state, setState] = useState<AppState>(() => readLocalState() ?? createDemoAppState());
  const hydratedUserRef = useRef<string | null>(null);
  const cloudSyncRef = useRef<ReturnType<typeof createCloudSync> | null>(null);
  const lastResumeRefreshRef = useRef(0);
  const resumeRefreshInFlightRef = useRef(false);
  const syncStatusRef = useRef<SyncStatus>("idle");
  const workspaceCache = useWorkspaceCache(user?.id);

  useEffect(() => {
    syncStatusRef.current = syncStatus;
  }, [syncStatus]);

  useEffect(() => {
    cloudSyncRef.current = cloudEnabled && user ? createCloudSync(user.id) : null;
  }, [cloudEnabled, user]);

  const persist = (task: () => Promise<void>) => {
    if (!cloudSyncRef.current) return;
    setSyncStatus("saving");
    task()
      .then(() => setSyncStatus("saved"))
      .catch(() => setSyncStatus("error"));
  };

  const applyUpdate = (
    updater: (current: AppState) => AppState,
    task?: (next: AppState, prev: AppState) => (() => Promise<void>) | undefined,
  ) => {
    setState(current => {
      const next = updater(current);
      localStorage.setItem(STORE_KEY, JSON.stringify(next));
      workspaceCache.setWorkspace(next);
      const syncTask = task?.(next, current);
      if (syncTask && cloudSyncRef.current) persist(syncTask);
      return next;
    });
  };

  useEffect(() => {
    if (!cloudEnabled) {
      setReady(true);
      hydratedUserRef.current = null;
      return;
    }

    if (!user) {
      setReady(false);
      hydratedUserRef.current = null;
      return;
    }

    if (hydratedUserRef.current === user.id) return;

    let cancelled = false;
    setReady(false);

    (async () => {
      const HYDRATE_TIMEOUT_MS = 25_000;

      try {
        const remote = await withTimeout(
          loadWorkspace(user.id),
          HYDRATE_TIMEOUT_MS,
          "Не удалось загрузить данные из Supabase",
        );

        let nextState: AppState;
        if (remote) {
          nextState = withLocalProfileAssets(normalizeState(remote));
        } else {
          const local = readLocalState();
          const normalizedLocal = local ? normalizeState(local) : null;
          nextState = normalizedLocal && workspaceHasMeaningfulData(normalizedLocal)
            ? normalizedLocal
            : normalizeState(createDemoAppState());
        }

        if (cancelled) return;

        setState(nextState);
        workspaceCache.setWorkspace(nextState);
        hydratedUserRef.current = user.id;
        localStorage.setItem(STORE_KEY, JSON.stringify(nextState));
        setSyncStatus("saving");

        const shouldMarkDemoSeed = !remote && nextState.platforms.length > 0;

        void (async () => {
          try {
            await withTimeout(
              saveWorkspace(user.id, nextState),
              HYDRATE_TIMEOUT_MS,
              "Не удалось сохранить данные в Supabase",
            );
            if (shouldMarkDemoSeed) {
              await recordDemoSeedApplied(user.id);
            }
            if (cancelled) return;
            setSyncStatus("saved");
            setDemoSeedApplied(await isDemoSeedApplied(user.id));
            setMigrationStatus(await getWorkspaceMigrationStatus(user.id));
          } catch {
            if (!cancelled) setSyncStatus("error");
          }
        })();
      } catch {
        if (!cancelled) {
          const fallback = normalizeState(readLocalState() ?? createDemoAppState());
          setState(fallback);
          localStorage.setItem(STORE_KEY, JSON.stringify(fallback));
          hydratedUserRef.current = user.id;
          setSyncStatus("error");
        }
      } finally {
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cloudEnabled, user]);

  useEffect(() => {
    if (!cloudEnabled || !user || !ready) return;

    let cancelled = false;

    const refreshWorkspace = async (force = false) => {
      if (cancelled) return;
      if (document.visibilityState !== "visible") return;
      if (resumeRefreshInFlightRef.current) return;
      if (syncStatusRef.current === "saving") return;

      const now = Date.now();
      if (!force && now - lastResumeRefreshRef.current < RESUME_REFRESH_INTERVAL_MS) return;

      resumeRefreshInFlightRef.current = true;
      lastResumeRefreshRef.current = now;

      try {
        const remote = await loadWorkspace(user.id);
        if (!remote || cancelled || (syncStatusRef.current as SyncStatus) === "saving") return;

        const normalized = withLocalProfileAssets(normalizeState(remote));
        setState(normalized);
        workspaceCache.setWorkspace(normalized);
        localStorage.setItem(STORE_KEY, JSON.stringify(normalized));
        setSyncStatus("saved");
      } catch {
        // Keep the local snapshot when refresh fails.
      } finally {
        resumeRefreshInFlightRef.current = false;
      }
    };

    const handleResume = () => void refreshWorkspace();
    const handleOnline = () => void refreshWorkspace(true);

    document.addEventListener("visibilitychange", handleResume);
    window.addEventListener("focus", handleResume);
    window.addEventListener("pageshow", handleResume);
    window.addEventListener("online", handleOnline);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleResume);
      window.removeEventListener("focus", handleResume);
      window.removeEventListener("pageshow", handleResume);
      window.removeEventListener("online", handleOnline);
    };
  }, [cloudEnabled, ready, user?.id, workspaceCache]);

  const addPlatform = (p: Omit<Platform, "id">) => {
    const platform = { ...p, id: genId() };
    applyUpdate(
      s => withSyncedPlatforms(s, [...s.platforms, platform]),
      () => () => cloudSyncRef.current!.savePlatform(platform),
    );
  };

  const updatePlatform = (p: Platform) =>
    applyUpdate(
      s => withSyncedPlatforms(s, s.platforms.map(x => x.id === p.id ? p : x)),
      () => () => cloudSyncRef.current!.savePlatform(p),
    );

  const updatePlatformSubscribers = (id: string, subscribers: number) => {
    const nextSubscribers = Math.max(0, Math.round(subscribers));
    const today = new Date().toISOString().slice(0, 10);
    const metricId = `m-${id}-${today}`;
    const metric = {
      id: metricId,
      platformId: id,
      date: new Date().toISOString(),
      subscribers: nextSubscribers,
    };

    applyUpdate(
      s => withSyncedPlatforms(
        {
          ...s,
          platformMetrics: [
            ...(s.platformMetrics ?? []).filter(item => item.id !== metricId),
            metric,
          ],
        },
        s.platforms.map(p => p.id === id ? { ...p, subscribers: nextSubscribers } : p),
      ),
      next => () => {
        const platform = next.platforms.find(item => item.id === id);
        if (!platform) return Promise.resolve();
        return cloudSyncRef.current!.savePlatform(platform).then(() =>
          cloudSyncRef.current!.savePlatformMetric(metric),
        );
      },
    );
  };

  const upsertPlatformMetric = (metric: PlatformMetric) => {
    const normalizedMetric: PlatformMetric = {
      ...metric,
      id: metric.id || metricIdFor(metric.platformId, metric.date),
      subscribers: Math.max(0, Math.round(metric.subscribers)),
    };

    applyUpdate(
      s => {
        const nextMetrics = [
          ...(s.platformMetrics ?? []).filter(item => item.id !== normalizedMetric.id),
          normalizedMetric,
        ];
        return withSyncedPlatforms(
          { ...s, platformMetrics: nextMetrics },
          syncPlatformSubscribersFromMetrics(s.platforms, nextMetrics),
        );
      },
      next => () => {
        const platform = next.platforms.find(item => item.id === normalizedMetric.platformId);
        if (!platform) return Promise.resolve();
        return cloudSyncRef.current!.savePlatform(platform).then(() =>
          cloudSyncRef.current!.savePlatformMetric(normalizedMetric),
        );
      },
    );
  };

  const removePlatformMetric = (metricId: string) => {
    applyUpdate(
      s => {
        const nextMetrics = (s.platformMetrics ?? []).filter(item => item.id !== metricId);
        return withSyncedPlatforms(
          { ...s, platformMetrics: nextMetrics },
          syncPlatformSubscribersFromMetrics(s.platforms, nextMetrics),
        );
      },
      (next, prev) => {
        const removed = (prev.platformMetrics ?? []).find(item => item.id === metricId);
        if (!removed) return undefined;
        const platform = next.platforms.find(item => item.id === removed.platformId);
        return () => {
          if (!platform) {
            return cloudSyncRef.current!.removePlatformMetric(metricId);
          }
          return cloudSyncRef.current!.savePlatform(platform).then(() =>
            cloudSyncRef.current!.removePlatformMetric(metricId),
          );
        };
      },
    );
  };

  const setAudienceTotal = (total: number) =>
    applyUpdate(
      s => withSyncedPlatforms(s, distributeAudienceTotal(s.platforms, total)),
      next => () => cloudSyncRef.current!.savePlatforms(next.platforms),
    );

  const setAudienceTarget = (target: number) =>
    applyUpdate(
      s => {
        const primary = s.goals.find(goal => goal.isPrimary);
        if (!primary) return s;
        const nextGoal = { ...primary, targetValue: Math.max(1, Math.round(target)) };
        return {
          ...s,
          goals: s.goals.map(goal => goal.id === primary.id ? nextGoal : goal),
        };
      },
      next => {
        const primary = next.goals.find(goal => goal.isPrimary);
        return primary ? () => cloudSyncRef.current!.saveGoal(primary) : undefined;
      },
    );

  const deletePlatform = (id: string) =>
    applyUpdate(
      s => withSyncedPlatforms(
        { ...s, platformMetrics: (s.platformMetrics ?? []).filter(metric => metric.platformId !== id) },
        s.platforms.filter(x => x.id !== id),
      ),
      () => () => cloudSyncRef.current!.removeMetricsForPlatform(id).then(() =>
        cloudSyncRef.current!.removePlatform(id),
      ),
    );

  const addGoal = (g: Omit<Goal, "id">) => {
    const goal = { ...g, id: genId() };
    applyUpdate(
      s => withSyncedGoals(s, [...s.goals, goal]),
      () => () => cloudSyncRef.current!.saveGoal(goal),
    );
  };

  const updateGoal = (g: Goal) =>
    applyUpdate(s => {
      const next = s.goals.map(x => {
        if (x.id === g.id) return g;
        if (g.isPrimary) return { ...x, isPrimary: false };
        return x;
      });
      const goals = g.isPrimary ? [g, ...next.filter(x => x.id !== g.id)] : next;
      return withSyncedGoals(s, goals);
    }, next => () => cloudSyncRef.current!.saveGoals(next.goals));

  const deleteGoal = (id: string) =>
    applyUpdate(s => {
      const goal = s.goals.find(x => x.id === id);
      if (goal?.isPrimary) return s;
      return { ...s, goals: s.goals.filter(x => x.id !== id) };
    }, (next, prev) =>
      next.goals.length < prev.goals.length
        ? () => cloudSyncRef.current!.removeGoal(id)
        : undefined,
    );

  const addIdea = (i: Omit<Idea, "id" | "createdAt">) => {
    const idea = { ...i, id: genId(), createdAt: new Date().toISOString() };
    applyUpdate(
      s => ({ ...s, ideas: [idea, ...s.ideas] }),
      () => () => cloudSyncRef.current!.saveIdea(idea),
    );
  };

  const updateIdea = (i: Idea) =>
    applyUpdate(
      s => ({ ...s, ideas: s.ideas.map(x => x.id === i.id ? i : x) }),
      () => () => cloudSyncRef.current!.saveIdea(i),
    );

  const deleteIdea = (id: string) =>
    applyUpdate(
      s => ({ ...s, ideas: s.ideas.filter(x => x.id !== id) }),
      () => () => cloudSyncRef.current!.removeIdea(id),
    );

  const addPublication = (p: Omit<Publication, "id">) => {
    const publication = { ...p, id: genId() };
    applyUpdate(
      s => ({ ...s, publications: [...s.publications, publication] }),
      () => () => cloudSyncRef.current!.savePublication(publication),
    );
  };

  const updatePublication = (p: Publication) =>
    applyUpdate(
      s => ({ ...s, publications: s.publications.map(x => x.id === p.id ? p : x) }),
      () => () => cloudSyncRef.current!.savePublication(p),
    );

  const deletePublication = (id: string) =>
    applyUpdate(
      s => ({ ...s, publications: s.publications.filter(x => x.id !== id) }),
      () => () => cloudSyncRef.current!.removePublication(id),
    );

  const addCheckpoint = (c: Omit<Checkpoint, "id">) => {
    const checkpoint = { ...c, id: genId() };
    applyUpdate(
      s => ({ ...s, checkpoints: [...(s.checkpoints ?? []), checkpoint] }),
      () => () => cloudSyncRef.current!.saveCheckpoint(checkpoint),
    );
  };

  const updateCheckpoint = (c: Checkpoint) =>
    applyUpdate(
      s => ({ ...s, checkpoints: (s.checkpoints ?? []).map(x => x.id === c.id ? c : x) }),
      () => () => cloudSyncRef.current!.saveCheckpoint(c),
    );

  const deleteCheckpoint = (id: string) =>
    applyUpdate(
      s => ({ ...s, checkpoints: (s.checkpoints ?? []).filter(x => x.id !== id) }),
      () => () => cloudSyncRef.current!.removeCheckpoint(id),
    );

  const addTemplate = (t: Omit<Template, "id">) => {
    const template = { ...t, id: genId(), files: t.files ?? [] };
    applyUpdate(
      s => ({ ...s, templates: [...s.templates, template] }),
      () => () => cloudSyncRef.current!.saveTemplate(template),
    );
  };

  const updateTemplate = (t: Template) =>
    applyUpdate(
      s => ({ ...s, templates: s.templates.map(x => x.id === t.id ? { ...t, files: t.files ?? [] } : x) }),
      () => () => cloudSyncRef.current!.saveTemplate({ ...t, files: t.files ?? [] }),
    );

  const deleteTemplate = (id: string) =>
    applyUpdate(
      s => ({ ...s, templates: s.templates.filter(x => x.id !== id) }),
      () => () => cloudSyncRef.current!.removeTemplate(id),
    );

  const addReference = (r: Omit<CreatorReference, "id" | "createdAt">) => {
    const reference = { ...r, id: genId(), createdAt: new Date().toISOString() };
    applyUpdate(
      s => ({ ...s, references: [reference, ...(s.references ?? [])] }),
      () => () => cloudSyncRef.current!.saveReference(reference),
    );
  };

  const updateReference = (r: CreatorReference) =>
    applyUpdate(
      s => ({ ...s, references: (s.references ?? []).map(x => x.id === r.id ? r : x) }),
      () => () => cloudSyncRef.current!.saveReference(r),
    );

  const deleteReference = (id: string) =>
    applyUpdate(
      s => ({ ...s, references: (s.references ?? []).filter(x => x.id !== id) }),
      () => () => cloudSyncRef.current!.removeReference(id),
    );

  const updateProfile = (p: Profile) =>
    {
      writeProfileAssets(p);
      applyUpdate(
        s => ({ ...s, profile: p }),
        () => () => cloudSyncRef.current!.saveProfile(p),
      );
    };

  const exportData = () => {
    void (async () => {
      let payload = state;
      if (cloudEnabled && user) {
        try {
          const remote = await loadNormalizedWorkspace(user.id);
          if (remote) payload = normalizeState(remote);
        } catch {
          // Export local snapshot when cloud read fails.
        }
      }

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `influera-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    })();
  };

  const runLegacyMigration = async () => {
    if (!cloudEnabled || !user) return;
    setSyncStatus("saving");
    try {
      const migrated = await migrateLegacyWorkspaceToNormalized(user.id);
      const normalized = normalizeState(migrated);
      setState(normalized);
      workspaceCache.setWorkspace(normalized);
      localStorage.setItem(STORE_KEY, JSON.stringify(normalized));
      setMigrationStatus(await getWorkspaceMigrationStatus(user.id));
      setSyncStatus("saved");
    } catch (error) {
      setSyncStatus("error");
      const message = error instanceof Error ? error.message : "Не удалось выполнить миграцию";
      setMigrationStatus({ state: "failed", message });
      throw error;
    }
  };

  const completeOnboarding = async (nextState: AppState) => {
    const normalized = normalizeState(nextState);
    setSyncStatus("saving");
    try {
      if (cloudEnabled && user) {
        await saveWorkspace(user.id, normalized);
      }
      setState(normalized);
      workspaceCache.setWorkspace(normalized);
      localStorage.setItem(STORE_KEY, JSON.stringify(normalized));
      setSyncStatus("saved");
    } catch (error) {
      setSyncStatus("error");
      throw error;
    }
  };

  const applyDemoSeed = async (force = false) => {
    if (!cloudEnabled || !user) return;
    setSyncStatus("saving");
    try {
      const result = await applyDemoWorkspaceSeed(user.id, { force });
      if (result.status !== "seeded") {
        throw new Error("Не удалось загрузить демо-данные");
      }
      const normalized = normalizeState(result.state);
      setState(normalized);
      workspaceCache.setWorkspace(normalized);
      localStorage.setItem(STORE_KEY, JSON.stringify(normalized));
      setDemoSeedApplied(true);
      setSyncStatus("saved");
    } catch (error) {
      setSyncStatus("error");
      throw error;
    }
  };

  const resetData = async () => {
    const nextState = normalizeState(createDemoAppState());
    if (cloudEnabled && user) {
      setSyncStatus("saving");
      try {
        await saveWorkspace(user.id, nextState);
        await recordDemoSeedApplied(user.id);
        setState(nextState);
        workspaceCache.setWorkspace(nextState);
        localStorage.setItem(STORE_KEY, JSON.stringify(nextState));
        setDemoSeedApplied(true);
        setSyncStatus("saved");
      } catch (error) {
        setSyncStatus("error");
        throw error;
      }
      return;
    }

    setState(nextState);
    localStorage.setItem(STORE_KEY, JSON.stringify(nextState));
    setSyncStatus("saved");
  };

  if (!ready) {
    return (
      <StoreContext.Provider value={{
        state: createDemoAppState(),
        ready: false,
        syncStatus: "idle",
        migrationStatus: null,
        demoSeedApplied: false,
        runLegacyMigration: async () => {},
        completeOnboarding: async () => {},
        applyDemoSeed: async () => {},
        addPlatform: () => {},
        updatePlatform: () => {},
        updatePlatformSubscribers: () => {},
        upsertPlatformMetric: () => {},
        removePlatformMetric: () => {},
        setAudienceTotal: () => {},
        setAudienceTarget: () => {},
        deletePlatform: () => {},
        addGoal: () => {},
        updateGoal: () => {},
        deleteGoal: () => {},
        addIdea: () => {},
        updateIdea: () => {},
        deleteIdea: () => {},
        addPublication: () => {},
        updatePublication: () => {},
        deletePublication: () => {},
        addCheckpoint: () => {},
        updateCheckpoint: () => {},
        deleteCheckpoint: () => {},
        addTemplate: () => {},
        updateTemplate: () => {},
        deleteTemplate: () => {},
        addReference: () => {},
        updateReference: () => {},
        deleteReference: () => {},
        updateProfile: () => {},
        exportData: () => {},
        resetData: async () => {},
      }}>
        {children}
      </StoreContext.Provider>
    );
  }

  return (
    <StoreContext.Provider value={{
      state,
      ready,
      syncStatus,
      migrationStatus,
      runLegacyMigration,
      completeOnboarding,
      applyDemoSeed,
      demoSeedApplied,
      addPlatform, updatePlatform, updatePlatformSubscribers, upsertPlatformMetric, removePlatformMetric, setAudienceTotal, setAudienceTarget, deletePlatform,
      addGoal, updateGoal, deleteGoal,
      addIdea, updateIdea, deleteIdea,
      addPublication, updatePublication, deletePublication,
      addCheckpoint, updateCheckpoint, deleteCheckpoint,
      addTemplate, updateTemplate, deleteTemplate,
      addReference, updateReference, deleteReference,
      updateProfile,
      exportData,
      resetData,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within a StoreProvider");
  return ctx;
}
