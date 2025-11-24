/**
 * Unit tests for metadata validation functions
 * Source: architecture/test-strategy-and-standards.md#Test Types
 *
 * Tests validateMetadataName() and validateIPFSHash() functions
 * Pattern: AAA (Arrange-Act-Assert)
 */

import { describe, it, expect } from 'vitest';
import { validateMetadataName, validateIPFSHash } from '../../src/lib/validation.js';
import { ValidationError } from '../../src/types/errors.js';

describe('Metadata Validation', () => {
  describe('validateMetadataName()', () => {
    it('should pass validation for non-empty string', () => {
      // Arrange
      const validName = 'My Digital Artwork';

      // Act & Assert - should not throw
      expect(() => validateMetadataName(validName)).not.toThrow();
    });

    it('should throw ValidationError for empty string', () => {
      // Arrange
      const emptyName = '';

      // Act & Assert
      expect(() => validateMetadataName(emptyName)).toThrow(ValidationError);
      expect(() => validateMetadataName(emptyName)).toThrow(
        'IP asset name is required and cannot be empty'
      );
    });

    it('should throw ValidationError for whitespace-only string', () => {
      // Arrange
      const whitespaceName = '   ';

      // Act & Assert
      expect(() => validateMetadataName(whitespaceName)).toThrow(ValidationError);
      expect(() => validateMetadataName(whitespaceName)).toThrow(
        'IP asset name is required and cannot be empty'
      );
    });

    it('should pass validation for very long name (1000 chars)', () => {
      // Arrange
      const longName = 'a'.repeat(1000);

      // Act & Assert - should not throw
      expect(() => validateMetadataName(longName)).not.toThrow();
    });

    it('should pass validation for name with special characters', () => {
      // Arrange
      const specialCharsName = 'My Artwork! @#$%^&*()';

      // Act & Assert - should not throw
      expect(() => validateMetadataName(specialCharsName)).not.toThrow();
    });
  });

  describe('validateIPFSHash()', () => {
    it('should pass validation for valid Qm hash (46 chars)', () => {
      // Arrange
      const validHash = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';

      // Act & Assert - should not throw
      expect(() => validateIPFSHash(validHash)).not.toThrow();
    });

    it('should pass validation for ipfs:// format', () => {
      // Arrange
      const ipfsProtocolHash = 'ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';

      // Act & Assert - should not throw
      expect(() => validateIPFSHash(ipfsProtocolHash)).not.toThrow();
    });

    it('should pass validation for empty string (optional field)', () => {
      // Arrange
      const emptyHash = '';

      // Act & Assert - should not throw
      expect(() => validateIPFSHash(emptyHash)).not.toThrow();
    });

    it('should throw ValidationError for invalid hash format', () => {
      // Arrange
      const invalidHash = 'InvalidHash123';

      // Act & Assert
      expect(() => validateIPFSHash(invalidHash)).toThrow(ValidationError);
      expect(() => validateIPFSHash(invalidHash)).toThrow(
        'Invalid IPFS hash format. Expected QmXXX... or ipfs://...'
      );
    });

    it('should throw ValidationError for partial Qm hash (< 46 chars)', () => {
      // Arrange
      const shortHash = 'QmShort';

      // Act & Assert
      expect(() => validateIPFSHash(shortHash)).toThrow(ValidationError);
      expect(() => validateIPFSHash(shortHash)).toThrow(
        'Invalid IPFS hash format. Expected QmXXX... or ipfs://...'
      );
    });

    it('should throw ValidationError for hash with wrong prefix', () => {
      // Arrange
      const wrongPrefixHash = 'XmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';

      // Act & Assert
      expect(() => validateIPFSHash(wrongPrefixHash)).toThrow(ValidationError);
      expect(() => validateIPFSHash(wrongPrefixHash)).toThrow(
        'Invalid IPFS hash format. Expected QmXXX... or ipfs://...'
      );
    });

    it('should pass validation for CIDv0 hash with base58 characters', () => {
      // Arrange
      const base58Hash = 'QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxX';

      // Act & Assert - should not throw
      expect(() => validateIPFSHash(base58Hash)).not.toThrow();
    });
  });
});
