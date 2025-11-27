/**
 * Edge Case Integration Tests
 * Tests for handling edge cases and boundary conditions
 * Source: Story 2.4, Task 9
 */

import { describe, it, expect } from 'vitest';
import { HTMLRenderer, escapeHtml } from '../../src/lib/html-renderer.js';
import { GraphBuilder } from '../../src/lib/graph-builder.js';
import {
  buildRelationshipGraph,
  calculateStatistics,
} from '../../src/commands/portfolio.js';
import {
  IPAssetWithRelationships,
  GraphData,
} from '../../src/types/portfolio.js';

/**
 * Helper function to create empty graph data for tests
 */
function emptyGraphData(): GraphData {
  return { nodes: [], edges: [] };
}

describe('Edge Case Tests - Story 2.4 Task 9', () => {
  describe('Long Asset Names', () => {
    it('should handle asset name with 500+ characters', () => {
      // Arrange
      const longName = 'A'.repeat(500);
      const htmlRenderer = new HTMLRenderer();
      const asset: IPAssetWithRelationships = {
        ipId: '0x1234567890abcdef1234567890abcdef12345678',
        name: longName,
        metadata: {
          name: longName,
          creator: '0xowner',
          createdAt: new Date().toISOString(),
        },
        licenseType: 'commercial-remix',
        createdAt: new Date().toISOString(),
        childIpIds: [],
        derivativeCount: 0,
      };

      const portfolioData = {
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        network: 'testnet',
        assets: [asset],
        statistics: {
          totalAssets: 1,
          rootAssets: 1,
          derivatives: 0,
          licensesIssued: 0,
          totalRoyalties: 0,
        },
        relationshipGraph: emptyGraphData(),
        generatedAt: new Date().toISOString(),
      };

      // Act
      const html = htmlRenderer.render(portfolioData);

      // Assert - Should render without error
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('</html>');
    });
  });

  describe('XSS Prevention', () => {
    it('should properly escape <script>alert("xss")</script> in asset name', () => {
      // Arrange
      const xssName = '<script>alert("xss")</script>';
      const escaped = escapeHtml(xssName);

      // Assert - Script tags should be escaped
      expect(escaped).not.toContain('<script>');
      expect(escaped).not.toContain('</script>');
      expect(escaped).toContain('&lt;script&gt;');
      expect(escaped).toContain('&lt;/script&gt;');
    });

    it('should properly escape onclick attribute in asset metadata', () => {
      // Arrange
      const maliciousAttr = 'onclick="alert(\'xss\')"';
      const escaped = escapeHtml(maliciousAttr);

      // Assert - Quote characters should be escaped
      expect(escaped).toContain('&quot;');
      expect(escaped).toContain('&#39;');
    });

    it('should render XSS payload safely in HTML output', () => {
      // Arrange
      const xssName = '<script>alert("xss")</script>';
      const htmlRenderer = new HTMLRenderer();
      const asset: IPAssetWithRelationships = {
        ipId: '0x1234567890abcdef1234567890abcdef12345678',
        name: xssName,
        metadata: {
          name: xssName,
          creator: '0xowner',
          createdAt: new Date().toISOString(),
        },
        licenseType: 'commercial-remix',
        createdAt: new Date().toISOString(),
        childIpIds: [],
        derivativeCount: 0,
      };

      const portfolioData = {
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        network: 'testnet',
        assets: [asset],
        statistics: {
          totalAssets: 1,
          rootAssets: 1,
          derivatives: 0,
          licensesIssued: 0,
          totalRoyalties: 0,
        },
        relationshipGraph: emptyGraphData(),
        generatedAt: new Date().toISOString(),
      };

      // Act
      const html = htmlRenderer.render(portfolioData);

      // Assert - XSS should be escaped
      expect(html).not.toContain('<script>alert');
    });
  });

  describe('Unicode Characters', () => {
    it('should handle asset name with emojis without errors', () => {
      // Arrange
      const emojiName = '🎨 Art Collection 🖼️';
      const htmlRenderer = new HTMLRenderer();
      const asset: IPAssetWithRelationships = {
        ipId: '0x1234567890abcdef1234567890abcdef12345678',
        name: emojiName,
        metadata: {
          name: emojiName,
          creator: '0xowner',
          createdAt: new Date().toISOString(),
        },
        licenseType: 'commercial-remix',
        createdAt: new Date().toISOString(),
        childIpIds: [],
        derivativeCount: 0,
      };

      const portfolioData = {
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        network: 'testnet',
        assets: [asset],
        statistics: {
          totalAssets: 1,
          rootAssets: 1,
          derivatives: 0,
          licensesIssued: 0,
          totalRoyalties: 0,
        },
        relationshipGraph: emptyGraphData(),
        generatedAt: new Date().toISOString(),
      };

      // Act
      const html = htmlRenderer.render(portfolioData);

      // Assert - Should render without error (HTML table shows IP IDs, not names)
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('</html>');
      expect(html).toContain('commercial-remix');
    });

    it('should handle asset name with CJK characters without errors', () => {
      // Arrange
      const cjkName = '知的財産アセット 知识产权资产';
      const htmlRenderer = new HTMLRenderer();
      const asset: IPAssetWithRelationships = {
        ipId: '0x1234567890abcdef1234567890abcdef12345678',
        name: cjkName,
        metadata: {
          name: cjkName,
          creator: '0xowner',
          createdAt: new Date().toISOString(),
        },
        licenseType: 'commercial-remix',
        createdAt: new Date().toISOString(),
        childIpIds: [],
        derivativeCount: 0,
      };

      const portfolioData = {
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        network: 'testnet',
        assets: [asset],
        statistics: {
          totalAssets: 1,
          rootAssets: 1,
          derivatives: 0,
          licensesIssued: 0,
          totalRoyalties: 0,
        },
        relationshipGraph: emptyGraphData(),
        generatedAt: new Date().toISOString(),
      };

      // Act
      const html = htmlRenderer.render(portfolioData);

      // Assert - Should render without error (HTML table shows IP IDs, not names)
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('</html>');
      expect(html).toContain('commercial-remix');
    });

    it('should correctly escape unicode strings', () => {
      // Arrange - Test escapeHtml with unicode
      const unicodeText = '🎨 Test < > & " \'';
      const escaped = escapeHtml(unicodeText);

      // Assert - Unicode preserved, special chars escaped
      expect(escaped).toContain('🎨');
      expect(escaped).toContain('&lt;');
      expect(escaped).toContain('&gt;');
      expect(escaped).toContain('&amp;');
    });
  });

  describe('Large Portfolio Performance', () => {
    it('should generate HTML for 50+ assets in reasonable time (<5 seconds)', () => {
      // Arrange
      const assets: IPAssetWithRelationships[] = Array(50).fill(null).map((_, i) => ({
        ipId: `0x${i.toString(16).padStart(40, '0')}`,
        name: `Asset ${i + 1}`,
        metadata: {
          name: `Asset ${i + 1}`,
          creator: '0xowner',
          createdAt: new Date().toISOString(),
        },
        licenseType: 'commercial-remix',
        createdAt: new Date().toISOString(),
        childIpIds: [],
        derivativeCount: 0,
      }));

      const portfolioData = {
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        network: 'testnet',
        assets,
        statistics: {
          totalAssets: 50,
          rootAssets: 50,
          derivatives: 0,
          licensesIssued: 0,
          totalRoyalties: 0,
        },
        relationshipGraph: emptyGraphData(),
        generatedAt: new Date().toISOString(),
      };

      const htmlRenderer = new HTMLRenderer();

      // Act
      const startTime = performance.now();
      const html = htmlRenderer.render(portfolioData);
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Assert - Performance acceptable (<5 seconds)
      expect(executionTime).toBeLessThan(5000);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('50');
    });
  });

  describe('Deep Derivative Trees', () => {
    it('should handle 5+ level deep derivative tree', () => {
      // Arrange - Create a chain: root -> child -> grandchild -> great-grandchild -> ...
      const assets: IPAssetWithRelationships[] = [];
      let parentId: string | undefined = undefined;

      for (let i = 0; i < 6; i++) {
        const ipId = `0x${i.toString().padStart(40, '0')}`;
        assets.push({
          ipId,
          name: `Level ${i}`,
          metadata: {
            name: `Level ${i}`,
            creator: '0xowner',
            createdAt: new Date().toISOString(),
          },
          licenseType: 'commercial-remix',
          createdAt: new Date().toISOString(),
          parentIpId: parentId,
          childIpIds: [],
          derivativeCount: 0,
        });
        parentId = ipId;
      }

      // Act
      buildRelationshipGraph(assets);
      const graphBuilder = new GraphBuilder();
      const graphData = graphBuilder.buildGraphData(assets);
      const mermaid = graphBuilder.generateMermaidDiagram(graphData);

      // Assert - Should have 5 edges for 6-level chain
      expect(graphData.nodes.length).toBe(6);
      expect(graphData.edges.length).toBe(5);
      expect(mermaid).toContain('-->');
    });
  });

  describe('Wide Derivative Trees', () => {
    it('should handle 10+ children per node', () => {
      // Arrange - Create a root with 10 direct children
      const rootIpId = '0x' + '0'.repeat(40);
      const assets: IPAssetWithRelationships[] = [
        {
          ipId: rootIpId,
          name: 'Root',
          metadata: {
            name: 'Root',
            creator: '0xowner',
            createdAt: new Date().toISOString(),
          },
          licenseType: 'commercial-remix',
          createdAt: new Date().toISOString(),
          childIpIds: [],
          derivativeCount: 0,
        },
      ];

      // Add 10 children
      for (let i = 1; i <= 10; i++) {
        assets.push({
          ipId: `0x${i.toString().padStart(40, '0')}`,
          name: `Child ${i}`,
          metadata: {
            name: `Child ${i}`,
            creator: '0xowner',
            createdAt: new Date().toISOString(),
          },
          licenseType: 'commercial-use',
          createdAt: new Date().toISOString(),
          parentIpId: rootIpId,
          childIpIds: [],
          derivativeCount: 0,
        });
      }

      // Act
      buildRelationshipGraph(assets);
      const graphBuilder = new GraphBuilder();
      const graphData = graphBuilder.buildGraphData(assets);
      const mermaid = graphBuilder.generateMermaidDiagram(graphData);

      // Assert - Should have 10 edges
      expect(graphData.nodes.length).toBe(11);
      expect(graphData.edges.length).toBe(10);
      expect(assets[0].childIpIds.length).toBe(10);
      expect(mermaid).toContain('-->');
    });
  });

  describe('Special Characters in HTML Attributes', () => {
    it('should escape double quotes in asset data', () => {
      // Arrange
      const nameWithQuotes = 'Asset with "quotes" in name';
      const escaped = escapeHtml(nameWithQuotes);

      // Assert
      expect(escaped).toContain('&quot;');
      expect(escaped).not.toContain('"quotes"');
    });

    it('should escape single quotes in asset data', () => {
      // Arrange
      const nameWithQuotes = "Asset with 'single quotes' in name";
      const escaped = escapeHtml(nameWithQuotes);

      // Assert
      expect(escaped).toContain('&#39;');
    });

    it('should escape ampersands in asset data', () => {
      // Arrange
      const nameWithAmpersand = 'Asset A & Asset B';
      const escaped = escapeHtml(nameWithAmpersand);

      // Assert
      expect(escaped).toContain('&amp;');
      expect(escaped).not.toContain(' & ');
    });
  });
});
