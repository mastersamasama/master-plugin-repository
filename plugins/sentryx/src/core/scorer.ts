import { RawSignal, ScoredSignal, SignalSource, StrategyConfig, TokenInfo, SIGNAL_WEIGHTS, SIGNAL_THRESHOLDS, MULTI_SOURCE_THRESHOLD } from '../config';

export function scoreSmartMoney(signal: RawSignal): number {
  const d = signal.details;
  const buyerCount = d.buyerCount || d.wallets || 0;
  let score = 0;
  if (buyerCount >= 5) score = 90;
  else if (buyerCount >= 4) score = 80;
  else if (buyerCount >= 3) score = 70;
  else if (buyerCount >= 2) score = 50;
  else score = 20;

  const volume = d.totalBuyUsd || d.totalVolume || 0;
  if (volume > 50000) score += 10;
  else if (volume < 5000) score -= 10;

  return Math.max(0, Math.min(100, score));
}

export function scoreNewToken(signal: RawSignal): number {
  const d = signal.details;
  let score = 20; // base

  if (d.devHasRug) return 0;
  if (d.devHasSuccess || d.devHistory === 'has_successful_launches') score += 20;
  if (!d.devHasRug && d.devHistory !== 'has_successful_launches') score += 30;

  const bundlerRatio = d.bundlerRatio ?? 1;
  if (bundlerRatio < 0.1) score += 30;
  else if (bundlerRatio < 0.3) score += 15;
  else return 0; // bundler >= 30%, skip

  const bondingProgress = d.bondingCurveProgress ?? 0;
  if (bondingProgress > 0.5) score += 20;

  return Math.max(0, Math.min(100, score));
}

export function scorePriceAnomaly(signal: RawSignal): number {
  const d = signal.details;
  const volMultiplier = d.volumeMultiplier || 1;
  let score = 0;

  if (volMultiplier >= 10) score = 90;
  else if (volMultiplier >= 5) score = 70;
  else if (volMultiplier >= 3) score = 50;
  else score = 20;

  if (d.priceBreakout || d.aboveHighPct > 0) score += 10;
  if (d.sustained || d.durationMin > 15) score += 10;

  return Math.max(0, Math.min(100, score));
}

const SCORERS: Record<SignalSource, (s: RawSignal) => number> = {
  smartMoney: scoreSmartMoney,
  newToken: scoreNewToken,
  priceAnomaly: scorePriceAnomaly,
};

export function compositeScore(rawSignals: RawSignal[]): ScoredSignal | null {
  if (rawSignals.length === 0) return null;
  const token = rawSignals[0].token;

  const sources: ScoredSignal['sources'] = {};
  let weightedSum = 0;
  let totalWeight = 0;

  for (const raw of rawSignals) {
    const scorer = SCORERS[raw.source];
    if (!scorer) continue;
    const score = scorer(raw);
    sources[raw.source] = { score, details: raw.details };
    weightedSum += score * SIGNAL_WEIGHTS[raw.source];
    totalWeight += SIGNAL_WEIGHTS[raw.source];
  }

  const composite = totalWeight > 0 ? weightedSum / totalWeight : 0;

  return {
    token,
    sources,
    compositeScore: Math.round(composite),
    timestamp: new Date().toISOString(),
  };
}

export function qualifies(signal: ScoredSignal, _config: StrategyConfig): boolean {
  const sourceEntries = Object.entries(signal.sources) as [SignalSource, any][];
  const sourceCount = sourceEntries.length;

  if (sourceCount >= 2) {
    return signal.compositeScore >= MULTI_SOURCE_THRESHOLD;
  }

  if (sourceCount === 1) {
    const [source, data] = sourceEntries[0];
    return data.score >= SIGNAL_THRESHOLDS[source];
  }

  return false;
}
