# Worboo Parachain Targeting Notes

## Candidate Overview

- **Moonbase Alpha (Moonbeam Testnet)**: mature REVM-compatible environment with full Ethereum JSON-RPC parity, Hardhat/Foundry tooling, and RainbowKit support via standard EVM wallets. Active faucets, predictable block times (~12s), and seamless mainnet promotion path to Moonbeam.
- **Astar zKyoto / Shibuya**: strong WASM tooling and zk experimentation, but ink!/WASM-first. EVM compatibility lagged behind Ethereum tooling, and ecosystem docs focus on native dApps rather than quick migrations.
- **Tanssi AppChains**: promising containerized parachain approach, yet requires spinning up a dedicated appchain and handling onboarding overhead not ideal for hackathon velocity.

## Decision

We will target **Moonbase Alpha** for Worboo v1, deploying the production version to Moonbeam mainnet post-hackathon.

### Rationale

1. **Time-to-MVP**: Moonbeam’s Frontier layer exposes the full Ethereum RPC surface backed by REVM, letting us port Solidity contracts with minimal changes and keep the existing Hardhat-centric workflows.
2. **Tooling Fit**: RainbowKit, wagmi, and existing TypeScript service layers work out-of-the-box; no need to swap to Polkadot.js UI for the initial milestone.
3. **Ecosystem Support**: Extensive documentation, faucet availability, and hackathon-friendly infrastructure (SubQuery, Subsquid indexes, The Graph).
4. **Compliance with Hackathon Brief**: Leverages Polkadot’s REVM environment and paves the way for XCM integrations or PVM experiments in later phases.

## Next Steps

- Configure Hardhat networks for Moonbase Alpha + Moonbeam.
- Obtain faucet funds and document wallet setup in the refreshed README.
- Keep an eye on PVM availability for stretch goals (e.g., migrating parts of the logic to Wasm contracts once stable).

