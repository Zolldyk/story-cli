/**
 * Integration tests for file path validation
 * Tests register command file validation using execSync
 * Source: Epic 1 Story 1.5 Task 15
 */

import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, writeFileSync, unlinkSync, chmodSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

describe('Register File Validation Integration Tests', () => {
  const CLI_PATH = 'tsx src/index.ts';
  const testFilePath = join(process.cwd(), 'test-temp-file.txt');

  afterEach(() => {
    // Clean up test file if it exists
    if (existsSync(testFilePath)) {
      try {
        chmodSync(testFilePath, 0o644); // Restore permissions
        unlinkSync(testFilePath);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  describe('Nonexistent file', () => {
    it('should throw error when file does not exist', () => {
      // Arrange
      const nonexistentFile = './nonexistent-file-xyz.jpg';

      // Act & Assert
      try {
        execSync(`${CLI_PATH} register ${nonexistentFile}`, {
          encoding: 'utf-8',
        });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        const stderr = error.stderr?.toString() || '';

        // Assert
        expect(stderr).toContain('File not found');
        expect(stderr).toContain(nonexistentFile);
        expect(stderr).toContain('Please provide a valid file path');
        expect(error.status).toBe(1);
      }
    });
  });

  describe('Valid file path', () => {
    it('should accept valid readable file and start wizard', () => {
      // Arrange - Create a test file
      writeFileSync(testFilePath, 'test content');

      // Act & Assert - File should be accepted, wizard should start
      // Since this would start interactive prompts, we just verify no validation error
      try {
        execSync(`${CLI_PATH} register ${testFilePath}`, {
          encoding: 'utf-8',
          timeout: 1000,
          input: 'n\n', // Answer 'no' to first prompt to exit quickly
        });
      } catch (error: any) {
        // The command will timeout or exit during prompts, which is expected
        // We're just verifying it didn't fail with a validation error
        const stderr = error.stderr?.toString() || '';
        expect(stderr).not.toContain('File not found');
        expect(stderr).not.toContain('not readable');
      }
    });
  });

  describe('Unreadable file', () => {
    it('should throw error when file exists but is not readable', () => {
      // Arrange - Create a test file and make it unreadable
      writeFileSync(testFilePath, 'test content');
      chmodSync(testFilePath, 0o000); // Remove all permissions

      // Act & Assert
      try {
        execSync(`${CLI_PATH} register ${testFilePath}`, {
          encoding: 'utf-8',
        });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        const stderr = error.stderr?.toString() || '';

        // Assert
        expect(stderr).toContain('File exists but is not readable');
        expect(stderr).toContain(testFilePath);
        expect(stderr).toContain('Check file permissions');
        expect(error.status).toBe(1);
      }
    });
  });
});
