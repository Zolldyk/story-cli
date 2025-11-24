/**
 * Test fixtures for Story CLI tests
 */

import { CLIConfig } from '../../src/types/config.js';

/**
 * Valid complete configuration with all fields
 */
export const validCompleteConfig: CLIConfig = {
  walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
  network: 'testnet',
  rpcUrl: 'https://testnet.storyrpc.io',
  pinataApiKey: 'test_api_key_12345678',
  pinataApiSecret: 'test_api_secret_12345678',
  defaultLicense: 'MIT',
};

/**
 * Valid minimal configuration with only required fields
 */
export const validMinimalConfig: CLIConfig = {
  network: 'testnet',
};

/**
 * Valid configuration for register command
 */
export const validRegisterConfig: CLIConfig = {
  walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
  network: 'testnet',
  pinataApiKey: 'test_api_key_12345678',
  pinataApiSecret: 'test_api_secret_12345678',
};

/**
 * Malformed JSON string (missing closing brace)
 */
export const malformedJsonString = '{"network": "testnet", "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"';

/**
 * Invalid config with wrong network type
 */
export const invalidConfigWrongNetwork = {
  network: 'invalid-network',
  walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
};

/**
 * Invalid config missing required network field
 */
export const invalidConfigMissingNetwork = {
  walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
};
