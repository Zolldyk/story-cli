/**
 * License types and wizard interfaces
 * Source: architecture/data-models.md#Model: LicenseConfig
 */

/**
 * Wizard answers collected from interactive prompts
 * Used to capture user responses during license selection flow
 */
export interface WizardAnswers {
  /** Answer to "Is this for commercial use?" */
  commercialUse: boolean;

  /** Answer to "Allow derivatives/remixes?" */
  derivativesAllowed: boolean;

  /** Answer to "Commercial revenue share percentage?" (conditional) */
  royaltyPercentage?: number;
}

/**
 * License configuration for Story Protocol PIL (Programmable IP License)
 * Source: architecture/data-models.md#Model: LicenseConfig
 */
export interface LicenseConfig {
  /** License type identifier (NON_COMMERCIAL_ONLY, COMMERCIAL_REMIX, etc.) */
  type: string;

  /** Whether commercial use is allowed */
  commercialUse: boolean;

  /** Whether derivatives/remixes are permitted */
  derivativesAllowed: boolean;

  /** Revenue share percentage (0-100) */
  royaltyPercentage?: number;

  /** Currency for royalty payments (optional) */
  currency?: string;

  /** Story Protocol PIL terms ID (optional) */
  pilTermsId?: string;
}
