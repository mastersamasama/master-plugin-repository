import * as fs from 'fs';
import * as path from 'path';
import { STORE_DIR, Position, ClosedPosition, Signal, WalletMatrixData, StrategyConfig, AppState, DEFAULT_STRATEGY } from './config';

export class FileStore {
  private baseDir: string;

  constructor(baseDir: string = STORE_DIR) {
    this.baseDir = baseDir;
    this.ensureDirs();
  }

  private ensureDirs(): void {
    const dirs = [
      '',
      'signals',
      'signals/history',
      'positions',
      'positions/active',
      'positions/closed',
      'wallets',
      'reports/daily',
    ];
    for (const dir of dirs) {
      const full = path.join(this.baseDir, dir);
      if (!fs.existsSync(full)) {
        fs.mkdirSync(full, { recursive: true });
      }
    }
  }

  readJson<T>(relativePath: string): T | null {
    const full = path.join(this.baseDir, relativePath);
    try {
      return JSON.parse(fs.readFileSync(full, 'utf-8'));
    } catch {
      return null;
    }
  }

  writeJson<T>(relativePath: string, data: T): void {
    const full = path.join(this.baseDir, relativePath);
    const dir = path.dirname(full);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(full, JSON.stringify(data, null, 2));
  }

  appendToArray<T>(relativePath: string, item: T): void {
    const existing = this.readJson<T[]>(relativePath) || [];
    existing.push(item);
    this.writeJson(relativePath, existing);
  }

  // ─── Shortcuts ────────────────────────────────────────────

  getConfig(): AppState {
    return this.readJson<AppState>('state.json') || {
      scanning: false,
      config: DEFAULT_STRATEGY,
      scanCount: 0,
      lastScanTime: null,
      x402Selling: false,
      x402Subscriptions: [],
    };
  }

  saveConfig(state: AppState): void {
    this.writeJson('state.json', state);
  }

  getActivePositions(): Position[] {
    const dir = path.join(this.baseDir, 'positions/active');
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')); }
        catch { return null; }
      })
      .filter((p): p is Position => p !== null);
  }

  getClosedPositions(): ClosedPosition[] {
    const dir = path.join(this.baseDir, 'positions/closed');
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')); }
        catch { return null; }
      })
      .filter((p): p is ClosedPosition => p !== null);
  }

  savePosition(position: Position): void {
    this.writeJson(`positions/active/${position.positionId}.json`, position);
  }

  closePosition(position: ClosedPosition): void {
    const activePath = path.join(this.baseDir, `positions/active/${position.positionId}.json`);
    if (fs.existsSync(activePath)) fs.unlinkSync(activePath);
    this.writeJson(`positions/closed/${position.positionId}.json`, position);
  }

  getLatestSignal(): Signal | null {
    return this.readJson<Signal>('signals/latest.json');
  }

  saveSignal(signal: Signal): void {
    this.writeJson('signals/latest.json', signal);
    const dateKey = new Date().toISOString().slice(0, 10);
    this.appendToArray(`signals/history/${dateKey}.json`, signal);
  }

  getWalletMatrix(): WalletMatrixData {
    return this.readJson<WalletMatrixData>('wallets/matrix.json') || {
      wallets: {},
      createdAt: new Date().toISOString(),
    };
  }

  saveWalletMatrix(data: WalletMatrixData): void {
    this.writeJson('wallets/matrix.json', data);
  }

  getBlacklist(): string[] {
    return this.readJson<string[]>('blacklist.json') || [];
  }

  addToBlacklist(tokenAddress: string): void {
    const list = this.getBlacklist();
    if (!list.includes(tokenAddress)) {
      list.push(tokenAddress);
      this.writeJson('blacklist.json', list);
    }
  }

  getSignalHistory(limit: number = 20): Signal[] {
    const historyDir = path.join(this.baseDir, 'signals/history');
    if (!fs.existsSync(historyDir)) return [];
    const files = fs.readdirSync(historyDir).filter(f => f.endsWith('.json')).sort().reverse();
    const signals: Signal[] = [];
    for (const file of files) {
      if (signals.length >= limit) break;
      try {
        const data = JSON.parse(fs.readFileSync(path.join(historyDir, file), 'utf-8'));
        if (Array.isArray(data)) signals.push(...data);
        else signals.push(data);
      } catch { /* skip */ }
    }
    return signals.slice(0, limit);
  }
}
