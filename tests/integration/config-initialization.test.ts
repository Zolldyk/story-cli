/**
 * Integration tests for configuration workflow
 * Tests first-run initialization, validation, and environment variable overrides
 * Extended for Story 2.4, Task 3
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CLI_PATH = join(__dirname, '../../dist/index.js');

/**
 * Helper to run CLI commands
 */
async function runCLI(args: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  try {
    const { stdout, stderr } = await execAsync(`node ${CLI_PATH} ${args}`);
    return { stdout, stderr, exitCode: 0 };
  } catch (error: unknown) {
    const execError = error as { stdout?: string; stderr?: string; code?: number };
    return {
      stdout: execError.stdout || '',
      stderr: execError.stderr || '',
      exitCode: execError.code || 1,
    };
  }
}
import { ConfigManager } from '../../src/lib/config-manager.js';
import { ConfigError } from '../../src/types/errors.js';
import { validRegisterConfig } from '../mocks/fixtures.js';

// Mock fs modules
vi.mock('fs/promises');
vi.mock('fs');
vi.mock('inquirer');

describe('Config Initialization Workflow (Integration)', () => {
  let mockFs: typeof import('fs/promises');
  let mockFsSync: typeof import('fs');
  let mockInquirer: typeof import('inquirer');
  let configManager: ConfigManager;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Clear environment variables
    delete process.env.STORY_PRIVATE_KEY;
    delete process.env.PINATA_API_KEY;
    delete process.env.STORY_RPC_URL;

    // Get mocked modules
    mockFs = await import('fs/promises');
    mockFsSync = await import('fs');
    mockInquirer = await import('inquirer');

    // Reset singleton state
    ConfigManager.resetInstance();

    // Get ConfigManager instance
    configManager = ConfigManager.getInstance();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('First-run scenario', () => {
    it('should handle missing config file and trigger initialization', async () => {
      // Arrange
      vi.mocked(mockFsSync.existsSync).mockReturnValue(false);
      vi.mocked(mockFs.writeFile).mockResolvedValue(undefined);
      vi.mocked(mockFs.chmod).mockResolvedValue(undefined);
      vi.mocked(mockInquirer.default.prompt).mockResolvedValue({
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        network: 'testnet',
        pinataApiKey: 'test_api_key',
        pinataApiSecret: 'test_api_secret',
        rpcUrl: '',
      });

      // Act
      const config = await configManager.load();

      // Assert - Should return minimal config when file doesn't exist
      expect(config).toEqual({ network: 'testnet' });
      expect(mockFsSync.existsSync).toHaveBeenCalled();
    });

    it('should save config with proper structure after initialization', async () => {
      // Arrange
      const mockPromptAnswers = {
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        network: 'testnet',
        pinataApiKey: 'test_api_key_12345678',
        pinataApiSecret: 'test_api_secret_12345678',
        rpcUrl: '',
      };

      vi.mocked(mockInquirer.default.prompt).mockResolvedValue(
        mockPromptAnswers
      );
      vi.mocked(mockFs.writeFile).mockResolvedValue(undefined);
      vi.mocked(mockFs.chmod).mockResolvedValue(undefined);

      // Act
      const newConfig = await configManager.initializeConfig();

      // Assert
      expect(mockFs.writeFile).toHaveBeenCalled();
      expect(mockFs.chmod).toHaveBeenCalledWith(
        expect.stringContaining('.storyrc'),
        0o600
      );

      const savedConfig = JSON.parse(
        vi.mocked(mockFs.writeFile).mock.calls[0][1] as string
      );
      expect(savedConfig.walletAddress).toBe(mockPromptAnswers.walletAddress);
      expect(savedConfig.network).toBe('testnet');
      expect(savedConfig.pinataApiKey).toBe(mockPromptAnswers.pinataApiKey);
      expect(savedConfig.pinataApiSecret).toBe(
        mockPromptAnswers.pinataApiSecret
      );
      expect(savedConfig.rpcUrl).toBeUndefined(); // Empty string should not be saved
    });

    it('should include custom RPC URL if provided', async () => {
      // Arrange
      const mockPromptAnswers = {
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        network: 'mainnet',
        pinataApiKey: 'test_api_key',
        pinataApiSecret: 'test_api_secret',
        rpcUrl: 'https://custom-rpc.example.com',
      };

      vi.mocked(mockInquirer.default.prompt).mockResolvedValue(
        mockPromptAnswers
      );
      vi.mocked(mockFs.writeFile).mockResolvedValue(undefined);
      vi.mocked(mockFs.chmod).mockResolvedValue(undefined);

      // Act
      await configManager.initializeConfig();

      // Assert
      const savedConfig = JSON.parse(
        vi.mocked(mockFs.writeFile).mock.calls[0][1] as string
      );
      expect(savedConfig.rpcUrl).toBe('https://custom-rpc.example.com');
    });
  });

  describe('Config validation on command execution', () => {
    it('should throw ConfigError when required fields are missing', async () => {
      // Arrange - Load minimal config (only network)
      vi.mocked(mockFsSync.existsSync).mockReturnValue(true);
      vi.mocked(mockFs.readFile).mockResolvedValue(
        JSON.stringify({ network: 'testnet' })
      );
      await configManager.load();

      // Act & Assert
      expect(() => configManager.validateConfig('register')).toThrow(
        ConfigError
      );
    });

    it('should pass validation when all required fields present', async () => {
      // Arrange
      vi.mocked(mockFsSync.existsSync).mockReturnValue(true);
      vi.mocked(mockFs.readFile).mockResolvedValue(
        JSON.stringify(validRegisterConfig)
      );
      await configManager.load();

      // Act & Assert
      expect(() => configManager.validateConfig('register')).not.toThrow();
    });

    it('should provide helpful error message for missing Pinata key', async () => {
      // Arrange - Config missing pinataApiKey
      const incompleteConfig = {
        network: 'testnet',
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        pinataApiSecret: 'test_secret',
      };

      vi.mocked(mockFsSync.existsSync).mockReturnValue(true);
      vi.mocked(mockFs.readFile).mockResolvedValue(
        JSON.stringify(incompleteConfig)
      );
      await configManager.load();

      // Act & Assert
      expect(() => configManager.validateConfig('register')).toThrow(
        /Pinata API key not found/i
      );
      expect(() => configManager.validateConfig('register')).toThrow(
        /story config set pinataApiKey/i
      );
    });
  });

  describe('Environment variable override workflow', () => {
    beforeEach(async () => {
      // Load a complete config
      vi.mocked(mockFsSync.existsSync).mockReturnValue(true);
      vi.mocked(mockFs.readFile).mockResolvedValue(
        JSON.stringify(validRegisterConfig)
      );
      await configManager.load();
    });

    it('should use PINATA_API_KEY env var instead of config file', () => {
      // Arrange
      const envApiKey = 'env_override_api_key_12345678';
      process.env.PINATA_API_KEY = envApiKey;

      // Act
      const apiKey = configManager.get('pinataApiKey');

      // Assert
      expect(apiKey).toBe(envApiKey);
      expect(apiKey).not.toBe(validRegisterConfig.pinataApiKey);
    });

    it('should use STORY_PRIVATE_KEY env var instead of config file', () => {
      // Arrange
      const envPrivateKey = '0xENV_WALLET_ADDRESS_1234567890123456';
      process.env.STORY_PRIVATE_KEY = envPrivateKey;

      // Act
      const walletAddress = configManager.get('walletAddress');

      // Assert
      expect(walletAddress).toBe(envPrivateKey);
      expect(walletAddress).not.toBe(validRegisterConfig.walletAddress);
    });

    it('should use STORY_RPC_URL env var instead of config file', () => {
      // Arrange
      const envRpcUrl = 'https://env-override-rpc.example.com';
      process.env.STORY_RPC_URL = envRpcUrl;

      // Act
      const rpcUrl = configManager.get('rpcUrl');

      // Assert
      expect(rpcUrl).toBe(envRpcUrl);
    });

    it('should fall back to config file when env var not set', () => {
      // Arrange - No env vars set

      // Act
      const apiKey = configManager.get('pinataApiKey');

      // Assert
      expect(apiKey).toBe(validRegisterConfig.pinataApiKey);
    });

    it('should use default RPC URL when neither env var nor config value set', async () => {
      // Arrange - Load config without rpcUrl
      const configWithoutRpc = {
        ...validRegisterConfig,
        rpcUrl: undefined,
      };
      vi.mocked(mockFs.readFile).mockResolvedValue(
        JSON.stringify(configWithoutRpc)
      );
      await configManager.load();

      // Act
      const rpcUrl = configManager.get('rpcUrl');

      // Assert
      expect(rpcUrl).toBe('https://testnet.storyrpc.io');
    });
  });

  describe('Error handling in workflow', () => {
    it('should handle file read permission errors gracefully', async () => {
      // Arrange
      vi.mocked(mockFsSync.existsSync).mockReturnValue(true);
      vi.mocked(mockFs.readFile).mockRejectedValue(
        new Error('EACCES: permission denied')
      );

      // Act & Assert
      await expect(configManager.load()).rejects.toThrow(ConfigError);
      await expect(configManager.load()).rejects.toThrow(
        /Failed to read configuration file/i
      );
    });

    it('should handle file write permission errors during save', async () => {
      // Arrange
      vi.mocked(mockFs.writeFile).mockRejectedValue(
        new Error('EACCES: permission denied')
      );

      // Act & Assert
      await expect(configManager.save(validRegisterConfig)).rejects.toThrow(
        ConfigError
      );
      await expect(configManager.save(validRegisterConfig)).rejects.toThrow(
        /Failed to save configuration file/i
      );
    });
  });
});

describe('Config CLI Command Tests (Integration)', () => {
  describe('config get command', () => {
    it('should display current configuration with config get', async () => {
      // Act
      const result = await runCLI('config get');

      // Assert
      expect(result.exitCode).toBe(0);
      // Should display configuration info (or info about no config)
      expect(result.stdout.length).toBeGreaterThan(0);
    });

    it('should display help for config command', async () => {
      // Act
      const result = await runCLI('config --help');

      // Assert
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('config');
      expect(result.stdout).toContain('set');
      expect(result.stdout).toContain('get');
    });
  });

  describe('config set validation', () => {
    it('should display error for invalid configuration key', async () => {
      // Act
      const result = await runCLI('config set invalidKey someValue');

      // Assert
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Invalid configuration key');
    });

    it('should display error for invalid network value', async () => {
      // Act
      const result = await runCLI('config set network invalidnetwork');

      // Assert
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Invalid network value');
    });

    it('should accept valid network value testnet', async () => {
      // Act
      const result = await runCLI('config set network testnet');

      // Assert
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Updated network');
    });
  });

  describe('config path command', () => {
    it('should display path to configuration file', async () => {
      // Act
      const result = await runCLI('config path');

      // Assert
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('.storyrc');
    });
  });
});
