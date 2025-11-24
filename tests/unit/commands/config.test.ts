/**
 * Unit tests for config command
 * Tests config set, get, and path subcommands
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createConfigCommand } from '../../../src/commands/config.js';
import { ConfigManager } from '../../../src/lib/config-manager.js';
import { CONFIG_FILE_PATH } from '../../../src/constants/config.js';
import { validCompleteConfig } from '../../mocks/fixtures.js';

// Mock ConfigManager
vi.mock('../../../src/lib/config-manager.js');

describe('Config Command', () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };
  let processExitSpy: ReturnType<typeof vi.spyOn>;
  let mockConfigManager: {
    getInstance: ReturnType<typeof vi.fn>;
    load: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    getConfig: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Mock console methods
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };

    // Mock process.exit
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);

    // Create mock ConfigManager instance methods
    mockConfigManager = {
      getInstance: vi.fn(),
      load: vi.fn().mockResolvedValue(validCompleteConfig),
      save: vi.fn().mockResolvedValue(undefined),
      get: vi.fn(),
      set: vi.fn().mockResolvedValue(undefined),
      getConfig: vi.fn().mockReturnValue(validCompleteConfig),
    };

    // Mock ConfigManager.getInstance to return mock instance
    vi.mocked(ConfigManager.getInstance).mockReturnValue(
      mockConfigManager as any
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('config set', () => {
    it('should update config value and display confirmation', async () => {
      // Arrange
      const command = createConfigCommand();

      // Act
      await command.parseAsync(['node', 'test', 'set', 'network', 'mainnet']);

      // Assert
      expect(mockConfigManager.set).toHaveBeenCalledWith('network', 'mainnet');
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('✓ Updated network')
      );
    });

    it('should validate network value', async () => {
      // Arrange
      const command = createConfigCommand();

      // Act
      await command.parseAsync(['node', 'test', 'set', 'network', 'invalid']);

      // Assert
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Error:')
      );
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid network value')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should reject invalid config keys', async () => {
      // Arrange
      const command = createConfigCommand();

      // Act
      await command.parseAsync(['node', 'test', 'set', 'invalidKey', 'value']);

      // Assert
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid configuration key')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('config get', () => {
    it('should display all config values when no key specified', async () => {
      // Arrange
      const command = createConfigCommand();

      // Act
      await command.parseAsync(['node', 'test', 'get']);

      // Assert
      expect(mockConfigManager.load).toHaveBeenCalled();
      expect(mockConfigManager.getConfig).toHaveBeenCalled();
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Current configuration')
      );
    });

    it('should display specific config value when key specified', async () => {
      // Arrange
      const command = createConfigCommand();
      mockConfigManager.getConfig.mockReturnValue({
        ...validCompleteConfig,
      });

      // Act
      await command.parseAsync(['node', 'test', 'get', 'network']);

      // Assert
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('network:')
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('testnet')
      );
    });

    it('should mask sensitive values (pinataApiKey)', async () => {
      // Arrange
      const command = createConfigCommand();
      const configWithSensitiveData = {
        ...validCompleteConfig,
        pinataApiKey: 'very_long_secret_api_key_12345678',
      };
      mockConfigManager.getConfig.mockReturnValue(configWithSensitiveData);

      // Act
      await command.parseAsync(['node', 'test', 'get']);

      // Assert
      const logCalls = consoleSpy.log.mock.calls.map((call) => call[0]);
      const pinataKeyLog = logCalls.find((call) =>
        call.includes('pinataApiKey')
      );

      expect(pinataKeyLog).toBeDefined();
      expect(pinataKeyLog).toContain('very_lon...');
      expect(pinataKeyLog).not.toContain('very_long_secret_api_key_12345678');
    });

    it('should mask sensitive values (pinataApiSecret)', async () => {
      // Arrange
      const command = createConfigCommand();
      const configWithSensitiveData = {
        ...validCompleteConfig,
        pinataApiSecret: 'super_secret_value_12345678',
      };
      mockConfigManager.getConfig.mockReturnValue(configWithSensitiveData);

      // Act
      await command.parseAsync(['node', 'test', 'get']);

      // Assert
      const logCalls = consoleSpy.log.mock.calls.map((call) => call[0]);
      const secretLog = logCalls.find((call) =>
        call.includes('pinataApiSecret')
      );

      expect(secretLog).toBeDefined();
      expect(secretLog).toContain('super_se...');
      expect(secretLog).not.toContain('super_secret_value_12345678');
    });

    it('should handle missing config gracefully', async () => {
      // Arrange
      const command = createConfigCommand();
      mockConfigManager.getConfig.mockReturnValue(null);

      // Act
      await command.parseAsync(['node', 'test', 'get']);

      // Assert
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('No configuration found')
      );
    });

    it('should handle non-existent key', async () => {
      // Arrange
      const command = createConfigCommand();
      mockConfigManager.getConfig.mockReturnValue({
        network: 'testnet',
      });

      // Act
      await command.parseAsync(['node', 'test', 'get', 'nonExistentKey']);

      // Assert
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('not found')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('config path', () => {
    it('should display config file path', async () => {
      // Arrange
      const command = createConfigCommand();

      // Act
      await command.parseAsync(['node', 'test', 'path']);

      // Assert
      expect(consoleSpy.log).toHaveBeenCalledWith(CONFIG_FILE_PATH);
    });
  });
});
