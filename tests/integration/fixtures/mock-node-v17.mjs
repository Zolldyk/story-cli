#!/usr/bin/env node

// Mock Node.js version 17 for testing edge case version validation
// This fixture simulates running the CLI with version 17.x (just below requirement)

import chalk from 'chalk';

// Override process.version
Object.defineProperty(global.process, 'version', {
  value: 'v17.9.1',
  writable: true,
  configurable: true
});

// Run the version validation logic (copied from src/index.ts)
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

// If we got here, validation passed (should not happen with v17)
console.log('Validation passed unexpectedly');
