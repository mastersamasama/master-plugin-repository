import express from 'express';
import * as path from 'path';
import { APP_PORT } from './config';
import { McpClient } from './api/mcp-client';
import { OnchainCli } from './api/cli';
import { MockMcpClient, getPriceTracker } from './mock/mock-mcp';
import { MockOnchainCli } from './mock/mock-cli';
import { FileStore } from './store';
import { SignalScanner } from './core/scanner';
import { SafetyGate } from './core/safety';
import { TradeExecutor } from './core/trader';
import { PositionManager } from './core/position';
import { WalletMatrix } from './core/wallet-matrix';
import { SignalBuyer } from './x402/signal-buyer';
import { createRouter } from './api/routes';

const isDemo = process.env.DEMO === 'true';

async function main() {
  console.log('');
  console.log('  ╔═══════════════════════════════════════════════╗');
  console.log('  ║  SentryX — Alpha & Security Guardian          ║');
  console.log('  ║  v2.0.0                                       ║');
  console.log('  ╚═══════════════════════════════════════════════╝');
  if (isDemo) {
    console.log('  ⚡ DEMO MODE — all data is simulated');
  }
  console.log('');

  // Initialize services — mock or real
  let mcp: any;
  let cli: any;

  if (isDemo) {
    mcp = new MockMcpClient();
    cli = new MockOnchainCli(getPriceTracker());
  } else {
    mcp = new McpClient();
    cli = new OnchainCli();
  }

  const store = new FileStore();

  // Check wallet
  try {
    const status = await cli.walletStatus();
    if (status.loggedIn) {
      console.log(`  Wallet: ${status.email} (logged in)`);
    } else {
      console.log('  Wallet: Not logged in — login via dashboard or CLI');
    }
  } catch {
    console.log('  Wallet: onchainos CLI not available — some features will be limited');
  }

  // Build dependency graph
  const scanner = new SignalScanner(mcp);
  const walletMatrix = new WalletMatrix(cli, store);
  const trader = new TradeExecutor(cli, store, walletMatrix);
  const safety = new SafetyGate(mcp, cli);
  const positionManager = new PositionManager(mcp, trader, store);
  const signalBuyer = new SignalBuyer(cli, safety, trader);

  // Express app
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // API routes
  const router = createRouter({
    mcp, cli, store, scanner, safety, trader, positionManager, walletMatrix, signalBuyer, isDemo,
  });
  app.use(router);

  // Fallback to index.html for SPA
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  });

  // Start server
  app.listen(APP_PORT, () => {
    console.log(`  Dashboard: http://localhost:${APP_PORT}`);
    console.log('');
    console.log('  Ready. Open the dashboard to start hunting alpha.');
    console.log('');
  });
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
