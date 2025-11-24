/**
 * Unit tests for error classes
 * Source: architecture/test-strategy-and-standards.md#Test Types
 *
 * Tests error hierarchy, exit codes, and message formatting
 * Pattern: AAA (Arrange-Act-Assert)
 */

import { describe, it, expect } from 'vitest';
import {
  CLIError,
  ConfigError,
  ValidationError,
  NetworkError,
  TransactionError,
  APIError,
  EXIT_CODE_SUCCESS,
  EXIT_CODE_USER_ERROR,
  EXIT_CODE_SYSTEM_ERROR,
} from '../../src/types/errors.js';

describe('Error Class Hierarchy', () => {
  describe('CLIError', () => {
    it('should create error with custom message and exit code', () => {
      // Arrange & Act
      const error = new CLIError('Test error', 42);

      // Assert
      expect(error.message).toBe('Test error');
      expect(error.exitCode).toBe(42);
      expect(error.name).toBe('CLIError');
    });

    it('should extend native Error class', () => {
      // Arrange & Act
      const error = new CLIError('Test error', 1);

      // Assert
      expect(error instanceof Error).toBe(true);
      expect(error instanceof CLIError).toBe(true);
    });

    it('should have default exit code of 1', () => {
      // Arrange & Act
      const error = new CLIError('Test error');

      // Assert
      expect(error.exitCode).toBe(1);
    });
  });

  describe('ConfigError', () => {
    it('should create error with user error exit code (1)', () => {
      // Arrange & Act
      const error = new ConfigError('Config missing');

      // Assert
      expect(error.exitCode).toBe(EXIT_CODE_USER_ERROR);
      expect(error.name).toBe('ConfigError');
    });

    it('should extend CLIError', () => {
      // Arrange & Act
      const error = new ConfigError('Test error');

      // Assert
      expect(error instanceof CLIError).toBe(true);
      expect(error instanceof ConfigError).toBe(true);
    });

    it('should format missing config error with three-part structure', () => {
      // Arrange & Act
      const message = ConfigError.formatConfigErrorMessage('pinataApiKey');

      // Assert
      expect(message).toContain('Pinata API key not found'); // What
      expect(message).toContain('IPFS uploads require'); // Why
      expect(message).toContain('Run `story config set'); // How
    });
  });
});

describe('ValidationError', () => {
  it('should create error with user error exit code (1)', () => {
    // Arrange & Act
    const error = new ValidationError('Invalid input');

    // Assert
    expect(error.exitCode).toBe(EXIT_CODE_USER_ERROR);
    expect(error.name).toBe('ValidationError');
  });

  it('should extend CLIError', () => {
    // Arrange & Act
    const error = new ValidationError('Test error');

    // Assert
    expect(error instanceof CLIError).toBe(true);
    expect(error instanceof ValidationError).toBe(true);
  });

  describe('invalidWalletAddress()', () => {
    it('should create error with three-part message structure', () => {
      // Arrange
      const address = '0x123';

      // Act
      const error = ValidationError.invalidWalletAddress(address);

      // Assert
      expect(error.message).toContain('Invalid wallet address format: 0x123'); // What
      expect(error.message).toContain('42 characters starting with 0x'); // Why
      expect(error.message).toContain('Example: 0x'); // How
    });

    it('should return ValidationError instance', () => {
      // Arrange & Act
      const error = ValidationError.invalidWalletAddress('invalid');

      // Assert
      expect(error instanceof ValidationError).toBe(true);
      expect(error.exitCode).toBe(EXIT_CODE_USER_ERROR);
    });
  });

  describe('invalidIPFSHash()', () => {
    it('should create error with three-part message structure', () => {
      // Arrange
      const hash = 'invalid-hash';

      // Act
      const error = ValidationError.invalidIPFSHash(hash);

      // Assert
      expect(error.message).toContain('Invalid IPFS hash format: invalid-hash'); // What
      expect(error.message).toContain('IPFS hashes must start with Qm'); // Why
      expect(error.message).toContain('Example: QmXXX'); // How
    });
  });

  describe('invalidLicenseConfig()', () => {
    it('should create error with three-part message structure', () => {
      // Arrange
      const reason = 'Missing type field';

      // Act
      const error = ValidationError.invalidLicenseConfig(reason);

      // Assert
      expect(error.message).toContain('Invalid license configuration: Missing type field'); // What
      expect(error.message).toContain('Story Protocol requirements'); // Why
      expect(error.message).toContain('Check your license parameters'); // How
    });
  });
});

describe('NetworkError', () => {
  it('should create error with system error exit code (2)', () => {
    // Arrange & Act
    const error = new NetworkError('Network timeout');

    // Assert
    expect(error.exitCode).toBe(EXIT_CODE_SYSTEM_ERROR);
    expect(error.name).toBe('NetworkError');
  });

  it('should extend CLIError', () => {
    // Arrange & Act
    const error = new NetworkError('Test error');

    // Assert
    expect(error instanceof CLIError).toBe(true);
    expect(error instanceof NetworkError).toBe(true);
  });

  describe('rpcTimeout()', () => {
    it('should create error with three-part message structure', () => {
      // Arrange
      const rpcUrl = 'https://rpc.example.com';

      // Act
      const error = NetworkError.rpcTimeout(rpcUrl);

      // Assert
      expect(error.message).toContain('Story Protocol RPC endpoint timed out'); // What
      expect(error.message).toContain('Network connection may be slow'); // Why
      expect(error.message).toContain('story config set rpcUrl YOUR_RPC_URL'); // How
    });

    it('should return NetworkError instance', () => {
      // Arrange & Act
      const error = NetworkError.rpcTimeout('https://rpc.test');

      // Assert
      expect(error instanceof NetworkError).toBe(true);
      expect(error.exitCode).toBe(EXIT_CODE_SYSTEM_ERROR);
    });
  });

  describe('apiRateLimited()', () => {
    it('should create error with three-part message structure', () => {
      // Arrange
      const service = 'Pinata';

      // Act
      const error = NetworkError.apiRateLimited(service);

      // Assert
      expect(error.message).toContain('Rate limit exceeded for Pinata'); // What
      expect(error.message).toContain('Too many requests'); // Why
      expect(error.message).toContain('Please wait and try again'); // How
    });
  });

  describe('connectionFailed()', () => {
    it('should create error with three-part message structure', () => {
      // Arrange
      const endpoint = 'https://api.example.com';

      // Act
      const error = NetworkError.connectionFailed(endpoint);

      // Assert
      expect(error.message).toContain('Failed to connect to https://api.example.com'); // What
      expect(error.message).toContain('Network connection could not be established'); // Why
      expect(error.message).toContain('Check your internet connection'); // How
    });
  });
});

describe('TransactionError', () => {
  it('should create error with system error exit code (2)', () => {
    // Arrange & Act
    const error = new TransactionError('Transaction failed');

    // Assert
    expect(error.exitCode).toBe(EXIT_CODE_SYSTEM_ERROR);
    expect(error.name).toBe('TransactionError');
  });

  it('should extend CLIError', () => {
    // Arrange & Act
    const error = new TransactionError('Test error');

    // Assert
    expect(error instanceof CLIError).toBe(true);
    expect(error instanceof TransactionError).toBe(true);
  });

  describe('insufficientGas()', () => {
    it('should create error with three-part message structure', () => {
      // Arrange
      const balance = '0.001';

      // Act
      const error = TransactionError.insufficientGas(balance);

      // Assert
      expect(error.message).toContain('Insufficient gas balance: 0.001 ETH'); // What
      expect(error.message).toContain('Transaction requires gas fees'); // Why
      expect(error.message).toContain('https://faucet.story.foundation'); // How
    });

    it('should return TransactionError instance', () => {
      // Arrange & Act
      const error = TransactionError.insufficientGas('0');

      // Assert
      expect(error instanceof TransactionError).toBe(true);
      expect(error.exitCode).toBe(EXIT_CODE_SYSTEM_ERROR);
    });
  });

  describe('transactionReverted()', () => {
    it('should create error with three-part message structure', () => {
      // Arrange
      const reason = 'Insufficient allowance';

      // Act
      const error = TransactionError.transactionReverted(reason);

      // Assert
      expect(error.message).toContain('Transaction reverted: Insufficient allowance'); // What
      expect(error.message).toContain('blockchain rejected'); // Why
      expect(error.message).toContain('adjust your transaction parameters'); // How
    });
  });

  describe('transactionTimeout()', () => {
    it('should create error with three-part message structure', () => {
      // Arrange
      const txHash = '0xabc123';

      // Act
      const error = TransactionError.transactionTimeout(txHash);

      // Assert
      expect(error.message).toContain('Transaction timed out: 0xabc123'); // What
      expect(error.message).toContain('not confirmed within'); // Why
      expect(error.message).toContain('Check transaction status'); // How
    });
  });
});

describe('APIError', () => {
  it('should create error with system error exit code (2)', () => {
    // Arrange & Act
    const error = new APIError('API call failed');

    // Assert
    expect(error.exitCode).toBe(EXIT_CODE_SYSTEM_ERROR);
    expect(error.name).toBe('APIError');
  });

  it('should extend CLIError', () => {
    // Arrange & Act
    const error = new APIError('Test error');

    // Assert
    expect(error instanceof CLIError).toBe(true);
    expect(error instanceof APIError).toBe(true);
  });

  describe('uploadFailed()', () => {
    it('should create error with three-part message structure', () => {
      // Arrange
      const service = 'Pinata';
      const reason = 'Authentication failed';

      // Act
      const error = APIError.uploadFailed(service, reason);

      // Assert
      expect(error.message).toContain('Pinata upload failed: Authentication failed'); // What
      expect(error.message).toContain('external service rejected'); // Why
      expect(error.message).toContain('Check your API credentials'); // How
    });

    it('should return APIError instance', () => {
      // Arrange & Act
      const error = APIError.uploadFailed('Pinata', 'Error');

      // Assert
      expect(error instanceof APIError).toBe(true);
      expect(error.exitCode).toBe(EXIT_CODE_SYSTEM_ERROR);
    });
  });

  describe('queryFailed()', () => {
    it('should create error with three-part message structure', () => {
      // Arrange
      const service = 'Goldsky';

      // Act
      const error = APIError.queryFailed(service);

      // Assert
      expect(error.message).toContain('Goldsky query failed'); // What
      expect(error.message).toContain('could not process the request'); // Why
      expect(error.message).toContain('Check service status'); // How
    });
  });
});

describe('Exit Code Constants', () => {
  it('should export correct exit code values', () => {
    // Assert
    expect(EXIT_CODE_SUCCESS).toBe(0);
    expect(EXIT_CODE_USER_ERROR).toBe(1);
    expect(EXIT_CODE_SYSTEM_ERROR).toBe(2);
  });
});
