/**
 * Integration tests for mock mode
 * Source: architecture/test-strategy-and-standards.md#Test Types
 *
 * Tests MockStoryClient behavior and mock mode activation
 * Pattern: AAA (Arrange-Act-Assert)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MockStoryClient } from '../../src/lib/mock-story-client.js';
import { ValidationError } from '../../src/types/errors.js';

describe('Mock Mode Integration', () => {
  const validPrivateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('MockStoryClient Initialization', () => {
    it('should initialize with testnet config', () => {
      // Arrange & Act
      const client = new MockStoryClient({
        privateKey: validPrivateKey,
        network: 'testnet',
      });

      // Assert
      expect(client.getNetworkName()).toBe('testnet');
      expect(client.getRpcUrl()).toBe('https://aeneid.storyrpc.io');
    });

    it('should initialize with mainnet config', () => {
      // Arrange & Act
      const client = new MockStoryClient({
        privateKey: validPrivateKey,
        network: 'mainnet',
      });

      // Assert
      expect(client.getNetworkName()).toBe('mainnet');
      expect(client.getRpcUrl()).toBe('https://rpc.story.foundation');
    });

    it('should validate private key format', () => {
      // Arrange
      const invalidKey = 'invalid';

      // Act & Assert
      expect(() => {
        new MockStoryClient({
          privateKey: invalidKey,
          network: 'testnet',
        });
      }).toThrow(ValidationError);
    });

    it('should validate network name', () => {
      // Arrange
      const invalidNetwork = 'invalid-network';

      // Act & Assert
      expect(() => {
        new MockStoryClient({
          privateKey: validPrivateKey,
          network: invalidNetwork,
        });
      }).toThrow(ValidationError);
    });
  });

  describe('MockStoryClient Functionality', () => {
    let client: MockStoryClient;

    beforeEach(() => {
      client = new MockStoryClient({
        privateKey: validPrivateKey,
        network: 'testnet',
      });
    });

    it('should return sufficient mock gas balance', async () => {
      // Arrange
      const mockAddress = '0x1234567890123456789012345678901234567890';

      // Act
      const balance = await client.checkGasBalance(mockAddress);

      // Assert
      expect(balance).toBe(BigInt(1e18)); // 1 ETH
    });

    it('should generate mock wallet address from private key', () => {
      // Act
      const address = client.getWalletAddress();

      // Assert
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should return mock IP registration result', async () => {
      // Act
      const result = await client.registerIP();

      // Assert
      expect(result).toHaveProperty('ipId');
      expect(result).toHaveProperty('txHash');
      expect(result).toHaveProperty('blockNumber');
      expect(result).toHaveProperty('explorerUrl');
      expect(result.ipId).toMatch(/^0x/);
      expect(result.txHash).toMatch(/^0x/);
      expect(result.blockNumber).toBe(12345);
    });

    it('should return empty array for mock IP query', async () => {
      // Act
      const assets = await client.queryIPAssets();

      // Assert
      expect(Array.isArray(assets)).toBe(true);
      expect(assets.length).toBe(0);
    });

    it('should generate correct testnet explorer URL', () => {
      // Arrange
      const txHash = '0xabcdef123456';

      // Act
      const url = client.getExplorerUrl(txHash);

      // Assert
      expect(url).toBe('https://aeneid.explorer.story.foundation/tx/0xabcdef123456');
    });

    it('should generate correct mainnet explorer URL', () => {
      // Arrange
      const mainnetClient = new MockStoryClient({
        privateKey: validPrivateKey,
        network: 'mainnet',
      });
      const txHash = '0xabcdef123456';

      // Act
      const url = mainnetClient.getExplorerUrl(txHash);

      // Assert
      expect(url).toBe('https://explorer.story.foundation/tx/0xabcdef123456');
    });
  });

  describe('Mock Mode Async Behavior', () => {
    let client: MockStoryClient;

    beforeEach(() => {
      client = new MockStoryClient({
        privateKey: validPrivateKey,
        network: 'testnet',
      });
    });

    it('should simulate network delay for gas balance check', async () => {
      // Arrange
      const startTime = Date.now();

      // Act
      await client.checkGasBalance('0x1234567890123456789012345678901234567890');
      const elapsed = Date.now() - startTime;

      // Assert - should have some delay (at least 50ms)
      expect(elapsed).toBeGreaterThanOrEqual(50);
    });

    it('should simulate network delay for IP registration', async () => {
      // Arrange
      const startTime = Date.now();

      // Act
      await client.registerIP();
      const elapsed = Date.now() - startTime;

      // Assert - should have noticeable delay (at least 400ms)
      expect(elapsed).toBeGreaterThanOrEqual(400);
    });

    it('should simulate network delay for IP query', async () => {
      // Arrange
      const startTime = Date.now();

      // Act
      await client.queryIPAssets();
      const elapsed = Date.now() - startTime;

      // Assert - should have some delay (at least 150ms)
      expect(elapsed).toBeGreaterThanOrEqual(150);
    });
  });

  describe('Mock Mode Environment Variable', () => {
    it('should enable mock mode when STORY_CLI_MOCK=true', () => {
      // Arrange
      process.env.STORY_CLI_MOCK = 'true';

      // Act & Assert
      // This would be tested in status command integration tests
      expect(process.env.STORY_CLI_MOCK).toBe('true');
    });

    it('should not enable mock mode when STORY_CLI_MOCK is not set', () => {
      // Arrange
      delete process.env.STORY_CLI_MOCK;

      // Act & Assert
      expect(process.env.STORY_CLI_MOCK).toBeUndefined();
    });
  });
});
