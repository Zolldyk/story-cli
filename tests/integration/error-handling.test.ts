/**
 * Integration tests for error handling scenarios
 * Source: architecture/test-strategy-and-standards.md#Test Types
 *
 * Tests end-to-end error scenarios including validation, suggestions, and error messages
 * Pattern: AAA (Arrange-Act-Assert)
 */

import { describe, it, expect } from 'vitest';
import { ConfigError } from '../../src/types/errors.js';
import { ValidationError } from '../../src/types/errors.js';
import { NetworkError } from '../../src/types/errors.js';
import { suggestCommand, suggestNetworkName, formatSuggestion } from '../../src/lib/suggestion-engine.js';
import { validateWalletAddress, validateIPFSHash, validateLicenseConfig, validateMetadata } from '../../src/lib/validation.js';

describe('Error Handling Integration Tests', () => {
  describe('Missing Configuration Errors', () => {
    it('should trigger ConfigError with helpful message for missing pinataApiKey', () => {
      // Arrange
      const missingKey = 'pinataApiKey';

      // Act
      const message = ConfigError.formatConfigErrorMessage(missingKey);

      // Assert
      expect(message).toContain('Pinata API key not found'); // What
      expect(message).toContain('IPFS uploads require'); // Why
      expect(message).toContain('story config set pinataApiKey YOUR_KEY'); // How
    });

    it('should trigger ConfigError with helpful message for missing wallet address', () => {
      // Arrange
      const missingKey = 'walletAddress';

      // Act
      const message = ConfigError.formatConfigErrorMessage(missingKey);

      // Assert
      expect(message).toContain('Wallet address not found'); // What
      expect(message).toContain('Transaction signing requires'); // Why
      expect(message).toContain('story config set walletAddress'); // How
    });
  });

  describe('Invalid Wallet Address Validation', () => {
    it('should throw ValidationError for invalid wallet address', () => {
      // Arrange
      const invalidAddress = '0x123'; // Too short

      // Act & Assert
      expect(() => validateWalletAddress(invalidAddress)).toThrow(ValidationError);
      expect(() => validateWalletAddress(invalidAddress)).toThrow('Invalid wallet address format');
    });

    it('should throw ValidationError with example format for malformed address', () => {
      // Arrange
      const malformedAddress = 'not-an-address';

      // Act
      try {
        validateWalletAddress(malformedAddress);
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        // Assert
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain('42 characters starting with 0x');
        expect((error as ValidationError).message).toContain('Example: 0x');
      }
    });

    it('should not throw for valid wallet address', () => {
      // Arrange
      const validAddress = '0x1234567890abcdef1234567890abcdef12345678';

      // Act & Assert
      expect(() => validateWalletAddress(validAddress)).not.toThrow();
    });
  });

  describe('Invalid IPFS Hash Validation', () => {
    it('should throw ValidationError for invalid IPFS hash', () => {
      // Arrange
      const invalidHash = 'invalid-hash';

      // Act & Assert
      expect(() => validateIPFSHash(invalidHash)).toThrow(ValidationError);
      expect(() => validateIPFSHash(invalidHash)).toThrow('Invalid IPFS hash format');
    });

    it('should not throw for valid IPFS hash with Qm prefix', () => {
      // Arrange
      const validHash = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';

      // Act & Assert
      expect(() => validateIPFSHash(validHash)).not.toThrow();
    });

    it('should not throw for valid IPFS hash with ipfs:// prefix', () => {
      // Arrange
      const validHash = 'ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';

      // Act & Assert
      expect(() => validateIPFSHash(validHash)).not.toThrow();
    });
  });

  describe('Network Timeout Errors', () => {
    it('should create NetworkError with retry guidance for RPC timeout', () => {
      // Arrange
      const rpcUrl = 'https://rpc.story.foundation';

      // Act
      const error = NetworkError.rpcTimeout(rpcUrl);

      // Assert
      expect(error.message).toContain('RPC endpoint timed out'); // What
      expect(error.message).toContain('Network connection may be slow'); // Why
      expect(error.message).toContain('try again in 30 seconds'); // How
      expect(error.message).toContain('story config set rpcUrl YOUR_RPC_URL'); // How
    });
  });

  describe('Typo Suggestions', () => {
    it('should suggest "mainnet" for typo "mainet"', () => {
      // Arrange
      const typo = 'mainet';

      // Act
      const suggestion = suggestNetworkName(typo);

      // Assert
      expect(suggestion).toBe('mainnet');
    });

    it('should suggest "testnet" for typo "testent"', () => {
      // Arrange
      const typo = 'testent';

      // Act
      const suggestion = suggestNetworkName(typo);

      // Assert
      expect(suggestion).toBe('testnet');
    });

    it('should suggest "register" for typo "registr"', () => {
      // Arrange
      const typo = 'registr';
      const validCommands = ['register', 'portfolio', 'config'];

      // Act
      const suggestion = suggestCommand(typo, validCommands);

      // Assert
      expect(suggestion).toBe('register');
    });

    it('should suggest "portfolio" for typo "portfolo"', () => {
      // Arrange
      const typo = 'portfolo';
      const validCommands = ['register', 'portfolio', 'config'];

      // Act
      const suggestion = suggestCommand(typo, validCommands);

      // Assert
      expect(suggestion).toBe('portfolio');
    });

    it('should format suggestion message correctly', () => {
      // Arrange
      const input = 'mainet';
      const suggestion = 'mainnet';

      // Act
      const message = formatSuggestion(input, suggestion, 'network');

      // Assert
      expect(message).toContain("Unknown network: 'mainet'");
      expect(message).toContain("Did you mean 'mainnet'?");
    });

    it('should return null for no close match', () => {
      // Arrange
      const typo = 'completelywrong';
      const validCommands = ['register', 'portfolio', 'config'];

      // Act
      const suggestion = suggestCommand(typo, validCommands);

      // Assert
      expect(suggestion).toBeNull();
    });
  });

  describe('Validation Before External Calls', () => {
    it('should throw ValidationError before any external API call for invalid license config', () => {
      // Arrange
      const invalidLicense = { /* missing type field */ };

      // Act & Assert
      // This should throw immediately, preventing any external call
      expect(() => validateLicenseConfig(invalidLicense)).toThrow(ValidationError);
      expect(() => validateLicenseConfig(invalidLicense)).toThrow('License type is required');
    });

    it('should throw ValidationError before any external API call for invalid metadata', () => {
      // Arrange
      const invalidMetadata = { description: 'test' }; // missing name field

      // Act & Assert
      // This should throw immediately, preventing any external call
      expect(() => validateMetadata(invalidMetadata)).toThrow(ValidationError);
      expect(() => validateMetadata(invalidMetadata)).toThrow('Metadata name is required');
    });

    it('should not throw for valid license configuration', () => {
      // Arrange
      const validLicense = {
        type: 'commercial-use',
        commercial: true,
      };

      // Act & Assert
      expect(() => validateLicenseConfig(validLicense)).not.toThrow();
    });

    it('should not throw for valid metadata', () => {
      // Arrange
      const validMetadata = {
        name: 'My IP Asset',
        description: 'A test IP asset',
      };

      // Act & Assert
      expect(() => validateMetadata(validMetadata)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string wallet address', () => {
      // Arrange
      const emptyAddress = '';

      // Act & Assert
      expect(() => validateWalletAddress(emptyAddress)).toThrow(ValidationError);
    });

    it('should handle null-like values in license config', () => {
      // Arrange
      const nullLicense = null;

      // Act & Assert
      expect(() => validateLicenseConfig(nullLicense)).toThrow(ValidationError);
      expect(() => validateLicenseConfig(nullLicense)).toThrow('must be an object');
    });

    it('should handle exact match in command suggestion', () => {
      // Arrange
      const exactMatch = 'register';
      const validCommands = ['register', 'portfolio', 'config'];

      // Act
      const suggestion = suggestCommand(exactMatch, validCommands);

      // Assert
      // Exact match should return the same value
      expect(suggestion).toBe('register');
    });
  });
});
