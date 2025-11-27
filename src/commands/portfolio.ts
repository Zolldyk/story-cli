/**
 * Portfolio command implementation
 * Handles portfolio data fetching and relationship mapping
 * Source: architecture/components.md#Component: Portfolio Command Handler
 */

import { Command } from 'commander';
import { ConfigManager } from '../lib/config-manager.js';
import { StoryClient } from '../lib/story-client.js';
import { TerminalUI } from '../lib/terminal-ui.js';
import { GraphBuilder } from '../lib/graph-builder.js';
import { HTMLRenderer } from '../lib/html-renderer.js';
import { ConfigError } from '../types/errors.js';
import {
  IPAssetWithRelationships,
  PortfolioStatistics,
  PortfolioData,
  GraphData,
} from '../types/portfolio.js';
import { writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * Default output path for portfolio HTML
 */
const DEFAULT_OUTPUT_PATH = './story-portfolio.html';

/**
 * Cache file location for portfolio data
 * Enables Story 2.2 to skip redundant API calls
 */
const CACHE_FILE_PATH = join(tmpdir(), 'story-portfolio-cache.json');

/**
 * Portfolio command options interface
 */
interface PortfolioOptions {
  output?: string;
  showFullIds?: boolean;
}

/**
 * Build parent-child relationship tree structure from flat asset list
 * Task 8: AC 4
 * Exported for testing
 *
 * @param assets - Array of IP assets to process
 */
export function buildRelationshipGraph(
  assets: IPAssetWithRelationships[]
): void {
  // Populate childIpIds arrays by scanning for matching parentIpId
  for (const asset of assets) {
    asset.childIpIds = assets
      .filter((a) => a.parentIpId === asset.ipId)
      .map((a) => a.ipId);

    // Update derivative count
    asset.derivativeCount = asset.childIpIds.length;
  }

  // Validate no circular references (basic check)
  const visited = new Set<string>();
  const checkCircular = (ipId: string, ancestors: Set<string>): void => {
    if (ancestors.has(ipId)) {
      TerminalUI.warning(
        `Circular reference detected in IP asset relationships for ${ipId}`
      );
      return;
    }

    if (visited.has(ipId)) {
      return;
    }

    visited.add(ipId);
    const asset = assets.find((a) => a.ipId === ipId);
    if (asset) {
      const newAncestors = new Set(ancestors);
      newAncestors.add(ipId);
      for (const childId of asset.childIpIds) {
        checkCircular(childId, newAncestors);
      }
    }
  };

  // Check all root assets
  const rootAssets = assets.filter(
    (a) => !a.parentIpId || a.parentIpId === ''
  );
  for (const root of rootAssets) {
    checkCircular(root.ipId, new Set());
  }
}

/**
 * Calculate portfolio statistics from assets array
 * Task 9: AC 5, 6
 * Exported for testing
 *
 * @param assets - Array of IP assets
 * @returns Calculated portfolio statistics
 */
export function calculateStatistics(
  assets: IPAssetWithRelationships[]
): PortfolioStatistics {
  const totalAssets = assets.length;

  // Count derivatives (assets with parent)
  const derivatives = assets.filter(
    (a) => a.parentIpId && a.parentIpId !== ''
  ).length;

  // Count root assets (no parent)
  const rootAssets = totalAssets - derivatives;

  // Sum licenses issued (default 0 if unavailable)
  const licensesIssued = assets.reduce(
    (sum, asset) => sum + (asset.licensesIssued || 0),
    0
  );

  // Sum total royalties (default 0 if unavailable)
  const totalRoyalties = assets.reduce(
    (sum, asset) => sum + (asset.royaltiesEarned || 0),
    0
  );

  return {
    totalAssets,
    rootAssets,
    derivatives,
    licensesIssued,
    totalRoyalties,
  };
}

/**
 * Write portfolio data to cache file for Story 2.2
 * Task 10: AC 10
 *
 * @param portfolioData - Complete portfolio data to cache
 */
async function cachePortfolioData(portfolioData: PortfolioData): Promise<void> {
  try {
    await writeFile(
      CACHE_FILE_PATH,
      JSON.stringify(portfolioData, null, 2),
      'utf-8'
    );
    TerminalUI.debug(`Portfolio data cached to ${CACHE_FILE_PATH}`);
  } catch (error) {
    // Log warning but don't fail command
    TerminalUI.warning(
      `Failed to cache portfolio data: ${(error as Error).message}`
    );
  }
}

/**
 * Portfolio command handler
 * Tasks 2-11: Complete portfolio data fetching workflow
 *
 * @param options - Command options with optional output path and showFullIds
 */
async function portfolioCommand(options: PortfolioOptions): Promise<void> {
  // Record start time for execution tracking (Story 2.5 AC 8)
  const startTime = performance.now();

  const spinner = TerminalUI.querying('Loading configuration...');
  spinner.start();

  try {
    // Load configuration (Task 2)
    const configManager = ConfigManager.getInstance();
    const config = await configManager.load();

    // Validate required config
    if (!config.walletAddress) {
      spinner.stop();
      throw new ConfigError(
        'Wallet address not configured.\nRun `story config set walletAddress <address>` to configure your wallet.'
      );
    }

    const walletAddress = config.walletAddress;
    const network = config.network || 'testnet';
    const outputPath = options.output || DEFAULT_OUTPUT_PATH;
    const networkBadge = TerminalUI.networkBadge(network);

    // Display network context (Story 2.5 AC 9)
    spinner.stop();
    TerminalUI.info(`${networkBadge} Generating portfolio`);

    TerminalUI.debug(`Wallet: ${walletAddress}`);
    TerminalUI.debug(`Network: ${network}`);
    TerminalUI.debug(`Output: ${outputPath}`);

    // Query IP assets (Task 4, with fallback in Task 7)
    let assets: IPAssetWithRelationships[] = [];

    // Check if private key is available for StoryClient
    const privateKey = process.env.STORY_PRIVATE_KEY;
    if (!privateKey) {
      throw new ConfigError(
        'Private key not found.\nSet STORY_PRIVATE_KEY environment variable or configure via `story config`.'
      );
    }

    const storyClient = new StoryClient({
      privateKey,
      network,
      rpcUrl: config.rpcUrl,
    });

    // Update spinner for API query (Task 5: AC 7, Story 2.5 AC 6)
    const querySpinner = TerminalUI.querying(`Fetching IP assets ${networkBadge}...`);
    querySpinner.start();

    // Query IP assets using Story Protocol REST API (Task 4, AC 2, 3, 9)
    // Uses official Story Protocol API with built-in endpoints and public API keys
    assets = await storyClient.queryIPAssets(walletAddress);

    // Task 6: Empty State Handling (AC 8)
    if (assets.length === 0) {
      querySpinner.stop();
      TerminalUI.info(
        'No IP assets found for your wallet. Register your first IP with `story register`'
      );
      process.exit(0);
    }

    // Success message (Task 5: AC 7) - no duplicate emoji
    querySpinner.succeed(`Found ${assets.length} asset${assets.length === 1 ? '' : 's'}`);

    // Task 8: Build parent-child relationship tree (AC 4)
    TerminalUI.debug('Building relationship graph...');
    buildRelationshipGraph(assets);

    // Task 9: Calculate portfolio statistics (AC 5, 6)
    TerminalUI.debug('Calculating statistics...');
    const statistics = calculateStatistics(assets);

    // Story 2.2: Build visualization graph using GraphBuilder (Story 2.5 AC 6)
    const graphSpinner = TerminalUI.processing('Building visualization graph...');
    graphSpinner.start();

    const graphBuilder = new GraphBuilder();
    const graphData: GraphData = graphBuilder.buildGraphData(assets);
    const mermaidDiagram: string = graphBuilder.generateMermaidDiagram(graphData);

    graphSpinner.succeed('Visualization graph built');

    // Task 10: Cache portfolio data (AC 10)
    const portfolioData: PortfolioData & { mermaidDiagram?: string } = {
      walletAddress,
      network,
      assets,
      statistics,
      relationshipGraph: graphData, // Populated by GraphBuilder in Story 2.2
      generatedAt: new Date().toISOString(),
      mermaidDiagram, // Store Mermaid diagram string for Story 2.3 HTML rendering
    };

    await cachePortfolioData(portfolioData);

    // Story 2.3: Generate HTML portfolio page (Story 2.5 AC 6)
    const htmlSpinner = TerminalUI.processing('Generating HTML portfolio...');
    htmlSpinner.start();

    const htmlRenderer = new HTMLRenderer();
    const html = htmlRenderer.render(portfolioData);

    await writeFile(outputPath, html, 'utf-8');

    htmlSpinner.succeed('HTML portfolio generated');

    // Task 11: Display portfolio summary with majorSuccess (Story 2.5 AC 5, 6)
    const summaryLines = [
      `${statistics.totalAssets} IP asset${statistics.totalAssets === 1 ? '' : 's'} found`,
      `${statistics.rootAssets} root, ${statistics.derivatives} derivative${statistics.derivatives === 1 ? '' : 's'}`,
      '',
      `Output: ${outputPath}`,
      'Open in browser to view your portfolio',
    ];

    TerminalUI.majorSuccess('Portfolio Generated!', summaryLines.join('\n'));

    // Display execution time (Story 2.5 AC 8)
    console.log(TerminalUI.executionTime(startTime));
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

/**
 * Create portfolio command for Commander.js
 * Task 3: Register portfolio command in CLI Router (AC 1)
 *
 * @returns Commander.js Command instance
 */
export function createPortfolioCommand(): Command {
  const portfolio = new Command('portfolio')
    .description('Generate and view your IP asset portfolio')
    .option(
      '--output <path>',
      'Specify HTML output location',
      DEFAULT_OUTPUT_PATH
    )
    .option(
      '--show-full-ids',
      'Display full IP IDs and hashes without truncation'
    )
    .action(portfolioCommand);

  return portfolio;
}
