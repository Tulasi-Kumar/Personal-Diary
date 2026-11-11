import type {
  Day,
  DaySignals,
  FeatureVote,
  Media,
  Piece,
  PieceKind,
  Recap,
  Ribbon,
  Settings,
  Story,
} from '@shared/types';
import { db } from './db';
import { dateKey, isPast, todayKey } from './dates';
import { newId, ribbonId } from './ids';

const DEFAULT_SETTINGS: Omit<Settings, 'createdAt' | 'updatedAt'> = {
  id: 'settings',
  bookName: 'My DayBook',
  reminderEnabled: false,
  reminderTime: '20:00',
  memoryNotifications: true,
  writingStyle: 'polished',
  schemaVersion: 1,
};

export async function ensureSettings(): Promise<Settings> {
  const existing = await db.settings.get('settings');
  if (existing) return existing;
  const now = Date.now();
  const settings: Settings = { ...DEFAULT_SETTINGS, createdAt: now, updatedAt: now };
  await db.settings.put(settings);
  return settings;
}

export async function updateSettings(patch: Partial<Omit<Settings, 'id' | 'createdAt'>>): Promise<Settings> {
  const current = await ensureSettings();
  const next: Settings = {
    ...current,
    ...patch,
    id: 'settings',
    updatedAt: Date.now(),
  };
  await db.settings.put(next);
  return next;
}

export async function getDay(date: string): Promise<Day | undefined> {
  return db.days.get(date);
}

export async function ensureDay(date: string): Promise<Day> {
  const existing = await db.days.get(date);
  if (existing) return existing;
  const now = Date.now();
  const day: Day = {
    date,
    storyStatus: 'none',
    createdAt: now,
    updatedAt: now,
  };
  await db.days.put(day);
  return day;
}

export async function updateDay(date: string, patch: Partial<Omit<Day, 'date'>>): Promise<Day> {
  const current = await ensureDay(date);
  const next: Day = { ...current, ...patch, date, updatedAt: Date.now() };
  await db.days.put(next);
  return next;
}

export async function setDayHeading(date: string, heading: string): Promise<Day> {
  return updateDay(date, { heading: heading.trim() || undefined });
}

export async function setDayStory(date: string, story: Story, sourceHash: string): Promise<Day> {
  return updateDay(date, {
    story,
    storyStatus: 'ready',
    storySourceHash: sourceHash,
    storyUpdatedAt: Date.now(),
    storyError: undefined,
  });
}

export async function setStoryStatus(
  date: string,
  storyStatus: Day['storyStatus'],
  storyError?: string,
): Promise<Day> {
  return updateDay(date, { storyStatus, storyError });
}

export async function listPieces(date: string): Promise<Piece[]> {
  const pieces = await db.pieces.where('date').equals(date).toArray();
  return pieces.sort((a, b) => a.createdAt - b.createdAt);
}

export async function listPiecesForDates(dates: string[]): Promise<Piece[]> {
  if (dates.length === 0) return [];
  return db.pieces.where('date').anyOf(dates).toArray();
}

export async function getPiece(id: string): Promise<Piece | undefined> {
  return db.pieces.get(id);
}

export async function addPiece(input: {
  date?: string;
  kind: PieceKind;
  text: string;
  source?: Piece['source'];
  mediaId?: string;
  createdAt?: number;
  addedLater?: boolean;
  polishStatus?: Piece['polishStatus'];
}): Promise<Piece> {
  const date = input.date ?? todayKey();
  const now = input.createdAt ?? Date.now();
  const piece: Piece = {
    id: newId('piece'),
    date,
    kind: input.kind,
    text: input.text,
    originalText: input.text,
    polishStatus: input.polishStatus ?? (input.kind === 'text' || input.kind === 'voice' ? 'raw' : 'skipped'),
    isFavorite: false,
    source: input.source ?? (input.kind === 'voice' ? 'spoken' : 'typed'),
    addedLater: input.addedLater ?? isPast(date),
    createdAt: now,
    updatedAt: now,
    mediaId: input.mediaId,
    capturedAt: now,
  };
  await db.transaction('rw', db.pieces, db.days, db.daySignals, async () => {
    await ensureDay(date);
    await db.pieces.put(piece);
    await db.daySignals.delete(date);
    const day = await db.days.get(date);
    if (day && day.storyStatus === 'ready') {
      await db.days.update(date, { storyStatus: 'queued', updatedAt: Date.now() });
    }
  });
  return piece;
}

export async function editPieceText(
  id: string,
  text: string,
  mode: 'raw' | 'polished' = 'raw',
): Promise<Piece | undefined> {
  const piece = await db.pieces.get(id);
  if (!piece) return undefined;
  const next: Piece = {
    ...piece,
    text,
    updatedAt: Date.now(),
    ...(mode === 'raw'
      ? { originalText: text, polishedText: undefined, polishStatus: 'raw' as const }
      : { polishedText: text }),
  };
  await db.pieces.put(next);
  await db.daySignals.delete(piece.date);
  return next;
}

export async function applyPolish(id: string, polishedText: string): Promise<Piece | undefined> {
  const piece = await db.pieces.get(id);
  if (!piece) return undefined;
  const next: Piece = {
    ...piece,
    text: polishedText,
    polishedText,
    polishStatus: 'polished',
    polishedAt: Date.now(),
    polishError: undefined,
    updatedAt: Date.now(),
  };
  await db.pieces.put(next);
  await db.daySignals.delete(piece.date);
  return next;
}

export async function undoPolish(id: string): Promise<Piece | undefined> {
  const piece = await db.pieces.get(id);
  if (!piece) return undefined;
  const next: Piece = {
    ...piece,
    text: piece.originalText,
    polishedText: undefined,
    polishStatus: 'raw',
    polishedAt: undefined,
    polishError: undefined,
    updatedAt: Date.now(),
  };
  await db.pieces.put(next);
  await db.daySignals.delete(piece.date);
  return next;
}

export async function markPiecePolishStatus(
  id: string,
  polishStatus: Piece['polishStatus'],
  polishError?: string,
): Promise<void> {
  await db.pieces.update(id, { polishStatus, polishError, updatedAt: Date.now() });
}

export async function toggleFavorite(id: string): Promise<Piece | undefined> {
  const piece = await db.pieces.get(id);
  if (!piece) return undefined;
  const next = { ...piece, isFavorite: !piece.isFavorite, updatedAt: Date.now() };
  await db.pieces.put(next);
  await db.daySignals.delete(piece.date);
  return next;
}

export async function deletePiece(id: string): Promise<void> {
  const piece = await db.pieces.get(id);
  if (!piece) return;
  await db.transaction('rw', db.pieces, db.media, db.daySignals, db.ribbons, async () => {
    await db.pieces.delete(id);
    if (piece.mediaId) await db.media.delete(piece.mediaId);
    await db.daySignals.delete(piece.date);
    await db.ribbons.where('pieceId').equals(id).delete();
  });
}

export async function addMedia(input: {
  kind: Media['kind'];
  mimeType: string;
  blob: Blob;
  width?: number;
  height?: number;
  durationSeconds?: number;
  fileName?: string;
  demo?: boolean;
  createdAt?: number;
}): Promise<Media> {
  const media: Media = {
    id: newId('media'),
    kind: input.kind,
    mimeType: input.mimeType,
    blob: input.blob,
    width: input.width,
    height: input.height,
    durationSeconds: input.durationSeconds,
    fileName: input.fileName,
    createdAt: input.createdAt ?? Date.now(),
    demo: input.demo,
  };
  await db.media.put(media);
  return media;
}

export async function getMedia(id: string): Promise<Media | undefined> {
  return db.media.get(id);
}

export async function listMediaForDate(date: string): Promise<Media[]> {
  const pieces = await listPieces(date);
  const mediaIds = pieces.map((piece) => piece.mediaId).filter((id): id is string => Boolean(id));
  if (mediaIds.length === 0) return [];
  const media = await db.media.bulkGet(mediaIds);
  return media.filter((item): item is Media => Boolean(item));
}

export async function getRecap(month: string): Promise<Recap | undefined> {
  return db.recaps.where('month').equals(month).first();
}

export async function saveRecap(recap: Omit<Recap, 'id' | 'createdAt'> & { id?: string }): Promise<Recap> {
  const existing = await getRecap(recap.month);
  const next: Recap = {
    ...recap,
    id: recap.id ?? existing?.id ?? newId('recap'),
    createdAt: existing?.createdAt ?? Date.now(),
  };
  await db.recaps.put(next);
  return next;
}

export async function listRibbons(date: string): Promise<Ribbon[]> {
  return db.ribbons.where('date').equals(date).toArray();
}

export async function listAllRibbons(): Promise<Ribbon[]> {
  return db.ribbons.toArray();
}

export async function getRibbon(id: string): Promise<Ribbon | undefined> {
  return db.ribbons.get(id);
}

export async function listRibbonsForPiece(pieceId: string): Promise<Ribbon[]> {
  return db.ribbons.where('pieceId').equals(pieceId).toArray();
}

export async function upsertRibbon(input: {
  date: string;
  label: Ribbon['label'];
  quote: string;
  pieceId: string;
  sourcePieceIds?: string[];
  source?: Ribbon['source'];
}): Promise<Ribbon> {
  const id = ribbonId(input.date, input.label);
  const existing = await db.ribbons.get(id);
  const ribbon: Ribbon = {
    id,
    date: input.date,
    label: input.label,
    quote: input.quote,
    pieceId: input.pieceId,
    sourcePieceIds: input.sourcePieceIds ?? [input.pieceId],
    awardedAt: existing?.awardedAt ?? Date.now(),
    source: input.source ?? 'ai',
  };
  await db.ribbons.put(ribbon);
  await db.daySignals.delete(input.date);
  return ribbon;
}

export async function deleteRibbon(id: string): Promise<void> {
  const ribbon = await db.ribbons.get(id);
  if (!ribbon) return;
  await db.ribbons.delete(id);
  await db.daySignals.delete(ribbon.date);
}

export async function getSignals(date: string): Promise<DaySignals | undefined> {
  return db.daySignals.get(date);
}

export async function upsertSignals(signals: DaySignals): Promise<void> {
  await db.daySignals.put(signals);
}

export async function listSignals(): Promise<DaySignals[]> {
  return db.daySignals.toArray();
}

export async function invalidateSignals(date: string): Promise<void> {
  await db.daySignals.delete(date);
}

export async function listFeatureVotes(): Promise<FeatureVote[]> {
  return db.featureVotes.toArray();
}

export async function toggleFeatureVote(featureId: string): Promise<boolean> {
  const id = `vote_${featureId}`;
  const existing = await db.featureVotes.get(id);
  if (existing) {
    await db.featureVotes.delete(id);
    return false;
  }
  await db.featureVotes.put({ id, featureId, votedAt: Date.now() });
  return true;
}

export async function logMetric(name: string, date: string, value = 1, meta?: Record<string, unknown>): Promise<void> {
  await db.metrics.put({
    id: newId('metric'),
    name,
    date,
    value,
    meta,
    createdAt: Date.now(),
  });
}

export async function kvGet<T>(key: string): Promise<T | undefined> {
  const entry = await db.kv.get(key);
  return entry?.value as T | undefined;
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  await db.kv.put({ key, value, updatedAt: Date.now() });
}

export async function exportRawData() {
  const [days, pieces, recaps, ribbons, media, settings, daySignals, featureVotes, metrics] =
    await Promise.all([
      db.days.toArray(),
      db.pieces.toArray(),
      db.recaps.toArray(),
      db.ribbons.toArray(),
      db.media.toArray(),
      ensureSettings(),
      db.daySignals.toArray(),
      db.featureVotes.toArray(),
      db.metrics.toArray(),
    ]);
  return { days, pieces, recaps, ribbons, media, settings, daySignals, featureVotes, metrics };
}

export async function clearAllData(): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.days,
      db.pieces,
      db.recaps,
      db.ribbons,
      db.media,
      db.settings,
      db.daySignals,
      db.aiJobs,
      db.featureVotes,
      db.metrics,
      db.kv,
    ],
    async () => {
      await Promise.all([
        db.days.clear(),
        db.pieces.clear(),
        db.recaps.clear(),
        db.ribbons.clear(),
        db.media.clear(),
        db.settings.clear(),
        db.daySignals.clear(),
        db.aiJobs.clear(),
        db.featureVotes.clear(),
        db.metrics.clear(),
        db.kv.clear(),
      ]);
    },
  );
  await ensureSettings();
}

export async function recentDayKeys(limit = 14): Promise<string[]> {
  const days = await db.days.orderBy('date').reverse().limit(limit).toArray();
  const keys = days.map((day) => day.date);
  if (!keys.includes(todayKey())) keys.unshift(todayKey());
  return keys;
}

export async function allDayKeys(): Promise<string[]> {
  return (await db.days.orderBy('date').toArray()).map((day) => day.date);
}

export async function dayHasContent(date: string): Promise<boolean> {
  return (await db.pieces.where('date').equals(date).count()) > 0 || Boolean(await db.days.get(date));
}

export function currentDateKey(): string {
  return dateKey(new Date());
}
