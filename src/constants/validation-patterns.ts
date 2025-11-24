/**
 * Validation regex patterns for Story CLI
 * Source: architecture/coding-standards.md#Critical Rules
 */

/**
 * IPFS hash pattern
 * Matches CIDv0 (Qm + 44 base58 chars) or ipfs:// protocol format
 * Source: Story 1.6 Task 4
 */
export const IPFS_HASH_PATTERN = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|ipfs:\/\/.+)$/;

/**
 * Ethereum wallet address pattern
 * Matches 0x prefix + 40 hexadecimal characters
 */
export const WALLET_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

/**
 * Private key pattern (without 0x prefix)
 * Matches exactly 64 hexadecimal characters
 */
export const PRIVATE_KEY_PATTERN = /^[a-fA-F0-9]{64}$/;
