import type { KvEntry } from '@shared/types';
import { db } from '../db/db';
import { clamp01 } from './readiness';

export type InteractionKind =
  | 'day-open'
  | 'story-read'
  | 'source-tap'
  | 'replay-start'
  | 'replay-complete'
  | 'recap-highlight';

export interface InteractionEvent {
  kind: InteractionKind;
  at: number;
}

const HALF_LIFE_DAYS = 30;
const DAY_MS = 86_400_000;

function interactionKey(date: string): string {
  return `interactions:${date}`;
}

export async function recordInteraction(date: string, kind: InteractionKind): Promise<void> {
  const entry = (await db.kv.get(interactionKey(date))) as KvEntry | undefined;
  const existing = Array.isArray(entry?.value) ? (entry.value as InteractionEvent[]) : [];
  const now = Date.now();
  const next = [...existing, { kind, at: now }].slice(-160);
  await db.kv.put({ key: interactionKey(date), value: next, updatedAt: now });
  await db.daySignals.delete(date);
}

export async function interactionEvents(date: string): Promise<InteractionEvent[]> {
  const entry = await db.kv.get(interactionKey(date));
  if (!entry || !Array.isArray(entry.value)) return [];
  return (entry.value as InteractionEvent[]).filter(
    (event) =>
      typeof event === 'object' &&
      event !== null &&
      typeof event.at === 'number' &&
      typeof event.kind === 'string',
  );
}

export function decayedInteractionScore(events: InteractionEvent[], now = Date.now()): number {
  if (events.length === 0) return 0;
  const weight = events.reduce((sum, event) => {
    const ageDays = Math.max(0, now - event.at) / DAY_MS;
    const recency = Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
    const kindWeight =
      event.kind === 'story-read'
        ? 1
        : event.kind === 'replay-complete'
          ? 0.9
          : event.kind === 'replay-start'
            ? 0.6
            : 0.5;
    return sum + recency * kindWeight;
  }, 0);
  return clamp01(weight / 3);
}

export async function clearInteractions(): Promise<void> {
  await db.kv.where('key').startsWith('interactions:').delete();
}
