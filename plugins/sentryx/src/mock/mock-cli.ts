/**
 * MockOnchainCli — drop-in replacement for OnchainCli that simulates
 * wallet, security, trade, and payment operations in demo mode.
 */

const DEMO_EVM_ADDR = '0xecc41bE474B09c5bA97C3527b0fB6C4A2c5407df';
const DEMO_SOL_ADDR = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';

interface TokenAsset {
  symbol: string;
  chainIndex: string;
  balance: string;
  usdValue: string;
  address: string;
  tokenAddress: string;
}

export class MockOnchainCli {
  private loggedIn = false;
  private email = '';
  private cloudId = 'demo_cloud_001';
  private walletCounter = 1;
  private priceTracker: Map<string, number>;

  constructor(priceTracker: Map<string, number>) {
    this.priceTracker = priceTracker;
  }

  // ─── Auth ──────────────────────────────────────────────

  async walletLogin(email: string): Promise<any> {
    this.email = email;
    return { status: 'ok', message: `OTP sent to ${email}` };
  }

  async walletVerify(_code: string): Promise<any> {
    this.loggedIn = true;
    return { status: 'ok', message: 'Verified', cloudId: this.cloudId };
  }

  // ─── Wallet ────────────────────────────────────────────

  async walletStatus(): Promise<any> {
    return {
      loggedIn: this.loggedIn,
      email: this.email || undefined,
      cloudId: this.loggedIn ? this.cloudId : undefined,
    };
  }

  async walletBalance(_chain?: string): Promise<any[]> {
    const tokenAssets: TokenAsset[] = [
      {
        symbol: 'SOL',
        chainIndex: '501',
        balance: '2.5',
        usdValue: '365',
        address: DEMO_SOL_ADDR,
        tokenAddress: '',
      },
      {
        symbol: 'USDC',
        chainIndex: '501',
        balance: '100',
        usdValue: '100',
        address: DEMO_SOL_ADDR,
        tokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      },
      {
        symbol: 'BONK',
        chainIndex: '501',
        balance: '5000000',
        usdValue: '110',
        address: DEMO_SOL_ADDR,
        tokenAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      },
      {
        symbol: 'ETH',
        chainIndex: '1',
        balance: '0.1',
        usdValue: '250',
        address: DEMO_EVM_ADDR,
        tokenAddress: '',
      },
      {
        symbol: 'USDT',
        chainIndex: '1',
        balance: '150',
        usdValue: '150',
        address: DEMO_EVM_ADDR,
        tokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      },
      {
        symbol: 'BRETT',
        chainIndex: '8453',
        balance: '50000',
        usdValue: '35',
        address: DEMO_EVM_ADDR,
        tokenAddress: '0x532f27101965dd16442E59d40670FaF5eBB142E4',
      },
    ];

    return [{ tokenAssets }];
  }

  async walletBalanceAll(): Promise<any[]> {
    return this.walletBalance();
  }

  async walletCreate(): Promise<any> {
    const idx = this.walletCounter++;
    const address = '0x' + randomHex(40);
    return {
      accountIndex: idx,
      index: idx,
      address,
      addressList: [{ address }],
    };
  }

  async walletSwitch(_id: string): Promise<void> {
    // no-op in demo mode
  }

  async walletSend(_params: {
    chain: string;
    recipient: string;
    amount: string;
    tokenAddress?: string;
  }): Promise<any> {
    return { txHash: 'demo_send_' + Date.now() };
  }

  async walletAddresses(_chain?: string): Promise<any> {
    return [
      { chain: '1', address: DEMO_EVM_ADDR },
      { chain: '8453', address: DEMO_EVM_ADDR },
      { chain: '137', address: DEMO_EVM_ADDR },
      { chain: '501', address: DEMO_SOL_ADDR },
    ];
  }

  // ─── Security ──────────────────────────────────────────

  async securityTokenScan(_chain: string, _address: string): Promise<any> {
    const roll = Math.random();

    // Build detailed check results for all dimensions
    const buildChecks = (overrides: Record<string, boolean>) => {
      const checks: Record<string, boolean> = {
        isHoneypot: false,
        canMint: false,
        highTax: false,
        isProxy: false,
        ownerNotRenounced: false,
        canPause: false,
        canBlacklist: false,
        isAntiWhale: false,
        hasHiddenOwner: false,
        externalCall: false,
        ...overrides,
      };

      // Additional market/holder metadata for richer display
      const buyTax = checks.highTax ? String(randFloat(12, 30).toFixed(1)) : String(randFloat(0, 2).toFixed(1));
      const sellTax = checks.highTax ? String(randFloat(15, 50).toFixed(1)) : String(randFloat(0, 3).toFixed(1));
      const holderCount = String(randInt(150, 20000));
      const lpLocked = !checks.isProxy && Math.random() > 0.3;
      const contractVerified = Math.random() > 0.2;

      return {
        ...checks,
        buyTax,
        sellTax,
        holderCount,
        lpLocked,
        contractVerified,
        riskList: null,
      };
    };

    if (roll < 0.50) {
      // 50% clean
      return buildChecks({});
    }

    if (roll < 0.80) {
      // 30% warnings
      return buildChecks({
        isProxy: Math.random() < 0.6,
        ownerNotRenounced: Math.random() < 0.7,
        canPause: Math.random() < 0.3,
        canBlacklist: Math.random() < 0.3,
      });
    }

    // 20% danger
    return buildChecks({
      isHoneypot: Math.random() < 0.5,
      canMint: Math.random() < 0.6,
      highTax: Math.random() < 0.4,
      isProxy: true,
      ownerNotRenounced: true,
      hasHiddenOwner: Math.random() < 0.3,
    });
  }

  async securityTxScan(_params: {
    chain: string;
    to: string;
    data?: string;
    value?: string;
  }): Promise<any> {
    const pass = Math.random() < 0.70;

    if (pass) {
      return {
        safe: true,
        riskLevel: 'low',
        warnings: [],
        details: 'Transaction appears safe',
      };
    }

    return {
      safe: false,
      riskLevel: 'high',
      warnings: ['Suspicious contract interaction', 'Potential value drain'],
      details: 'Transaction flagged as risky',
    };
  }

  // ─── Trade ─────────────────────────────────────────────

  async dexQuote(params: {
    chain: string;
    fromToken: string;
    toToken: string;
    amount: string;
  }): Promise<any> {
    const toKey = `${params.chain}:${params.toToken}`;

    // fromToken is typically a stablecoin (USDC/USDT) — treat as $1.
    // toToken price comes from the shared priceTracker (random walk).
    const toPrice = this.priceTracker.get(toKey) ?? 0.001;

    const inputAmount = parseFloat(params.amount) || 1;
    const outputAmount = inputAmount / toPrice;

    return {
      fromToken: params.fromToken,
      toToken: params.toToken,
      fromAmount: params.amount,
      toAmount: String(outputAmount.toFixed(8)),
      toTokenPrice: String(toPrice),
      price: String(toPrice),
      priceImpact: '0.3',
      route: ['direct'],
    };
  }

  async dexSwap(params: {
    chain: string;
    fromToken: string;
    toToken: string;
    amount: string;
    slippage?: string;
  }): Promise<any> {
    await delay(200);

    const quote = await this.dexQuote({
      chain: params.chain,
      fromToken: params.fromToken,
      toToken: params.toToken,
      amount: params.amount,
    });

    return {
      txHash: 'demo_swap_' + Date.now(),
      status: 'success',
      fromToken: params.fromToken,
      toToken: params.toToken,
      fromAmount: params.amount,
      toAmount: quote.toAmount,
    };
  }

  // ─── Payment ───────────────────────────────────────────

  async x402Pay(accepts: string): Promise<any> {
    // Parse accepts to extract payTo for consistent proof
    let payTo = DEMO_EVM_ADDR;
    try {
      const parsed = JSON.parse(accepts);
      if (Array.isArray(parsed) && parsed[0]?.payTo) payTo = parsed[0].payTo;
    } catch { /* use default */ }

    return {
      signature: '0x' + randomHex(130),
      authorization: {
        type: 'x402',
        token: 'demo_auth_' + randomHex(16),
        payer: DEMO_EVM_ADDR,
      },
      payTo,
    };
  }
}

// ─── Helpers ───────────────────────────────────────────────

function randomHex(length: number): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
