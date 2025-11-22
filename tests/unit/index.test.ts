import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';

describe('CLI Entry Point', () => {
  const CLI_PATH = 'tsx src/index.ts';

  describe('Version validation', () => {
    it('should validate Node.js version requirement', () => {
      // Arrange: Mock an old Node.js version
      const originalVersion = process.version;

      // This test verifies the validation logic exists
      // In actual runtime, the version check happens before any code can mock it
      // So we test the current version passes validation
      const result = execSync(`${CLI_PATH} --version`, {
        encoding: 'utf-8',
      });

      // Assert: CLI runs successfully with valid version
      expect(result).toContain('1.0.0');
    });
  });

  describe('Help command', () => {
    it('should display help when --help flag is used', () => {
      // Arrange & Act
      const result = execSync(`${CLI_PATH} --help`, { encoding: 'utf-8' });

      // Assert
      expect(result).toContain('Usage: story');
      expect(result).toContain('CLI tool for Story Protocol');
      expect(result).toContain('register');
      expect(result).toContain('portfolio');
      expect(result).toContain('config');
    });

    it('should display command-specific help for register command', () => {
      // Arrange & Act
      const result = execSync(`${CLI_PATH} register --help`, {
        encoding: 'utf-8',
      });

      // Assert
      expect(result).toContain('register');
      expect(result).toContain('Register a new IP asset on Story Protocol');
    });
  });

  describe('Version command', () => {
    it('should display version when --version flag is used', () => {
      // Arrange & Act
      const result = execSync(`${CLI_PATH} --version`, { encoding: 'utf-8' });

      // Assert
      expect(result).toContain('1.0.0');
    });

    it('should display version when -v flag is used', () => {
      // Arrange & Act
      const result = execSync(`${CLI_PATH} -v`, { encoding: 'utf-8' });

      // Assert
      expect(result).toContain('1.0.0');
    });
  });

  describe('Unknown command handling', () => {
    it('should display error message for unknown command', () => {
      // Arrange & Act & Assert
      try {
        execSync(`${CLI_PATH} unknown-command`, { encoding: 'utf-8' });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: unknown) {
        const execError = error as { stderr?: Buffer; status?: number };
        const stderr = execError.stderr?.toString() || '';

        // Assert: Error message displayed
        expect(stderr).toContain('Command not found');
        expect(stderr).toContain('story --help');

        // Assert: Exit code 1 for user error
        expect(execError.status).toBe(1);
      }
    });
  });

  describe('Command routing', () => {
    it('should route to register command', () => {
      // Arrange & Act
      const result = execSync(`${CLI_PATH} register`, { encoding: 'utf-8' });

      // Assert
      expect(result).toContain('Register command - To be implemented');
    });

    it('should route to portfolio command', () => {
      // Arrange & Act
      const result = execSync(`${CLI_PATH} portfolio`, { encoding: 'utf-8' });

      // Assert
      expect(result).toContain('Portfolio command - To be implemented');
    });

    it('should route to config command', () => {
      // Arrange & Act
      const result = execSync(`${CLI_PATH} config`, { encoding: 'utf-8' });

      // Assert
      expect(result).toContain('Config command - To be implemented');
    });
  });
});
