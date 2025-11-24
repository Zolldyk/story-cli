/**
 * Status command - Check wallet connection and display account information
 * Source: architecture/source-tree.md - src/commands/status.ts
 */

import { Command } from 'commander';
import { ConfigManager } from '../lib/config-manager.js';
import { StoryClient } from '../lib/story-client.js';
import { MockStoryClient } from '../lib/mock-story-client.js';
import { TerminalUI } from '../lib/terminal-ui.js';
import { ConfigError } from '../types/errors.js';
import { MIN_GAS_BALANCE } from '../constants/networks.js';

/**
 * Truncate wallet address for security display
 * Shows first 6 characters + "..." + last 4 characters
 * @param address - Full wallet address
 * @returns Truncated address (e.g., "0x1234...5678")
 */
function truncateAddress(address: string): string {
  if (address.length < 12) {
    return address;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Execute status command
 * Displays wallet connection status, network info, and gas balance
 */
export async function executeStatusCommand(): Promise<void> {
  const spinner = TerminalUI.spinner('Checking wallet connection...');

  try {
    spinner.start();

    // Load config
    const configManager = ConfigManager.getInstance();
    await configManager.load();

    // Get private key from environment variable
    const privateKey = process.env.STORY_PRIVATE_KEY;
    if (!privateKey) {
      spinner.stop();
      throw new ConfigError(
        'Private key not found.\nSet STORY_PRIVATE_KEY environment variable to your wallet private key.\nExample: export STORY_PRIVATE_KEY=0xYOUR_PRIVATE_KEY'
      );
    }

    // Get network from config (default to testnet)
    const config = configManager.getConfig();
    const network = config?.network || 'testnet';
    const customRpcUrl = configManager.get('rpcUrl');

    // Check if running in mock mode
    const isMockMode = process.env.STORY_CLI_MOCK === 'true';

    // Initialize appropriate client
    let client: StoryClient | MockStoryClient;
    if (isMockMode) {
      client = new MockStoryClient({
        privateKey,
        network,
        rpcUrl: customRpcUrl,
      });
    } else {
      client = new StoryClient({
        privateKey,
        network,
        rpcUrl: customRpcUrl,
      });
    }

    // Get wallet address
    const walletAddress = client.getWalletAddress();
    const truncatedAddress = truncateAddress(walletAddress);

    // Get network info
    const networkName = client.getNetworkName();
    const rpcUrl = client.getRpcUrl();

    // Test wallet connection by fetching balance
    const balance = await client.checkGasBalance(walletAddress);
    const balanceInEth = Number(balance) / 1e18;

    spinner.stop();

    // Display status information
    const statusLines = [
      isMockMode ? '⚠️  Running in MOCK mode (no real transactions)' : '',
      '',
      `✓ Wallet Connected`,
      '',
      `Address: ${truncatedAddress}`,
      `Network: ${networkName}`,
      `RPC Endpoint: ${rpcUrl}`,
      `Gas Balance: ${balanceInEth.toFixed(6)} ETH`,
    ].filter(Boolean);

    TerminalUI.success(statusLines.join('\n'));

    // Warn if gas balance is low
    if (balanceInEth < MIN_GAS_BALANCE) {
      TerminalUI.info(''); // Add spacing
      client.warnInsufficientGas(balance, networkName);
    }
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

/**
 * Register status command with Commander
 * @param program - Commander program instance
 */
export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('Check wallet connection and display account information')
    .action(async () => {
      await executeStatusCommand();
    });
}
