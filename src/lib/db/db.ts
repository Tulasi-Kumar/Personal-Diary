import Dexie, { type Table } from 'dexie';
import type {
  AiJob,
  Day,
  DaySignals,
  FeatureVote,
  KvEntry,
  Media,
  MetricEvent,
  Piece,
  Recap,
  Ribbon,
  Settings,
} from '@shared/types';

export class DayBookDatabase extends Dexie {
  days!: Table<Day, string>;
  pieces!: Table<Piece, string>;
  recaps!: Table<Recap, string>;
  ribbons!: Table<Ribbon, string>;
  media!: Table<Media, string>;
  settings!: Table<Settings, string>;
  daySignals!: Table<DaySignals, string>;
  aiJobs!: Table<AiJob, string>;
  featureVotes!: Table<FeatureVote, string>;
  metrics!: Table<MetricEvent, string>;
  kv!: Table<KvEntry, string>;

  constructor(name = 'daybook-db') {
    super(name);
    this.version(1).stores({
      days: 'date, storyStatus, updatedAt',
      pieces: 'id, date, [date+createdAt], kind, polishStatus, mediaId, isFavorite',
      recaps: 'id, month, generatedAt',
      ribbons: 'id, date, label, pieceId, [date+label]',
      media: 'id, kind, createdAt',
      settings: 'id',
      daySignals: 'date, winningRibbon, storyBacked, updatedAt',
      aiJobs: 'id, task, status, inputHash, createdAt',
      featureVotes: 'id, featureId',
      metrics: 'id, name, date, createdAt',
      kv: 'key',
    });
  }
}

export const db = new DayBookDatabase();

export async function resetDatabaseForTests() {
  await db.delete();
  await db.open();
}
