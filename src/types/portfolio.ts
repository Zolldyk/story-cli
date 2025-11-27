/**
 * Portfolio types for Story CLI
 * Source: architecture/data-models.md#PortfolioData
 */

import { IPMetadata } from './metadata.js';

/**
 * GraphNode interface for relationship graph visualization
 * Extended in Story 2.2 with Mermaid-specific properties
 */
export interface GraphNode {
  /**
   * Unique node identifier (typically IP ID)
   */
  id: string;

  /**
   * Display label for the node (truncated IP ID)
   */
  label: string;

  /**
   * Node type (e.g., "root", "derivative", "leaf")
   */
  type: string;

  /**
   * Mermaid style class for coloring (e.g., "root", "derivative", "leaf")
   */
  styleClass?: string;

  /**
   * License type for styling and tooltip
   */
  licenseType: string;

  /**
   * ISO 8601 creation timestamp for tooltip display
   */
  createdAt: string;

  /**
   * Full IP ID for tooltips (label is truncated)
   */
  fullIpId: string;
}

/**
 * GraphEdge interface for parent-child relationships
 * Extended in Story 2.2 with visualization properties
 */
export interface GraphEdge {
  /**
   * Source node ID (parent IP)
   */
  source: string;

  /**
   * Target node ID (child IP / derivative)
   */
  target: string;

  /**
   * Edge type (e.g., "derivative")
   */
  type?: string;
}

/**
 * MermaidConfig interface for diagram configuration
 * Used in Story 2.2 for Mermaid diagram generation
 */
export interface MermaidConfig {
  /**
   * Layout direction: Top-Down or Left-Right
   */
  direction: 'TD' | 'LR';

  /**
   * Mermaid theme (default, dark, forest, neutral)
   */
  theme?: string;
}

/**
 * GraphData interface for complete relationship graph structure
 * Used in Story 2.2 for Mermaid diagram generation
 */
export interface GraphData {
  /**
   * Array of nodes in the graph
   */
  nodes: GraphNode[];

  /**
   * Array of edges connecting nodes
   */
  edges: GraphEdge[];
}

/**
 * IPAssetWithRelationships interface for IP assets with parent-child data
 * Extended version of RegisteredIPAsset with relationship information
 */
export interface IPAssetWithRelationships {
  /**
   * Unique IP asset identifier from blockchain
   */
  ipId: string;

  /**
   * IP asset name from metadata
   */
  name: string;

  /**
   * Full metadata object
   */
  metadata: IPMetadata;

  /**
   * License type applied to the IP asset
   */
  licenseType: string;

  /**
   * ISO 8601 creation timestamp
   */
  createdAt: string;

  /**
   * Parent IP ID for derivative assets (optional)
   * Null or undefined for root assets
   */
  parentIpId?: string;

  /**
   * Array of child IP IDs (derivative assets)
   * Empty array for leaf assets
   */
  childIpIds: string[];

  /**
   * Count of derivative assets (children)
   * Calculated value: childIpIds.length
   */
  derivativeCount: number;

  /**
   * Royalty earnings for this asset (optional)
   * May not be available from all API endpoints
   */
  royaltiesEarned?: number;

  /**
   * Number of licenses issued for this asset (optional)
   * May not be available from all API endpoints
   */
  licensesIssued?: number;
}

/**
 * PortfolioStatistics interface for aggregate portfolio metrics
 * Calculated from array of IPAssetWithRelationships
 */
export interface PortfolioStatistics {
  /**
   * Total number of IP assets in portfolio
   */
  totalAssets: number;

  /**
   * Number of root assets (no parent)
   */
  rootAssets: number;

  /**
   * Number of derivative assets (has parent)
   */
  derivatives: number;

  /**
   * Total number of licenses issued across portfolio
   */
  licensesIssued: number;

  /**
   * Total royalty earnings across portfolio
   */
  totalRoyalties: number;
}

/**
 * PortfolioData interface for complete portfolio data package
 * Used for caching and passing between portfolio command stories
 */
export interface PortfolioData {
  /**
   * Wallet address that owns these assets
   */
  walletAddress: string;

  /**
   * Network where assets are registered (testnet/mainnet)
   */
  network: string;

  /**
   * Array of IP assets with relationship data
   */
  assets: IPAssetWithRelationships[];

  /**
   * Calculated portfolio statistics
   */
  statistics: PortfolioStatistics;

  /**
   * Relationship graph data for visualization
   * Populated in Story 2.2
   */
  relationshipGraph: GraphData;

  /**
   * ISO 8601 timestamp when data was generated
   */
  generatedAt: string;
}
