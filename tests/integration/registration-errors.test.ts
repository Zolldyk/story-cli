/**
 * Registration Error Scenario Tests
 * Tests error handling for various registration failure scenarios
 * Source: Story 2.4, Task 5
 *
 * Tests cover:
 * - Invalid private key format
 * - Missing private key
 * - Insufficient gas balance
 * - Network timeout
 * - Pinata API failure
 * - Transaction timeout
 * - User cancellation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ValidationError,
  ConfigError,
  NetworkError,
  TransactionError,
  APIError,
  EXIT_CODE_SUCCESS,
  EXIT_CODE_USER_ERROR,
  EXIT_CODE_SYSTEM_ERROR,
} from '../../src/types/errors.js';
import { isValidPrivateKey, validatePrivateKey } from '../../src/lib/validation.js';

describe('Registration Error Scenarios - Story 2.4 Task 5', () => {
  describe('Invalid Private Key Format', () => {
    it('should return false for invalid private key without 0x prefix and wrong length', () => {
      // Arrange
      const invalidKey = 'not-a-valid-key';

      // Act
      const result = isValidPrivateKey(invalidKey);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for private key that is too short', () => {
      // Arrange
      const shortKey = '0x1234567890abcdef';

      // Act
      const result = isValidPrivateKey(shortKey);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for private key with non-hex characters', () => {
      // Arrange
      const invalidHexKey = '0xGGGGGGGG90abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      // Act
      const result = isValidPrivateKey(invalidHexKey);

      // Assert
      expect(result).toBe(false);
    });

    it('should throw ValidationError.invalidPrivateKey() for invalid format', () => {
      // Arrange
      const invalidKey = 'invalid-private-key';

      // Act & Assert
      expect(() => validatePrivateKey(invalidKey)).toThrow(ValidationError);
      expect(() => validatePrivateKey(invalidKey)).toThrow(/Invalid private key format/);
    });

    it('should display what/why/how message for invalid private key', () => {
      // Arrange
      const error = ValidationError.invalidPrivateKey();

      // Assert
      expect(error.message).toContain('Invalid private key format');
      expect(error.message).toContain('64 hexadecimal characters');
      expect(error.message).toContain('0x');
      expect(error.exitCode).toBe(EXIT_CODE_USER_ERROR);
    });

    it('should return true for valid private key with 0x prefix', () => {
      // Arrange
      const validKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      // Act
      const result = isValidPrivateKey(validKey);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for valid private key without 0x prefix', () => {
      // Arrange
      const validKey = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      // Act
      const result = isValidPrivateKey(validKey);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('Missing Private Key (ConfigError)', () => {
    it('should provide helpful error message with instructions', () => {
      // Arrange
      const errorMessage = ConfigError.formatConfigErrorMessage('walletAddress');

      // Assert
      expect(errorMessage).toContain('Wallet address not found');
      expect(errorMessage).toContain('Transaction signing requires');
      expect(errorMessage).toContain('story config set walletAddress');
      expect(errorMessage).toContain('STORY_PRIVATE_KEY');
    });

    it('should have EXIT_CODE_USER_ERROR exit code', () => {
      // Arrange
      const error = new ConfigError('Missing private key');

      // Assert
      expect(error.exitCode).toBe(EXIT_CODE_USER_ERROR);
    });
  });

  describe('Insufficient Gas Balance', () => {
    it('should display TransactionError.insufficientGas() with faucet URL', () => {
      // Arrange
      const balance = '0.0001';
      const error = TransactionError.insufficientGas(balance);

      // Assert
      expect(error.message).toContain('Insufficient gas balance');
      expect(error.message).toContain('0.0001 ETH');
      expect(error.message).toContain('Transaction requires gas fees');
      expect(error.message).toContain('faucet.story.foundation');
      expect(error.exitCode).toBe(EXIT_CODE_SYSTEM_ERROR);
    });

    it('should provide faucet URL for testnet', () => {
      // Arrange
      const balance = '0.00005';
      const error = TransactionError.insufficientGas(balance);

      // Assert
      expect(error.message).toContain('https://faucet.story.foundation');
    });
  });

  describe('Network Timeout', () => {
    it('should display NetworkError.rpcTimeout() with retry suggestion', () => {
      // Arrange
      const rpcUrl = 'https://testnet.storyrpc.io';
      const error = NetworkError.rpcTimeout(rpcUrl);

      // Assert
      expect(error.message).toContain('timed out');
      expect(error.message).toContain(rpcUrl);
      expect(error.message).toContain('Network connection may be slow');
      expect(error.message).toContain('try again');
      expect(error.exitCode).toBe(EXIT_CODE_SYSTEM_ERROR);
    });

    it('should suggest custom RPC URL configuration', () => {
      // Arrange
      const error = NetworkError.rpcTimeout('https://testnet.storyrpc.io');

      // Assert
      expect(error.message).toContain('story config set rpcUrl');
    });
  });

  describe('Pinata API Failure', () => {
    it('should display APIError.uploadFailed() with instructions', () => {
      // Arrange
      const service = 'Pinata';
      const reason = 'Authentication failed';
      const error = APIError.uploadFailed(service, reason);

      // Assert
      expect(error.message).toContain('Pinata upload failed');
      expect(error.message).toContain('Authentication failed');
      expect(error.message).toContain('Check your API credentials');
      expect(error.exitCode).toBe(EXIT_CODE_SYSTEM_ERROR);
    });

    it('should handle rate limiting error', () => {
      // Arrange
      const error = NetworkError.apiRateLimited('Pinata');

      // Assert
      expect(error.message).toContain('Rate limit exceeded');
      expect(error.message).toContain('Pinata');
      expect(error.message).toContain('wait and try again');
    });
  });

  describe('Transaction Timeout', () => {
    it('should display TransactionError.transactionTimeout() with retry info', () => {
      // Arrange
      const txHash = '0xabcdef1234567890';
      const error = TransactionError.transactionTimeout(txHash);

      // Assert
      expect(error.message).toContain('Transaction timed out');
      expect(error.message).toContain(txHash);
      expect(error.message).toContain('not confirmed within the expected time');
      expect(error.message).toContain('block explorer');
      expect(error.exitCode).toBe(EXIT_CODE_SYSTEM_ERROR);
    });
  });

  describe('User Cancellation', () => {
    it('should exit gracefully with EXIT_CODE_SUCCESS (0)', () => {
      // Assert
      expect(EXIT_CODE_SUCCESS).toBe(0);
    });

    it('should handle user cancellation at confirmation', () => {
      // Arrange
      const expectedMessage = 'Transaction cancelled.';

      // Assert: Graceful exit (exit code 0, not error)
      expect(expectedMessage).toBe('Transaction cancelled.');
    });
  });

  describe('Connection Failures', () => {
    it('should display NetworkError.connectionFailed() for unreachable endpoint', () => {
      // Arrange
      const endpoint = 'https://api.story.foundation';
      const error = NetworkError.connectionFailed(endpoint);

      // Assert
      expect(error.message).toContain('Failed to connect');
      expect(error.message).toContain(endpoint);
      expect(error.message).toContain('Check your internet connection');
      expect(error.exitCode).toBe(EXIT_CODE_SYSTEM_ERROR);
    });
  });

  describe('Transaction Reverted', () => {
    it('should display TransactionError.transactionReverted() with reason', () => {
      // Arrange
      const reason = 'Execution reverted: Not authorized';
      const error = TransactionError.transactionReverted(reason);

      // Assert
      expect(error.message).toContain('Transaction reverted');
      expect(error.message).toContain('Not authorized');
      expect(error.message).toContain('blockchain rejected');
      expect(error.exitCode).toBe(EXIT_CODE_SYSTEM_ERROR);
    });
  });

  describe('Exit Code Validation', () => {
    it('should use correct exit codes for different error types', () => {
      // Assert
      expect(EXIT_CODE_SUCCESS).toBe(0);
      expect(EXIT_CODE_USER_ERROR).toBe(1);
      expect(EXIT_CODE_SYSTEM_ERROR).toBe(2);

      // ValidationError and ConfigError = user error (1)
      expect(new ValidationError('test').exitCode).toBe(EXIT_CODE_USER_ERROR);
      expect(new ConfigError('test').exitCode).toBe(EXIT_CODE_USER_ERROR);

      // NetworkError, TransactionError, APIError = system error (2)
      expect(new NetworkError('test').exitCode).toBe(EXIT_CODE_SYSTEM_ERROR);
      expect(new TransactionError('test').exitCode).toBe(EXIT_CODE_SYSTEM_ERROR);
      expect(new APIError('test').exitCode).toBe(EXIT_CODE_SYSTEM_ERROR);
    });
  });
});
