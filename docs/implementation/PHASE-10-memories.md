# Phase 10 — Insights and Memories

| Field | Value |
|---|---|
| Status | Implemented |
| Depends on | Phase 9 |
| Unlocks | Phase 11 |
| PRD | MEM-01..12, MARK-01..03, RECAP-01..04, AI-11..13 |
| Architecture | §8.6, §8.7, §9, §11 |
| Design | Memories, marked day sheet, monthly recap |

## Goal

Turn saved days into memories that feel earned: grounded insights, locally awarded ribbons, progressive readiness, interaction-aware salience, multi-year throwbacks, weekly and monthly recaps, and marked days with exact evidence.

**Phase gate:** Memories opens in a calm forming state, unlocks sections progressively, resolves multi-year throwbacks, shows only exact evidence, and never leaks insights onto Home, Calendar, or Day screens.

## In scope

- Insights contract, prompt, job, and validation.
- Local ribbon rarity and recomputation.
- Readiness module and section eligibility.
- Salience module and interaction tracking.
- Memories screen with forming, partial, and full states.
- Multi-year throwback selection.
- This week recap.
- Marked days row and detail sheet.
- Monthly recap and "Pages worth returning to."
- Tests for grounding, rarity, readiness, salience, and selection.

## Out of scope

- In-app banners and reminder (Phase 11).
- Replay (Phase 12).
- Semantic search or insights on writing/reading screens.

## Deliverables

1. Insights contract and prompt.
2. `src/lib/memory/readiness.ts`.
3. `src/lib/memory/salience.ts`.
4. `src/lib/memory/throwbacks.ts`.
5. Ribbon rarity service.
6. Insights job integration after story success.
7. `/memories` screen with progressive sections.
8. Marked-day detail sheet.
9. `/memories/month/:month` monthly recap.
10. Weekly recap service and cache.
11. Interaction tracking.
12. Tests and acceptance evidence.

## Tasks

### 10.1 Insights contract and prompt

- [ ] Define insights input: day id and the day's pieces.
- [ ] Define output: `{ moods, ribbons, places, people }`.
- [ ] `moods` and `ribbons` use `{ label, evidenceQuotes }`; ribbons add `strength`.
- [ ] Labels are open-ended, never a fixed mood picker.
- [ ] Evidence quotes must be exact substrings of the user's writing.
- [ ] Places and people come only from the text.
- [ ] Return JSON only.

### 10.2 Insights validation

- [ ] Normalize whitespace and case for substring checks.
- [ ] Drop any mood or ribbon whose quotes are not exact substrings.
- [ ] Drop places and people not present in the text.
- [ ] Reject an insights result with no valid evidence.
- [ ] Retry once on invalid output, then keep previous insights silently.

### 10.3 Insights job

- [ ] Trigger after a successful story update when `insightHash` changed.
- [ ] Cache by content hash and prompt version.
- [ ] Write moods, ribbons, places, people, and insight hash atomically.
- [ ] Keep previous insights on failure.
- [ ] Never show a visible error; Memories simply stays as it was.

### 10.4 Ribbon rarity

- [ ] Treat model ribbons as candidates only.
- [ ] Rank days per label by strength across all story-backed days.
- [ ] Award a ribbon only when the day stands out against the others.
- [ ] Enforce about one awarded ribbon per label per seven days.
- [ ] Require roughly 14 story-backed days before rarity is meaningful.
- [ ] Recompute deterministically and idempotently when days change.
- [ ] Never invent evidence; keep only exact quotes.
- [ ] Store awarded ribbons on the day.

### 10.5 Readiness

- [ ] Implement `span`, `density`, `volume`, `engagement`, and `consistency`.
- [ ] Normalize span against a five-year target, not a cap.
- [ ] Use a 30-day half-life for engagement.
- [ ] Compute `readiness = 0.30*span + 0.25*density + 0.15*volume + 0.20*engagement + 0.10*consistency`.
- [ ] Evaluate section eligibility independently.
- [ ] Support `forming`, `partial`, and `full` states.
- [ ] Force full readiness when demo is loaded.
- [ ] Cache readiness by input hash and `READINESS_VERSION`.
- [ ] Never display the score, counts, progress bars, or streaks.

### 10.6 Salience and interaction signals

- [ ] Record a day-opened signal when a Day screen is read.
- [ ] Record a story-read signal after a short dwell.
- [ ] Record a source-tap signal when a source panel opens.
- [ ] Record replay-start and replay-complete signals.
- [ ] Record a recap-highlight-open signal.
- [ ] Compute recency-weighted `interactionScore` with a 30-day half-life.
- [ ] Compute `salience = 0.45*interactionScore + 0.35*maxRibbonStrength + 0.20*richness`.
- [ ] Use salience only for tie-breaks, recap candidate selection, and marked-day ordering.
- [ ] Keep all signals local and clearable.

### 10.7 Throwback selection

- [ ] Prefer the exact month-day in prior years, nearest first: 1, 2, 3, and onward.
- [ ] Support at least five years of lookback; older is allowed.
- [ ] Fall back to the nearest earlier story-backed day within 90 days.
- [ ] Tie-break by salience.
- [ ] Adapt the label: "One year ago today", "Three years ago today", "Years ago today."
- [ ] Expose the selected day id and label to the UI and notifications.

### 10.8 Memories screen

- [ ] Render a quiet title and intro.
- [ ] Forming state: "Your memories are forming." No counts.
- [ ] Partial state: render only eligible sections.
- [ ] Full state: render all eligible sections.
- [ ] Throwback section: heading, story excerpt, link to the day.
- [ ] This week section: short recap with quoted lines linking to days.
- [ ] Marked days section: horizontal row of day cards with a bronze label.
- [ ] Monthly recap entry point.
- [ ] No stats, charts, or mood pickers.
- [ ] No insights anywhere outside Memories.

### 10.9 Weekly recap

- [ ] Build the week's day-story input.
- [ ] Generate a two-paragraph letter-style recap on demand.
- [ ] Include two or three quoted highlights linking to days.
- [ ] Validate each quote is a substring of the supplied stories.
- [ ] Cache by period and content hash.
- [ ] If AI is unavailable, show story excerpts instead.
- [ ] No numbers or charts.

### 10.10 Marked-day detail

- [ ] Open a sheet with the ribbon name.
- [ ] Show two or three exact quotes as evidence.
- [ ] Provide "Read the day" and "Replay this day."
- [ ] Trap focus and close on Escape.
- [ ] If evidence is missing, hide the ribbon rather than showing an ungrounded claim.

### 10.11 Monthly recap

- [ ] Generate a two-paragraph reflection for the selected month.
- [ ] Include "Pages worth returning to": four days with one quoted line each.
- [ ] Choose candidates using salience and story richness, then let AI write.
- [ ] Validate quotes and day ids.
- [ ] Cache by period and content hash.
- [ ] No numbers or charts.

### 10.12 Tests

- [ ] Unit: readiness signals, weights, and section eligibility.
- [ ] Unit: salience recency decay and ranking.
- [ ] Unit: throwback selection at 1, 2, and 5 years plus fallback.
- [ ] Unit: ribbon spacing and rarity.
- [ ] Unit: evidence quote normalization.
- [ ] Contract: insights and recap validation with mocked AI.
- [ ] Integration: insights job writes after story success.
- [ ] Integration: interaction signals update day signals.
- [ ] Component: forming, partial, and full Memories states.
- [ ] Component: marked-day sheet evidence.
- [ ] E2E: demo diary shows throwback, week, and marked days.
- [ ] E2E: no insights on Home, Calendar, or Day.

## Technical notes

- Readiness and rarity are deterministic local logic; do not ask the model to decide.
- The model may propose labels; the client verifies evidence and awards ribbons.
- Salience must never change labels, evidence, or story facts.
- Keep the Memories screen calm even when many sections are eligible.
- Use indexed queries for eligibility and avoid scanning all media.
- Cache readiness and recaps; recompute only when inputs change.
- Reuse the same AI route; do not add a second endpoint.

## States and edge cases

| State | Behavior |
|---|---|
| No eligible section | Forming line; no counts. |
| Some sections eligible | Partial Memories. |
| All sections eligible | Full Memories. |
| Demo loaded | Full readiness. |
| Throwback exact anniversary | Show that year. |
| No exact anniversary | Nearest earlier day within 90 days. |
| Multiple candidates | Tie-break by salience. |
| Insights invalid | Keep previous; no visible error. |
| Ribbon evidence missing | Do not show the ribbon. |
| Recap unavailable | Show story excerpts. |
| Sparse but old diary | Throwback eligible even if readiness is low. |

## Acceptance criteria

- [ ] Memories is not gated by a single fixed day count.
- [ ] Readiness uses span, density, volume, engagement, and consistency.
- [ ] Sections unlock progressively and the forming state is calm.
- [ ] Multi-year throwbacks resolve at 1, 2, and 5 years when available.
- [ ] Every ribbon shows exact quotes from the user's writing.
- [ ] Ribbons follow local rarity and spacing.
- [ ] Salience affects only ranking, never facts or evidence.
- [ ] Weekly and monthly recaps have grounded highlights and no numbers.
- [ ] No insights appear on Home, Calendar, or Day.
- [ ] Demo data shows full Memories immediately.
- [ ] Tests pass.

## Tests

- **Unit:** readiness, salience, rarity, throwback selection, quote validation.
- **Contract:** insights and recap outputs.
- **Integration:** job triggers, caches, and interactions.
- **Component:** Memories states and marked-day sheet.
- **E2E:** demo Memories, long-range throwback, no insight leakage.

## Manual verification

1. Load demo data and open Memories; confirm all sections.
2. Open the throwback; confirm the year label and the day.
3. Open a marked day; confirm exact quotes and working links.
4. Open the monthly recap; confirm two paragraphs and four pages.
5. Clear data and start a fresh diary; confirm the forming state.
6. Add a few recent days; confirm partial sections appear without counts.
7. Change the system date to a prior-year anniversary; confirm the throwback.
8. Confirm Home, Calendar, and Day show no moods or ribbons.
9. Inspect the database; confirm signals are local and clearable.

## Handoff

Phase 11 uses throwback eligibility, newly awarded ribbons, and settings for in-app banners and the evening reminder.
