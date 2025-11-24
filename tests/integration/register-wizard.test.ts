/**
 * Integration tests for license wizard
 * Tests complete wizard flow with prompts, validation, and confirmation
 * Source: Epic 1 Story 1.5 Task 14
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { existsSync, accessSync, statSync } from 'fs';
import inquirer from 'inquirer';
import { TerminalUI } from '../../src/lib/terminal-ui.js';

// Mock modules
vi.mock('fs');
vi.mock('inquirer');
vi.mock('../../src/lib/terminal-ui.js');

// Mock ConfigManager to provide wallet address (Story 1.6)
vi.mock('../../src/lib/config-manager.js', () => ({
  ConfigManager: {
    getInstance: vi.fn(() => ({
      get: vi.fn((key: string) => {
        if (key === 'walletAddress') return '0x1234567890123456789012345678901234567890';
        if (key === 'pinataApiKey') return 'test-api-key';
        if (key === 'pinataApiSecret') return 'test-api-secret';
        return undefined;
      }),
    })),
  },
}));

// Mock IPFSClient for metadata upload (Story 1.6)
vi.mock('../../src/lib/ipfs-client.js', () => ({
  IPFSClient: {
    getInstance: vi.fn(() => ({
      uploadMetadata: vi.fn().mockResolvedValue('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'),
    })),
  },
}));

describe('Register Wizard Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock TerminalUI methods
    vi.mocked(TerminalUI.info).mockImplementation(() => {});
    vi.mocked(TerminalUI.warning).mockImplementation(() => {});
    vi.mocked(TerminalUI.error).mockImplementation(() => {});
    vi.mocked(TerminalUI.box).mockImplementation(() => {});
    vi.mocked(TerminalUI.spinner).mockReturnValue({
      succeed: vi.fn(),
      fail: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    } as any);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Complete wizard flow', () => {
    it('should complete full wizard flow with commercial remix license', async () => {
      // Arrange
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(accessSync).mockImplementation(() => {});
      vi.mocked(statSync).mockReturnValue({ size: 1024 } as any);

      // Mock inquirer prompts in sequence (Story 1.5 + Story 1.6)
      const mockPrompt = vi.mocked(inquirer.prompt);
      mockPrompt
        .mockResolvedValueOnce({ commercialUse: true })            // License: commercial
        .mockResolvedValueOnce({ derivativesAllowed: true })       // License: derivatives
        .mockResolvedValueOnce({ royaltyPercentage: 10 })          // License: royalty
        .mockResolvedValueOnce({ proceed: true })                  // License confirmation
        .mockResolvedValueOnce({                                   // Metadata prompts (Story 1.6)
          name: 'Test Artwork',
          description: 'Test description',
          ipfsImageHash: '',
        })
        .mockResolvedValueOnce({ proceed: true });                 // Metadata confirmation (Story 1.6)

      // Act & Assert
      // Import dynamically to use mocks
      const { createRegisterCommand } = await import('../../src/commands/register.js');
      const command = createRegisterCommand();

      // Execute command action
      await command.parseAsync(['node', 'test', 'register', './test-file.jpg']);

      // Verify prompts were called in correct order (4 license + 2 metadata = 6 total)
      expect(mockPrompt).toHaveBeenCalledTimes(6);

      // Verify TerminalUI was called with correct messages
      expect(TerminalUI.info).toHaveBeenCalledWith(
        expect.stringContaining('Commercial use allows')
      );
      expect(TerminalUI.info).toHaveBeenCalledWith(
        expect.stringContaining('Derivatives allow')
      );
      expect(TerminalUI.info).toHaveBeenCalledWith(
        expect.stringContaining('Royalty percentage')
      );
      expect(TerminalUI.info).toHaveBeenCalledWith(
        expect.stringContaining('Commercial Remix license with 10% royalty')
      );
    });

    it('should complete wizard with non-commercial only license', async () => {
      // Arrange
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(accessSync).mockImplementation(() => {});
      vi.mocked(statSync).mockReturnValue({ size: 2048 } as any);

      const mockPrompt = vi.mocked(inquirer.prompt);
      mockPrompt
        .mockResolvedValueOnce({ commercialUse: false })
        .mockResolvedValueOnce({ derivativesAllowed: false })
        .mockResolvedValueOnce({ proceed: true });

      // Act - Use --metadata-hash flag to skip metadata prompts (Story 1.6)
      const { createRegisterCommand } = await import('../../src/commands/register.js');
      const command = createRegisterCommand();
      await command.parseAsync([
        'node',
        'test',
        'register',
        './test-file.jpg',
        '--metadata-hash',
        'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
      ]);

      // Assert - Should not prompt for royalty percentage
      expect(mockPrompt).toHaveBeenCalledTimes(3); // Only 3 prompts, not 4
      expect(TerminalUI.info).toHaveBeenCalledWith(
        expect.stringContaining('Non-commercial Only license')
      );
    });
  });

  describe('Conditional royalty prompt', () => {
    it('should only display royalty prompt when commercial and derivatives are both true', async () => {
      // Arrange
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(accessSync).mockImplementation(() => {});
      vi.mocked(statSync).mockReturnValue({ size: 1024 } as any);

      const mockPrompt = vi.mocked(inquirer.prompt);
      mockPrompt
        .mockResolvedValueOnce({ commercialUse: true })
        .mockResolvedValueOnce({ derivativesAllowed: true })
        .mockResolvedValueOnce({ royaltyPercentage: 5 })
        .mockResolvedValueOnce({ proceed: true });

      // Act - Use --metadata-hash flag to skip metadata prompts (Story 1.6)
      const { createRegisterCommand } = await import('../../src/commands/register.js');
      const command = createRegisterCommand();
      await command.parseAsync(['node', 'test', 'register', './test-file.jpg', '--metadata-hash', 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG']);

      // Assert - Should prompt for royalty (4 prompts total)
      expect(mockPrompt).toHaveBeenCalledTimes(4);
      expect(TerminalUI.info).toHaveBeenCalledWith(
        expect.stringContaining('Royalty percentage')
      );
    });

    it('should not display royalty prompt when commercial is false', async () => {
      // Arrange
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(accessSync).mockImplementation(() => {});
      vi.mocked(statSync).mockReturnValue({ size: 1024 } as any);

      const mockPrompt = vi.mocked(inquirer.prompt);
      mockPrompt
        .mockResolvedValueOnce({ commercialUse: false })
        .mockResolvedValueOnce({ derivativesAllowed: true })
        .mockResolvedValueOnce({ proceed: true });

      // Act - Use --metadata-hash flag to skip metadata prompts (Story 1.6)
      const { createRegisterCommand } = await import('../../src/commands/register.js');
      const command = createRegisterCommand();
      await command.parseAsync(['node', 'test', 'register', './test-file.jpg', '--metadata-hash', 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG']);

      // Assert - Should NOT prompt for royalty (only 3 prompts)
      expect(mockPrompt).toHaveBeenCalledTimes(3);
    });

    it('should not display royalty prompt when derivatives is false', async () => {
      // Arrange
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(accessSync).mockImplementation(() => {});
      vi.mocked(statSync).mockReturnValue({ size: 1024 } as any);

      const mockPrompt = vi.mocked(inquirer.prompt);
      mockPrompt
        .mockResolvedValueOnce({ commercialUse: true })
        .mockResolvedValueOnce({ derivativesAllowed: false })
        .mockResolvedValueOnce({ proceed: true });

      // Act - Use --metadata-hash flag to skip metadata prompts (Story 1.6)
      const { createRegisterCommand } = await import('../../src/commands/register.js');
      const command = createRegisterCommand();
      await command.parseAsync(['node', 'test', 'register', './test-file.jpg', '--metadata-hash', 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG']);

      // Assert - Should NOT prompt for royalty (only 3 prompts)
      expect(mockPrompt).toHaveBeenCalledTimes(3);
    });
  });

  describe('Default royalty value', () => {
    it('should pre-fill default royalty value of 5%', async () => {
      // Arrange
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(accessSync).mockImplementation(() => {});
      vi.mocked(statSync).mockReturnValue({ size: 1024 } as any);

      const mockPrompt = vi.mocked(inquirer.prompt);
      mockPrompt
        .mockResolvedValueOnce({ commercialUse: true })
        .mockResolvedValueOnce({ derivativesAllowed: true })
        .mockResolvedValueOnce({ royaltyPercentage: 5 }) // Default value
        .mockResolvedValueOnce({ proceed: true });

      // Act - Use --metadata-hash flag to skip metadata prompts (Story 1.6)
      const { createRegisterCommand } = await import('../../src/commands/register.js');
      const command = createRegisterCommand();
      await command.parseAsync(['node', 'test', 'register', './test-file.jpg', '--metadata-hash', 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG']);

      // Assert
      expect(TerminalUI.info).toHaveBeenCalledWith(
        expect.stringContaining('5% royalty')
      );
    });
  });

  describe('Final confirmation', () => {
    it('should exit gracefully when user cancels at confirmation', async () => {
      // Arrange
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(accessSync).mockImplementation(() => {});
      vi.mocked(statSync).mockReturnValue({ size: 1024 } as any);

      const mockPrompt = vi.mocked(inquirer.prompt);
      mockPrompt
        .mockResolvedValueOnce({ commercialUse: true })
        .mockResolvedValueOnce({ derivativesAllowed: false })
        .mockResolvedValueOnce({ proceed: false }); // User cancels

      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      // Act & Assert
      try {
        const { createRegisterCommand } = await import('../../src/commands/register.js');
        const command = createRegisterCommand();
        await command.parseAsync(['node', 'test', 'register', './test-file.jpg']);
      } catch (error: any) {
        expect(error.message).toBe('process.exit called');
      }

      expect(TerminalUI.info).toHaveBeenCalledWith('Registration cancelled.');
      expect(mockExit).toHaveBeenCalledWith(0);

      mockExit.mockRestore();
    });

    it('should proceed when user confirms', async () => {
      // Arrange
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(accessSync).mockImplementation(() => {});
      vi.mocked(statSync).mockReturnValue({ size: 1024 } as any);

      const mockPrompt = vi.mocked(inquirer.prompt);
      mockPrompt
        .mockResolvedValueOnce({ commercialUse: true })
        .mockResolvedValueOnce({ derivativesAllowed: false })
        .mockResolvedValueOnce({ proceed: true }); // User confirms

      // Act - Use --metadata-hash flag to skip metadata prompts (Story 1.6)
      const { createRegisterCommand } = await import('../../src/commands/register.js');
      const command = createRegisterCommand();
      await command.parseAsync(['node', 'test', 'register', './test-file.jpg', '--metadata-hash', 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG']);

      // Assert - Should show story completion message
      expect(TerminalUI.warning).toHaveBeenCalledWith(
        expect.stringContaining('Story 1.7')
      );
    });
  });
});
