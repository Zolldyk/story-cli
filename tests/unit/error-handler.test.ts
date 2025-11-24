/**
 * Unit tests for global error handler
 * Source: architecture/test-strategy-and-standards.md#Test Types
 *
 * Tests error handling, exit codes, and command wrapping
 * Pattern: AAA (Arrange-Act-Assert)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleError, wrapCommand } from '../../src/lib/error-handler.js';
import { CLIError, ValidationError, NetworkError, TransactionError, EXIT_CODE_USER_ERROR, EXIT_CODE_SYSTEM_ERROR } from '../../src/types/errors.js';
import { TerminalUI } from '../../src/lib/terminal-ui.js';

describe('Error Handler', () => {
  let processExitSpy: ReturnType<typeof vi.spyOn>;
  let terminalUIErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Mock process.exit to prevent test process termination
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    // Mock TerminalUI.error
    terminalUIErrorSpy = vi.spyOn(TerminalUI, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore mocked functions
    processExitSpy.mockRestore();
    terminalUIErrorSpy.mockRestore();
  });

  describe('handleError()', () => {
    it('should extract exit code from CLIError', () => {
      // Arrange
      const error = new CLIError('Test error', 42);
      const debug = false;

      // Act
      handleError(error, debug);

      // Assert
      expect(processExitSpy).toHaveBeenCalledWith(42);
    });

    it('should use exit code 1 for ValidationError (user error)', () => {
      // Arrange
      const error = new ValidationError('Invalid input');
      const debug = false;

      // Act
      handleError(error, debug);

      // Assert
      expect(processExitSpy).toHaveBeenCalledWith(EXIT_CODE_USER_ERROR);
    });

    it('should use exit code 2 for NetworkError (system error)', () => {
      // Arrange
      const error = new NetworkError('Connection failed');
      const debug = false;

      // Act
      handleError(error, debug);

      // Assert
      expect(processExitSpy).toHaveBeenCalledWith(EXIT_CODE_SYSTEM_ERROR);
    });

    it('should use exit code 2 for generic Error (system error)', () => {
      // Arrange
      const error = new Error('Unexpected error');
      const debug = false;

      // Act
      handleError(error, debug);

      // Assert
      expect(processExitSpy).toHaveBeenCalledWith(EXIT_CODE_SYSTEM_ERROR);
    });

    it('should call TerminalUI.error with error message', () => {
      // Arrange
      const error = new CLIError('Test error message', 1);
      const debug = false;

      // Act
      handleError(error, debug);

      // Assert
      expect(terminalUIErrorSpy).toHaveBeenCalledWith('Test error message', undefined);
    });

    it('should pass error object to TerminalUI when debug is true', () => {
      // Arrange
      const error = new CLIError('Test error', 1);
      const debug = true;

      // Act
      handleError(error, debug);

      // Assert
      expect(terminalUIErrorSpy).toHaveBeenCalledWith('Test error', error);
    });

    it('should not pass error object to TerminalUI when debug is false', () => {
      // Arrange
      const error = new CLIError('Test error', 1);
      const debug = false;

      // Act
      handleError(error, debug);

      // Assert
      expect(terminalUIErrorSpy).toHaveBeenCalledWith('Test error', undefined);
    });
  });

  describe('wrapCommand()', () => {
    it('should execute command function successfully', async () => {
      // Arrange
      const mockFn = vi.fn().mockResolvedValue('success');
      const wrapped = wrapCommand(mockFn);

      // Act
      await wrapped('arg1', 'arg2');

      // Assert
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should catch and handle async errors', async () => {
      // Arrange
      const error = new ValidationError('Invalid input');
      const mockFn = vi.fn().mockRejectedValue(error);
      const wrapped = wrapCommand(mockFn);

      // Mock TerminalUI.isDebugMode
      vi.spyOn(TerminalUI, 'isDebugMode').mockReturnValue(false);

      // Act
      await wrapped();

      // Assert
      expect(terminalUIErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(EXIT_CODE_USER_ERROR);
    });

    it('should catch and handle synchronous errors', async () => {
      // Arrange
      const error = new NetworkError('Connection failed');
      const mockFn = vi.fn().mockImplementation(() => {
        throw error;
      });
      const wrapped = wrapCommand(mockFn);

      // Mock TerminalUI.isDebugMode
      vi.spyOn(TerminalUI, 'isDebugMode').mockReturnValue(false);

      // Act
      await wrapped();

      // Assert
      expect(terminalUIErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(EXIT_CODE_SYSTEM_ERROR);
    });

    it('should handle errors in debug mode', async () => {
      // Arrange
      const error = new CLIError('Test error', 1);
      const mockFn = vi.fn().mockRejectedValue(error);
      const wrapped = wrapCommand(mockFn);

      // Mock TerminalUI.isDebugMode to return true
      vi.spyOn(TerminalUI, 'isDebugMode').mockReturnValue(true);

      // Act
      await wrapped();

      // Assert
      expect(terminalUIErrorSpy).toHaveBeenCalledWith('Test error', error);
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should pass arguments to wrapped function', async () => {
      // Arrange
      const mockFn = vi.fn().mockResolvedValue(undefined);
      const wrapped = wrapCommand(mockFn);
      const args = ['arg1', 'arg2', 'arg3'];

      // Act
      await wrapped(...args);

      // Assert
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
    });

    it('should return void regardless of wrapped function return value', async () => {
      // Arrange
      const mockFn = vi.fn().mockResolvedValue('result');
      const wrapped = wrapCommand(mockFn);

      // Act
      const result = await wrapped();

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('Transaction Error Handling - Story 1.7 Task 11', () => {
    it('should format TransactionError with three-part message (what/why/how)', () => {
      // Arrange
      const what = 'Transaction failed';
      const why = 'The blockchain rejected the transaction';
      const how = 'Check your transaction parameters and try again';
      const error = new TransactionError(`${what}.\n${why}.\n${how}`);
      const debug = false;

      // Act
      handleError(error, debug);

      // Assert
      expect(terminalUIErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Transaction failed'),
        undefined
      );
      expect(terminalUIErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('blockchain rejected'),
        undefined
      );
      expect(terminalUIErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('try again'),
        undefined
      );
      expect(processExitSpy).toHaveBeenCalledWith(EXIT_CODE_SYSTEM_ERROR);
    });

    it('should include IPFS hash in timeout error message', () => {
      // Arrange
      const ipfsHash = 'QmTest1234567890';
      const what = 'Transaction timed out after 60 seconds';
      const why = 'Blockchain confirmation took longer than expected';
      const how = `Your metadata is safely stored at: ${ipfsHash}`;
      const error = new TransactionError(`${what}.\n${why}.\n${how}`);
      const debug = false;

      // Act
      handleError(error, debug);

      // Assert
      expect(terminalUIErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(ipfsHash),
        undefined
      );
      expect(processExitSpy).toHaveBeenCalledWith(EXIT_CODE_SYSTEM_ERROR);
    });

    it('should include testnet faucet URL in gas error message', () => {
      // Arrange
      const what = 'Insufficient gas balance: 0.0001 ETH';
      const why = 'Transaction requires gas fees';
      const how = 'For testnet, get free tokens at: https://faucet.story.foundation';
      const error = TransactionError.insufficientGas('0.0001');
      const debug = false;

      // Act
      handleError(error, debug);

      // Assert
      expect(terminalUIErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('faucet.story.foundation'),
        undefined
      );
      expect(terminalUIErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Insufficient gas'),
        undefined
      );
      expect(processExitSpy).toHaveBeenCalledWith(EXIT_CODE_SYSTEM_ERROR);
    });

    it('should include connectivity troubleshooting steps in network error message', () => {
      // Arrange
      const endpoint = 'https://aeneid.storyrpc.io';
      const error = NetworkError.connectionFailed(endpoint);
      const debug = false;

      // Act
      handleError(error, debug);

      // Assert
      expect(terminalUIErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to connect'),
        undefined
      );
      expect(terminalUIErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('internet connection'),
        undefined
      );
      expect(terminalUIErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('firewall settings'),
        undefined
      );
      expect(processExitSpy).toHaveBeenCalledWith(EXIT_CODE_SYSTEM_ERROR);
    });
  });
});
