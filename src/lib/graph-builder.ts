/**
 * GraphBuilder Component
 * Transforms portfolio assets to Mermaid diagram visualization
 * Source: architecture/components.md#GraphBuilder Component
 */

import {
  GraphNode,
  GraphEdge,
  GraphData,
  MermaidConfig,
  IPAssetWithRelationships,
} from '../types/portfolio.js';

/**
 * Node type style classes for Mermaid diagram styling
 */
const NODE_STYLE_CLASSES = {
  root: 'root', // Green - original works (no parent)
  derivative: 'derivative', // Blue - has parent
  leaf: 'leaf', // Orange - no children
} as const;

/**
 * Mermaid class definitions for node styling
 */
const MERMAID_CLASS_DEFS = `
  classDef root fill:#4CAF50,stroke:#2E7D32,color:#fff
  classDef derivative fill:#2196F3,stroke:#1565C0,color:#fff
  classDef leaf fill:#FF9800,stroke:#EF6C00,color:#fff`;

/**
 * Default Mermaid configuration
 */
const DEFAULT_MERMAID_CONFIG: MermaidConfig = {
  direction: 'TD',
  theme: 'default',
};

/**
 * Truncate IP ID to displayable format
 * Short IDs (<=12 chars) returned unchanged
 * Long IDs truncated to 0x1234...5678 format
 *
 * @param ipId - Full IP ID string
 * @returns Truncated IP ID for display
 */
export function truncateIpId(ipId: string): string {
  if (ipId.length <= 12) return ipId;
  return `${ipId.slice(0, 6)}...${ipId.slice(-4)}`;
}

/**
 * Convert IP ID to Mermaid-safe node ID
 * Mermaid node IDs must be alphanumeric
 *
 * @param ipId - Full IP ID string
 * @returns Alphanumeric node ID for Mermaid
 */
export function toMermaidNodeId(ipId: string): string {
  // Remove 0x prefix, take first 8 chars for unique ID
  return `node_${ipId.replace('0x', '').slice(0, 8)}`;
}

/**
 * GraphBuilder class for transforming portfolio assets to visualizations
 */
export class GraphBuilder {
  /**
   * Build graph data structure from portfolio assets
   * Converts assets array to nodes and edges for visualization
   *
   * @param assets - Array of IP assets with relationships
   * @returns GraphData with nodes and edges arrays
   */
  buildGraphData(assets: IPAssetWithRelationships[]): GraphData {
    if (assets.length === 0) {
      return { nodes: [], edges: [] };
    }

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Build set of all IP IDs that have children (for determining leaf nodes)
    const parentIds = new Set<string>();
    for (const asset of assets) {
      if (asset.childIpIds && asset.childIpIds.length > 0) {
        parentIds.add(asset.ipId);
      }
    }

    // Create nodes for each asset
    for (const asset of assets) {
      const isRoot = !asset.parentIpId || asset.parentIpId === '';
      const isLeaf = !parentIds.has(asset.ipId);

      // Determine node type
      let nodeType: string;
      if (isRoot && isLeaf) {
        // Single node with no parent and no children - treat as root
        nodeType = 'root';
      } else if (isRoot) {
        nodeType = 'root';
      } else if (isLeaf) {
        nodeType = 'leaf';
      } else {
        nodeType = 'derivative';
      }

      const node: GraphNode = {
        id: asset.ipId,
        label: truncateIpId(asset.ipId),
        type: nodeType,
        styleClass: NODE_STYLE_CLASSES[nodeType as keyof typeof NODE_STYLE_CLASSES] || 'derivative',
        licenseType: asset.licenseType,
        createdAt: asset.createdAt,
        fullIpId: asset.ipId,
      };

      nodes.push(node);

      // Create edges for parent-child relationships
      if (asset.parentIpId && asset.parentIpId !== '') {
        const edge: GraphEdge = {
          source: asset.parentIpId,
          target: asset.ipId,
          type: 'derivative',
        };
        edges.push(edge);
      }
    }

    return { nodes, edges };
  }

  /**
   * Generate Mermaid flowchart diagram syntax
   *
   * @param graphData - Graph data with nodes and edges
   * @param config - Optional Mermaid configuration
   * @returns Complete Mermaid diagram definition string
   */
  generateMermaidDiagram(
    graphData: GraphData,
    config: MermaidConfig = DEFAULT_MERMAID_CONFIG
  ): string {
    const lines: string[] = [];

    // Flowchart header with direction
    lines.push(`flowchart ${config.direction}`);

    // Generate node declarations
    for (const node of graphData.nodes) {
      const nodeId = toMermaidNodeId(node.id);
      const styleClass = node.styleClass || 'derivative';
      lines.push(`  ${nodeId}[${node.label}]:::${styleClass}`);
    }

    // Generate edge declarations
    for (const edge of graphData.edges) {
      const sourceId = toMermaidNodeId(edge.source);
      const targetId = toMermaidNodeId(edge.target);
      lines.push(`  ${sourceId} --> ${targetId}`);
    }

    // Add class definitions
    lines.push(MERMAID_CLASS_DEFS);

    return lines.join('\n');
  }

  /**
   * Render fallback SVG tree visualization
   * Self-contained SVG with no external dependencies
   *
   * @param graphData - Graph data with nodes and edges
   * @param width - SVG width in pixels (default: 800)
   * @param height - SVG height in pixels (default: 600)
   * @returns Complete SVG string
   */
  renderFallbackSVG(
    graphData: GraphData,
    width: number = 800,
    height: number = 600
  ): string {
    if (graphData.nodes.length === 0) {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <text x="${width / 2}" y="${height / 2}" text-anchor="middle" fill="#666">No assets to display</text>
</svg>`;
    }

    // Calculate tree layout positions
    const nodePositions = this.calculateTreeLayout(graphData, width, height);

    // SVG styling
    const styles = `
    <style>
      .node-root { fill: #4CAF50; stroke: #2E7D32; stroke-width: 2; }
      .node-derivative { fill: #2196F3; stroke: #1565C0; stroke-width: 2; }
      .node-leaf { fill: #FF9800; stroke: #EF6C00; stroke-width: 2; }
      .edge { stroke: #666; stroke-width: 2; }
      .label { font-family: monospace; font-size: 10px; fill: #fff; text-anchor: middle; }
    </style>`;

    const svgLines: string[] = [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`,
      styles,
    ];

    // Draw edges first (so they appear behind nodes)
    for (const edge of graphData.edges) {
      const sourcePos = nodePositions.get(edge.source);
      const targetPos = nodePositions.get(edge.target);
      if (sourcePos && targetPos) {
        svgLines.push(
          `  <line class="edge" x1="${sourcePos.x}" y1="${sourcePos.y}" x2="${targetPos.x}" y2="${targetPos.y}" />`
        );
      }
    }

    // Draw nodes
    const nodeRadius = 25;
    for (const node of graphData.nodes) {
      const pos = nodePositions.get(node.id);
      if (pos) {
        const nodeClass = `node-${node.type}`;
        svgLines.push(
          `  <circle class="${nodeClass}" cx="${pos.x}" cy="${pos.y}" r="${nodeRadius}" />`
        );
        svgLines.push(
          `  <text class="label" x="${pos.x}" y="${pos.y + 4}">${node.label}</text>`
        );
      }
    }

    svgLines.push('</svg>');
    return svgLines.join('\n');
  }

  /**
   * Calculate tree layout positions for nodes
   * Root nodes at top, derivatives below, leaves at bottom
   *
   * @param graphData - Graph data with nodes and edges
   * @param width - Available width
   * @param height - Available height
   * @returns Map of node ID to {x, y} position
   */
  private calculateTreeLayout(
    graphData: GraphData,
    width: number,
    height: number
  ): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();

    // Group nodes by type for vertical positioning
    const roots = graphData.nodes.filter((n) => n.type === 'root');
    const derivatives = graphData.nodes.filter((n) => n.type === 'derivative');
    const leaves = graphData.nodes.filter((n) => n.type === 'leaf');

    const padding = 50;
    const availableWidth = width - padding * 2;
    const availableHeight = height - padding * 2;

    // Calculate vertical positions for each level
    const levels = [roots, derivatives, leaves].filter((l) => l.length > 0);
    const levelHeight = availableHeight / Math.max(levels.length, 1);

    let currentY = padding + levelHeight / 2;

    for (const levelNodes of levels) {
      if (levelNodes.length === 0) continue;

      const nodeSpacing = availableWidth / (levelNodes.length + 1);

      for (let i = 0; i < levelNodes.length; i++) {
        const node = levelNodes[i];
        positions.set(node.id, {
          x: padding + nodeSpacing * (i + 1),
          y: currentY,
        });
      }

      currentY += levelHeight;
    }

    return positions;
  }

  /**
   * Render fallback HTML list visualization
   * Nested ul/li structure showing hierarchy
   * Ultimate fallback if SVG also fails
   *
   * @param graphData - Graph data with nodes and edges
   * @returns HTML string with nested list structure
   */
  renderFallbackHTML(graphData: GraphData): string {
    if (graphData.nodes.length === 0) {
      return '<p>No assets to display</p>';
    }

    // Build parent-child map
    const childrenMap = new Map<string, string[]>();
    for (const edge of graphData.edges) {
      if (!childrenMap.has(edge.source)) {
        childrenMap.set(edge.source, []);
      }
      childrenMap.get(edge.source)!.push(edge.target);
    }

    // Find root nodes (no incoming edges)
    const hasParent = new Set(graphData.edges.map((e) => e.target));
    const rootNodes = graphData.nodes.filter((n) => !hasParent.has(n.id));

    // Build nested HTML recursively
    const renderNode = (nodeId: string, depth: number): string => {
      const node = graphData.nodes.find((n) => n.id === nodeId);
      if (!node) return '';

      const indent = '  '.repeat(depth);
      const children = childrenMap.get(nodeId) || [];

      let html = `${indent}<li>\n`;
      html += `${indent}  <span class="node-${node.type}">${node.label}</span>\n`;
      html += `${indent}  <span class="license">(${node.licenseType})</span>\n`;

      if (children.length > 0) {
        html += `${indent}  <ul>\n`;
        for (const childId of children) {
          html += renderNode(childId, depth + 2);
        }
        html += `${indent}  </ul>\n`;
      }

      html += `${indent}</li>\n`;
      return html;
    };

    let html = `<style>
  .node-root { color: #4CAF50; font-weight: bold; }
  .node-derivative { color: #2196F3; font-weight: bold; }
  .node-leaf { color: #FF9800; font-weight: bold; }
  .license { color: #666; font-size: 0.9em; }
  ul { list-style-type: none; padding-left: 20px; }
</style>\n`;

    html += '<ul class="portfolio-tree">\n';
    for (const root of rootNodes) {
      html += renderNode(root.id, 1);
    }
    html += '</ul>';

    return html;
  }
}
