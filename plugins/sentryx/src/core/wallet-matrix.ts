import { OnchainCli } from '../api/cli';
import { FileStore } from '../store';
import { WalletSlot } from '../config';

export class WalletMatrix {
  constructor(private cli: OnchainCli, private store: FileStore) {}

  async getOrCreate(source: string, chain: string): Promise<WalletSlot> {
    const name = `${source}-${chain}`;
    const matrix = this.store.getWalletMatrix();

    if (matrix.wallets[name]) {
      return matrix.wallets[name];
    }

    // Create new sub-wallet
    console.log(`[WalletMatrix] Creating sub-wallet: ${name}`);
    const result = await this.cli.walletCreate();

    const slot: WalletSlot = {
      name,
      index: result.accountIndex ?? result.index ?? Object.keys(matrix.wallets).length + 1,
      address: result.address || result.addressList?.[0]?.address || '',
      chain,
      createdAt: new Date().toISOString(),
    };

    matrix.wallets[name] = slot;
    this.store.saveWalletMatrix(matrix);
    console.log(`[WalletMatrix] Created: ${name} → index ${slot.index}`);

    return slot;
  }

  async fundWallet(slot: WalletSlot, amount: number, stablecoinAddress?: string): Promise<void> {
    console.log(`[WalletMatrix] Funding ${slot.name} with ${amount} USDT`);
    await this.cli.walletSend({
      chain: slot.chain,
      recipient: slot.address,
      amount: String(amount),
      tokenAddress: stablecoinAddress,
    });
  }

  getAll(): WalletSlot[] {
    const matrix = this.store.getWalletMatrix();
    return Object.values(matrix.wallets);
  }

  getSlot(source: string, chain: string): WalletSlot | null {
    const name = `${source}-${chain}`;
    const matrix = this.store.getWalletMatrix();
    return matrix.wallets[name] || null;
  }
}
