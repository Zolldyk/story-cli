/**
 * Test fixtures for Story CLI tests
 */

import { CLIConfig } from '../../src/types/config.js';
import { IPAssetWithRelationships } from '../../src/types/portfolio.js';

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

/**
 * Sample IP asset with no relationships (root asset)
 */
export const sampleRootAsset: IPAssetWithRelationships = {
  ipId: '0x1234567890abcdef1234567890abcdef12345678',
  name: 'Root IP Asset',
  metadata: {
    name: 'Root IP Asset',
    creator: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  licenseType: 'commercial-remix',
  createdAt: '2024-01-01T00:00:00.000Z',
  childIpIds: [],
  derivativeCount: 0,
  royaltiesEarned: 100,
  licensesIssued: 5,
};

/**
 * Sample IP asset that is a derivative (has parent)
 */
export const sampleDerivativeAsset: IPAssetWithRelationships = {
  ipId: '0xabcdef1234567890abcdef1234567890abcdef12',
  name: 'Derivative IP Asset',
  metadata: {
    name: 'Derivative IP Asset',
    creator: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
    createdAt: '2024-01-02T00:00:00.000Z',
  },
  licenseType: 'commercial-use',
  createdAt: '2024-01-02T00:00:00.000Z',
  parentIpId: '0x1234567890abcdef1234567890abcdef12345678',
  childIpIds: [],
  derivativeCount: 0,
  royaltiesEarned: 50,
  licensesIssued: 2,
};

/**
 * Sample portfolio with multiple assets
 */
export const samplePortfolio: IPAssetWithRelationships[] = [
  sampleRootAsset,
  sampleDerivativeAsset,
];

// Edge Case Fixtures - Story 2.4 Task 9

/**
 * Asset with a very long name (500+ characters)
 */
export const assetWithLongName: IPAssetWithRelationships = {
  ipId: '0xlong0000000000000000000000000000000001',
  name: 'A'.repeat(500) + ' Long Asset Name',
  metadata: {
    name: 'A'.repeat(500) + ' Long Asset Name',
    creator: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  licenseType: 'commercial-remix',
  createdAt: '2024-01-01T00:00:00.000Z',
  childIpIds: [],
  derivativeCount: 0,
};

/**
 * Asset with XSS payload in name
 */
export const assetWithXSSName: IPAssetWithRelationships = {
  ipId: '0xxss00000000000000000000000000000000001',
  name: '<script>alert("xss")</script>',
  metadata: {
    name: '<script>alert("xss")</script>',
    creator: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
    createdAt: '2024-01-01T00:00:00.000Z',
    description: '<img src="x" onerror="alert(\'xss\')">',
  },
  licenseType: 'commercial-remix',
  createdAt: '2024-01-01T00:00:00.000Z',
  childIpIds: [],
  derivativeCount: 0,
};

/**
 * Asset with Unicode characters (emojis and special characters)
 */
export const assetWithUnicodeName: IPAssetWithRelationships = {
  ipId: '0xunicode00000000000000000000000000000001',
  name: '🎨 Art Collection 知的財産 © ™ ® §',
  metadata: {
    name: '🎨 Art Collection 知的財産 © ™ ® §',
    creator: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
    createdAt: '2024-01-01T00:00:00.000Z',
    description: '日本語 中文 한국어 العربية',
  },
  licenseType: 'commercial-remix',
  createdAt: '2024-01-01T00:00:00.000Z',
  childIpIds: [],
  derivativeCount: 0,
};

/**
 * Generate a large portfolio with 50+ assets
 */
export function generateLargePortfolio(count: number = 50): IPAssetWithRelationships[] {
  return Array(count).fill(null).map((_, i) => ({
    ipId: `0x${i.toString(16).padStart(40, '0')}`,
    name: `Asset ${i + 1}`,
    metadata: {
      name: `Asset ${i + 1}`,
      creator: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
      createdAt: new Date().toISOString(),
    },
    licenseType: i % 3 === 0 ? 'commercial-remix' : i % 3 === 1 ? 'commercial-use' : 'non-commercial',
    createdAt: new Date().toISOString(),
    childIpIds: [],
    derivativeCount: 0,
    royaltiesEarned: Math.floor(Math.random() * 100),
    licensesIssued: Math.floor(Math.random() * 10),
  }));
}

/**
 * Generate a deep derivative tree (5+ levels)
 */
export function generateDeepDerivativeTree(depth: number = 5): IPAssetWithRelationships[] {
  const assets: IPAssetWithRelationships[] = [];
  let parentId: string | undefined = undefined;

  for (let i = 0; i < depth; i++) {
    const ipId = `0xdeep${i.toString().padStart(36, '0')}`;
    assets.push({
      ipId,
      name: `Level ${i} Asset`,
      metadata: {
        name: `Level ${i} Asset`,
        creator: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        createdAt: new Date().toISOString(),
      },
      licenseType: 'commercial-remix',
      createdAt: new Date().toISOString(),
      parentIpId: parentId,
      childIpIds: [],
      derivativeCount: 0,
    });
    parentId = ipId;
  }

  return assets;
}
