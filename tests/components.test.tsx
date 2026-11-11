import { useState, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Day } from '@shared/types';

vi.mock('../src/lib/ai/queue', () => ({
  enqueuePolish: vi.fn().mockResolvedValue(undefined),
  enqueueStory: vi.fn().mockResolvedValue(undefined),
  enqueueInsights: vi.fn().mockResolvedValue(undefined),
  enqueueRecap: vi.fn().mockResolvedValue(undefined),
  enqueueVision: vi.fn().mockResolvedValue(undefined),
  afterPieceChange: vi.fn().mockResolvedValue(undefined),
  kickQueue: vi.fn().mockResolvedValue(undefined),
  startAiQueue: vi.fn(),
  retryFailedJobs: vi.fn().mockResolvedValue(undefined),
  retryPiecePolish: vi.fn().mockResolvedValue(undefined),
  queueTodayIfNeeded: vi.fn().mockResolvedValue(undefined),
}));

import { enqueueStory } from '../src/lib/ai/queue';
import { Sheet } from '../src/components/Sheet';
import { ToastProvider } from '../src/components/Toast';
import { Composer } from '../src/features/day/Composer';
import { StoryCard } from '../src/features/day/StoryCard';
import { DayPage } from '../src/features/day/DayPage';
import { CalendarPage } from '../src/features/calendar/CalendarPage';
import { WhatsNextPage } from '../src/features/whats-next/WhatsNextPage';
import { GuidePage } from '../src/features/guide/GuidePage';
import { ReplayPage } from '../src/features/replay/ReplayPage';
import { resetDatabaseForTests } from '../src/lib/db/db';
import {
  addPiece,
  listFeatureVotes,
  listPieces,
  setDayStory,
} from '../src/lib/db/repositories';

const STORY_DATE = '2026-01-01';

function factDay(overrides: Partial<Day> = {}): Day {
  return {
    date: STORY_DATE,
    story: {
      heading: 'A quiet day',
      paragraphs: [
        { text: 'The rain stayed until noon.', sourcePieceIds: ['piece-1'] },
      ],
      generatedAt: Date.now(),
    },
    storyStatus: 'ready',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

function Providers({ children, route = '/' }: { children: ReactNode; route?: string }) {
  return (
    <ToastProvider>
      <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
    </ToastProvider>
  );
}

beforeEach(async () => {
  localStorage.clear();
  await resetDatabaseForTests();
  vi.clearAllMocks();
});

describe('sheets', () => {
  function SheetHarness() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Open the sheet
        </button>
        <Sheet open={open} onClose={() => setOpen(false)} title="A quiet sheet">
          <button type="button">Inside the sheet</button>
        </Sheet>
      </>
    );
  }

  it('moves focus into the sheet, closes with Escape, and restores focus', async () => {
    const user = userEvent.setup();
    render(
      <Providers>
        <SheetHarness />
      </Providers>,
    );

    const trigger = screen.getByRole('button', { name: 'Open the sheet' });
    await user.click(trigger);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('A quiet sheet')).toBeInTheDocument();
    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: 'Close' })).toHaveFocus(),
    );

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});

describe("what's next", () => {
  it('lists all thirteen features and keeps votes local', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(
      <Providers>
        <WhatsNextPage />
      </Providers>,
    );

    expect(await screen.findByText('Semantic search')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^I want / })).toHaveLength(13);

    await user.click(screen.getByRole('button', { name: 'I want Semantic search' }));
    const voted = await screen.findByRole('button', {
      name: 'Remove your interest in Semantic search',
    });
    expect(voted).toHaveTextContent('Wanted');
    expect(screen.getByText('1 on this device')).toBeInTheDocument();
    expect(await listFeatureVotes()).toHaveLength(1);
    expect(fetchMock).not.toHaveBeenCalled();

    await user.click(voted);
    await waitFor(async () => expect(await listFeatureVotes()).toHaveLength(0));

    vi.unstubAllGlobals();
  });
});

describe('guide', () => {
  it('explains every feature in plain words and links back to the book', async () => {
    render(
      <Providers>
        <GuidePage />
      </Providers>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'How DayBook works.' })).toBeInTheDocument();
    for (const title of [
      'Capture in seconds',
      'The polish',
      'The day’s story',
      'Calendar and marked days',
      'Memories that grow',
      'Gentle reminders',
      'Your data and your privacy',
      'What happens when AI is used',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument();
    }

    expect(
      screen.getByText('Two promises about every story: it only says what you wrote (no invented events, names, or feelings), and you can tap the sources of any paragraph to see exactly which pieces it came from.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Your book' })).toHaveAttribute('href', '/profile');
  });
});

describe('composer', () => {
  it('saves a text piece and clears the editor', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();

    render(
      <Providers>
        <Composer date={STORY_DATE} isToday onSaved={onSaved} />
      </Providers>,
    );

    const editor = screen.getByRole('textbox', { name: "Today's entry" });
    await user.type(editor, 'A small sentence.');
    await user.click(screen.getByRole('button', { name: 'Save piece' }));

    await waitFor(async () => expect(await listPieces(STORY_DATE)).toHaveLength(1));
    await waitFor(() => expect(editor).toHaveValue(''));
    expect(onSaved).toHaveBeenCalled();
  });
});

describe('story card', () => {
  it('links a ready story to its day and offers a quiet retry on error', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Providers>
        <StoryCard day={factDay()} pieceCount={1} />
      </Providers>,
    );

    expect(screen.getByRole('heading', { name: 'A quiet day' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Read the day/ })).toHaveAttribute(
      'href',
      `/day/${STORY_DATE}`,
    );

    vi.mocked(enqueueStory).mockClear();
    rerender(
      <Providers>
        <StoryCard day={factDay({ story: undefined, storyStatus: 'error' })} pieceCount={1} />
      </Providers>,
    );

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(enqueueStory).toHaveBeenCalledWith(STORY_DATE, { force: true });
  });
});

describe('day reader', () => {
  it('keeps every story sentence traceable to the source piece', async () => {
    const user = userEvent.setup();
    const piece = await addPiece({
      date: STORY_DATE,
      kind: 'text',
      text: 'The rain stayed until noon. Then it left.',
    });
    await setDayStory(
      STORY_DATE,
      {
        heading: 'A quiet day',
        paragraphs: [
          { text: 'The rain stayed until noon.', sourcePieceIds: [piece.id] },
        ],
        generatedAt: Date.now(),
      },
      'source-hash',
    );

    render(
      <Providers route={`/day/${STORY_DATE}`}>
        <Routes>
          <Route path="/day/:date" element={<DayPage />} />
        </Routes>
      </Providers>,
    );

    expect(await screen.findByRole('heading', { name: 'A quiet day' })).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'From your words' }));

    const sources = await screen.findByRole('list');
    expect(
      within(sources).getByText('The rain stayed until noon. Then it left.'),
    ).toBeInTheDocument();
  });
});

describe('calendar', () => {
  it('marks a day with writing in the month grid', async () => {
    await addPiece({ date: '2025-03-15', kind: 'text', text: 'A day in March.' });

    render(
      <Providers route="/calendar?month=2025-03">
        <Routes>
          <Route path="/calendar" element={<CalendarPage />} />
        </Routes>
      </Providers>,
    );

    expect(await screen.findByRole('heading', { name: 'March 2025' })).toBeInTheDocument();
    expect(
      await screen.findByRole('link', { name: /15 March 2025, has writing/ }),
    ).toBeInTheDocument();
  });
});

describe('replay', () => {
  it('replays a text-only day and closes with Escape', async () => {
    const user = userEvent.setup();
    const piece = await addPiece({
      date: STORY_DATE,
      kind: 'text',
      text: 'The rain stayed until noon.',
    });
    await setDayStory(
      STORY_DATE,
      {
        heading: 'A quiet day',
        paragraphs: [
          {
            text: 'The rain stayed until noon. Then it left.',
            sourcePieceIds: [piece.id],
          },
        ],
        generatedAt: Date.now(),
      },
      'source-hash',
    );

    render(
      <Providers route={`/day/${STORY_DATE}/replay`}>
        <Routes>
          <Route path="/day/:date/replay" element={<ReplayPage />} />
          <Route path="/day/:date" element={<div>The day page</div>} />
        </Routes>
      </Providers>,
    );

    const dialog = await screen.findByRole('dialog', { name: 'Day replay' });
    expect(
      within(dialog).getByText('The rain stayed until noon.', { selector: '.replay__text' }),
    ).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
