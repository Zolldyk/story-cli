/**
 * Terminal UI Component - Centralized terminal output manager
 * Source: architecture/components.md#Component: Terminal UI
 *
 * Provides consistent styling for all terminal output:
 * - Success messages: Green ✓
 * - Error messages: Red ✗
 * - Warnings: Yellow ⚠
 * - Spinners: Ora animations for async operations
 * - Boxes: Boxen for important messages
 * - Prompts: Inquirer.js wrapper
 */

import chalk from 'chalk';
import ora, { Ora } from 'ora';
import boxen from 'boxen';
import inquirer from 'inquirer';

/**
 * Global debug mode flag
 * Can be enabled via --debug flag or DEBUG environment variable
 */
let debugMode = false;

/**
 * TerminalUI - Centralized terminal output formatting
 * Source: architecture/coding-standards.md#Critical Rules
 *
 * CRITICAL: Use TerminalUI instead of console.log in production code
 *
 * Note: This class is the abstraction layer for terminal output,
 * so it's allowed to use console.log/error internally.
 */
/* eslint-disable no-console */
export class TerminalUI {
  /**
   * Set debug mode for verbose output
   * @param enabled - Whether to enable debug mode
   */
  static setDebugMode(enabled: boolean): void {
    debugMode = enabled;
  }

  /**
   * Get current debug mode status
   * @returns Current debug mode state
   */
  static isDebugMode(): boolean {
    return debugMode;
  }

  /**
   * Create a spinner for async operations
   * Source: architecture/tech-stack.md#Technology Stack Table (Ora 7.0.1)
   *
   * @param message - Message to display with the spinner
   * @returns Ora spinner instance
   */
  static spinner(message: string): Ora {
    return ora({
      text: message,
      color: 'cyan',
    });
  }

  /**
   * Display success message with green checkmark
   * Source: architecture/components.md#Component: Terminal UI
   *
   * @param message - Success message to display
   */
  static success(message: string): void {
    console.log(chalk.green(`✓ ${message}`));
  }

  /**
   * Display error message with red X emoji
   * Optionally includes stack trace in debug mode
   * Source: architecture/error-handling-strategy.md#Logging Standards
   *
   * @param message - Error message to display
   * @param error - Optional Error object for stack trace in debug mode
   */
  static error(message: string, error?: Error): void {
    console.error(chalk.red(`✗ ${message}`));

    if (debugMode && error?.stack) {
      console.error(chalk.gray('\nStack trace:'));
      console.error(chalk.gray(error.stack));
    }
  }

  /**
   * Display warning message with yellow warning emoji
   *
   * @param message - Warning message to display
   */
  static warning(message: string): void {
    console.log(chalk.yellow(`⚠️ ${message}`));
  }

  /**
   * Display important message in a box
   * Source: architecture/tech-stack.md#Technology Stack Table (Boxen 7.1.1)
   *
   * @param title - Box title
   * @param content - Box content
   */
  static box(title: string, content: string): void {
    const boxContent = `${chalk.bold(title)}\n\n${content}`;
    console.log(
      boxen(boxContent, {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green',
      })
    );
  }

  /**
   * Display interactive prompt using Inquirer.js
   * Source: architecture/tech-stack.md#Technology Stack Table (Inquirer.js 9.2.12)
   *
   * @param questions - Inquirer.js question configuration
   * @returns Promise resolving to user answers
   */
  static async prompt<T extends Record<string, unknown> = Record<string, unknown>>(
    questions: Parameters<typeof inquirer.prompt>[0]
  ): Promise<T> {
    return inquirer.prompt<T>(questions) as Promise<T>;
  }

  /**
   * Display debug message (only in debug mode)
   *
   * @param message - Debug message to display
   */
  static debug(message: string): void {
    if (debugMode) {
      console.log(chalk.gray(`[DEBUG] ${message}`));
    }
  }

  /**
   * Display info message
   *
   * @param message - Info message to display
   */
  static info(message: string): void {
    console.log(chalk.blue(`ℹ️ ${message}`));
  }

  /**
   * Generate network badge with appropriate color
   * Source: Story 2.5 AC 9
   *
   * @param network - Network name ('testnet' or 'mainnet')
   * @returns Colored badge string "[Testnet]" or "[Mainnet]"
   */
  static networkBadge(network: string): string {
    const isMainnet = network.toLowerCase() === 'mainnet';
    const label = isMainnet ? 'Mainnet' : 'Testnet';
    return isMainnet
      ? chalk.magenta(`[${label}]`)
      : chalk.cyan(`[${label}]`);
  }

  /**
   * Display major success message with celebration emoji and Boxen
   * Source: Story 2.5 AC 5, 6
   *
   * @param title - Box title
   * @param content - Box content
   */
  static majorSuccess(title: string, content: string): void {
    const boxContent = `${chalk.bold(`🎉 ${title}`)}\n\n${content}`;
    console.log(
      boxen(boxContent, {
        padding: 1,
        margin: 1,
        borderStyle: 'double',
        borderColor: 'green',
      })
    );
  }

  /**
   * Create a processing spinner with gear emoji
   * Source: Story 2.5 AC 6
   *
   * @param message - Message to display with the spinner
   * @returns Ora spinner instance
   */
  static processing(message: string): Ora {
    return ora({
      text: `⚙️ ${message}`,
      color: 'cyan',
    });
  }

  /**
   * Create a querying spinner with magnifying glass emoji
   * Source: Story 2.5 AC 6
   *
   * @param message - Message to display with the spinner
   * @returns Ora spinner instance
   */
  static querying(message: string): Ora {
    return ora({
      text: `🔍 ${message}`,
      color: 'cyan',
    });
  }

  /**
   * Calculate and format execution time
   * Source: Story 2.5 AC 8
   *
   * @param startTime - Start time from performance.now()
   * @returns Formatted string "Completed in X.X seconds"
   */
  static executionTime(startTime: number): string {
    const elapsed = (performance.now() - startTime) / 1000;
    return chalk.gray(`Completed in ${elapsed.toFixed(1)} seconds`);
  }

  /**
   * Truncate hash/ID to display format
   * Source: Story 2.5 AC 7
   *
   * @param hash - Full hash or ID string
   * @param showFull - If true, return full hash without truncation
   * @returns Truncated hash (0x1234...5678) or full hash
   */
  static truncateHash(hash: string, showFull: boolean = false): string {
    if (showFull || hash.length <= 14) {
      return hash;
    }
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  }
}
