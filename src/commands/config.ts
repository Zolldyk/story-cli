/**
 * Config command implementation
 * Handles configuration management for Story CLI
 */

import { Command } from 'commander';
import { ConfigManager } from '../lib/config-manager.js';
import { CONFIG_FILE_PATH } from '../constants/config.js';
import { CLIConfig, isValidNetwork } from '../types/config.js';
import { ConfigError } from '../types/errors.js';
import { TerminalUI } from '../lib/terminal-ui.js';

/**
 * Mask sensitive configuration values
 * Shows only first 8 characters followed by "..."
 */
function maskSensitiveValue(key: string, value: string): string {
  const sensitiveKeys = ['pinataApiKey', 'pinataApiSecret'];

  if (sensitiveKeys.includes(key)) {
    return value.length > 8 ? `${value.substring(0, 8)}...` : '***';
  }

  return value;
}

/**
 * Config command handler
 */
export function createConfigCommand(): Command {
  const config = new Command('config')
    .description('Manage Story CLI configuration');

  // config set <key> <value>
  config
    .command('set')
    .description('Set a configuration value')
    .argument('<key>', 'Configuration key to set')
    .argument('<value>', 'Value to set')
    .action(async (key: string, value: string) => {
      try {
        const configManager = ConfigManager.getInstance();

        // Validate key is a valid config field
        const validKeys: Array<keyof CLIConfig> = [
          'walletAddress',
          'network',
          'rpcUrl',
          'pinataApiKey',
          'pinataApiSecret',
          'defaultLicense',
        ];

        if (!validKeys.includes(key as keyof CLIConfig)) {
          throw new ConfigError(
            `Invalid configuration key: "${key}".\nValid keys: ${validKeys.join(', ')}`
          );
        }

        // Special validation for network field
        if (key === 'network' && !isValidNetwork(value)) {
          throw new ConfigError(
            'Invalid network value.\nMust be either "testnet" or "mainnet".'
          );
        }

        // Set the value
        await configManager.set(key as keyof CLIConfig, value);

        TerminalUI.success(`Updated ${key} in ${CONFIG_FILE_PATH}`);
      } catch (error) {
        if (error instanceof ConfigError) {
          throw error;
        }
        throw error;
      }
    });

  // config get [key]
  config
    .command('get')
    .description('Display configuration values')
    .argument('[key]', 'Specific configuration key to display (optional)')
    .action(async (key?: string) => {
      try {
        const configManager = ConfigManager.getInstance();
        await configManager.load();

        const configData = configManager.getConfig();

        if (!configData) {
          TerminalUI.info('No configuration found. Run `story config set` to configure.');
          return;
        }

        // If key specified, show only that value
        if (key) {
          const value = configData[key as keyof CLIConfig];

          if (value === undefined) {
            throw new ConfigError(
              `Configuration key "${key}" not found.\nRun \`story config get\` to see all available keys.`
            );
          }

          const displayValue = maskSensitiveValue(key, String(value));
          TerminalUI.info(`${key}: ${displayValue}`);
        } else {
          // Show all config values
          TerminalUI.info('\nCurrent configuration:\n');

          for (const [k, v] of Object.entries(configData)) {
            if (v !== undefined) {
              const displayValue = maskSensitiveValue(k, String(v));
              TerminalUI.info(`  ${k}: ${displayValue}`);
            }
          }

          TerminalUI.info('');
        }
      } catch (error) {
        if (error instanceof ConfigError) {
          throw error;
        }
        throw error;
      }
    });

  // config path
  config
    .command('path')
    .description('Display path to configuration file')
    .action(() => {
      TerminalUI.info(CONFIG_FILE_PATH);
    });

  return config;
}
