/**
 * Mock Story Protocol SDK Client for offline testing
 * Source: architecture/external-apis.md#Story Protocol TypeScript SDK
 */

import { NETWORKS, NetworkName } from '../constants/networks.js';
import { validatePrivateKey, validateNetwork } from './validation.js';
import { TerminalUI } from './terminal-ui.js';
import type { StoryClientConfig } from './story-client.js';

/**
 * Mock implementation of StoryClient for offline development and testing
 * Returns realistic fake data without making actual blockchain calls
 */
export class MockStoryClient {
  private networkName: NetworkName;
  private rpcUrl: string;
  private walletAddress: string;

  /**
   * Initialize mock client
   * @param config - Client configuration
   */
  constructor(config: StoryClientConfig) {
    // Validate inputs (same as real client)
    validatePrivateKey(config.privateKey);
    validateNetwork(config.network);

    this.networkName = config.network as NetworkName;
    this.rpcUrl = config.rpcUrl || NETWORKS[this.networkName].rpcUrl;

    // Generate mock wallet address from private key
    this.walletAddress = '0x' + config.privateKey.slice(2, 42).padEnd(40, '0');
  }

  /**
   * Get current network name
   * @returns Network name
   */
  getNetworkName(): string {
    return this.networkName;
  }

  /**
   * Get current RPC endpoint URL
   * @returns RPC URL
   */
  getRpcUrl(): string {
    return this.rpcUrl;
  }

  /**
   * Get wallet address
   * @returns Mock Ethereum address
   */
  getWalletAddress(): string {
    return this.walletAddress;
  }

  /**
   * Generate block explorer URL for transaction
   * @param transactionHash - Transaction hash
   * @returns Block explorer URL
   */
  getExplorerUrl(transactionHash: string): string {
    const baseUrl = NETWORKS[this.networkName].explorerUrl;
    return `${baseUrl}/tx/${transactionHash}`;
  }

  /**
   * Mock gas balance check - always returns sufficient balance
   * @param walletAddress - Wallet address (unused in mock)
   * @returns Mock balance (1.0 ETH in wei)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async checkGasBalance(walletAddress: string): Promise<bigint> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Return 1.0 ETH (sufficient balance)
    return BigInt(1e18);
  }

  /**
   * Display warning if gas balance is insufficient
   * @param balance - Current balance in wei
   * @param network - Network name
   */
  warnInsufficientGas(balance: bigint, network: string): void {
    const balanceInEth = Number(balance) / 1e18;
    const faucetUrl = NETWORKS[network as NetworkName].faucetUrl;

    let message = `⚠️  Insufficient gas balance: ${balanceInEth.toFixed(6)} ETH\n`;
    message += 'Transactions require gas fees.';

    if (faucetUrl) {
      message += `\n\nGet free testnet tokens at: ${faucetUrl}`;
    } else {
      message += '\n\nPurchase tokens from an exchange to continue.';
    }

    TerminalUI.error(message);
  }

  /**
   * Mock transaction success display
   * @param txHash - Transaction hash
   * @param ipId - IP asset ID
   */
  displayTransactionSuccess(txHash: string, ipId: string): void {
    const explorerUrl = this.getExplorerUrl(txHash);

    const content = [
      `Transaction Hash: ${txHash}`,
      `IP Asset ID: ${ipId}`,
      `View on Explorer: ${explorerUrl}`,
      ``,
      `⚠️  MOCK MODE - No real blockchain interaction occurred`,
    ].join('\n');

    TerminalUI.box('Transaction Successful (MOCK)', content);
  }

  /**
   * Mock IP registration (for future use in Story 1.7)
   * @returns Mock registration result
   */
  async registerIP(): Promise<{
    ipId: string;
    txHash: string;
    blockNumber: number;
    explorerUrl: string;
  }> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const txHash = '0xABCDEF' + Math.random().toString(16).slice(2, 64).padEnd(58, '0');
    const ipId = '0xMOCK123' + Math.random().toString(16).slice(2, 40).padEnd(33, '0');

    return {
      ipId,
      txHash,
      blockNumber: 12345,
      explorerUrl: this.getExplorerUrl(txHash),
    };
  }

  /**
   * Mock IP asset query (for future use in Story 2.x)
   * @returns Empty array (no mock assets)
   */
  async queryIPAssets(): Promise<unknown[]> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    return [];
  }
}
