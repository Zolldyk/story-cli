/**
 * Unit tests for portfolio helper functions
 * Source: architecture/test-strategy-and-standards.md#Test Types
 *
 * Tests relationship graph building and statistics calculation
 * Pattern: AAA (Arrange-Act-Assert)
 */

import { describe, it, expect } from 'vitest';
import {
  buildRelationshipGraph,
  calculateStatistics,
} from '../../src/commands/portfolio.js';
import { IPAssetWithRelationships } from '../../src/types/portfolio.js';

describe('Portfolio Helper Functions', () => {
  describe('buildRelationshipGraph', () => {
    it('should handle empty array without error', () => {
      // Arrange
      const assets: IPAssetWithRelationships[] = [];

      // Act
      buildRelationshipGraph(assets);

      // Assert
      expect(assets).toEqual([]);
    });

    it('should handle single root asset (no parent, no children)', () => {
      // Arrange
      const assets: IPAssetWithRelationships[] = [
        {
          ipId: 'asset1',
          name: 'Root Asset',
          metadata: { name: 'Root', creator: '0x123', createdAt: '2024-01-01' },
          licenseType: 'commercial',
          createdAt: '2024-01-01',
          childIpIds: [],
          derivativeCount: 0,
        },
      ];

      // Act
      buildRelationshipGraph(assets);

      // Assert
      expect(assets[0].childIpIds).toEqual([]);
      expect(assets[0].derivativeCount).toBe(0);
    });

    it('should populate childIpIds for parent-child relationships', () => {
      // Arrange
      const assets: IPAssetWithRelationships[] = [
        {
          ipId: 'root',
          name: 'Root Asset',
          metadata: { name: 'Root', creator: '0x123', createdAt: '2024-01-01' },
          licenseType: 'commercial',
          createdAt: '2024-01-01',
          childIpIds: [],
          derivativeCount: 0,
        },
        {
          ipId: 'child1',
          name: 'Child Asset',
          metadata: { name: 'Child', creator: '0x123', createdAt: '2024-01-02' },
          licenseType: 'commercial',
          createdAt: '2024-01-02',
          parentIpId: 'root',
          childIpIds: [],
          derivativeCount: 0,
        },
      ];

      // Act
      buildRelationshipGraph(assets);

      // Assert
      expect(assets[0].childIpIds).toEqual(['child1']);
      expect(assets[0].derivativeCount).toBe(1);
      expect(assets[1].childIpIds).toEqual([]);
      expect(assets[1].derivativeCount).toBe(0);
    });

    it('should handle multiple levels of derivatives (grandchildren)', () => {
      // Arrange
      const assets: IPAssetWithRelationships[] = [
        {
          ipId: 'root',
          name: 'Root',
          metadata: { name: 'Root', creator: '0x123', createdAt: '2024-01-01' },
          licenseType: 'commercial',
          createdAt: '2024-01-01',
          childIpIds: [],
          derivativeCount: 0,
        },
        {
          ipId: 'child',
          name: 'Child',
          metadata: { name: 'Child', creator: '0x123', createdAt: '2024-01-02' },
          licenseType: 'commercial',
          createdAt: '2024-01-02',
          parentIpId: 'root',
          childIpIds: [],
          derivativeCount: 0,
        },
        {
          ipId: 'grandchild',
          name: 'Grandchild',
          metadata: { name: 'Grandchild', creator: '0x123', createdAt: '2024-01-03' },
          licenseType: 'commercial',
          createdAt: '2024-01-03',
          parentIpId: 'child',
          childIpIds: [],
          derivativeCount: 0,
        },
      ];

      // Act
      buildRelationshipGraph(assets);

      // Assert
      expect(assets[0].childIpIds).toEqual(['child']);
      expect(assets[0].derivativeCount).toBe(1);
      expect(assets[1].childIpIds).toEqual(['grandchild']);
      expect(assets[1].derivativeCount).toBe(1);
      expect(assets[2].childIpIds).toEqual([]);
      expect(assets[2].derivativeCount).toBe(0);
    });

    it('should handle assets with multiple children', () => {
      // Arrange
      const assets: IPAssetWithRelationships[] = [
        {
          ipId: 'root',
          name: 'Root',
          metadata: { name: 'Root', creator: '0x123', createdAt: '2024-01-01' },
          licenseType: 'commercial',
          createdAt: '2024-01-01',
          childIpIds: [],
          derivativeCount: 0,
        },
        {
          ipId: 'child1',
          name: 'Child 1',
          metadata: { name: 'Child1', creator: '0x123', createdAt: '2024-01-02' },
          licenseType: 'commercial',
          createdAt: '2024-01-02',
          parentIpId: 'root',
          childIpIds: [],
          derivativeCount: 0,
        },
        {
          ipId: 'child2',
          name: 'Child 2',
          metadata: { name: 'Child2', creator: '0x123', createdAt: '2024-01-03' },
          licenseType: 'commercial',
          createdAt: '2024-01-03',
          parentIpId: 'root',
          childIpIds: [],
          derivativeCount: 0,
        },
      ];

      // Act
      buildRelationshipGraph(assets);

      // Assert
      expect(assets[0].childIpIds).toContain('child1');
      expect(assets[0].childIpIds).toContain('child2');
      expect(assets[0].derivativeCount).toBe(2);
    });
  });

  describe('calculateStatistics', () => {
    it('should return zero values for empty portfolio', () => {
      // Arrange
      const assets: IPAssetWithRelationships[] = [];

      // Act
      const stats = calculateStatistics(assets);

      // Assert
      expect(stats.totalAssets).toBe(0);
      expect(stats.rootAssets).toBe(0);
      expect(stats.derivatives).toBe(0);
      expect(stats.licensesIssued).toBe(0);
      expect(stats.totalRoyalties).toBe(0);
    });

    it('should count portfolio with only root assets', () => {
      // Arrange
      const assets: IPAssetWithRelationships[] = [
        {
          ipId: 'root1',
          name: 'Root 1',
          metadata: { name: 'Root1', creator: '0x123', createdAt: '2024-01-01' },
          licenseType: 'commercial',
          createdAt: '2024-01-01',
          childIpIds: [],
          derivativeCount: 0,
        },
        {
          ipId: 'root2',
          name: 'Root 2',
          metadata: { name: 'Root2', creator: '0x123', createdAt: '2024-01-02' },
          licenseType: 'commercial',
          createdAt: '2024-01-02',
          childIpIds: [],
          derivativeCount: 0,
        },
      ];

      // Act
      const stats = calculateStatistics(assets);

      // Assert
      expect(stats.totalAssets).toBe(2);
      expect(stats.rootAssets).toBe(2);
      expect(stats.derivatives).toBe(0);
    });

    it('should count portfolio with derivatives', () => {
      // Arrange
      const assets: IPAssetWithRelationships[] = [
        {
          ipId: 'root',
          name: 'Root',
          metadata: { name: 'Root', creator: '0x123', createdAt: '2024-01-01' },
          licenseType: 'commercial',
          createdAt: '2024-01-01',
          childIpIds: [],
          derivativeCount: 0,
        },
        {
          ipId: 'child1',
          name: 'Child 1',
          metadata: { name: 'Child1', creator: '0x123', createdAt: '2024-01-02' },
          licenseType: 'commercial',
          createdAt: '2024-01-02',
          parentIpId: 'root',
          childIpIds: [],
          derivativeCount: 0,
        },
        {
          ipId: 'child2',
          name: 'Child 2',
          metadata: { name: 'Child2', creator: '0x123', createdAt: '2024-01-03' },
          licenseType: 'commercial',
          createdAt: '2024-01-03',
          parentIpId: 'root',
          childIpIds: [],
          derivativeCount: 0,
        },
      ];

      // Act
      const stats = calculateStatistics(assets);

      // Assert
      expect(stats.totalAssets).toBe(3);
      expect(stats.rootAssets).toBe(1);
      expect(stats.derivatives).toBe(2);
    });

    it('should sum royalties when present', () => {
      // Arrange
      const assets: IPAssetWithRelationships[] = [
        {
          ipId: 'asset1',
          name: 'Asset 1',
          metadata: { name: 'Asset1', creator: '0x123', createdAt: '2024-01-01' },
          licenseType: 'commercial',
          createdAt: '2024-01-01',
          childIpIds: [],
          derivativeCount: 0,
          royaltiesEarned: 100,
        },
        {
          ipId: 'asset2',
          name: 'Asset 2',
          metadata: { name: 'Asset2', creator: '0x123', createdAt: '2024-01-02' },
          licenseType: 'commercial',
          createdAt: '2024-01-02',
          childIpIds: [],
          derivativeCount: 0,
          royaltiesEarned: 250,
        },
      ];

      // Act
      const stats = calculateStatistics(assets);

      // Assert
      expect(stats.totalRoyalties).toBe(350);
    });

    it('should sum licenses issued when present', () => {
      // Arrange
      const assets: IPAssetWithRelationships[] = [
        {
          ipId: 'asset1',
          name: 'Asset 1',
          metadata: { name: 'Asset1', creator: '0x123', createdAt: '2024-01-01' },
          licenseType: 'commercial',
          createdAt: '2024-01-01',
          childIpIds: [],
          derivativeCount: 0,
          licensesIssued: 5,
        },
        {
          ipId: 'asset2',
          name: 'Asset 2',
          metadata: { name: 'Asset2', creator: '0x123', createdAt: '2024-01-02' },
          licenseType: 'commercial',
          createdAt: '2024-01-02',
          childIpIds: [],
          derivativeCount: 0,
          licensesIssued: 3,
        },
      ];

      // Act
      const stats = calculateStatistics(assets);

      // Assert
      expect(stats.licensesIssued).toBe(8);
    });

    it('should handle optional fields (royalties and licenses) when absent', () => {
      // Arrange
      const assets: IPAssetWithRelationships[] = [
        {
          ipId: 'asset1',
          name: 'Asset 1',
          metadata: { name: 'Asset1', creator: '0x123', createdAt: '2024-01-01' },
          licenseType: 'commercial',
          createdAt: '2024-01-01',
          childIpIds: [],
          derivativeCount: 0,
          // No royaltiesEarned or licensesIssued fields
        },
      ];

      // Act
      const stats = calculateStatistics(assets);

      // Assert
      expect(stats.totalRoyalties).toBe(0);
      expect(stats.licensesIssued).toBe(0);
    });
  });
});
