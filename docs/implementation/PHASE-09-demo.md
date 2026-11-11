# Phase 9 — Demo Diary

| Field | Value |
|---|---|
| Status | Implemented |
| Depends on | Phase 8 |
| Unlocks | Phase 10 |
| PRD | DEMO-01..09, MEM-01..06, NFR-14 |
| Architecture | §8.7, §16 |
| Design | Unobtrusive demo label |

## Goal

Make DayBook feel alive on first open. Load roughly 45 realistic days across multiple years, with precomputed AI output and interaction signals, so Memories works immediately without spending free-tier quota.

**Phase gate:** loading demo data is deterministic, idempotent, clearly labeled, and produces a diary where readiness, multi-year throwbacks, ribbons, recaps, and salience are all demonstrable.

## In scope

- Seeded PRNG.
- Multi-year date distribution.
- Realistic pieces across text, voice, photo, and video.
- Precomputed polished text, stories, insights, places, people, and ribbons.
- Precomputed weekly and monthly recaps.
- Seeded day signals for salience.
- Demo flags and a quiet label.
- Idempotent load and demo removal.
- A temporary trigger until the Profile button in Phase 13.

## Out of scope

- Calling the AI provider during seeding.
- Downloading remote images.
- Real user data import.

## Deliverables

1. `src/lib/seed/generator.ts` with a deterministic PRNG.
2. `src/lib/seed/fixtures.ts` with realistic content.
3. `loadDemoDiary()` and `removeDemoDiary()` services.
4. A temporary dev-only trigger or a minimal Profile row for testing.
5. Tests for determinism, idempotence, date coverage, and readiness.

## Tasks

### 9.1 Seeded generator

- [ ] Implement a small seeded PRNG (for example, mulberry32).
- [ ] Use a fixed seed so every load produces the same diary.
- [ ] Derive all randomness from the PRNG; do not use `Math.random()`.
- [ ] Generate stable ids from a demo namespace and index.
- [ ] Keep generation under a few seconds on a mid-range device.

### 9.2 Date distribution

- [ ] Generate roughly 45 days with content.
- [ ] Spread days across the last few months and prior years.
- [ ] Include exact anniversaries at 1 year, 2 years, and 5 years before today.
- [ ] Include at least one exact month-day anniversary for the throwback.
- [ ] Include days in different seasons and months.
- [ ] Include at least one long, dense day and several short days.
- [ ] Do not create future days.

### 9.3 Content

- [ ] Write varied, realistic first-person entries.
- [ ] Vary tone: ordinary days, proud moments, hard days, travel, friends, family, quiet days.
- [ ] Include names, places, and numbers where natural.
- [ ] Include at least several ribbon-worthy days and several ordinary days.
- [ ] Include voice pieces and their marks.
- [ ] Include photos and a video using locally generated placeholder blobs.
- [ ] Include places and people only from the text.
- [ ] Include evidence quotes that are exact substrings of the writing.

### 9.4 Precomputed AI output

- [ ] Store polished text for every text and voice piece.
- [ ] Store a heading and grounded story for every day.
- [ ] Ensure every story sentence cites valid demo piece ids.
- [ ] Store insights with exact evidence quotes.
- [ ] Store ribbons with strength and evidence.
- [ ] Store weekly and monthly recaps with highlights linking to real days.
- [ ] Do not call the AI route during seed.

### 9.5 Interaction signals and readiness

- [ ] Seed `daySignals` with plausible opens, story reads, source taps, and replays.
- [ ] Ensure readiness inputs unlock all Memories sections.
- [ ] Ensure the 1-, 2-, and 5-year anniversaries are eligible.
- [ ] Ensure at least one ribbon is recent enough for an in-app banner later.
- [ ] Ensure salience ranking has a clear top day for "Pages worth returning to."
- [ ] Force full readiness while demo is loaded through a local flag.

### 9.6 Flags and lifecycle

- [ ] Set `demo: true` on demo days and pieces where useful.
- [ ] Set `Settings.demoLoaded = true` and store a demo marker in `kv`.
- [ ] Show a small unobtrusive label in Profile or Memories.
- [ ] Make `loadDemoDiary()` idempotent: if the marker exists, do nothing or offer reload.
- [ ] Make `removeDemoDiary()` delete only demo-flagged content.
- [ ] Ensure real user content is never mixed into or deleted with demo cleanup.
- [ ] Clear all data also removes demo content.

### 9.7 Temporary trigger

- [ ] Add a development-only trigger (for example, a hidden Profile row or a `?demo=1` action) until Phase 13.
- [ ] Do not ship the temporary trigger in the final build.
- [ ] Record `demo_loaded` and `demo_removed` metrics.

### 9.8 Tests

- [ ] Unit: PRNG determinism and stable ids.
- [ ] Unit: date distribution includes 1, 2, and 5 years back.
- [ ] Unit: every story sentence cites a valid demo piece.
- [ ] Unit: every evidence quote is an exact substring.
- [ ] Integration: load twice does not duplicate.
- [ ] Integration: remove deletes only demo content.
- [ ] Integration: readiness and salience sections unlock after load.
- [ ] Component: demo label renders and is unobtrusive.
- [ ] E2E: load demo, open Memories, see throwback and marked days.

## Technical notes

- Generate placeholder images locally with canvas or SVG blobs; no network.
- Keep fixture content in a structured module, not inline in components.
- Story sentences must cite demo piece ids exactly as the AI would.
- Ribbon rarity must still run locally over demo days; do not fake the UI.
- Demo readiness is forced through the same readiness module, not a separate UI path.
- Use a demo id prefix so cleanup is unambiguous.

## States and edge cases

| State | Behavior |
|---|---|
| Demo not loaded | Normal empty diary. |
| Demo loaded | Full diary, quiet label, full Memories. |
| Load twice | No duplicates. |
| Remove demo | Demo content gone; real content untouched. |
| Real content exists | Demo adds alongside without overwriting. |
| Clear all | Everything removed, including demo. |
| Seeding interrupted | Recover to a consistent state; no partial demo marker. |

## Acceptance criteria

- [ ] About 45 realistic days load with text, voice, and media.
- [ ] Days span recent months plus 1, 2, and 5 years back.
- [ ] All Memories sections are eligible immediately after load.
- [ ] Throwbacks resolve to exact anniversaries where present.
- [ ] Every story sentence and ribbon quote is grounded in demo writing.
- [ ] Loading is deterministic and idempotent.
- [ ] Demo content is clearly labeled and removable.
- [ ] No AI calls are made during seeding.
- [ ] Tests pass.

## Tests

- **Unit:** determinism, dates, grounding, quotes.
- **Integration:** idempotence, demo-only removal, readiness.
- **E2E:** load demo, open Memories, open a marked day, open a throwback.

## Manual verification

1. Load the demo diary.
2. Confirm a quiet demo label and no modal or onboarding.
3. Open Calendar; confirm dots across months and years.
4. Open Memories; confirm a multi-year throwback, weekly section, and marked days.
5. Open a marked-day sheet; confirm exact quotes.
6. Open a replay-ready day; confirm media exists.
7. Load demo again; confirm no duplicates.
8. Remove demo; confirm real/empty state returns.
9. Confirm no AI network calls occurred during load.

## Handoff

Phase 10 builds the actual Memories UI, insights, readiness, salience, and recaps on top of this seeded data.
