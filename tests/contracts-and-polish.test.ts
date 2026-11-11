import { beforeEach, describe, expect, it } from 'vitest';
import { AiRequestSchema, AiResultSchema, resultForTask } from '@shared/ai-contracts';
import { jsonShapeFor, promptFor } from '@shared/prompts';
import { resetDatabaseForTests } from '../src/lib/db/db';
import { addPiece, applyPolish, undoPolish } from '../src/lib/db/repositories';

describe('AI contracts', () => {
  it('accepts a grounded story request and result', () => {
    const request = {
      task: 'story',
      input: {
        date: '2026-01-01',
        bookName: 'My DayBook',
        pieces: [
          { id: 'piece-1', text: 'It rained.', kind: 'text', createdAt: 1 },
        ],
      },
    };
    expect(AiRequestSchema.safeParse(request).success).toBe(true);
    expect(
      AiResultSchema.safeParse({
        task: 'story',
        heading: 'Rain',
        paragraphs: [{ text: 'It rained.', sourcePieceIds: ['piece-1'] }],
      }).success,
    ).toBe(true);
  });

  it('asks for one coherent story in the tone of the whole day', () => {
    const prompt = promptFor({
      task: 'story',
      input: {
        date: '2026-01-01',
        bookName: 'My DayBook',
        pieces: [
          { id: 'piece-1', text: 'It rained.', kind: 'text', createdAt: 1 },
          { id: 'piece-2', text: 'I stayed in and read.', kind: 'text', createdAt: 2 },
        ],
      },
    });
    expect(prompt.system).toContain('dominant emotional tone');
    expect(prompt.system).toContain('one continuous first-person story');
    expect(prompt.system).toContain('not a collage');
    expect(prompt.system).toContain('Do not add a reason, purpose, or motive');
    expect(prompt.user).toContain('Complete diary for this day');
    expect(prompt.user).toContain('id=piece-1');
    expect(prompt.user).toContain('id=piece-2');
  });

  it('scales the page by form: crisp while the day is live, full once it is over', () => {
    const base = {
      date: '2026-01-01',
      bookName: 'My DayBook',
      pieces: [
        { id: 'piece-1', text: 'It rained.', kind: 'text' as const, createdAt: 1 },
        { id: 'piece-2', text: 'I stayed in and read.', kind: 'text' as const, createdAt: 2 },
      ],
    };
    const crisp = promptFor({ task: 'story', input: base });
    const full = promptFor({ task: 'story', input: { ...base, form: 'full' } });

    expect(crisp.system).toContain('short, crisp');
    expect(crisp.system).toContain('around 100 words');
    expect(crisp.user).toContain('short, crisp page of the day so far');
    expect(full.system).toContain('1000 to 1500 words');
    expect(full.system).toContain('Scale honestly to the available input');
    expect(full.user).toContain('complete page of the finished day');
  });

  it('restricts story source ids to the supplied pieces', () => {
    const shape = jsonShapeFor({
      task: 'story',
      input: {
        date: '2026-01-01',
        bookName: 'My DayBook',
        pieces: [
          { id: 'piece-1', text: 'It rained.', kind: 'text', createdAt: 1 },
          { id: 'piece-2', text: 'I stayed in.', kind: 'text', createdAt: 2 },
        ],
      },
    }) as {
      properties: {
        paragraphs: {
          items: {
            properties: {
              sourcePieceIds: { items: { enum: string[] } };
            };
          };
        };
      };
    };

    expect(
      shape.properties.paragraphs.items.properties.sourcePieceIds.items.enum,
    ).toEqual(['piece-1', 'piece-2']);
  });

  it('restricts insight ribbons to supplied labels and pieces', () => {
    const shape = jsonShapeFor({
      task: 'insights',
      input: {
        date: '2026-01-01',
        pieces: [{ id: 'piece-1', text: 'It rained.', kind: 'text', createdAt: 1 }],
      },
    }) as {
      properties: {
        ribbons: {
          items: {
            properties: {
              label: { enum: string[] };
              pieceId: { enum: string[] };
            };
          };
        };
      };
    };

    expect(shape.properties.ribbons.items.properties.label.enum).toContain('Funny');
    expect(shape.properties.ribbons.items.properties.pieceId.enum).toEqual(['piece-1']);
  });

  it('stamps the task onto model-shaped results', () => {
    const piece = { id: 'piece-1', text: 'It rained.', kind: 'text' as const, createdAt: 1 };

    const polish = resultForTask(
      { task: 'polish', input: { date: '2026-01-01', text: 'It rained.', kind: 'text' } },
      { polishedText: 'It rained.' },
    );
    expect(polish).toEqual({ task: 'polish', polishedText: 'It rained.' });

    const story = resultForTask(
      { task: 'story', input: { date: '2026-01-01', bookName: 'My DayBook', pieces: [piece] } },
      { heading: 'Rain', paragraphs: [{ text: 'It rained.', sourcePieceIds: ['piece-1'] }] },
    );
    expect(story.task).toBe('story');

    const insights = resultForTask(
      { task: 'insights', input: { date: '2026-01-01', pieces: [piece] } },
      { people: [], places: [], winningRibbon: null, winningRibbonStrength: 0, ribbons: [] },
    );
    expect(insights.task).toBe('insights');
    expect(
      AiResultSchema.safeParse({
        people: [],
        places: [],
        winningRibbon: null,
        winningRibbonStrength: 0,
        ribbons: [],
      }).success,
    ).toBe(false);
  });

  it('rejects requests and results that drift from the contract', () => {
    expect(
      AiRequestSchema.safeParse({
        task: 'story',
        input: { date: '01/01/2026', bookName: '', pieces: [] },
      }).success,
    ).toBe(false);
    expect(
      AiResultSchema.safeParse({
        task: 'story',
        heading: 'Rain',
        paragraphs: [{ text: 'It rained.', sourcePieceIds: [] }],
      }).success,
    ).toBe(false);
    expect(
      AiResultSchema.safeParse({
        task: 'polish',
        polishedText: '',
      }).success,
    ).toBe(false);
  });
});

describe('polish and exact undo', () => {
  beforeEach(async () => {
    await resetDatabaseForTests();
  });

  it('keeps the original words and restores them exactly', async () => {
    const original = 'i went  to the  bakery and it was closed';
    const piece = await addPiece({ date: '2026-01-01', kind: 'text', text: original });

    const polished = await applyPolish(piece.id, 'I went to the bakery, and it was closed.');
    expect(polished?.text).toBe('I went to the bakery, and it was closed.');
    expect(polished?.originalText).toBe(original);

    const restored = await undoPolish(piece.id);
    expect(restored?.text).toBe(original);
    expect(restored?.originalText).toBe(original);
    expect(restored?.polishedText).toBeUndefined();
    expect(restored?.polishStatus).toBe('raw');
  });
});
