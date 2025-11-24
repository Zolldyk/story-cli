#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createConfigCommand } from './commands/config.js';
import { createRegisterCommand } from './commands/register.js';
import { registerStatusCommand } from './commands/status.js';
import { TerminalUI } from './lib/terminal-ui.js';
import { handleError } from './lib/error-handler.js';
import { EXIT_CODE_USER_ERROR } from './types/errors.js';
import { suggestCommand, formatSuggestion } from './lib/suggestion-engine.js';

/**
 * Global error handlers
 * Catch unhandled exceptions and promise rejections
 * Source: architecture/error-handling-strategy.md#General Approach
 */
process.on('uncaughtException', (error: Error) => {
  const debug = TerminalUI.isDebugMode();
  handleError(error, debug);
});

process.on('unhandledRejection', (reason: unknown) => {
  const error =
    reason instanceof Error ? reason : new Error(String(reason));
  const debug = TerminalUI.isDebugMode();
  handleError(error, debug);
});

// Validate Node.js version
function validateNodeVersion(): void {
  const currentVersion = process.version;
  const requiredMajorVersion = 18;
  const majorVersion = parseInt(currentVersion.slice(1).split('.')[0], 10);

  if (majorVersion < requiredMajorVersion) {
    TerminalUI.error(
      `Story CLI requires Node.js ${requiredMajorVersion} or higher. Current version: ${currentVersion}. Please upgrade Node.js.`
    );
    process.exit(EXIT_CODE_USER_ERROR);
  }
}

// Check Node.js version before continuing
validateNodeVersion();

// Get package.json for version
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8')
);

const program = new Command();

program
  .name('story')
  .description(
    'CLI tool for Story Protocol - Register and manage IP assets on the blockchain'
  )
  .version(packageJson.version, '-v, --version', 'Display current version')
  .option('--debug', 'Enable debug mode with verbose output and stack traces')
  .hook('preAction', (thisCommand) => {
    // Enable debug mode if --debug flag is present or DEBUG env var is set
    const debugFlag = thisCommand.opts().debug || process.env.DEBUG === 'true';
    TerminalUI.setDebugMode(debugFlag);

    if (debugFlag) {
      TerminalUI.debug('Debug mode enabled');
    }
  });

// Register command
program.addCommand(createRegisterCommand());

// Portfolio command placeholder
program
  .command('portfolio')
  .description('Generate and view your IP asset portfolio')
  .action(() => {
    TerminalUI.info('Portfolio command - To be implemented in future stories');
  });

// Status command
registerStatusCommand(program);

// Config command
program.addCommand(createConfigCommand());

// Handle unknown commands
program.on('command:*', (operands) => {
  const unknownCommand = operands[0];
  const validCommands = ['register', 'portfolio', 'status', 'config'];
  const suggestion = suggestCommand(unknownCommand, validCommands);

  if (suggestion) {
    TerminalUI.error(formatSuggestion(unknownCommand, suggestion, 'command'));
  } else {
    TerminalUI.error(
      `Unknown command: '${unknownCommand}'\nRun \`story --help\` to see available commands.`
    );
  }
  process.exit(EXIT_CODE_USER_ERROR);
});

program.parse(process.argv);
