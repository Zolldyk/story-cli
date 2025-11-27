/**
 * Story Protocol SDK Client Wrapper
 * Source: architecture/components.md#Component: Story Protocol Client
 */

import { StoryClient as SDK, StoryConfig, PILFlavor, WIP_TOKEN_ADDRESS } from '@story-protocol/core-sdk';
import { http, createPublicClient, PublicClient, defineChain, parseEther } from 'viem';
import { privateKeyToAccount, Account, Address } from 'viem/accounts';
import { NETWORKS, NetworkName, MIN_GAS_BALANCE } from '../constants/networks.js';
import { validatePrivateKey, validateNetwork } from './validation.js';
import { NetworkError, TransactionError, CLIError, APIError } from '../types/errors.js';
import { TerminalUI } from './terminal-ui.js';
import { LicenseConfig } from '../types/license.js';
import { RegisteredIPAsset } from '../types/ip-asset.js';
import { IPAssetWithRelationships } from '../types/portfolio.js';
import { IPMetadata } from '../types/metadata.js';
import { createHash } from 'crypto';
import fetch from 'node-fetch';

/**
 * Configuration for StoryClient initialization
 */
export interface StoryClientConfig {
  privateKey: string;
  network: string;
  rpcUrl?: string;
}

/**
 * StoryClient wrapper for Story Protocol SDK
 * Provides facade methods for IP registration and querying
 * Handles network detection, wallet management, error translation
 * Source: architecture/components.md#Component: Story Protocol Client
 */
export class StoryClient {
  private sdk: SDK;
  private account: Account;
  private networkName: NetworkName;
  private rpcUrl: string;
  private publicClient: PublicClient;

  /**
   * Initialize Story Protocol SDK client
   * @param config - Client configuration with privateKey, network, and optional rpcUrl
   * @throws ValidationError if private key or network is invalid
   */
  constructor(config: StoryClientConfig) {
    // Check for mock mode
    if (process.env.STORY_CLI_MOCK === 'true') {
      throw new Error('Mock mode detected - use MockStoryClient instead');
    }

    // Validate inputs
    validatePrivateKey(config.privateKey);
    validateNetwork(config.network);

    this.networkName = config.network as NetworkName;

    // Determine RPC URL (custom or default)
    this.rpcUrl = config.rpcUrl || NETWORKS[this.networkName].rpcUrl;

    // Initialize wallet from private key
    const privateKey = config.privateKey.startsWith('0x')
      ? config.privateKey
      : `0x${config.privateKey}`;
    this.account = privateKeyToAccount(privateKey as Address);

    // Initialize Story Protocol SDK
    const sdkConfig: StoryConfig = {
      account: this.account,
      transport: http(this.rpcUrl),
      chainId: NETWORKS[this.networkName].chainId,
    };

    this.sdk = SDK.newClient(sdkConfig);

    // Define custom chain for public client
    const networkConfig = NETWORKS[this.networkName];
    const chain = defineChain({
      id: networkConfig.viemChainId,
      name: networkConfig.viemChainName,
      nativeCurrency: { name: 'IP', symbol: 'IP', decimals: 18 },
      rpcUrls: {
        default: { http: [this.rpcUrl] },
      },
    });

    // Initialize public client for balance queries
    this.publicClient = createPublicClient({
      chain,
      transport: http(this.rpcUrl),
    });
  }

  /**
   * Get current network name
   * @returns Network name ('testnet' or 'mainnet')
   */
  getNetworkName(): string {
    return this.networkName;
  }

  /**
   * Get current RPC endpoint URL
   * @returns RPC URL
   */
  getRpcUrl(): string {
    return this.rpcUrl;
  }

  /**
   * Get wallet address
   * @returns Ethereum address
   */
  getWalletAddress(): string {
    return this.account.address;
  }

  /**
   * Generate block explorer URL for transaction
   * @param transactionHash - Transaction hash to lookup
   * @returns Block explorer URL
   */
  getExplorerUrl(transactionHash: string): string {
    const baseUrl = NETWORKS[this.networkName].explorerUrl;
    return `${baseUrl}/tx/${transactionHash}`;
  }

  /**
   * Check wallet gas balance
   * @param walletAddress - Wallet address to check
   * @returns Balance in wei as bigint
   * @throws NetworkError if RPC call fails
   */
  async checkGasBalance(walletAddress: string): Promise<bigint> {
    try {
      // Create timeout promise
      const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('RPC timeout')), 10000);
      });

      // Race between balance query and timeout
      const balance = await Promise.race([
        this.publicClient.getBalance({ address: walletAddress as Address }),
        timeout,
      ]);

      return balance;
    } catch (error) {
      if (error instanceof Error && error.message === 'RPC timeout') {
        throw NetworkError.rpcTimeout(this.rpcUrl);
      }
      throw NetworkError.connectionFailed(this.rpcUrl);
    }
  }

  /**
   * Check if wallet has sufficient gas balance for transactions
   * Source: Story 1.7 Task 2
   *
   * @returns Object with sufficient flag and balance in ETH as string
   * @throws NetworkError if RPC call fails
   */
  async checkSufficientGas(): Promise<{ sufficient: boolean; balance: string }> {
    // Get balance in wei
    const balanceWei = await this.checkGasBalance(this.account.address);

    // Convert wei to ETH
    const balanceEth = Number(balanceWei) / 1e18;

    // Check against minimum threshold (AC: 2)
    const sufficient = balanceEth >= MIN_GAS_BALANCE;

    // Return formatted result (AC: 4)
    return {
      sufficient,
      balance: balanceEth.toFixed(6), // 6 decimal places for readability
    };
  }

  /**
   * Display warning if gas balance is insufficient
   * @param balance - Current balance in wei
   * @param network - Network name
   */
  warnInsufficientGas(balance: bigint, network: string): void {
    const balanceInEth = Number(balance) / 1e18;
    const faucetUrl = NETWORKS[network as NetworkName].faucetUrl;

    let message = `⚠️  Insufficient gas balance: ${balanceInEth.toFixed(6)} ETH\n`;
    message += 'Transactions require gas fees.';

    if (faucetUrl) {
      message += `\n\nGet free testnet tokens at: ${faucetUrl}`;
    } else {
      message += '\n\nPurchase tokens from an exchange to continue.';
    }

    TerminalUI.error(message);
  }

  /**
   * Translate SDK errors to user-friendly CLIError types
   * @param error - Original SDK error
   * @returns Translated CLIError
   */
  translateSDKError(error: Error): CLIError {
    const errorMessage = error.message.toLowerCase();

    // Handle insufficient allowance
    if (errorMessage.includes('insufficient allowance')) {
      const what = 'Transaction failed: Insufficient token allowance';
      const why = 'You may need to approve the contract to spend your tokens';
      const how = 'Run the approval transaction first';
      return new TransactionError(`${what}.\n${why}.\n${how}`);
    }

    // Handle nonce errors
    if (errorMessage.includes('nonce too low') || errorMessage.includes('nonce')) {
      const what = 'Transaction failed: Nonce conflict detected';
      const why = 'Another transaction may be pending';
      const how = 'Wait for pending transactions to complete';
      return new TransactionError(`${what}.\n${why}.\n${how}`);
    }

    // Handle RPC timeout/connection errors
    if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('econnrefused') ||
      errorMessage.includes('network')
    ) {
      return NetworkError.rpcTimeout(this.rpcUrl);
    }

    // Handle gas estimation failures
    if (errorMessage.includes('gas') || errorMessage.includes('insufficient funds')) {
      const what = 'Transaction failed: Insufficient gas';
      const why = 'Transaction requires gas fees';
      const how = `For testnet, get free tokens at: ${NETWORKS.testnet.faucetUrl}`;
      return new TransactionError(`${what}.\n${why}.\n${how}`);
    }

    // Default: wrap in generic TransactionError
    const what = `Transaction failed: ${error.message}`;
    const why = 'An unexpected error occurred';
    const how = 'Run with --debug flag for detailed logs';
    return new TransactionError(`${what}.\n${why}.\n${how}`);
  }

  /**
   * Display transaction success with formatted output
   * Infrastructure for future use in Story 1.7
   * @param txHash - Transaction hash
   * @param ipId - IP asset ID
   */
  displayTransactionSuccess(txHash: string, ipId: string): void {
    const explorerUrl = this.getExplorerUrl(txHash);

    const content = [
      `Transaction Hash: ${txHash}`,
      `IP Asset ID: ${ipId}`,
      `View on Explorer: ${explorerUrl}`,
      ``,
      `Estimated confirmation: ~30 seconds`,
    ].join('\n');

    TerminalUI.box('Transaction Successful', content);
  }

  /**
   * Register IP asset on Story Protocol blockchain
   * Source: Story 1.7 Task 1
   *
   * @param metadataHash - IPFS hash of uploaded metadata
   * @param license - License configuration for the IP asset
   * @returns RegisteredIPAsset with transaction details and IP ID
   * @throws TransactionError if registration fails or times out
   * @throws NetworkError if RPC connection fails
   */
  async registerIP(
    metadataHash: string,
    license: LicenseConfig
  ): Promise<RegisteredIPAsset> {
    // Mock mode support (Task 9)
    if (process.env.STORY_CLI_MOCK === 'true') {
      return this.mockRegisterIP(metadataHash, license);
    }

    try {
      // Get SPG NFT contract address from network config
      const spgNftContract = NETWORKS[this.networkName].spgNftContract;

      if (!spgNftContract) {
        throw new TransactionError(
          'SPG NFT contract not configured for this network.\nPlease deploy your own SPG NFT contract for mainnet.\nSee Story Protocol documentation for details.'
        );
      }

      // Create metadata hash (required by new SDK API)
      const ipHash = createHash('sha256')
        .update(metadataHash)
        .digest('hex');

      // Create 60-second timeout promise (AC: 4)
      const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Transaction timeout')), 60000);
      });

      // Build license terms data using new PIL Flavor API
      const licenseTermsData = this.buildLicenseTerms(license);

      // Call Story Protocol SDK to register IP asset
      // Using new registerIpAsset API (replaces deprecated mintAndRegisterIpAssetWithPilTerms)
      const registrationPromise = this.sdk.ipAsset.registerIpAsset({
        nft: {
          type: 'mint',
          spgNftContract: spgNftContract as Address,
        },
        licenseTermsData,
        ipMetadata: {
          ipMetadataURI: `https://ipfs.io/ipfs/${metadataHash}`,
          ipMetadataHash: `0x${ipHash}` as `0x${string}`,
          nftMetadataURI: `https://ipfs.io/ipfs/${metadataHash}`,
          nftMetadataHash: `0x${ipHash}` as `0x${string}`,
        },
      });

      // Race between registration and timeout (AC: 4)
      const response = await Promise.race([registrationPromise, timeout]);

      // Extract transaction details from response
      const txHash = response.txHash as string;
      const ipId = response.ipId as string;

      // Wait for transaction confirmation to get block number
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: txHash as Address,
        timeout: 60000,
      });

      // Construct RegisteredIPAsset object (AC: 7)
      const registeredAsset: RegisteredIPAsset = {
        ipId,
        transactionHash: txHash,
        blockNumber: Number(receipt.blockNumber),
        metadataHash,
        licenseConfig: license,
        owner: this.account.address,
        timestamp: new Date().toISOString(),
        explorerUrl: this.getExplorerUrl(txHash),
      };

      return registeredAsset;
    } catch (error) {
      // Handle timeout errors (AC: 4)
      if (error instanceof Error && error.message === 'Transaction timeout') {
        const what = 'Transaction timed out after 60 seconds';
        const why = 'Blockchain confirmation took longer than expected';
        const how = 'Check network connectivity or try again';
        throw new TransactionError(`${what}.\n${why}.\n${how}`);
      }

      // Translate SDK errors to user-friendly messages (AC: 7)
      if (error instanceof Error) {
        throw this.translateSDKError(error);
      }

      // Unexpected error type
      throw new TransactionError(
        'Unexpected error during IP registration.\nPlease try again.\nRun with --debug flag for details.'
      );
    }
  }

  /**
   * Mock implementation of registerIP for offline testing
   * Source: Story 1.7 Task 9
   *
   * @param metadataHash - IPFS hash of uploaded metadata
   * @param license - License configuration for the IP asset
   * @returns Mock RegisteredIPAsset with deterministic test data
   */
  private async mockRegisterIP(
    metadataHash: string,
    license: LicenseConfig
  ): Promise<RegisteredIPAsset> {
    // Simulate blockchain confirmation delay (AC: 3)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock transaction hash (AC: 2)
    const mockTxHash =
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

    // Mock IP ID (AC: 2)
    const mockIpId = '0x1234567890abcdef1234567890abcdef12345678';

    // Mock block number (AC: 2)
    const mockBlockNumber = 12345;

    // Construct mock RegisteredIPAsset (AC: 2)
    const mockAsset: RegisteredIPAsset = {
      ipId: mockIpId,
      transactionHash: mockTxHash,
      blockNumber: mockBlockNumber,
      metadataHash,
      licenseConfig: license,
      owner: this.account.address,
      timestamp: new Date().toISOString(),
      explorerUrl: this.getExplorerUrl(mockTxHash),
    };

    return mockAsset;
  }

  /**
   * Build license terms data from license configuration
   * Maps LicenseConfig to Story Protocol PIL Flavor terms
   *
   * @param license - License configuration
   * @returns License terms data array for SDK
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildLicenseTerms(license: LicenseConfig): Array<{ terms: any }> {
    // Map license configuration to PIL Flavor
    // Non-commercial social remixing
    if (!license.commercialUse && license.derivativesAllowed) {
      return [
        {
          terms: PILFlavor.nonCommercialSocialRemixing(),
        },
      ];
    }

    // Commercial use without derivatives
    if (license.commercialUse && !license.derivativesAllowed) {
      return [
        {
          terms: PILFlavor.commercialUse({
            defaultMintingFee: parseEther('0'), // Free minting by default
            currency: WIP_TOKEN_ADDRESS as Address,
          }),
        },
      ];
    }

    // Commercial remix
    if (license.commercialUse && license.derivativesAllowed) {
      return [
        {
          terms: PILFlavor.commercialRemix({
            commercialRevShare: license.royaltyPercentage || 0,
            defaultMintingFee: parseEther('0'), // Free minting by default
            currency: WIP_TOKEN_ADDRESS as Address,
          }),
        },
      ];
    }

    // Default: non-commercial only (no derivatives)
    return [];
  }

  /**
   * Get SDK client for direct access (if needed)
   * @returns Story Protocol SDK client instance
   */
  getSDK(): SDK {
    return this.sdk;
  }

  /**
   * Query IP assets by wallet address from Story Protocol REST API
   * Task 4: AC 2, 3, 9
   * Source: https://docs.story.foundation - Protocol API Overview
   *
   * Uses the official Story Protocol API with public API keys.
   * No manual configuration required - endpoints and keys are built-in.
   *
   * @param walletAddress - Owner wallet address to query
   * @returns Array of IP assets with relationship data
   * @throws NetworkError if API is unreachable
   * @throws APIError if API returns error response
   */
  async queryIPAssets(
    walletAddress: string
  ): Promise<IPAssetWithRelationships[]> {
    // Get Story Protocol API config for current network
    const networkConfig = NETWORKS[this.networkName];
    const apiUrl = networkConfig.storyApiUrl;
    const apiKey = networkConfig.storyApiKey;

    try {
      // Create 30-second timeout promise (AC: timeout protection)
      const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('API timeout')), 30000);
      });

      // Fetch IP assets from Story Protocol REST API
      // POST /assets with ownerAddress filter
      const assetsPromise = fetch(`${apiUrl}/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
        },
        body: JSON.stringify({
          where: {
            ownerAddress: walletAddress.toLowerCase(),
          },
          includeLicenses: true,
          pagination: {
            limit: 200,
            offset: 0,
          },
        }),
      });

      const response = await Promise.race([assetsPromise, timeout]);

      // Check response status
      if (!response.ok) {
        const errorText = await response.text();
        throw new APIError(
          `Story Protocol API returned error ${response.status}: ${errorText}`
        );
      }

      // Parse JSON response
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (await response.json()) as any;

      // Handle empty result set
      if (!result.data || result.data.length === 0) {
        return [];
      }

      // Fetch edges (parent-child relationships) for these assets
      const ipIds = result.data.map((asset: { ipId: string }) => asset.ipId);
      const edgesMap = await this.fetchAssetEdges(ipIds, apiUrl, apiKey);

      // Transform API response to IPAssetWithRelationships[]
      const assets: IPAssetWithRelationships[] = result.data.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (asset: any) => {
          const assetName =
            asset.title || asset.name || asset.nftMetadata?.name || 'Unnamed Asset';
          const edges = edgesMap.get(asset.ipId) || { parentIpId: undefined, childIpIds: [] };

          return {
            ipId: asset.ipId || '',
            name: assetName,
            metadata: {
              name: assetName,
              description: asset.description || asset.nftMetadata?.description || '',
              creator: walletAddress,
              createdAt: asset.registrationDate || new Date().toISOString(),
            } as IPMetadata,
            licenseType: this.extractLicenseType(asset.licenses),
            createdAt: asset.registrationDate || new Date().toISOString(),
            parentIpId: edges.parentIpId,
            childIpIds: edges.childIpIds,
            derivativeCount: asset.childrenCount || edges.childIpIds.length,
            royaltiesEarned: 0, // Royalty data requires separate API call
            licensesIssued: asset.licenses?.length || 0,
          };
        }
      );

      return assets;
    } catch (error) {
      // Handle timeout errors
      if (error instanceof Error && error.message === 'API timeout') {
        throw NetworkError.rpcTimeout(apiUrl);
      }

      // Handle API errors
      if (error instanceof APIError) {
        throw error;
      }

      // Handle network errors
      if (
        error instanceof Error &&
        (error.message.includes('ECONNREFUSED') ||
          error.message.includes('ENOTFOUND'))
      ) {
        throw NetworkError.connectionFailed(apiUrl);
      }

      // Wrap unexpected errors
      throw new APIError(`Failed to query IP assets: ${(error as Error).message}`);
    }
  }

  /**
   * Fetch parent-child edges for a list of IP asset IDs
   * Uses the /assets/edges endpoint to get derivative relationships
   *
   * @param ipIds - Array of IP asset IDs to fetch edges for
   * @param apiUrl - Story Protocol API URL
   * @param apiKey - Story Protocol API key
   * @returns Map of ipId to { parentIpId, childIpIds }
   */
  private async fetchAssetEdges(
    ipIds: string[],
    apiUrl: string,
    apiKey: string
  ): Promise<Map<string, { parentIpId?: string; childIpIds: string[] }>> {
    const edgesMap = new Map<string, { parentIpId?: string; childIpIds: string[] }>();

    // Initialize map with empty values for all IPs
    for (const ipId of ipIds) {
      edgesMap.set(ipId, { parentIpId: undefined, childIpIds: [] });
    }

    try {
      // Fetch edges where these IPs are children (to get parentIpId)
      // and where these IPs are parents (to get childIpIds)
      // We'll do this by querying all edges and filtering
      const response = await fetch(`${apiUrl}/assets/edges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
        },
        body: JSON.stringify({
          pagination: {
            limit: 200,
            offset: 0,
          },
        }),
      });

      if (!response.ok) {
        TerminalUI.debug(`Failed to fetch edges: ${response.status}`);
        return edgesMap;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (await response.json()) as any;

      if (!result.data) {
        return edgesMap;
      }

      // Process edges to build parent-child relationships
      for (const edge of result.data) {
        const parentIpId = edge.parentIpId;
        const childIpId = edge.childIpId;

        // If child is in our IP list, set its parent
        if (ipIds.includes(childIpId)) {
          const existing = edgesMap.get(childIpId)!;
          existing.parentIpId = parentIpId;
        }

        // If parent is in our IP list, add child to its childIpIds
        if (ipIds.includes(parentIpId)) {
          const existing = edgesMap.get(parentIpId)!;
          if (!existing.childIpIds.includes(childIpId)) {
            existing.childIpIds.push(childIpId);
          }
        }
      }

      return edgesMap;
    } catch (error) {
      TerminalUI.debug(`Error fetching edges: ${(error as Error).message}`);
      return edgesMap;
    }
  }

  /**
   * Extract license type from licenses array
   *
   * @param licenses - Array of license objects from API
   * @returns License type string
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractLicenseType(licenses: any[] | undefined): string {
    if (!licenses || licenses.length === 0) {
      return 'unknown';
    }

    const license = licenses[0];
    const terms = license.terms;

    if (!terms) {
      return license.templateName || 'unknown';
    }

    // Determine license type based on terms
    if (terms.commercialUse && terms.derivativesAllowed) {
      return 'commercial-remix';
    } else if (terms.commercialUse) {
      return 'commercial-use';
    } else if (terms.derivativesAllowed) {
      return 'non-commercial-social-remixing';
    } else {
      return 'non-commercial';
    }
  }
}
