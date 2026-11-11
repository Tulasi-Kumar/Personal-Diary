# Phase 14 — What's Next

| Field | Value |
|---|---|
| Status | Implemented |
| Depends on | Phase 13 |
| Unlocks | Phase 15 |
| PRD | NEXT-01..05, NFR-10 |
| Architecture | §5, §6, §18 |
| Design | What's Next screen |

## Goal

Show what is deliberately not in v1, why it matters, and let the user record demand locally with a quiet "I want this" tap.

**Phase gate:** the screen lists every required feature with a reason and status, votes persist locally, and the design stays a quiet book list.

## In scope

- `/whats-next` route.
- Feature data with name, reason, and status.
- Local vote persistence.
- Small local count.
- Quiet list styling.
- Tests for persistence and rendering.

## Out of scope

- Network voting or analytics.
- Prioritization dashboards.
- Building any listed feature.

## Deliverables

1. Feature data module.
2. What's Next screen.
3. Vote toggle and count.
4. Tests and manual verification.

## Tasks

### 14.1 Feature data

- [ ] Add all 13 features from the problem statement.
- [ ] Include name, one-line reason, and status.
- [ ] Use exactly Planned, Exploring, or Needs research.
- [ ] Keep the data separate from the component.
- [ ] Do not add features not in the PRD without a product decision.

Required list:

| Feature | Status |
|---|---|
| Semantic search | Planned |
| Generative video recap | Exploring |
| Most Travelled with location | Planned |
| Real push notifications | Planned |
| Privacy and encryption | Planned |
| Cloud sync and login | Planned |
| Video understanding | Exploring |
| Voice notes with audio kept | Exploring |
| Pin a passage | Planned |
| Multi-language writing | Exploring |
| Home screen widget | Exploring |
| Choose your writing style | Exploring |
| Real user research | Needs research |

### 14.2 Screen layout

- [ ] Quiet title and one-line intro: "Things we are thinking about next."
- [ ] Vertical rows separated by hairlines.
- [ ] No cards and no icons beyond a small bronze status word.
- [ ] Each row shows the name, reason, status, and vote action.
- [ ] Keep the screen readable at 320 px.
- [ ] Respect the paper and type tokens.

### 14.3 Voting

- [ ] "I want this" toggles to a quiet confirmed state.
- [ ] Persist votes in `featureVotes`.
- [ ] Show a small count on the device.
- [ ] Do not make a network call.
- [ ] Allow unvoting.
- [ ] Do not show a global or fake popularity number.
- [ ] Label the count as local to the device.

### 14.4 States

- [ ] No votes: quiet action.
- [ ] Voted: quiet confirmation and count.
- [ ] Storage failure: quiet inline message; do not lose the tap silently.
- [ ] Offline: fully functional.

### 14.5 Tests

- [ ] Unit: feature data includes all 13 items with valid statuses.
- [ ] Component: rows render name, reason, status, and action.
- [ ] Integration: vote persists and unvote removes it.
- [ ] Component: count updates without a network call.
- [ ] E2E: vote, reload, confirm persistence.
- [ ] Accessibility: vote control is keyboard accessible and labeled.

## Technical notes

- Votes are local only; this is a demand-signal exercise, not analytics.
- Use the existing `featureVotes` table.
- Do not add a server endpoint.
- Keep the status word small and bronze; avoid colored badges.
- Do not show charts or totals across users.

## States and edge cases

| State | Behavior |
|---|---|
| No vote | Quiet "I want this." |
| Voted | Confirmed state and count. |
| Unvote | Returns to quiet state. |
| Offline | Works normally. |
| Vote write fails | Quiet inline message; retry. |
| Long feature name | Wraps without layout break. |

## Acceptance criteria

- [ ] The screen lists all required features with reasons and statuses.
- [ ] "I want this" persists locally and toggles.
- [ ] The count is local and small.
- [ ] No network call is made.
- [ ] The design is a quiet hairline list, not cards.
- [ ] Tests pass.

## Tests

- **Unit:** feature data completeness.
- **Component:** rows and vote states.
- **Integration:** vote persistence.
- **E2E:** vote, reload, unvote.

## Manual verification

1. Open What's Next from Profile.
2. Confirm all 13 features and correct statuses.
3. Tap "I want this" on two features; confirm counts.
4. Reload; confirm votes persist.
5. Unvote one; confirm the count decreases.
6. Go offline; confirm voting still works.
7. Check keyboard access and 320 px layout.

## Handoff

Phase 15 runs the full QA and acceptance pass, including this screen.
