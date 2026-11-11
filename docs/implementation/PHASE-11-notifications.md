# Phase 11 — In-App Notifications and Reminder

| Field | Value |
|---|---|
| Status | Implemented |
| Depends on | Phase 10 |
| Unlocks | Phase 12 |
| PRD | NOTIF-01..05, MEM-07, PROFILE-02..03 |
| Architecture | §8.9, §8.7 |
| Design | Quiet in-app banners |

## Goal

Bring memories back into the present with quiet in-app banners for multi-year throwbacks and newly awarded ribbons, plus an optional evening reminder while the app is open.

**Phase gate:** a qualifying throwback shows an "N years ago today" banner, a newly awarded ribbon shows a banner once, the reminder respects settings, and nothing repeats within a session.

## In scope

- Notification service and event model.
- Throwback banners using multi-year selection.
- Ribbon banners for newly awarded ribbons.
- Evening reminder while the app is open.
- Dismissals and session memory.
- Settings fields for reminder time and memory notifications.
- Quiet banner UI.
- Tests with fake timers.

## Out of scope

- True push notifications.
- Background service worker notifications.
- Email or SMS.
- Notification history screen.

## Deliverables

1. `src/lib/notifications.ts` service.
2. `NotificationBanner` component.
3. App-level notification host.
4. Settings fields for `reminderTime` and `memoryNotifications`.
5. Tests for eligibility, dedupe, dismissal, and reminder timing.

## Tasks

### 11.1 Event model

- [ ] Define event types: `throwback`, `ribbon`, `reminder`.
- [ ] Include day id, label, and a short message.
- [ ] Compute events from local data only.
- [ ] Never show an event without a qualifying day or ribbon.
- [ ] Keep events dismissible and non-blocking.

### 11.2 Throwback banner

- [ ] On app open, run the multi-year throwback selection.
- [ ] Show "N years ago today" with the day heading.
- [ ] Link to the day.
- [ ] Do not show if the user dismissed that throwback in the session.
- [ ] Do not show if memory notifications are disabled.
- [ ] Do not show while the diary is still forming.

### 11.3 Ribbon banner

- [ ] Detect newly awarded ribbons from the latest insights/rarity pass.
- [ ] Show the ribbon label and the day heading.
- [ ] Link to the marked-day detail.
- [ ] Show once per ribbon.
- [ ] Respect the memory notifications toggle.
- [ ] Do not show ungrounded ribbons.

### 11.4 Evening reminder

- [ ] Use `Settings.reminderTime` in local time.
- [ ] Show only while the app is open.
- [ ] Show when the reminder time has passed and today has no saved piece.
- [ ] Show at most once per day.
- [ ] Do not show if the user already wrote today.
- [ ] Do not show if no reminder time is set.
- [ ] Do not use a service worker or background timer.

### 11.5 Dismissals and session memory

- [ ] Store dismissals in `kv` or session state.
- [ ] Session dismissals clear on a new session.
- [ ] Daily reminder dismissals persist for that day.
- [ ] Ensure a dismissed banner does not reappear after navigation.
- [ ] Keep dismissal writes small and local.

### 11.6 Banner UI

- [ ] Use a quiet paper surface, hairline border, and no shadow.
- [ ] One line of context and a quiet action link.
- [ ] Bronze used sparingly for the action or label.
- [ ] Dismiss control with an accessible label.
- [ ] Do not stack more than one banner at a time.
- [ ] Auto-dismiss is optional; if used, keep it slow and pause on focus.
- [ ] Respect reduced motion.

### 11.7 Settings

- [ ] Add `reminderTime?: string` and `memoryNotifications: boolean` to Settings.
- [ ] Default memory notifications to on.
- [ ] Default reminder to off or empty.
- [ ] The Profile UI arrives in Phase 13; provide a temporary dev control for testing.
- [ ] Validate reminder time format.

### 11.8 Tests

- [ ] Unit: throwback event only when eligible.
- [ ] Unit: reminder only after the time and only if today has no piece.
- [ ] Unit: dismissal dedupe.
- [ ] Unit: memoryNotifications false suppresses throwback and ribbon banners.
- [ ] Component: banner renders, dismisses, and links.
- [ ] Integration: app open triggers at most one banner.
- [ ] E2E with fake clock: reminder appears once, dismissal persists for the day.

## Technical notes

- Notifications are derived locally; no AI call.
- Throwback selection must be identical to the Memories section.
- Ribbon events should consume the awarded state, not raw model candidates.
- Do not store notification content on a server.
- Do not add a notification history or inbox; banners are ephemeral.
- Keep the reminder quiet; it is not a streak or a guilt mechanism.

## States and edge cases

| State | Behavior |
|---|---|
| Memory notifications off | No throwback or ribbon banners. |
| Diary forming | No throwback banner. |
| Throwback dismissed | Not shown again this session. |
| Ribbon already shown | Not shown again. |
| Reminder time not set | No reminder. |
| Already wrote today | No reminder. |
| Reminder passed | Show once while open. |
| Multiple events eligible | Show one at a time, highest priority: reminder, throwback, ribbon. |
| App closed | No notification. |

## Acceptance criteria

- [ ] Throwback banners use multi-year selection and say "N years ago today."
- [ ] Ribbon banners appear only for locally awarded, grounded ribbons.
- [ ] The reminder respects time, settings, and same-day writing.
- [ ] Dismissals prevent repeats.
- [ ] Banners are quiet, accessible, and non-blocking.
- [ ] No push notification or background behavior exists.
- [ ] Tests pass with fake timers.

## Tests

- **Unit:** event eligibility, dedupe, settings.
- **Component:** banner UI and dismissal.
- **Integration:** app-open event selection.
- **E2E:** fake clock reminder and throwback dismissal.

## Manual verification

1. Load demo data; open the app; confirm one quiet throwback banner.
2. Open the day from the banner; confirm the correct day.
3. Dismiss the banner; navigate away and back; confirm it does not repeat.
4. Trigger a new ribbon; confirm one ribbon banner.
5. Turn off memory notifications; confirm no banners.
6. Set the reminder to a past time; confirm it appears once if today has no piece.
7. Add a piece today; confirm the reminder does not appear.
8. Confirm banners do not block writing or navigation.

## Handoff

Phase 12 Replay can be opened from the marked-day sheet. Phase 13 exposes the settings used here in Profile.
