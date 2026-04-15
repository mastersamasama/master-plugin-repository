import { McpClient } from '../api/mcp-client';
import { FileStore } from '../store';
import { TradeExecutor } from './trader';
import { Position, ClosedPosition, AlphaReport } from '../config';

export interface PositionUpdate {
  position: Position;
  action: 'HOLD' | 'SELL_TP' | 'SELL_SL' | 'SELL_TIMEOUT';
  closed?: ClosedPosition;
}

export class PositionManager {
  constructor(
    private mcp: McpClient,
    private trader: TradeExecutor,
    private store: FileStore,
  ) {}

  async check(position: Position): Promise<'HOLD' | 'SELL_TP' | 'SELL_SL' | 'SELL_TIMEOUT'> {
    // Get current price
    const priceData = await this.mcp.getTokenPrice(position.token.chain, position.token.address);
    const currentPrice = parseFloat(priceData?.price || priceData?.usdPrice || String(position.currentPrice));

    if (!currentPrice || currentPrice <= 0) return 'HOLD';

    // Update position state
    position.currentPrice = currentPrice;
    if (currentPrice > position.highestPrice) {
      position.highestPrice = currentPrice;
    }
    position.unrealizedPnl = (currentPrice - position.entryPrice) / position.entryPrice;

    // Check timeout first
    const entryTime = new Date(position.entryTime).getTime();
    const elapsed = (Date.now() - entryTime) / (1000 * 60 * 60);
    if (elapsed >= position.timeoutHours) {
      return 'SELL_TIMEOUT';
    }

    // Check stop loss
    const pnlPct = (currentPrice - position.entryPrice) / position.entryPrice;
    if (pnlPct <= position.stopLoss) {
      return 'SELL_SL';
    }

    // Check trailing take-profit
    if (!position.takeProfit.activated) {
      if (pnlPct >= position.takeProfit.trigger) {
        position.takeProfit.activated = true;
        position.status = 'TRAILING';
        console.log(`[Position] ${position.token.symbol} TP activated at ${(pnlPct * 100).toFixed(1)}%`);
      }
    }

    if (position.takeProfit.activated) {
      const pullbackFromHigh = (position.highestPrice - currentPrice) / position.highestPrice;
      if (pullbackFromHigh >= position.takeProfit.trailing) {
        return 'SELL_TP';
      }
    }

    // Save updated state
    this.store.savePosition(position);
    return 'HOLD';
  }

  async checkAll(): Promise<PositionUpdate[]> {
    const positions = this.store.getActivePositions();
    const updates: PositionUpdate[] = [];

    for (const position of positions) {
      try {
        const action = await this.check(position);

        if (action === 'HOLD') {
          this.store.savePosition(position);
          updates.push({ position, action });
        } else {
          const reason = action === 'SELL_TP' ? 'TRAILING_TP' as const
            : action === 'SELL_SL' ? 'STOP_LOSS' as const
            : 'TIMEOUT' as const;

          const closed = await this.trader.sell(position, reason);
          updates.push({ position, action, closed: closed || undefined });
        }
      } catch (e) {
        console.error(`[Position] Check failed for ${position.positionId}:`, e);
        updates.push({ position, action: 'HOLD' });
      }
    }

    return updates;
  }

  getActive(): Position[] {
    return this.store.getActivePositions();
  }

  getClosed(): ClosedPosition[] {
    return this.store.getClosedPositions();
  }

  getReport(): AlphaReport {
    const active = this.getActive();
    const closed = this.getClosed();
    const state = this.store.getConfig();

    const realizedPnl = closed.reduce((sum, p) => sum + p.realizedPnl, 0);
    const unrealizedPnl = active.reduce((sum, p) => sum + p.unrealizedPnl * p.entryAmount, 0);

    return {
      runtime: state.lastScanTime
        ? `${Math.round((Date.now() - new Date(state.lastScanTime).getTime()) / 60000)}m`
        : '0m',
      signalsScanned: state.scanCount,
      passedSafety: closed.length + active.length,
      tradesExecuted: closed.length + active.length,
      realizedPnl: Math.round(realizedPnl * 100) / 100,
      unrealizedPnl: Math.round(unrealizedPnl * 100) / 100,
      x402Income: 0,
      x402Spend: 0,
    };
  }
}
