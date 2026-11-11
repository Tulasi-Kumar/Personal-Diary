export type FeatureStatus = 'Planned' | 'Exploring' | 'Needs research';

export interface NextFeature {
  id: string;
  name: string;
  reason: string;
  status: FeatureStatus;
}

export const NEXT_FEATURES: NextFeature[] = [
  {
    id: 'semantic-search',
    name: 'Semantic search',
    reason: 'Find a day by feeling, not just by date.',
    status: 'Planned',
  },
  {
    id: 'generative-video-recap',
    name: 'Generative video recap',
    reason: 'A short film of a month, if it can stay quiet and true.',
    status: 'Exploring',
  },
  {
    id: 'most-travelled-location',
    name: 'Most Travelled with location',
    reason: 'A gentle map of the places the years keep returning to.',
    status: 'Planned',
  },
  {
    id: 'real-push-notifications',
    name: 'Real push notifications',
    reason: 'A reminder that can reach you when the app is closed.',
    status: 'Planned',
  },
  {
    id: 'privacy-encryption',
    name: 'Privacy and encryption',
    reason: 'A locked book, even on a shared device.',
    status: 'Planned',
  },
  {
    id: 'cloud-sync-login',
    name: 'Cloud sync and login',
    reason: 'Carry the same book across devices without losing the local copy.',
    status: 'Planned',
  },
  {
    id: 'video-understanding',
    name: 'Video understanding',
    reason: 'Let a clip become part of the day’s written story.',
    status: 'Exploring',
  },
  {
    id: 'voice-notes-audio',
    name: 'Voice notes with audio kept',
    reason: 'Keep the sound of a voice, not only its words.',
    status: 'Exploring',
  },
  {
    id: 'pin-a-passage',
    name: 'Pin a passage',
    reason: 'Hold one line at the top of the book until you no longer need it.',
    status: 'Planned',
  },
  {
    id: 'multi-language',
    name: 'Multi-language writing',
    reason: 'Write and read in the language the day arrived in.',
    status: 'Exploring',
  },
  {
    id: 'home-screen-widget',
    name: 'Home screen widget',
    reason: 'One quiet line from the book, without opening it.',
    status: 'Exploring',
  },
  {
    id: 'choose-writing-style',
    name: 'Choose your writing style',
    reason: 'More than Polished: plain, lyrical, or close to your own voice.',
    status: 'Exploring',
  },
  {
    id: 'real-user-research',
    name: 'Real user research',
    reason: 'Talk to people who keep diaries before deciding what comes next.',
    status: 'Needs research',
  },
];
