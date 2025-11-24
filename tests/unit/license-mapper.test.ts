/**
 * Unit tests for license mapper
 * Source: Epic 1 Story 1.5 Task 12
 */

import { describe, it, expect } from 'vitest';
import { mapAnswersToLicenseConfig } from '../../src/lib/license-mapper.js';
import { WizardAnswers, LicenseConfig } from '../../src/types/license.js';

describe('License Mapper', () => {
  describe('mapAnswersToLicenseConfig', () => {
    it('should map commercialUse=false, derivativesAllowed=false to NON_COMMERCIAL_ONLY', () => {
      // Arrange
      const answers: WizardAnswers = {
        commercialUse: false,
        derivativesAllowed: false,
      };

      // Act
      const result: LicenseConfig = mapAnswersToLicenseConfig(answers);

      // Assert
      expect(result.type).toBe('NON_COMMERCIAL_ONLY');
      expect(result.commercialUse).toBe(false);
      expect(result.derivativesAllowed).toBe(false);
      expect(result.royaltyPercentage).toBe(0);
    });

    it('should map commercialUse=true, derivativesAllowed=false to COMMERCIAL_NO_DERIVATIVES', () => {
      // Arrange
      const answers: WizardAnswers = {
        commercialUse: true,
        derivativesAllowed: false,
      };

      // Act
      const result: LicenseConfig = mapAnswersToLicenseConfig(answers);

      // Assert
      expect(result.type).toBe('COMMERCIAL_NO_DERIVATIVES');
      expect(result.commercialUse).toBe(true);
      expect(result.derivativesAllowed).toBe(false);
      expect(result.royaltyPercentage).toBe(0);
    });

    it('should map commercialUse=true, derivativesAllowed=true to COMMERCIAL_REMIX with royalty', () => {
      // Arrange
      const answers: WizardAnswers = {
        commercialUse: true,
        derivativesAllowed: true,
        royaltyPercentage: 10,
      };

      // Act
      const result: LicenseConfig = mapAnswersToLicenseConfig(answers);

      // Assert
      expect(result.type).toBe('COMMERCIAL_REMIX');
      expect(result.commercialUse).toBe(true);
      expect(result.derivativesAllowed).toBe(true);
      expect(result.royaltyPercentage).toBe(10);
    });

    it('should map commercialUse=false, derivativesAllowed=true to NON_COMMERCIAL_DERIVATIVES', () => {
      // Arrange
      const answers: WizardAnswers = {
        commercialUse: false,
        derivativesAllowed: true,
      };

      // Act
      const result: LicenseConfig = mapAnswersToLicenseConfig(answers);

      // Assert
      expect(result.type).toBe('NON_COMMERCIAL_DERIVATIVES');
      expect(result.commercialUse).toBe(false);
      expect(result.derivativesAllowed).toBe(true);
      expect(result.royaltyPercentage).toBe(0);
    });

    it('should default royalty percentage to 0 for COMMERCIAL_REMIX when not provided', () => {
      // Arrange
      const answers: WizardAnswers = {
        commercialUse: true,
        derivativesAllowed: true,
        // royaltyPercentage not provided
      };

      // Act
      const result: LicenseConfig = mapAnswersToLicenseConfig(answers);

      // Assert
      expect(result.type).toBe('COMMERCIAL_REMIX');
      expect(result.royaltyPercentage).toBe(0);
    });

    it('should handle edge case royalty percentage of 0', () => {
      // Arrange
      const answers: WizardAnswers = {
        commercialUse: true,
        derivativesAllowed: true,
        royaltyPercentage: 0,
      };

      // Act
      const result: LicenseConfig = mapAnswersToLicenseConfig(answers);

      // Assert
      expect(result.type).toBe('COMMERCIAL_REMIX');
      expect(result.royaltyPercentage).toBe(0);
    });

    it('should handle edge case royalty percentage of 100', () => {
      // Arrange
      const answers: WizardAnswers = {
        commercialUse: true,
        derivativesAllowed: true,
        royaltyPercentage: 100,
      };

      // Act
      const result: LicenseConfig = mapAnswersToLicenseConfig(answers);

      // Assert
      expect(result.type).toBe('COMMERCIAL_REMIX');
      expect(result.royaltyPercentage).toBe(100);
    });
  });
});
