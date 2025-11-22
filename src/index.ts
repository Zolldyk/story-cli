#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import chalk from 'chalk';

// Validate Node.js version
function validateNodeVersion(): void {
  const currentVersion = process.version;
  const requiredMajorVersion = 18;
  const majorVersion = parseInt(currentVersion.slice(1).split('.')[0], 10);

  if (majorVersion < requiredMajorVersion) {
    console.error(
      chalk.red(
        `Story CLI requires Node.js ${requiredMajorVersion} or higher. Current version: ${currentVersion}. Please upgrade Node.js.`
      )
    );
    process.exit(1);
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
  .version(packageJson.version, '-v, --version', 'Display current version');

// Register command placeholder
program
  .command('register')
  .description('Register a new IP asset on Story Protocol')
  .action(() => {
    console.log('Register command - To be implemented in future stories');
  });

// Portfolio command placeholder
program
  .command('portfolio')
  .description('Generate and view your IP asset portfolio')
  .action(() => {
    console.log('Portfolio command - To be implemented in future stories');
  });

// Config command placeholder
program
  .command('config')
  .description('Configure Story CLI settings')
  .action(() => {
    console.log('Config command - To be implemented in future stories');
  });

// Handle unknown commands
program.on('command:*', () => {
  console.error(
    chalk.red(
      'Command not found. Run `story --help` to see available commands.'
    )
  );
  process.exit(1);
});

program.parse(process.argv);
