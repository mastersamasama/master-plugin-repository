// ─── Chain Configuration ───────────────────────────────────────

export interface ChainConfig {
  id: string;
  name: string;
  signals: ('smartMoney' | 'newToken' | 'priceAnomaly')[];
  stablecoin: { symbol: string; address: string };
}

export const CHAINS: Record<string, ChainConfig> = {
  '501': {
    id: '501',
    name: 'Solana',
    signals: ['smartMoney', 'newToken', 'priceAnomaly'],
    stablecoin: { symbol: 'USDC', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
  },
  '8453': {
    id: '8453',
    name: 'Base',
    signals: ['smartMoney', 'priceAnomaly'],
    stablecoin: { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
  },
  '1': {
    id: '1',
    name: 'Ethereum',
    signals: ['smartMoney', 'priceAnomaly'],
    stablecoin: { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
  },
};

// ─── MCP / API Configuration ──────────────────────────────────

export const MCP_URL = 'https://web3.okx.com/api/v1/onchainos-mcp';
export const MCP_API_KEY = process.env.OKX_API_KEY || '';

// ─── Hard Limits (non-overridable) ────────────────────────────

export const HARD_LIMITS = {
  maxPerTrade: 50,
  maxPerWallet: 200,
  maxTotalExposure: 1000,
  minScanInterval: 10,
  x402MaxPerSignal: 0.5,
  x402MaxDailySpend: 5.0,
};

// ─── Strategy Config ──────────────────────────────────────────

export interface StrategyConfig {
  chains: string[];
  positionSize: number;
  maxPerToken: number;
  maxPerWallet: number;
  tpTrigger: number;
  tpTrailing: number;
  slThreshold: number;
  timeoutHours: number;
  scanIntervalSec: number;
}

export const DEFAULT_STRATEGY: StrategyConfig = {
  chains: ['501', '8453'],
  positionSize: 5,
  maxPerToken: 20,
  maxPerWallet: 100,
  tpTrigger: 0.5,
  tpTrailing: 0.1,
  slThreshold: -0.2,
  timeoutHours: 24,
  scanIntervalSec: 30,
};

// ─── Signal Types ─────────────────────────────────────────────

export type SignalSource = 'smartMoney' | 'newToken' | 'priceAnomaly';

export interface RawSignal {
  source: SignalSource;
  token: TokenInfo;
  score: number;
  details: Record<string, any>;
  timestamp: string;
}

export interface ScoredSignal {
  token: TokenInfo;
  sources: Partial<Record<SignalSource, { score: number; details: Record<string, any> }>>;
  compositeScore: number;
  timestamp: string;
}

export interface Signal extends ScoredSignal {
  signalId: string;
  safetyScore: number;
  action: 'BUY' | 'SKIP' | 'BLACKLIST';
  suggestedEntry: number;
}

export interface TokenInfo {
  symbol: string;
  address: string;
  chain: string;
}

// ─── Safety Types ─────────────────────────────────────────────

export interface GateResult {
  gate: string;
  score: number;
  maxScore: number;
  status: 'PASS' | 'WARNING' | 'BLOCK' | 'UNABLE_TO_VERIFY';
  details: string;
}

export interface SafetyResult {
  score: number;
  gates: GateResult[];
  verdict: 'EXECUTE' | 'SKIP' | 'BLACKLIST';
}

// ─── Position Types ───────────────────────────────────────────

export interface Position {
  positionId: string;
  token: TokenInfo;
  wallet: string;
  walletIndex: number;
  entryPrice: number;
  entryAmount: number;
  entryTxHash: string;
  entryTime: string;
  status: 'MONITORING' | 'TRAILING';
  highestPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  takeProfit: { trigger: number; trailing: number; activated: boolean };
  stopLoss: number;
  timeoutHours: number;
  source: string;
  signalScore: number;
  safetyScore: number;
}

export interface ClosedPosition extends Position {
  exitPrice: number;
  exitTxHash: string;
  exitTime: string;
  exitReason: 'TRAILING_TP' | 'STOP_LOSS' | 'TIMEOUT' | 'MANUAL';
  realizedPnl: number;
}

// ─── Wallet Matrix Types ──────────────────────────────────────

export interface WalletSlot {
  name: string;
  index: number;
  address: string;
  chain: string;
  createdAt: string;
}

export interface WalletMatrixData {
  wallets: Record<string, WalletSlot>;
  createdAt: string;
}

// ─── x402 Types ───────────────────────────────────────────────

export interface PaymentRequirements {
  x402Version: number;
  resource: { url: string; description: string; mimeType: string };
  accepts: PaymentOption[];
}

export interface PaymentOption {
  scheme: string;
  network: string;
  amount: string;
  payTo: string;
  asset: string;
  maxTimeoutSeconds: number;
  extra?: Record<string, any>;
}

export interface PaymentProof {
  signature: string;
  authorization: Record<string, string>;
  sessionCert?: string;
}

export interface SubscriptionConfig {
  url: string;
  maxPayPerSignal: number;
  maxDailySpend: number;
  positionSize: number;
  chains: string[];
}

// ─── App State ────────────────────────────────────────────────

export interface AlphaReport {
  runtime: string;
  signalsScanned: number;
  passedSafety: number;
  tradesExecuted: number;
  realizedPnl: number;
  unrealizedPnl: number;
  x402Income: number;
  x402Spend: number;
}

export interface AppState {
  scanning: boolean;
  config: StrategyConfig;
  scanCount: number;
  lastScanTime: string | null;
  x402Selling: boolean;
  x402Subscriptions: SubscriptionConfig[];
}

// ─── Scoring Weights ──────────────────────────────────────────

export const SIGNAL_WEIGHTS: Record<SignalSource, number> = {
  smartMoney: 0.4,
  newToken: 0.35,
  priceAnomaly: 0.25,
};

export const SIGNAL_THRESHOLDS: Record<SignalSource, number> = {
  smartMoney: 70,
  newToken: 75,
  priceAnomaly: 80,
};

export const MULTI_SOURCE_THRESHOLD = 60;

// ─── x402 Signal Server Config ────────────────────────────────

export const X402_PORT = parseInt(process.env.SENTRYX_X402_PORT || '8402', 10);
export const X402_NETWORK = 'eip155:196';
export const X402_ASSET = '0x4ae46a509f6b1d9056937ba4500cb143933d2dc8'; // USDG on X Layer
export const X402_SINGLE_PRICE = '100000'; // 0.1 USDG
export const X402_BATCH_PRICE = '500000'; // 0.5 USDG

// ─── Server Config ────────────────────────────────────────────

export const APP_PORT = parseInt(process.env.SENTRYX_PORT || '3000', 10);
export const STORE_DIR = process.env.SENTRYX_STORE || `${process.env.HOME}/.sentryx`;
