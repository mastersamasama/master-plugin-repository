/**
 * MockMcpClient — drop-in replacement for McpClient that returns
 * simulated market data with random-walk price simulation.
 *
 * Used in demo mode so the entire SentryX pipeline runs without
 * real chain data or API keys.
 */

// ─── Token Pool ──────────────────────────────────────────────

interface MockToken {
  symbol: string;
  address: string;
  chain: string;
  basePrice: number;
  devAddress: string;
}

const TOKEN_POOL: MockToken[] = [
  // Solana (chain '501')
  { symbol: 'BONK', address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', chain: '501', basePrice: 0.000028, devAddress: 'So1Dev1BONK1111111111111111111111111111111' },
  { symbol: 'WIF',  address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', chain: '501', basePrice: 2.45,     devAddress: 'So1Dev1WIF11111111111111111111111111111111' },
  { symbol: 'POPCAT', address: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', chain: '501', basePrice: 0.72,  devAddress: 'So1Dev1POP11111111111111111111111111111111' },
  { symbol: 'MYRO',   address: 'HhJpBhRRn4g56VsyLuT8DL5Bv31HkXqsrahTTUCZeZg4', chain: '501', basePrice: 0.15,  devAddress: 'So1Dev1MYRO1111111111111111111111111111111' },

  // Base (chain '8453')
  { symbol: 'BRETT', address: '0x532f27101965dd16442E59d40670FaF5eBB142E4', chain: '8453', basePrice: 0.16, devAddress: '0xBaseDev1BRETT0000000000000000000000000001' },
  { symbol: 'DEGEN', address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed', chain: '8453', basePrice: 0.012, devAddress: '0xBaseDev1DEGEN0000000000000000000000000001' },

  // Ethereum (chain '1')
  { symbol: 'PEPE', address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933', chain: '1', basePrice: 0.000012, devAddress: '0xEthDev1PEPE00000000000000000000000000001' },
  { symbol: 'MOG',  address: '0xaaeE1A9723aaDB7afA2810263653A34bA2C21C7a', chain: '1', basePrice: 0.0000024, devAddress: '0xEthDev1MOG000000000000000000000000000001' },
];

// ─── Helpers ─────────────────────────────────────────────────

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pick<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

function randomAddress(chain: string): string {
  const hexChars = '0123456789abcdef';
  if (chain === '501') {
    // Solana-style base58 (simplified)
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    return Array.from({ length: 44 }, () => chars[randInt(0, chars.length - 1)]).join('');
  }
  // EVM-style 0x address
  return '0x' + Array.from({ length: 40 }, () => hexChars[randInt(0, 15)]).join('');
}

function tokensForChain(chain: string): MockToken[] {
  return TOKEN_POOL.filter(t => t.chain === chain);
}

// ─── Price Tracker (shared state) ────────────────────────────

/** Shared price map: key = `${chain}:${address}` → current price */
const priceMap = new Map<string, number>();

// Pre-populate with base prices so dexQuote works before getTokenPrice is called
for (const t of TOKEN_POOL) {
  priceMap.set(`${t.chain}:${t.address}`, t.basePrice);
}

function priceKey(chain: string, address: string): string {
  return `${chain}:${address}`;
}

/**
 * Returns the shared price Map so MockOnchainCli can read
 * consistent prices for dexQuote.
 */
export function getPriceTracker(): Map<string, number> {
  return priceMap;
}

// ─── MockMcpClient ───────────────────────────────────────────

export class MockMcpClient {

  // ── Signal Methods ───────────────────────────────────────

  async getSmartMoneySignals(chain: string, limit: number = 20): Promise<any[]> {
    const tokens = tokensForChain(chain);
    if (tokens.length === 0) return [];

    // Named whale/KOL wallets for realistic display
    const WHALES_SOL = [
      { address: '5ZWj7a1f8tWkjBESHKgrLmXshuXxqeY9SYcfbshpAqPG', tag: 'Whale #1' },
      { address: 'HN7cABqLq46Es1jh92dQQisAi5YqWPsG7jCBzMcqSAZf', tag: 'KOL Alpha' },
      { address: '3Kz9bVKPxCjEFGRX7hSapQYGz2QLfmAEF3NAUGErv8Lh', tag: 'Smart Money A' },
      { address: 'DfYCNezifPA2wFpkGQnXqxSiSBFvMvXz3TqzBs8TYfno', tag: 'DEX Whale' },
      { address: 'AuYJLp7T3DpKjCFAX5wdgdHXb4rLnYTv8H6CpMVWJwLR', tag: 'Fund Wallet' },
    ];
    const WHALES_EVM = [
      { address: '0x28C6c06298d514Db089934071355E5743bf21d60', tag: 'Binance Whale' },
      { address: '0xDf9Eb223bAFBE5c5271415C75aeCD68C21fE3D7F', tag: 'KOL Trader' },
      { address: '0x1a9C8182C09F50C8318d769245beA52c32BE35BC', tag: 'Smart Money B' },
      { address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', tag: 'DeFi Whale' },
      { address: '0x56Eddb7aa87536c09CCc2793473599fD21A8b17F', tag: 'Fund Alpha' },
    ];

    const whalePool = chain === '501' ? WHALES_SOL : WHALES_EVM;
    const count = randInt(2, Math.min(4, tokens.length));
    const selected = pick(tokens, count);

    // Return 2-5 records per token (different buyers) so scanner groups them
    // and sees buyers.size >= 2, which is the threshold for a smart money signal.
    const results: any[] = [];
    for (const t of selected) {
      const buyerCount = randInt(2, 4);
      const buyers = pick(whalePool, buyerCount);
      for (const whale of buyers) {
        results.push({
          tokenAddress: t.address,
          tokenSymbol: t.symbol,
          walletAddress: whale.address,
          walletTag: whale.tag,
          amountUsd: String(randFloat(1_000, 50_000).toFixed(2)),
          action: 'buy',
          timestamp: new Date().toISOString(),
        });
      }
    }
    return results;
  }

  async getTrendingTokens(chain: string, limit: number = 20): Promise<any[]> {
    const tokens = tokensForChain(chain);
    if (tokens.length === 0) return [];

    const count = randInt(3, Math.min(5, tokens.length));
    const selected = pick(tokens, count);

    return selected.map(t => ({
      tokenAddress: t.address,
      tokenSymbol: t.symbol,
      volumeChange24h: String(randFloat(1, 15).toFixed(2)),
      priceChange24h: String(randFloat(-20, 80).toFixed(2)),
      volume24h: String(randFloat(50_000, 2_000_000).toFixed(2)),
      liquidity: String(randFloat(100_000, 5_000_000).toFixed(2)),
    }));
  }

  async getNewPairs(chain: string, limit: number = 20): Promise<any[]> {
    const tokens = tokensForChain(chain);
    if (tokens.length === 0) return [];

    const count = randInt(2, Math.min(4, tokens.length));
    const selected = pick(tokens, count);

    return selected.map(t => {
      // 20% chance the dev has rug history
      const devHasRug = Math.random() < 0.20;
      // 20% chance of high bundler ratio (>= 0.3)
      const highBundler = Math.random() < 0.20;

      return {
        tokenAddress: t.address,
        tokenSymbol: t.symbol,
        devAddress: t.devAddress,
        bondingCurveProgress: randFloat(0.1, 0.95),
        liquidity: String(randFloat(5_000, 500_000).toFixed(2)),
        createdAt: new Date(Date.now() - randInt(60_000, 3_600_000)).toISOString(),
        // These fields are consumed by the scanner indirectly via
        // checkDevReputation and getHolderDistribution calls, but
        // we include them for richer display.
        _mock: { devHasRug, highBundler },
      };
    });
  }

  // ── Market Methods ───────────────────────────────────────

  async getTokenPrice(chain: string, address: string): Promise<any> {
    const key = priceKey(chain, address);
    let price = priceMap.get(key);

    if (price == null) {
      // Initialize from token pool or generate a reasonable default
      const known = TOKEN_POOL.find(t => t.chain === chain && t.address === address);
      price = known ? known.basePrice : randFloat(0.00001, 1.0);
    }

    // Random walk with slight upward bias:
    // price *= 1 + (Math.random() - 0.45) * 0.04
    price *= 1 + (Math.random() - 0.45) * 0.04;

    priceMap.set(key, price);

    return {
      price: String(price),
      usdPrice: String(price),
      timestamp: new Date().toISOString(),
    };
  }

  async getTokenDetail(chain: string, address: string): Promise<any> {
    const known = TOKEN_POOL.find(t => t.chain === chain && t.address === address);
    const basePrice = known?.basePrice ?? randFloat(0.0001, 1.0);

    // 30% chance of bad market health — creates SKIP/BLOCK variety
    const badHealth = Math.random() < 0.30;

    const marketCap = badHealth
      ? randFloat(10_000, 40_000)
      : randFloat(500_000, 50_000_000);

    const liquidity = badHealth
      ? randFloat(2_000, 8_000)
      : randFloat(50_000, 5_000_000);

    const volume24h = badHealth
      ? randFloat(200, 800)
      : randFloat(10_000, 2_000_000);

    const holderConcentration = badHealth
      ? randFloat(0.75, 0.95)
      : randFloat(0.15, 0.65);

    return {
      tokenAddress: address,
      tokenSymbol: known?.symbol ?? 'UNKNOWN',
      marketCap: String(marketCap.toFixed(2)),
      liquidity: String(liquidity.toFixed(2)),
      volume24h: String(volume24h.toFixed(2)),
      holderConcentration: String(holderConcentration.toFixed(4)),
      top10HolderRate: String(holderConcentration.toFixed(4)),
      price: String(basePrice),
    };
  }

  async getHolderDistribution(chain: string, address: string): Promise<any> {
    // bundlerRatio 0.0 - 0.4, with 20% chance high enough to filter (>= 0.3)
    const high = Math.random() < 0.20;
    const bundlerRatio = high
      ? randFloat(0.30, 0.40)
      : randFloat(0.0, 0.25);

    return {
      tokenAddress: address,
      bundlerRatio: parseFloat(bundlerRatio.toFixed(4)),
      sniperRatio: parseFloat(randFloat(0.0, 0.15).toFixed(4)),
      top10Pct: parseFloat(randFloat(0.15, 0.60).toFixed(4)),
      holderCount: randInt(200, 15_000),
    };
  }

  async checkDevReputation(chain: string, devAddress: string): Promise<any> {
    // 80% clean, 20% hasRug=true
    const hasRug = Math.random() < 0.20;

    return {
      address: devAddress,
      hasRug,
      rugCount: hasRug ? randInt(1, 3) : 0,
      successCount: hasRug ? 0 : randInt(0, 5),
      totalLaunches: randInt(1, 10),
      firstSeen: new Date(Date.now() - randInt(86_400_000, 365 * 86_400_000)).toISOString(),
    };
  }
}
