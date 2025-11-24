/**
 * License Mapper Component
 * Maps wizard answers to PIL license configuration and generates summaries
 * Source: architecture/components.md - General Pattern
 */

import { WizardAnswers, LicenseConfig } from '../types/license.js';
import { LICENSE_TYPES } from '../constants/license-types.js';

/**
 * Maps wizard answers to Story Protocol PIL license configuration
 * Source: Epic 1 Story 1.5 AC6
 *
 * @param answers - User responses from license wizard prompts
 * @returns License configuration object matching PIL terms
 */
export function mapAnswersToLicenseConfig(answers: WizardAnswers): LicenseConfig {
  // commercialUse=false → NON_COMMERCIAL_ONLY
  if (!answers.commercialUse && !answers.derivativesAllowed) {
    return {
      type: 'NON_COMMERCIAL_ONLY',
      commercialUse: false,
      derivativesAllowed: false,
      royaltyPercentage: 0,
    };
  }

  // commercialUse=true, derivativesAllowed=false → COMMERCIAL_NO_DERIVATIVES
  if (answers.commercialUse && !answers.derivativesAllowed) {
    return {
      type: 'COMMERCIAL_NO_DERIVATIVES',
      commercialUse: true,
      derivativesAllowed: false,
      royaltyPercentage: 0,
    };
  }

  // commercialUse=true, derivativesAllowed=true → COMMERCIAL_REMIX
  if (answers.commercialUse && answers.derivativesAllowed) {
    return {
      type: 'COMMERCIAL_REMIX',
      commercialUse: true,
      derivativesAllowed: true,
      royaltyPercentage: answers.royaltyPercentage ?? 0,
    };
  }

  // commercialUse=false, derivativesAllowed=true → NON_COMMERCIAL_DERIVATIVES
  return {
    type: 'NON_COMMERCIAL_DERIVATIVES',
    commercialUse: false,
    derivativesAllowed: true,
    royaltyPercentage: 0,
  };
}

/**
 * Generates user-friendly license summary text
 * Source: Epic 1 Story 1.5 AC7
 *
 * @param config - License configuration object
 * @returns Human-readable summary of the license terms
 */
export function getLicenseSummary(config: LicenseConfig): string {
  const licenseType = config.type;

  switch (licenseType) {
    case 'COMMERCIAL_REMIX':
      return `${LICENSE_TYPES.COMMERCIAL_REMIX.name} license with ${config.royaltyPercentage}% royalty. ${LICENSE_TYPES.COMMERCIAL_REMIX.getDescription(config.royaltyPercentage ?? 0)}`;

    case 'COMMERCIAL_NO_DERIVATIVES':
      return `${LICENSE_TYPES.COMMERCIAL_NO_DERIVATIVES.name} license. ${LICENSE_TYPES.COMMERCIAL_NO_DERIVATIVES.description}`;

    case 'NON_COMMERCIAL_ONLY':
      return `${LICENSE_TYPES.NON_COMMERCIAL_ONLY.name} license. ${LICENSE_TYPES.NON_COMMERCIAL_ONLY.description}`;

    case 'NON_COMMERCIAL_DERIVATIVES':
      return `${LICENSE_TYPES.NON_COMMERCIAL_DERIVATIVES.name} license. ${LICENSE_TYPES.NON_COMMERCIAL_DERIVATIVES.description}`;

    default:
      return `Unknown license type: ${licenseType}`;
  }
}
