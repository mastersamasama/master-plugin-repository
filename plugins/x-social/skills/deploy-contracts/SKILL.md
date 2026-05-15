---
name: deploy-contracts
description: This skill should be used when the user asks to "deploy x-social contracts", "set up ZKVerifyRegistry", "deploy PrivacyEscrow", "deploy AgentRegistry8004", or wants to deploy the x-social smart contract suite to X Layer or a local Hardhat node.
---

# deploy-contracts

Deploy the X-Social smart contract suite (ZKVerifyRegistry, PrivacyEscrow, AgentRegistry8004) to X Layer testnet or a local Hardhat node using Foundry.

## Prerequisites

Before deploying, verify the following are installed:

1. **Foundry** — run `forge --version` to check. If missing, install via `curl -L https://foundry.paradigm.xyz | bash && foundryup`.
2. **Solidity 0.8.24** — the contracts require this version (configured in `contracts/foundry.toml`).

## Contract architecture

X-Social has three core contracts deployed in order (each depends on the previous):

```
ZKVerifyRegistry (standalone)
    |
    v
PrivacyEscrow (requires ZKVerifyRegistry address + payment token address)
    |
    v
AgentRegistry8004 (requires IERC8004Reputation address + PrivacyEscrow address)
```

## Deployment steps

### Step 1: Build contracts

```bash
cd contracts
forge build
```

Verify all three compile without errors:
- `src/ZKVerifyRegistry.sol`
- `src/PrivacyEscrow.sol`
- `src/AgentRegistry8004.sol`

### Step 2: Deploy ZKVerifyRegistry

This is the core DID registry. It manages ZK verification tags (IDENTITY, HEALTH_REPORT, AGE_RANGE, INCOME_RANGE, EDUCATION, SOCIAL_SCORE, CUSTOM).

```bash
forge create src/ZKVerifyRegistry.sol:ZKVerifyRegistry \
  --rpc-url <RPC_URL> \
  --private-key $DEPLOYER_KEY
```

The deployer automatically becomes `owner` and is added to `trustedRelayers`.

Save the deployed address as `REGISTRY_ADDR`.

### Step 3: Deploy PrivacyEscrow

PrivacyEscrow requires two constructor args:
- `_registry`: the ZKVerifyRegistry address from Step 2
- `_paymentToken`: an ERC-20 token address (e.g. USDC on X Layer), or `address(0)` for ETH-only mode

```bash
forge create src/PrivacyEscrow.sol:PrivacyEscrow \
  --constructor-args $REGISTRY_ADDR $PAYMENT_TOKEN_ADDR \
  --rpc-url <RPC_URL> \
  --private-key $DEPLOYER_KEY
```

Save the deployed address as `ESCROW_ADDR`.

### Step 4: Deploy AgentRegistry8004

AgentRegistry8004 requires:
- `_reputationRegistry`: an ERC-8004 Reputation Registry address (or a mock)
- `_escrow`: the PrivacyEscrow address from Step 3

```bash
forge create src/AgentRegistry8004.sol:AgentRegistry8004 \
  --constructor-args $REPUTATION_REGISTRY_ADDR $ESCROW_ADDR \
  --rpc-url <RPC_URL> \
  --private-key $DEPLOYER_KEY
```

Save the deployed address as `AGENT_REGISTRY_ADDR`.

### Step 5: Post-deployment wiring

After all three contracts are deployed, wire them together:

1. **Set AgentRegistry on PrivacyEscrow** — so P2P scores can sync:
   ```bash
   cast send $ESCROW_ADDR "setAgentRegistry8004(address)" $AGENT_REGISTRY_ADDR \
     --rpc-url <RPC_URL> --private-key $DEPLOYER_KEY
   ```

2. **Add Agent addresses to PrivacyEscrow** — authorize the agent service to arbitrate:
   ```bash
   cast send $ESCROW_ADDR "addAgent(address)" $AGENT_WALLET \
     --rpc-url <RPC_URL> --private-key $DEPLOYER_KEY
   ```

3. **Register agents in AgentRegistry8004** — give them ERC-8004 identity:
   ```bash
   cast send $AGENT_REGISTRY_ADDR \
     "registerAgent(address,uint256,string)" $AGENT_WALLET 1 "matchmaker" \
     --rpc-url <RPC_URL> --private-key $DEPLOYER_KEY
   ```

### Step 6: Verify deployment

```bash
# Check ZKVerifyRegistry owner
cast call $REGISTRY_ADDR "owner()(address)" --rpc-url <RPC_URL>

# Check PrivacyEscrow is wired to registry
cast call $ESCROW_ADDR "registry()(address)" --rpc-url <RPC_URL>

# Check AgentRegistry8004 escrow link
cast call $AGENT_REGISTRY_ADDR "escrow()(address)" --rpc-url <RPC_URL>
```

## Network reference

| Network | RPC URL |
|---------|---------|
| X Layer Testnet | `https://testrpc.xlayer.tech` |
| X Layer Mainnet | `https://rpc.xlayer.tech` |
| Local Hardhat | `http://localhost:8545` |

## Escrow types

When creating deposits, use these enum values:
- `0` = GATE_FEE (dating gate fee)
- `1` = CONTENT_ACCESS (paid content)
- `2` = SERVICE_PAYMENT (service payment)

## Tag types for ZKVerifyRegistry

- `0` = IDENTITY
- `1` = HEALTH_REPORT
- `2` = AGE_RANGE
- `3` = INCOME_RANGE
- `4` = EDUCATION
- `5` = SOCIAL_SCORE
- `6` = CUSTOM
