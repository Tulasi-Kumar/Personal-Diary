# Phase 5 — Day Story and Reader

| Field | Value |
|---|---|
| Status | Implemented |
| Depends on | Phase 4 |
| Unlocks | Phase 6 |
| PRD | DAY-01..09, ALL-01..06, AI-07..10 |
| Architecture | §8.4, §8.5, §9, §11 |
| Design | Day (story), Everything I wrote, source panel |

## Goal

Turn a day's polished pieces into a short, warm, first-person heading and story where every sentence can be traced back to the user's own writing.

**Phase gate:** the Day screen shows a heading and grounded story, every sentence opens a valid source passage, short days stay short, and the full polished writing is one tap away.

## In scope

- Story request/response contracts and prompt.
- Server-side citation validation.
- Client story job with an eight-second debounce and coalescing.
- Story hash and previous-story preservation.
- Day screen with heading, story, drop cap, and source links.
- Source passage panel.
- Everything I wrote screen.
- Add to this day link for today.
- Quiet updating, invalid, and unavailable states.

## Out of scope

- Past-day writing (Phase 6).
- Insights, moods, and ribbons (Phase 10).
- Media inline beyond a single optional photo placeholder.

## Deliverables

1. Story contract in `shared/ai-contracts.ts`.
2. Story prompt in `shared/prompts.ts`.
3. Server validation for `{ heading, story }`.
4. Story job orchestration and debounce.
5. `/day/:date` screen.
6. `/day/:date/all` screen.
7. Source panel sheet.
8. Tests for grounding, short days, and source lookup.

## Tasks

### 5.1 Contracts

- [ ] Define story input: ordered pieces with `id`, polished text (or raw), and optional media descriptions.
- [ ] Define story output: `{ heading: string, story: [{ text, sourcePieceIds }] }`.
- [ ] Require `heading` to be under eight words.
- [ ] Require every sentence to have at least one `sourcePieceIds` entry.
- [ ] Add a story cache key based on the ordered content hash and `promptVersion`.

### 5.2 Story prompt

- [ ] Write a short, warm, first-person story of about one page.
- [ ] Use three to four short paragraphs for a long day; fewer for a short day.
- [ ] A day with one short note gets one or two sentences, not padding.
- [ ] Use only what the pieces say.
- [ ] Cite at least one valid piece id per sentence.
- [ ] Never invent facts, feelings, or events.
- [ ] Return JSON only.

### 5.3 Server validation

- [ ] Remove `sourcePieceIds` that do not exist in the input.
- [ ] Drop sentences with no remaining valid source.
- [ ] Reject the entire result if more than one third of sentences are dropped.
- [ ] Reject an empty story or a missing heading.
- [ ] Retry once on invalid output, then return a typed failure.
- [ ] Never store the story server-side.

### 5.4 Story job

- [ ] Upsert a story job for the day with `runAfter = now + 8s`.
- [ ] Coalesce: move an existing queued job's `runAfter` forward instead of creating another.
- [ ] Trigger for today and for past days when they get a new piece.
- [ ] Compute `storyHash` from ordered pieces, media descriptions, and prompt version.
- [ ] Skip the call when `storyHash` matches `Day.storyHash`.
- [ ] On success, write the story and hash atomically.
- [ ] On failure, keep the previous story and retry later.
- [ ] Re-run insights only after a successful story (hook prepared, used in Phase 10).

### 5.5 Day screen

- [ ] Render the date, heading, and story.
- [ ] Use a drop cap for the first paragraph.
- [ ] Support one optional inline photo slot, reserved for Phase 8.
- [ ] Render each sentence as a tappable source link.
- [ ] Show "Read everything I wrote" and "Add to this day" at the bottom.
- [ ] For today, "Add to this day" routes to Home or the day write route.
- [ ] If there is no story yet, show the polished pieces quietly and a forming line.
- [ ] Show a quiet updating line while a story job is pending or running.
- [ ] Show the previous story during updates, never a blank page.

### 5.6 Source panel

- [ ] Open a soft sheet when a sentence is tapped.
- [ ] Show the source passage from the referenced piece(s).
- [ ] Show the piece timestamp and a link to open the full writing.
- [ ] Close on backdrop tap, Escape, and a close button.
- [ ] Trap focus while open.
- [ ] If a source is missing, show a quiet unavailable message and do not crash.

### 5.7 Everything I wrote

- [ ] Render polished pieces in chronological order.
- [ ] Show timestamps and hairline dividers.
- [ ] Show voice marks if the piece type is voice.
- [ ] Show media inline if present.
- [ ] Show "added later" where applicable.
- [ ] Add a "Back to the story" link.

### 5.8 States

- [ ] Empty day: quiet page with an Add action.
- [ ] Story forming: polished pieces plus a quiet line.
- [ ] Story updating: previous story remains; quiet line.
- [ ] Story invalid or unavailable: previous story remains; quiet retry.
- [ ] Source missing: quiet message in the panel.
- [ ] One short note: one- or two-sentence story.

### 5.9 Tests

- [ ] Contract test: valid story with citations passes.
- [ ] Contract test: invalid source ids are dropped.
- [ ] Contract test: more than one third invalid rejects the result.
- [ ] Unit test: story hash changes only when content changes.
- [ ] Integration test: debounce coalesces rapid pieces.
- [ ] Integration test: previous story is preserved on failure.
- [ ] Component test: sentence tap opens the correct source.
- [ ] E2E: add two pieces, wait, read story, open a source, open all writing.

## Technical notes

- Use polished text when present; fall back to raw text per piece.
- Send media descriptions only when non-empty.
- Do not regenerate the story for cache hits.
- Keep the previous story until a new valid story is stored.
- The heading must describe the day's real content, not a generic label.
- Never show moods, ribbons, places, or people on this screen.

## Acceptance criteria

- [ ] The Day screen shows a heading under eight words and a first-person story.
- [ ] Every sentence opens a source passage from a real piece.
- [ ] A day with one short note gets a one- or two-sentence story.
- [ ] No story sentence contains a fact absent from the pieces.
- [ ] The previous story remains visible during updates.
- [ ] Full polished writing is reachable in one tap.
- [ ] No insights or ribbons appear on Day or full-writing screens.
- [ ] Tests pass with mocked AI.

## Tests

- **Contract:** story validation and retry behavior.
- **Unit:** debounce, hash, and citation filtering.
- **Component:** source panel and sentence links.
- **E2E:** capture, story, source, full writing.

## Manual verification

1. Add a short note; wait for the story; confirm it is one or two sentences.
2. Add two more pieces; confirm the story updates quietly and the heading reflects the day.
3. Tap each sentence; confirm the source panel shows the right passage.
4. Tap "Read everything I wrote"; confirm chronological pieces and timestamps.
5. Turn off the network during an update; confirm the previous story remains readable.
6. Confirm no moods or ribbons appear anywhere on the Day screen.

## Handoff

Phase 6 adds Calendar and past-day writing. The story job and Day screen must already work for arbitrary `dayId` values.
