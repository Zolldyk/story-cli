/**
 * Unit tests for wallet management
 * Source: architecture/test-strategy-and-standards.md#Test Types
 *
 * Tests wallet private key validation and address derivation
 * Pattern: AAA (Arrange-Act-Assert)
 */

import { describe, it, expect } from 'vitest';
import { isValidPrivateKey, validatePrivateKey } from '../../src/lib/validation.js';
import { ValidationError } from '../../src/types/errors.js';

describe('Wallet Private Key Validation', () => {
  describe('isValidPrivateKey', () => {
    it('should accept valid private key with 0x prefix', () => {
      // Arrange
      const validKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      // Act
      const result = isValidPrivateKey(validKey);

      // Assert
      expect(result).toBe(true);
    });

    it('should accept valid private key without 0x prefix', () => {
      // Arrange
      const validKey = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      // Act
      const result = isValidPrivateKey(validKey);

      // Assert
      expect(result).toBe(true);
    });

    it('should accept private key with uppercase hex characters', () => {
      // Arrange
      const validKey = '0x1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF';

      // Act
      const result = isValidPrivateKey(validKey);

      // Assert
      expect(result).toBe(true);
    });

    it('should accept private key with mixed case hex characters', () => {
      // Arrange
      const validKey = '0x1234567890AbCdEf1234567890AbCdEf1234567890AbCdEf1234567890AbCdEf';

      // Act
      const result = isValidPrivateKey(validKey);

      // Assert
      expect(result).toBe(true);
    });

    it('should reject private key that is too short', () => {
      // Arrange
      const invalidKey = '0x123456789';

      // Act
      const result = isValidPrivateKey(invalidKey);

      // Assert
      expect(result).toBe(false);
    });

    it('should reject private key that is too long', () => {
      // Arrange
      const invalidKey =
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef00';

      // Act
      const result = isValidPrivateKey(invalidKey);

      // Assert
      expect(result).toBe(false);
    });

    it('should reject private key with invalid characters', () => {
      // Arrange
      const invalidKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdeg';

      // Act
      const result = isValidPrivateKey(invalidKey);

      // Assert
      expect(result).toBe(false);
    });

    it('should reject private key with spaces', () => {
      // Arrange
      const invalidKey = '0x1234567890abcdef 1234567890abcdef1234567890abcdef1234567890abcdef';

      // Act
      const result = isValidPrivateKey(invalidKey);

      // Assert
      expect(result).toBe(false);
    });

    it('should reject empty string', () => {
      // Arrange
      const invalidKey = '';

      // Act
      const result = isValidPrivateKey(invalidKey);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('validatePrivateKey', () => {
    it('should not throw for valid private key with 0x prefix', () => {
      // Arrange
      const validKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      // Act & Assert
      expect(() => validatePrivateKey(validKey)).not.toThrow();
    });

    it('should not throw for valid private key without 0x prefix', () => {
      // Arrange
      const validKey = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      // Act & Assert
      expect(() => validatePrivateKey(validKey)).not.toThrow();
    });

    it('should throw ValidationError for invalid private key', () => {
      // Arrange
      const invalidKey = '0x123invalid';

      // Act & Assert
      expect(() => validatePrivateKey(invalidKey)).toThrow(ValidationError);
    });

    it('should throw ValidationError with helpful message', () => {
      // Arrange
      const invalidKey = 'invalid';

      // Act & Assert
      try {
        validatePrivateKey(invalidKey);
        expect.fail('Should have thrown ValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain('Invalid private key format');
        expect((error as ValidationError).message).toContain('64 hexadecimal characters');
        expect((error as ValidationError).message).toContain('Example:');
      }
    });

    it('should throw ValidationError for private key that is too short', () => {
      // Arrange
      const invalidKey = '0x123';

      // Act & Assert
      expect(() => validatePrivateKey(invalidKey)).toThrow(ValidationError);
    });

    it('should throw ValidationError for private key that is too long', () => {
      // Arrange
      const invalidKey =
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefff';

      // Act & Assert
      expect(() => validatePrivateKey(invalidKey)).toThrow(ValidationError);
    });
  });
});

describe('Private Key Security', () => {
  it('should never expose private key in error messages', () => {
    // Arrange
    const invalidKey = 'this-is-clearly-invalid-and-should-not-appear';

    // Act & Assert
    try {
      // Intentionally pass invalid value to trigger error path
      validatePrivateKey(invalidKey);
      expect.fail('Should have thrown');
    } catch (error) {
      // Invalid key should NOT appear in error message (privacy protection)
      // Error message should only show generic format requirements
      expect((error as Error).message).not.toContain(invalidKey);
      expect((error as Error).message).toContain('Invalid private key format');
    }
  });
});
