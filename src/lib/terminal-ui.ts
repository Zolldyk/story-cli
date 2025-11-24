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
    console.log(chalk.yellow(`⚠ ${message}`));
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
    console.log(chalk.blue(`ℹ ${message}`));
  }
}
