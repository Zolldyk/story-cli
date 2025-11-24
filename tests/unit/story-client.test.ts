/**
 * Unit tests for StoryClient
 * Source: architecture/test-strategy-and-standards.md#Test Types
 *
 * Tests StoryClient initialization, network detection, error translation
 * Pattern: AAA (Arrange-Act-Assert)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StoryClient } from '../../src/lib/story-client.js';
import { NetworkError, TransactionError, ValidationError } from '../../src/types/errors.js';

// Mock viem
vi.mock('viem/accounts', () => ({
  privateKeyToAccount: vi.fn((key: string) => ({
    address: '0x1234567890123456789012345678901234567890',
  })),
}));

// Mock Story Protocol SDK
vi.mock('@story-protocol/core-sdk', () => ({
  StoryClient: {
    newClient: vi.fn(() => ({
      client: {
        getBalance: vi.fn(async () => BigInt(1e18)), // 1 ETH
      },
    })),
  },
}));

// Mock viem http transport
vi.mock('viem', async (importOriginal) => {
  const actual = await importOriginal<typeof import('viem')>();
  return {
    ...actual,
    http: vi.fn((url: string) => ({ url })),
    createPublicClient: vi.fn(() => ({
      getBalance: vi.fn(async () => BigInt(1e18)),
    })),
  };
});

// Mock TerminalUI
vi.mock('../../src/lib/terminal-ui.js', () => ({
  TerminalUI: {
    error: vi.fn(),
    success: vi.fn(),
    box: vi.fn(),
  },
}));

describe('StoryClient', () => {
  const validPrivateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.STORY_CLI_MOCK;
  });

  describe('Initialization', () => {
    it('should initialize with testnet config', () => {
      // Arrange & Act
      const client = new StoryClient({
        privateKey: validPrivateKey,
        network: 'testnet',
      });

      // Assert
      expect(client.getNetworkName()).toBe('testnet');
      expect(client.getRpcUrl()).toBe('https://aeneid.storyrpc.io');
    });

    it('should initialize with mainnet config', () => {
      // Arrange & Act
      const client = new StoryClient({
        privateKey: validPrivateKey,
        network: 'mainnet',
      });

      // Assert
      expect(client.getNetworkName()).toBe('mainnet');
      expect(client.getRpcUrl()).toBe('https://rpc.story.foundation');
    });

    it('should use custom RPC URL when provided', () => {
      // Arrange
      const customRpc = 'https://custom-rpc.example.com';

      // Act
      const client = new StoryClient({
        privateKey: validPrivateKey,
        network: 'testnet',
        rpcUrl: customRpc,
      });

      // Assert
      expect(client.getRpcUrl()).toBe(customRpc);
    });

    it('should accept private key without 0x prefix', () => {
      // Arrange
      const keyWithoutPrefix = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      // Act & Assert
      expect(() => {
        new StoryClient({
          privateKey: keyWithoutPrefix,
          network: 'testnet',
        });
      }).not.toThrow();
    });

    it('should throw ValidationError for invalid private key', () => {
      // Arrange
      const invalidKey = 'invalid-key';

      // Act & Assert
      expect(() => {
        new StoryClient({
          privateKey: invalidKey,
          network: 'testnet',
        });
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid network', () => {
      // Arrange
      const invalidNetwork = 'invalid-network';

      // Act & Assert
      expect(() => {
        new StoryClient({
          privateKey: validPrivateKey,
          network: invalidNetwork,
        });
      }).toThrow(ValidationError);
    });

    it('should throw error when STORY_CLI_MOCK is true', () => {
      // Arrange
      process.env.STORY_CLI_MOCK = 'true';

      // Act & Assert
      expect(() => {
        new StoryClient({
          privateKey: validPrivateKey,
          network: 'testnet',
        });
      }).toThrow('Mock mode detected');
    });
  });

  describe('Network Information', () => {
    it('should return correct network name for testnet', () => {
      // Arrange
      const client = new StoryClient({
        privateKey: validPrivateKey,
        network: 'testnet',
      });

      // Act
      const networkName = client.getNetworkName();

      // Assert
      expect(networkName).toBe('testnet');
    });

    it('should return correct network name for mainnet', () => {
      // Arrange
      const client = new StoryClient({
        privateKey: validPrivateKey,
        network: 'mainnet',
      });

      // Act
      const networkName = client.getNetworkName();

      // Assert
      expect(networkName).toBe('mainnet');
    });

    it('should return wallet address', () => {
      // Arrange
      const client = new StoryClient({
        privateKey: validPrivateKey,
        network: 'testnet',
      });

      // Act
      const address = client.getWalletAddress();

      // Assert
      expect(address).toBe('0x1234567890123456789012345678901234567890');
    });
  });

  describe('Explorer URLs', () => {
    it('should generate correct testnet explorer URL', () => {
      // Arrange
      const client = new StoryClient({
        privateKey: validPrivateKey,
        network: 'testnet',
      });
      const txHash = '0xabcdef123456';

      // Act
      const url = client.getExplorerUrl(txHash);

      // Assert
      expect(url).toBe('https://aeneid.explorer.story.foundation/tx/0xabcdef123456');
    });

    it('should generate correct mainnet explorer URL', () => {
      // Arrange
      const client = new StoryClient({
        privateKey: validPrivateKey,
        network: 'mainnet',
      });
      const txHash = '0xabcdef123456';

      // Act
      const url = client.getExplorerUrl(txHash);

      // Assert
      expect(url).toBe('https://explorer.story.foundation/tx/0xabcdef123456');
    });
  });

  describe('SDK Error Translation', () => {
    let client: StoryClient;

    beforeEach(() => {
      client = new StoryClient({
        privateKey: validPrivateKey,
        network: 'testnet',
      });
    });

    it('should translate insufficient allowance error', () => {
      // Arrange
      const sdkError = new Error('revert: insufficient allowance');

      // Act
      const translated = client.translateSDKError(sdkError);

      // Assert
      expect(translated).toBeInstanceOf(TransactionError);
      expect(translated.message).toContain('Insufficient token allowance');
      expect(translated.message).toContain('approve the contract');
    });

    it('should translate nonce too low error', () => {
      // Arrange
      const sdkError = new Error('nonce too low');

      // Act
      const translated = client.translateSDKError(sdkError);

      // Assert
      expect(translated).toBeInstanceOf(TransactionError);
      expect(translated.message).toContain('Nonce conflict');
      expect(translated.message).toContain('pending transactions');
    });

    it('should translate timeout errors', () => {
      // Arrange
      const sdkError = new Error('timeout exceeded');

      // Act
      const translated = client.translateSDKError(sdkError);

      // Assert
      expect(translated).toBeInstanceOf(NetworkError);
      expect(translated.message).toContain('timed out');
    });

    it('should translate gas/insufficient funds errors', () => {
      // Arrange
      const sdkError = new Error('insufficient funds for gas');

      // Act
      const translated = client.translateSDKError(sdkError);

      // Assert
      expect(translated).toBeInstanceOf(TransactionError);
      expect(translated.message).toContain('Insufficient gas');
      expect(translated.message).toContain('faucet.story.foundation');
    });

    it('should wrap unknown errors in TransactionError', () => {
      // Arrange
      const sdkError = new Error('Unknown blockchain error');

      // Act
      const translated = client.translateSDKError(sdkError);

      // Assert
      expect(translated).toBeInstanceOf(TransactionError);
      expect(translated.message).toContain('Unknown blockchain error');
      expect(translated.message).toContain('--debug');
    });

    it('should handle case-insensitive error matching', () => {
      // Arrange
      const sdkError = new Error('NONCE TOO LOW');

      // Act
      const translated = client.translateSDKError(sdkError);

      // Assert
      expect(translated).toBeInstanceOf(TransactionError);
      expect(translated.message).toContain('Nonce conflict');
    });
  });

  describe('registerIP() and checkSufficientGas() - Story 1.7 Task 10', () => {
    const mockMetadataHash = 'QmTest1234567890';
    const mockLicense = {
      type: 'NON_COMMERCIAL_ONLY',
      commercialUse: false,
      derivativesAllowed: false,
    };

    it('should have registerIP method available', () => {
      // Arrange
      const client = new StoryClient({
        privateKey: validPrivateKey,
        network: 'testnet',
      });

      // Assert
      expect(typeof client.registerIP).toBe('function');
    });

    it('should have checkSufficientGas method available', () => {
      // Arrange
      const client = new StoryClient({
        privateKey: validPrivateKey,
        network: 'testnet',
      });

      // Assert
      expect(typeof client.checkSufficientGas).toBe('function');
    });

    // Note: Full integration tests for registerIP will be in integration tests
    // Unit tests here validate method existence and basic structure
  });
});
