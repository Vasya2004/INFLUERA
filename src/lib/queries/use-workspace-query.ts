import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AppState } from "../types";
import { loadWorkspace, saveFullWorkspace } from "../repositories/workspace-repository";
import { queryKeys } from "./query-keys";

export function useWorkspaceQuery(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workspace(userId),
    queryFn: () => loadWorkspace(userId!),
    enabled: Boolean(userId),
    staleTime: 30_000,
  });
}

export function useSaveFullWorkspaceMutation(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (state: AppState) => saveFullWorkspace(userId!, state),
    onSuccess: (_, state) => {
      if (userId) queryClient.setQueryData(queryKeys.workspace(userId), state);
    },
  });
}

export function useWorkspaceCache(userId: string | undefined) {
  const queryClient = useQueryClient();

  return {
    setWorkspace(state: AppState) {
      if (!userId) return;
      queryClient.setQueryData(queryKeys.workspace(userId), state);
    },
    patchWorkspace(updater: (current: AppState | undefined) => AppState) {
      if (!userId) return;
      queryClient.setQueryData<AppState | null | undefined>(queryKeys.workspace(userId), current => {
        const base = current ?? undefined;
        return updater(base);
      });
    },
    invalidate() {
      if (!userId) return;
      return queryClient.invalidateQueries({ queryKey: queryKeys.workspace(userId) });
    },
  };
}
