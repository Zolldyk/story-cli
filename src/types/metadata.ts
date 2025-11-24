/**
 * Metadata types for Story CLI
 * Source: architecture/data-models.md#Model: IPMetadata
 */

/**
 * IPMetadata interface for IP asset metadata stored on IPFS
 * Defines the structure of metadata uploaded to IPFS for IP registration
 */
export interface IPMetadata {
  /**
   * IP asset name (required)
   * User-provided name for the IP asset
   */
  name: string;

  /**
   * Detailed description (optional)
   * Extended information about the IP asset
   */
  description?: string;

  /**
   * Wallet address of the creator (required)
   * Ethereum address of the IP asset creator
   */
  creator: string;

  /**
   * ISO 8601 timestamp (required)
   * Creation timestamp in ISO format (e.g., "2025-01-15T12:00:00.000Z")
   */
  createdAt: string;

  /**
   * IPFS hash of associated image (optional)
   * Hash of an image file already uploaded to IPFS
   * Format: QmXXX... or ipfs://QmXXX...
   */
  ipfsImageHash?: string;

  /**
   * Original file path from command argument (optional)
   * Local filesystem path to the source file being registered
   */
  sourceFilePath?: string;

  /**
   * File size in bytes (optional)
   * Size of the source file from fs.statSync
   */
  sourceFileSize?: number;

  /**
   * Future extensibility (optional)
   * Arbitrary custom metadata fields for future use
   */
  customAttributes?: Record<string, unknown>;
}
