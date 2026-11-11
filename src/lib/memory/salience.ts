import type { DaySignals } from '@shared/types';
import { clamp01 } from './readiness';

export function computeSalience(signals: Pick<DaySignals, 'interactionScore' | 'winningRibbonStrength' | 'pieceCount' | 'mediaCount'>): number {
  const richness = clamp01(signals.pieceCount / 6) * 0.8 + clamp01(signals.mediaCount / 2) * 0.2;
  return clamp01(
    0.45 * signals.interactionScore + 0.35 * signals.winningRibbonStrength + 0.2 * richness,
  );
}

export function compareBySalience(a: DaySignals, b: DaySignals): number {
  return computeSalience(b) - computeSalience(a);
}
