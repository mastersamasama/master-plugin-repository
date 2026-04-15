import { OnchainCli } from '../api/cli';
import { FileStore } from '../store';
import { WalletMatrix } from './wallet-matrix';
import { ScoredSignal, Position, ClosedPosition, StrategyConfig, CHAINS, HARD_LIMITS } from '../config';

export class TradeExecutor {
  constructor(
    private cli: OnchainCli,
    private store: FileStore,
    private walletMatrix: WalletMatrix,
  ) {}

  async buy(signal: ScoredSignal, safetyScore: number, config: StrategyConfig): Promise<Position | null> {
    // Enforce hard limits
    const activePositions = this.store.getActivePositions();
    const totalExposure = activePositions.reduce((sum, p) => sum + p.entryAmount, 0);

    if (config.positionSize > HARD_LIMITS.maxPerTrade) {
      console.log(`[Trader] Position size ${config.positionSize} exceeds hard limit ${HARD_LIMITS.maxPerTrade}`);
      return null;
    }
    if (totalExposure + config.positionSize > HARD_LIMITS.maxTotalExposure) {
      console.log(`[Trader] Total exposure would exceed ${HARD_LIMITS.maxTotalExposure}`);
      return null;
    }

    // Check per-token limit
    const tokenPositions = activePositions.filter(p => p.token.address === signal.token.address);
    const tokenExposure = tokenPositions.reduce((sum, p) => sum + p.entryAmount, 0);
    if (tokenExposure + config.positionSize > config.maxPerToken) {
      console.log(`[Trader] Token exposure would exceed ${config.maxPerToken}`);
      return null;
    }

    const primarySource = Object.keys(signal.sources)[0] || 'unknown';
    const chainConfig = CHAINS[signal.token.chain];
    if (!chainConfig) {
      console.log(`[Trader] Unknown chain: ${signal.token.chain}`);
      return null;
    }

    try {
      // Get or create sub-wallet
      const sourceCode = primarySource === 'smartMoney' ? 'sm' : primarySource === 'newToken' ? 'sn' : 'an';
      const chainCode = signal.token.chain === '501' ? 'sol' : signal.token.chain === '8453' ? 'base' : 'eth';
      const slot = await this.walletMatrix.getOrCreate(sourceCode, chainCode);

      // Get quote
      const quote = await this.cli.dexQuote({
        chain: signal.token.chain,
        fromToken: chainConfig.stablecoin.address,
        toToken: signal.token.address,
        amount: String(config.positionSize),
      });

      const entryPrice = parseFloat(quote?.toTokenPrice || quote?.price || '0');

      // Execute swap
      const swapResult = await this.cli.dexSwap({
        chain: signal.token.chain,
        fromToken: chainConfig.stablecoin.address,
        toToken: signal.token.address,
        amount: String(config.positionSize),
        slippage: '0.05',
      });

      const txHash = swapResult?.txHash || swapResult?.hash || `tx_${Date.now()}`;

      // Create position
      const position: Position = {
        positionId: `pos_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        token: signal.token,
        wallet: slot.name,
        walletIndex: slot.index,
        entryPrice,
        entryAmount: config.positionSize,
        entryTxHash: txHash,
        entryTime: new Date().toISOString(),
        status: 'MONITORING',
        highestPrice: entryPrice,
        currentPrice: entryPrice,
        unrealizedPnl: 0,
        takeProfit: { trigger: config.tpTrigger, trailing: config.tpTrailing, activated: false },
        stopLoss: config.slThreshold,
        timeoutHours: config.timeoutHours,
        source: primarySource,
        signalScore: signal.compositeScore,
        safetyScore,
      };

      this.store.savePosition(position);
      console.log(`[Trader] BUY ${signal.token.symbol} (${chainCode}) → ${slot.name} | $${config.positionSize} | tx: ${txHash}`);

      return position;
    } catch (e) {
      console.error(`[Trader] Buy failed for ${signal.token.symbol}:`, e);
      return null;
    }
  }

  async sell(position: Position, reason: ClosedPosition['exitReason'] = 'MANUAL'): Promise<ClosedPosition | null> {
    const chainConfig = CHAINS[position.token.chain];
    if (!chainConfig) return null;

    try {
      const swapResult = await this.cli.dexSwap({
        chain: position.token.chain,
        fromToken: position.token.address,
        toToken: chainConfig.stablecoin.address,
        amount: 'max',
        slippage: '0.05',
      });

      const txHash = swapResult?.txHash || swapResult?.hash || `tx_${Date.now()}`;
      const pnlPct = position.currentPrice > 0 && position.entryPrice > 0
        ? (position.currentPrice - position.entryPrice) / position.entryPrice
        : 0;

      const closed: ClosedPosition = {
        ...position,
        exitPrice: position.currentPrice,
        exitTxHash: txHash,
        exitTime: new Date().toISOString(),
        exitReason: reason,
        realizedPnl: pnlPct * position.entryAmount,
      };

      this.store.closePosition(closed);
      console.log(`[Trader] SELL ${position.token.symbol} (${position.wallet}) | ${reason} | PnL: ${(pnlPct * 100).toFixed(1)}%`);

      return closed;
    } catch (e) {
      console.error(`[Trader] Sell failed for ${position.token.symbol}:`, e);
      return null;
    }
  }
}
