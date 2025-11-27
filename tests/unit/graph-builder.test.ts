/**
 * Unit tests for GraphBuilder component
 * Tests graph data transformation and visualization generation
 */

import { describe, it, expect } from 'vitest';
import {
  GraphBuilder,
  truncateIpId,
  toMermaidNodeId,
} from '../../src/lib/graph-builder.js';
import { IPAssetWithRelationships } from '../../src/types/portfolio.js';

describe('truncateIpId', () => {
  it('should return short IDs unchanged (<=12 chars)', () => {
    expect(truncateIpId('0x123')).toBe('0x123');
    expect(truncateIpId('0x12345678')).toBe('0x12345678');
    expect(truncateIpId('shortId')).toBe('shortId');
  });

  it('should truncate long IDs to 0x1234...5678 format', () => {
    const longId = '0x1234567890abcdef1234567890abcdef12345678';
    expect(truncateIpId(longId)).toBe('0x1234...5678');
  });

  it('should handle exactly 12 character IDs', () => {
    expect(truncateIpId('123456789012')).toBe('123456789012');
  });

  it('should handle 13 character IDs (just over threshold)', () => {
    expect(truncateIpId('1234567890123')).toBe('123456...0123');
  });
});

describe('toMermaidNodeId', () => {
  it('should remove 0x prefix and create alphanumeric ID', () => {
    expect(toMermaidNodeId('0x1234567890abcdef')).toBe('node_12345678');
  });

  it('should handle IDs without 0x prefix', () => {
    expect(toMermaidNodeId('abcdef1234567890')).toBe('node_abcdef12');
  });

  it('should take first 8 chars for uniqueness', () => {
    const id1 = '0x1234567890000000';
    const id2 = '0x12345678ffffffff';
    expect(toMermaidNodeId(id1)).toBe(toMermaidNodeId(id2));
  });
});

describe('GraphBuilder', () => {
  const graphBuilder = new GraphBuilder();

  describe('buildGraphData', () => {
    it('should return empty graph for empty assets array', () => {
      const result = graphBuilder.buildGraphData([]);
      expect(result).toEqual({ nodes: [], edges: [] });
    });

    it('should create single root node for single asset without parent', () => {
      const assets: IPAssetWithRelationships[] = [
        {
          ipId: '0x1234567890abcdef1234567890abcdef12345678',
          name: 'Root Asset',
          metadata: { name: 'Root Asset', creator: '0x123', createdAt: '2024-01-01' },
          licenseType: 'commercial-remix',
          createdAt: '2024-01-01T00:00:00.000Z',
          childIpIds: [],
          derivativeCount: 0,
        },
      ];

      const result = graphBuilder.buildGraphData(assets);

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].type).toBe('root');
      expect(result.nodes[0].styleClass).toBe('root');
      expect(result.edges).toHaveLength(0);
    });

    it('should create correct nodes and edges for parent-child pair', () => {
      const parentId = '0x1234567890abcdef1234567890abcdef12345678';
      const childId = '0xabcdef1234567890abcdef1234567890abcdef12';

      const assets: IPAssetWithRelationships[] = [
        {
          ipId: parentId,
          name: 'Parent Asset',
          metadata: { name: 'Parent Asset', creator: '0x123', createdAt: '2024-01-01' },
          licenseType: 'commercial-remix',
          createdAt: '2024-01-01T00:00:00.000Z',
          childIpIds: [childId],
          derivativeCount: 1,
        },
        {
          ipId: childId,
          name: 'Child Asset',
          metadata: { name: 'Child Asset', creator: '0x123', createdAt: '2024-01-02' },
          licenseType: 'commercial-use',
          createdAt: '2024-01-02T00:00:00.000Z',
          parentIpId: parentId,
          childIpIds: [],
          derivativeCount: 0,
        },
      ];

      const result = graphBuilder.buildGraphData(assets);

      expect(result.nodes).toHaveLength(2);
      expect(result.edges).toHaveLength(1);

      // Parent should be root
      const parentNode = result.nodes.find((n) => n.id === parentId);
      expect(parentNode?.type).toBe('root');

      // Child should be leaf (derivative with no children)
      const childNode = result.nodes.find((n) => n.id === childId);
      expect(childNode?.type).toBe('leaf');

      // Edge should connect parent to child
      expect(result.edges[0].source).toBe(parentId);
      expect(result.edges[0].target).toBe(childId);
      expect(result.edges[0].type).toBe('derivative');
    });

    it('should handle complex tree with multiple levels', () => {
      const rootId = '0x0000000000000000000000000000000000000001';
      const midId = '0x0000000000000000000000000000000000000002';
      const leafId = '0x0000000000000000000000000000000000000003';

      const assets: IPAssetWithRelationships[] = [
        {
          ipId: rootId,
          name: 'Root',
          metadata: { name: 'Root', creator: '0x123', createdAt: '2024-01-01' },
          licenseType: 'commercial-remix',
          createdAt: '2024-01-01T00:00:00.000Z',
          childIpIds: [midId],
          derivativeCount: 1,
        },
        {
          ipId: midId,
          name: 'Middle',
          metadata: { name: 'Middle', creator: '0x123', createdAt: '2024-01-02' },
          licenseType: 'commercial-use',
          createdAt: '2024-01-02T00:00:00.000Z',
          parentIpId: rootId,
          childIpIds: [leafId],
          derivativeCount: 1,
        },
        {
          ipId: leafId,
          name: 'Leaf',
          metadata: { name: 'Leaf', creator: '0x123', createdAt: '2024-01-03' },
          licenseType: 'non-commercial',
          createdAt: '2024-01-03T00:00:00.000Z',
          parentIpId: midId,
          childIpIds: [],
          derivativeCount: 0,
        },
      ];

      const result = graphBuilder.buildGraphData(assets);

      expect(result.nodes).toHaveLength(3);
      expect(result.edges).toHaveLength(2);

      const rootNode = result.nodes.find((n) => n.id === rootId);
      const midNode = result.nodes.find((n) => n.id === midId);
      const leafNode = result.nodes.find((n) => n.id === leafId);

      expect(rootNode?.type).toBe('root');
      expect(midNode?.type).toBe('derivative');
      expect(leafNode?.type).toBe('leaf');
    });

    it('should populate all GraphNode properties correctly', () => {
      const assets: IPAssetWithRelationships[] = [
        {
          ipId: '0x1234567890abcdef1234567890abcdef12345678',
          name: 'Test Asset',
          metadata: { name: 'Test Asset', creator: '0x123', createdAt: '2024-01-01' },
          licenseType: 'commercial-remix',
          createdAt: '2024-01-01T00:00:00.000Z',
          childIpIds: [],
          derivativeCount: 0,
        },
      ];

      const result = graphBuilder.buildGraphData(assets);
      const node = result.nodes[0];

      expect(node.id).toBe('0x1234567890abcdef1234567890abcdef12345678');
      expect(node.label).toBe('0x1234...5678'); // truncated
      expect(node.fullIpId).toBe('0x1234567890abcdef1234567890abcdef12345678');
      expect(node.licenseType).toBe('commercial-remix');
      expect(node.createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(node.styleClass).toBe('root');
    });
  });

  describe('generateMermaidDiagram', () => {
    it('should return minimal flowchart for empty graph', () => {
      const result = graphBuilder.generateMermaidDiagram({ nodes: [], edges: [] });

      expect(result).toContain('flowchart TD');
      expect(result).toContain('classDef root');
      expect(result).toContain('classDef derivative');
      expect(result).toContain('classDef leaf');
    });

    it('should generate correct node declaration for single node', () => {
      const graphData = {
        nodes: [
          {
            id: '0x1234567890abcdef1234567890abcdef12345678',
            label: '0x1234...5678',
            type: 'root',
            styleClass: 'root',
            licenseType: 'commercial-remix',
            createdAt: '2024-01-01T00:00:00.000Z',
            fullIpId: '0x1234567890abcdef1234567890abcdef12345678',
          },
        ],
        edges: [],
      };

      const result = graphBuilder.generateMermaidDiagram(graphData);

      expect(result).toContain('flowchart TD');
      expect(result).toContain('node_12345678[0x1234...5678]:::root');
    });

    it('should generate correct edge syntax for parent-child', () => {
      const parentId = '0x1234567890abcdef1234567890abcdef12345678';
      const childId = '0xabcdef1234567890abcdef1234567890abcdef12';

      const graphData = {
        nodes: [
          {
            id: parentId,
            label: '0x1234...5678',
            type: 'root',
            styleClass: 'root',
            licenseType: 'commercial-remix',
            createdAt: '2024-01-01T00:00:00.000Z',
            fullIpId: parentId,
          },
          {
            id: childId,
            label: '0xabcd...ef12',
            type: 'leaf',
            styleClass: 'leaf',
            licenseType: 'commercial-use',
            createdAt: '2024-01-02T00:00:00.000Z',
            fullIpId: childId,
          },
        ],
        edges: [
          {
            source: parentId,
            target: childId,
            type: 'derivative',
          },
        ],
      };

      const result = graphBuilder.generateMermaidDiagram(graphData);

      expect(result).toContain('node_12345678 --> node_abcdef12');
    });

    it('should respect direction config', () => {
      const graphData = { nodes: [], edges: [] };

      const resultTD = graphBuilder.generateMermaidDiagram(graphData, { direction: 'TD' });
      expect(resultTD).toContain('flowchart TD');

      const resultLR = graphBuilder.generateMermaidDiagram(graphData, { direction: 'LR' });
      expect(resultLR).toContain('flowchart LR');
    });
  });

  describe('renderFallbackSVG', () => {
    it('should return valid SVG for empty graph', () => {
      const result = graphBuilder.renderFallbackSVG({ nodes: [], edges: [] });

      expect(result).toContain('<svg');
      expect(result).toContain('</svg>');
      expect(result).toContain('No assets to display');
    });

    it('should render circles for nodes', () => {
      const graphData = {
        nodes: [
          {
            id: '0x1234567890abcdef1234567890abcdef12345678',
            label: '0x1234...5678',
            type: 'root',
            styleClass: 'root',
            licenseType: 'commercial-remix',
            createdAt: '2024-01-01T00:00:00.000Z',
            fullIpId: '0x1234567890abcdef1234567890abcdef12345678',
          },
        ],
        edges: [],
      };

      const result = graphBuilder.renderFallbackSVG(graphData);

      expect(result).toContain('<svg');
      expect(result).toContain('</svg>');
      expect(result).toContain('<circle');
      expect(result).toContain('node-root');
    });

    it('should render lines for edges', () => {
      const parentId = '0x1234567890abcdef1234567890abcdef12345678';
      const childId = '0xabcdef1234567890abcdef1234567890abcdef12';

      const graphData = {
        nodes: [
          {
            id: parentId,
            label: '0x1234...5678',
            type: 'root',
            styleClass: 'root',
            licenseType: 'commercial-remix',
            createdAt: '2024-01-01T00:00:00.000Z',
            fullIpId: parentId,
          },
          {
            id: childId,
            label: '0xabcd...ef12',
            type: 'leaf',
            styleClass: 'leaf',
            licenseType: 'commercial-use',
            createdAt: '2024-01-02T00:00:00.000Z',
            fullIpId: childId,
          },
        ],
        edges: [
          {
            source: parentId,
            target: childId,
            type: 'derivative',
          },
        ],
      };

      const result = graphBuilder.renderFallbackSVG(graphData);

      expect(result).toContain('<line');
      expect(result).toContain('class="edge"');
    });

    it('should render text labels', () => {
      const graphData = {
        nodes: [
          {
            id: '0x1234567890abcdef1234567890abcdef12345678',
            label: '0x1234...5678',
            type: 'root',
            styleClass: 'root',
            licenseType: 'commercial-remix',
            createdAt: '2024-01-01T00:00:00.000Z',
            fullIpId: '0x1234567890abcdef1234567890abcdef12345678',
          },
        ],
        edges: [],
      };

      const result = graphBuilder.renderFallbackSVG(graphData);

      expect(result).toContain('<text');
      expect(result).toContain('0x1234...5678');
    });

    it('should respect custom width and height', () => {
      const result = graphBuilder.renderFallbackSVG({ nodes: [], edges: [] }, 1200, 900);

      expect(result).toContain('width="1200"');
      expect(result).toContain('height="900"');
    });
  });

  describe('renderFallbackHTML', () => {
    it('should return message for empty graph', () => {
      const result = graphBuilder.renderFallbackHTML({ nodes: [], edges: [] });

      expect(result).toContain('No assets to display');
    });

    it('should render ul/li structure for nodes', () => {
      const graphData = {
        nodes: [
          {
            id: '0x1234567890abcdef1234567890abcdef12345678',
            label: '0x1234...5678',
            type: 'root',
            styleClass: 'root',
            licenseType: 'commercial-remix',
            createdAt: '2024-01-01T00:00:00.000Z',
            fullIpId: '0x1234567890abcdef1234567890abcdef12345678',
          },
        ],
        edges: [],
      };

      const result = graphBuilder.renderFallbackHTML(graphData);

      expect(result).toContain('<ul');
      expect(result).toContain('<li>');
      expect(result).toContain('0x1234...5678');
      expect(result).toContain('commercial-remix');
    });

    it('should render nested structure for parent-child', () => {
      const parentId = '0x1234567890abcdef1234567890abcdef12345678';
      const childId = '0xabcdef1234567890abcdef1234567890abcdef12';

      const graphData = {
        nodes: [
          {
            id: parentId,
            label: '0x1234...5678',
            type: 'root',
            styleClass: 'root',
            licenseType: 'commercial-remix',
            createdAt: '2024-01-01T00:00:00.000Z',
            fullIpId: parentId,
          },
          {
            id: childId,
            label: '0xabcd...ef12',
            type: 'leaf',
            styleClass: 'leaf',
            licenseType: 'commercial-use',
            createdAt: '2024-01-02T00:00:00.000Z',
            fullIpId: childId,
          },
        ],
        edges: [
          {
            source: parentId,
            target: childId,
            type: 'derivative',
          },
        ],
      };

      const result = graphBuilder.renderFallbackHTML(graphData);

      // Should have nested ul for children
      expect(result.match(/<ul/g)?.length).toBeGreaterThan(1);
      expect(result).toContain('0x1234...5678');
      expect(result).toContain('0xabcd...ef12');
    });

    it('should include CSS classes for node types', () => {
      const graphData = {
        nodes: [
          {
            id: '0x1234567890abcdef1234567890abcdef12345678',
            label: '0x1234...5678',
            type: 'root',
            styleClass: 'root',
            licenseType: 'commercial-remix',
            createdAt: '2024-01-01T00:00:00.000Z',
            fullIpId: '0x1234567890abcdef1234567890abcdef12345678',
          },
        ],
        edges: [],
      };

      const result = graphBuilder.renderFallbackHTML(graphData);

      expect(result).toContain('node-root');
      expect(result).toContain('<style>');
    });
  });
});
