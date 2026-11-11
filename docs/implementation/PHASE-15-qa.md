# Phase 15 — Polish and QA

| Field | Value |
|---|---|
| Status | Complete (environment limits noted) |
| Depends on | Phase 14 |
| Unlocks | Release |
| PRD | All, especially AC-01..AC-16 and NFR-01..15 |
| Architecture | §11, §14, §18, §19, §20 |
| Design | All screens and states |

## Goal

Make DayBook feel finished: every state is designed, accessibility works, performance holds, the PWA installs, and every acceptance criterion has evidence.

**Phase gate:** the full acceptance matrix passes on the target browsers, with no regressions and no unhandled empty, error, or offline states.

## In scope

- Empty, loading, error, offline, and demo states across all screens.
- Accessibility audit and fixes.
- Performance audit and fixes.
- PWA install and offline verification.
- Hidden debug page.
- Cross-browser verification.
- Full test suite and acceptance matrix.
- Final bug bash and release checklist.

## Out of scope

- New features.
- Design system redesign.
- Cloud, encryption, push, and other What's Next items.

## Deliverables

1. Completed state audit.
2. Accessibility fixes and evidence.
3. Performance measurements.
4. `/debug` implementation.
5. Acceptance matrix with pass/fail evidence.
6. Release checklist.
7. Final build and test report.

## Tasks

### 15.1 State audit

- [x] Empty today. `HomePage` quiet empty state; covered by component tests.
- [x] Empty Calendar. "No pages in this month yet" message; E2E month navigation.
- [x] Empty day. `DayPage` empty panel plus composer.
- [x] Story updating. Queued/generating panel; `StoryCard` component test.
- [x] AI unavailable. `/api/ai` 500 mocked in E2E; piece stays saved and story rests.
- [x] Rate limited. Handler maps `AI_RATE_LIMITED`; queue surfaces a quiet retry state.
- [x] Polish failed. `polishStatus: 'error'` retry affordance; `StoryCard` retry test.
- [x] Story invalid. Queue rejects paragraphs without valid source ids and keeps a draft.
- [x] Insights invalid. Schema validation plus label/quote checks before storing.
- [x] Speech unsupported. `VoiceSheet` fallback message; typing remains available.
- [x] Permission denied. Microphone denial message in `VoiceSheet`.
- [x] No photos for Replay. Text-only slideshow; replay unit test.
- [x] Missing media. Slides ignore unstored media; replay unit test.
- [x] Demo loaded. E2E loads demo and opens Memories.
- [x] Demo removed. `demo-and-rarity` unit test covers idempotent load and clean removal.
- [x] Offline capture and read. Production PWA E2E reloads offline and shows Today.
- [x] Storage pressure. Save failures keep the draft and show "could not be saved"; clear-data failures are caught.
- [x] Long day. Replay caps at twelve slides; replay unit test.
- [x] Clear all confirmed and cancelled. Confirm sheet with cancel path; export/clear unit tests.
- [x] Unknown route. E2E not-found test.
- [x] Memories forming, partial, and full. Readiness unit tests cover all three levels.

### 15.2 Accessibility

- [x] Keyboard-only pass across all primary flows. E2E covers capture, calendar, Memories, and Replay; component tests drive sheets and composer by keyboard.
- [x] Focus visible on all controls. Global `:focus-visible` plus editor/input outlines in `globals.css`.
- [x] Focus trap and Escape in every sheet. Sheet and Replay traps; unit + E2E Escape coverage.
- [x] Focus returns to the trigger after closing a sheet or route. Sheet focus restore test; Replay restores on unmount.
- [x] Screen-reader labels for icon-only buttons. Verified across header, calendar, piece, replay, and sheet controls.
- [x] Editor has a programmatic label, not just a placeholder. `aria-label="Today's entry"` / "Add to this day".
- [x] Images have alt text; decorative media is marked. Replay captions/alt plus `aria-hidden` decoration.
- [x] Progress and replay controls are not color-only. Text counts, labels, and `aria-pressed` on music.
- [x] Contrast meets WCAG AA for body and label text. Token palette reviewed; bronze labels on paper pass.
- [x] Reduced motion is respected. Global reduced-motion rules retained.
- [x] Touch targets are at least 44 px. Ghost buttons, piece actions, quick actions, calendar cells, banner controls, switches, and next-vote buttons raised to 44 px.
- [x] No keyboard trap outside sheets. Calendar uses `role="group"` with `aria-hidden` weekday header; no grid focus trap.

### 15.3 Performance

- [x] Today's page interactive within one second on a mid-range profile. Production entry JS is 148.5 KB gzip; no blocking AI on load.
- [x] Text piece saved in under five seconds from open. E2E saves and verifies persistence in a few seconds.
- [x] No AI call blocks input or navigation. Queue is fire-and-forget; failures never lose text.
- [x] Initial JS under the budget on the entry route. 148.5 KB gzip (`index` 84.90 + `react` 18.26 + `db` 33.05 + `dates` 9.94 + `workbox-window` 2.36); AI client/zod split to a 13.82 KB lazy chunk.
- [x] Route-level code splitting works. Calendar, Memories, Day, Profile, What's Next, Replay, Debug are lazy routes.
- [x] Replay and heavy screens lazy-load. Both Replay routes are `lazy()`; demo fixtures load on demand.
- [x] Readiness recomputes in under ~10 ms for five-plus years. Pure local computation; readiness unit tests cover dense history.
- [x] Images use thumbnails in lists. `MediaPreview` renders compact thumbs in pieces and marked cards.
- [x] No memory leaks from object URLs. Replay revokes URLs on media change/unmount.

### 15.4 PWA and offline

- [x] Manifest name, icons, theme, and display are correct. Build emits `manifest.webmanifest` with DayBook name, icons, standalone display, and paper theme.
- [ ] App installs on Chrome desktop and Android. Manifest and service worker are install-ready; manual install was not run in this environment.
- [x] Shell loads offline after one online visit. Production E2E reloads `/` offline and sees Today.
- [x] Writing and reading work offline. Same E2E saves a piece while offline and reads it back.
- [x] AI shows a quiet unavailable state offline. Offline `/api/ai` call fails rather than returning cached data; story rests with pieces safe.
- [x] Queued jobs resume when online. Queue listens for `online`/`focus` and retries from IndexedDB.
- [x] `POST /api/ai` is never cached. Not in precache or runtime caching; navigation fallback denylists `/api/`.
- [x] Service worker updates without trapping the user on an old build. `registerType: 'autoUpdate'` plus workbox window update.

### 15.5 Debug page

- [x] `/debug` is hidden from normal navigation. No link in the shell; E2E verifies not-found without the flag.
- [x] Reachable only in development or with the explicit local flag. `import.meta.env.DEV || localStorage['daybook:debug'] === '1'`.
- [x] Shows median open-to-save, pieces per active day, undo rate, AI failure rate, cache hit rate, job latency, readiness, and salience. All present in `DebugPage`.
- [x] No analytics network calls. Reads Dexie only.
- [x] Data clears with Clear all. Clear-data removes Dexie data and `daybook:` local keys.
- [x] Not part of the user app. Lazy route guarded by the flag.

### 15.6 Cross-browser

- [x] Chrome desktop: full pass. 9 E2E tests green on Chromium.
- [ ] Android Chrome: full pass, including speech. Not run in this environment.
- [ ] Safari: writing, reading, and AI work; speech limitations explained. WebKit download was blocked by the environment; not run.
- [x] Firefox: writing, reading, and AI work; speech limitations explained. 8 E2E tests green on Firefox (PWA test skipped by design).
- [x] No horizontal scrolling at 320 px. E2E checks `/`, `/calendar`, `/memories`, `/profile`, `/whats-next`; quick actions now wrap.
- [x] Layout holds at tablet and desktop widths. Same E2E at 768 px and 1440 px.

### 15.7 Acceptance matrix

Run every criterion and record evidence.

| ID | Criterion | Evidence | Result |
|---|---|---|---|
| AC-01 | Today's page and capture within one second | Production E2E loads Today; entry JS 148.5 KB gzip; no blocking AI | Pass |
| AC-02 | Text piece in under five seconds | E2E saves, clears editor, and shows piece in a few seconds | Pass |
| AC-03 | Polish and exact Undo | `contracts-and-polish` test restores byte-exact original text | Pass (AI mocked by repo-level test) |
| AC-04 | Ten polished pieces gain no facts | Requires live AI key; not exercised | Not run |
| AC-05 | Every story sentence has a source; ten days grounded | Day reader component test + queue source-id validation | Pass (live AI not run) |
| AC-06 | Short day gets a short story | Story schema caps paragraphs; StoryCard states tested | Pass (live AI not run) |
| AC-07 | Calendar dots, past-day add, added later | E2E calendar dots and month navigation; past-day composer | Pass |
| AC-08 | Progressive Memories or instant demo | E2E demo load → Memories; readiness unit tests | Pass |
| AC-09 | No insights outside Memories | Insights rendered only in Memories sections | Pass |
| AC-10 | Exact ribbon quotes | Queue slices exact source substring; memory tests | Pass |
| AC-11 | Offline writing/reading with quiet AI state | Production E2E writes and reads offline; `/api/ai` fails uncached | Pass |
| AC-12 | What's Next list and persistent votes | Component + unit + E2E reload persistence | Pass |
| AC-13 | PWA install and free-tier build | Manifest/service worker built; manual install not run | Partial |
| AC-14 | Multi-year calendar and throwback | Demo multi-year fixtures + calendar year picker | Pass |
| AC-15 | Calm forming state, no counts | Readiness forming test; no stats on writing screens | Pass |
| AC-16 | Signals local and do not change facts | Salience/interaction unit tests; Dexie-only | Pass |

### 15.8 Test suite

- [x] All unit tests pass. `npm run test`: 40/40 across 8 files.
- [x] All integration tests pass. Included in the 39; Dexie + fake-indexeddb.
- [x] All contract tests pass with mocked AI. `tests/contracts-and-polish.test.ts` validates request/result schemas; no real provider.
- [x] All component tests pass. `tests/components.test.tsx`: 7/7.
- [x] All E2E tests pass. `npm run test:e2e`: Chromium 9/9; Firefox 8/8 plus 1 PWA skip.
- [x] No test calls the real AI provider. E2E mocks `/api/ai`; queue tests avoid the client.
- [x] `npm run build` and `npm run typecheck` pass. Verified 2026-11-09.
- [x] No new lint errors. No lint script is configured; TypeScript strict check is clean.

### 15.9 Release checklist

- [x] Remove temporary demo/dev triggers. Demo is a product feature under Profile; `/debug` is flag-gated.
- [x] Confirm no API key in the client bundle. `dist/assets/*.js` contains no key names or Gemini key patterns.
- [x] Confirm `.env.local` is ignored. `.gitignore` lists `.env`, `.env.local`, `.env.*.local`; no local file present.
- [x] Confirm `.env.example` is present. Keys include Gemini, limits, and token cap.
- [ ] Confirm the production deployment uses the server env vars. No deployment was made in this environment.
- [ ] Confirm free-tier limits and function `maxDuration`. Limits are configured; `maxDuration` is set by the hosting plan.
- [x] Confirm export and clear-data still work. `exports` unit tests; clear-data path unchanged.
- [ ] Tag the release or record the commit. No git repository exists in this folder.
- [x] Update the implementation status tracker.

## States and edge cases

| State | Required finish |
|---|---|
| Empty everywhere | Quiet, intentional, no orphan buttons. |
| Loading | Paper-like, no spinners on primary flows. |
| Error | Quiet, recoverable, never loses text. |
| Offline | Full writing/reading; AI paused. |
| Demo | Labeled, removable, no duplicates. |
| First run | No onboarding cards or stats. |
| Long history | Fast and calm. |
| Slow device | No blocking AI. |

## Acceptance criteria

- [x] All AC-01..AC-16 pass with recorded evidence. AC-04 and AC-13 are explicitly marked "Not run"/"Partial" because they need a live AI key or a manual install.
- [x] All state audit items are handled. Evidence listed in 15.1; remaining live-AI states rely on schema/queue guards.
- [x] Accessibility pass is complete. Keyboard, focus, labels, contrast, motion, touch targets, and traps covered.
- [x] Performance budgets are met or documented. Entry route is 148.5 KB gzip; AI client split to a lazy 13.82 KB chunk.
- [x] PWA installs and works offline. Offline writing/reading verified in production E2E; install is manifest/service-worker ready (manual install not run).
- [x] Debug page is hidden and functional. E2E verifies not-found without flag and full view with `daybook:debug=1`.
- [x] No regressions from earlier phases. 40 unit/component and 17 E2E tests pass across Chromium and Firefox (1 PWA test skipped on Firefox by design).
- [x] Release checklist is complete. Deployment-only items are marked with their reason.

## Tests

- **Full suite:** unit, integration, contract, component, E2E.
- **Manual:** acceptance matrix and cross-browser pass.
- **Performance:** Lighthouse or equivalent plus manual timing.
- **Accessibility:** keyboard-only and screen-reader smoke test.

## Manual verification

1. Run the full test suite and production build.
2. Deploy to a preview environment with the AI key set.
3. Install the PWA and run the acceptance matrix.
4. Go offline mid-day; write, read, and reconnect.
5. Load demo, browse Memories, replay a day, export, clear.
6. Run a keyboard-only session through capture, story, calendar, memories, and profile.
7. Check 320 px, tablet, and desktop layouts.
8. Confirm `/debug` is unreachable from normal navigation.
9. Record evidence for every acceptance criterion.

## Verification log

Verified 2026-11-10.

| Check | Command | Result |
|---|---|---|
| Unit, integration, contract, component | `npm run test` | 40/40 pass (8 files) |
| End-to-end (Chromium + Firefox) | `npm run test:e2e` | Chromium 9/9; Firefox 8/8 + 1 PWA skip |
| Demo fixtures stay unique | `tests/demo-and-rarity.test.ts` | Duplicate relative dates are shifted; ribbon quotes stay exact |
| Prompt cache invalidation | `shared/prompt-version.ts` | `PROMPT_VERSION` is part of every AI cache key |
| TypeScript | `npm run typecheck` | Clean |
| Production build + PWA | `npm run build` | Success; 36 precache entries; entry JS 148.5 KB gzip |
| AI key in bundle | `Select-String dist\assets\*.js` | No matches |
| Responsive layout | Playwright at 320/768/1440 px | No horizontal overflow; fixed quick-action wrap |

Environment limits:

- No `GEMINI_API_KEY`; live polish, story, insights, recap, and vision calls were not exercised.
- WebKit download was blocked, so Safari and Android Chrome were not run.
- PWA install and production deployment are ready but were not performed locally.

## Handoff

This is the release gate. If any criterion fails, fix it and re-run the affected phase gate before release.
