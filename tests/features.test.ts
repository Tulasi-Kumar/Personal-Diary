import { beforeEach, describe, expect, it } from 'vitest';
import { resetDatabaseForTests } from '../src/lib/db/db';
import { listFeatureVotes, toggleFeatureVote } from '../src/lib/db/repositories';
import { NEXT_FEATURES } from '../src/features/whats-next/features';

describe("what's next", () => {
  it('lists all thirteen features with valid statuses', () => {
    expect(NEXT_FEATURES).toHaveLength(13);
    expect(new Set(NEXT_FEATURES.map((feature) => feature.id)).size).toBe(13);
    for (const feature of NEXT_FEATURES) {
      expect(['Planned', 'Exploring', 'Needs research']).toContain(feature.status);
      expect(feature.name.length).toBeGreaterThan(0);
      expect(feature.reason.length).toBeGreaterThan(0);
    }
  });
});

describe('feature votes', () => {
  beforeEach(async () => {
    await resetDatabaseForTests();
  });

  it('persists a vote and removes it on unvote', async () => {
    expect(await toggleFeatureVote('semantic-search')).toBe(true);
    expect(await listFeatureVotes()).toHaveLength(1);
    expect((await listFeatureVotes())[0].featureId).toBe('semantic-search');

    expect(await toggleFeatureVote('semantic-search')).toBe(false);
    expect(await listFeatureVotes()).toHaveLength(0);
  });
});
