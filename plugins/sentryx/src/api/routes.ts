import { Router, Request, Response } from 'express';
import { EventEmitter } from 'events';
import { McpClient } from './mcp-client';
import { OnchainCli } from './cli';
import { FileStore } from '../store';
import { SignalScanner } from '../core/scanner';
import { compositeScore, qualifies } from '../core/scorer';
import { SafetyGate } from '../core/safety';
import { TradeExecutor } from '../core/trader';
import { PositionManager } from '../core/position';
import { WalletMatrix } from '../core/wallet-matrix';
import { startSignalServer, stopSignalServer, isSignalServerRunning } from '../x402/signal-server';
import { SignalBuyer } from '../x402/signal-buyer';
import { AppState, StrategyConfig, DEFAULT_STRATEGY, RawSignal, Signal, CHAINS } from '../config';

export const events = new EventEmitter();
events.setMaxListeners(50);

let scanInterval: ReturnType<typeof setInterval> | null = null;
let scanRunning = false;
let x402Income = 0;
let x402Spend = 0;

function emitActivity(type: string, message: string) {
  events.emit('activity', { type, message, timestamp: new Date().toISOString() });
}

export function createRouter(deps: {
  mcp: McpClient;
  cli: OnchainCli;
  store: FileStore;
  scanner: SignalScanner;
  safety: SafetyGate;
  trader: TradeExecutor;
  positionManager: PositionManager;
  walletMatrix: WalletMatrix;
  signalBuyer: SignalBuyer;
  isDemo?: boolean;
}): Router {
  const { mcp, cli, store, scanner, safety, trader, positionManager, walletMatrix, signalBuyer, isDemo } = deps;
  const router = Router();

  // ─── SSE ────────────────────────────────────────────────

  router.get('/api/events', (req: Request, res: Response) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const send = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const onSignal = (d: any) => send('signal:new', d);
    const onTrade = (d: any) => send('trade:executed', d);
    const onPosUpdate = (d: any) => send('position:update', d);
    const onPosClosed = (d: any) => send('position:closed', d);
    const onX402 = (d: any) => send('x402:payment', d);
    const onStatus = (d: any) => send('status:update', d);
    const onActivity = (d: any) => send('activity', d);
    const onPipeline = (d: any) => send('pipeline:update', d);

    events.on('signal:new', onSignal);
    events.on('trade:executed', onTrade);
    events.on('position:update', onPosUpdate);
    events.on('position:closed', onPosClosed);
    events.on('x402:payment', onX402);
    events.on('status:update', onStatus);
    events.on('activity', onActivity);
    events.on('pipeline:update', onPipeline);

    // Heartbeat
    const heartbeat = setInterval(() => res.write(':heartbeat\n\n'), 15000);

    req.on('close', () => {
      clearInterval(heartbeat);
      events.off('signal:new', onSignal);
      events.off('trade:executed', onTrade);
      events.off('position:update', onPosUpdate);
      events.off('position:closed', onPosClosed);
      events.off('x402:payment', onX402);
      events.off('status:update', onStatus);
      events.off('activity', onActivity);
      events.off('pipeline:update', onPipeline);
    });
  });

  // ─── Auth ───────────────────────────────────────────────

  router.post('/api/auth/login', async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) { res.status(400).json({ error: 'email required' }); return; }
    try {
      await (cli as any).walletLogin(email);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/api/auth/verify', async (req: Request, res: Response) => {
    const { code } = req.body;
    if (!code) { res.status(400).json({ error: 'code required' }); return; }
    try {
      await (cli as any).walletVerify(code);
      const status = await cli.walletStatus();
      res.json({ ok: true, wallet: status });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ─── Status ─────────────────────────────────────────────

  router.get('/api/status', async (_req: Request, res: Response) => {
    try {
      let wallet = null;
      try { wallet = await cli.walletStatus(); } catch { /* not logged in */ }
      const state = store.getConfig();
      res.json({
        wallet,
        scanning: !!scanInterval,
        config: state.config,
        scanCount: state.scanCount,
        lastScanTime: state.lastScanTime,
        activePositions: positionManager.getActive().length,
        closedPositions: positionManager.getClosed().length,
        x402Selling: isSignalServerRunning(),
        x402Subscriptions: state.x402Subscriptions,
        demo: !!isDemo,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ─── Portfolio ───────────────────────────────────────────

  router.get('/api/portfolio', async (_req: Request, res: Response) => {
    try {
      const balances = await cli.walletBalance();
      const tokenAssets = balances?.[0]?.tokenAssets || balances || [];

      let totalUsd = 0;
      const chains: Record<string, { name: string; address: string; tokens: any[] }> = {};

      for (const t of tokenAssets) {
        const usdValue = parseFloat(t.usdValue || '0');
        totalUsd += usdValue;
        const chainId = t.chainIndex || '1';
        const addr = t.address || '';
        const chainConfig = CHAINS[chainId];
        const chainName = chainConfig?.name || chainId;

        if (!chains[chainId]) {
          chains[chainId] = { name: chainName, address: addr, tokens: [] };
        }
        if (addr && !chains[chainId].address) {
          chains[chainId].address = addr;
        }
        chains[chainId].tokens.push({
          symbol: t.symbol || t.tokenSymbol || 'UNKNOWN',
          balance: t.balance || '0',
          usdValue,
          tokenAddress: t.tokenAddress || t.tokenContractAddress || '',
        });
      }

      for (const c of Object.values(chains)) {
        c.tokens.sort((a: any, b: any) => b.usdValue - a.usdValue);
      }

      res.json({ totalUsd, chains });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ─── Security ───────────────────────────────────────────

  router.get('/api/security/scan', async (_req: Request, res: Response) => {
    try {
      // Get wallet balance to find tokens
      const balances = await cli.walletBalance();
      const tokens = balances?.[0]?.tokenAssets || balances || [];

      const results: any[] = [];
      for (const token of tokens.slice(0, 20)) {
        const addr = token.tokenAddress || token.tokenContractAddress;
        const chain = token.chainIndex || '1';
        const symbol = token.symbol || token.tokenSymbol || 'UNKNOWN';
        const usdValue = parseFloat(token.usdValue || '0');

        // Skip native tokens and stablecoins
        const skipSymbols = ['ETH', 'SOL', 'BNB', 'MATIC', 'AVAX', 'USDT', 'USDC', 'DAI', 'BUSD', 'FDUSD'];
        if (!addr || skipSymbols.includes(symbol.toUpperCase())) {
          results.push({ symbol, chain, address: addr || 'native', risk: 'safe', score: 100, usdValue, details: 'Native/stablecoin — safe' });
          continue;
        }

        try {
          const scan = await cli.securityTokenScan(chain, addr);
          const data = scan?.riskList || scan || {};
          let risk: 'safe' | 'warning' | 'danger' = 'safe';
          let score = 100;
          const findings: string[] = [];

          // All check items with label, field name, severity, and result
          const checks: { label: string; field: string; danger: boolean; passed: boolean }[] = [];

          const flags: [string, string, boolean][] = [
            ['isHoneypot', 'Honeypot', true],
            ['honeypot', 'Honeypot', true],
            ['canMint', 'Mint backdoor', true],
            ['mintBackdoor', 'Mint backdoor', true],
            ['highTax', 'High transfer tax', true],
            ['isProxy', 'Upgradeable proxy', false],
            ['ownerNotRenounced', 'Ownership not renounced', false],
            ['canPause', 'Can pause transfers', false],
            ['canBlacklist', 'Blacklist function', false],
            ['isAntiWhale', 'Anti-whale mechanism', false],
            ['hasHiddenOwner', 'Hidden owner', true],
            ['externalCall', 'External call risk', false],
          ];

          for (const [field, label, isDanger] of flags) {
            const flagged = data?.[field] === true || data?.[field] === '1' || data?.[field] === 'true' ||
                scan?.[field] === true || scan?.[field] === '1';
            checks.push({ label, field, danger: isDanger, passed: !flagged });
            if (flagged) {
              findings.push(label);
              if (isDanger) { risk = 'danger'; score -= 40; }
              else { if (risk !== 'danger') risk = 'warning'; score -= 15; }
            }
          }

          score = Math.max(0, score);

          // Extra metadata from scan
          const buyTax = scan?.buyTax || data?.buyTax || null;
          const sellTax = scan?.sellTax || data?.sellTax || null;
          const holderCount = scan?.holderCount || data?.holderCount || null;
          const lpLocked = scan?.lpLocked ?? data?.lpLocked ?? null;
          const contractVerified = scan?.contractVerified ?? data?.contractVerified ?? null;

          results.push({
            symbol, chain, address: addr, risk, score, usdValue,
            details: findings.join(', ') || 'No issues',
            checks,
            buyTax, sellTax, holderCount, lpLocked, contractVerified,
          });
        } catch {
          results.push({ symbol, chain, address: addr, risk: 'warning', score: 50, usdValue, details: 'Scan unavailable', checks: [] });
        }
      }

      // Sort: danger first, then warning, then safe
      const order = { danger: 0, warning: 1, safe: 2 };
      results.sort((a, b) => order[a.risk as keyof typeof order] - order[b.risk as keyof typeof order]);

      // Overall score
      const overallScore = results.length > 0
        ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
        : 100;

      res.json({ overallScore, tokens: results });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get('/api/security/approvals', async (req: Request, res: Response) => {
    try {
      const chain = (req.query.chain as string) || '1';
      const result = await cli.securityTokenScan(chain, ''); // approvals scan
      res.json(result);
    } catch (e: any) {
      // Try onchainos security approvals directly
      try {
        const result = await new Promise<any>((resolve, reject) => {
          const { execFile } = require('child_process');
          execFile('onchainos', ['security', 'approvals'], { timeout: 30000 }, (err: any, stdout: string) => {
            if (err && !stdout) { reject(err); return; }
            try { resolve(JSON.parse(stdout)); } catch { reject(new Error('Parse failed')); }
          });
        });
        res.json(result?.data || result || []);
      } catch {
        res.json([]);
      }
    }
  });

  router.post('/api/security/token-scan', async (req: Request, res: Response) => {
    const { chain, address } = req.body;
    if (!chain || !address) { res.status(400).json({ error: 'chain and address required' }); return; }
    try {
      const result = await cli.securityTokenScan(chain, address);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ─── Signals ────────────────────────────────────────────

  router.get('/api/signals', (_req: Request, res: Response) => {
    res.json(store.getSignalHistory(50));
  });

  // ─── Positions ──────────────────────────────────────────

  router.get('/api/positions', (_req: Request, res: Response) => {
    res.json({
      active: positionManager.getActive(),
      closed: positionManager.getClosed(),
    });
  });

  // ─── Report ─────────────────────────────────────────────

  router.get('/api/report', (_req: Request, res: Response) => {
    const report = positionManager.getReport();
    report.x402Income = x402Income;
    report.x402Spend = x402Spend;
    res.json(report);
  });

  // ─── Strategy Start/Stop ────────────────────────────────

  router.post('/api/strategy/start', (req: Request, res: Response) => {
    if (scanInterval) {
      res.status(400).json({ error: 'Already scanning' });
      return;
    }

    const config: StrategyConfig = { ...DEFAULT_STRATEGY, ...req.body };
    const state = store.getConfig();
    state.config = config;
    state.scanning = true;
    store.saveConfig(state);

    const runScan = async () => {
      if (scanRunning) return;
      scanRunning = true;
      try {
        const s0 = store.getConfig();
        const cycleNum = (s0.scanCount || 0) + 1;
        console.log('[Scan] Starting scan cycle...');
        emitActivity('scan_start', `Cycle #${cycleNum} started`);

        // 1. Check positions
        const posUpdates = await positionManager.checkAll();
        for (const u of posUpdates) {
          if (u.closed) {
            events.emit('position:closed', u.closed);
            emitActivity('sell', `${u.closed.token.symbol} ${u.closed.exitReason} ${u.closed.realizedPnl >= 0 ? '+' : ''}${u.closed.realizedPnl.toFixed(2)}`);
          } else {
            events.emit('position:update', u.position);
          }
        }

        // 2. Scan signals
        const rawSignals = await scanner.scan(config);
        console.log(`[Scan] Found ${rawSignals.length} raw signals`);
        emitActivity('scan_found', `Found ${rawSignals.length} raw signals`);

        // 3. Group by token and score
        const tokenMap = new Map<string, RawSignal[]>();
        for (const s of rawSignals) {
          const key = `${s.token.chain}:${s.token.address}`;
          if (!tokenMap.has(key)) tokenMap.set(key, []);
          tokenMap.get(key)!.push(s);
        }

        const blacklist = store.getBlacklist();
        const activeTokens = new Set(positionManager.getActive().map(p => `${p.token.chain}:${p.token.address}`));
        let signalCount = 0;
        let qualifiedCount = 0;
        let passedCount = 0;
        let tradedCount = 0;

        for (const [key, signals] of tokenMap) {
          if (blacklist.includes(signals[0].token.address)) continue;
          if (activeTokens.has(key)) continue;

          const scored = compositeScore(signals);
          if (!scored) continue;

          if (!qualifies(scored, config)) {
            // Emit as SKIP so the UI shows unqualified signals too
            const skipSignal: Signal = {
              ...scored,
              signalId: `sig_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${String(++signalCount).padStart(3, '0')}`,
              safetyScore: 0,
              action: 'SKIP',
              suggestedEntry: 0,
            };
            events.emit('signal:new', skipSignal);
            emitActivity('skip', `${scored.token.symbol} score ${scored.compositeScore} — below threshold`);
            continue;
          }
          qualifiedCount++;

          // 4. Safety check
          const safetyResult = await safety.evaluate(scored.token);
          const signal: Signal = {
            ...scored,
            signalId: `sig_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${String(++signalCount).padStart(3, '0')}`,
            safetyScore: safetyResult.score,
            action: safetyResult.verdict === 'EXECUTE' ? 'BUY' : safetyResult.verdict === 'SKIP' ? 'SKIP' : 'BLACKLIST',
            suggestedEntry: 0,
          };

          store.saveSignal(signal);
          events.emit('signal:new', signal);

          if (safetyResult.verdict === 'BLACKLIST') {
            store.addToBlacklist(scored.token.address);
            emitActivity('block', `${scored.token.symbol} blacklisted — safety ${safetyResult.score}/100`);
            continue;
          }
          if (safetyResult.verdict !== 'EXECUTE') {
            emitActivity('skip', `${scored.token.symbol} score ${safetyResult.score} — below threshold`);
            continue;
          }

          passedCount++;
          emitActivity('safe', `${scored.token.symbol} safety ${safetyResult.score}/100 ✓`);

          // 5. Trade
          const position = await trader.buy(scored, safetyResult.score, config);
          if (position) {
            tradedCount++;
            events.emit('trade:executed', position);
            emitActivity('buy', `${scored.token.symbol} $${config.positionSize} → ${position.wallet}`);
          }
        }

        // Update state
        const s = store.getConfig();
        s.scanCount = cycleNum;
        s.lastScanTime = new Date().toISOString();
        store.saveConfig(s);

        events.emit('status:update', {
          scanning: true,
          scanCount: s.scanCount,
          activePositions: positionManager.getActive().length,
        });

        events.emit('pipeline:update', {
          raw: rawSignals.length,
          qualified: qualifiedCount,
          passed: passedCount,
          traded: tradedCount,
        });

        emitActivity('scan_end', `Cycle #${cycleNum} complete — ${tradedCount} trades`);
        console.log(`[Scan] Cycle complete. Signals: ${signalCount}, Active positions: ${positionManager.getActive().length}`);
      } catch (e) {
        console.error('[Scan] Error:', e);
      } finally {
        scanRunning = false;
      }
    };

    // Run immediately, then on interval
    runScan();
    scanInterval = setInterval(runScan, config.scanIntervalSec * 1000);

    res.json({ status: 'started', config });
  });

  router.post('/api/strategy/stop', (_req: Request, res: Response) => {
    if (scanInterval) {
      clearInterval(scanInterval);
      scanInterval = null;
    }
    const state = store.getConfig();
    state.scanning = false;
    store.saveConfig(state);
    events.emit('status:update', { scanning: false });
    res.json({ status: 'stopped' });
  });

  // ─── Manual Sell ────────────────────────────────────────

  router.post('/api/sell/:id', async (req: Request, res: Response) => {
    const positions = positionManager.getActive();
    const pos = positions.find(p => p.positionId === req.params.id);
    if (!pos) { res.status(404).json({ error: 'Position not found' }); return; }
    const closed = await trader.sell(pos, 'MANUAL');
    if (closed) {
      events.emit('position:closed', closed);
      res.json(closed);
    } else {
      res.status(500).json({ error: 'Sell failed' });
    }
  });

  // ─── Aggregate Funds ─────────────────────────────────────

  router.post('/api/aggregate', async (_req: Request, res: Response) => {
    try {
      const slots = walletMatrix.getAll();
      if (slots.length === 0) {
        res.json({ message: 'No sub-wallets to aggregate', aggregated: 0, details: [] });
        return;
      }

      // Get main wallet address per chain for transfer targets
      let mainAddresses: Record<string, string> = {};
      try {
        const addrs = await cli.walletAddresses();
        for (const a of (Array.isArray(addrs) ? addrs : [addrs])) {
          if (a?.chain && a?.address) mainAddresses[a.chain] = a.address;
        }
      } catch { /* main wallet addresses unavailable */ }

      const details: { wallet: string; chain: string; tokens: number; transferred: number; errors: string[] }[] = [];
      let totalTransferred = 0;

      for (const slot of slots) {
        const entry = { wallet: slot.name, chain: slot.chain, tokens: 0, transferred: 0, errors: [] as string[] };
        try {
          await cli.walletSwitch(String(slot.index));
          const balances = await cli.walletBalance(slot.chain);
          const tokenAssets = balances?.[0]?.tokenAssets || balances || [];

          const mainAddr = mainAddresses[slot.chain] || mainAddresses['1'];
          if (!mainAddr) {
            entry.errors.push('No main wallet address for chain');
            details.push(entry);
            continue;
          }

          for (const token of tokenAssets) {
            const usdValue = parseFloat(token.usdValue || '0');
            if (usdValue < 0.01) continue; // skip dust
            entry.tokens++;

            try {
              await cli.walletSend({
                chain: slot.chain,
                recipient: mainAddr,
                amount: token.balance || '0',
                tokenAddress: token.tokenAddress || token.tokenContractAddress || undefined,
              });
              entry.transferred++;
              totalTransferred++;
            } catch (e: any) {
              entry.errors.push(`${token.symbol || 'UNKNOWN'}: ${e.message}`);
            }
          }
        } catch (e: any) {
          entry.errors.push(e.message);
        }
        details.push(entry);
      }

      // Switch back to main wallet
      try { await cli.walletSwitch('0'); } catch { /* best effort */ }

      res.json({
        message: `Aggregated ${totalTransferred} token transfers from ${slots.length} sub-wallets`,
        aggregated: totalTransferred,
        details,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ─── x402 ───────────────────────────────────────────────

  router.get('/api/x402/status', (_req: Request, res: Response) => {
    const state = store.getConfig();
    res.json({
      selling: isSignalServerRunning(),
      subscriptions: state.x402Subscriptions,
    });
  });

  router.post('/api/x402/sell/start', async (_req: Request, res: Response) => {
    try {
      let addr = '0x0000000000000000000000000000000000000000';
      try {
        const addrs = await cli.walletAddresses('196');
        addr = addrs?.[0]?.address || addr;
      } catch { /* use default */ }
      await startSignalServer(store, addr);
      res.json({ status: 'started', port: 8402, seller: addr });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/api/x402/sell/stop', (_req: Request, res: Response) => {
    stopSignalServer();
    res.json({ status: 'stopped' });
  });

  router.post('/api/x402/buy', async (req: Request, res: Response) => {
    const { url, maxPayPerSignal = 0.2, maxDailySpend = 2.0, positionSize = 3, chains = ['501', '8453'] } = req.body;
    if (!url) { res.status(400).json({ error: 'url required' }); return; }

    const state = store.getConfig();
    const result = await signalBuyer.buyAndExecute(url, { maxPayPerSignal, maxDailySpend, positionSize, chains }, state.config);

    if (result.traded) {
      x402Spend += maxPayPerSignal;
      events.emit('x402:payment', { direction: 'spend', amount: maxPayPerSignal, source: url });
    }
    res.json(result);
  });

  return router;
}
