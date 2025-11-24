/**
 * Unit tests for TerminalUI component
 * Source: architecture/test-strategy-and-standards.md#Test Types
 *
 * Tests terminal output formatting and debug mode
 * Pattern: AAA (Arrange-Act-Assert)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TerminalUI } from '../../src/lib/terminal-ui.js';

describe('TerminalUI', () => {
  // Mock console methods
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Spy on console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Reset debug mode before each test
    TerminalUI.setDebugMode(false);
  });

  afterEach(() => {
    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('setDebugMode()', () => {
    it('should enable debug mode', () => {
      // Arrange & Act
      TerminalUI.setDebugMode(true);

      // Assert
      expect(TerminalUI.isDebugMode()).toBe(true);
    });

    it('should disable debug mode', () => {
      // Arrange
      TerminalUI.setDebugMode(true);

      // Act
      TerminalUI.setDebugMode(false);

      // Assert
      expect(TerminalUI.isDebugMode()).toBe(false);
    });
  });

  describe('isDebugMode()', () => {
    it('should return false by default', () => {
      // Assert
      expect(TerminalUI.isDebugMode()).toBe(false);
    });

    it('should return true when debug mode is enabled', () => {
      // Arrange
      TerminalUI.setDebugMode(true);

      // Assert
      expect(TerminalUI.isDebugMode()).toBe(true);
    });
  });

  describe('spinner()', () => {
    it('should create ora spinner with message', () => {
      // Arrange
      const message = 'Loading...';

      // Act
      const spinner = TerminalUI.spinner(message);

      // Assert
      expect(spinner).toBeDefined();
      expect(spinner.text).toBe(message);
    });

    it('should create spinner with cyan color', () => {
      // Arrange
      const message = 'Processing';

      // Act
      const spinner = TerminalUI.spinner(message);

      // Assert
      expect(spinner.color).toBe('cyan');
    });
  });

  describe('success()', () => {
    it('should output message with green checkmark', () => {
      // Arrange
      const message = 'Operation successful';

      // Act
      TerminalUI.success(message);

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('✓');
      expect(output).toContain(message);
    });
  });

  describe('error()', () => {
    it('should output message with red X emoji', () => {
      // Arrange
      const message = 'Operation failed';

      // Act
      TerminalUI.error(message);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const output = consoleErrorSpy.mock.calls[0][0];
      expect(output).toContain('✗');
      expect(output).toContain(message);
    });

    it('should not show stack trace when debug mode is disabled', () => {
      // Arrange
      const message = 'Error occurred';
      const error = new Error('Test error');
      TerminalUI.setDebugMode(false);

      // Act
      TerminalUI.error(message, error);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      // Only the main error message, no stack trace
      const calls = consoleErrorSpy.mock.calls;
      expect(calls.length).toBe(1);
    });

    it('should show stack trace when debug mode is enabled', () => {
      // Arrange
      const message = 'Error occurred';
      const error = new Error('Test error');
      TerminalUI.setDebugMode(true);

      // Act
      TerminalUI.error(message, error);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      // Check that stack trace was logged
      const allCalls = consoleErrorSpy.mock.calls.flat().join('');
      expect(allCalls).toContain('Stack trace');
    });
  });

  describe('warning()', () => {
    it('should output message with yellow warning emoji', () => {
      // Arrange
      const message = 'Warning message';

      // Act
      TerminalUI.warning(message);

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('⚠');
      expect(output).toContain(message);
    });
  });

  describe('box()', () => {
    it('should output boxed message with title and content', () => {
      // Arrange
      const title = 'Success';
      const content = 'Your IP asset has been registered';

      // Act
      TerminalUI.box(title, content);

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain(title);
      expect(output).toContain(content);
    });
  });

  describe('debug()', () => {
    it('should output message when debug mode is enabled', () => {
      // Arrange
      const message = 'Debug information';
      TerminalUI.setDebugMode(true);

      // Act
      TerminalUI.debug(message);

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('[DEBUG]');
      expect(output).toContain(message);
    });

    it('should not output message when debug mode is disabled', () => {
      // Arrange
      const message = 'Debug information';
      TerminalUI.setDebugMode(false);

      // Act
      TerminalUI.debug(message);

      // Assert
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('info()', () => {
    it('should output message with info emoji', () => {
      // Arrange
      const message = 'Information message';

      // Act
      TerminalUI.info(message);

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('ℹ');
      expect(output).toContain(message);
    });
  });

  describe('prompt()', () => {
    it('should call inquirer.prompt with questions', async () => {
      // Arrange
      const questions = [
        {
          type: 'input',
          name: 'name',
          message: 'What is your name?',
        },
      ];

      // Mock inquirer
      const mockInquirer = await import('inquirer');
      const promptSpy = vi.spyOn(mockInquirer.default, 'prompt').mockResolvedValue({ name: 'Test' });

      // Act
      const result = await TerminalUI.prompt(questions);

      // Assert
      expect(promptSpy).toHaveBeenCalledWith(questions);
      expect(result).toEqual({ name: 'Test' });

      // Cleanup
      promptSpy.mockRestore();
    });
  });
});
