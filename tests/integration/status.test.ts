/**
 * Integration tests for status command
 * Source: architecture/test-strategy-and-standards.md#Test Types
 *
 * Tests status command integration with ConfigManager, StoryClient, and TerminalUI
 * Pattern: AAA (Arrange-Act-Assert)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { executeStatusCommand } from '../../src/commands/status.js';
import { ConfigError, ValidationError } from '../../src/types/errors.js';

// Mock dependencies
vi.mock('../../src/lib/config-manager.js', () => ({
  ConfigManager: {
    getInstance: vi.fn(() => ({
      load: vi.fn(async () => ({ network: 'testnet' })),
      getConfig: vi.fn(() => ({ network: 'testnet' })),
      get: vi.fn((key: string) => {
        if (key === 'rpcUrl') return undefined;
        return undefined;
      }),
    })),
  },
}));

vi.mock('../../src/lib/story-client.js', async () => {
  const { ValidationError } = await import('../../src/types/errors.js');
  const { isValidPrivateKey } = await import('../../src/lib/validation.js');

  return {
    StoryClient: vi.fn().mockImplementation((config) => {
      // Validate private key like the real StoryClient does
      if (!isValidPrivateKey(config.privateKey)) {
        throw ValidationError.invalidPrivateKey();
      }

      return {
        getNetworkName: vi.fn(() => 'testnet'),
        getRpcUrl: vi.fn(() => 'https://aeneid.storyrpc.io'),
        getWalletAddress: vi.fn(() => '0x1234567890123456789012345678901234567890'),
        checkGasBalance: vi.fn(async () => BigInt(1e18)), // 1 ETH
        warnInsufficientGas: vi.fn(),
      };
    }),
  };
});

vi.mock('../../src/lib/mock-story-client.js', async () => {
  const { ValidationError } = await import('../../src/types/errors.js');
  const { isValidPrivateKey } = await import('../../src/lib/validation.js');

  return {
    MockStoryClient: vi.fn().mockImplementation((config) => {
      // Validate private key like the real MockStoryClient does
      if (!isValidPrivateKey(config.privateKey)) {
        throw ValidationError.invalidPrivateKey();
      }

      return {
        getNetworkName: vi.fn(() => 'testnet'),
        getRpcUrl: vi.fn(() => 'https://aeneid.storyrpc.io'),
        getWalletAddress: vi.fn(() => '0x1234567890123456789012345678901234567890'),
        checkGasBalance: vi.fn(async () => BigInt(1e18)), // 1 ETH
        warnInsufficientGas: vi.fn(),
      };
    }),
  };
});

vi.mock('../../src/lib/terminal-ui.js', () => ({
  TerminalUI: {
    spinner: vi.fn(() => ({
      start: vi.fn(),
      stop: vi.fn(),
    })),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Status Command Integration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should display wallet status with valid config', async () => {
    // Arrange
    process.env.STORY_PRIVATE_KEY =
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

    const { TerminalUI } = await import('../../src/lib/terminal-ui.js');

    // Act
    await executeStatusCommand();

    // Assert
    expect(TerminalUI.success).toHaveBeenCalled();
    const successMessage = (TerminalUI.success as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(successMessage).toContain('Wallet Connected');
    expect(successMessage).toContain('0x1234...7890'); // Truncated address
    expect(successMessage).toContain('testnet');
    expect(successMessage).toContain('https://aeneid.storyrpc.io');
    expect(successMessage).toContain('ETH');
  });

  it('should throw ConfigError when STORY_PRIVATE_KEY is missing', async () => {
    // Arrange
    delete process.env.STORY_PRIVATE_KEY;

    // Act & Assert
    await expect(executeStatusCommand()).rejects.toThrow(ConfigError);
  });

  it('should handle invalid private key', async () => {
    // Arrange
    process.env.STORY_PRIVATE_KEY = 'invalid-key';

    // Act & Assert
    await expect(executeStatusCommand()).rejects.toThrow(ValidationError);
  });

  it('should stop spinner on error', async () => {
    // Arrange
    delete process.env.STORY_PRIVATE_KEY;
    const { TerminalUI } = await import('../../src/lib/terminal-ui.js');
    const mockSpinner = {
      start: vi.fn(),
      stop: vi.fn(),
    };
    (TerminalUI.spinner as ReturnType<typeof vi.fn>).mockReturnValue(mockSpinner);

    // Act
    try {
      await executeStatusCommand();
    } catch {
      // Expected to throw
    }

    // Assert
    expect(mockSpinner.stop).toHaveBeenCalled();
  });
});
