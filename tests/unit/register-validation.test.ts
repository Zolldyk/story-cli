/**
 * Unit tests for register command validation logic
 * Tests royalty percentage validation (negative test cases)
 * Source: QA Finding TEST-001
 */

import { describe, it, expect } from 'vitest';

/**
 * Extracted validation logic from register.ts:67-75
 * This matches the inline validation function used in the royalty percentage prompt
 */
function validateRoyaltyPercentage(value: number): boolean | string {
  if (value < 0 || value > 100) {
    return 'Royalty percentage must be between 0 and 100';
  }
  if (!Number.isInteger(value)) {
    return 'Royalty percentage must be a whole number';
  }
  return true;
}

describe('Register Command - Royalty Percentage Validation', () => {
  describe('Valid royalty percentage values', () => {
    it('should accept 0% royalty', () => {
      // Arrange & Act
      const result = validateRoyaltyPercentage(0);

      // Assert
      expect(result).toBe(true);
    });

    it('should accept 50% royalty', () => {
      // Arrange & Act
      const result = validateRoyaltyPercentage(50);

      // Assert
      expect(result).toBe(true);
    });

    it('should accept 100% royalty', () => {
      // Arrange & Act
      const result = validateRoyaltyPercentage(100);

      // Assert
      expect(result).toBe(true);
    });

    it('should accept default 5% royalty', () => {
      // Arrange & Act
      const result = validateRoyaltyPercentage(5);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('Invalid royalty percentage values (negative tests)', () => {
    it('should reject negative royalty percentage', () => {
      // Arrange & Act
      const result = validateRoyaltyPercentage(-1);

      // Assert
      expect(result).toBe('Royalty percentage must be between 0 and 100');
    });

    it('should reject royalty percentage over 100', () => {
      // Arrange & Act
      const result = validateRoyaltyPercentage(101);

      // Assert
      expect(result).toBe('Royalty percentage must be between 0 and 100');
    });

    it('should reject royalty percentage over 100 (large value)', () => {
      // Arrange & Act
      const result = validateRoyaltyPercentage(999);

      // Assert
      expect(result).toBe('Royalty percentage must be between 0 and 100');
    });

    it('should reject decimal royalty percentage', () => {
      // Arrange & Act
      const result = validateRoyaltyPercentage(5.5);

      // Assert
      expect(result).toBe('Royalty percentage must be a whole number');
    });

    it('should reject decimal royalty percentage (0.1)', () => {
      // Arrange & Act
      const result = validateRoyaltyPercentage(0.1);

      // Assert
      expect(result).toBe('Royalty percentage must be a whole number');
    });

    it('should reject decimal royalty percentage (99.99)', () => {
      // Arrange & Act
      const result = validateRoyaltyPercentage(99.99);

      // Assert
      expect(result).toBe('Royalty percentage must be a whole number');
    });
  });

  describe('Edge cases', () => {
    it('should accept boundary value 0', () => {
      // Arrange & Act
      const result = validateRoyaltyPercentage(0);

      // Assert
      expect(result).toBe(true);
    });

    it('should accept boundary value 100', () => {
      // Arrange & Act
      const result = validateRoyaltyPercentage(100);

      // Assert
      expect(result).toBe(true);
    });

    it('should reject boundary violation -0.1', () => {
      // Arrange & Act
      const result = validateRoyaltyPercentage(-0.1);

      // Assert
      // Note: This triggers the range check first in the current implementation
      expect(result).toBe('Royalty percentage must be between 0 and 100');
    });

    it('should reject boundary violation 100.1', () => {
      // Arrange & Act
      const result = validateRoyaltyPercentage(100.1);

      // Assert
      // Note: This triggers the range check first in the current implementation
      expect(result).toBe('Royalty percentage must be between 0 and 100');
    });
  });
});
