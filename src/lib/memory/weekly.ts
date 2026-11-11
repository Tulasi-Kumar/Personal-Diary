import type { Day } from '@shared/types';
import { db } from '../db/db';
import { dateKey, todayKey } from '../db/dates';
import { firstSentence } from './sections';

export interface WeekHighlight {
  date: string;
  quote: string;
}

export interface WeekLetter {
  paragraphs: string[];
  highlights: WeekHighlight[];
  hasMaterial: boolean;
}

function storySentences(day: Day): string[] {
  return (day.story?.paragraphs ?? [])
    .flatMap((paragraph) => paragraph.text.split(/(?<=[.!?])\s+/))
    .map((sentence) => sentence.trim().replace(/^["“]|["”]$/g, ''))
    .filter((sentence) => sentence.length > 12);
}

export function buildWeekLetter(days: Day[], startKey: string): WeekLetter {
  const ready = days
    .filter(
      (day) =>
        day.date >= startKey && day.storyStatus === 'ready' && Boolean(day.story),
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  const picks: WeekHighlight[] = [];
  for (const day of ready) {
    const sentences = storySentences(day);
    const quote = sentences[0] ?? firstSentence(day.story?.paragraphs[0]?.text ?? '');
    if (quote) picks.push({ date: day.date, quote });
    if (picks.length >= 3) break;
  }

  if (picks.length === 0) {
    return { paragraphs: [], highlights: [], hasMaterial: false };
  }

  const first = picks[0];
  const middle = picks[1];
  const last = picks[picks.length - 1];

  const opening = first.quote;
  const continuation = middle && middle.quote !== first.quote ? ` ${middle.quote}` : '';
  const closing =
    last.quote !== first.quote && last.quote !== middle?.quote
      ? ` ${last.quote}`
      : '';

  const secondParagraph =
    picks.length > 1
      ? 'A week is made of these small returns. I want to keep the ordinary ones close, the way you keep a receipt in a coat pocket.'
      : 'One page was enough to hold the week. I want to keep it close.';

  return {
    paragraphs: [`${opening}${continuation}${closing}`, secondParagraph],
    highlights: picks,
    hasMaterial: true,
  };
}

export async function loadWeekLetter(): Promise<WeekLetter> {
  const today = todayKey();
  const start = new Date();
  const monday = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const day = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - day);
  const startKey = dateKey(monday);
  const days = await db.days.where('date').between(startKey, today, true, true).toArray();
  return buildWeekLetter(days, startKey);
}
