export type ProfileRow = {
  user_id: string;
  name: string | null;
  niche: string | null;
  positioning: string | null;
  description: string | null;
  target_audience: string | null;
  main_topics: string | null;
  rubrics: string | null;
  tone: string | null;
  expertise: string | null;
  opportunities: string | null;
};

export type PlatformRow = {
  id: string;
  user_id: string;
  name: string;
  username: string | null;
  url: string | null;
  subscribers: number | null;
  target_subscribers: number | null;
  role: string;
  weekly_plan: number | null;
  accent_color: string | null;
  icon_storage_path: string | null;
  icon_url: string | null;
  mirror_platform_ids: string[] | null;
};

export type PlatformMetricRow = {
  id: string;
  user_id: string;
  platform_id: string;
  metric_date: string;
  subscribers: number | null;
  notes: string | null;
};

export type GoalRow = {
  id: string;
  user_id: string;
  title: string;
  type: string;
  current_value: number | null;
  target_value: number | null;
  deadline: string;
  platform_id: string | null;
  is_primary: boolean | null;
};

export type IdeaRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  script?: string | null;
  storyboard?: string | null;
  format: string;
  platform_id: string | null;
  priority: string;
  status: string;
  created_at: string;
  tags?: string[] | null;
};

export type PublicationRow = {
  id: string;
  user_id: string;
  title: string;
  publication_date: string;
  format: string;
  status: string;
  idea_id: string | null;
  note: string | null;
  url: string | null;
  checklist?: unknown;
};

export type PublicationChannelRow = {
  publication_id: string;
  platform_id: string;
  user_id: string;
};

export type CheckpointRow = {
  id: string;
  user_id: string;
  type: string;
  checkpoint_date: string;
  note: string | null;
};

export type TemplateRow = {
  id: string;
  user_id: string;
  name: string;
  category: string;
  formats: string[] | null;
  description: string;
  usage: string | null;
  content: string;
};

export type TemplateFileRow = {
  id: string;
  user_id: string;
  template_id: string;
  original_name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes?: number | null;
};

export type PublicationFileRow = {
  id: string;
  user_id: string;
  publication_id: string;
  original_name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes?: number | null;
};
