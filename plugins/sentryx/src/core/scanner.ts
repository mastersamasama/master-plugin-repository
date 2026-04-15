import { McpClient } from '../api/mcp-client';
import { RawSignal, StrategyConfig, TokenInfo, CHAINS } from '../config';

export class SignalScanner {
  constructor(private mcp: McpClient) {}

  async scanSmartMoney(chains: string[]): Promise<RawSignal[]> {
    const signals: RawSignal[] = [];

    for (const chainId of chains) {
      const chain = CHAINS[chainId];
      if (!chain || !chain.signals.includes('smartMoney')) continue;

      try {
        const data = await this.mcp.getSmartMoneySignals(chainId, 20);
        // Group by token address, count distinct buyers
        const grouped = new Map<string, { token: TokenInfo; buyerMap: Map<string, { address: string; amount: number; tag?: string }>; totalVolume: number }>();

        for (const item of data) {
          const addr = item.tokenAddress || item.tokenContractAddress || item.address;
          if (!addr) continue;

          if (!grouped.has(addr)) {
            grouped.set(addr, {
              token: { symbol: item.tokenSymbol || item.symbol || 'UNKNOWN', address: addr, chain: chainId },
              buyerMap: new Map(),
              totalVolume: 0,
            });
          }
          const g = grouped.get(addr)!;
          const buyer = item.walletAddress || item.fromAddress || item.maker || 'unknown';
          const amount = parseFloat(item.amountUsd || item.volume || '0');
          if (!g.buyerMap.has(buyer)) {
            g.buyerMap.set(buyer, { address: buyer, amount: 0, tag: item.walletTag });
          }
          g.buyerMap.get(buyer)!.amount += amount;
          g.totalVolume += amount;
        }

        for (const [, g] of grouped) {
          if (g.buyerMap.size >= 2) {
            signals.push({
              source: 'smartMoney',
              token: g.token,
              score: 0,
              details: {
                buyerCount: g.buyerMap.size,
                totalBuyUsd: g.totalVolume,
                buyers: Array.from(g.buyerMap.values()),
              },
              timestamp: new Date().toISOString(),
            });
          }
        }
      } catch (e) {
        console.error(`[Scanner] Smart money scan failed on chain ${chainId}:`, e);
      }
    }

    return signals;
  }

  async scanNewTokens(chains: string[]): Promise<RawSignal[]> {
    const signals: RawSignal[] = [];

    for (const chainId of chains) {
      const chain = CHAINS[chainId];
      if (!chain || !chain.signals.includes('newToken')) continue;

      try {
        const pairs = await this.mcp.getNewPairs(chainId, 20);

        for (const pair of pairs) {
          const addr = pair.tokenAddress || pair.baseTokenAddress || pair.address;
          if (!addr) continue;

          const devAddr = pair.devAddress || pair.creatorAddress;
          let devInfo: any = null;
          if (devAddr) {
            devInfo = await this.mcp.checkDevReputation(chainId, devAddr);
          }

          let holderInfo: any = null;
          try {
            holderInfo = await this.mcp.getHolderDistribution(chainId, addr);
          } catch { /* optional */ }

          const bundlerRatio = holderInfo?.bundlerRatio ?? holderInfo?.sniperRatio ?? 0;
          const devHasRug = devInfo?.hasRug || (devInfo?.rugCount != null && devInfo.rugCount > 0) || false;
          const devHasSuccess = (devInfo?.successCount != null && devInfo.successCount > 0) || false;
          const bondingProgress = pair.bondingCurveProgress ?? pair.progress ?? 0;

          if (devHasRug) continue;
          if (bundlerRatio >= 0.3) continue;

          signals.push({
            source: 'newToken',
            token: {
              symbol: pair.tokenSymbol || pair.symbol || 'NEW',
              address: addr,
              chain: chainId,
            },
            score: 0,
            details: {
              devHistory: devHasSuccess ? 'has_successful_launches' : 'clean',
              devHasRug: false,
              devHasSuccess,
              bundlerRatio,
              bondingCurveProgress: bondingProgress,
            },
            timestamp: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.error(`[Scanner] New token scan failed on chain ${chainId}:`, e);
      }
    }

    return signals;
  }

  async scanPriceAnomaly(chains: string[]): Promise<RawSignal[]> {
    const signals: RawSignal[] = [];

    for (const chainId of chains) {
      const chain = CHAINS[chainId];
      if (!chain || !chain.signals.includes('priceAnomaly')) continue;

      try {
        const trending = await this.mcp.getTrendingTokens(chainId, 20);

        for (const token of trending) {
          const addr = token.tokenAddress || token.tokenContractAddress || token.address;
          if (!addr) continue;

          const volChange = parseFloat(token.volumeChange24h || token.volumeMultiplier || '1');
          const priceChange = parseFloat(token.priceChange24h || token.priceChangePct || '0');

          if (volChange < 3) continue;

          signals.push({
            source: 'priceAnomaly',
            token: {
              symbol: token.tokenSymbol || token.symbol || 'UNKNOWN',
              address: addr,
              chain: chainId,
            },
            score: 0,
            details: {
              volumeMultiplier: volChange,
              priceBreakout: priceChange > 0,
              aboveHighPct: priceChange,
              sustained: true,
            },
            timestamp: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.error(`[Scanner] Price anomaly scan failed on chain ${chainId}:`, e);
      }
    }

    return signals;
  }

  async scan(config: StrategyConfig): Promise<RawSignal[]> {
    const [sm, nt, pa] = await Promise.all([
      this.scanSmartMoney(config.chains),
      this.scanNewTokens(config.chains),
      this.scanPriceAnomaly(config.chains),
    ]);

    return [...sm, ...nt, ...pa];
  }
}
