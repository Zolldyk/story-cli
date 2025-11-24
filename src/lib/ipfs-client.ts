/**
 * IPFS Client - Facade for Pinata SDK to handle metadata uploads
 * Source: architecture/components.md#Component: IPFS Client (IPFSClient)
 */

import { ConfigManager } from './config-manager.js';
import { APIError, ConfigError } from '../types/errors.js';
import { IPMetadata } from '../types/metadata.js';

/**
 * Timeout for IPFS upload operations (30 seconds)
 * Source: architecture/coding-standards.md#Critical Rules
 */
const UPLOAD_TIMEOUT_MS = 30000;

/**
 * Type for Pinata client instance
 */
type PinataClient = {
  pinJSONToIPFS: (body: unknown) => Promise<{ IpfsHash: string }>;
  testAuthentication: () => Promise<unknown>;
};

/**
 * Singleton IPFSClient for handling IPFS metadata uploads via Pinata
 */
export class IPFSClient {
  private static instance: IPFSClient;
  private pinata: PinataClient | null = null;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Get singleton instance of IPFSClient
   */
  public static getInstance(): IPFSClient {
    if (!IPFSClient.instance) {
      IPFSClient.instance = new IPFSClient();
    }
    return IPFSClient.instance;
  }

  /**
   * Reset singleton instance (for testing only)
   * @internal
   */
  public static resetInstance(): void {
    if (IPFSClient.instance) {
      IPFSClient.instance.pinata = null;
    }
  }

  /**
   * Initialize Pinata SDK with API credentials from ConfigManager
   * @throws {ConfigError} If API credentials are missing
   */
  private async initializePinata(): Promise<PinataClient> {
    if (this.pinata) {
      return this.pinata;
    }

    const configManager = ConfigManager.getInstance();
    const apiKey = configManager.get('pinataApiKey');
    const apiSecret = configManager.get('pinataApiSecret');

    if (!apiKey) {
      throw new ConfigError(ConfigError.formatConfigErrorMessage('pinataApiKey'));
    }

    if (!apiSecret) {
      throw new ConfigError(ConfigError.formatConfigErrorMessage('pinataApiSecret'));
    }

    // SECURITY: Never log API keys
    // Source: architecture/coding-standards.md#Critical Rules
    // Dynamic import to work around CJS/ESM interop issues
    const pinataModule = await import('@pinata/sdk');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pinataSDK = (pinataModule.default || pinataModule) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.pinata = new pinataSDK(apiKey, apiSecret) as any as PinataClient;
    return this.pinata;
  }

  /**
   * Upload metadata JSON to IPFS via Pinata
   * Includes timeout protection and user-friendly error handling
   *
   * @param metadata - IPMetadata object to upload
   * @returns IPFS hash (e.g., "QmXXX...ABC")
   * @throws {APIError} If upload fails or times out
   * @throws {ConfigError} If API credentials are missing
   */
  public async uploadMetadata(metadata: IPMetadata): Promise<string> {
    const pinata = await this.initializePinata();

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('UPLOAD_TIMEOUT'));
        }, UPLOAD_TIMEOUT_MS);
      });

      // Race between upload and timeout
      const uploadPromise = pinata.pinJSONToIPFS(metadata);

      const result = await Promise.race([uploadPromise, timeoutPromise]);

      return result.IpfsHash;
    } catch (error) {
      // SECURITY: Ensure error messages don't expose API keys
      // Source: architecture/coding-standards.md#Critical Rules
      const errorMessage = (error as Error).message;

      // Handle timeout
      if (errorMessage === 'UPLOAD_TIMEOUT') {
        throw APIError.uploadFailed('IPFS', 'Upload timed out after 30 seconds');
      }

      // Handle rate limiting (429)
      if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('rate limit')) {
        throw APIError.uploadFailed('IPFS', 'Rate limit exceeded. Try again in 60 seconds');
      }

      // Handle authentication failures (401)
      if (errorMessage.includes('401') || errorMessage.toLowerCase().includes('unauthorized')) {
        throw APIError.uploadFailed('IPFS', 'Authentication failed. Check your Pinata API credentials');
      }

      // Handle network errors
      if (errorMessage.includes('ETIMEDOUT') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND')) {
        throw APIError.uploadFailed('IPFS', 'Network error. Check your internet connection');
      }

      // Generic error fallback
      throw APIError.uploadFailed('IPFS', `Upload failed: ${errorMessage}`);
    }
  }

  /**
   * Get IPFS gateway URL for a given IPFS hash
   * Returns Pinata gateway URL for accessing the content
   *
   * @param ipfsHash - IPFS hash (e.g., "QmXXX...")
   * @returns IPFS gateway URL
   */
  public getPinataUrl(ipfsHash: string): string {
    // Remove ipfs:// prefix if present
    const cleanHash = ipfsHash.replace(/^ipfs:\/\//, '');
    return `https://gateway.pinata.cloud/ipfs/${cleanHash}`;
  }
}
