/**
 * Error classes for Story CLI
 * Source: architecture/error-handling-strategy.md#Exception Hierarchy
 */

/**
 * Exit code constants
 * Source: architecture/error-handling-strategy.md#Exception Hierarchy
 */
export const EXIT_CODE_SUCCESS = 0;
export const EXIT_CODE_USER_ERROR = 1;
export const EXIT_CODE_SYSTEM_ERROR = 2;

/**
 * Base error class for all CLI errors
 */
export class CLIError extends Error {
  constructor(
    message: string,
    public readonly exitCode: number = 1
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when configuration is invalid or missing
 * Exit code 1 indicates user error
 */
export class ConfigError extends CLIError {
  constructor(message: string) {
    super(message, EXIT_CODE_USER_ERROR);
  }

  /**
   * Format a three-part error message for missing config fields
   * Source: architecture/error-handling-strategy.md#Error Handling Patterns
   *
   * @param missingKey - The config key that is missing
   * @returns Formatted error message with what/why/how structure
   */
  static formatConfigErrorMessage(missingKey: string): string {
    const messages: Record<string, { what: string; why: string; how: string }> = {
      pinataApiKey: {
        what: 'Pinata API key not found',
        why: 'IPFS uploads require Pinata authentication',
        how: 'Run `story config set pinataApiKey YOUR_KEY` or set PINATA_API_KEY environment variable',
      },
      pinataApiSecret: {
        what: 'Pinata API secret not found',
        why: 'IPFS uploads require Pinata authentication',
        how: 'Run `story config set pinataApiSecret YOUR_SECRET` or set PINATA_API_SECRET environment variable',
      },
      walletAddress: {
        what: 'Wallet address not found',
        why: 'Transaction signing requires a wallet address',
        how: 'Run `story config set walletAddress YOUR_ADDRESS` or set STORY_PRIVATE_KEY environment variable',
      },
      network: {
        what: 'Network preference not found',
        why: 'Story Protocol SDK requires a target network',
        how: 'Run `story config set network testnet` or `story config set network mainnet`',
      },
      rpcUrl: {
        what: 'Custom RPC URL not found',
        why: 'Story Protocol connection requires an RPC endpoint',
        how: 'Run `story config set rpcUrl YOUR_URL` or set STORY_RPC_URL environment variable',
      },
    };

    const template = messages[missingKey];

    if (!template) {
      return `Configuration field "${missingKey}" is missing. Run \`story config set ${missingKey} VALUE\` to set it.`;
    }

    return `${template.what}.\n${template.why}.\n${template.how}`;
  }
}

/**
 * Error thrown when user input validation fails
 * Exit code 1 indicates user error
 * Source: architecture/error-handling-strategy.md#Exception Hierarchy
 */
export class ValidationError extends CLIError {
  constructor(message: string) {
    super(message, EXIT_CODE_USER_ERROR);
  }

  /**
   * Create error for invalid wallet address format
   * Three-part message: what/why/how
   */
  static invalidWalletAddress(address: string): ValidationError {
    const what = `Invalid wallet address format: ${address}`;
    const why = 'Ethereum addresses must be 42 characters starting with 0x';
    const how = 'Example: 0x1234567890abcdef1234567890abcdef12345678';
    return new ValidationError(`${what}.\n${why}.\n${how}`);
  }

  /**
   * Create error for invalid IPFS hash format
   * Three-part message: what/why/how
   */
  static invalidIPFSHash(hash: string): ValidationError {
    const what = `Invalid IPFS hash format: ${hash}`;
    const why = 'IPFS hashes must start with Qm or be in ipfs:// format';
    const how = 'Example: QmXXXabc123... or ipfs://QmXXXabc123...';
    return new ValidationError(`${what}.\n${why}.\n${how}`);
  }

  /**
   * Create error for invalid license configuration
   * Three-part message: what/why/how
   */
  static invalidLicenseConfig(reason: string): ValidationError {
    const what = `Invalid license configuration: ${reason}`;
    const why = 'License configuration must meet Story Protocol requirements';
    const how = 'Check your license parameters and ensure they match the expected format';
    return new ValidationError(`${what}.\n${why}.\n${how}`);
  }

  /**
   * Create error for invalid private key format
   * Three-part message: what/why/how
   */
  static invalidPrivateKey(): ValidationError {
    const what = 'Invalid private key format';
    const why = 'Private key must be 64 hexadecimal characters (with or without 0x prefix)';
    const how = 'Example: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    return new ValidationError(`${what}.\n${why}.\n${how}`);
  }
}

/**
 * Error thrown when network or RPC operations fail
 * Exit code 2 indicates system error
 * Source: architecture/error-handling-strategy.md#Exception Hierarchy
 */
export class NetworkError extends CLIError {
  constructor(message: string) {
    super(message, EXIT_CODE_SYSTEM_ERROR);
  }

  /**
   * Create error for RPC timeout
   * Three-part message: what/why/how
   */
  static rpcTimeout(rpcUrl: string): NetworkError {
    const what = `Story Protocol RPC endpoint timed out: ${rpcUrl}`;
    const why = 'Network connection may be slow or RPC endpoint is unavailable';
    const how = 'Check network connection or try again in 30 seconds. To use custom RPC: story config set rpcUrl YOUR_RPC_URL';
    return new NetworkError(`${what}.\n${why}.\n${how}`);
  }

  /**
   * Create error for API rate limiting
   * Three-part message: what/why/how
   */
  static apiRateLimited(service: string): NetworkError {
    const what = `Rate limit exceeded for ${service}`;
    const why = 'Too many requests sent in a short period';
    const how = 'Please wait and try again. For higher limits, consider upgrading your API plan';
    return new NetworkError(`${what}.\n${why}.\n${how}`);
  }

  /**
   * Create error for connection failures
   * Three-part message: what/why/how
   */
  static connectionFailed(endpoint: string): NetworkError {
    const what = `Failed to connect to ${endpoint}`;
    const why = 'Network connection could not be established';
    const how = 'Check your internet connection and firewall settings, then try again';
    return new NetworkError(`${what}.\n${why}.\n${how}`);
  }
}

/**
 * Error thrown when blockchain transaction operations fail
 * Exit code 2 indicates system error
 * Source: architecture/error-handling-strategy.md#Exception Hierarchy
 */
export class TransactionError extends CLIError {
  constructor(message: string) {
    super(message, EXIT_CODE_SYSTEM_ERROR);
  }

  /**
   * Create error for insufficient gas balance
   * Three-part message: what/why/how
   */
  static insufficientGas(balance: string): TransactionError {
    const what = `Insufficient gas balance: ${balance} ETH`;
    const why = 'Transaction requires gas fees to execute on the blockchain';
    const how = 'For testnet, get free tokens at: https://faucet.story.foundation';
    return new TransactionError(`${what}.\n${why}.\n${how}`);
  }

  /**
   * Create error for reverted transactions
   * Three-part message: what/why/how
   */
  static transactionReverted(reason: string): TransactionError {
    const what = `Transaction reverted: ${reason}`;
    const why = 'The blockchain rejected the transaction';
    const how = 'Check the error reason and adjust your transaction parameters';
    return new TransactionError(`${what}.\n${why}.\n${how}`);
  }

  /**
   * Create error for transaction timeouts
   * Three-part message: what/why/how
   */
  static transactionTimeout(txHash: string): TransactionError {
    const what = `Transaction timed out: ${txHash}`;
    const why = 'Transaction was not confirmed within the expected time';
    const how = 'Check transaction status on block explorer or try increasing gas price';
    return new TransactionError(`${what}.\n${why}.\n${how}`);
  }
}

/**
 * Error thrown when external API operations fail
 * Exit code 2 indicates system error (Pinata, Goldsky, etc.)
 * Source: architecture/error-handling-strategy.md#Exception Hierarchy
 */
export class APIError extends CLIError {
  constructor(message: string) {
    super(message, EXIT_CODE_SYSTEM_ERROR);
  }

  /**
   * Create error for upload failures
   * Three-part message: what/why/how
   */
  static uploadFailed(service: string, reason: string): APIError {
    const what = `${service} upload failed: ${reason}`;
    const why = 'The external service rejected the upload request';
    const how = 'Check your API credentials and service status, then try again';
    return new APIError(`${what}.\n${why}.\n${how}`);
  }

  /**
   * Create error for query failures
   * Three-part message: what/why/how
   */
  static queryFailed(service: string): APIError {
    const what = `${service} query failed`;
    const why = 'The external service could not process the request';
    const how = 'Check service status and try again. If problem persists, contact support';
    return new APIError(`${what}.\n${why}.\n${how}`);
  }
}
