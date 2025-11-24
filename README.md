# Story CLI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

CLI tool for Story Protocol - Register and manage IP assets on the blockchain

## Overview

**Story CLI** is a unified command-line toolkit that transforms the developer experience for Story Protocol by providing guided workflows for the complete IP lifecycle—from registration through monitoring and distribution. Built for Story Protocol—the blockchain for programmable IP—this tool wraps Story Protocol's robust SDK functions in intuitive, interactive commands that make IP management feel like a conversation rather than a technical chore. Get your first IP asset registered in under 5 minutes with zero blockchain expertise required.

Learn more about Story Protocol at [https://docs.story.foundation](https://docs.story.foundation)

## Features

- **Interactive Registration Wizard** - Guided prompts walk you through license selection, metadata input, and transaction signing with smart defaults and validation
- **Multiple PIL License Configurations** - Support for commercial use, derivatives permissions, and configurable royalty percentages (0-100%)
- **IPFS Metadata Storage Integration** - Automatic metadata uploads to IPFS via Pinata with free tier support (1GB storage)
- **Blockchain Transaction Execution** - Seamless integration with Story Protocol SDK for secure IP asset registration on testnet or mainnet
- **Beautiful Terminal UI** - Progress spinners, success celebrations with Boxen formatting, and color-coded output for exceptional developer experience
- **Persistent Configuration Management** - Secure config file storage at `~/.storyrc` with 600 permissions and environment variable overrides
- **Mock Mode for Offline Development** - Test registration flows without blockchain transactions using `STORY_CLI_MOCK=true`
- **Debug Mode with Verbose Logging** - Comprehensive troubleshooting with `--debug` flag showing SDK calls, API requests, and full stack traces

## Installation

### Prerequisites

Before installing Story CLI, ensure you have:

- **Node.js 18.0.0 or higher** - [Download from nodejs.org](https://nodejs.org/)
- **npm 9.0.0 or higher** - Comes bundled with Node.js
- **Ethereum wallet with private key** - For signing blockchain transactions
- **Pinata account** - Free tier available at [pinata.cloud](https://pinata.cloud) (provides 1GB IPFS storage)

**Note:** Start with Story Protocol testnet to avoid real gas costs during development and testing.

### Install Globally

```bash
npm install -g story-cli
```

### Verify Installation

```bash
story --version
```

You should see the current version number displayed. If the command is not found, ensure your npm global bin directory is in your PATH.

### Get Testnet Funds

For testing on Story Protocol testnet, get free testnet tokens from the faucet:

**Story Protocol Testnet Faucet:** [https://faucet.story.foundation](https://faucet.story.foundation)

You'll need testnet funds to pay for gas fees when registering IP assets.

## Quick Start

### First Registration in Under 5 Minutes

Follow these steps to register your first IP asset on Story Protocol:

#### Step 1: Install the CLI

```bash
npm install -g story-cli
```

Verify installation:

```bash
story --version
# Output: 1.0.0
```

#### Step 2: Get Testnet Wallet and Funds

1. Create an Ethereum wallet or use an existing one
2. Visit the Story Protocol testnet faucet: [https://faucet.story.foundation](https://faucet.story.foundation)
3. Request testnet tokens for gas fees

#### Step 3: Get Pinata API Credentials

1. Sign up for a free Pinata account at [https://pinata.cloud](https://pinata.cloud)
2. Navigate to API Keys section
3. Create a new API key and save both the **API Key** and **API Secret**

#### Step 4: Configure the CLI

Run the configuration wizard or set values individually:

```bash
# Interactive configuration wizard
story config set walletAddress 0x1234567890abcdef1234567890abcdef12345678
story config set network testnet
story config set pinataApiKey your_pinata_api_key_here
story config set pinataApiSecret your_pinata_api_secret_here
```

Verify your configuration:

```bash
story config get
```

Expected output:
```json
{
  "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "network": "testnet",
  "pinataApiKey": "your_pinata_api_key_here",
  "pinataApiSecret": "your_pinata_api_secret_here"
}
```

#### Step 5: Register Your First IP Asset

Run the interactive registration command with the path to your file:

```bash
story register ./my-artwork.jpg
```

Replace `./my-artwork.jpg` with the path to your actual file (image, audio, video, document, etc.).

You'll be guided through a series of prompts:

1. **License Configuration:**
   - Allow commercial use? (Yes/No)
   - Allow derivatives? (Yes/No)
   - Royalty percentage? (0-100)

2. **Metadata Input:**
   - IP asset name (e.g., "My First NFT Collection")
   - Description (optional)
   - Image IPFS hash (optional)

3. **Transaction Summary:**
   - Review license terms
   - View estimated gas costs
   - Confirm transaction

#### Step 6: View Success Message

After successful registration, you'll see:

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   🎉 IP Registration Successful!                    │
│                                                      │
│   IP ID: 123456789                                  │
│   Transaction: 0xabc123...def789                    │
│   View on Explorer:                                 │
│   https://aeneid.explorer.story.foundation/tx/...  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

#### Metadata Structure Example

When you provide metadata, it's uploaded to IPFS in this format:

```json
{
  "name": "My First NFT Collection",
  "description": "A collection of unique digital artwork",
  "image": "ipfs://QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "attributes": []
}
```

The CLI automatically handles IPFS upload via Pinata and returns the metadata hash for blockchain registration.

## Commands

Story CLI provides the following commands for managing IP assets on Story Protocol. All commands support the global `--debug` flag for verbose output.

### `story register`

Register a new IP asset on Story Protocol blockchain with interactive license wizard and metadata upload.

**Usage:**
```bash
story register <file-path> [options]
```

**Arguments:**
- `<file-path>` - Path to the file to register (required). This file will be validated for existence and readability before registration begins.

**Options:**
- `--metadata-hash <hash>` - Pre-uploaded IPFS metadata hash (skips metadata prompts and upload). Use this to retry failed transactions without re-uploading metadata.
- `--debug` - Enable debug mode with verbose output and stack traces

**Interactive Workflow:**

When you run `story register`, you'll be guided through an interactive wizard:

1. **License Configuration:**
   - Allow commercial use? (Yes/No)
   - Allow derivatives? (Yes/No)
   - Royalty percentage? (0-100%) - Only shown if derivatives are allowed

2. **Metadata Input:**
   - IP asset name (required)
   - Description (optional)
   - Image IPFS hash (optional)

3. **Transaction Summary:**
   - License type confirmation
   - Royalty percentage (if applicable)
   - Metadata IPFS hash
   - Network and gas estimate

4. **Blockchain Transaction:**
   - Gas balance check
   - Transaction execution
   - Success confirmation with IP ID and explorer link

**Example Usage:**

```bash
# Basic registration with interactive prompts
story register ./my-artwork.jpg

# Registration with debug output
story register ./my-song.mp3 --debug

# Retry failed transaction with existing metadata hash
story register ./my-artwork.jpg --metadata-hash QmXXX...ABC
```

**Environment Variables:**
- `STORY_PRIVATE_KEY` - Private key for transaction signing (required)
- `STORY_CLI_MOCK` - Set to `true` for offline testing with mock data
- `PINATA_API_KEY` - Pinata API key for IPFS uploads
- `PINATA_API_SECRET` - Pinata API secret for IPFS uploads

**License Configuration Examples:**

1. **Non-Commercial Only:**
   - Commercial use: No
   - Result: Non-Commercial Social Remixing (PIL) license

2. **Commercial with Derivatives (10% Royalty):**
   - Commercial use: Yes
   - Derivatives: Yes
   - Royalty: 10%
   - Result: Commercial Remix license with 10% royalty

3. **Commercial No-Derivatives:**
   - Commercial use: Yes
   - Derivatives: No
   - Result: Commercial Use license without derivative rights

**Expected Workflow:**
```bash
$ story register ./my-artwork.jpg

# License prompts
✓ License configuration: Commercial Remix (10% royalty)

# Metadata prompts
✓ Metadata collected

# IPFS upload
⠋ Uploading metadata to IPFS...
✓ Metadata uploaded to IPFS: QmXXX...ABC

# Transaction summary
License Type: Commercial Remix
Royalty Percentage: 10%
Metadata Hash: ipfs://QmXXX...ABC
Network: testnet
Estimated Gas: 0.0002 ETH

# Gas check and transaction
✓ Gas balance sufficient: 0.5 ETH
⠋ Registering IP on Story Protocol [testnet]...

# Success!
┌──────────────────────────────────────────────────────┐
│   🎉 IP Registration Successful!                     │
│   IP ID: 123456789                                   │
│   Transaction: 0xabc123...def789                     │
│   View on Explorer:                                  │
│   https://aeneid.explorer.story.foundation/tx/...   │
└──────────────────────────────────────────────────────┘
```

### `story config`

Manage Story CLI configuration values stored in `~/.storyrc`.

**Subcommands:**

```bash
story config set <key> <value>   # Set a configuration value
story config get [key]           # Display configuration values (all or specific)
story config path                # Display path to configuration file
```

**Options:**
- `--debug` - Enable debug mode

**Examples:**

```bash
# Set configuration values
story config set walletAddress 0x1234567890abcdef1234567890abcdef12345678
story config set network testnet
story config set pinataApiKey your_api_key
story config set pinataApiSecret your_api_secret
story config set rpcUrl https://aeneid.storyrpc.io

# Get all configuration values
story config get

# Get specific configuration value
story config get walletAddress

# Display config file path
story config path
# Output: /Users/you/.storyrc

# Debug mode
story config get --debug
```

### `story status`

Check wallet connection and display account information.

**Usage:**
```bash
story status
```

**What it displays:**
- ✓ Wallet connection status
- Ethereum wallet address (truncated for security)
- Network (testnet/mainnet)
- RPC endpoint URL
- Gas balance in ETH
- Low gas warning (if balance < 0.001 ETH)

**Example Output:**

```bash
$ story status

✓ Wallet Connected

Address: 0x1234...5678
Network: testnet
RPC Endpoint: https://aeneid.storyrpc.io
Gas Balance: 0.500000 ETH
```

**Note:** Requires `STORY_PRIVATE_KEY` environment variable to be set.

### `story portfolio`

Generate and view your IP asset portfolio.

**Status:** 🚧 Coming in Epic 2 - Future Release

This command will generate interactive visualizations of your registered IP assets, including:
- Relationship graphs showing parent-child IP dependencies
- License term summaries
- Transaction history
- HTML portfolio export

**Placeholder:**
```bash
story portfolio
# Output: Portfolio command - To be implemented in future stories
```

### Global Options

**`--help` / `-h`**
Display help information for any command:

```bash
story --help                    # Show all available commands
story register --help           # Show register command options
story config --help             # Show config command options
story status --help             # Show status command options
```

**`--version` / `-v`**
Display the current version of Story CLI:

```bash
story --version
# Output: 1.0.0
```

**`--debug`**
Enable debug mode with verbose output (works with all commands):

```bash
story register --debug
story config get --debug
story status --debug
```

Debug mode outputs:
- Verbose SDK calls
- API requests and responses
- Full stack traces
- Detailed validation steps

## Debug Mode

Debug mode provides verbose output for troubleshooting issues with the CLI.

### Enabling Debug Mode

You can enable debug mode in two ways:

1. **Using the `--debug` flag:**
   ```bash
   story register --debug
   story config get --debug
   ```

2. **Using the `DEBUG` environment variable:**
   ```bash
   export DEBUG=true
   story register
   ```

### What Debug Mode Outputs

When debug mode is enabled, you'll see:

- **Verbose SDK calls** - All Story Protocol SDK method invocations
- **API requests/responses** - Detailed logs of Pinata uploads, Goldsky queries, and other API calls
- **Full stack traces** - Complete error stack traces for debugging
- **Detailed validation steps** - Step-by-step validation output

### Example Usage

```bash
# Enable debug mode for a register command
$ story register --debug

[DEBUG] Debug mode enabled
[DEBUG] Loading configuration from /Users/you/.storyrc
[DEBUG] Validating wallet address: 0x1234...5678
[DEBUG] Connecting to Story Protocol RPC: https://aeneid.storyrpc.io
...
```

## Troubleshooting

This section covers common errors you may encounter and how to resolve them. Each error follows a three-part format: what went wrong, why it matters, and how to fix it.

### Common Errors

#### Missing Configuration Values

**Error:**
```
Pinata API key not found
Run `story config set pinataApiKey YOUR_KEY` or set PINATA_API_KEY environment variable
```

**What went wrong:** The CLI cannot find a required configuration value (Pinata API key, secret, or wallet address).

**Why it matters:** Story CLI needs these credentials to upload metadata to IPFS and sign blockchain transactions.

**How to fix:**

Option 1 - Set via config file:
```bash
story config set pinataApiKey YOUR_KEY
story config set pinataApiSecret YOUR_SECRET
story config set walletAddress YOUR_ADDRESS
```

Option 2 - Set via environment variables:
```bash
export PINATA_API_KEY="your_api_key"
export PINATA_API_SECRET="your_api_secret"
export STORY_PRIVATE_KEY="0xYOUR_PRIVATE_KEY"
```

#### Invalid Wallet Address Format

**Error:**
```
Invalid wallet address format
Wallet address must be a valid Ethereum address (42 characters starting with "0x")
Example: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

**What went wrong:** The wallet address in your config doesn't match Ethereum address format requirements.

**Why it matters:** Blockchain transactions require properly formatted addresses to identify accounts.

**How to fix:**

1. Verify your wallet address is **exactly 42 characters** (including the `0x` prefix)
2. Check that it starts with `0x`
3. Contains only hexadecimal characters (0-9, a-f)
4. Update your config:
   ```bash
   story config set walletAddress 0x1234567890abcdef1234567890abcdef12345678
   ```

Valid example: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`

#### Network Connectivity Failures

**Error:**
```
Story Protocol RPC endpoint timed out
Check your internet connection or try a custom RPC URL
```

**What went wrong:** The CLI couldn't connect to Story Protocol's blockchain RPC endpoint within the timeout period.

**Why it matters:** Without RPC connectivity, you cannot read from or write to the blockchain.

**How to fix:**

1. **Check internet connection** - Verify you're online
2. **Wait and retry** - Temporary network issues often resolve in 30-60 seconds
3. **Use custom RPC URL** - If the default endpoint is down:
   ```bash
   # For testnet
   story config set rpcUrl https://aeneid.storyrpc.io

   # Or use environment variable
   export STORY_RPC_URL="https://your-custom-rpc.io"
   ```
4. **Check firewall** - Ensure your firewall isn't blocking HTTPS connections

#### Insufficient Gas Balance

**Error:**
```
Insufficient gas balance
Your wallet has 0.0001 ETH but needs at least 0.001 ETH for transactions
Get testnet funds: https://faucet.story.foundation
```

**What went wrong:** Your wallet doesn't have enough ETH to pay for blockchain transaction gas fees.

**Why it matters:** All blockchain transactions require gas fees to be processed by the network.

**How to fix:**

**For Testnet:**
1. Visit the Story Protocol testnet faucet: [https://faucet.story.foundation](https://faucet.story.foundation)
2. Enter your wallet address
3. Request testnet tokens (free)
4. Wait 1-2 minutes for tokens to arrive
5. Verify balance: `story status`

**For Mainnet:**
1. Purchase ETH from a cryptocurrency exchange
2. Transfer ETH to your wallet address
3. Ensure you have at least 0.001 ETH (sufficient for ~5 transactions)

#### Invalid IPFS Hash Format

**Error:**
```
Invalid IPFS hash format
IPFS hashes must start with 'Qm' or 'ipfs://'
Example: QmXXX...ABC or ipfs://QmXXX...ABC
```

**What went wrong:** The IPFS hash you provided doesn't match the expected format.

**Why it matters:** Story Protocol needs valid IPFS hashes to reference metadata stored on IPFS.

**How to fix:**

1. **Check hash format:**
   - Must start with `Qm` or `ipfs://`
   - Example: `QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxX`
   - Full URI: `ipfs://QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxX`

2. **Verify hash source:**
   - If you uploaded to Pinata, use the `IpfsHash` field from the response
   - Don't include HTTP gateway URLs (like `https://gateway.pinata.cloud/...`)

3. **Retry registration:**
   ```bash
   story register --metadata-hash QmYOUR_VALID_HASH
   ```

#### Transaction Revert Errors

**Error:**
```
Transaction reverted on blockchain
The transaction was rejected by the Story Protocol smart contract
```

**What went wrong:** The blockchain rejected your transaction during execution.

**Why it matters:** Your IP registration failed and you may have lost gas fees.

**How to fix:**

1. **Check gas balance** - Ensure you have sufficient ETH:
   ```bash
   story status
   ```

2. **Verify network** - Confirm you're on the correct network (testnet vs mainnet):
   ```bash
   story config get network
   ```

3. **Check wallet permissions** - Ensure your wallet has permission to interact with Story Protocol contracts

4. **Retry with existing metadata** - Avoid re-uploading to IPFS:
   ```bash
   story register --metadata-hash QmYOUR_HASH
   ```

5. **Enable debug mode** - Get detailed error information:
   ```bash
   story register --debug
   ```

6. **Contact support** - If the issue persists, report it with debug logs

#### Rate Limiting (Pinata API)

**Error:**
```
Rate limit exceeded for Pinata
Too many requests to Pinata API. Wait 60 seconds and try again.
```

**What went wrong:** You've exceeded Pinata's API rate limits for your account tier.

**Why it matters:** The CLI cannot upload metadata to IPFS until the rate limit resets.

**How to fix:**

1. **Wait 60 seconds** - Rate limits typically reset quickly on free tier
2. **Use existing metadata hash** - Skip upload with `--metadata-hash` flag:
   ```bash
   story register --metadata-hash QmYOUR_EXISTING_HASH
   ```
3. **Upgrade Pinata plan** - For higher rate limits, upgrade at [pinata.cloud](https://pinata.cloud)
4. **Reduce concurrent uploads** - Don't run multiple registrations simultaneously

#### Command Not Found / Typos

**Error:**
```
Unknown command: 'registr'
Did you mean 'register'?
```

**What went wrong:** You entered a command that doesn't exist, likely due to a typo.

**Why it matters:** The CLI can't execute non-existent commands.

**How to fix:**

1. **Check suggestion** - The CLI uses smart suggestions powered by didyoumean library
2. **Use correct command name** - Follow the suggestion provided
3. **View available commands:**
   ```bash
   story --help
   ```

Valid commands: `register`, `portfolio`, `status`, `config`

### Enable Debug Mode

When troubleshooting issues, debug mode provides comprehensive diagnostic information.

**How to Enable:**

Option 1 - Using `--debug` flag:
```bash
story register --debug
story config get --debug
story status --debug
```

Option 2 - Using `DEBUG` environment variable:
```bash
export DEBUG=true
story register
```

**What Debug Mode Shows:**

- **Verbose SDK calls** - All Story Protocol SDK method invocations with parameters
- **API requests/responses** - Complete HTTP requests to Pinata, Story Protocol APIs with response bodies
- **Full stack traces** - Detailed error traces showing exact failure points in code
- **Validation steps** - Step-by-step validation output for debugging input issues
- **Configuration loading** - Which config file is loaded and what values are used

**Security Note:** Private keys are never logged, even in debug mode.

**Example Debug Output:**

```bash
$ story register --debug

[DEBUG] Debug mode enabled
[DEBUG] Loading configuration from /Users/you/.storyrc
[DEBUG] Configuration loaded: {"network":"testnet","walletAddress":"0x1234..."}
[DEBUG] Validating wallet address: 0x1234567890abcdef1234567890abcdef12345678
[DEBUG] Connecting to Story Protocol RPC: https://aeneid.storyrpc.io
[DEBUG] Checking gas balance for: 0x1234567890abcdef1234567890abcdef12345678
[DEBUG] Gas balance: 0.5 ETH (sufficient)
[DEBUG] Uploading metadata to Pinata...
[DEBUG] Pinata API request: POST https://api.pinata.cloud/pinning/pinJSONToIPFS
[DEBUG] Pinata response: {"IpfsHash":"QmXXX...ABC","PinSize":256}
[DEBUG] Metadata uploaded: ipfs://QmXXX...ABC
[DEBUG] Initiating IP registration transaction...
[DEBUG] Transaction hash: 0xabc123...def789
[DEBUG] Waiting for transaction confirmation...
[DEBUG] Transaction confirmed in block 12345678
[DEBUG] IP registered with ID: 987654321
```

### Getting Additional Help

If you're still experiencing issues after trying the solutions above:

1. **Run command-specific help:**
   ```bash
   story --help
   story register --help
   story config --help
   story status --help
   ```

2. **Check Story Protocol documentation:**
   - [Story Protocol Official Docs](https://docs.story.foundation)
   - [Story Protocol TypeScript SDK](https://github.com/storyprotocol/story-protocol-sdk)

3. **Report issues:**
   - GitHub Issues: [https://github.com/Zolldyk/story-cli/issues](https://github.com/Zolldyk/story-cli/issues)
   - Include debug logs (with `--debug` flag output)
   - Specify your OS, Node.js version, and CLI version

4. **Check system requirements:**
   ```bash
   node --version    # Should be 18.0.0 or higher
   npm --version     # Should be 9.0.0 or higher
   story --version   # Current CLI version
   ```

## Configuration

### Config File Location

Story CLI stores configuration in `~/.storyrc` with `600` file permissions (owner read/write only) for security.

To view the config file path:
```bash
story config path
```

### Configuration File Format

The configuration file uses JSON format. Example:

```json
{
  "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "network": "testnet",
  "pinataApiKey": "your_pinata_api_key",
  "pinataApiSecret": "your_pinata_secret",
  "rpcUrl": "https://aeneid.storyrpc.io"
}
```

### Configuration Fields

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| `walletAddress` | Yes* | Ethereum wallet address for signing transactions | `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb` |
| `network` | Yes | Target network: `testnet` or `mainnet` | `testnet` |
| `pinataApiKey` | Yes* | Pinata API key for IPFS metadata uploads | `your_api_key` |
| `pinataApiSecret` | Yes* | Pinata API secret for IPFS authentication | `your_api_secret` |
| `rpcUrl` | No | Custom RPC endpoint (uses defaults if not set) | `https://aeneid.storyrpc.io` |

\* Required for `story register` command

### Environment Variable Overrides

Environment variables take precedence over config file values:

| Environment Variable | Overrides Config Field | Use Case |
|---------------------|------------------------|----------|
| `STORY_PRIVATE_KEY` | `walletAddress` | Securely provide private key without storing in config |
| `PINATA_API_KEY` | `pinataApiKey` | CI/CD pipelines, temporary credentials |
| `PINATA_API_SECRET` | `pinataApiSecret` | CI/CD pipelines, temporary credentials |
| `STORY_RPC_URL` | `rpcUrl` | Use custom RPC endpoint without modifying config |

Example usage:
```bash
export PINATA_API_KEY="your_temp_key"
export PINATA_API_SECRET="your_temp_secret"
story register
```

### Config Commands

**Set a configuration value:**
```bash
story config set <key> <value>
```

Examples:
```bash
story config set walletAddress 0x1234567890abcdef1234567890abcdef12345678
story config set network testnet
story config set pinataApiKey your_pinata_api_key
story config set pinataApiSecret your_pinata_api_secret
story config set rpcUrl https://aeneid.storyrpc.io
```

**Get configuration values:**
```bash
# Display all config values
story config get

# Display specific config value
story config get walletAddress
```

**Display config file path:**
```bash
story config path
# Output: /Users/you/.storyrc
```

### Security Best Practices

⚠️ **IMPORTANT SECURITY WARNINGS:**

1. **Never commit your `.storyrc` file to git** - Add it to `.gitignore` immediately:
   ```bash
   echo ".storyrc" >> ~/.gitignore
   ```

2. **File permissions are automatically set to `600`** - Only the owner can read/write the config file

3. **Never log or share your config file** - It contains sensitive API credentials

4. **Use environment variables for private keys** - Never store private keys in the config file, use `STORY_PRIVATE_KEY` environment variable instead

5. **Rotate credentials regularly** - If you suspect your credentials are compromised, regenerate them immediately on Pinata and update your config

## Contributing

**Issues and PRs welcome!** Story CLI is open for community contributions. We welcome bug reports, feature suggestions, and pull requests from developers of all skill levels.

### How to Contribute

**Report Bugs or Suggest Features:**
- Visit our GitHub Issues page: [https://github.com/Zolldyk/story-cli/issues](https://github.com/Zolldyk/story-cli/issues)
- Search existing issues to avoid duplicates
- Provide clear descriptions and reproduction steps for bugs
- Tag feature requests appropriately

**Submit Pull Requests:**
- Fork the repository
- Create a feature branch from `main`
- Make your changes following our coding standards
- Write tests for new functionality
- Submit a PR with a clear description of changes

### Development Setup

To contribute code to Story CLI, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Zolldyk/story-cli.git
   cd story-cli
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run in development mode with hot-reload:**
   ```bash
   npm run dev

   # Example: Test a command during development
   npm run dev register --debug
   ```

4. **Run tests:**
   ```bash
   # Run all tests once
   npm test

   # Run tests in watch mode (re-runs on file changes)
   npm run test:watch
   ```

5. **Lint your code:**
   ```bash
   npm run lint
   ```

6. **Format code with Prettier:**
   ```bash
   npm run format
   ```

7. **Build for production:**
   ```bash
   npm run build

   # Output will be in dist/ directory
   ```

### Coding Standards

All contributors must follow the project's coding standards:

- **TypeScript 5.3.3** - All source code must be TypeScript
- **ESLint** - Code must pass linting (`npm run lint`)
- **Prettier** - Code must be formatted (`npm run format`)
- **No `console.log`** - Use `TerminalUI` for output instead
- **Explicit return types** - All functions must have return type annotations
- **Error handling** - Throw typed exceptions, not generic `Error`
- **Test coverage** - Write unit tests for new features (minimum 70% coverage for pure functions)

See [docs/architecture/coding-standards.md](docs/architecture/coding-standards.md) for complete guidelines.

### Project Structure

```
story-cli/
├── src/
│   ├── commands/        # Command implementations (register, config, status)
│   ├── lib/             # Core libraries (clients, validation, UI)
│   ├── types/           # TypeScript type definitions
│   ├── constants/       # Constants (networks, licenses)
│   └── index.ts         # CLI entry point
├── tests/
│   ├── unit/            # Unit tests for individual components
│   ├── integration/     # Integration tests for command workflows
│   └── mocks/           # Mock implementations for testing
└── docs/                # Documentation and architecture
```

### Future Contribution Guidelines

Detailed contribution guidelines, including:
- Code review process
- Commit message conventions
- Branch naming standards
- Release process

...will be added post-hackathon as the project matures.

### Questions?

If you have questions about contributing, feel free to:
- Open a GitHub Discussion
- Comment on relevant issues
- Reach out via the Story Protocol community channels

Thank you for helping make Story CLI better! 🎉

## Resources

### Official Documentation

- **[Story Protocol Official Docs](https://docs.story.foundation)** - Complete reference for Story Protocol APIs, blockchain concepts, and integration patterns. Authoritative source for all Story Protocol development.
- **[Story Protocol TypeScript SDK](https://github.com/storyprotocol/story-protocol-sdk)** - Official SDK used by Story CLI for blockchain interactions
- **[Pinata IPFS Documentation](https://docs.pinata.cloud)** - Guide for IPFS storage and Pinata API usage

### Story Protocol Network Resources

- **[Story Protocol Testnet Faucet](https://faucet.story.foundation)** - Get free testnet tokens for development and testing
- **[Story Protocol Testnet Explorer](https://aeneid.explorer.story.foundation)** - View transactions, IP assets, and blockchain activity on testnet
- **[Story Protocol Mainnet Explorer](https://explorer.story.foundation)** - View mainnet transactions and IP registrations

### Built With

Story CLI is built with modern, production-ready technologies:

#### Core Framework
- **[Node.js 20.11.0 LTS](https://nodejs.org/)** - JavaScript runtime
- **[TypeScript 5.3.3](https://www.typescriptlang.org/)** - Type-safe language for development
- **[Commander.js 11.1.0](https://github.com/tj/commander.js)** - CLI framework for command routing

#### User Experience
- **[Inquirer.js 9.2.12](https://github.com/SBoudrias/Inquirer.js)** - Interactive command-line prompts
- **[Chalk 5.3.0](https://github.com/chalk/chalk)** - Terminal text styling
- **[Ora 7.0.1](https://github.com/sindresorhus/ora)** - Elegant terminal spinners
- **[Boxen 7.1.1](https://github.com/sindresorhus/boxen)** - Boxed messages for success celebrations

#### Blockchain & Storage
- **[Story Protocol SDK](https://github.com/storyprotocol/story-protocol-sdk)** - Official Story Protocol blockchain SDK
- **[viem 2.21.0](https://viem.sh/)** - Modern Ethereum library for wallet management
- **[Pinata SDK 2.1.0](https://docs.pinata.cloud/sdks/nodejs)** - IPFS file storage via Pinata

#### Development Tools
- **[Vitest 1.2.0](https://vitest.dev/)** - Fast unit testing framework
- **[ESLint 8.56.0](https://eslint.org/)** - Code quality linting
- **[Prettier 3.2.4](https://prettier.io/)** - Code formatting
- **[tsx 4.7.0](https://github.com/esbuild-kit/tsx)** - TypeScript execution for development

## License

MIT License

Copyright (c) 2024 Story CLI Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
