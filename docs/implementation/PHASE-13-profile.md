# Phase 13 — Profile, Export, and Data Controls

| Field | Value |
|---|---|
| Status | Implemented |
| Depends on | Phase 12 |
| Unlocks | Phase 14 |
| PRD | PROFILE-01..08, DATA-10..11, DEMO-06..09 |
| Architecture | §16, §17 |
| Design | Profile screen |

## Goal

Give the user control over the book: its name, reminder, notifications, export, demo data, and clearing everything — all in the same quiet book style.

**Phase gate:** settings persist, both exports download correctly, the demo can be loaded from Profile, and Clear all data removes everything after confirmation.

## In scope

- Profile screen layout.
- Book name editing.
- Reminder time and memory notifications toggle.
- Writing style row (Polished only).
- Readable text export.
- JSON backup export.
- Load demo diary wiring.
- Clear all data with confirmation.
- About and What's Next links.
- Tests and manual download checks.

## Out of scope

- Cloud sync, login, encryption, and app lock.
- Media archive export.
- Writing style options beyond Polished.

## Deliverables

1. `/profile` screen.
2. Settings editor with persistence.
3. Export service for text and JSON.
4. Demo load and remove wiring.
5. Clear-all confirmation sheet.
6. About and What's Next rows.
7. Tests for settings, export, demo, and clear.

## Tasks

### 13.1 Profile layout

- [ ] Use the same paper frame and hairline-divided rows as the rest of the app.
- [ ] Group rows quietly: Book, Reminders, Data, About.
- [ ] No cards, stats, or decorative icons beyond thin line icons.
- [ ] Show the demo label when demo data is loaded.
- [ ] Keep destructive actions visually quiet until confirmation.

### 13.2 Book name

- [ ] Show the current book name.
- [ ] Allow inline editing or a small sheet.
- [ ] Save to Settings on blur or explicit save.
- [ ] Default to "My DayBook" when empty.
- [ ] Reflect the name in the export header.
- [ ] Do not allow empty names after save.

### 13.3 Reminder and notifications

- [ ] Expose evening reminder time with a native time input or a quiet picker.
- [ ] Allow clearing the reminder.
- [ ] Expose the memory notifications toggle.
- [ ] Persist both in Settings.
- [ ] Show a one-line explanation of what the reminder does.
- [ ] Do not imply true push notifications.

### 13.4 Writing style

- [ ] Show "Polished" as the current style.
- [ ] Mark other styles as coming later on What's Next, not as disabled fields here.
- [ ] Do not add a mood or tone picker.

### 13.5 Readable export

- [ ] Export a single `.txt` file.
- [ ] Include the book name as a title.
- [ ] For each day: date, heading, story, then polished pieces with timestamps.
- [ ] Mark added-later and voice pieces quietly.
- [ ] Use a stable, readable order.
- [ ] Name the file with the book name and date.
- [ ] Trigger a browser download without a server.

### 13.6 JSON backup

- [ ] Export a single `.json` file.
- [ ] Include days, pieces, recaps, settings, votes, and media metadata.
- [ ] Exclude media blobs by default with a clear note in the file metadata.
- [ ] Include a schema version and export timestamp.
- [ ] Use the same date ordering as the text export.
- [ ] Do not call AI.
- [ ] Do not mutate data.

### 13.7 Load demo diary

- [ ] Add a "Load demo diary" row.
- [ ] If no demo exists, call `loadDemoDiary()`.
- [ ] If demo exists, offer to reload or remove; do not duplicate.
- [ ] Show the quiet demo label after load.
- [ ] Keep real content untouched when demo is added alongside.
- [ ] Offer "Remove demo data" while demo is loaded.
- [ ] Confirm that demo load does not call the AI provider.

### 13.8 Clear all data

- [ ] Show a confirmation sheet that states what will be removed.
- [ ] Require an explicit destructive confirmation.
- [ ] Clear all tables, demo data, metrics, jobs, signals, and settings.
- [ ] Reset settings to defaults.
- [ ] Revoke object URLs and reset in-memory stores.
- [ ] Return to Home with today's empty page.
- [ ] Do not unregister the service worker.

### 13.9 About and What's Next

- [ ] Add an About row with a short description and version.
- [ ] Add a What's Next row linking to `/whats-next`.
- [ ] Keep both visually quiet.

### 13.10 Tests

- [ ] Integration: settings persist across reload.
- [ ] Unit: export text formatting.
- [ ] Unit: JSON export shape and schema version.
- [ ] Integration: export includes added-later, voice, and media metadata.
- [ ] Integration: load demo twice does not duplicate.
- [ ] Integration: remove demo keeps real content.
- [ ] Integration: clear all empties every table and resets settings.
- [ ] Component: confirmation sheet and destructive flow.
- [ ] E2E: rename book, set reminder, toggle notifications, reload.
- [ ] E2E: download both exports and verify content.

## Technical notes

- Exports are generated in the browser from IndexedDB.
- Use `Blob` and an object URL for downloads; revoke after download.
- Do not include secrets or internal job payloads in exports.
- Keep media blobs out of the default JSON; note the limitation.
- Clear all must be atomic enough that a reload never shows half-deleted state.
- The demo label must be visible but not alarming.

## States and edge cases

| State | Behavior |
|---|---|
| Empty book name | Default "My DayBook"; cannot save empty. |
| No reminder | Reminder off. |
| Demo loaded | Demo label and remove option. |
| Demo already loaded | No duplicates; offer reload/remove. |
| Export with no data | Produce a valid file with an empty diary note. |
| Clear all cancelled | Nothing changes. |
| Clear all confirmed | Empty diary, default settings. |
| Export download blocked | Quiet message with retry. |

## Acceptance criteria

- [ ] Book name, reminder, and notification toggle persist.
- [ ] Writing style shows Polished.
- [ ] Readable text export downloads with the book name, days, stories, and pieces.
- [ ] JSON backup downloads with a schema version and no blobs.
- [ ] Load demo diary works from Profile and is labeled.
- [ ] Demo does not duplicate or delete real content.
- [ ] Clear all data removes everything after confirmation and resets settings.
- [ ] About and What's Next links work.
- [ ] Tests pass.

## Tests

- **Integration:** settings, demo, clear.
- **Unit:** text and JSON export formatting.
- **Component:** confirmation and destructive controls.
- **E2E:** full settings round trip and export download.

## Manual verification

1. Rename the book; reload; confirm the name persists and appears in export.
2. Set a reminder time and toggle notifications; reload; confirm persistence.
3. Export the readable text; open it and verify days, headings, stories, and pieces.
4. Export JSON; verify schema version, settings, votes, and no blobs.
5. Load demo; confirm the label and Memories; load again; confirm no duplicates.
6. Remove demo; confirm real content remains.
7. Clear all; confirm Home is empty and settings are default.
8. Open About and What's Next.

## Handoff

Phase 14 builds the What's Next screen that Profile links to.
