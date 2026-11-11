# Phase 3 — Home and Text Capture

| Field | Value |
|---|---|
| Status | Implemented |
| Depends on | Phase 2 |
| Unlocks | Phase 4 |
| PRD | HOME-01..12, GEN-02..04, NFR-01..03 |
| Architecture | §5, §6, §8.1, §15 |
| Design | Home, writing surface, capture bar |

## Goal

Make today's page a real, fast writing surface. The user can add text pieces in seconds, see earlier pieces from the day, and trust that everything persists.

**Phase gate:** a text piece can be added in under five seconds, persists across reload, and appears in the correct order. No AI is required yet.

## In scope

- Today's page with local date.
- Blank writing surface and placeholder.
- Slim capture bar with type, speak, photo, video, and Add.
- Text piece creation and immediate rendering.
- Earlier pieces as quiet collapsed entries with timestamps.
- Expand/collapse of earlier pieces.
- Empty state.
- Save metrics for capture latency.
- Live queries from Dexie.

## Out of scope

- AI polish and story updates.
- Voice recording, media upload, calendar, memories.
- Editing a saved piece. Undo polish arrives in Phase 4.

## Deliverables

1. `/` Home screen with paper layout.
2. `CaptureBar` component with capture modes.
3. `PieceCard` / collapsed piece row.
4. Text editor with soft cursor and placeholder.
5. Repository wiring for add/list.
6. Empty and loading states.
7. Tests for adding, ordering, persistence, and expand/collapse.

## Tasks

### 3.1 Home screen

- [ ] Render today's local date at the top using `todayId()`.
- [ ] Show a quiet serif date label and the book name if space allows.
- [ ] Render the writing surface with the placeholder "What happened today?"
- [ ] Render earlier pieces from today above the active writing area.
- [ ] Keep the page calm: no cards, stats, prompts, or onboarding.
- [ ] Reserve space for the capture bar above the bottom nav.

### 3.2 Capture bar

- [ ] Add type, speak, photo, video, and Add controls.
- [ ] Use thin line icons and accessible labels.
- [ ] Type focuses the editor.
- [ ] Speak, photo, and video can be placeholders in this phase but must not break.
- [ ] Add is disabled when the text is empty.
- [ ] Add saves on tap and on the keyboard shortcut appropriate to the platform.
- [ ] Keep the bar slim and fixed above the bottom navigation.

### 3.3 Text piece creation

- [ ] On Add, trim whitespace but preserve internal line breaks.
- [ ] Call `addPiece` with `type: 'text'`, `dayId: todayId()`, and `rawText`.
- [ ] Use `getOrCreateDay` in the same transaction.
- [ ] Clear the editor after a successful save.
- [ ] Keep the new piece visible immediately through a live query.
- [ ] If the write fails, keep the text in the editor and show a quiet inline error.

### 3.4 Piece display

- [ ] Show the active/new piece as readable serif text.
- [ ] Show earlier pieces collapsed with a timestamp.
- [ ] Add a hairline divider between pieces.
- [ ] Tapping a collapsed piece expands it; tapping again collapses it.
- [ ] Keep the most recent piece expanded by default.
- [ ] Display `polishedText` when present, otherwise `rawText`.
- [ ] Do not show a voice mark yet; voice arrives in Phase 7.

### 3.5 Empty and loading states

- [ ] Empty today shows only the date, writing surface, and capture bar.
- [ ] Loading today is a quiet paper skeleton, not a spinner.
- [ ] If IndexedDB is unavailable, show a calm explanation and keep the app usable for the session if possible.

### 3.6 Metrics

- [ ] Record `capture_started` when the app opens Home.
- [ ] Record `capture_saved` with the elapsed time and piece id.
- [ ] Record `piece_added` with the day id.
- [ ] Keep metrics local; do not expose them in the UI.

### 3.7 Accessibility and responsiveness

- [ ] The editor is reachable by keyboard and screen reader.
- [ ] The placeholder is not the only label for the editor.
- [ ] Touch targets are at least 44 px.
- [ ] The layout works at 320 px and at desktop widths.
- [ ] The capture bar does not cover the last piece when the keyboard is open.

### 3.8 Tests

- [ ] Adding a text piece renders it and persists across reload.
- [ ] Pieces render in `createdAt` order.
- [ ] Whitespace-only input cannot be saved.
- [ ] Earlier pieces collapse and expand.
- [ ] The empty state renders without cards or stats.
- [ ] A save failure keeps the text in the editor.
- [ ] Capture latency metric is recorded.

## UI requirements

- Date: small Inter label, muted ink.
- Editor: large serif body, ink color, generous line height, soft cursor.
- Placeholder: muted ink, serif italic, exactly "What happened today?"
- Capture bar: paper background, top hairline, icon buttons, one bronze Add action.
- Earlier pieces: quieter than the active writing area, timestamps in Inter label style.
- No shadows and no rounded pills.

## States and edge cases

| State | Behavior |
|---|---|
| Empty day | Date, writing surface, capture bar only. |
| One piece | Piece stays expanded; editor remains available below or above per design. |
| Many pieces | Earlier pieces collapse; the latest remains readable. |
| Long text | Editor scrolls naturally; capture bar remains reachable. |
| Save failure | Inline quiet error; text is not lost. |
| IndexedDB blocked | Calm unavailable state; no crash. |
| Keyboard open | Editor scrolls above the keyboard; capture bar stays usable. |

## Acceptance criteria

- [ ] Home shows today's local date and the writing surface.
- [ ] A text piece can be added in under five seconds from opening.
- [ ] The piece persists across reload and appears in order.
- [ ] Earlier pieces are collapsed with timestamps and expand on tap.
- [ ] The empty state contains no cards, stats, or onboarding.
- [ ] A failed save does not lose the user's text.
- [ ] The capture bar has type, speak, photo, video, and Add.
- [ ] Tests pass and no AI call is made.

## Tests

- **Component:** capture bar enable/disable, add behavior, collapsed piece toggle.
- **Integration:** add piece through repository and read back through `useLiveQuery`.
- **E2E:** open Home, type, add, reload, confirm persistence.
- **Accessibility:** keyboard-only add and expand/collapse.

## Manual verification

1. Open the app and confirm the date and placeholder.
2. Time yourself adding a short piece; it should be well under five seconds.
3. Add three pieces with pauses; confirm timestamps and order.
4. Reload; confirm all pieces remain.
5. Collapse and expand earlier pieces.
6. Attempt to add whitespace; confirm it is blocked.
7. Check the page at 320 px and with the keyboard open.

## Handoff

Phase 4 adds the AI route, polish, raw/polished display, and Undo polish. The capture flow and repository behavior should not need to change.
