import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AppState, Idea, Platform, PlatformMetric, Publication } from "../types";
import { createCloudSync } from "../sync/cloud-sync";
import { queryKeys } from "./query-keys";

function patchWorkspaceCache(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
  updater: (state: AppState) => AppState,
) {
  queryClient.setQueryData<AppState | null | undefined>(queryKeys.workspace(userId), current => {
    if (!current) return current;
    return updater(current);
  });
}

export function upsertPublicationInWorkspace(state: AppState, publication: Publication): AppState {
  return {
    ...state,
    publications: state.publications.some(item => item.id === publication.id)
      ? state.publications.map(item => item.id === publication.id ? publication : item)
      : [...state.publications, publication],
  };
}

export function removePublicationFromWorkspace(state: AppState, publicationId: string): AppState {
  return {
    ...state,
    publications: state.publications.filter(item => item.id !== publicationId),
  };
}

export function upsertPlatformInWorkspace(
  state: AppState,
  platform: Platform,
  metric?: PlatformMetric,
): AppState {
  return {
    ...state,
    platforms: state.platforms.some(item => item.id === platform.id)
      ? state.platforms.map(item => item.id === platform.id ? platform : item)
      : [...state.platforms, platform],
    platformMetrics: metric
      ? [
        ...(state.platformMetrics ?? []).filter(item => item.id !== metric.id),
        metric,
      ]
      : state.platformMetrics,
  };
}

export function usePublicationMutations(userId: string | undefined) {
  const queryClient = useQueryClient();
  const sync = userId ? createCloudSync(userId) : null;

  const savePublication = useMutation({
    mutationFn: async (publication: Publication) => {
      if (!userId || !sync) return publication;
      await sync.savePublication(publication);
      return publication;
    },
    onMutate: async publication => {
      if (!userId) return;
      const previous = queryClient.getQueryData<AppState | null>(queryKeys.workspace(userId));
      patchWorkspaceCache(queryClient, userId, state => upsertPublicationInWorkspace(state, publication));
      return { previous };
    },
    onError: (_error, _publication, context) => {
      if (userId && context?.previous) {
        queryClient.setQueryData(queryKeys.workspace(userId), context.previous);
      }
    },
    onSettled: () => {
      if (userId) void queryClient.invalidateQueries({ queryKey: queryKeys.publications(userId) });
    },
  });

  const removePublication = useMutation({
    mutationFn: async (publicationId: string) => {
      if (!userId || !sync) return publicationId;
      await sync.removePublication(publicationId);
      return publicationId;
    },
    onMutate: async publicationId => {
      if (!userId) return;
      const previous = queryClient.getQueryData<AppState | null>(queryKeys.workspace(userId));
      patchWorkspaceCache(queryClient, userId, state => removePublicationFromWorkspace(state, publicationId));
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (userId && context?.previous) {
        queryClient.setQueryData(queryKeys.workspace(userId), context.previous);
      }
    },
  });

  return { savePublication, removePublication };
}

export function usePlatformMutations(userId: string | undefined) {
  const queryClient = useQueryClient();
  const sync = userId ? createCloudSync(userId) : null;

  const savePlatform = useMutation({
    mutationFn: async ({ platform, metric }: { platform: Platform; metric?: PlatformMetric }) => {
      if (!userId || !sync) return { platform, metric };
      await sync.savePlatform(platform);
      if (metric) await sync.savePlatformMetric(metric);
      return { platform, metric };
    },
    onMutate: async ({ platform, metric }) => {
      if (!userId) return;
      const previous = queryClient.getQueryData<AppState | null>(queryKeys.workspace(userId));
      patchWorkspaceCache(queryClient, userId, state => upsertPlatformInWorkspace(state, platform, metric));
      return { previous };
    },
    onError: (_error, _payload, context) => {
      if (userId && context?.previous) {
        queryClient.setQueryData(queryKeys.workspace(userId), context.previous);
      }
    },
  });

  return { savePlatform };
}

export function useIdeaMutations(userId: string | undefined) {
  const queryClient = useQueryClient();
  const sync = userId ? createCloudSync(userId) : null;

  const createPublicationFromIdea = useMutation({
    mutationFn: async ({ idea, publication }: { idea: Idea; publication: Publication }) => {
      if (!userId || !sync) return publication;
      await sync.savePublication(publication);
      return publication;
    },
    onMutate: async ({ publication }) => {
      if (!userId) return;
      const previous = queryClient.getQueryData<AppState | null>(queryKeys.workspace(userId));
      patchWorkspaceCache(queryClient, userId, state => ({
        ...state,
        publications: [...state.publications, publication],
      }));
      return { previous };
    },
    onError: (_error, _payload, context) => {
      if (userId && context?.previous) {
        queryClient.setQueryData(queryKeys.workspace(userId), context.previous);
      }
    },
  });

  return { createPublicationFromIdea };
}
