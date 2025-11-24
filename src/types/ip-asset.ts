/**
 * IP Asset types for Story CLI
 * Source: architecture/data-models.md#RegisteredIPAsset
 */

import { LicenseConfig } from './license.js';

/**
 * RegisteredIPAsset interface for successfully registered IP assets
 * Contains all information about a registered IP asset on the blockchain
 */
export interface RegisteredIPAsset {
  /**
   * Unique IP asset identifier from blockchain
   * Full address (not truncated) for copy-paste
   */
  ipId: string;

  /**
   * Blockchain transaction hash
   * Full hash (not truncated) for verification
   */
  transactionHash: string;

  /**
   * Block number where transaction was confirmed
   */
  blockNumber: number;

  /**
   * IPFS hash of uploaded metadata
   */
  metadataHash: string;

  /**
   * License terms applied to the IP asset
   */
  licenseConfig: LicenseConfig;

  /**
   * Wallet address of IP owner
   */
  owner: string;

  /**
   * ISO 8601 registration timestamp
   */
  timestamp: string;

  /**
   * Block explorer link for transaction
   */
  explorerUrl: string;
}
