import { McpClient } from '../api/mcp-client';
import { OnchainCli } from '../api/cli';
import { TokenInfo, SafetyResult, GateResult } from '../config';

export class SafetyGate {
  constructor(private mcp: McpClient, private cli: OnchainCli) {}

  async evaluate(token: TokenInfo): Promise<SafetyResult> {
    const gates: GateResult[] = [];

    // Gate 1: Contract Security (35 pts)
    gates.push(await this.gate1ContractSecurity(token));

    // Gate 2: Market Health (30 pts)
    gates.push(await this.gate2MarketHealth(token));

    // Gate 3: Token Reputation (15 pts) — holder distribution & dev history
    gates.push(await this.gate3TokenReputation(token));

    // Gate 4: Transaction Simulation (20 pts)
    gates.push(await this.gate4TxSimulation(token));

    const totalScore = gates.reduce((sum, g) => sum + g.score, 0);
    let verdict: SafetyResult['verdict'];
    if (totalScore >= 70) verdict = 'EXECUTE';
    else if (totalScore >= 40) verdict = 'SKIP';
    else verdict = 'BLACKLIST';

    return { score: totalScore, gates, verdict };
  }

  private async gate1ContractSecurity(token: TokenInfo): Promise<GateResult> {
    try {
      const result = await this.cli.securityTokenScan(token.chain, token.address);
      const data = result?.riskList || result;

      let hasBlock = false;
      let hasWarning = false;
      const findings: string[] = [];

      const checkFlag = (field: string, label: string, isBlock: boolean) => {
        const val = data?.[field] || result?.[field];
        if (val === true || val === '1' || val === 'true') {
          findings.push(label);
          if (isBlock) hasBlock = true;
          else hasWarning = true;
        }
      };

      checkFlag('isHoneypot', 'Honeypot detected', true);
      checkFlag('honeypot', 'Honeypot detected', true);
      checkFlag('canMint', 'Mint backdoor', true);
      checkFlag('mintBackdoor', 'Mint backdoor', true);
      checkFlag('highTax', 'Transfer tax > 10%', true);

      checkFlag('isProxy', 'Unverified proxy', false);
      checkFlag('ownerNotRenounced', 'Ownership not renounced', false);
      checkFlag('canPause', 'Can pause transfers', false);

      let score: number;
      let status: GateResult['status'];
      if (hasBlock) { score = 0; status = 'BLOCK'; }
      else if (hasWarning) { score = 20; status = 'WARNING'; }
      else { score = 35; status = 'PASS'; }

      return { gate: 'Contract Security', score, maxScore: 35, status, details: findings.join('; ') || 'No issues' };
    } catch (e) {
      return { gate: 'Contract Security', score: 0, maxScore: 35, status: 'UNABLE_TO_VERIFY', details: `Scan failed: ${e}` };
    }
  }

  private async gate2MarketHealth(token: TokenInfo): Promise<GateResult> {
    try {
      const detail = await this.mcp.getTokenDetail(token.chain, token.address);
      if (!detail) {
        return { gate: 'Market Health', score: 0, maxScore: 30, status: 'UNABLE_TO_VERIFY', details: 'No market data' };
      }

      let hasBlock = false;
      let hasWarning = false;
      const findings: string[] = [];

      const holderConc = parseFloat(detail.top10HolderRate || detail.holderConcentration || '0');
      const liquidity = parseFloat(detail.liquidity || detail.totalLiquidity || '0');
      const volume24h = parseFloat(detail.volume24h || detail.tradingVolume24h || '0');
      const marketCap = parseFloat(detail.marketCap || '0');

      if (holderConc > 0.9) { findings.push(`Top10 holders: ${(holderConc * 100).toFixed(0)}%`); hasBlock = true; }
      else if (holderConc > 0.7) { findings.push(`Top10 holders: ${(holderConc * 100).toFixed(0)}%`); hasWarning = true; }

      if (liquidity < 10000) { findings.push(`Liquidity: $${liquidity.toFixed(0)}`); hasBlock = true; }
      if (volume24h < 1000) { findings.push(`24h volume: $${volume24h.toFixed(0)}`); hasBlock = true; }
      if (marketCap > 0 && marketCap < 50000) { findings.push(`Market cap: $${marketCap.toFixed(0)}`); hasWarning = true; }

      let score: number;
      let status: GateResult['status'];
      if (hasBlock) { score = 0; status = 'BLOCK'; }
      else if (hasWarning) { score = 18; status = 'WARNING'; }
      else { score = 30; status = 'PASS'; }

      return { gate: 'Market Health', score, maxScore: 30, status, details: findings.join('; ') || 'Healthy' };
    } catch (e) {
      return { gate: 'Market Health', score: 0, maxScore: 30, status: 'UNABLE_TO_VERIFY', details: `Failed: ${e}` };
    }
  }

  private async gate3TokenReputation(token: TokenInfo): Promise<GateResult> {
    try {
      const holders = await this.mcp.getHolderDistribution(token.chain, token.address);
      if (!holders) {
        return { gate: 'Token Reputation', score: 8, maxScore: 15, status: 'WARNING', details: 'No holder data available' };
      }

      let score = 15;
      const findings: string[] = [];

      const bundlerRatio = holders.bundlerRatio ?? 0;
      const sniperRatio = holders.sniperRatio ?? 0;
      const top10Pct = holders.top10Pct ?? 0;

      if (bundlerRatio >= 0.3) {
        score -= 8;
        findings.push(`Bundler ratio: ${(bundlerRatio * 100).toFixed(0)}%`);
      } else if (bundlerRatio >= 0.15) {
        score -= 4;
        findings.push(`Bundler ratio: ${(bundlerRatio * 100).toFixed(0)}%`);
      }

      if (sniperRatio >= 0.2) {
        score -= 4;
        findings.push(`Sniper ratio: ${(sniperRatio * 100).toFixed(0)}%`);
      }

      if (top10Pct >= 0.8) {
        score -= 5;
        findings.push(`Top10 hold: ${(top10Pct * 100).toFixed(0)}%`);
      } else if (top10Pct >= 0.6) {
        score -= 2;
        findings.push(`Top10 hold: ${(top10Pct * 100).toFixed(0)}%`);
      }

      score = Math.max(0, score);
      const status: GateResult['status'] = score >= 12 ? 'PASS' : score >= 6 ? 'WARNING' : 'BLOCK';
      return { gate: 'Token Reputation', score, maxScore: 15, status, details: findings.join('; ') || 'Clean holder profile' };
    } catch (e) {
      return { gate: 'Token Reputation', score: 8, maxScore: 15, status: 'WARNING', details: `Check failed: ${e}` };
    }
  }

  private async gate4TxSimulation(token: TokenInfo): Promise<GateResult> {
    // For signal-based trades, we may not have exact tx data yet.
    // Award partial score based on contract security passing.
    // Full simulation happens at trade execution time.
    try {
      const result = await this.cli.securityTxScan({
        chain: token.chain,
        to: token.address,
      });

      const safe = result?.safe !== false && result?.executeResult !== false;
      if (!safe) {
        const msg = result?.executeErrorMsg || result?.riskMessage || 'Simulation failed';
        return { gate: 'Tx Simulation', score: 0, maxScore: 20, status: 'BLOCK', details: msg };
      }

      return { gate: 'Tx Simulation', score: 20, maxScore: 20, status: 'PASS', details: 'Simulation passed' };
    } catch {
      // If simulation not available, award partial score
      return { gate: 'Tx Simulation', score: 12, maxScore: 20, status: 'WARNING', details: 'Simulation unavailable, partial score' };
    }
  }
}
