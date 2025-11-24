/**
 * Configuration Manager - Singleton for managing CLI config file
 * Source: architecture/components.md#Component: Configuration Manager
 */

import fs from 'fs/promises';
import { existsSync } from 'fs';
import inquirer from 'inquirer';
import { CLIConfig, isCLIConfig, Network } from '../types/config.js';
import { ConfigError } from '../types/errors.js';
import { TerminalUI } from './terminal-ui.js';
import {
  CONFIG_FILE_PATH,
  CONFIG_FILE_PERMISSIONS,
  ENV_VAR_NAMES,
  DEFAULT_RPC_URLS,
  REQUIRED_CONFIG_FIELDS,
} from '../constants/config.js';
import { isValidWalletAddress, isValidHttpUrl } from './validation.js';

/**
 * Singleton ConfigManager for handling configuration file operations
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: CLIConfig | null = null;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Reset singleton instance (for testing only)
   * @internal
   */
  public static resetInstance(): void {
    if (ConfigManager.instance) {
      ConfigManager.instance.config = null;
    }
  }

  /**
   * Get singleton instance of ConfigManager
   */
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Load configuration from ~/.storyrc file
   * Returns empty config with default network if file doesn't exist
   *
   * @throws {ConfigError} If config file is malformed or has permission issues
   */
  public async load(): Promise<CLIConfig> {
    try {
      // Check if config file exists
      if (!existsSync(CONFIG_FILE_PATH)) {
        // Return minimal config with default network
        this.config = { network: 'testnet' };
        return this.config;
      }

      // Read config file
      const fileContent = await fs.readFile(CONFIG_FILE_PATH, 'utf-8');

      // Parse JSON
      let parsedConfig: unknown;
      try {
        parsedConfig = JSON.parse(fileContent);
      } catch (error) {
        throw new ConfigError(
          `Configuration file is malformed.\nThe file at ${CONFIG_FILE_PATH} contains invalid JSON.\nPlease fix the JSON syntax or delete the file to start fresh.`
        );
      }

      // Validate config structure
      if (!isCLIConfig(parsedConfig)) {
        throw new ConfigError(
          `Configuration file has invalid structure.\nThe file at ${CONFIG_FILE_PATH} does not match the expected schema.\nRun \`story config path\` to locate the file and verify its contents.`
        );
      }

      this.config = parsedConfig;
      return this.config;
    } catch (error) {
      if (error instanceof ConfigError) {
        throw error;
      }

      // Handle file system errors
      throw new ConfigError(
        `Failed to read configuration file.\nUnable to access ${CONFIG_FILE_PATH}.\nError: ${(error as Error).message}`
      );
    }
  }

  /**
   * Save configuration to ~/.storyrc file with 600 permissions
   *
   * @param config - Configuration object to save
   * @throws {ConfigError} If unable to write config file
   */
  public async save(config: CLIConfig): Promise<void> {
    try {
      // Validate config structure before saving
      if (!isCLIConfig(config)) {
        throw new ConfigError(
          'Invalid configuration structure.\nCannot save malformed config object.'
        );
      }

      // Write config file
      const jsonContent = JSON.stringify(config, null, 2);
      await fs.writeFile(CONFIG_FILE_PATH, jsonContent, { mode: CONFIG_FILE_PERMISSIONS });

      // Explicitly set permissions (redundant but ensures security)
      await fs.chmod(CONFIG_FILE_PATH, CONFIG_FILE_PERMISSIONS);

      this.config = config;
    } catch (error) {
      if (error instanceof ConfigError) {
        throw error;
      }

      throw new ConfigError(
        `Failed to save configuration file.\nUnable to write to ${CONFIG_FILE_PATH}.\nError: ${(error as Error).message}`
      );
    }
  }

  /**
   * Get configuration value with environment variable override
   * Environment variables take precedence over config file values
   *
   * @param key - Configuration key to retrieve
   * @returns Configuration value (from env var or config file)
   */
  public get(key: keyof CLIConfig): string | undefined {
    // Check for environment variable override
    if (key === 'walletAddress' && process.env[ENV_VAR_NAMES.walletAddress]) {
      // Note: STORY_PRIVATE_KEY will be used to derive address in future story
      // For now, return the env var value directly
      return process.env[ENV_VAR_NAMES.walletAddress];
    }

    if (key === 'pinataApiKey' && process.env[ENV_VAR_NAMES.pinataApiKey]) {
      return process.env[ENV_VAR_NAMES.pinataApiKey];
    }

    if (key === 'pinataApiSecret' && process.env[ENV_VAR_NAMES.pinataApiSecret]) {
      return process.env[ENV_VAR_NAMES.pinataApiSecret];
    }

    if (key === 'rpcUrl' && process.env[ENV_VAR_NAMES.rpcUrl]) {
      return process.env[ENV_VAR_NAMES.rpcUrl];
    }

    // Fall back to config file value
    if (!this.config) {
      return undefined;
    }

    // Handle special case for rpcUrl: use default if not set
    if (key === 'rpcUrl' && !this.config.rpcUrl) {
      return DEFAULT_RPC_URLS[this.config.network];
    }

    return this.config[key] as string | undefined;
  }

  /**
   * Get the entire config object
   * Note: Does not apply environment variable overrides
   */
  public getConfig(): CLIConfig | null {
    return this.config;
  }

  /**
   * Update a specific config value
   *
   * @param key - Config key to update
   * @param value - New value
   */
  public async set(key: keyof CLIConfig, value: string): Promise<void> {
    // Load current config if not already loaded
    if (!this.config) {
      await this.load();
    }

    // Ensure config exists (should always be true after load)
    if (!this.config) {
      this.config = { network: 'testnet' };
    }

    // Update the value
    (this.config as unknown as Record<string, unknown>)[key] = value;

    // Save updated config
    await this.save(this.config);
  }

  /**
   * Validate configuration for a specific command context
   * Validates required fields and formats (wallet address, RPC URL)
   *
   * @param commandName - Name of the command requiring config validation
   * @throws {ConfigError} If required fields are missing or invalid
   */
  public validateConfig(commandName: keyof typeof REQUIRED_CONFIG_FIELDS): void {
    if (!this.config) {
      throw new ConfigError(
        'Configuration not loaded.\nRun `story config` to set up your configuration.'
      );
    }

    // Get required fields for this command
    const requiredFields = REQUIRED_CONFIG_FIELDS[commandName];

    // Check for missing required fields
    for (const field of requiredFields) {
      const value = this.get(field as keyof CLIConfig);

      if (!value) {
        throw new ConfigError(ConfigError.formatConfigErrorMessage(field));
      }
    }

    // Validate wallet address format if present
    if (this.config.walletAddress && !isValidWalletAddress(this.config.walletAddress)) {
      throw new ConfigError(
        'Invalid wallet address format.\nWallet address must be a valid Ethereum address (42 characters starting with "0x").\nExample: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
      );
    }

    // Validate RPC URL format if present
    if (this.config.rpcUrl && !isValidHttpUrl(this.config.rpcUrl)) {
      throw new ConfigError(
        'Invalid RPC URL format.\nRPC URL must be a valid HTTP or HTTPS URL.\nExample: https://testnet.storyrpc.io'
      );
    }
  }

  /**
   * Interactive configuration initialization
   * Prompts user for required configuration values on first run
   *
   * @returns Promise that resolves to the initialized config
   */
  public async initializeConfig(): Promise<CLIConfig> {
    TerminalUI.info('\n⚙️  Story CLI Configuration Setup\n');

    try {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'walletAddress',
          message: 'Enter your Ethereum wallet address (used to sign transactions):',
          validate: (input: string): string | boolean => {
            if (!input) {
              return 'Wallet address is required';
            }
            if (!isValidWalletAddress(input)) {
              return 'Invalid wallet address format. Must be 42 characters starting with "0x"';
            }
            return true;
          },
        },
        {
          type: 'list',
          name: 'network',
          message: 'Select network:',
          choices: [
            { name: 'Testnet (recommended for development)', value: 'testnet' },
            { name: 'Mainnet', value: 'mainnet' },
          ],
          default: 'testnet',
        },
        {
          type: 'input',
          name: 'pinataApiKey',
          message: 'Enter Pinata API key (required for IPFS metadata uploads - get from pinata.cloud):',
          validate: (input: string): string | boolean => {
            if (!input || input.trim().length === 0) {
              return 'Pinata API key is required';
            }
            return true;
          },
        },
        {
          type: 'input',
          name: 'pinataApiSecret',
          message: 'Enter Pinata API secret:',
          validate: (input: string): string | boolean => {
            if (!input || input.trim().length === 0) {
              return 'Pinata API secret is required';
            }
            return true;
          },
        },
        {
          type: 'input',
          name: 'rpcUrl',
          message: 'Custom RPC URL (optional, press Enter to use default Story Protocol endpoint):',
          default: '',
          validate: (input: string): string | boolean => {
            if (input && !isValidHttpUrl(input)) {
              return 'RPC URL must be a valid HTTP or HTTPS URL';
            }
            return true;
          },
        },
      ]);

      // Build config object
      const newConfig: CLIConfig = {
        walletAddress: answers.walletAddress,
        network: answers.network as Network,
        pinataApiKey: answers.pinataApiKey,
        pinataApiSecret: answers.pinataApiSecret,
      };

      // Only include rpcUrl if provided
      if (answers.rpcUrl) {
        newConfig.rpcUrl = answers.rpcUrl;
      }

      // Save config with 600 permissions
      await this.save(newConfig);

      TerminalUI.success(`Configuration saved to ${CONFIG_FILE_PATH}`);

      return newConfig;
    } catch (error) {
      if (error instanceof ConfigError) {
        throw error;
      }

      throw new ConfigError(
        `Failed to initialize configuration.\nError: ${(error as Error).message}`
      );
    }
  }
}
