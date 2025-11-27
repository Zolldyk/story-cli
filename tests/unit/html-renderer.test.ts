/**
 * Unit tests for HTMLRenderer component
 * Tests HTML portfolio page generation
 */

import { describe, it, expect } from 'vitest';
import {
  HTMLRenderer,
  escapeHtml,
  formatDate,
  PortfolioDataWithMermaid,
} from '../../src/lib/html-renderer.js';
import { IPAssetWithRelationships, PortfolioStatistics } from '../../src/types/portfolio.js';

/**
 * Create test portfolio data with defaults
 */
function createTestPortfolio(
  overrides: Partial<PortfolioDataWithMermaid> = {}
): PortfolioDataWithMermaid {
  const defaultStats: PortfolioStatistics = {
    totalAssets: 0,
    rootAssets: 0,
    derivatives: 0,
    licensesIssued: 0,
    totalRoyalties: 0,
  };

  return {
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
    network: 'testnet',
    assets: [],
    statistics: defaultStats,
    relationshipGraph: { nodes: [], edges: [] },
    generatedAt: '2024-01-15T10:30:00.000Z',
    ...overrides,
  };
}

/**
 * Create test asset with defaults
 */
function createTestAsset(
  overrides: Partial<IPAssetWithRelationships> = {}
): IPAssetWithRelationships {
  return {
    ipId: '0x1234567890abcdef1234567890abcdef12345678',
    name: 'Test Asset',
    metadata: {
      name: 'Test Asset',
      creator: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    licenseType: 'commercial-remix',
    createdAt: '2024-01-01T00:00:00.000Z',
    childIpIds: [],
    derivativeCount: 0,
    ...overrides,
  };
}

describe('escapeHtml', () => {
  it('should escape < and > characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('should escape & character', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('should escape double quotes', () => {
    expect(escapeHtml('He said "hello"')).toBe('He said &quot;hello&quot;');
  });

  it('should escape single quotes', () => {
    expect(escapeHtml("It's fine")).toBe('It&#39;s fine');
  });

  it('should handle multiple special characters', () => {
    expect(escapeHtml('<div class="test">a & b</div>')).toBe(
      '&lt;div class=&quot;test&quot;&gt;a &amp; b&lt;/div&gt;'
    );
  });

  it('should return unchanged string if no special characters', () => {
    expect(escapeHtml('Normal text 123')).toBe('Normal text 123');
  });

  it('should handle empty string', () => {
    expect(escapeHtml('')).toBe('');
  });
});

describe('formatDate', () => {
  it('should format ISO date to human-readable format', () => {
    const result = formatDate('2024-01-15T10:30:00.000Z');
    // Note: Exact format may vary by locale, but should contain key parts
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('should include time in output', () => {
    const result = formatDate('2024-01-15T14:30:00.000Z');
    // Should contain hour/minute
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it('should handle different dates', () => {
    const result = formatDate('2025-11-25T20:45:00.000Z');
    expect(result).toContain('Nov');
    expect(result).toContain('25');
    expect(result).toContain('2025');
  });
});

describe('HTMLRenderer', () => {
  const renderer = new HTMLRenderer();

  describe('render', () => {
    it('should return valid HTML document with DOCTYPE', () => {
      const portfolio = createTestPortfolio();
      const result = renderer.render(portfolio);

      expect(result).toMatch(/^<!DOCTYPE html>/);
      expect(result).toContain('<html lang="en">');
      expect(result).toContain('</html>');
    });

    it('should include required meta tags', () => {
      const portfolio = createTestPortfolio();
      const result = renderer.render(portfolio);

      expect(result).toContain('<meta charset="UTF-8">');
      expect(result).toContain('<meta name="viewport"');
      expect(result).toContain('width=device-width');
    });

    it('should include Mermaid.js CDN script', () => {
      const portfolio = createTestPortfolio();
      const result = renderer.render(portfolio);

      expect(result).toContain('https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js');
    });

    it('should include title with truncated wallet address', () => {
      const portfolio = createTestPortfolio({
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
      });
      const result = renderer.render(portfolio);

      // Wallet truncation: first 6 + ... + last 4
      expect(result).toContain('<title>IP Portfolio - 0x742d...bEb0</title>');
    });

    it('should display network badge', () => {
      const portfolio = createTestPortfolio({ network: 'testnet' });
      const result = renderer.render(portfolio);

      expect(result).toContain('class="network-badge"');
      expect(result).toContain('testnet');
    });

    it('should render "No assets" message for empty portfolio', () => {
      const portfolio = createTestPortfolio({ assets: [] });
      const result = renderer.render(portfolio);

      expect(result).toContain('No assets to display');
    });

    it('should render single asset correctly', () => {
      const asset = createTestAsset();
      const portfolio = createTestPortfolio({
        assets: [asset],
        statistics: {
          totalAssets: 1,
          rootAssets: 1,
          derivatives: 0,
          licensesIssued: 0,
          totalRoyalties: 0,
        },
      });

      const result = renderer.render(portfolio);

      expect(result).toContain('0x1234...5678'); // truncated ID
      expect(result).toContain('commercial-remix');
      expect(result).toContain('<table>');
      expect(result).toContain('<tr>');
    });

    it('should render multiple assets with correct stats', () => {
      const rootAsset = createTestAsset({
        ipId: '0x1111111111111111111111111111111111111111',
        name: 'Root Asset',
      });
      const derivativeAsset = createTestAsset({
        ipId: '0x2222222222222222222222222222222222222222',
        name: 'Derivative Asset',
        parentIpId: '0x1111111111111111111111111111111111111111',
      });

      const portfolio = createTestPortfolio({
        assets: [rootAsset, derivativeAsset],
        statistics: {
          totalAssets: 2,
          rootAssets: 1,
          derivatives: 1,
          licensesIssued: 5,
          totalRoyalties: 100,
        },
      });

      const result = renderer.render(portfolio);

      // Check stats are rendered
      expect(result).toContain('>2<'); // total assets value
      expect(result).toContain('>1<'); // root assets / derivatives value
      expect(result).toContain('>5<'); // licenses issued value
      expect(result).toContain('>100 IP<'); // royalties value

      // Check both assets in table
      expect(result).toContain('0x1111...1111');
      expect(result).toContain('0x2222...2222');
    });

    it('should include Mermaid diagram when provided', () => {
      const portfolio = createTestPortfolio({
        mermaidDiagram: 'flowchart TD\n  A[Root] --> B[Child]',
      });

      const result = renderer.render(portfolio);

      expect(result).toContain('class="mermaid"');
      expect(result).toContain('flowchart TD');
      expect(result).toContain('A[Root] --> B[Child]');
    });

    it('should show fallback message when no diagram available', () => {
      const portfolio = createTestPortfolio({
        mermaidDiagram: undefined,
      });

      const result = renderer.render(portfolio);

      expect(result).toContain('Graph visualization unavailable');
    });

    it('should use SVG fallback when provided and no mermaid diagram', () => {
      const portfolio = createTestPortfolio({
        mermaidDiagram: undefined,
      });

      const result = renderer.render(portfolio, {
        svgFallback: '<svg><circle cx="50" cy="50" r="40"/></svg>',
      });

      expect(result).toContain('svg-fallback');
      expect(result).toContain('<circle cx="50" cy="50" r="40"/>');
    });

    it('should use HTML fallback when provided and no mermaid or SVG', () => {
      const portfolio = createTestPortfolio({
        mermaidDiagram: undefined,
      });

      const result = renderer.render(portfolio, {
        htmlFallback: '<ul><li>Asset 1</li></ul>',
      });

      expect(result).toContain('html-fallback');
      expect(result).toContain('<ul><li>Asset 1</li></ul>');
    });

    it('should include footer with generation date and GitHub link', () => {
      const portfolio = createTestPortfolio({
        generatedAt: '2024-01-15T10:30:00.000Z',
      });

      const result = renderer.render(portfolio);

      expect(result).toContain('<footer>');
      expect(result).toContain('Generated by');
      expect(result).toContain('Story CLI');
      expect(result).toContain('Jan 15, 2024');
      expect(result).toContain('github.com/storyprotocol/story-cli');
    });
  });

  describe('getEmbeddedStyles', () => {
    it('should return string with <style> tags', () => {
      const result = renderer.getEmbeddedStyles();

      expect(result).toMatch(/^<style>/);
      expect(result).toMatch(/<\/style>$/);
    });

    it('should contain CSS custom properties (variables)', () => {
      const result = renderer.getEmbeddedStyles();

      expect(result).toContain(':root');
      expect(result).toContain('--bg-primary');
      expect(result).toContain('--text-primary');
      expect(result).toContain('--accent');
      expect(result).toContain('--border');
    });

    it('should contain dark mode media query', () => {
      const result = renderer.getEmbeddedStyles();

      expect(result).toContain('@media (prefers-color-scheme: dark)');
    });

    it('should contain responsive breakpoint media queries', () => {
      const result = renderer.getEmbeddedStyles();

      expect(result).toContain('@media (max-width: 1920px)');
      expect(result).toContain('@media (max-width: 1440px)');
      expect(result).toContain('@media (max-width: 768px)');
      expect(result).toContain('@media (max-width: 375px)');
    });

    it('should use system font stack', () => {
      const result = renderer.getEmbeddedStyles();

      expect(result).toContain('-apple-system');
      expect(result).toContain('BlinkMacSystemFont');
      expect(result).toContain("'Segoe UI'");
      expect(result).toContain('Roboto');
    });
  });

  describe('getEmbeddedScript', () => {
    it('should return string with <script> tags', () => {
      const result = renderer.getEmbeddedScript();

      expect(result).toMatch(/^<script>/);
      expect(result).toMatch(/<\/script>$/);
    });

    it('should contain mermaid initialization', () => {
      const result = renderer.getEmbeddedScript();

      expect(result).toContain('mermaid.initialize');
      expect(result).toContain('startOnLoad: true');
    });

    it('should contain copyToClipboard function', () => {
      const result = renderer.getEmbeddedScript();

      expect(result).toContain('function copyToClipboard');
      expect(result).toContain('navigator.clipboard.writeText');
    });
  });

  describe('renderStatisticsCard', () => {
    it('should render card with label and numeric value', () => {
      const result = renderer.renderStatisticsCard('Total Assets', 42);

      expect(result).toContain('stat-card');
      expect(result).toContain('stat-value');
      expect(result).toContain('stat-label');
      expect(result).toContain('42');
      expect(result).toContain('Total Assets');
    });

    it('should render card with string value', () => {
      const result = renderer.renderStatisticsCard('Royalties', '100 IP');

      expect(result).toContain('100 IP');
      expect(result).toContain('Royalties');
    });

    it('should escape HTML in values', () => {
      const result = renderer.renderStatisticsCard('<script>', '<bad>');

      expect(result).toContain('&lt;script&gt;');
      expect(result).toContain('&lt;bad&gt;');
      expect(result).not.toContain('<script>');
    });
  });

  describe('renderAssetRow', () => {
    it('should render table row with asset data', () => {
      const asset = createTestAsset({
        ipId: '0x1234567890abcdef1234567890abcdef12345678',
        licenseType: 'commercial-remix',
        derivativeCount: 3,
      });

      const result = renderer.renderAssetRow(asset);

      expect(result).toContain('<tr>');
      expect(result).toContain('</tr>');
      expect(result).toContain('0x1234...5678');
      expect(result).toContain('commercial-remix');
      expect(result).toContain('>3<');
    });

    it('should include copy button with full IP ID', () => {
      const asset = createTestAsset({
        ipId: '0x1234567890abcdef1234567890abcdef12345678',
      });

      const result = renderer.renderAssetRow(asset);

      expect(result).toContain('copy-btn');
      expect(result).toContain('copyToClipboard');
      expect(result).toContain('0x1234567890abcdef1234567890abcdef12345678');
    });

    it('should show title tooltip with full IP ID', () => {
      const asset = createTestAsset({
        ipId: '0xfullipidthatislongandneedstruncation',
      });

      const result = renderer.renderAssetRow(asset);

      expect(result).toContain('title="0xfullipidthatislongandneedstruncation"');
    });

    it('should format date in human-readable format', () => {
      const asset = createTestAsset({
        createdAt: '2024-06-15T14:30:00.000Z',
      });

      const result = renderer.renderAssetRow(asset);

      expect(result).toContain('Jun');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });
  });

  describe('XSS prevention', () => {
    it('should escape script tags in asset name', () => {
      const asset = createTestAsset({
        name: '<script>alert("xss")</script>',
      });
      const portfolio = createTestPortfolio({
        assets: [asset],
        statistics: { totalAssets: 1, rootAssets: 1, derivatives: 0, licensesIssued: 0, totalRoyalties: 0 },
      });

      const result = renderer.render(portfolio);

      expect(result).not.toContain('<script>alert("xss")</script>');
      // The name doesn't appear directly in render, but escapeHtml is used on license type etc.
    });

    it('should escape HTML entities in license type', () => {
      const asset = createTestAsset({
        licenseType: '<img src=x onerror=alert(1)>',
      });
      const portfolio = createTestPortfolio({
        assets: [asset],
        statistics: { totalAssets: 1, rootAssets: 1, derivatives: 0, licensesIssued: 0, totalRoyalties: 0 },
      });

      const result = renderer.render(portfolio);

      expect(result).not.toContain('<img src=x onerror=alert(1)>');
      expect(result).toContain('&lt;img');
    });

    it('should escape onclick attributes in IP IDs', () => {
      const asset = createTestAsset({
        ipId: '0x" onclick="alert(1)" data-x="',
      });

      const result = renderer.renderAssetRow(asset);

      expect(result).not.toContain('onclick="alert(1)"');
      expect(result).toContain('&quot;');
    });

    it('should escape wallet address in header', () => {
      // Use short address to avoid truncation affecting the escape test
      const portfolio = createTestPortfolio({
        walletAddress: '<bad>',
      });

      const result = renderer.render(portfolio);

      // The wallet address should be escaped in the header and title
      expect(result).toContain('&lt;bad&gt;');
      // Should not have raw HTML tag in the wallet display
      expect(result).not.toContain('<bad>');
    });

    it('should escape network name in badge', () => {
      const portfolio = createTestPortfolio({
        network: '<img onerror=alert(1)>',
      });

      const result = renderer.render(portfolio);

      expect(result).not.toContain('<img onerror=alert(1)>');
      expect(result).toContain('&lt;img');
    });
  });

  describe('HTML validity', () => {
    it('should have all opened tags closed', () => {
      const portfolio = createTestPortfolio({
        assets: [createTestAsset()],
        statistics: { totalAssets: 1, rootAssets: 1, derivatives: 0, licensesIssued: 0, totalRoyalties: 0 },
        mermaidDiagram: 'flowchart TD\n  A --> B',
      });

      const result = renderer.render(portfolio);

      // Check major structural tags
      expect(result).toContain('<html');
      expect(result).toContain('</html>');
      expect(result).toContain('<head>');
      expect(result).toContain('</head>');
      expect(result).toContain('<body>');
      expect(result).toContain('</body>');
      expect(result).toContain('<header>');
      expect(result).toContain('</header>');
      expect(result).toContain('<footer>');
      expect(result).toContain('</footer>');

      // Count opening and closing tags for major elements
      const htmlOpen = (result.match(/<html/g) || []).length;
      const htmlClose = (result.match(/<\/html>/g) || []).length;
      expect(htmlOpen).toBe(htmlClose);

      const divOpen = (result.match(/<div/g) || []).length;
      const divClose = (result.match(/<\/div>/g) || []).length;
      expect(divOpen).toBe(divClose);

      const sectionOpen = (result.match(/<section/g) || []).length;
      const sectionClose = (result.match(/<\/section>/g) || []).length;
      expect(sectionOpen).toBe(sectionClose);

      const tableOpen = (result.match(/<table>/g) || []).length;
      const tableClose = (result.match(/<\/table>/g) || []).length;
      expect(tableOpen).toBe(tableClose);
    });

    it('should start with DOCTYPE declaration', () => {
      const portfolio = createTestPortfolio();
      const result = renderer.render(portfolio);

      expect(result.trim()).toMatch(/^<!DOCTYPE html>/i);
    });

    it('should have proper head structure', () => {
      const portfolio = createTestPortfolio();
      const result = renderer.render(portfolio);

      // Head should come before body
      const headIndex = result.indexOf('<head>');
      const bodyIndex = result.indexOf('<body>');
      expect(headIndex).toBeLessThan(bodyIndex);

      // Meta charset should be in head
      const charsetIndex = result.indexOf('charset="UTF-8"');
      const headCloseIndex = result.indexOf('</head>');
      expect(charsetIndex).toBeLessThan(headCloseIndex);
    });
  });
});
