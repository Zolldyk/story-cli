/**
 * Configuration types for Story CLI
 * Source: architecture/data-models.md#Model: CLIConfig
 */

export type Network = 'testnet' | 'mainnet';

export interface CLIConfig {
  walletAddress?: string;          // User's Ethereum wallet address
  network: Network;                 // Target Story Protocol network (required)
  rpcUrl?: string;                  // Custom RPC endpoint URL (optional)
  pinataApiKey?: string;            // Pinata API key for IPFS uploads
  pinataApiSecret?: string;         // Pinata API secret
  defaultLicense?: string;          // Default license type for quick workflows
}

/**
 * Type guard to validate network value
 */
export function isValidNetwork(value: unknown): value is Network {
  return value === 'testnet' || value === 'mainnet';
}

/**
 * Type guard to validate CLIConfig structure
 */
export function isCLIConfig(value: unknown): value is CLIConfig {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const config = value as Record<string, unknown>;

  // network is required
  if (!isValidNetwork(config.network)) {
    return false;
  }

  // Optional fields must have correct types if present
  if (config.walletAddress !== undefined && typeof config.walletAddress !== 'string') {
    return false;
  }

  if (config.rpcUrl !== undefined && typeof config.rpcUrl !== 'string') {
    return false;
  }

  if (config.pinataApiKey !== undefined && typeof config.pinataApiKey !== 'string') {
    return false;
  }

  if (config.pinataApiSecret !== undefined && typeof config.pinataApiSecret !== 'string') {
    return false;
  }

  if (config.defaultLicense !== undefined && typeof config.defaultLicense !== 'string') {
    return false;
  }

  return true;
}
