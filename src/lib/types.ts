export type PlatformRole = "основная площадка" | "дополнительная";

export interface Platform {
  id: string;
  name: string;
  username: string;
  url: string;
  subscribers: number;
  targetSubscribers: number;
  role: PlatformRole;
  weeklyPlan: number;
  /** Площадки, куда дублируется контент с основной (только для role = основная площадка) */
  mirrorPlatformIds?: string[];
  accentColor?: string;  // hex e.g. "#0088cc"
  iconUrl?: string;      // base64 data URL or external URL
  iconStoragePath?: string;
}

export interface PlatformMetric {
  id: string;
  platformId: string;
  date: string;
  subscribers: number;
  notes?: string;
}

export type GoalType = "подписчики" | "частота публикаций" | "доход" | "другое";

export interface Goal {
  id: string;
  title: string;
  type: GoalType;
  currentValue: number;
  targetValue: number;
  deadline: string;
  platformId?: string;
  /** Главная цель — её значения показываются на дашборде в блоке «Общая аудитория» */
  isPrimary?: boolean;
}

export type IdeaStatus = "новая" | "в работе" | "превращена в публикацию" | "отложена" | "архив";
export type ContentFormat = "Reels/Shorts/TikTok" | "пост" | "карусель" | "Telegram-пост" | "видео" | "сторис";
export type Priority = "высокий" | "средний" | "низкий";
export type IdeaScriptMode = "video" | "post";

export interface IdeaScriptRow {
  id: string;
  text: string;
  storyboard: string;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  sourceUrl?: string;
  script?: string;
  storyboard?: string;
  scriptRows?: IdeaScriptRow[];
  scriptMode?: IdeaScriptMode;
  format: ContentFormat;
  platformId?: string;
  priority: Priority;
  status: IdeaStatus;
  createdAt: string;
  tags?: string[];
}

export type PublicationStatus = "запланировано" | "в работе" | "готово" | "опубликовано";

export type CheckpointType =
  | "обновление_подписчиков"
  | "контент_план"
  | "день_съемок";

export interface Checkpoint {
  id: string;
  type: CheckpointType;
  date: string;
  note?: string;
}

export interface PublicationChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export type AttachmentBucket = "template-files" | "publication-files";

export interface FileAttachment {
  id: string;
  name: string;
  storagePath?: string;
  url?: string;
  mimeType?: string;
  sizeBytes?: number;
  bucket?: AttachmentBucket;
}

export interface Publication {
  id: string;
  title: string;
  date: string;
  platformId: string;
  format: ContentFormat;
  status: PublicationStatus;
  ideaId?: string;
  note?: string;
  url?: string;
  hook?: string;
  caption?: string;
  cta?: string;
  templateId?: string;
  checklist?: PublicationChecklistItem[];
  files?: FileAttachment[];
}

export type TemplateCategory =
  | "сценарий"
  | "съёмка"
  | "хук"
  | "структура публикации"
  | "лид магнит"
  | "доп материалы";

export type TemplateFile = FileAttachment;

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  format: ContentFormat[];
  description: string;
  usage: string;
  content: string;
  files?: TemplateFile[];
}

export type CreatorReferenceType = "блогер" | "эксперт" | "бренд";

export interface CreatorReference {
  id: string;
  name: string;
  handle: string;
  platform: string;
  url: string;
  type: CreatorReferenceType;
  niche: string;
  contentFocus: string;
  whyRelevant: string;
  notes: string;
  tags?: string[];
  rating: number;
  favorite?: boolean;
  createdAt: string;
}

export interface Profile {
  name: string;
  niche: string;
  positioning: string;
  description: string;
  targetAudience: string;
  mainTopics: string;
  rubrics: string;
  tone: string;
  expertise: string;
  opportunities: string;
  avatarUrl?: string;
  avatarStoragePath?: string;
  coverUrl?: string;
  coverStoragePath?: string;
}

export interface AppState {
  platforms: Platform[];
  platformMetrics?: PlatformMetric[];
  goals: Goal[];
  ideas: Idea[];
  publications: Publication[];
  checkpoints: Checkpoint[];
  templates: Template[];
  references: CreatorReference[];
  profile: Profile;
}
