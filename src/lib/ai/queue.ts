import type { AiJob, AiTask, Piece, RibbonLabel, StoryForm } from '@shared/types';
import { RIBBON_LABELS } from '@shared/ribbon-labels';
import { PROMPT_VERSION } from '@shared/prompt-version';
import { db } from '../db/db';
import {
  applyPolish,
  ensureSettings,
  getDay,
  getMedia,
  getPiece,
  listPieces,
  listRibbons,
  logMetric,
  markPiecePolishStatus,
  saveRecap,
  setDayStory,
  setStoryStatus,
  updateDay,
  upsertRibbon,
  upsertSignals,
} from '../db/repositories';
import { dateKey, monthDays, recentPastDayKeys, todayKey } from '../db/dates';
import { newId } from '../db/ids';
import { recomputeRibbonRarity } from '../memory/ribbons';
import { computeDaySignals } from '../memory/signals';
import { hashString, piecesHash } from './hash';
import { assertQuota, recordAiCall } from './quota';
import { AiClientError, callAi } from './client';

const RATE_LIMIT_COOLDOWN_MS = 60_000;
const MAX_RATE_LIMIT_ATTEMPTS = 3;
let rateLimitedUntil = 0;
let retryTimer: number | undefined;

interface PieceSnapshot {
  id: string;
  text: string;
  kind: Piece['kind'];
  createdAt: number;
  updatedAt: number;
}

interface PolishPayload {
  pieceId: string;
  date: string;
  text: string;
  kind: 'text' | 'voice';
}

interface StoryPayload {
  date: string;
  bookName: string;
  form: StoryForm;
  sourceHash: string;
  pieces: Array<{ id: string; text: string; kind: Piece['kind']; createdAt: number }>;
}

interface InsightsPayload {
  date: string;
  sourceHash: string;
  pieces: Array<{ id: string; text: string; kind: Piece['kind']; createdAt: number }>;
  existingLabels: RibbonLabel[];
}

interface RecapPayload {
  month: string;
  bookName: string;
  sourceHash: string;
  days: Array<{
    date: string;
    heading?: string;
    storyText?: string;
    pieces: Array<{ id: string; text: string; kind: Piece['kind']; createdAt: number }>;
  }>;
}

interface VisionPayload {
  pieceId: string;
  mediaId: string;
  date: string;
  kind: 'photo' | 'video';
  caption?: string;
}

let running = false;
let started = false;

function snapshotForAi(pieces: Piece[]): PieceSnapshot[] {
  return pieces
    .filter((piece) => piece.text.trim().length > 0)
    .map((piece) => ({
      id: piece.id,
      text: piece.text,
      kind: piece.kind,
      createdAt: piece.createdAt,
      updatedAt: piece.updatedAt,
    }));
}

function storyHash(pieces: PieceSnapshot[]): string {
  return piecesHash(pieces);
}

async function enqueueJob(
  task: AiTask,
  inputHash: string,
  payload: unknown,
): Promise<AiJob> {
  const existing = await db.aiJobs.where('inputHash').equals(inputHash).first();
  if (existing && (existing.status === 'queued' || existing.status === 'running')) {
    return existing;
  }
  const now = Date.now();
  const job: AiJob = {
    id: newId('job'),
    task,
    inputHash,
    payload,
    status: 'queued',
    attempts: 0,
    createdAt: now,
    updatedAt: now,
  };
  await db.aiJobs.put(job);
  void kickQueue();
  return job;
}

export async function enqueuePolish(pieceId: string, opts: { force?: boolean } = {}): Promise<void> {
  const piece = await getPiece(pieceId);
  if (!piece) return;
  if (piece.kind !== 'text' && piece.kind !== 'voice') return;
  if (!opts.force && piece.polishStatus === 'polished') return;
  if (piece.polishStatus === 'queued') return;

  const text = piece.originalText.trim();
  if (!text) return;

  const inputHash = `polish:v${PROMPT_VERSION}:${pieceId}:${hashString(text)}`;
  if (!opts.force) {
    const existing = await db.aiJobs.where('inputHash').equals(inputHash).first();
    if (existing?.status === 'done') return;
  }

  await markPiecePolishStatus(pieceId, 'queued');
  await enqueueJob('polish', inputHash, {
    pieceId,
    date: piece.date,
    text,
    kind: piece.kind,
  } satisfies PolishPayload);
}

export async function enqueueStory(
  date: string,
  _opts: { force?: boolean } = {},
): Promise<void> {
  const pieces = snapshotForAi(await listPieces(date));
  if (pieces.length === 0) {
    await updateDay(date, {
      story: undefined,
      storyStatus: 'none',
      storySourceHash: undefined,
      storyUpdatedAt: undefined,
      storyError: undefined,
    });
    return;
  }
  const form: StoryForm = date < todayKey() ? 'full' : 'crisp';
  const sourceHash = storyHash(pieces);
  const day = await getDay(date);
  if (day?.story && day.storySourceHash === sourceHash && day.story.form === form) {
    if (day.storyStatus !== 'ready') await setStoryStatus(date, 'ready');
    return;
  }
  const settings = await ensureSettings();
  await setStoryStatus(date, 'queued');
  await enqueueJob('story', `story:${form}:${date}:${sourceHash}`, {
    date,
    bookName: settings.bookName || 'My DayBook',
    form,
    sourceHash,
    pieces: pieces.map(({ id, text, kind, createdAt }) => ({ id, text, kind, createdAt })),
  } satisfies StoryPayload);
}

export async function wrapUpPastDays(days = 7): Promise<void> {
  for (const date of recentPastDayKeys(days)) {
    const pieces = await listPieces(date);
    if (pieces.length === 0) continue;
    if (pieces.every((piece) => piece.source === 'demo')) continue;
    await enqueueStory(date);
  }
}

export async function enqueueInsights(date: string): Promise<void> {
  const pieces = snapshotForAi(await listPieces(date));
  if (pieces.length === 0) return;
  const ribbons = await listRibbons(date);
  const existingLabels = ribbons.map((ribbon) => ribbon.label);
  const sourceHash = storyHash(pieces);
  await enqueueJob('insights', `insights:${date}:${sourceHash}:${existingLabels.sort().join(',')}`, {
    date,
    sourceHash,
    pieces: pieces.map(({ id, text, kind, createdAt }) => ({ id, text, kind, createdAt })),
    existingLabels,
  } satisfies InsightsPayload);
}

export async function enqueueRecap(month: string, opts: { force?: boolean } = {}): Promise<void> {
  const days = monthDays(month);
  const material: RecapPayload['days'] = [];
  const allPieces: PieceSnapshot[] = [];
  for (const date of days) {
    const [day, pieces] = await Promise.all([getDay(date), listPieces(date)]);
    const snapshots = snapshotForAi(pieces);
    if (snapshots.length === 0) continue;
    allPieces.push(...snapshots);
    material.push({
      date,
      heading: day?.heading,
      storyText: day?.story?.paragraphs.map((paragraph) => paragraph.text).join('\n\n'),
      pieces: snapshots.map(({ id, text, kind, createdAt }) => ({ id, text, kind, createdAt })),
    });
  }
  if (material.length === 0) return;
  const sourceHash = storyHash(allPieces);
  const existing = await db.recaps.where('month').equals(month).first();
  if (!opts.force && existing?.sourceHash === sourceHash) return;
  const settings = await ensureSettings();
  await enqueueJob('recap', `recap:${month}:${sourceHash}`, {
    month,
    bookName: settings.bookName || 'My DayBook',
    sourceHash,
    days: material,
  } satisfies RecapPayload);
}

export async function enqueueVision(pieceId: string): Promise<void> {
  const piece = await getPiece(pieceId);
  if (!piece || !piece.mediaId) return;
  const media = await getMedia(piece.mediaId);
  if (!media) return;
  const caption = piece.originalText.trim();
  await markPiecePolishStatus(pieceId, 'queued');
  await enqueueJob(
    'vision',
    `vision:v${PROMPT_VERSION}:${pieceId}:${media.id}:${hashString(caption)}`,
    {
      pieceId,
      mediaId: media.id,
      date: piece.date,
      kind: media.kind,
      caption: caption || undefined,
    } satisfies VisionPayload,
  );
}

export async function afterPieceChange(date: string): Promise<void> {
  const pieces = await listPieces(date);
  if (pieces.length === 0) {
    await updateDay(date, {
      story: undefined,
      storyStatus: 'none',
      storySourceHash: undefined,
      storyUpdatedAt: undefined,
      storyError: undefined,
    });
    await db.daySignals.delete(date);
    await db.ribbons.where('date').equals(date).delete();
    return;
  }
  await updateDay(date, { storyStatus: 'queued' });
  await enqueueStory(date, { force: true });
  await enqueueInsights(date);
}

function validRibbonLabel(value: string): value is RibbonLabel {
  return (RIBBON_LABELS as readonly string[]).includes(value);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error('The image could not be read.'));
    reader.readAsDataURL(blob);
  });
}

async function runJob(job: AiJob): Promise<unknown> {
  await assertQuota();
  await recordAiCall();

  switch (job.task) {
    case 'polish': {
      const payload = job.payload as PolishPayload;
      const result = await callAi({
        task: 'polish',
        input: { date: payload.date, text: payload.text, kind: payload.kind },
      });
      if (result.task !== 'polish') throw new Error('Unexpected polish result.');
      const currentPiece = await getPiece(payload.pieceId);
      if (!currentPiece || currentPiece.originalText !== payload.text) {
        return { skipped: true };
      }
      await applyPolish(payload.pieceId, result.polishedText);
      await logMetric('polish_success', payload.date);
      await enqueueStory(payload.date, { force: true });
      await enqueueInsights(payload.date);
      return { polishedText: result.polishedText };
    }

    case 'story': {
      const payload = job.payload as StoryPayload;
      const beforePieces = snapshotForAi(await listPieces(payload.date));
      if (storyHash(beforePieces) !== payload.sourceHash) {
        return { skipped: true };
      }
      const result = await callAi({
        task: 'story',
        input: {
          date: payload.date,
          bookName: payload.bookName,
          form: payload.form,
          pieces: payload.pieces,
        },
      });
      if (result.task !== 'story') throw new Error('Unexpected story result.');
      const currentPieces = snapshotForAi(await listPieces(payload.date));
      if (storyHash(currentPieces) !== payload.sourceHash) {
        return { skipped: true };
      }
      const allowed = new Set(payload.pieces.map((piece) => piece.id));
      for (const paragraph of result.paragraphs) {
        if (
          paragraph.sourcePieceIds.length === 0 ||
          paragraph.sourcePieceIds.some((id) => !allowed.has(id))
        ) {
          throw new Error('The story stepped outside the day. It was kept as a draft.');
        }
      }
      await setDayStory(
        payload.date,
        {
          heading: result.heading,
          paragraphs: result.paragraphs,
          form: payload.form,
          generatedAt: Date.now(),
        },
        payload.sourceHash,
      );
      await logMetric('story_success', payload.date);
      await enqueueInsights(payload.date);
      return result;
    }

    case 'insights': {
      const payload = job.payload as InsightsPayload;
      const result = await callAi({
        task: 'insights',
        input: {
          date: payload.date,
          pieces: payload.pieces,
          existingLabels: payload.existingLabels,
        },
      });
      if (result.task !== 'insights') throw new Error('Unexpected insights result.');
      const currentPieces = snapshotForAi(await listPieces(payload.date));
      if (storyHash(currentPieces) !== payload.sourceHash) {
        return { skipped: true };
      }
      const byId = new Map(payload.pieces.map((piece) => [piece.id, piece]));
      const incoming = new Map<string, { label: RibbonLabel; quote: string; pieceId: string }>();

      for (const ribbon of result.ribbons) {
        if (!validRibbonLabel(ribbon.label)) continue;
        const source = byId.get(ribbon.pieceId);
        if (!source) continue;
        const index = source.text.toLowerCase().indexOf(ribbon.quote.toLowerCase());
        if (index < 0) continue;
        const exactQuote = source.text.slice(index, index + ribbon.quote.length);
        incoming.set(`${ribbon.label}:${ribbon.pieceId}`, {
          label: ribbon.label,
          quote: exactQuote,
          pieceId: ribbon.pieceId,
        });
      }

      const existing = await listRibbons(payload.date);
      for (const ribbon of existing) {
        const source = byId.get(ribbon.pieceId);
        if (!source || !source.text.includes(ribbon.quote)) {
          await db.ribbons.delete(ribbon.id);
        }
      }

      for (const ribbon of incoming.values()) {
        await upsertRibbon({
          date: payload.date,
          label: ribbon.label,
          quote: ribbon.quote,
          pieceId: ribbon.pieceId,
          sourcePieceIds: [ribbon.pieceId],
          source: 'ai',
        });
      }

      const computed = await computeDaySignals(payload.date);
      const winningLabel =
        result.winningRibbon && validRibbonLabel(result.winningRibbon)
          ? result.winningRibbon
          : incoming.values().next().value?.label ?? null;
      await upsertSignals({
        ...computed,
        people: result.people.map((person) => person.trim()).filter(Boolean).slice(0, 8),
        places: result.places.map((place) => place.trim()).filter(Boolean).slice(0, 8),
        winningRibbon: winningLabel,
        winningRibbonStrength: winningLabel ? Math.max(0, Math.min(1, result.winningRibbonStrength)) : 0,
        updatedAt: Date.now(),
      });
      await logMetric('insights_success', payload.date);
      await recomputeRibbonRarity();
      return result;
    }

    case 'recap': {
      const payload = job.payload as RecapPayload;
      const result = await callAi({
        task: 'recap',
        input: { month: payload.month, bookName: payload.bookName, days: payload.days },
      });
      if (result.task !== 'recap') throw new Error('Unexpected recap result.');
      await saveRecap({
        month: payload.month,
        text: result.text,
        highlights: result.highlights,
        sourceHash: payload.sourceHash,
        generatedAt: Date.now(),
      });
      await logMetric('recap_success', `${payload.month}-01`);
      return result;
    }

    case 'vision': {
      const payload = job.payload as VisionPayload;
      const piece = await getPiece(payload.pieceId);
      if (!piece) return { skipped: true };
      const media = await getMedia(payload.mediaId);
      if (!media) throw new Error('The image is no longer here.');
      const imageBase64 = await blobToBase64(media.blob);
      const result = await callAi({
        task: 'vision',
        input: {
          date: payload.date,
          kind: payload.kind,
          imageBase64,
          mimeType: media.mimeType || (payload.kind === 'video' ? 'video/mp4' : 'image/jpeg'),
          caption: payload.caption,
        },
      });
      if (result.task !== 'vision') throw new Error('Unexpected vision result.');
      const latest = await getPiece(payload.pieceId);
      if (!latest) return { skipped: true };
      if (latest.originalText.trim() !== (payload.caption ?? '')) {
        return { skipped: true };
      }
      const caption = latest.originalText.trim();
      const text = caption ? `${caption}\n\n${result.description}` : result.description;
      await db.pieces.update(latest.id, {
        text,
        polishedText: undefined,
        polishStatus: 'polished',
        polishedAt: Date.now(),
        updatedAt: Date.now(),
      });
      await logMetric('vision_success', payload.date);
      await enqueueStory(payload.date, { force: true });
      await enqueueInsights(payload.date);
      return result;
    }

    default:
      return null;
  }
}

async function markJobFailure(job: AiJob, message: string): Promise<void> {
  if (job.task === 'polish') {
    const payload = job.payload as PolishPayload;
    await markPiecePolishStatus(payload.pieceId, 'error', message);
    await logMetric('polish_error', payload.date);
    await enqueueStory(payload.date, { force: true });
  } else if (job.task === 'vision') {
    const payload = job.payload as VisionPayload;
    await markPiecePolishStatus(payload.pieceId, 'error', message);
    await logMetric('vision_error', payload.date);
  } else if (job.task === 'story') {
    const payload = job.payload as StoryPayload;
    const day = await getDay(payload.date);
    if (day?.story && day.storySourceHash === payload.sourceHash) {
      await setStoryStatus(payload.date, 'ready');
    } else {
      await setStoryStatus(payload.date, 'error', message);
      await logMetric('story_error', payload.date);
    }
  } else if (job.task === 'insights') {
    const payload = job.payload as InsightsPayload;
    await db.kv.put({
      key: `insights:error:${payload.date}`,
      value: message,
      updatedAt: Date.now(),
    });
    await logMetric('insights_error', payload.date);
  } else if (job.task === 'recap') {
    const payload = job.payload as RecapPayload;
    await db.kv.put({
      key: `recap:error:${payload.month}`,
      value: message,
      updatedAt: Date.now(),
    });
    await logMetric('recap_error', `${payload.month}-01`);
  }
}

function isRateLimitError(error: unknown): boolean {
  return (
    error instanceof AiClientError &&
    (error.status === 429 || error.code === 'AI_RATE_LIMITED')
  );
}

function scheduleKick(delayMs: number): void {
  if (typeof window === 'undefined') return;
  if (retryTimer !== undefined) window.clearTimeout(retryTimer);
  retryTimer = window.setTimeout(() => {
    retryTimer = undefined;
    void kickQueue();
  }, delayMs);
}

function messageFor(error: unknown): string {
  if (error instanceof Error && error.name === 'AiClientError' && error.message) {
    return error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return 'The writing room is resting. Your words are safe.';
}

export async function kickQueue(): Promise<void> {
  if (running) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  const cooldown = rateLimitedUntil - Date.now();
  if (cooldown > 0) {
    scheduleKick(cooldown);
    return;
  }
  running = true;
  try {
    for (;;) {
      const job = await db.aiJobs.where('status').equals('queued').first();
      if (!job) break;
      await db.aiJobs.update(job.id, {
        status: 'running',
        attempts: job.attempts + 1,
        updatedAt: Date.now(),
      });
      try {
        const result = await runJob(job);
        await db.aiJobs.update(job.id, {
          status: 'done',
          result,
          lastError: undefined,
          completedAt: Date.now(),
          updatedAt: Date.now(),
        });
      } catch (error) {
        const message = messageFor(error);
        if (isRateLimitError(error) && job.attempts < MAX_RATE_LIMIT_ATTEMPTS) {
          rateLimitedUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
          await db.aiJobs.update(job.id, {
            status: 'queued',
            lastError: message,
            updatedAt: Date.now(),
          });
          scheduleKick(RATE_LIMIT_COOLDOWN_MS);
          break;
        }
        await db.aiJobs.update(job.id, {
          status: 'error',
          lastError: message,
          updatedAt: Date.now(),
        });
        await markJobFailure(job, message);
      }
    }
  } finally {
    running = false;
    const remaining = await db.aiJobs.where('status').equals('queued').count();
    if (remaining > 0 && rateLimitedUntil <= Date.now()) {
      scheduleKick(50);
    }
  }
}

export function startAiQueue(): void {
  if (started) return;
  started = true;
  const resume = () => void kickQueue();
  window.addEventListener('online', resume);
  window.addEventListener('focus', resume);
  void kickQueue();
}

export async function retryFailedJobs(): Promise<void> {
  const failed = await db.aiJobs.where('status').equals('error').toArray();
  await Promise.all(
    failed.map((job) =>
      db.aiJobs.update(job.id, { status: 'queued', lastError: undefined, updatedAt: Date.now() }),
    ),
  );
  void kickQueue();
}

export async function retryPiecePolish(pieceId: string): Promise<void> {
  await enqueuePolish(pieceId, { force: true });
}

export async function queueTodayIfNeeded(): Promise<void> {
  const date = dateKey();
  const pieces = await listPieces(date);
  if (pieces.length > 0) {
    const day = await getDay(date);
    if (day?.storyStatus === 'queued') await enqueueStory(date);
  }
}

export { todayKey };
