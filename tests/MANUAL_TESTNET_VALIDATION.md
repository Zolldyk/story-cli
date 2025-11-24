# Manual Testnet Validation Checklist - Story 1.7 Task 15

**Status:** ⏸️ BLOCKED - Requires real wallet with testnet funds

**Last Updated:** 2025-11-23

## Prerequisites

- [ ] Story Protocol testnet wallet with funds (min 0.01 IP tokens)
- [ ] Testnet faucet accessed: https://faucet.story.foundation
- [ ] Environment variables configured:
  - `STORY_PRIVATE_KEY` - Private key for testnet wallet
  - `PINATA_API_KEY` - Pinata API key
  - `PINATA_API_SECRET` - Pinata API secret

## Test Cases

### 1. Complete Registration on Testnet (AC 1-10)

**Objective:** Verify end-to-end IP registration with real blockchain transaction

**Steps:**
1. Prepare test file (e.g., `test-artwork.jpg`)
2. Run: `npm start register ./test-artwork.jpg`
3. Complete license wizard (select any license type)
4. Provide metadata:
   - Name: "Test IP Asset [timestamp]"
   - Description: "Manual testnet validation for Story 1.7"
   - Image Hash: (provide valid IPFS hash or real image)
5. Confirm metadata upload
6. Review transaction summary
7. Confirm transaction

**Expected Results:**
- [ ] Transaction executes successfully
- [ ] Spinner displays: "Registering IP on Story Protocol [testnet]..."
- [ ] Success message displays in Boxen with 🎉
- [ ] IP ID matches format: `0x[40 hex characters]`
- [ ] Transaction hash is valid and clickable
- [ ] Block explorer link opens: `https://aeneid.explorer.story.foundation/tx/[hash]`
- [ ] IPFS metadata link displays correct JSON
- [ ] Cache file created at `~/.storyrc-cache.json` with permissions 0o600

**Actual Results:**
```
[To be filled during manual execution]
```

### 2. Verify IP ID On-Chain (AC 4)

**Objective:** Confirm IP ID returned matches blockchain state

**Steps:**
1. Copy IP ID from success message
2. Query blockchain using Story Protocol explorer or API
3. Verify IP ID exists on-chain

**Expected Results:**
- [ ] IP ID exists in blockchain state
- [ ] Owner address matches wallet address
- [ ] Metadata hash matches IPFS hash from registration

**Actual Results:**
```
[To be filled during manual execution]
```

### 3. Insufficient Gas Balance Scenario (AC 9)

**Objective:** Verify gas balance check prevents transaction

**Steps:**
1. Use wallet with insufficient balance (< 0.001 IP tokens)
2. Attempt registration flow
3. Observe error at gas balance check

**Expected Results:**
- [ ] Transaction prevented before submission
- [ ] Error message displays: "Insufficient gas balance: [amount] ETH"
- [ ] Testnet faucet URL displayed: `https://faucet.story.foundation`
- [ ] Three-part error format (what/why/how) used

**Actual Results:**
```
[To be filled during manual execution]
```

### 4. Transaction Failure with Retry (AC 9)

**Objective:** Verify IPFS hash preserved for retry after transaction failure

**Steps:**
1. Complete registration flow up to transaction execution
2. Simulate transaction failure (disconnect network or cause revert)
3. Observe error message with IPFS hash
4. Retry using: `npm start register <file> --metadata-hash [hash]`

**Expected Results:**
- [ ] Error displays IPFS hash for retry
- [ ] Retry command shown: `story register <file> --metadata-hash [hash]`
- [ ] Retry with `--metadata-hash` skips metadata upload
- [ ] Transaction executes successfully on retry

**Actual Results:**
```
[To be filled during manual execution]
```

### 5. Network Disconnection During Transaction (AC 9)

**Objective:** Verify timeout handling after 60 seconds

**Steps:**
1. Start registration flow
2. Disconnect network before transaction confirmation
3. Wait for timeout (60 seconds)

**Expected Results:**
- [ ] Transaction times out after 60 seconds
- [ ] Error message displays: "Transaction timed out after 60 seconds"
- [ ] Troubleshooting steps provided
- [ ] IPFS hash displayed for retry

**Actual Results:**
```
[To be filled during manual execution]
```

### 6. Block Explorer Link Verification (AC 7)

**Objective:** Verify block explorer links are clickable and correct

**Steps:**
1. Complete successful registration
2. Click block explorer link in terminal
3. Verify transaction details in browser

**Expected Results:**
- [ ] Link opens in browser
- [ ] Transaction details match CLI output
- [ ] Transaction status shows "Success"

**Actual Results:**
```
[To be filled during manual execution]
```

### 7. IPFS Metadata Link Verification (AC 7)

**Objective:** Verify IPFS metadata link displays correct JSON

**Steps:**
1. Complete successful registration
2. Copy IPFS metadata link
3. Open link in browser

**Expected Results:**
- [ ] Link opens: `https://gateway.pinata.cloud/ipfs/[hash]`
- [ ] JSON displays correct metadata (name, description, imageHash)
- [ ] All fields match inputs from registration flow

**Actual Results:**
```
[To be filled during manual execution]
```

### 8. Cache File Verification (AC 10)

**Objective:** Verify cache file created with correct structure and permissions

**Steps:**
1. Complete successful registration
2. Check cache file: `cat ~/.storyrc-cache.json`
3. Verify permissions: `ls -la ~/.storyrc-cache.json`

**Expected Results:**
- [ ] Cache file exists at `~/.storyrc-cache.json`
- [ ] Permissions are `0o600` (-rw-------)
- [ ] Structure matches:
  ```json
  {
    "registrations": [
      {
        "ipId": "0x...",
        "transactionHash": "0x...",
        "blockNumber": 12345,
        "metadataHash": "Qm...",
        "licenseConfig": { ... },
        "owner": "0x...",
        "timestamp": "2025-11-23T...",
        "explorerUrl": "https://..."
      }
    ],
    "lastUpdated": "2025-11-23T..."
  }
  ```

**Actual Results:**
```
[To be filled during manual execution]
```

## Sign-Off

**Tester Name:** ___________________

**Date Executed:** ___________________

**Testnet Network:** [ ] testnet [ ] mainnet

**Overall Result:** [ ] PASS [ ] FAIL [ ] BLOCKED

**Notes:**
```
[Additional observations, issues, or blockers]
```

## Blocker Resolution

**Current Blocker:** Real wallet with testnet funds not available in CI/CD environment

**Resolution Options:**
1. Execute manually by developer with testnet wallet
2. Execute as part of QA validation before production deployment
3. Set up CI/CD with funded testnet wallet for automated manual tests

**Recommended:** Execute as part of pre-release QA validation cycle
