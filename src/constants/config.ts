/**
 * Configuration constants for Story CLI
 */

import path from 'path';
import os from 'os';

/**
 * Default RPC URLs for Story Protocol networks
 */
export const DEFAULT_RPC_URLS = {
  testnet: 'https://testnet.storyrpc.io',
  mainnet: 'https://mainnet.storyrpc.io',
} as const;

/**
 * Environment variable names that override config file values
 */
export const ENV_VAR_NAMES = {
  walletAddress: 'STORY_PRIVATE_KEY',    // Note: private key env var, not address
  pinataApiKey: 'PINATA_API_KEY',
  pinataApiSecret: 'PINATA_API_SECRET',
  rpcUrl: 'STORY_RPC_URL',
} as const;

/**
 * Required config fields for validation
 * Note: Validation is context-dependent - different commands require different fields
 */
export const REQUIRED_CONFIG_FIELDS = {
  register: ['walletAddress', 'pinataApiKey', 'pinataApiSecret', 'network'],
  portfolio: ['network'],
  config: [], // Config command doesn't require any fields
} as const;

/**
 * Path to user's config file in home directory
 */
export const CONFIG_FILE_PATH = path.join(os.homedir(), '.storyrc');

/**
 * Config file permissions (owner read/write only)
 */
export const CONFIG_FILE_PERMISSIONS = 0o600;
