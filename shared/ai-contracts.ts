import { z } from 'zod';
import { RIBBON_LABELS } from './ribbon-labels.js';

export { RIBBON_LABELS };

export const RibbonLabelSchema = z.enum(RIBBON_LABELS);

const pieceForAi = z.object({
  id: z.string().min(1),
  text: z.string().min(1).max(6000),
  kind: z.enum(['text', 'voice', 'photo', 'video']),
  createdAt: z.number().int().nonnegative(),
});

const pieceForStory = z.object({
  id: z.string().min(1),
  text: z.string().min(1).max(6000),
  kind: z.enum(['text', 'voice', 'photo', 'video']),
  createdAt: z.number().int().nonnegative(),
});

export const AiRequestSchema = z.discriminatedUnion('task', [
  z.object({
    task: z.literal('polish'),
    input: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      text: z.string().min(1).max(6000),
      kind: z.enum(['text', 'voice']),
    }),
  }),
  z.object({
    task: z.literal('story'),
    input: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      bookName: z.string().min(1).max(80),
      pieces: z.array(pieceForStory).min(1).max(60),
    }),
  }),
  z.object({
    task: z.literal('insights'),
    input: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      pieces: z.array(pieceForAi).min(1).max(60),
      existingLabels: z.array(RibbonLabelSchema).max(12).optional(),
    }),
  }),
  z.object({
    task: z.literal('recap'),
    input: z.object({
      month: z.string().regex(/^\d{4}-\d{2}$/),
      bookName: z.string().min(1).max(80),
      days: z
        .array(
          z.object({
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            heading: z.string().max(120).optional(),
            storyText: z.string().max(4000).optional(),
            pieces: z.array(pieceForAi).max(40),
          }),
        )
        .min(1)
        .max(31),
    }),
  }),
  z.object({
    task: z.literal('vision'),
    input: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      kind: z.enum(['photo', 'video']),
      imageBase64: z.string().min(20).max(8_000_000),
      mimeType: z.string().min(3).max(80),
      caption: z.string().max(200).optional(),
    }),
  }),
]);

export type AiRequest = z.infer<typeof AiRequestSchema>;

export const PolishResultSchema = z.object({
  task: z.literal('polish'),
  polishedText: z.string().min(1).max(12_000),
});

export const StoryResultSchema = z.object({
  task: z.literal('story'),
  heading: z.string().min(1).max(120),
  paragraphs: z
    .array(
      z.object({
        text: z.string().min(1).max(4000),
        sourcePieceIds: z.array(z.string().min(1)).min(1),
      }),
    )
    .min(1)
    .max(12),
});

export const InsightsResultSchema = z.object({
  task: z.literal('insights'),
  people: z.array(z.string().min(1).max(40)).max(8),
  places: z.array(z.string().min(1).max(60)).max(8),
  winningRibbon: RibbonLabelSchema.nullable(),
  winningRibbonStrength: z.number().min(0).max(1),
  ribbons: z
    .array(
      z.object({
        label: RibbonLabelSchema,
        quote: z.string().min(1).max(300),
        pieceId: z.string().min(1),
      }),
    )
    .max(6),
});

export const RecapResultSchema = z.object({
  task: z.literal('recap'),
  text: z.string().min(1).max(6000),
  highlights: z.array(z.string().min(1).max(300)).max(6),
});

export const VisionResultSchema = z.object({
  task: z.literal('vision'),
  description: z.string().min(1).max(800),
});

export const AiResultSchema = z.discriminatedUnion('task', [
  PolishResultSchema,
  StoryResultSchema,
  InsightsResultSchema,
  RecapResultSchema,
  VisionResultSchema,
]);

export type AiResult = z.infer<typeof AiResultSchema>;

export type AiErrorCode =
  | 'AI_UNAVAILABLE'
  | 'AI_RATE_LIMITED'
  | 'AI_UPSTREAM'
  | 'AI_INVALID_REQUEST'
  | 'AI_INVALID_RESPONSE'
  | 'AI_TIMEOUT';

export interface AiErrorBody {
  error: {
    code: AiErrorCode;
    message: string;
  };
}

export function isAiErrorBody(value: unknown): value is AiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as { error?: unknown }).error === 'object'
  );
}

export function resultForTask(request: AiRequest, raw: unknown): AiResult {
  const withTask =
    typeof raw === 'object' && raw !== null && !Array.isArray(raw)
      ? { ...(raw as Record<string, unknown>), task: request.task }
      : raw;
  const parsed = (() => {
    switch (request.task) {
      case 'polish':
        return PolishResultSchema.parse(withTask);
      case 'story':
        return StoryResultSchema.parse(withTask);
      case 'insights':
        return InsightsResultSchema.parse(withTask);
      case 'recap':
        return RecapResultSchema.parse(withTask);
      case 'vision':
        return VisionResultSchema.parse(withTask);
    }
  })();
  return parsed;
}
