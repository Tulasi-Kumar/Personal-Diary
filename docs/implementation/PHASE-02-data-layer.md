# Phase 2 — Local Data Layer

| Field | Value |
|---|---|
| Status | Implemented |
| Depends on | Phase 1 |
| Unlocks | Phase 3 |
| PRD | DATA-01..11, GEN-08..09 |
| Architecture | §7, §8.1, §10.3 |
| Design | — |

## Goal

Make IndexedDB the reliable system of record for DayBook. Every later phase reads and writes through repositories, never through Dexie directly.

**Phase gate:** the full schema exists, core repository operations work in tests, local dates are correct, and raw pieces are immutable.

## In scope

- Dexie database `daybook-db` version 1.
- All tables: pieces, media, days, recaps, settings, featureVotes, aiJobs, daySignals, kv, metrics.
- Shared domain types.
- Date, ID, and hash helpers.
- Repositories for pieces, days, media, recaps, settings, votes, jobs, and day signals.
- Live-query hooks for the main reads.
- Transactions for multi-table writes.
- Migration and clear-all policy.
- Unit and integration tests with `fake-indexeddb`.

## Out of scope

- UI behavior, AI calls, capture, calendar rendering, and demo data.

## Deliverables

1. `shared/types.ts` with the domain types from the architecture.
2. `src/lib/db/db.ts` and `src/lib/db/schema.ts`.
3. Repository modules under `src/lib/db/repo/`.
4. `src/lib/dates.ts`, `src/lib/hash.ts`, and an ID helper.
5. Hooks: `useDay`, `usePiecesForDay`, `useSettings`, `useRecap`, `useFeatureVotes`.
6. Tests covering CRUD, ordering, transactions, and raw-text immutability.

## Tasks

### 2.1 Types

- [ ] Add `Piece`, `Media`, `StorySentence`, `Evidence`, `Ribbon`, `Day`, `Recap`, `Settings`, `FeatureVote`, `DaySignal`, `AiJob`, `KV`, and `MetricEvent`.
- [ ] Add `PieceType`, `PolishState`, and `AiTask` unions.
- [ ] Keep the field names aligned with `ARCHITECTURE.md` §7.2.
- [ ] Export types from `shared/types.ts` for both client and server contracts.

### 2.2 Dexie schema

- [ ] Create `daybook-db` with Dexie.
- [ ] Add the version 1 stores exactly as specified:

```ts
db.version(1).stores({
  pieces:       'id, dayId, createdAt, [dayId+createdAt], type, polishState',
  media:        'id',
  days:         'id, storyUpdatedAt',
  recaps:       'id, createdAt',
  settings:     'id',
  featureVotes: 'featureId',
  aiJobs:       'id, status, type, runAfter, [status+runAfter], key',
  daySignals:   'dayId, lastInteractedAt',
  kv:           'key',
  metrics:      '++id, name, at',
})
```

- [ ] Add a singleton settings row with id `settings`.
- [ ] Document the migration policy: additive upgrades, no silent data loss, export before destructive changes.

### 2.3 Helpers

- [ ] `dayIdFor(date)` returns local `yyyy-MM-dd`.
- [ ] `todayId()` returns the current local day id.
- [ ] `parseDayId(id)` returns a local date.
- [ ] `weekIdFor(date)` returns ISO week `YYYY-Www`.
- [ ] `monthIdFor(date)` returns `YYYY-MM`.
- [ ] `monthRange(monthId)` returns the first and last day ids.
- [ ] `newId()` returns `crypto.randomUUID()`.
- [ ] `hashJson(value)` returns a SHA-256 hex string using `crypto.subtle`.
- [ ] Add a fallback error for non-secure contexts where SubtleCrypto is unavailable.

### 2.4 Piece repository

- [ ] `addPiece({ dayId, type, rawText, mediaId?, mediaDescription?, addedLater? })`.
- [ ] `getPiece(id)`.
- [ ] `listPiecesForDay(dayId)` ordered by `createdAt`.
- [ ] `listPiecesForDayRange(startDayId, endDayId)`.
- [ ] `setPolish(id, polishedText)` sets `polishState = 'done'`.
- [ ] `markPolishFailed(id)` sets `polishState = 'failed'`.
- [ ] `undoPolish(id)` sets `polishState = 'undone'` without touching `rawText`.
- [ ] `updateMediaDescription(id, description)`.
- [ ] `deletePiece(id)` and orphaned-media cleanup.
- [ ] Enforce raw-text immutability in the repository API; never expose a raw-text setter.

### 2.5 Day repository

- [ ] `getOrCreateDay(dayId)` returns an empty day with `story: []`, empty insights, and empty hashes.
- [ ] `getDay(dayId)`.
- [ ] `listDaysWithContent()` for Calendar dots and Memories.
- [ ] `listDaysInRange(startDayId, endDayId)`.
- [ ] `setDayStory(dayId, { heading, story, storyHash })`.
- [ ] `setDayInsights(dayId, { moods, ribbons, places, people, insightHash })`.
- [ ] `setDayHeading` if needed by story updates.
- [ ] `touchStoryUpdatedAt(dayId)`.

### 2.6 Other repositories

- [ ] Media: `addMedia`, `getMedia`, `deleteMedia`, `getMediaForPieces`.
- [ ] Recaps: `getRecap`, `saveRecap`, `deleteRecap`.
- [ ] Settings: `getSettings`, `saveSettings` with partial merge.
- [ ] Votes: `getVotes`, `toggleVote`, `getVoteCount`.
- [ ] Jobs: `enqueueJob` with key dedupe, `upsertDebouncedJob`, `claimNextJob`, `completeJob`, `failJob`, `resetRunningJobs`, `listQueuedJobs`.
- [ ] Day signals: `recordInteraction(dayId, kind)`, `getDaySignal`, `listDaySignals`, `recomputeInteractionScore`.
- [ ] Metrics: `recordMetric(name, data)`, `listMetrics`.
- [ ] KV: `getKV`, `setKV`, `deleteKV`.
- [ ] `clearAllData()` clears every table after confirmation at the UI layer.

### 2.7 Transactions

- [ ] Use a single transaction when adding a piece and updating its day.
- [ ] Use a single transaction when saving a recap and its cache hash.
- [ ] Use a single transaction when claiming a job and marking it running.
- [ ] Ensure no UI-visible partial writes.

### 2.8 Hooks

- [ ] `useDay(dayId)` via `useLiveQuery`.
- [ ] `usePiecesForDay(dayId)` via `useLiveQuery`.
- [ ] `useSettings()` via `useLiveQuery`.
- [ ] `useRecap(recapId)` via `useLiveQuery`.
- [ ] `useFeatureVotes()` via `useLiveQuery`.
- [ ] Hooks return loading and error states.

### 2.9 Tests

- [ ] Add `fake-indexeddb/auto` to the test setup.
- [ ] Reset the database between tests.
- [ ] Cover add/list/order/undo/delete for pieces.
- [ ] Cover day creation and idempotence.
- [ ] Cover story and insight writes.
- [ ] Cover settings merge and vote toggling.
- [ ] Cover job dedupe and claim order.
- [ ] Cover day-signal counters and recency score.
- [ ] Cover `clearAllData`.

## Technical notes

- Use a single Dexie instance module; do not create databases inside components.
- Repositories return plain objects, not live Dexie proxies.
- Store blobs directly in `media`; do not base64 media in IndexedDB.
- Use `crypto.randomUUID()` for ids; do not use array indexes.
- Keep `rawText` and `polishedText` separate. Undo polish is a state change, not a text copy.
- `Day.id` is the primary key and the date. Do not add a separate date column.
- Index only fields that queries use. Avoid over-indexing blobs.

## States and edge cases

| Case | Behavior |
|---|---|
| Day does not exist | `getOrCreateDay` creates it on first write or read. |
| Piece has no polish yet | `polishedText = null`, `polishState = 'pending'`. |
| Undo polish | `polishState = 'undone'`; raw remains the display source. |
| Media referenced by multiple pieces | Do not delete media until no piece references it. |
| Job with duplicate key | Update `runAfter` or payload; do not create a second row. |
| App reload with running job | Reset running jobs to queued on startup. |
| Clear all | Delete all rows; keep the schema and default settings. |

## Acceptance criteria

- [ ] The database opens with all tables and indexes.
- [ ] A piece can be added, listed in order, polished, undone, and deleted.
- [ ] Raw text never changes after creation.
- [ ] Days are created idempotently and story/insight writes persist.
- [ ] Settings, votes, jobs, signals, recaps, and KV operations persist.
- [ ] `clearAllData` removes all content and restores default settings.
- [ ] Integration tests pass with `fake-indexeddb`.
- [ ] No component imports Dexie directly.

## Tests

- **Integration:** all repository methods against `fake-indexeddb`.
- **Unit:** date ids across month/year boundaries, week ids, month ranges, and JSON hashing.
- **Unit:** job dedupe/coalescing and backoff timestamps.

## Manual verification

1. Open the app and use a temporary dev-only panel or test to add a piece.
2. Reload; confirm the piece persists.
3. Undo polish; confirm raw text is unchanged.
4. Clear all data; confirm the database is empty and settings are default.
5. Advance the system clock across midnight and confirm `todayId()` changes locally, not by UTC.

## Handoff

Phase 3 builds Home on these repositories. It should not add new tables or bypass the repository layer.
