/**
 * Register command implementation
 * Orchestrates the interactive IP registration workflow
 * Source: architecture/components.md#Component: Register Command Handler
 */

import { Command } from 'commander';
import { existsSync, accessSync, constants, statSync } from 'fs';
import inquirer from 'inquirer';
import { TerminalUI } from '../lib/terminal-ui.js';
import { ValidationError, EXIT_CODE_SUCCESS, APIError, ConfigError } from '../types/errors.js';
import { WizardAnswers, LicenseConfig } from '../types/license.js';
import { IPMetadata } from '../types/metadata.js';
import { mapAnswersToLicenseConfig, getLicenseSummary } from '../lib/license-mapper.js';
import { DEFAULT_ROYALTY_PERCENTAGE } from '../constants/license-types.js';
import { validateMetadataName, validateIPFSHash } from '../lib/validation.js';
import { ConfigManager } from '../lib/config-manager.js';
import { IPFSClient } from '../lib/ipfs-client.js';
import { StoryClient } from '../lib/story-client.js';
import { MIN_GAS_BALANCE, NETWORKS } from '../constants/networks.js';
import { RegisteredIPAsset } from '../types/ip-asset.js';
import { promises as fs } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { NetworkError, TransactionError } from '../types/errors.js';

/**
 * Run interactive license wizard
 * Source: architecture/core-workflows.md#Workflow 1: IP Registration
 *
 * Prompts user through 3-stage license selection flow:
 * 1. Commercial use prompt
 * 2. Derivatives prompt
 * 3. Royalty percentage prompt (conditional)
 *
 * @returns License configuration object
 */
async function runLicenseWizard(): Promise<LicenseConfig> {
  // Stage 1: Commercial use prompt (AC: 3)
  TerminalUI.info('\nCommercial use allows others to use this IP in profit-making products');
  const commercialUseAnswer = await inquirer.prompt<{ commercialUse: boolean }>([
    {
      type: 'confirm',
      name: 'commercialUse',
      message: 'Is this for commercial use?',
      default: false,
    },
  ]);

  // Stage 2: Derivatives prompt (AC: 4)
  TerminalUI.info('\nDerivatives allow others to build upon or modify your IP');
  const derivativesAnswer = await inquirer.prompt<{ derivativesAllowed: boolean }>([
    {
      type: 'confirm',
      name: 'derivativesAllowed',
      message: 'Allow derivatives/remixes?',
      default: false,
    },
  ]);

  // Combine answers so far
  const answers: WizardAnswers = {
    commercialUse: commercialUseAnswer.commercialUse,
    derivativesAllowed: derivativesAnswer.derivativesAllowed,
  };

  // Stage 3: Conditional royalty percentage prompt (AC: 5, 9)
  if (answers.commercialUse && answers.derivativesAllowed) {
    TerminalUI.info(
      '\nRoyalty percentage you\'ll earn when derivatives are used commercially'
    );
    const royaltyAnswer = await inquirer.prompt<{ royaltyPercentage: number }>([
      {
        type: 'number',
        name: 'royaltyPercentage',
        message: 'Commercial revenue share percentage?',
        default: DEFAULT_ROYALTY_PERCENTAGE,
        validate: (value: number): boolean | string => {
          if (value < 0 || value > 100) {
            return 'Royalty percentage must be between 0 and 100';
          }
          if (!Number.isInteger(value)) {
            return 'Royalty percentage must be a whole number';
          }
          return true;
        },
      },
    ]);
    answers.royaltyPercentage = royaltyAnswer.royaltyPercentage;
  }

  // Map answers to license configuration (AC: 6)
  const licenseConfig = mapAnswersToLicenseConfig(answers);

  return licenseConfig;
}

/**
 * Validate file path before prompts begin
 * Source: architecture/security.md#Input Validation
 *
 * @param filePath - File path to validate
 * @throws ValidationError if file doesn't exist or is not readable
 */
function validateFilePath(filePath: string): void {
  // Check if file exists (AC: 2)
  if (!existsSync(filePath)) {
    throw new ValidationError(
      `File not found: ${filePath}. Please provide a valid file path.`
    );
  }

  // Check if file is readable (AC: 2)
  try {
    accessSync(filePath, constants.R_OK);
  } catch {
    throw new ValidationError(
      `File exists but is not readable: ${filePath}. Check file permissions.`
    );
  }
}

/**
 * Display file information after validation
 * Source: Epic 1 Story 1.5 AC2
 *
 * @param filePath - File path to display information for
 */
function displayFileInfo(filePath: string): void {
  const stats = statSync(filePath);
  const fileName = filePath.split('/').pop() ?? filePath;
  const fileSize = formatFileSize(stats.size);

  TerminalUI.info(`\nRegistering: ${fileName} (${fileSize})`);
}

/**
 * Format file size in human-readable format
 *
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Prompt user for metadata information
 * Source: Story 1.6 Tasks 5 & 6
 *
 * Collects: name (required), description (optional), ipfsImageHash (optional)
 * Adds: creator (from config), createdAt (timestamp), sourceFilePath, sourceFileSize
 *
 * @param filePath - Path to the file being registered
 * @returns Populated IPMetadata object
 * @throws ConfigError if wallet address not configured
 */
async function promptForMetadata(filePath: string): Promise<IPMetadata> {
  TerminalUI.info('\n📝 IP Asset Metadata');

  // Prompt for metadata fields (AC: 3)
  const answers = await inquirer.prompt<{
    name: string;
    description: string;
    ipfsImageHash: string;
  }>([
    {
      type: 'input',
      name: 'name',
      message: 'IP asset name:',
      validate: (input: string): boolean | string => {
        try {
          validateMetadataName(input);
          return true;
        } catch (error) {
          return (error as Error).message;
        }
      },
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description (optional):',
      default: '',
    },
    {
      type: 'input',
      name: 'ipfsImageHash',
      message: 'Image IPFS hash (optional, press Enter to skip):',
      default: '',
      validate: (input: string): boolean | string => {
        try {
          validateIPFSHash(input);
          return true;
        } catch (error) {
          return (error as Error).message;
        }
      },
    },
  ]);

  // Get file stats (AC: 5)
  const stats = statSync(filePath);

  // Get wallet address from config (AC: 5)
  const configManager = ConfigManager.getInstance();
  const creator = configManager.get('walletAddress');

  if (!creator) {
    throw new ConfigError(
      'Wallet address not configured.\nRun `story config set walletAddress YOUR_ADDRESS` to set it.'
    );
  }

  // Construct IPMetadata object (AC: 5)
  const metadata: IPMetadata = {
    name: answers.name.trim(),
    creator,
    createdAt: new Date().toISOString(),
    sourceFilePath: filePath,
    sourceFileSize: stats.size,
  };

  // Add optional fields if provided
  if (answers.description && answers.description.trim().length > 0) {
    metadata.description = answers.description.trim();
  }

  if (answers.ipfsImageHash && answers.ipfsImageHash.trim().length > 0) {
    metadata.ipfsImageHash = answers.ipfsImageHash.trim();
  }

  return metadata;
}

/**
 * Preview metadata and ask for confirmation
 * Source: Story 1.6 Task 7
 *
 * @param metadata - Metadata object to preview
 * @returns true if user confirms, false if cancelled
 */
async function previewAndConfirmMetadata(metadata: IPMetadata): Promise<boolean> {
  // Format metadata as pretty JSON (AC: 10)
  const formattedJson = JSON.stringify(metadata, null, 2);

  // Display in bordered box (AC: 10)
  TerminalUI.box('Metadata Preview', formattedJson);

  // Confirmation prompt (AC: 10)
  const answer = await inquirer.prompt<{ proceed: boolean }>([
    {
      type: 'confirm',
      name: 'proceed',
      message: 'Proceed with metadata upload?',
      default: true,
    },
  ]);

  if (!answer.proceed) {
    TerminalUI.info('Metadata upload cancelled.');
    return false;
  }

  return true;
}

/**
 * Maximum number of retry attempts for IPFS upload
 * Source: Story 1.6 Task 9
 */
const MAX_UPLOAD_RETRIES = 3;

/**
 * Display pre-transaction summary with confirmation prompt
 * Source: Story 1.7 Task 4
 *
 * @param license - License configuration
 * @param metadataHash - IPFS metadata hash
 * @param network - Target network (testnet or mainnet)
 * @returns true if user confirms, false if cancelled
 */
async function displayTransactionSummary(
  license: LicenseConfig,
  metadataHash: string,
  network: string,
  showFullIds: boolean = false
): Promise<boolean> {
  // Truncate metadata hash for display using TerminalUI (Story 2.5 AC 7)
  const truncatedHash = TerminalUI.truncateHash(metadataHash, showFullIds);

  // Build summary content with network badge (Story 2.5 AC 9)
  const networkBadge = TerminalUI.networkBadge(network);
  const summaryLines: string[] = [
    `Network: ${networkBadge}`,
    '',
    `License Type: ${license.type}`,
    `Commercial Use: ${license.commercialUse ? 'Yes' : 'No'}`,
    `Derivatives Allowed: ${license.derivativesAllowed ? 'Yes' : 'No'}`,
  ];

  // Add royalty percentage if applicable (AC: 6)
  if (license.royaltyPercentage !== undefined) {
    summaryLines.push(`Royalty Percentage: ${license.royaltyPercentage}%`);
  }

  summaryLines.push(
    `Metadata Hash: ${truncatedHash}`,
    `Estimated Gas Cost: ~${MIN_GAS_BALANCE} ETH`
  );

  const summaryContent = summaryLines.join('\n');

  // Display bordered summary (AC: 5)
  TerminalUI.box('Transaction Summary', summaryContent);

  // Confirmation prompt (AC: 7)
  const answer = await inquirer.prompt<{ proceed: boolean }>([
    {
      type: 'confirm',
      name: 'proceed',
      message: 'Proceed with transaction?',
      default: true,
    },
  ]);

  return answer.proceed;
}

/**
 * Display success message with Boxen
 * Source: Story 1.7 Task 6, Story 2.5 AC 5, 7
 *
 * @param result - RegisteredIPAsset with all transaction details
 * @param showFullIds - If true, display full IDs without truncation
 */
function displaySuccessMessage(result: RegisteredIPAsset, showFullIds: boolean = false): void {
  // Build success message content (AC: 5, 6, 7, 8)
  const lines: string[] = [
    '',
    'Your IP ID:',
    TerminalUI.truncateHash(result.ipId, showFullIds),
    '',
    'Transaction Hash:',
    TerminalUI.truncateHash(result.transactionHash, showFullIds),
    '',
    'View on Explorer:',
    result.explorerUrl,
    '',
    'IPFS Metadata:',
    `https://gateway.pinata.cloud/ipfs/${TerminalUI.truncateHash(result.metadataHash, showFullIds)}`,
    '',
    "Next: Run `story portfolio` to visualize your IP assets",
    '',
  ];

  const content = lines.join('\n');

  // Display with majorSuccess for celebration (Story 2.5 AC 5, 6)
  TerminalUI.majorSuccess('IP Registration Successful!', content);
}

/**
 * Save registration data to cache file for portfolio command
 * Source: Story 1.7 Task 8
 *
 * @param result - RegisteredIPAsset to cache
 */
async function saveToCache(result: RegisteredIPAsset): Promise<void> {
  try {
    const cacheFilePath = join(homedir(), '.storyrc-cache.json');

    // Structure for cache file (AC: 10)
    interface CacheStructure {
      registrations: RegisteredIPAsset[];
      lastUpdated: string;
    }

    let cacheData: CacheStructure;

    try {
      // Try to read existing cache (AC: 3)
      const existingData = await fs.readFile(cacheFilePath, 'utf-8');
      cacheData = JSON.parse(existingData) as CacheStructure;

      // Validate structure (AC: 4, 5)
      if (!cacheData.registrations || !Array.isArray(cacheData.registrations)) {
        throw new Error('Invalid cache structure');
      }
    } catch (error) {
      // File doesn't exist or is invalid - create new structure (AC: 4, 5, 6)
      if (error instanceof Error && error.message !== 'Invalid cache structure') {
        // Log warning for corrupted file but continue
        TerminalUI.warning('Cache file not found or corrupted, creating new one');
      }

      cacheData = {
        registrations: [],
        lastUpdated: new Date().toISOString(),
      };
    }

    // Append new registration (AC: 7)
    cacheData.registrations.push(result);
    cacheData.lastUpdated = new Date().toISOString();

    // Write to file with proper permissions (AC: 8, 10)
    await fs.writeFile(cacheFilePath, JSON.stringify(cacheData, null, 2), {
      mode: 0o600, // Owner read/write only (AC: 10)
    });
  } catch (error) {
    // Non-critical failure - log but don't fail registration (AC: 9)
    TerminalUI.warning(
      `Failed to cache registration data: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Upload metadata to IPFS with progress spinner and retry logic
 * Source: Story 1.6 Tasks 8 & 9
 *
 * @param metadata - Metadata object to upload
 * @param retryCount - Current retry attempt (default: 0)
 * @returns IPFS hash
 * @throws APIError if upload fails after max retries
 */
async function uploadMetadataToIPFS(
  metadata: IPMetadata,
  retryCount: number = 0
): Promise<string> {
  const ipfsClient = IPFSClient.getInstance();

  // Create processing spinner with gear emoji (Story 2.5 AC 6)
  const spinner = TerminalUI.processing('Uploading metadata to IPFS...');

  try {
    // Upload to IPFS (AC: 6)
    const ipfsHash = await ipfsClient.uploadMetadata(metadata);

    // Success message (AC: 7)
    spinner.succeed(`Metadata uploaded to IPFS: ${ipfsHash}`);

    return ipfsHash;
  } catch (error) {
    // Stop spinner before showing error (coding standards)
    spinner.fail('IPFS upload failed');

    // Handle upload failure (AC: 8)
    if (error instanceof APIError) {
      // Display three-part error message (AC: 8)
      TerminalUI.error(error.message);

      // Offer fallback options (AC: 9)
      const fallbackAnswer = await inquirer.prompt<{ fallbackChoice: string }>([
        {
          type: 'input',
          name: 'fallbackChoice',
          message: 'Enter IPFS hash (or press Enter to retry):',
          default: '',
        },
      ]);

      // User provided manual hash
      if (fallbackAnswer.fallbackChoice.trim().length > 0) {
        const manualHash = fallbackAnswer.fallbackChoice.trim();
        // Validate the provided hash
        validateIPFSHash(manualHash);
        TerminalUI.success(`Using provided IPFS hash: ${manualHash}`);
        return manualHash;
      }

      // User wants to retry
      if (retryCount < MAX_UPLOAD_RETRIES - 1) {
        // Exponential backoff: wait before retry (AC: 9)
        const backoffMs = Math.pow(2, retryCount) * 1000;
        TerminalUI.info(`Retrying in ${backoffMs / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));

        // Recursive retry
        return uploadMetadataToIPFS(metadata, retryCount + 1);
      }

      // Max retries exceeded (AC: 9)
      throw new APIError(
        `IPFS upload failed after ${MAX_UPLOAD_RETRIES} attempts.\nPlease try again later or upload metadata manually.`
      );
    }

    // Rethrow unexpected errors
    throw error;
  }
}

/**
 * Register command handler
 * Source: architecture/components.md#Component: Register Command Handler
 *
 * @param filePath - Path to the file to register
 * @param options - Command options including optional metadataHash and showFullIds
 * @returns Promise that resolves when registration is complete
 */
async function registerCommand(
  filePath: string,
  options: { metadataHash?: string; showFullIds?: boolean }
): Promise<void> {
  // Record start time for execution tracking (Story 2.5 AC 8)
  const startTime = performance.now();

  // Step 1: Validate file path before prompts (AC: 2)
  validateFilePath(filePath);

  // Get network for badge display (Story 2.5 AC 9)
  const configManager = ConfigManager.getInstance();
  const network = configManager.get('network') || 'testnet';
  const networkBadge = TerminalUI.networkBadge(network);

  // Display network badge at start of output (Story 2.5 AC 9)
  TerminalUI.info(`${networkBadge} Starting IP registration`);

  // Step 2: Display file information
  displayFileInfo(filePath);

  // Step 3: Run license wizard (AC: 3, 4, 5)
  const licenseConfig = await runLicenseWizard();

  // Step 4: Display license summary (AC: 7)
  const summary = getLicenseSummary(licenseConfig);
  TerminalUI.info(`\nYou've selected: ${summary}`);

  // Step 5: Final confirmation (AC: 8)
  const confirmAnswer = await inquirer.prompt<{ proceed: boolean }>([
    {
      type: 'confirm',
      name: 'proceed',
      message: 'Proceed with registration?',
      default: true,
    },
  ]);

  // Step 6: Handle cancellation
  if (!confirmAnswer.proceed) {
    TerminalUI.info('Registration cancelled.');
    // Exit directly with success code (bypasses error handler intentionally)
    // Rationale: User-initiated cancellation is not an error condition
    process.exit(EXIT_CODE_SUCCESS);
  }

  // Step 7: Metadata workflow (Story 1.6)
  let ipfsHash: string;

  if (options.metadataHash) {
    // AC: 9 - Use provided metadata hash (skip prompts and upload)
    validateIPFSHash(options.metadataHash);
    ipfsHash = options.metadataHash;
    TerminalUI.success(`Using provided metadata hash: ${ipfsHash}`);
  } else {
    // AC: 3-8 - Full metadata workflow
    // Step 7a: Prompt for metadata
    const metadata = await promptForMetadata(filePath);

    // Step 7b: Preview and confirm
    const confirmed = await previewAndConfirmMetadata(metadata);

    if (!confirmed) {
      // User cancelled at metadata confirmation
      process.exit(EXIT_CODE_SUCCESS);
    }

    // Step 7c: Upload metadata to IPFS
    ipfsHash = await uploadMetadataToIPFS(metadata);
  }

  // Step 8: Transaction execution (Story 1.7 scope)
  // Step 8a: Display transaction summary (Task 4)
  const summaryConfirmed = await displayTransactionSummary(
    licenseConfig,
    ipfsHash,
    network,
    options.showFullIds
  );

  if (!summaryConfirmed) {
    // User cancelled at transaction summary (AC: 8)
    TerminalUI.info('Transaction cancelled.');
    process.exit(EXIT_CODE_SUCCESS);
  }

  // Step 8b: Initialize StoryClient (Task 5)
  const privateKey = process.env.STORY_PRIVATE_KEY;
  if (!privateKey) {
    throw new ConfigError(
      'STORY_PRIVATE_KEY environment variable not set.\nSet your private key: export STORY_PRIVATE_KEY=your_key\nNever commit private keys to version control.'
    );
  }

  const storyClient = new StoryClient({
    privateKey,
    network,
  });

  // Step 8c: Check gas balance (Task 5)
  try {
    const gasCheck = await storyClient.checkSufficientGas();

    if (!gasCheck.sufficient) {
      // Insufficient gas - throw error with testnet faucet URL (AC: 3)
      const faucetUrl = NETWORKS[network as keyof typeof NETWORKS].faucetUrl;
      const what = `Insufficient gas balance: ${gasCheck.balance} ETH`;
      const why = 'Transaction requires gas fees to execute on the blockchain';
      const how = faucetUrl
        ? `For testnet, get free tokens at: ${faucetUrl}`
        : 'Purchase tokens from an exchange to continue';
      throw new NetworkError(`${what}.\n${why}.\n${how}`);
    }
  } catch (error) {
    // Network error during gas check (Task 7)
    if (error instanceof NetworkError) {
      throw error;
    }
    // Unexpected error
    throw new NetworkError(
      'Failed to check gas balance.\nCheck network connectivity.\nTry again in 30 seconds.'
    );
  }

  // Step 8d: Execute transaction with spinner (Task 5, Story 2.5 AC 6, 9)
  // Note: networkBadge already declared at line 518
  const spinner = TerminalUI.processing(
    `Registering IP on Story Protocol ${networkBadge}...`
  );

  try {
    // Call registerIP method (Task 5)
    const result = await storyClient.registerIP(ipfsHash, licenseConfig);

    // Stop spinner on success (Critical Rule #9)
    spinner.succeed('IP registration confirmed on blockchain!');

    // Step 8e: Display success message (Task 6, Story 2.5 AC 7)
    displaySuccessMessage(result, options.showFullIds);

    // Step 8f: Save to cache (Task 8)
    await saveToCache(result);

    // Display execution time (Story 2.5 AC 8)
    console.log(TerminalUI.executionTime(startTime));
  } catch (error) {
    // Stop spinner before displaying error (Critical Rule #9)
    spinner.fail('IP registration failed');

    // Handle transaction errors (Task 7)
    if (error instanceof TransactionError || error instanceof NetworkError) {
      // Display error with IPFS hash for retry (AC: 9)
      TerminalUI.error(error.message);
      TerminalUI.info(
        `\nYour metadata is safely stored at: ${ipfsHash}\nRetry with: story register <file> --metadata-hash ${ipfsHash}`
      );
      throw error;
    }

    // Unexpected error
    throw new TransactionError(
      `Unexpected error during IP registration.\nPlease try again.\nRun with --debug flag for details.`
    );
  }
}

/**
 * Create register command
 * Source: architecture/components.md#Component: Register Command Handler
 *
 * @returns Commander.js command instance
 */
export function createRegisterCommand(): Command {
  const register = new Command('register')
    .description(
      'Register an IP asset on Story Protocol blockchain with interactive license wizard and metadata upload'
    )
    .argument('<file-path>', 'Path to the file to register')
    .option(
      '--metadata-hash <hash>',
      'Pre-uploaded IPFS metadata hash (skips metadata prompts and upload). Use this to retry failed transactions without re-uploading metadata.'
    )
    .option(
      '--show-full-ids',
      'Display full transaction hashes and IP IDs without truncation'
    )
    .addHelpText(
      'after',
      `
Examples:
  $ story register ./my-artwork.jpg
    Register a new IP asset with interactive prompts

  $ story register ./my-song.mp3 --metadata-hash QmXXX...ABC
    Register with pre-uploaded metadata (useful for retry after transaction failure)

  $ story register ./my-artwork.jpg --show-full-ids
    Register and display full transaction hashes without truncation

Environment Variables:
  STORY_PRIVATE_KEY      Private key for transaction signing (required)
  STORY_CLI_MOCK         Set to 'true' for offline testing with mock data
  PINATA_API_KEY         Pinata API key for IPFS uploads
  PINATA_API_SECRET      Pinata API secret for IPFS uploads

Workflow:
  1. Select license terms (commercial use, derivatives, royalty %)
  2. Provide metadata (name, description, image hash)
  3. Upload metadata to IPFS
  4. Review transaction summary
  5. Execute blockchain registration transaction
  6. Receive IP ID and transaction confirmation
`
    )
    .action(registerCommand);

  return register;
}
