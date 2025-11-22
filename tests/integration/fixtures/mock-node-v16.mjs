#!/usr/bin/env node

// Mock Node.js version 16 for testing version validation failure
// This fixture simulates running the CLI with an old Node version

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import chalk from 'chalk';

// Override process.version before validation
const originalVersion = process.version;
Object.defineProperty(global.process, 'version', {
  value: 'v16.20.0',
  writable: true,
  configurable: true
});

// Now run the version validation logic (copied from src/index.ts)
function validateNodeVersion() {
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

// Validate - this should trigger the error and exit
validateNodeVersion();

// If we got here, validation passed (should not happen with v16)
console.log('Validation passed unexpectedly');
