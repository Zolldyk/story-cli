/**
 * Unit tests for ConfigManager
 * Tests config file operations, validation, and environment variable overrides
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigManager } from '../../src/lib/config-manager.js';
import { ConfigError } from '../../src/types/errors.js';
import {
  validCompleteConfig,
  validMinimalConfig,
  validRegisterConfig,
  malformedJsonString,
  invalidConfigWrongNetwork,
} from '../mocks/fixtures.js';

// Mock fs/promises and fs modules
vi.mock('fs/promises');
vi.mock('fs');

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  let mockFs: typeof import('fs/promises');
  let mockFsSync: typeof import('fs');

  beforeEach(async () => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Reset environment variables
    delete process.env.STORY_PRIVATE_KEY;
    delete process.env.PINATA_API_KEY;
    delete process.env.STORY_RPC_URL;

    // Get mocked fs modules
    mockFs = await import('fs/promises');
    mockFsSync = await import('fs');

    // Reset singleton state
    ConfigManager.resetInstance();

    // Get fresh instance of ConfigManager
    configManager = ConfigManager.getInstance();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls to getInstance()', () => {
      // Arrange & Act
      const instance1 = ConfigManager.getInstance();
      const instance2 = ConfigManager.getInstance();

      // Assert
      expect(instance1).toBe(instance2);
    });
  });

  describe('load()', () => {
    it('should return minimal config when file does not exist', async () => {
      // Arrange
      vi.mocked(mockFsSync.existsSync).mockReturnValue(false);

      // Act
      const config = await configManager.load();

      // Assert
      expect(config).toEqual({ network: 'testnet' });
    });

    it('should load and parse valid config file', async () => {
      // Arrange
      vi.mocked(mockFsSync.existsSync).mockReturnValue(true);
      vi.mocked(mockFs.readFile).mockResolvedValue(
        JSON.stringify(validCompleteConfig)
      );

      // Act
      const config = await configManager.load();

      // Assert
      expect(config).toEqual(validCompleteConfig);
    });

    it('should throw ConfigError for malformed JSON', async () => {
      // Arrange
      vi.mocked(mockFsSync.existsSync).mockReturnValue(true);
      vi.mocked(mockFs.readFile).mockResolvedValue(malformedJsonString);

      // Act & Assert
      await expect(configManager.load()).rejects.toThrow(ConfigError);
      await expect(configManager.load()).rejects.toThrow(/malformed/i);
    });

    it('should throw ConfigError for invalid config structure', async () => {
      // Arrange
      vi.mocked(mockFsSync.existsSync).mockReturnValue(true);
      vi.mocked(mockFs.readFile).mockResolvedValue(
        JSON.stringify(invalidConfigWrongNetwork)
      );

      // Act & Assert
      await expect(configManager.load()).rejects.toThrow(ConfigError);
      await expect(configManager.load()).rejects.toThrow(/invalid structure/i);
    });

    it('should throw ConfigError on file system errors', async () => {
      // Arrange
      vi.mocked(mockFsSync.existsSync).mockReturnValue(true);
      vi.mocked(mockFs.readFile).mockRejectedValue(
        new Error('Permission denied')
      );

      // Act & Assert
      await expect(configManager.load()).rejects.toThrow(ConfigError);
      await expect(configManager.load()).rejects.toThrow(/Failed to read/i);
    });
  });

  describe('save()', () => {
    it('should write config file with correct permissions', async () => {
      // Arrange
      vi.mocked(mockFs.writeFile).mockResolvedValue(undefined);
      vi.mocked(mockFs.chmod).mockResolvedValue(undefined);

      // Act
      await configManager.save(validCompleteConfig);

      // Assert
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.storyrc'),
        JSON.stringify(validCompleteConfig, null, 2),
        { mode: 0o600 }
      );
      expect(mockFs.chmod).toHaveBeenCalledWith(
        expect.stringContaining('.storyrc'),
        0o600
      );
    });

    it('should throw ConfigError for invalid config structure', async () => {
      // Arrange
      const invalidConfig = { invalid: 'config' } as any;

      // Act & Assert
      await expect(configManager.save(invalidConfig)).rejects.toThrow(
        ConfigError
      );
      await expect(configManager.save(invalidConfig)).rejects.toThrow(
        /Invalid configuration structure/i
      );
    });

    it('should throw ConfigError on file system errors', async () => {
      // Arrange
      vi.mocked(mockFs.writeFile).mockRejectedValue(
        new Error('Disk full')
      );

      // Act & Assert
      await expect(configManager.save(validCompleteConfig)).rejects.toThrow(
        ConfigError
      );
      await expect(configManager.save(validCompleteConfig)).rejects.toThrow(
        /Failed to save/i
      );
    });
  });

  describe('get()', () => {
    beforeEach(async () => {
      // Load a complete config for testing get operations
      vi.mocked(mockFsSync.existsSync).mockReturnValue(true);
      vi.mocked(mockFs.readFile).mockResolvedValue(
        JSON.stringify(validCompleteConfig)
      );
      await configManager.load();
    });

    it('should return config value from file', () => {
      // Act
      const walletAddress = configManager.get('walletAddress');

      // Assert
      expect(walletAddress).toBe(validCompleteConfig.walletAddress);
    });

    it('should return environment variable over config file for walletAddress', async () => {
      // Arrange
      const envValue = '0xENVIRONMENT_WALLET_ADDRESS_12345678901234';
      process.env.STORY_PRIVATE_KEY = envValue;

      // Act
      const walletAddress = configManager.get('walletAddress');

      // Assert
      expect(walletAddress).toBe(envValue);
    });

    it('should return environment variable over config file for pinataApiKey', async () => {
      // Arrange
      const envValue = 'env_pinata_key_12345678';
      process.env.PINATA_API_KEY = envValue;

      // Act
      const apiKey = configManager.get('pinataApiKey');

      // Assert
      expect(apiKey).toBe(envValue);
    });

    it('should return environment variable over config file for rpcUrl', async () => {
      // Arrange
      const envValue = 'https://custom-rpc.example.com';
      process.env.STORY_RPC_URL = envValue;

      // Act
      const rpcUrl = configManager.get('rpcUrl');

      // Assert
      expect(rpcUrl).toBe(envValue);
    });

    it('should return default RPC URL when rpcUrl not set', async () => {
      // Arrange - Load config without rpcUrl
      vi.mocked(mockFs.readFile).mockResolvedValue(
        JSON.stringify(validMinimalConfig)
      );
      await configManager.load();

      // Act
      const rpcUrl = configManager.get('rpcUrl');

      // Assert
      expect(rpcUrl).toBe('https://testnet.storyrpc.io');
    });

    it('should return undefined for non-existent key', async () => {
      // Arrange - Load minimal config
      vi.mocked(mockFs.readFile).mockResolvedValue(
        JSON.stringify(validMinimalConfig)
      );
      await configManager.load();

      // Act
      const value = configManager.get('walletAddress');

      // Assert
      expect(value).toBeUndefined();
    });
  });

  describe('set()', () => {
    beforeEach(() => {
      vi.mocked(mockFsSync.existsSync).mockReturnValue(true);
      vi.mocked(mockFs.readFile).mockResolvedValue(
        JSON.stringify(validMinimalConfig)
      );
      vi.mocked(mockFs.writeFile).mockResolvedValue(undefined);
      vi.mocked(mockFs.chmod).mockResolvedValue(undefined);
    });

    it('should update config value and save', async () => {
      // Arrange
      const newWalletAddress = '0x1234567890123456789012345678901234567890';

      // Act
      await configManager.set('walletAddress', newWalletAddress);

      // Assert
      expect(mockFs.writeFile).toHaveBeenCalled();
      const writtenConfig = JSON.parse(
        vi.mocked(mockFs.writeFile).mock.calls[0][1] as string
      );
      expect(writtenConfig.walletAddress).toBe(newWalletAddress);
    });

    it('should load config if not already loaded', async () => {
      // Arrange - Create new instance without loading
      const freshManager = ConfigManager.getInstance();

      // Act
      await freshManager.set('network', 'mainnet');

      // Assert
      expect(mockFs.readFile).toHaveBeenCalled();
      expect(mockFs.writeFile).toHaveBeenCalled();
    });
  });

  describe('validateConfig()', () => {
    it('should throw ConfigError if config not loaded', () => {
      // Arrange - Don't load config
      const freshManager = ConfigManager.getInstance();

      // Act & Assert
      expect(() => freshManager.validateConfig('register')).toThrow(
        ConfigError
      );
      expect(() => freshManager.validateConfig('register')).toThrow(
        /not loaded/i
      );
    });

    it('should throw ConfigError for missing required fields', async () => {
      // Arrange - Load minimal config (missing required fields for register)
      vi.mocked(mockFsSync.existsSync).mockReturnValue(true);
      vi.mocked(mockFs.readFile).mockResolvedValue(
        JSON.stringify(validMinimalConfig)
      );
      await configManager.load();

      // Act & Assert
      expect(() => configManager.validateConfig('register')).toThrow(
        ConfigError
      );
    });

    it('should pass validation with all required fields', async () => {
      // Arrange - Load complete register config
      vi.mocked(mockFsSync.existsSync).mockReturnValue(true);
      vi.mocked(mockFs.readFile).mockResolvedValue(
        JSON.stringify(validRegisterConfig)
      );
      await configManager.load();

      // Act & Assert
      expect(() => configManager.validateConfig('register')).not.toThrow();
    });

    it('should throw ConfigError for invalid wallet address format', async () => {
      // Arrange
      const invalidWalletConfig = {
        ...validRegisterConfig,
        walletAddress: 'invalid-address',
      };
      vi.mocked(mockFsSync.existsSync).mockReturnValue(true);
      vi.mocked(mockFs.readFile).mockResolvedValue(
        JSON.stringify(invalidWalletConfig)
      );
      await configManager.load();

      // Act & Assert
      expect(() => configManager.validateConfig('register')).toThrow(
        ConfigError
      );
      expect(() => configManager.validateConfig('register')).toThrow(
        /Invalid wallet address format/i
      );
    });

    it('should throw ConfigError for invalid RPC URL format', async () => {
      // Arrange
      const invalidRpcConfig = {
        ...validRegisterConfig,
        rpcUrl: 'not-a-valid-url',
      };
      vi.mocked(mockFsSync.existsSync).mockReturnValue(true);
      vi.mocked(mockFs.readFile).mockResolvedValue(
        JSON.stringify(invalidRpcConfig)
      );
      await configManager.load();

      // Act & Assert
      expect(() => configManager.validateConfig('register')).toThrow(
        ConfigError
      );
      expect(() => configManager.validateConfig('register')).toThrow(
        /Invalid RPC URL format/i
      );
    });
  });
});
