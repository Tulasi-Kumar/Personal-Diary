# Phase 6 — Calendar and Past Days

| Field | Value |
|---|---|
| Status | Implemented |
| Depends on | Phase 5 |
| Unlocks | Phase 7 |
| PRD | CAL-01..08, PAST-01..05, DAY-08, GEN-09 |
| Architecture | §6, §7, §8.5, §8.7 |
| Design | Calendar grid, Add to a past day |

## Goal

Let the user see the diary's shape at a glance, open any day, and add a remembered detail to a past day without losing the day's existing story or order.

**Phase gate:** the Calendar shows a dot for each day with content, today is circled, any past month or year can be reached, and a piece added to a past day is marked "added later."

## In scope

- Month grid with days and entry dots.
- Today ring.
- Month and year navigation.
- Open any day from the grid.
- Add to a past day with the same writing flow.
- `addedLater` labeling.
- Empty Calendar and empty day states.
- Story regeneration for past days.

## Out of scope

- Memories and throwbacks.
- Replay.
- Year-level summaries or analytics.

## Deliverables

1. `/calendar` screen with month grid.
2. Month/year navigation controls.
3. Calendar data query for days with content.
4. `/day/:date/write` screen reusing the Home writing flow.
5. "Added later" labels on Day and Everything screens.
6. Tests for navigation, dots, past-day writing, and ordering.

## Tasks

### 6.1 Calendar data

- [ ] Query days in the visible month using `listDaysInRange`.
- [ ] Determine presence from story-backed days or any piece.
- [ ] Include days with media-only pieces.
- [ ] Keep the query indexed and fast for years of data.
- [ ] Return a stable list of day ids with content.

### 6.2 Month grid

- [ ] Render the month name and year in Inter label style.
- [ ] Render weekday initials quietly.
- [ ] Render day numbers in Inter.
- [ ] Add a 3 px bronze dot under days with content.
- [ ] Add a subtle bronze ring or fill for today.
- [ ] Use invisible cell borders; no boxed cards.
- [ ] Keep the grid readable at 320 px.

### 6.3 Navigation

- [ ] Previous and next month controls.
- [ ] A year jump control that can reach any year in the diary's history.
- [ ] A "Today" action to return to the current month.
- [ ] Keyboard navigation for the grid.
- [ ] Preserve the selected month when returning from a day.
- [ ] Do not cap history at five years; five years is only the readiness normalization target.

### 6.4 Open a day

- [ ] Tapping a day with content opens `/day/:date`.
- [ ] Tapping an empty day opens a quiet empty day view with an Add action.
- [ ] Returning from a day restores the calendar month.
- [ ] Focus returns to the selected day cell.

### 6.5 Add to a past day

- [ ] Open `/day/:date/write` from an empty or existing past day.
- [ ] Reuse the Home editor and capture bar.
- [ ] Show the selected date and the label "Adding to a past day."
- [ ] Save the piece with `addedLater = true`.
- [ ] Do not reorder existing pieces.
- [ ] Upsert a story job with the normal eight-second debounce.
- [ ] After save, return to the Day screen or stay on the writing page per design.
- [ ] Show "added later" on the piece in the Day and Everything views.

### 6.6 Empty states

- [ ] Empty Calendar: quiet line, no charts or streaks.
- [ ] Empty past day: date, quiet empty line, Add action.
- [ ] Loading: paper skeleton, no spinner.
- [ ] Error reading the calendar: quiet message with retry.

### 6.7 Tests

- [ ] Unit: month grid generation across leap years and month boundaries.
- [ ] Unit: year navigation limits based on the oldest entry.
- [ ] Integration: days with content are returned for the visible month.
- [ ] Component: dots, today ring, and day selection.
- [ ] Integration: past-day piece stores `addedLater = true`.
- [ ] E2E: navigate months and years, open a past day, add a piece, read it.
- [ ] E2E: story updates after adding to a past day.

## Technical notes

- Use local dates for all grid cells and day ids.
- Do not use `Date.toISOString()` to derive day ids.
- Generate grid cells from the first and last visible dates, including adjacent month padding.
- Query only the visible range.
- Reuse the Home editor component rather than duplicating it.
- The story job must accept any `dayId`, not just today.
- Keep the Calendar visually quiet: no counts, no mood colors, no heatmaps.

## States and edge cases

| State | Behavior |
|---|---|
| Empty month | Quiet empty calendar; dots absent. |
| Month with entries | Dots under those days. |
| Today in another month | "Today" returns to the current month. |
| Leap day | Grid and day id handle February 29. |
| Oldest entry years back | Year navigation reaches it. |
| Empty past day | Quiet empty day with Add. |
| Added-later piece | Label appears in writing views. |
| Story update failure | Previous story remains; quiet retry. |

## Acceptance criteria

- [ ] The Calendar shows a dot for each day with entries.
- [ ] Today is gently circled.
- [ ] Any past month and year can be reached.
- [ ] Tapping a day opens it.
- [ ] A past day can be added to and is marked "added later."
- [ ] Existing pieces keep their order.
- [ ] The past day's story regenerates after a new piece.
- [ ] No insights, moods, or ribbons appear on Calendar.
- [ ] Tests pass.

## Tests

- **Unit:** grid math and date boundaries.
- **Integration:** range query and `addedLater` persistence.
- **Component:** calendar cell states and navigation.
- **E2E:** month/year navigation, open day, add past piece.

## Manual verification

1. Open Calendar; confirm today's ring and any entry dots.
2. Navigate to a month with no data; confirm the quiet empty state.
3. Jump back several years; confirm the grid is correct.
4. Open a past day; confirm the Day screen renders.
5. Add a piece; confirm "added later" appears.
6. Wait for the story update; confirm the new piece is reflected.
7. Return to Calendar; confirm the day still has its dot.

## Handoff

Phase 7 adds voice capture to the shared writing flow. The Calendar and past-day routes should not need changes.
