import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Node.js Version Validation Integration', () => {
  it('should fail with clear error when Node.js version < 18', () => {
    // Arrange: Use fixture that mocks Node v16
    const fixturePath = join(__dirname, 'fixtures/mock-node-v16.mjs');

    // Act & Assert
    try {
      execSync(`node ${fixturePath}`, { encoding: 'utf-8' });
      // Should not reach here - fixture should exit with code 1
      expect.fail('Expected fixture to exit with error');
    } catch (error: unknown) {
      const execError = error as { stderr?: Buffer; status?: number };
      const stderr = execError.stderr?.toString() || '';

      // Assert: Error message displayed with correct version
      expect(stderr).toContain('Story CLI requires Node.js 18 or higher');
      expect(stderr).toContain('Current version: v16.20.0');
      expect(stderr).toContain('Please upgrade Node.js');

      // Assert: Exit code 1 for validation failure
      expect(execError.status).toBe(1);
    }
  });

  it('should pass validation with current Node.js version (>= 18)', () => {
    // Arrange & Act: Run actual CLI with --version to verify it loads
    const result = execSync('tsx src/index.ts --version', {
      encoding: 'utf-8',
    });

    // Assert: CLI loaded successfully and returned version
    expect(result).toContain('0.1.0');
  });

  it('should fail with Node.js version 17 (edge case)', () => {
    // Arrange: Use fixture that mocks Node v17
    const fixturePath = join(__dirname, 'fixtures/mock-node-v17.mjs');

    // Act & Assert
    try {
      execSync(`node ${fixturePath}`, { encoding: 'utf-8' });
      // Should not reach here
      expect.fail('Expected fixture to exit with error');
    } catch (error: unknown) {
      const execError = error as { stderr?: Buffer; status?: number };
      const stderr = execError.stderr?.toString() || '';

      // Assert: Validation fails for v17 (edge case just below requirement)
      expect(stderr).toContain('Story CLI requires Node.js 18 or higher');
      expect(stderr).toContain('Current version: v17.9.1');
      expect(execError.status).toBe(1);
    }
  });
});
