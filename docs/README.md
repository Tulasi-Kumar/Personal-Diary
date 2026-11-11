# DayBook Documentation

| Document | Purpose |
|---|---|
| [PRD.md](PRD.md) | Product requirements, scope, screens, AI behavior, acceptance criteria, metrics, and risks |
| [implementation/README.md](implementation/README.md) | How to build DayBook, conventions, environment setup, phase map, and Definition of Done |
| [../ARCHITECTURE.md](../ARCHITECTURE.md) | System design, data model, AI gateway, job queue, readiness/salience, and technical decisions |
| [../Stitch Screens/DESIGN.md](../Stitch%20Screens/DESIGN.md) | Visual system, tokens, typography, components, and layout rules |

## Implementation phases

| Phase | Document |
|---|---|
| 1 | [Setup and App Shell](implementation/PHASE-01-setup.md) |
| 2 | [Local Data Layer](implementation/PHASE-02-data-layer.md) |
| 3 | [Home and Text Capture](implementation/PHASE-03-home.md) |
| 4 | [AI Gateway and Polish](implementation/PHASE-04-ai-polish.md) |
| 5 | [Day Story and Reader](implementation/PHASE-05-day-story.md) |
| 6 | [Calendar and Past Days](implementation/PHASE-06-calendar.md) |
| 7 | [Voice Capture](implementation/PHASE-07-voice.md) |
| 8 | [Photos and Videos](implementation/PHASE-08-media.md) |
| 9 | [Demo Diary](implementation/PHASE-09-demo.md) |
| 10 | [Insights and Memories](implementation/PHASE-10-memories.md) |
| 11 | [In-App Notifications and Reminder](implementation/PHASE-11-notifications.md) |
| 12 | [Replay](implementation/PHASE-12-replay.md) |
| 13 | [Profile, Export, and Data Controls](implementation/PHASE-13-profile.md) |
| 14 | [What's Next](implementation/PHASE-14-whats-next.md) |
| 15 | [Polish and QA](implementation/PHASE-15-qa.md) |

## Source files

The product requirements are derived from:

- `problemStatement.txt`
- `idea.txt`
- `ARCHITECTURE.md`
- `Stitch Screens/DESIGN.md`

When documents conflict: the PRD wins for product behavior, the architecture wins for technical structure, and the design system wins for visual treatment.
