import type { Settings } from '@shared/types';
import { db } from './db/db';
import { dateKey } from './db/dates';
import { getDay, kvGet, kvSet, listPieces } from './db/repositories';
import { findThrowback } from './memory/throwback';
import { computeReadinessCached } from './memory/readiness';

export type NotificationKind = 'reminder' | 'throwback' | 'ribbon';

export interface NotificationEvent {
  id: string;
  kind: NotificationKind;
  message: string;
  detail: string;
  actionLabel: string;
  to: string;
  dayDate?: string;
  ribbonId?: string;
}

const sessionDismissed = new Set<string>();

export function dismissInSession(id: string): void {
  sessionDismissed.add(id);
}

export function isDismissedInSession(id: string): boolean {
  return sessionDismissed.has(id);
}

export function resetSessionDismissals(): void {
  sessionDismissed.clear();
}

function validReminderTime(value: string | null | undefined): number | null {
  if (!value) return null;
  if (!/^\d{2}:\d{2}$/.test(value)) return null;
  const [hour, minute] = value.split(':').map(Number);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
}

export async function nextNotification(
  settings: Settings,
  now = new Date(),
): Promise<NotificationEvent | null> {
  const today = dateKey(now);

  if (settings.reminderEnabled) {
    const reminderMinutes = validReminderTime(settings.reminderTime);
    if (reminderMinutes !== null) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      if (currentMinutes >= reminderMinutes) {
        const dismissed = await kvGet<boolean>(`reminder:dismissed:${today}`);
        if (!dismissed) {
          const pieces = await listPieces(today);
          if (pieces.length === 0) {
            return {
              id: `reminder:${today}`,
              kind: 'reminder',
              message: 'The page is still open.',
              detail: 'A sentence is enough for today.',
              actionLabel: 'Write',
              to: '/',
              dayDate: today,
            };
          }
        }
      }
    }
  }

  if (!settings.memoryNotifications) return null;

  const [pieces, days, ribbons, recaps, signals] = await Promise.all([
    db.pieces.toArray(),
    db.days.toArray(),
    db.ribbons.toArray(),
    db.recaps.toArray(),
    db.daySignals.toArray(),
  ]);
  const readiness = await computeReadinessCached({
    pieces,
    days,
    ribbons,
    recaps,
    signals,
    demoLoaded: settings.demoLoaded ?? false,
  });
  if (readiness.level === 'forming') return null;

  const throwback = await findThrowback(today);
  if (throwback && throwback.yearsAgo >= 1) {
    const id = `throwback:${throwback.date}`;
    if (!isDismissedInSession(id)) {
      const day = await getDay(throwback.date);
      if (day?.story) {
        const label =
          throwback.yearsAgo === 1 ? 'One year ago today' : `${throwback.yearsAgo} years ago today`;
        return {
          id,
          kind: 'throwback',
          message: label,
          detail: day.heading ?? day.story.heading,
          actionLabel: 'Return',
          to: `/day/${throwback.date}`,
          dayDate: throwback.date,
        };
      }
    }
  }

  const cutoff = now.getTime() - 86_400_000;
  const recentRibbons = await db.ribbons
    .filter((ribbon) => ribbon.awardedAt >= cutoff)
    .toArray();
  recentRibbons.sort((a, b) => b.awardedAt - a.awardedAt);
  for (const ribbon of recentRibbons) {
    const id = `ribbon:${ribbon.id}`;
    if (isDismissedInSession(id)) continue;
    const seen = await kvGet<boolean>(`ribbon:seen:${ribbon.id}`);
    if (seen) continue;
    const day = await getDay(ribbon.date);
    if (!day?.story) continue;
    return {
      id,
      kind: 'ribbon',
      message: ribbon.label,
      detail: day.heading ?? day.story.heading,
      actionLabel: 'See why',
      to: `/memories?mark=${encodeURIComponent(ribbon.id)}`,
      dayDate: ribbon.date,
      ribbonId: ribbon.id,
    };
  }

  return null;
}

export async function consumeNotification(event: NotificationEvent): Promise<void> {
  dismissInSession(event.id);
  if (event.kind === 'reminder' && event.dayDate) {
    await kvSet(`reminder:dismissed:${event.dayDate}`, true);
  }
  if (event.kind === 'ribbon' && event.ribbonId) {
    await kvSet(`ribbon:seen:${event.ribbonId}`, true);
  }
}
