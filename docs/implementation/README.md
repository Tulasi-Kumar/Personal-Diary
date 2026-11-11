# DayBook — Implementation Guide

This folder breaks the DayBook build into 15 phases. Each phase is independently shippable, verifiable, and mapped to requirements in `docs/PRD.md` and decisions in `ARCHITECTURE.md`.

## How to use these docs

1. Read `docs/PRD.md` first. It defines what v1 must do.
2. Read `ARCHITECTURE.md` for system design, data model, AI gateway, and quality rules.
3. Read `Stitch Screens/DESIGN.md` for visual tokens and component behavior.
4. Build phases in order. Do not start a phase until the previous phase gate passes.
5. For each phase, work through the task checklist, then run the phase tests and the manual verification script.
6. Update the phase status table when a phase is complete.

### Working with an AI coding agent

For each phase, provide the agent with `docs/PRD.md`, `ARCHITECTURE.md`, `Stitch Screens/DESIGN.md`, the phase document, and the current repository state. Ask it to:

1. Read the phase document fully before writing code.
2. Implement only that phase, without starting the next one.
3. Run the phase tests, build, typecheck, and manual verification.
4. Report the phase gate results and any blockers.
5. Stop and wait for approval before the next phase.

This keeps each phase reviewable and prevents a large unreviewed change set.

## Phase map

| Phase | Document | Outcome | Depends on |
|---|---|---|---|
| 1 | [PHASE-01-setup.md](PHASE-01-setup.md) | Project, tokens, fonts, PWA manifest, four-tab shell | — |
| 2 | [PHASE-02-data-layer.md](PHASE-02-data-layer.md) | Dexie schema, repositories, date helpers | 1 |
| 3 | [PHASE-03-home.md](PHASE-03-home.md) | Today's page, capture bar, text pieces | 2 |
| 4 | [PHASE-04-ai-polish.md](PHASE-04-ai-polish.md) | One AI route, polish, raw field, undo | 3 |
| 5 | [PHASE-05-day-story.md](PHASE-05-day-story.md) | Grounded day story, source panel, full writing | 4 |
| 6 | [PHASE-06-calendar.md](PHASE-06-calendar.md) | Month grid, year navigation, past-day writing | 5 |
| 7 | [PHASE-07-voice.md](PHASE-07-voice.md) | Speech capture and fallback | 6 |
| 8 | [PHASE-08-media.md](PHASE-08-media.md) | Photo/video storage, inline media, vision descriptions | 7 |
| 9 | [PHASE-09-demo.md](PHASE-09-demo.md) | Multi-year demo diary with fixtures | 8 |
| 10 | [PHASE-10-memories.md](PHASE-10-memories.md) | Insights, ribbons, readiness, salience, Memories, recaps | 9 |
| 11 | [PHASE-11-notifications.md](PHASE-11-notifications.md) | In-app banners and evening reminder | 10 |
| 12 | [PHASE-12-replay.md](PHASE-12-replay.md) | Slideshow with text-only fallback | 11 |
| 13 | [PHASE-13-profile.md](PHASE-13-profile.md) | Settings, export, clear data, demo load | 12 |
| 14 | [PHASE-14-whats-next.md](PHASE-14-whats-next.md) | Feature list and local votes | 13 |
| 15 | [PHASE-15-qa.md](PHASE-15-qa.md) | States, accessibility, performance, acceptance pass | 14 |

## Status tracker

Last verified: 2026-11-11. `npm run test` (51/51 + live smoke skipped), `npm run test:e2e` (Chromium 9/9, Firefox 8/8 + 1 PWA skip), `npm run typecheck`, and `npm run build` all pass. Live AI smoke (`LIVE_AI_SMOKE=1 npx vitest run tests/live-ai-smoke.test.ts`) exercises real polish and story calls against Gemini and passes. Deployed to production at https://daybook-livid-eight.vercel.app; polish, story, and the 405 method guard verified against the live deployment. Two-form story shipped: crisp (~100 words) while the day is live, full (~1000–1500 words) once the day is over (prompt version 3).

| Phase | Status | Gate passed | Notes |
|---|---|---|---|
| 1. Setup | Implemented | Yes | Vite + React + TS, tokens, fonts, PWA manifest, four-tab shell |
| 2. Data layer | Implemented | Yes | Dexie schema, repositories, date helpers |
| 3. Home | Implemented | Yes | Today page, composer, text pieces, empty state |
| 4. AI polish | Implemented | Yes | `/api/ai`, queue, polish, raw text, undo |
| 5. Day story | Implemented | Yes | Grounded story, source panel, full writing |
| 6. Calendar | Implemented | Yes | Month grid, year/month navigation, past-day writing |
| 7. Voice | Implemented | Yes | Speech capture with unsupported/permission fallbacks |
| 8. Media | Implemented | Yes | Photo/video storage, inline preview, vision descriptions |
| 9. Demo | Implemented | Yes | Multi-year demo fixtures, load/remove |
| 10. Memories | Implemented | Yes | Insights, ribbons, readiness, salience, recaps |
| 11. Notifications | Implemented | Yes | In-app banners, evening reminder |
| 12. Replay | Implemented | Yes | Slideshow with text-only fallback |
| 13. Profile | Implemented | Yes | Settings, export (text/JSON), clear data, demo load |
| 14. What's Next | Implemented | Yes | 13 features, local vote persistence |
| 15. QA | Complete | Yes | State/a11y/perf audits, component + contract tests, offline PWA E2E, Firefox pass, `/debug` verification, acceptance matrix, 148.5 KB entry budget |

### Remaining environment limits (not code gaps)

- Live AI polish/story verified locally (`LIVE_AI_SMOKE=1`, real key from `.env.local`) and on the production deployment; insights, recap, and vision remain mock-tested only.
- Safari/WebKit and Android Chrome were not run; the WebKit download was blocked. Chromium and Firefox pass.
- PWA install on a real device was not performed; the manifest, service worker, offline shell, and production deployment are verified.
- No git repository exists, so no release tag/commit was recorded.

### Deployment notes

- Project: `tulasi14/daybook` on Vercel (Hobby). Production URL: https://daybook-livid-eight.vercel.app.
- Env vars (`GEMINI_API_KEY`, `GEMINI_FLASH_MODEL`, `GEMINI_FLASH_FALLBACK_MODEL`, `DAYBOOK_AI_MONTHLY_LIMIT`, `DAYBOOK_AI_DAILY_PER_CLIENT`, `DAYBOOK_AI_MAX_INPUT_TOKENS`) are set as Production secrets via the Vercel CLI; `.env.local` remains the local copy and is gitignored.
- `api/ai.ts` and its server-side imports use explicit `.js` extensions on relative imports because the function compiles to ESM (`"type": "module"`) and Node's ESM loader requires extensions. Keep that convention for new files imported by `api/`.

---

## Global conventions

### Stack

- Vite + React + TypeScript (strict mode).
- React Router for client routes.
- Tailwind CSS plus CSS custom properties for DayBook tokens.
- Dexie for IndexedDB; `dexie-react-hooks` for live reads.
- Zod for shared AI contracts.
- `vite-plugin-pwa` for the service worker and manifest.
- Vitest + Testing Library + `fake-indexeddb` for fast tests.
- Playwright for end-to-end tests.
- Vercel for hosting and the single `POST /api/ai` function.

### Code boundaries

- Screens compose features; they do not touch Dexie or `fetch` directly.
- Repositories are the only modules allowed to query Dexie.
- AI calls go through `src/lib/ai/client.ts`; only the job runner invokes it.
- Browser APIs (speech, media, storage, notifications) are wrapped in `src/lib/` services so they can be mocked.
- Domain logic is pure TypeScript where possible.

### Naming and data rules

- IDs use `crypto.randomUUID()`.
- Day ids use local `YYYY-MM-DD`, produced by `date-fns` `format`, never `toISOString()`.
- Week ids use ISO week (`YYYY-Www`); month ids use `YYYY-MM`.
- Timestamps are epoch milliseconds.
- `Piece.rawText` never changes.
- `Day.story` sentences always cite valid piece ids.
- AI cache keys include `PROMPT_VERSION` and a content hash; bump `shared/prompt-version.ts` when a prompt changes.
- No secrets in client code. Never prefix the AI key with `VITE_`.

### UI rules

- No stats, streaks, mood pickers, tag chips, or metric cards on writing/reading screens.
- One bronze accent; hairline dividers; no drop shadows.
- EB Garamond for prose and headings; Inter for labels, dates, and navigation.
- Quiet loading and error states; never block the page.
- Respect `prefers-reduced-motion`.
- Focus traps and Escape handling for sheets.

---

## Environment setup (preflight)

1. Install Node.js 20+ and npm.
2. Install the Vercel CLI for local full-stack development: `npm i -g vercel`.
3. Create a Gemini API key in Google AI Studio.
4. Create `.env.local` in the project root:

```bash
GEMINI_API_KEY=your-key
GEMINI_FLASH_MODEL=gemini-3.5-flash-lite
GEMINI_FLASH_FALLBACK_MODEL=gemini-3.1-flash-lite
DAYBOOK_AI_MONTHLY_LIMIT=2000
DAYBOOK_AI_DAILY_PER_CLIENT=40
DAYBOOK_AI_MAX_INPUT_TOKENS=6000
```

   `gemini-3.6-flash` is limited to 20 free requests per day. `gemini-3.5-flash-lite` allows 500 per day; the configured fallback handles a retired or exhausted primary model.

5. Create `.env.example` with the same keys but empty values.
6. Confirm `.env.local` is ignored by version control.
7. Run `vercel dev` when the AI route is needed; `npm run dev` is enough for local-only phases.

The AI key must exist only in the serverless function environment. The browser may send content to `/api/ai`, but it never receives the key.

---

## Definition of Done

A phase is done only when all of the following are true:

- Every task in the phase checklist is complete.
- The phase acceptance criteria pass manually.
- New unit/integration/E2E tests pass.
- `npm run build` succeeds.
- TypeScript has no errors.
- Lint has no new warnings that affect correctness.
- Empty, loading, error, and offline states relevant to the phase are handled.
- No regression in earlier phase acceptance criteria.
- The phase demo script can be completed without developer intervention.
- The status tracker is updated.

---

## Test commands

These are the target commands; create the scripts in Phase 1.

```bash
npm run dev          # Vite dev server
npm run build        # production build
npm run preview      # preview production build
npm run test         # Vitest unit/integration
npm run test:e2e     # Playwright
npm run lint         # lint
npm run typecheck    # tsc --noEmit
vercel dev           # full stack with /api/ai
```

## Phase documentation template

Each phase doc contains:

- Goal and phase gate.
- Dependencies and references.
- In-scope and out-of-scope work.
- Deliverables.
- Ordered task checklist.
- Technical, data, AI, and UI notes.
- States and edge cases.
- Acceptance criteria.
- Tests and manual verification.
- Handoff notes.

## Traceability

- Product requirements: `docs/PRD.md`
- Architecture: `ARCHITECTURE.md`
- Visual system: `Stitch Screens/DESIGN.md`
- Source problem and idea: `problemStatement.txt`, `idea.txt`

When a requirement and an implementation note conflict, the PRD wins for behavior and the architecture wins for technical structure. Raise the conflict instead of guessing.
