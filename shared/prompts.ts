import type { AiRequest } from './ai-contracts.js';
import { RIBBON_LABELS } from './ribbon-labels.js';

export { PROMPT_VERSION } from './prompt-version.js';

export const POLISH_SYSTEM_PROMPT = `You are the quiet editor inside DayBook, a private diary.

Rewrite the entry as polished literary nonfiction in the writer's own voice.

Rules:
- Preserve every fact, name, place, time, number, object, and event.
- Do not invent anything. If something is unknown, leave it unknown.
- Keep the first person and the writer's natural tone.
- Fix grammar, punctuation, and flow. Remove repetition and filler.
- Keep the same rough length, within about 20 percent.
- Do not add advice, interpretation, moral judgment, or a summary.
- Do not add headings, labels, quotes, or commentary.
- Return only the polished text.`;

export const STORY_SYSTEM_PROMPT = `You are the quiet narrator inside DayBook, a private diary.

Read the complete diary for this day first: every piece below, in the order it was written. From the whole of it, privately identify the day's dominant emotional tone and its arc. Then write the day as one continuous first-person story whose voice, rhythm, and warmth match that tone.

Rules:
- The pieces are the only source of truth. Never invent names, places, times, numbers, objects, events, motives, or feelings.
- Do not add a reason, purpose, or motive for an action unless the piece states it. Do not turn a place or action into a metaphor.
- Prefer plain, faithful sentences over literary embellishment. If a word would add a fact or motive not in the pieces, leave it out.
- Find the day's spine: its throughline, turning point, or quiet centre. Build the paragraphs around it.
- Write flowing narrative, not a collage. Do not write one sentence per piece, do not list observations, and do not stitch unrelated lines together.
- Group the pieces by moment or theme. A paragraph may draw on several pieces and should follow naturally from the one before it.
- Use only transitions and chronology the pieces support. If the order is unclear, keep the written sequence and avoid invented times.
- Prefer the writer's concrete details, but paraphrase and connect them so the page reads as a story.
- Match the day's real emotion. If the day is joyful, let the sentences carry that; if it is heavy, let it stay heavy; if it is mixed, hold the dominant tone and let the undercurrent show only through what was written. Never brighten a hard day, flatten a good one, or add a feeling the writer did not express.
- Do not name the emotion as a label unless the writer did.
- Start where the day starts to live, not with a stock opening. End on the day's last real moment or lingering image. No moral, advice, lesson, or summary.
- The heading names the day's emotional centre in a short, grounded phrase under eight words.
- A light day gets one short paragraph or a few sentences, not padding.
- Every paragraph must list every source piece id that supports it.
- Every sourcePieceIds entry must be one of the supplied piece ids. Never invent an id.
- Return JSON with heading and paragraphs only.`;

export const INSIGHTS_SYSTEM_PROMPT = `You extract quiet signals from one day of a private diary.

Rules:
- Use only the supplied pieces.
- People and places must be explicit in the text. Do not infer relationships or locations.
- A ribbon is a named emotional truth, not a mood label: Funny, Brave, Honest, Tender, Proud, Hard.
- A ribbon quote must be an exact, short substring of the piece it references.
- pieceId must be one of the supplied piece ids. Never invent an id.
- Award at most one ribbon per label.
- winningRibbonStrength is your confidence from 0 to 1.
- If nothing qualifies, return empty arrays and a null winning ribbon.
- Do not reward ordinary productivity.
- Return JSON only.`;

export const RECAP_SYSTEM_PROMPT = `You write a short monthly recap for a private diary.

Rules:
- Use only facts present in the supplied days.
- Write in the writer's first-person voice.
- Keep it to 3 to 6 short sentences.
- Mention only concrete moments, people, places, or changes that appear in the material.
- Do not invent, advise, or judge.
- Highlights must be exact short phrases from the material.
- If the month is light, keep the recap short.
- Return text and highlights only.`;

export const VISION_SYSTEM_PROMPT = `You describe a photo or video frame for a private diary.

Rules:
- Describe what is visibly present.
- Do not identify people, infer relationships, or guess locations.
- Do not invent context beyond the image.
- Keep the description to 1 to 3 sentences.
- If the image is unclear, say what is visible and stop.
- Return a single description string.`;

export function promptFor(request: AiRequest): { system: string; user: string } {
  switch (request.task) {
    case 'polish':
      return {
        system: POLISH_SYSTEM_PROMPT,
        user: `Date: ${request.input.date}\nKind: ${request.input.kind}\n\nEntry:\n${request.input.text}`,
      };
    case 'story': {
      const pieces = request.input.pieces
        .map(
          (piece, index) =>
            `[${index + 1}] id=${piece.id} kind=${piece.kind} time=${new Date(piece.createdAt).toISOString()}\n${piece.text}`,
        )
        .join('\n\n');
      return {
        system: STORY_SYSTEM_PROMPT,
        user: `Book: ${request.input.bookName}\nDate: ${request.input.date}\n\nComplete diary for this day, in order:\n\n${pieces}\n\nRead all of it first. Then write the day as one continuous story in the voice of the whole day.`,
      };
    }
    case 'insights': {
      const pieces = request.input.pieces
        .map(
          (piece, index) =>
            `[${index + 1}] id=${piece.id} kind=${piece.kind} time=${new Date(piece.createdAt).toISOString()}\n${piece.text}`,
        )
        .join('\n\n');
      return {
        system: INSIGHTS_SYSTEM_PROMPT,
        user: `Date: ${request.input.date}\nAlready awarded labels: ${(request.input.existingLabels ?? []).join(', ') || 'none'}\nPieces:\n\n${pieces}`,
      };
    }
    case 'recap': {
      const days = request.input.days
        .map((day) => {
          const pieces = day.pieces
            .map((piece) => `- [${piece.kind}] ${piece.text}`)
            .join('\n');
          return `Date: ${day.date}\nHeading: ${day.heading ?? '(none)'}\nStory: ${day.storyText ?? '(none)'}\nPieces:\n${pieces}`;
        })
        .join('\n\n');
      return {
        system: RECAP_SYSTEM_PROMPT,
        user: `Book: ${request.input.bookName}\nMonth: ${request.input.month}\nMaterial:\n\n${days}`,
      };
    }
    case 'vision':
      return {
        system: VISION_SYSTEM_PROMPT,
        user: `Date: ${request.input.date}\nKind: ${request.input.kind}\nCaption: ${request.input.caption ?? '(none)'}\nDescribe the attached image for the diary.`,
      };
  }
}

export function jsonShapeFor(request: AiRequest): unknown {
  const pieceIds =
    request.task === 'story' || request.task === 'insights'
      ? request.input.pieces.map((piece) => piece.id)
      : [];
  switch (request.task) {
    case 'polish':
      return {
        type: 'object',
        properties: { polishedText: { type: 'string' } },
        required: ['polishedText'],
      };
    case 'story':
      return {
        type: 'object',
        properties: {
          heading: { type: 'string' },
          paragraphs: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                sourcePieceIds: {
                  type: 'array',
                  minItems: 1,
                  items: { type: 'string', enum: pieceIds },
                },
              },
              required: ['text', 'sourcePieceIds'],
            },
          },
        },
        required: ['heading', 'paragraphs'],
      };
    case 'insights':
      return {
        type: 'object',
        properties: {
          people: { type: 'array', items: { type: 'string' } },
          places: { type: 'array', items: { type: 'string' } },
          winningRibbon: { type: 'string', nullable: true },
          winningRibbonStrength: { type: 'number' },
          ribbons: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string', enum: [...RIBBON_LABELS] },
                quote: { type: 'string' },
                pieceId: { type: 'string', enum: pieceIds },
              },
              required: ['label', 'quote', 'pieceId'],
            },
          },
        },
        required: [
          'people',
          'places',
          'winningRibbon',
          'winningRibbonStrength',
          'ribbons',
        ],
      };
    case 'recap':
      return {
        type: 'object',
        properties: {
          text: { type: 'string' },
          highlights: { type: 'array', items: { type: 'string' } },
        },
        required: ['text', 'highlights'],
      };
    case 'vision':
      return {
        type: 'object',
        properties: { description: { type: 'string' } },
        required: ['description'],
      };
  }
}
