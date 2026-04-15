import * as https from 'https';
import * as http from 'http';
import { OnchainCli } from '../api/cli';
import { SafetyGate } from '../core/safety';
import { TradeExecutor } from '../core/trader';
import { PaymentRequirements, Signal, ScoredSignal, StrategyConfig, HARD_LIMITS } from '../config';

export class SignalBuyer {
  private dailySpend = 0;
  private lastResetDate = new Date().toDateString();

  constructor(
    private cli: OnchainCli,
    private safety: SafetyGate,
    private trader: TradeExecutor,
  ) {}

  private resetDailyIfNeeded(): void {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.dailySpend = 0;
      this.lastResetDate = today;
    }
  }

  async probe(url: string): Promise<PaymentRequirements | null> {
    return new Promise((resolve) => {
      const parsed = new URL(url);
      const transport = parsed.protocol === 'https:' ? https : http;

      const req = transport.get(url, (res) => {
        let data = '';
        const headers: Record<string, string> = {};
        for (const [k, v] of Object.entries(res.headers)) {
          if (v) headers[k.toLowerCase()] = Array.isArray(v) ? v[0] : v;
        }

        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode !== 402) {
            resolve(null);
            return;
          }
          try {
            // v2: PAYMENT-REQUIRED header (base64)
            const headerVal = headers['payment-required'];
            if (headerVal) {
              const decoded = JSON.parse(Buffer.from(headerVal, 'base64').toString());
              resolve(decoded as PaymentRequirements);
              return;
            }
            // v1: response body
            const bodyParsed = JSON.parse(data);
            resolve(bodyParsed as PaymentRequirements);
          } catch {
            resolve(null);
          }
        });
      });
      req.on('error', () => resolve(null));
      req.setTimeout(10000, () => { req.destroy(); resolve(null); });
    });
  }

  async buyAndExecute(
    url: string,
    config: { maxPayPerSignal: number; maxDailySpend: number; positionSize: number; chains: string[] },
    strategyConfig: StrategyConfig,
  ): Promise<{ signal: Signal | null; traded: boolean; error?: string }> {
    this.resetDailyIfNeeded();

    // Step 1: Probe
    const requirements = await this.probe(url);
    if (!requirements) {
      return { signal: null, traded: false, error: 'Endpoint did not return 402 or could not be parsed' };
    }

    // Step 2: Check payment limits
    const option = requirements.accepts[0];
    const amountUsd = parseFloat(option.amount) / 1e6; // USDG 6 decimals
    if (amountUsd > config.maxPayPerSignal) {
      return { signal: null, traded: false, error: `Price ${amountUsd} exceeds max ${config.maxPayPerSignal}` };
    }
    if (amountUsd > HARD_LIMITS.x402MaxPerSignal) {
      return { signal: null, traded: false, error: `Price ${amountUsd} exceeds hard limit ${HARD_LIMITS.x402MaxPerSignal}` };
    }
    if (this.dailySpend + amountUsd > config.maxDailySpend) {
      return { signal: null, traded: false, error: `Daily spend would exceed ${config.maxDailySpend}` };
    }

    // Step 3: Pay via x402
    let paymentProof: any;
    try {
      paymentProof = await this.cli.x402Pay(JSON.stringify(requirements.accepts));
    } catch (e) {
      return { signal: null, traded: false, error: `Payment failed: ${e}` };
    }

    this.dailySpend += amountUsd;

    // Step 4: Replay with payment header
    const signal = await this.replayWithPayment(url, requirements, paymentProof);
    if (!signal) {
      return { signal: null, traded: false, error: 'Failed to retrieve signal after payment' };
    }

    // Step 5: Validate signal format
    if (!signal.token?.address || !signal.token?.chain) {
      return { signal, traded: false, error: 'Invalid signal format: missing token address or chain' };
    }
    if (!config.chains.includes(signal.token.chain)) {
      return { signal, traded: false, error: `Signal chain ${signal.token.chain} not in target chains` };
    }

    // Step 6: Safety check
    const safetyResult = await this.safety.evaluate(signal.token);
    if (safetyResult.verdict !== 'EXECUTE') {
      return { signal, traded: false, error: `Safety check: ${safetyResult.verdict} (score: ${safetyResult.score})` };
    }

    // Step 7: Execute trade
    const scored: ScoredSignal = {
      token: signal.token,
      sources: signal.sources || {},
      compositeScore: signal.compositeScore || signal.safetyScore || 50,
      timestamp: new Date().toISOString(),
    };

    const buyConfig = { ...strategyConfig, positionSize: config.positionSize };
    const position = await this.trader.buy(scored, safetyResult.score, buyConfig);

    return { signal, traded: position !== null };
  }

  private async replayWithPayment(url: string, requirements: PaymentRequirements, proof: any): Promise<Signal | null> {
    const accepted = requirements.accepts[0];
    if (proof.sessionCert) {
      accepted.extra = { ...accepted.extra, sessionCert: proof.sessionCert };
    }

    const paymentPayload = {
      x402Version: requirements.x402Version || 2,
      resource: requirements.resource,
      accepted,
      payload: { signature: proof.signature, authorization: proof.authorization },
    };

    const headerValue = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');
    const headerName = (requirements.x402Version || 2) >= 2 ? 'PAYMENT-SIGNATURE' : 'X-PAYMENT';

    return new Promise((resolve) => {
      const parsed = new URL(url);
      const transport = parsed.protocol === 'https:' ? https : http;

      const options: http.RequestOptions = {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method: 'GET',
        headers: { [headerName]: headerValue },
      };

      const req = transport.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try { resolve(JSON.parse(data)); } catch { resolve(null); }
        });
      });
      req.on('error', () => resolve(null));
      req.setTimeout(10000, () => { req.destroy(); resolve(null); });
      req.end();
    });
  }
}
