/**
 * Global Error Handler
 * Source: architecture/error-handling-strategy.md#General Approach
 *
 * Provides centralized error handling for all CLI commands:
 * - Catches unhandled exceptions
 * - Formats user-friendly error messages
 * - Determines appropriate exit codes
 * - Controls stack trace visibility (debug mode only)
 */

import { CLIError, EXIT_CODE_SYSTEM_ERROR } from '../types/errors.js';
import { TerminalUI } from './terminal-ui.js';

/**
 * Handle an error and exit with appropriate exit code
 * Source: architecture/error-handling-strategy.md#Error Handling Patterns
 *
 * @param error - The error to handle
 * @param debug - Whether debug mode is enabled
 */
export function handleError(error: Error, debug: boolean): void {
  // Determine exit code based on error type
  const exitCode =
    error instanceof CLIError ? error.exitCode : EXIT_CODE_SYSTEM_ERROR;

  // Display formatted error message
  TerminalUI.error(error.message, debug ? error : undefined);

  // Exit with appropriate code
  process.exit(exitCode);
}

/**
 * Wrap a command function with error handling
 * Source: architecture/source-tree.md
 *
 * Catches both synchronous errors and rejected promises,
 * then routes them to the global error handler.
 *
 * @param fn - The command function to wrap
 * @returns Wrapped function with error handling
 */
export function wrapCommand<T extends unknown[], R>(
  fn: (...args: T) => Promise<R> | R
): (...args: T) => Promise<void> {
  return async (...args: T): Promise<void> => {
    try {
      await fn(...args);
    } catch (error) {
      const debug = TerminalUI.isDebugMode();
      handleError(error as Error, debug);
    }
  };
}
