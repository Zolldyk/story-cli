export const NETWORKS = {
  testnet: {
    name: 'testnet',
    chainId: 'aeneid' as const,
    viemChainId: 1513, // Numeric chain ID for viem
    viemChainName: 'Story Testnet',
    rpcUrl: 'https://aeneid.storyrpc.io',
    explorerUrl: 'https://aeneid.explorer.story.foundation',
    faucetUrl: 'https://faucet.story.foundation',
    spgNftContract: '0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc' as const, // Public SPG NFT contract for testing
    // Story Protocol Official API (staging/testnet)
    storyApiUrl: 'https://staging-api.storyprotocol.net/api/v4',
    storyApiKey: 'KOTbaGUSWQ6cUJWhiJYiOjPgB0kTRu1eCFFvQL0IWls',
  },
  mainnet: {
    name: 'mainnet',
    chainId: 'mainnet' as const,
    viemChainId: 1516, // Numeric chain ID for viem
    viemChainName: 'Story Mainnet',
    rpcUrl: 'https://rpc.story.foundation',
    explorerUrl: 'https://explorer.story.foundation',
    faucetUrl: null,
    spgNftContract: undefined, // Users should deploy their own SPG NFT contract on mainnet
    // Story Protocol Official API (production)
    storyApiUrl: 'https://api.storyapis.com/api/v4',
    storyApiKey: 'MhBsxkU1z9fG6TofE59KqiiWV-YlYE8Q4awlLQehF3U',
  },
} as const;

export type NetworkName = keyof typeof NETWORKS;

export const MIN_GAS_BALANCE = 0.001; // ETH - sufficient for ~5 transactions
