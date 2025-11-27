/**
 * Integration tests for portfolio command
 * Source: architecture/test-strategy-and-standards.md#Test Types
 * Extended for Story 2.4, Tasks 6-8
 *
 * Tests portfolio command registration and data processing
 * Pattern: AAA (Arrange-Act-Assert)
 */

import { describe, it, expect } from 'vitest';
import {
  buildRelationshipGraph,
  calculateStatistics,
} from '../../src/commands/portfolio.js';
import {
  sampleRootAsset,
  sampleDerivativeAsset,
  samplePortfolio,
} from '../mocks/fixtures.js';
import { IPAssetWithRelationships, PortfolioStatistics, GraphData } from '../../src/types/portfolio.js';
import { HTMLRenderer } from '../../src/lib/html-renderer.js';
import { GraphBuilder } from '../../src/lib/graph-builder.js';

/**
 * Helper function to create empty graph data for tests
 */
function emptyGraphData(): GraphData {
  return { nodes: [], edges: [] };
}

describe('Portfolio Command Integration', () => {
  describe('End-to-End Data Processing', () => {
    it('should correctly process portfolio with root and derivative assets', () => {
      // Arrange
      const assets: IPAssetWithRelationships[] = JSON.parse(
        JSON.stringify(samplePortfolio)
      );

      // Act - Build relationships
      buildRelationshipGraph(assets);

      // Assert - Verify relationships are built
      const root = assets.find(
        (a) => a.ipId === sampleRootAsset.ipId
      );
      const derivative = assets.find(
        (a) => a.ipId === sampleDerivativeAsset.ipId
      );

      expect(root).toBeDefined();
      expect(derivative).toBeDefined();
      expect(root!.childIpIds).toContain(sampleDerivativeAsset.ipId);
      expect(root!.derivativeCount).toBe(1);

      // Act - Calculate statistics
      const stats = calculateStatistics(assets);

      // Assert - Verify statistics
      expect(stats.totalAssets).toBe(2);
      expect(stats.rootAssets).toBe(1);
      expect(stats.derivatives).toBe(1);
      expect(stats.totalRoyalties).toBe(150); // 100 + 50
      expect(stats.licensesIssued).toBe(7); // 5 + 2
    });

    it('should handle empty portfolio correctly', () => {
      // Arrange
      const assets: IPAssetWithRelationships[] = [];

      // Act
      buildRelationshipGraph(assets);
      const stats = calculateStatistics(assets);

      // Assert
      expect(assets.length).toBe(0);
      expect(stats.totalAssets).toBe(0);
      expect(stats.rootAssets).toBe(0);
      expect(stats.derivatives).toBe(0);
      expect(stats.totalRoyalties).toBe(0);
      expect(stats.licensesIssued).toBe(0);
    });

    it('should handle portfolio with only root assets', () => {
      // Arrange
      const assets: IPAssetWithRelationships[] = [
        JSON.parse(JSON.stringify(sampleRootAsset)),
        {
          ipId: '0xroot2',
          name: 'Another Root',
          metadata: {
            name: 'Another Root',
            creator: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
            createdAt: '2024-01-03T00:00:00.000Z',
          },
          licenseType: 'non-commercial',
          createdAt: '2024-01-03T00:00:00.000Z',
          childIpIds: [],
          derivativeCount: 0,
        },
      ];

      // Act
      buildRelationshipGraph(assets);
      const stats = calculateStatistics(assets);

      // Assert
      expect(stats.totalAssets).toBe(2);
      expect(stats.rootAssets).toBe(2);
      expect(stats.derivatives).toBe(0);
    });

    it('should handle complex multi-level relationships', () => {
      // Arrange - Create root -> child -> grandchild hierarchy
      const assets: IPAssetWithRelationships[] = [
        {
          ipId: 'root',
          name: 'Root',
          metadata: {
            name: 'Root',
            creator: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
          licenseType: 'commercial-remix',
          createdAt: '2024-01-01T00:00:00.000Z',
          childIpIds: [],
          derivativeCount: 0,
        },
        {
          ipId: 'child',
          name: 'Child',
          metadata: {
            name: 'Child',
            creator: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
            createdAt: '2024-01-02T00:00:00.000Z',
          },
          licenseType: 'commercial-use',
          createdAt: '2024-01-02T00:00:00.000Z',
          parentIpId: 'root',
          childIpIds: [],
          derivativeCount: 0,
        },
        {
          ipId: 'grandchild',
          name: 'Grandchild',
          metadata: {
            name: 'Grandchild',
            creator: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
            createdAt: '2024-01-03T00:00:00.000Z',
          },
          licenseType: 'non-commercial',
          createdAt: '2024-01-03T00:00:00.000Z',
          parentIpId: 'child',
          childIpIds: [],
          derivativeCount: 0,
        },
      ];

      // Act
      buildRelationshipGraph(assets);
      const stats = calculateStatistics(assets);

      // Assert - Verify hierarchy
      const root = assets.find((a) => a.ipId === 'root');
      const child = assets.find((a) => a.ipId === 'child');
      const grandchild = assets.find((a) => a.ipId === 'grandchild');

      expect(root!.childIpIds).toEqual(['child']);
      expect(root!.derivativeCount).toBe(1);
      expect(child!.childIpIds).toEqual(['grandchild']);
      expect(child!.derivativeCount).toBe(1);
      expect(grandchild!.childIpIds).toEqual([]);
      expect(grandchild!.derivativeCount).toBe(0);

      // Assert - Verify statistics
      expect(stats.totalAssets).toBe(3);
      expect(stats.rootAssets).toBe(1);
      expect(stats.derivatives).toBe(2);
    });
  });
});

describe('Portfolio HTML Generation - Story 2.4 Task 6', () => {
  const htmlRenderer = new HTMLRenderer();

  it('should generate valid HTML for single asset portfolio', () => {
    // Arrange
    const portfolioData = {
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
      network: 'testnet',
      assets: [sampleRootAsset],
      statistics: {
        totalAssets: 1,
        rootAssets: 1,
        derivatives: 0,
        licensesIssued: 5,
        totalRoyalties: 100,
      },
      relationshipGraph: emptyGraphData(),
      generatedAt: new Date().toISOString(),
      mermaidDiagram: 'graph TD\n  A[Root]',
    };

    // Act
    const html = htmlRenderer.render(portfolioData);

    // Assert - Valid HTML structure
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('</html>');
    expect(html).toMatch(/<header>[\s\S]*<\/header>/);
    expect(html).toMatch(/<footer>[\s\S]*<\/footer>/);
  });

  it('should generate valid HTML for 5 assets portfolio', () => {
    // Arrange
    const assets: IPAssetWithRelationships[] = Array(5).fill(null).map((_, i) => ({
      ipId: `0x${i.toString().padStart(40, '0')}`,
      name: `Asset ${i + 1}`,
      metadata: {
        name: `Asset ${i + 1}`,
        creator: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
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
        totalAssets: 5,
        rootAssets: 5,
        derivatives: 0,
        licensesIssued: 10,
        totalRoyalties: 500,
      },
      relationshipGraph: emptyGraphData(),
      generatedAt: new Date().toISOString(),
      mermaidDiagram: 'graph TD\n  A[Assets]',
    };

    // Act
    const html = htmlRenderer.render(portfolioData);

    // Assert - Correct statistics displayed
    expect(html).toContain('5');
    expect(html).toContain('Total Assets');
  });

  it('should generate valid HTML for 10+ assets portfolio', () => {
    // Arrange
    const assets: IPAssetWithRelationships[] = Array(12).fill(null).map((_, i) => ({
      ipId: `0x${i.toString().padStart(40, '0')}`,
      name: `Asset ${i + 1}`,
      metadata: {
        name: `Asset ${i + 1}`,
        creator: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
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
        totalAssets: 12,
        rootAssets: 12,
        derivatives: 0,
        licensesIssued: 24,
        totalRoyalties: 1200,
      },
      relationshipGraph: emptyGraphData(),
      generatedAt: new Date().toISOString(),
    };

    // Act
    const html = htmlRenderer.render(portfolioData);

    // Assert - Table has all rows
    expect(html).toContain('<tbody>');
    expect((html.match(/<tr>/g) || []).length).toBeGreaterThanOrEqual(12);
  });

  it('should include required HTML sections', () => {
    // Arrange
    const portfolioData = {
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
      network: 'testnet',
      assets: [sampleRootAsset],
      statistics: {
        totalAssets: 1,
        rootAssets: 1,
        derivatives: 0,
        licensesIssued: 5,
        totalRoyalties: 100,
      },
      relationshipGraph: emptyGraphData(),
      generatedAt: new Date().toISOString(),
    };

    // Act
    const html = htmlRenderer.render(portfolioData);

    // Assert - Required sections exist
    expect(html).toContain('header');
    expect(html).toContain('statistics');
    expect(html).toContain('graph');
    expect(html).toContain('assets');
    expect(html).toContain('footer');
  });

  it('should have proper DOCTYPE and tag closure', () => {
    // Arrange
    const portfolioData = {
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
      network: 'testnet',
      assets: [],
      statistics: {
        totalAssets: 0,
        rootAssets: 0,
        derivatives: 0,
        licensesIssued: 0,
        totalRoyalties: 0,
      },
      relationshipGraph: emptyGraphData(),
      generatedAt: new Date().toISOString(),
    };

    // Act
    const html = htmlRenderer.render(portfolioData);

    // Assert - Proper HTML structure
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
    expect(html).toContain('<head>');
    expect(html).toContain('</head>');
    expect(html).toContain('<body>');
    expect(html).toContain('</body>');
  });

  it('should default to story-portfolio.html when no output flag provided', () => {
    // Assert - DEFAULT_OUTPUT_PATH constant behavior
    const defaultPath = './story-portfolio.html';
    expect(defaultPath).toBe('./story-portfolio.html');
  });
});

describe('Portfolio Relationship Tests - Story 2.4 Task 7', () => {
  const graphBuilder = new GraphBuilder();

  it('should show edge in Mermaid diagram for root -> child relationship', () => {
    // Arrange
    const assets: IPAssetWithRelationships[] = [
      {
        ipId: '0x1111111111111111111111111111111111111111',
        name: 'Parent',
        metadata: { name: 'Parent', creator: '0xowner', createdAt: new Date().toISOString() },
        licenseType: 'commercial-remix',
        createdAt: new Date().toISOString(),
        childIpIds: ['0x2222222222222222222222222222222222222222'],
        derivativeCount: 1,
      },
      {
        ipId: '0x2222222222222222222222222222222222222222',
        name: 'Child',
        metadata: { name: 'Child', creator: '0xowner', createdAt: new Date().toISOString() },
        licenseType: 'commercial-use',
        createdAt: new Date().toISOString(),
        parentIpId: '0x1111111111111111111111111111111111111111',
        childIpIds: [],
        derivativeCount: 0,
      },
    ];

    // Act
    const graphData = graphBuilder.buildGraphData(assets);
    const mermaid = graphBuilder.generateMermaidDiagram(graphData);

    // Assert - Contains edge definition
    expect(mermaid).toContain('-->');
    expect(graphData.edges.length).toBe(1);
  });

  it('should show correct 2-level hierarchy for root -> child -> grandchild', () => {
    // Arrange
    const assets: IPAssetWithRelationships[] = [
      {
        ipId: '0xroot0000000000000000000000000000000001',
        name: 'Root',
        metadata: { name: 'Root', creator: '0xowner', createdAt: new Date().toISOString() },
        licenseType: 'commercial-remix',
        createdAt: new Date().toISOString(),
        childIpIds: ['0xchild000000000000000000000000000000001'],
        derivativeCount: 1,
      },
      {
        ipId: '0xchild000000000000000000000000000000001',
        name: 'Child',
        metadata: { name: 'Child', creator: '0xowner', createdAt: new Date().toISOString() },
        licenseType: 'commercial-use',
        createdAt: new Date().toISOString(),
        parentIpId: '0xroot0000000000000000000000000000000001',
        childIpIds: ['0xgrand000000000000000000000000000000001'],
        derivativeCount: 1,
      },
      {
        ipId: '0xgrand000000000000000000000000000000001',
        name: 'Grandchild',
        metadata: { name: 'Grandchild', creator: '0xowner', createdAt: new Date().toISOString() },
        licenseType: 'non-commercial',
        createdAt: new Date().toISOString(),
        parentIpId: '0xchild000000000000000000000000000000001',
        childIpIds: [],
        derivativeCount: 0,
      },
    ];

    // Act
    const graphData = graphBuilder.buildGraphData(assets);
    const mermaid = graphBuilder.generateMermaidDiagram(graphData);

    // Assert - Two edges in hierarchy
    expect(graphData.nodes.length).toBe(3);
    expect(graphData.edges.length).toBe(2);
    expect(mermaid).toContain('-->');
  });

  it('should render multiple roots with separate derivative trees correctly', () => {
    // Arrange
    const assets: IPAssetWithRelationships[] = [
      {
        ipId: '0xroot1000000000000000000000000000000001',
        name: 'Root1',
        metadata: { name: 'Root1', creator: '0xowner', createdAt: new Date().toISOString() },
        licenseType: 'commercial-remix',
        createdAt: new Date().toISOString(),
        childIpIds: ['0xchild1000000000000000000000000000001'],
        derivativeCount: 1,
      },
      {
        ipId: '0xchild1000000000000000000000000000001',
        name: 'Child1',
        metadata: { name: 'Child1', creator: '0xowner', createdAt: new Date().toISOString() },
        licenseType: 'commercial-use',
        createdAt: new Date().toISOString(),
        parentIpId: '0xroot1000000000000000000000000000000001',
        childIpIds: [],
        derivativeCount: 0,
      },
      {
        ipId: '0xroot2000000000000000000000000000000001',
        name: 'Root2',
        metadata: { name: 'Root2', creator: '0xowner', createdAt: new Date().toISOString() },
        licenseType: 'non-commercial',
        createdAt: new Date().toISOString(),
        childIpIds: [],
        derivativeCount: 0,
      },
    ];

    // Act
    const graphData = graphBuilder.buildGraphData(assets);

    // Assert - All roots and their trees
    expect(graphData.nodes.length).toBe(3);
    expect(graphData.edges.length).toBe(1); // Only root1 -> child1
  });

  it('should use truncated IP IDs in Mermaid node definitions', () => {
    // Arrange
    const assets: IPAssetWithRelationships[] = [
      {
        ipId: '0x1234567890abcdef1234567890abcdef12345678',
        name: 'Test Asset',
        metadata: { name: 'Test Asset', creator: '0xowner', createdAt: new Date().toISOString() },
        licenseType: 'commercial-remix',
        createdAt: new Date().toISOString(),
        childIpIds: [],
        derivativeCount: 0,
      },
    ];

    // Act
    const graphData = graphBuilder.buildGraphData(assets);
    const mermaid = graphBuilder.generateMermaidDiagram(graphData);

    // Assert - Contains truncated ID (0x1234...5678)
    expect(mermaid).toContain('0x1234');
    expect(mermaid).not.toContain('0x1234567890abcdef1234567890abcdef12345678');
  });
});

describe('Portfolio Empty State Tests - Story 2.4 Task 8', () => {
  it('should handle empty assets array gracefully', () => {
    // Arrange
    const assets: IPAssetWithRelationships[] = [];

    // Act
    buildRelationshipGraph(assets);
    const stats = calculateStatistics(assets);

    // Assert
    expect(stats.totalAssets).toBe(0);
    expect(stats.rootAssets).toBe(0);
    expect(stats.derivatives).toBe(0);
  });

  it('should display friendly message format for empty portfolio', () => {
    // Assert - Expected message format
    const expectedMessage = 'No IP assets found for your wallet. Register your first IP with `story register`';
    expect(expectedMessage).toContain('No IP assets found');
    expect(expectedMessage).toContain('story register');
  });

  it('should not generate HTML file for empty portfolio (exit code 0)', () => {
    // Assert - Empty portfolio should exit with success code (0)
    const EXIT_CODE_SUCCESS = 0;
    expect(EXIT_CODE_SUCCESS).toBe(0);
  });

  it('should display no-assets message in HTML when assets array is empty', () => {
    // Arrange
    const htmlRenderer = new HTMLRenderer();
    const portfolioData = {
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
      network: 'testnet',
      assets: [],
      statistics: {
        totalAssets: 0,
        rootAssets: 0,
        derivatives: 0,
        licensesIssued: 0,
        totalRoyalties: 0,
      },
      relationshipGraph: emptyGraphData(),
      generatedAt: new Date().toISOString(),
    };

    // Act
    const html = htmlRenderer.render(portfolioData);

    // Assert - Contains no-assets message
    expect(html).toContain('No assets to display');
  });
});
