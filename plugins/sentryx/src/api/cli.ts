import { execFile } from 'child_process';

interface CliResult {
  ok: boolean;
  data?: any;
  error?: string;
}

function runCli(args: string[], timeout = 30000): Promise<CliResult> {
  return new Promise((resolve) => {
    execFile('onchainos', args, { timeout }, (err, stdout, stderr) => {
      if (err && !stdout) {
        resolve({ ok: false, error: err.message });
        return;
      }
      const output = stdout || stderr;
      try {
        const parsed = JSON.parse(output);
        if (parsed.ok === false) {
          resolve({ ok: false, error: parsed.error || 'Unknown CLI error' });
        } else {
          resolve({ ok: true, data: parsed.data ?? parsed });
        }
      } catch {
        resolve({ ok: false, error: `Failed to parse CLI output: ${output.slice(0, 200)}` });
      }
    });
  });
}

export class OnchainCli {

  // ─── Wallet ─────────────────────────────────────────────

  async walletStatus(): Promise<any> {
    const result = await runCli(['wallet', 'status']);
    if (!result.ok) throw new Error(`wallet status: ${result.error}`);
    return result.data;
  }

  async walletBalance(chain?: string): Promise<any[]> {
    const args = ['wallet', 'balance'];
    if (chain) args.push('--chain', chain);
    const result = await runCli(args);
    if (!result.ok) throw new Error(`wallet balance: ${result.error}`);
    return Array.isArray(result.data) ? result.data : [result.data];
  }

  async walletBalanceAll(): Promise<any[]> {
    const result = await runCli(['wallet', 'balance', '--all']);
    if (!result.ok) throw new Error(`wallet balance --all: ${result.error}`);
    return Array.isArray(result.data) ? result.data : [result.data];
  }

  async walletCreate(): Promise<any> {
    const result = await runCli(['wallet', 'add']);
    if (!result.ok) throw new Error(`wallet add: ${result.error}`);
    return result.data;
  }

  async walletSwitch(accountId: string): Promise<void> {
    const result = await runCli(['wallet', 'switch', accountId]);
    if (!result.ok) throw new Error(`wallet switch: ${result.error}`);
  }

  async walletSend(params: {
    chain: string;
    recipient: string;
    amount: string;
    tokenAddress?: string;
  }): Promise<any> {
    const args = ['wallet', 'send', '--chain', params.chain, '--recipient', params.recipient, '--readable-amount', params.amount];
    if (params.tokenAddress) args.push('--contract-token', params.tokenAddress);
    const result = await runCli(args, 60000);
    if (!result.ok) throw new Error(`wallet send: ${result.error}`);
    return result.data;
  }

  async walletAddresses(chain?: string): Promise<any> {
    const args = ['wallet', 'addresses'];
    if (chain) args.push('--chain', chain);
    const result = await runCli(args);
    if (!result.ok) throw new Error(`wallet addresses: ${result.error}`);
    return result.data;
  }

  // ─── Security ───────────────────────────────────────────

  async securityTokenScan(chain: string, address: string): Promise<any> {
    const result = await runCli(['security', 'token-scan', '--chain', chain, '--address', address]);
    if (!result.ok) throw new Error(`security token-scan: ${result.error}`);
    return result.data;
  }

  async securityTxScan(params: {
    chain: string;
    to: string;
    data?: string;
    value?: string;
  }): Promise<any> {
    const args = ['security', 'tx-scan', '--chain', params.chain, '--to', params.to];
    if (params.data) args.push('--data', params.data);
    if (params.value) args.push('--value', params.value);
    const result = await runCli(args);
    if (!result.ok) throw new Error(`security tx-scan: ${result.error}`);
    return result.data;
  }

  // ─── Trade ──────────────────────────────────────────────

  async dexQuote(params: {
    chain: string;
    fromToken: string;
    toToken: string;
    amount: string;
  }): Promise<any> {
    const result = await runCli([
      'dex', 'quote',
      '--chain', params.chain,
      '--from', params.fromToken,
      '--to', params.toToken,
      '--amount', params.amount,
    ]);
    if (!result.ok) throw new Error(`dex quote: ${result.error}`);
    return result.data;
  }

  async dexSwap(params: {
    chain: string;
    fromToken: string;
    toToken: string;
    amount: string;
    slippage?: string;
  }): Promise<any> {
    const args = [
      'dex', 'swap',
      '--chain', params.chain,
      '--from', params.fromToken,
      '--to', params.toToken,
      '--amount', params.amount,
    ];
    if (params.slippage) args.push('--slippage', params.slippage);
    const result = await runCli(args, 60000);
    if (!result.ok) throw new Error(`dex swap: ${result.error}`);
    return result.data;
  }

  // ─── Payment ────────────────────────────────────────────

  async x402Pay(accepts: string): Promise<any> {
    const result = await runCli(['payment', 'x402-pay', '--accepts', accepts]);
    if (!result.ok) throw new Error(`x402 pay: ${result.error}`);
    return result.data;
  }

  // ─── Auth ───────────────────────────────────────────────

  async walletLogin(email: string): Promise<void> {
    const result = await runCli(['wallet', 'login', email], 30000);
    if (!result.ok) throw new Error(`wallet login: ${result.error}`);
  }

  async walletVerify(code: string): Promise<any> {
    const result = await runCli(['wallet', 'verify', code], 30000);
    if (!result.ok) throw new Error(`wallet verify: ${result.error}`);
    return result.data;
  }
}
