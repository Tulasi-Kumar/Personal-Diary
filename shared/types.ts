export type PieceKind = 'text' | 'voice' | 'photo' | 'video';

export type PolishStatus = 'raw' | 'queued' | 'polished' | 'error' | 'skipped';

export type StoryStatus = 'none' | 'queued' | 'generating' | 'ready' | 'error';

export type MediaKind = 'photo' | 'video';

export type RibbonLabel = 'Funny' | 'Brave' | 'Honest' | 'Tender' | 'Proud' | 'Hard';

export type WritingStyle = 'polished';

export type AiTask = 'polish' | 'story' | 'insights' | 'recap' | 'vision';

export type StoryForm = 'crisp' | 'full';

export type AiJobStatus = 'queued' | 'running' | 'done' | 'error';

export interface StoryParagraph {
  text: string;
  sourcePieceIds: string[];
}

export interface Story {
  heading: string;
  paragraphs: StoryParagraph[];
  form?: StoryForm;
  generatedAt: number;
}

export interface Day {
  date: string;
  heading?: string;
  story?: Story;
  storyStatus: StoryStatus;
  storySourceHash?: string;
  storyUpdatedAt?: number;
  storyError?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Piece {
  id: string;
  date: string;
  kind: PieceKind;
  text: string;
  originalText: string;
  polishedText?: string;
  polishStatus: PolishStatus;
  isFavorite: boolean;
  source: 'typed' | 'spoken' | 'demo';
  addedLater: boolean;
  createdAt: number;
  updatedAt: number;
  mediaId?: string;
  capturedAt?: number;
  polishError?: string;
  polishedAt?: number;
}

export interface Media {
  id: string;
  kind: MediaKind;
  mimeType: string;
  blob: Blob;
  width?: number;
  height?: number;
  durationSeconds?: number;
  fileName?: string;
  createdAt: number;
  demo?: boolean;
}

export interface Recap {
  id: string;
  month: string;
  text: string;
  highlights: string[];
  sourceHash: string;
  generatedAt: number;
  createdAt: number;
}

export interface Ribbon {
  id: string;
  date: string;
  label: RibbonLabel;
  quote: string;
  pieceId: string;
  sourcePieceIds: string[];
  awardedAt: number;
  source: 'ai' | 'demo';
}

export interface Settings {
  id: 'settings';
  bookName: string;
  reminderEnabled: boolean;
  reminderTime: string | null;
  memoryNotifications: boolean;
  writingStyle: WritingStyle;
  schemaVersion: number;
  demoLoaded?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface DaySignals {
  date: string;
  hint: string;
  people: string[];
  places: string[];
  winningRibbon: RibbonLabel | null;
  winningRibbonStrength: number;
  interactionScore: number;
  storyBacked: boolean;
  pieceCount: number;
  mediaCount: number;
  updatedAt: number;
}

export interface AiJob {
  id: string;
  task: AiTask;
  inputHash: string;
  payload: unknown;
  status: AiJobStatus;
  attempts: number;
  lastError?: string;
  result?: unknown;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export interface FeatureVote {
  id: string;
  featureId: string;
  votedAt: number;
}

export interface MetricEvent {
  id: string;
  name: string;
  date: string;
  value: number;
  meta?: Record<string, unknown>;
  createdAt: number;
}

export interface KvEntry {
  key: string;
  value: unknown;
  updatedAt: number;
}

export interface ExportedPiece {
  id: string;
  date: string;
  kind: PieceKind;
  text: string;
  originalText: string;
  polishedText?: string;
  polishStatus: PolishStatus;
  source: Piece['source'];
  createdAt: number;
  updatedAt: number;
  capturedAt?: number;
  addedLater: boolean;
  isFavorite: boolean;
  mediaId?: string;
}

export interface ExportBundle {
  app: 'DayBook';
  schemaVersion: number;
  exportedAt: string;
  bookName: string;
  note?: string;
  settings: Omit<Settings, 'id'>;
  days: Array<Omit<Day, 'story'> & { story?: Omit<Story, 'generatedAt'> }>;
  pieces: ExportedPiece[];
  recaps: Recap[];
  ribbons: Ribbon[];
  daySignals: DaySignals[];
  votes: FeatureVote[];
  media: Array<Omit<Media, 'blob'> & { blobStored: false }>;
}

export interface AppSettingsDefaults {
  bookName: 'My DayBook';
  writingStyle: 'polished';
  reminderEnabled: false;
  reminderTime: '20:00';
  memoryNotifications: true;
}
