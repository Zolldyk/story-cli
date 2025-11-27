/**
 * Installation Integration Tests
 * Tests CLI installation and basic command execution
 * Source: Story 2.4, Task 2
 */

import { describe, it, expect } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const execAsync = promisify(exec);

// Get package.json for version verification
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../../package.json'), 'utf-8')
);

const CLI_PATH = join(__dirname, '../../dist/index.js');

/**
 * Helper to run CLI commands
 */
async function runCLI(args: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  try {
    const { stdout, stderr } = await execAsync(`node ${CLI_PATH} ${args}`);
    return { stdout, stderr, exitCode: 0 };
  } catch (error: unknown) {
    const execError = error as { stdout?: string; stderr?: string; code?: number };
    return {
      stdout: execError.stdout || '',
      stderr: execError.stderr || '',
      exitCode: execError.code || 1,
    };
  }
}

describe('Installation Integration Tests - Version Command', () => {
  it('should output package version from package.json with --version flag', async () => {
    // Arrange
    const expectedVersion = packageJson.version;

    // Act
    const result = await runCLI('--version');

    // Assert
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe(expectedVersion);
  });

  it('should output package version from package.json with -v flag', async () => {
    // Arrange
    const expectedVersion = packageJson.version;

    // Act
    const result = await runCLI('-v');

    // Assert
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe(expectedVersion);
  });
});

describe('Installation Integration Tests - Help Command', () => {
  it('should display command list with --help flag without errors', async () => {
    // Act
    const result = await runCLI('--help');

    // Assert
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('story');
    expect(result.stdout).toContain('register');
    expect(result.stdout).toContain('portfolio');
    expect(result.stdout).toContain('config');
    expect(result.stderr).toBe('');
  });

  it('should display help output when run with no arguments', async () => {
    // Act
    const result = await runCLI('');

    // Assert - Commander.js shows help in stderr and exits with code 1 when no command provided
    // Help text may appear in stdout or stderr depending on Commander version
    const output = result.stdout + result.stderr;
    expect(output).toContain('story');
    expect(output).toContain('Commands:');
  });
});

describe('Installation Integration Tests - Unknown Command Handling', () => {
  it('should display "did you mean" suggestion for unknown command and exit with code 1', async () => {
    // Act
    const result = await runCLI('registr');

    // Assert
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatch(/did you mean.*register/i);
  });

  it('should display error for completely unknown command', async () => {
    // Act
    const result = await runCLI('unknowncommand');

    // Assert
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Unknown command');
  });
});

describe('Installation Integration Tests - Subcommand Help', () => {
  it('should display register command help', async () => {
    // Act
    const result = await runCLI('register --help');

    // Assert
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('register');
  });

  it('should display portfolio command help', async () => {
    // Act
    const result = await runCLI('portfolio --help');

    // Assert
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('portfolio');
  });

  it('should display config command help', async () => {
    // Act
    const result = await runCLI('config --help');

    // Assert
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('config');
  });
});
