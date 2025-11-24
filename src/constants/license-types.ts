/**
 * License type constants for Story Protocol PIL (Programmable IP License)
 * Source: Epic 1 Story 1.5 AC6
 */

/**
 * PIL license type constants with descriptions
 * Maps user selections to Story Protocol license terms
 */
export const LICENSE_TYPES = {
  NON_COMMERCIAL_ONLY: {
    name: 'Non-commercial Only',
    description: 'This prohibits commercial use and modifications.',
  },
  COMMERCIAL_NO_DERIVATIVES: {
    name: 'Commercial No-Derivatives',
    description: 'This allows commercial use but prohibits modifications.',
  },
  COMMERCIAL_REMIX: {
    name: 'Commercial Remix',
    getDescription: (royalty: number): string =>
      `This allows commercial use and derivatives, with ${royalty}% revenue sharing.`,
  },
  NON_COMMERCIAL_DERIVATIVES: {
    name: 'Non-commercial Derivatives',
    description: 'This allows derivatives but prohibits commercial use.',
  },
} as const;

/**
 * Type for license type names
 */
export type LicenseTypeName = keyof typeof LICENSE_TYPES;

/**
 * Default royalty percentage for commercial remix licenses
 * Source: Epic 1 Story 1.5 AC9
 */
export const DEFAULT_ROYALTY_PERCENTAGE = 5;
