/**
 * Suggestion Engine - Typo detection and correction
 * Source: architecture/error-handling-strategy.md
 *
 * Uses Levenshtein distance algorithm via didyoumean library
 * to suggest corrections for user input typos.
 */

import didyoumean from 'didyoumean';

// Configure didyoumean with strict threshold
// Only suggest matches with edit distance < 3
didyoumean.threshold = 0.4; // Adjusted for balance between too strict and too loose

/**
 * Suggest a command based on user input
 *
 * @param input - The potentially misspelled command
 * @param validCommands - Array of valid command names
 * @returns Suggested command or null if no close match
 */
export function suggestCommand(
  input: string,
  validCommands: string[]
): string | null {
  const suggestion = didyoumean(input, validCommands);
  return typeof suggestion === 'string' ? suggestion : null;
}

/**
 * Suggest a network name for typos
 * Handles common typos like "mainet" → "mainnet"
 *
 * @param input - The potentially misspelled network name
 * @returns Suggested network name or null if no close match
 */
export function suggestNetworkName(input: string): string | null {
  const validNetworks = ['testnet', 'mainnet'];
  const suggestion = didyoumean(input, validNetworks);
  return typeof suggestion === 'string' ? suggestion : null;
}

/**
 * Format a "Did you mean?" error message
 *
 * @param input - The user's input
 * @param suggestion - The suggested correction
 * @param context - Optional context (e.g., "command", "network")
 * @returns Formatted suggestion message
 */
export function formatSuggestion(
  input: string,
  suggestion: string,
  context?: string
): string {
  const contextStr = context ? ` ${context}` : '';
  return `Unknown${contextStr}: '${input}'\nDid you mean '${suggestion}'?`;
}
