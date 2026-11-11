# Phase 1 — Setup and App Shell

| Field | Value |
|---|---|
| Status | Implemented |
| Depends on | — |
| Unlocks | Phase 2 |
| PRD | GEN-01..09, NFR-05..13 |
| Architecture | §1, §6, §14, §15 |
| Design | `Stitch Screens/DESIGN.md` |

## Goal

Create the DayBook project and a stable visual and navigation frame so every later phase can ship inside it.

**Phase gate:** the app builds, opens to Home, navigates across the four tabs, renders the DayBook design tokens and fonts, and loads its shell offline as a PWA.

## In scope

- Vite + React + TypeScript project.
- Tailwind and DayBook design tokens.
- Self-hosted EB Garamond and Inter.
- React Router with the main routes.
- Bottom navigation with four tabs.
- PWA manifest, icons, and service worker registration.
- Base UI primitives and placeholder screens.
- Test tooling and npm scripts.
- Environment example and gitignore.

## Out of scope

- Dexie, data, capture, AI, calendar logic, memories, and any real screen content.

## Deliverables

1. Working project in the repository root (`E:\Prod Man\Apps\Diary`).
2. `src/styles/tokens.css` and `src/styles/globals.css`.
3. Route shell and bottom navigation.
4. Placeholder pages for all main screens.
5. PWA manifest and generated icons.
6. Test setup with one passing smoke test.
7. `.env.example`, `.gitignore`, and npm scripts.

Repository layout note: keep `docs/`, `Stitch Screens/`, `problemStatement.txt`, and `idea.txt` at the repository root. The `daybook/` tree in `ARCHITECTURE.md` describes the app folders (`src/`, `api/`, `public/`, `shared/`, `tests/`) that live at this same root.

## Tasks

### 1.1 Project scaffold

- [ ] Create a Vite React TypeScript project in the repository root without overwriting `docs/`, `Stitch Screens/`, and the source text files.
- [ ] Enable TypeScript strict mode.
- [ ] Add the `@/` path alias to `tsconfig` and Vite.
- [ ] Add `src/`, `shared/`, `api/`, `public/`, and `tests/` folders.
- [ ] Add `npm run dev`, `build`, `preview`, `test`, `test:e2e`, `lint`, and `typecheck` scripts.

Suggested dependencies:

```bash
npm install react-router-dom dexie dexie-react-hooks zod date-fns lucide-react
npm install @fontsource/eb-garamond @fontsource/inter
npm install -D tailwindcss @tailwindcss/vite vite-plugin-pwa vitest jsdom \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  fake-indexeddb @playwright/test
```

### 1.2 Design tokens

- [ ] Add the DayBook palette from `DESIGN.md` as CSS variables.
- [ ] Add spacing, radius, and hairline tokens.
- [ ] Map tokens into Tailwind theme values.
- [ ] Set the paper background and ink text as global defaults.
- [ ] Disable shadows globally by convention; do not add shadow utilities.

Required palette:

```css
--paper: #FAF6EE;
--paper-dim: #F5EFE3;
--paper-raised: #FDF9F1;
--ink: #241F1B;
--ink-soft: #6E645D;
--ink-muted: #8C8075;
--bronze: #9A6B3F;
--hairline: #E8DFD1;
--hairline-soft: #EDE5D8;
--danger: #BA1A1A;
```

### 1.3 Typography

- [ ] Load EB Garamond and Inter through `@fontsource` so they work offline.
- [ ] Define prose, heading, label, and navigation type classes.
- [ ] Set a readable measure: 55–70 characters, max width ~680 px, 1.25 rem mobile margins.
- [ ] Apply `font-feature-settings` and line heights from `DESIGN.md`.

### 1.4 Routing shell

- [ ] Add routes for `/`, `/calendar`, `/memories`, `/profile`, `/whats-next`, and `/debug`.
- [ ] Add placeholder nested routes for `/day/:date`, `/day/:date/all`, `/day/:date/write`, `/day/:date/replay`, and `/memories/month/:month`.
- [ ] Add a quiet not-found view.
- [ ] Keep route content inside a shared page frame.

### 1.5 Bottom navigation

- [ ] Build `BottomNav` with Home, Calendar, Memories, Profile.
- [ ] Use thin line icons from `lucide-react`.
- [ ] Inactive items use muted ink; active item uses bronze.
- [ ] Add a subtle top hairline.
- [ ] Add an active bronze dot beneath the active tab.
- [ ] Ensure 44 px minimum touch targets and accessible labels.
- [ ] Keep the nav visible on all four primary screens.

### 1.6 Base primitives

- [ ] `PaperPage`: page frame with mobile margins and max width.
- [ ] `Hairline`: 1 px divider.
- [ ] `LabelCaps`: Inter uppercase label.
- [ ] `TextLink`: quiet bronze or ink-soft text link.
- [ ] `PrimaryButton`: ink background, paper text, 4 px radius.
- [ ] `Sheet`: accessible bottom sheet skeleton with focus trap and Escape.
- [ ] Placeholder screen component for unfinished routes.

### 1.7 PWA

- [ ] Add `vite-plugin-pwa` with `registerType: 'autoUpdate'`.
- [ ] Create `public/manifest.webmanifest` with name DayBook, short name DayBook, ivory theme, standalone display, and icons.
- [ ] Generate 192 px, 512 px, and maskable icons.
- [ ] Precache the app shell, route chunks, fonts, and icons.
- [ ] Use navigation fallback to `index.html`.
- [ ] Ensure `POST /api/ai` is never cached.
- [ ] Confirm the shell loads with the network disabled after one online visit.

### 1.8 Tooling and quality

- [ ] Configure Vitest with `jsdom` and Testing Library.
- [ ] Register `fake-indexeddb` for integration tests.
- [ ] Configure Playwright with one smoke test.
- [ ] Add ESLint and a `typecheck` script.
- [ ] Add `.env.example` with `GEMINI_API_KEY`, `GEMINI_TEXT_MODEL`, `GEMINI_VISION_MODEL`, and `PROMPT_VERSION`.
- [ ] Add `.env.local` to `.gitignore`.
- [ ] Confirm no secret uses the `VITE_` prefix.

## UI requirements

- Calm ivory page, ink serif headings, Inter labels.
- No cards, no shadows, no stats.
- Placeholder text should be quiet and minimal.
- The bottom nav must feel like part of the paper, not a floating widget.

## States

| State | Behavior |
|---|---|
| Unknown route | Quiet not-found page with a link home. |
| Offline after first visit | Shell loads; placeholders render. |
| First visit offline | Normal browser error; acceptable for Phase 1. |
| Reduced motion | No transitions beyond instant color changes. |

## Acceptance criteria

- [ ] `npm run build` succeeds with no TypeScript errors.
- [ ] The app opens to the Home placeholder.
- [ ] All four tabs navigate and show the active state.
- [ ] DayBook tokens and fonts are visible on every placeholder.
- [ ] The PWA manifest is valid and the app is installable.
- [ ] The app shell loads offline after one online visit.
- [ ] No stats, streaks, or dashboard elements exist.
- [ ] The smoke test passes.

## Tests

- **Unit:** token constants or route map, if extracted.
- **Component:** `BottomNav` renders four tabs and marks the active route.
- **E2E:** open the app, navigate all four tabs, reload, and confirm the shell persists.

## Manual verification

1. Run `npm run dev` and open the app.
2. Confirm Home loads, then visit Calendar, Memories, and Profile through the bottom nav.
3. Confirm the active tab uses bronze and the others use muted ink.
4. Run `npm run build` and `npm run preview`; confirm the production build loads.
5. Open DevTools > Application > Manifest; confirm DayBook and icons.
6. Go offline and reload; confirm the shell still loads.
7. Check a 320 px viewport for horizontal scrolling.

## Handoff

Phase 2 adds Dexie, domain types, repositories, date helpers, and live-query hooks. Do not add feature logic to the placeholder screens yet.
