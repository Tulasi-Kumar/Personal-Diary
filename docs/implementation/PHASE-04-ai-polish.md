# Phase 4 — AI Gateway and Polish

| Field | Value |
|---|---|
| Status | Implemented |
| Depends on | Phase 3 |
| Unlocks | Phase 5 |
| PRD | AI-01..06, AI-15..16, HOME-06..08, HOME-11 |
| Architecture | §9, §10, §11, §12 |
| Design | Quiet updating and error states |

## Goal

Add the single server AI route and the first real AI behavior: polishing each saved piece without changing its meaning, while keeping the raw words as the source of truth.

**Phase gate:** a saved piece is polished within a few seconds, Undo polish restores the raw text exactly, the API key stays server-side, and failures degrade to readable text with a quiet retry.

## In scope

- Shared Zod request and response contracts.
- `POST /api/ai` serverless route.
- Gemini adapter with JSON response schema.
- Provider interface for future swaps.
- Polish prompt and validation.
- Client AI client with timeout and typed errors.
- Persisted client job queue and single worker.
- Polish job after each piece.
- Raw/polished display and Undo polish.
- Quiet polish, failure, retry, and offline states.
- Contract, unit, integration, and E2E tests.

## Out of scope

- Day story, insights, recaps, and vision. Their contracts can be scaffolded but not used.
- Streaming responses.

## Deliverables

1. `shared/ai-contracts.ts` with Zod schemas.
2. `api/ai.ts` with validation, Gemini call, retry once, and error mapping.
3. `shared/prompts.ts` with a versioned polish prompt.
4. `src/lib/ai/client.ts`, `jobs.ts`, `job-runner.ts`, `validation.ts`, and `status-store.ts`.
5. Home polish integration and Undo polish.
6. Tests using a mocked Gemini and a mocked AI endpoint.

## Tasks

### 4.1 Contracts

- [ ] Define the request union: `{ task, input, promptVersion }`.
- [ ] Define `polish` input: raw text, timestamp, piece type.
- [ ] Define `polish` output: `{ polishedText: string }`.
- [ ] Define the error union: `BAD_REQUEST`, `RATE_LIMIT`, `INVALID_OUTPUT`, `UPSTREAM`, `TIMEOUT` with `retryable`.
- [ ] Define the success union `{ ok: true, data }` and failure union `{ ok: false, code, message, retryable }`.
- [ ] Add a `promptVersion` constant and include it in cache keys.

### 4.2 Server route

- [ ] Create `api/ai.ts` for Vercel.
- [ ] Accept only `POST`.
- [ ] Enforce a body size limit and validate with Zod.
- [ ] Select the model from `GEMINI_TEXT_MODEL`.
- [ ] Build the prompt from the versioned template.
- [ ] Call Gemini with JSON response mode and a response schema matching the output.
- [ ] Parse JSON and validate with Zod.
- [ ] Retry once with a repair instruction if invalid.
- [ ] Return `INVALID_OUTPUT` if the retry fails.
- [ ] Map 429 to `RATE_LIMIT`, timeouts to `TIMEOUT`, and other upstream failures to `UPSTREAM`.
- [ ] Never log raw user text or the API key.
- [ ] Set an appropriate `maxDuration` within the hosting plan limit.

### 4.3 Provider interface

- [ ] Add a small interface: `generateJson(task, input) -> validated output`.
- [ ] Keep Gemini-specific code in one adapter file.
- [ ] Make the adapter replaceable without changing the route contract.
- [ ] Add a test adapter that returns fixtures.

### 4.4 Polish prompt

- [ ] Fix spelling, grammar, and punctuation.
- [ ] Improve clarity and phrasing into natural English.
- [ ] Keep first-person voice.
- [ ] Preserve names, numbers, places, and order.
- [ ] Do not add facts, feelings, people, places, or events.
- [ ] Do not make the writing more dramatic.
- [ ] Keep roughly the same length; shortening repetition is allowed.
- [ ] Return JSON only.

### 4.5 Client AI client

- [ ] `postAi(task, input)` calls `/api/ai` with a timeout.
- [ ] Return typed success or error results; do not throw for expected failures.
- [ ] Detect offline before and during the call.
- [ ] Never include the API key.
- [ ] Add abort support for unmount and shutdown.
- [ ] Add a no-op fallback in tests.

### 4.6 Job queue and runner

- [ ] Persist jobs in `aiJobs` with `key`, `payload`, `status`, `attempts`, `runAfter`.
- [ ] Dedupe polish jobs by `polish:{pieceId}:{hash(rawText)}:{promptVersion}`.
- [ ] Claim one job at a time by default.
- [ ] Reset `running` jobs to `queued` on startup.
- [ ] Back off retryable failures exponentially, capped at five minutes.
- [ ] Pause on offline and resume on `online`.
- [ ] Use `navigator.locks` when available to avoid duplicate workers across tabs.
- [ ] Expose a small status store for the UI.

### 4.7 Polish integration

- [ ] Enqueue a polish job after each successful piece save.
- [ ] Skip the call when the cache key is unchanged.
- [ ] On success, write `polishedText` and `polishState = 'done'`.
- [ ] On failure, keep the raw text visible and set `polishState = 'failed'`.
- [ ] On undo, set `polishState = 'undone'` and display `rawText`.
- [ ] Re-enable polish from the quiet retry action.
- [ ] Record `polish_succeeded`, `polish_failed`, and `polish_undone` metrics.

### 4.8 UI

- [ ] Show polished text when available; otherwise raw text.
- [ ] Show a quiet "Polishing..." line near the piece, not a spinner or modal.
- [ ] Show Undo polish on pieces with a polished result.
- [ ] Show a quiet retry on failed polish.
- [ ] When offline, show "AI is unavailable right now" without blocking writing.
- [ ] Keep the writing surface fully usable while jobs run.

### 4.9 Tests

- [ ] Contract test: valid polish response passes.
- [ ] Contract test: invalid JSON retries once, then fails.
- [ ] Contract test: 429 maps to `RATE_LIMIT`.
- [ ] Contract test: timeout maps to `TIMEOUT`.
- [ ] Unit test: polish length and new-number guards.
- [ ] Integration test: job enqueue, claim, success, failure, and backoff.
- [ ] Integration test: undo restores raw text exactly.
- [ ] E2E test with a mocked AI route: add piece, see polish, undo, see raw.

## Technical notes

- One AI route only. Do not add client-side provider calls.
- Validate on the server and again on the client for defense.
- Keep the raw text in IndexedDB; never replace it with polished text.
- Do not block the editor on a job. The piece renders immediately.
- Use a content hash in the cache key so repeated text does not spend quota.
- Keep concurrency at one on the free tier.
- If the server route is unreachable in local development, show the quiet unavailable state and continue.

## States and edge cases

| State | Behavior |
|---|---|
| Job queued | Piece is readable; quiet polishing line. |
| Job running | Same; no spinner. |
| Polish succeeded | Polished text replaces the visible text. |
| Polish failed | Raw text remains; quiet retry. |
| Undo polish | Raw text displays; state is `undone`. |
| Offline | Jobs queued; no error dialog. |
| Rate limited | Silent backoff; no user action required. |
| Invalid output after retry | Raw text remains; quiet retry. |
| Tab closed | Job persists and resumes on next open. |

## Acceptance criteria

- [ ] Polish appears within a few seconds after a piece is saved.
- [ ] Undo polish restores the raw words exactly.
- [ ] The raw text is never mutated.
- [ ] The API key exists only in the server environment.
- [ ] Invalid responses are retried once, then degrade gracefully.
- [ ] Writing remains usable offline and while AI is unavailable.
- [ ] Job queue survives reload.
- [ ] Tests pass with mocked AI; no real provider calls in tests.

## Tests

- **Contract:** route with a mocked Gemini adapter.
- **Unit:** polish guards, error mapping, cache keys.
- **Integration:** job lifecycle and undo.
- **E2E:** add, polish, undo, offline fallback.

## Manual verification

1. Start `vercel dev` with `.env.local` configured.
2. Add a piece with a deliberate typo; confirm the polish fixes it without adding facts.
3. Tap Undo polish; confirm the exact raw text returns.
4. Disable the network; add a piece; confirm it saves and shows a quiet unavailable state.
5. Re-enable the network; confirm queued polish resumes.
6. Reload mid-polish; confirm the job resumes.
7. Inspect the browser bundle and network calls; confirm no API key is present.

## Handoff

Phase 5 uses the same job runner and AI client for the day story. Do not create a second AI route.
