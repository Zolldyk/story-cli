#!/usr/bin/env node

import { Command, Help } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import chalk from 'chalk';
import { createConfigCommand } from './commands/config.js';
import { createRegisterCommand } from './commands/register.js';
import { registerStatusCommand } from './commands/status.js';
import { createPortfolioCommand } from './commands/portfolio.js';
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

/**
 * Custom help formatter for styled terminal output
 * Source: Story 2.5 AC 10
 */
program
  .name('story')
  .description(
    'CLI tool for Story Protocol - Register and manage IP assets on the blockchain'
  )
  .version(packageJson.version, '-v, --version', 'Display current version')
  .option('--debug', 'Enable debug mode with verbose output and stack traces')
  .configureHelp({
    subcommandTerm: (cmd: Command): string => chalk.bold(cmd.name()),
    optionTerm: (option): string => chalk.cyan(option.flags),
    formatHelp: (cmd: Command, helper: Help): string => {
      const termWidth = helper.padWidth(cmd, helper);

      // Get command components
      const usage = helper.commandUsage(cmd);
      const description = helper.commandDescription(cmd);
      const args = helper.visibleArguments(cmd);
      const options = helper.visibleOptions(cmd);
      const commands = helper.visibleCommands(cmd);
      const globalOptions = helper.visibleGlobalOptions(cmd);

      // Build formatted output
      const output: string[] = [];

      // Usage section
      output.push(chalk.bold.white('Usage:'));
      output.push(`  ${usage}`);
      output.push('');

      // Description
      if (description) {
        output.push(chalk.bold.white('Description:'));
        output.push(`  ${description}`);
        output.push('');
      }

      // Arguments
      if (args.length > 0) {
        output.push(chalk.bold.white('Arguments:'));
        args.forEach((arg) => {
          const argTerm = helper.argumentTerm(arg);
          const argDescription = helper.argumentDescription(arg);
          output.push(`  ${chalk.cyan(argTerm)}${' '.repeat(Math.max(2, termWidth - argTerm.length + 2))}${argDescription}`);
        });
        output.push('');
      }

      // Commands section
      if (commands.length > 0) {
        output.push(chalk.bold.white('Commands:'));
        commands.forEach((subCmd) => {
          const cmdTerm = helper.subcommandTerm(subCmd);
          const cmdDescription = helper.subcommandDescription(subCmd);
          const rawCmdTerm = subCmd.name();
          output.push(`  ${cmdTerm}${' '.repeat(Math.max(2, termWidth - rawCmdTerm.length + 2))}${cmdDescription}`);
        });
        output.push('');
      }

      // Options section
      if (options.length > 0) {
        output.push(chalk.bold.white('Options:'));
        options.forEach((option) => {
          const optTerm = helper.optionTerm(option);
          const optDescription = helper.optionDescription(option);
          const rawFlags = option.flags;
          output.push(`  ${optTerm}${' '.repeat(Math.max(2, termWidth - rawFlags.length + 2))}${optDescription}`);
        });
        output.push('');
      }

      // Global options section
      if (globalOptions.length > 0) {
        output.push(chalk.bold.white('Global Options:'));
        globalOptions.forEach((option) => {
          const optTerm = helper.optionTerm(option);
          const optDescription = helper.optionDescription(option);
          const rawFlags = option.flags;
          output.push(`  ${optTerm}${' '.repeat(Math.max(2, termWidth - rawFlags.length + 2))}${optDescription}`);
        });
        output.push('');
      }

      return output.join('\n');
    },
  })
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

// Portfolio command
program.addCommand(createPortfolioCommand());

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
