/**
 * Unit tests for license summary generation
 * Source: Epic 1 Story 1.5 Task 13
 */

import { describe, it, expect } from 'vitest';
import { getLicenseSummary } from '../../src/lib/license-mapper.js';
import { LicenseConfig } from '../../src/types/license.js';

describe('License Summary Generation', () => {
  describe('getLicenseSummary', () => {
    it('should return correct summary for NON_COMMERCIAL_ONLY license', () => {
      // Arrange
      const config: LicenseConfig = {
        type: 'NON_COMMERCIAL_ONLY',
        commercialUse: false,
        derivativesAllowed: false,
        royaltyPercentage: 0,
      };

      // Act
      const summary = getLicenseSummary(config);

      // Assert
      expect(summary).toBe(
        'Non-commercial Only license. This prohibits commercial use and modifications.'
      );
    });

    it('should return correct summary for COMMERCIAL_NO_DERIVATIVES license', () => {
      // Arrange
      const config: LicenseConfig = {
        type: 'COMMERCIAL_NO_DERIVATIVES',
        commercialUse: true,
        derivativesAllowed: false,
        royaltyPercentage: 0,
      };

      // Act
      const summary = getLicenseSummary(config);

      // Assert
      expect(summary).toBe(
        'Commercial No-Derivatives license. This allows commercial use but prohibits modifications.'
      );
    });

    it('should return correct summary for COMMERCIAL_REMIX license with royalty', () => {
      // Arrange
      const config: LicenseConfig = {
        type: 'COMMERCIAL_REMIX',
        commercialUse: true,
        derivativesAllowed: true,
        royaltyPercentage: 10,
      };

      // Act
      const summary = getLicenseSummary(config);

      // Assert
      expect(summary).toBe(
        'Commercial Remix license with 10% royalty. This allows commercial use and derivatives, with 10% revenue sharing.'
      );
    });

    it('should return correct summary for NON_COMMERCIAL_DERIVATIVES license', () => {
      // Arrange
      const config: LicenseConfig = {
        type: 'NON_COMMERCIAL_DERIVATIVES',
        commercialUse: false,
        derivativesAllowed: true,
        royaltyPercentage: 0,
      };

      // Act
      const summary = getLicenseSummary(config);

      // Assert
      expect(summary).toBe(
        'Non-commercial Derivatives license. This allows derivatives but prohibits commercial use.'
      );
    });

    it('should handle COMMERCIAL_REMIX with 0% royalty', () => {
      // Arrange
      const config: LicenseConfig = {
        type: 'COMMERCIAL_REMIX',
        commercialUse: true,
        derivativesAllowed: true,
        royaltyPercentage: 0,
      };

      // Act
      const summary = getLicenseSummary(config);

      // Assert
      expect(summary).toContain('0% royalty');
      expect(summary).toContain('0% revenue sharing');
    });

    it('should handle COMMERCIAL_REMIX with 100% royalty', () => {
      // Arrange
      const config: LicenseConfig = {
        type: 'COMMERCIAL_REMIX',
        commercialUse: true,
        derivativesAllowed: true,
        royaltyPercentage: 100,
      };

      // Act
      const summary = getLicenseSummary(config);

      // Assert
      expect(summary).toContain('100% royalty');
      expect(summary).toContain('100% revenue sharing');
    });

    it('should handle COMMERCIAL_REMIX with default 5% royalty', () => {
      // Arrange
      const config: LicenseConfig = {
        type: 'COMMERCIAL_REMIX',
        commercialUse: true,
        derivativesAllowed: true,
        royaltyPercentage: 5,
      };

      // Act
      const summary = getLicenseSummary(config);

      // Assert
      expect(summary).toContain('5% royalty');
      expect(summary).toContain('5% revenue sharing');
    });

    it('should return error message for unknown license type', () => {
      // Arrange
      const config: LicenseConfig = {
        type: 'UNKNOWN_TYPE',
        commercialUse: false,
        derivativesAllowed: false,
        royaltyPercentage: 0,
      };

      // Act
      const summary = getLicenseSummary(config);

      // Assert
      expect(summary).toBe('Unknown license type: UNKNOWN_TYPE');
    });
  });
});
