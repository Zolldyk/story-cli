/**
 * Validation utilities for Story CLI
 * Source: architecture/source-tree.md - src/lib/validation.ts
 */

import { ValidationError } from '../types/errors.js';
import { IPFS_HASH_PATTERN } from '../constants/validation-patterns.js';

/**
 * Validates Ethereum wallet address format
 * Must be 42 characters starting with "0x"
 */
export function isValidWalletAddress(address: string): boolean {
  if (!address) {
    return false;
  }

  // Must start with 0x and be 42 characters total (0x + 40 hex chars)
  const pattern = /^0x[a-fA-F0-9]{40}$/;
  return pattern.test(address);
}

/**
 * Validates HTTP/HTTPS URL format
 */
export function isValidHttpUrl(url: string): boolean {
  if (!url) {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates that a string is non-empty
 */
export function isNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates wallet address and throws ValidationError if invalid
 * Source: architecture/coding-standards.md#Critical Rules
 *
 * @param address - Wallet address to validate
 * @throws ValidationError if address is invalid
 */
export function validateWalletAddress(address: string): void {
  if (!isValidWalletAddress(address)) {
    throw ValidationError.invalidWalletAddress(address);
  }
}

/**
 * Validates IPFS hash and throws ValidationError if invalid
 * Accepts empty string as valid (for optional fields)
 * Source: architecture/coding-standards.md#Critical Rules, Story 1.6 Task 4
 *
 * @param hash - IPFS hash to validate
 * @throws ValidationError if hash is invalid
 */
export function validateIPFSHash(hash: string): void {
  // Empty string is valid (optional field)
  if (hash === '') {
    return;
  }

  // Validate against IPFS hash pattern
  if (!IPFS_HASH_PATTERN.test(hash)) {
    throw new ValidationError('Invalid IPFS hash format. Expected QmXXX... or ipfs://...');
  }
}

/**
 * Validates metadata name is non-empty
 * Trims whitespace before validation
 * Source: Story 1.6 Task 4
 *
 * @param name - Metadata name to validate
 * @throws ValidationError if name is empty
 */
export function validateMetadataName(name: string): void {
  const trimmedName = name.trim();

  if (trimmedName.length === 0) {
    throw new ValidationError('IP asset name is required and cannot be empty');
  }
}

/**
 * Validates license configuration object
 * Source: AC#9 - Validation must happen before IPFS upload
 *
 * @param license - License configuration to validate
 * @throws ValidationError if license config is invalid
 */
export function validateLicenseConfig(license: unknown): void {
  if (!license || typeof license !== 'object') {
    throw ValidationError.invalidLicenseConfig('License configuration must be an object');
  }

  const licenseObj = license as Record<string, unknown>;

  // Check for required fields (basic validation)
  if (!licenseObj.type || typeof licenseObj.type !== 'string') {
    throw ValidationError.invalidLicenseConfig('License type is required and must be a string');
  }

  // Validate license type is non-empty
  if (!isNonEmptyString(licenseObj.type)) {
    throw ValidationError.invalidLicenseConfig('License type cannot be empty');
  }
}

/**
 * Validates metadata structure before IPFS upload
 * Source: AC#9 - Validation must happen before IPFS upload
 *
 * @param metadata - Metadata object to validate
 * @throws ValidationError if metadata structure is invalid
 */
export function validateMetadata(metadata: unknown): void {
  if (!metadata || typeof metadata !== 'object') {
    throw ValidationError.invalidLicenseConfig('Metadata must be an object');
  }

  const metadataObj = metadata as Record<string, unknown>;

  // Check for required fields
  if (!metadataObj.name || typeof metadataObj.name !== 'string') {
    throw ValidationError.invalidLicenseConfig('Metadata name is required and must be a string');
  }

  if (!isNonEmptyString(metadataObj.name)) {
    throw ValidationError.invalidLicenseConfig('Metadata name cannot be empty');
  }

  // Validate description if present
  if (metadataObj.description !== undefined && typeof metadataObj.description !== 'string') {
    throw ValidationError.invalidLicenseConfig('Metadata description must be a string');
  }
}

/**
 * Validates network configuration before SDK calls
 * Source: AC#9 - Validation must happen before blockchain transactions
 *
 * @param network - Network name to validate
 * @throws ValidationError if network is invalid
 */
export function validateNetwork(network: string): void {
  const validNetworks = ['testnet', 'mainnet'];

  if (!validNetworks.includes(network)) {
    throw ValidationError.invalidLicenseConfig(
      `Invalid network: ${network}. Must be 'testnet' or 'mainnet'`
    );
  }
}

/**
 * Validates private key format
 * Must be 64 hexadecimal characters (with or without 0x prefix)
 * Source: architecture/security.md#Private Key Handling
 */
export function isValidPrivateKey(privateKey: string): boolean {
  if (!privateKey) {
    return false;
  }

  // Remove 0x prefix if present
  const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;

  // Must be exactly 64 hex characters
  const pattern = /^[a-fA-F0-9]{64}$/;
  return pattern.test(cleanKey);
}

/**
 * Validates private key and throws ValidationError if invalid
 * Source: architecture/coding-standards.md#Critical Rules
 *
 * @param privateKey - Private key to validate
 * @throws ValidationError if private key is invalid
 */
export function validatePrivateKey(privateKey: string): void {
  if (!isValidPrivateKey(privateKey)) {
    throw ValidationError.invalidPrivateKey();
  }
}
