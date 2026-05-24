import type { AppState, Checkpoint, Goal, Idea, Platform, PlatformMetric, Profile, Publication, Template } from "../types";
import { saveCheckpoint, removeCheckpoint } from "../repositories/checkpoints-repository";
import { saveGoal, saveGoals, removeGoal } from "../repositories/goals-repository";
import { saveIdea, removeIdea } from "../repositories/ideas-repository";
import {
  removeMetricsForPlatform,
  removePlatformMetric,
  savePlatformMetric,
} from "../repositories/platform-metrics-repository";
import { savePlatform, savePlatforms, removePlatform } from "../repositories/platforms-repository";
import { saveProfile } from "../repositories/profile-repository";
import { savePublication, removePublication } from "../repositories/publications-repository";
import { saveTemplate, removeTemplate } from "../repositories/templates-repository";

export type CloudSyncApi = {
  saveProfile: (profile: Profile) => Promise<void>;
  savePlatform: (platform: Platform) => Promise<void>;
  savePlatforms: (platforms: Platform[]) => Promise<void>;
  removePlatform: (platformId: string) => Promise<void>;
  savePlatformMetric: (metric: PlatformMetric) => Promise<void>;
  removePlatformMetric: (metricId: string) => Promise<void>;
  removeMetricsForPlatform: (platformId: string) => Promise<void>;
  saveGoal: (goal: Goal) => Promise<void>;
  saveGoals: (goals: Goal[]) => Promise<void>;
  removeGoal: (goalId: string) => Promise<void>;
  saveIdea: (idea: Idea) => Promise<void>;
  removeIdea: (ideaId: string) => Promise<void>;
  savePublication: (publication: Publication) => Promise<void>;
  removePublication: (publicationId: string) => Promise<void>;
  saveCheckpoint: (checkpoint: Checkpoint) => Promise<void>;
  removeCheckpoint: (checkpointId: string) => Promise<void>;
  saveTemplate: (template: Template) => Promise<void>;
  removeTemplate: (templateId: string) => Promise<void>;
};

export function createCloudSync(userId: string): CloudSyncApi {
  return {
    saveProfile: profile => saveProfile(userId, profile),
    savePlatform: platform => savePlatform(userId, platform),
    savePlatforms: platforms => savePlatforms(userId, platforms),
    removePlatform: platformId => removePlatform(userId, platformId),
    savePlatformMetric: metric => savePlatformMetric(userId, metric),
    removePlatformMetric: metricId => removePlatformMetric(userId, metricId),
    removeMetricsForPlatform: platformId => removeMetricsForPlatform(userId, platformId),
    saveGoal: goal => saveGoal(userId, goal),
    saveGoals: goals => saveGoals(userId, goals),
    removeGoal: goalId => removeGoal(userId, goalId),
    saveIdea: idea => saveIdea(userId, idea),
    removeIdea: ideaId => removeIdea(userId, ideaId),
    savePublication: publication => savePublication(userId, publication),
    removePublication: publicationId => removePublication(userId, publicationId),
    saveCheckpoint: checkpoint => saveCheckpoint(userId, checkpoint),
    removeCheckpoint: checkpointId => removeCheckpoint(userId, checkpointId),
    saveTemplate: template => saveTemplate(userId, template),
    removeTemplate: templateId => removeTemplate(userId, templateId),
  };
}

export function findPlatformMetric(state: AppState, metricId: string) {
  return (state.platformMetrics ?? []).find(metric => metric.id === metricId);
}
