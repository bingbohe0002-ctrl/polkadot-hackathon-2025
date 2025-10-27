# Worboo Polkadot Hackathon Implementation Plan

## Milestone 0 – Environment Setup (Day 0)
- [x] Initialize `packages/contracts` Hardhat workspace (TypeScript).
- [x] Install OpenZeppelin/contracts, hardhat-toolbox, dotenv, @nomicfoundation/hardhat-ignition.
- [x] Configure networks: `hardhat`, `moonbase` (RPC + chainId 1287), `moonbeam`.
- [x] Generate `.env.example` with `PRIVATE_KEY`, `MOONBASE_RPC`, `MOONBEAM_RPC`.
- [ ] Add formatting/linting (Prettier, ESLint) and `pnpm` workspace glue if needed.

## Milestone 1 – Core Contracts (Day 1–2)
- [x] Scaffold `WorbooRegistry`, `WorbooToken`, `WorbooShop` contracts (OpenZeppelin-based).
- [x] Write Foundry unit tests (e.g., `test/WorbooRegistry.t.sol`, etc.).
- [x] Add Hardhat deployment scripts + Ignition module.
- [ ] Run gas snapshot + coverage (`forge coverage`, `npx hardhat coverage`).

## Milestone 2 – Frontend Integration (Day 2–3)
- [x] Replace `wagmi` config with Moonbase endpoints.
- [x] Create `src/services/contracts.ts` to instantiate ethers.js contracts.
- [x] Implement hooks/components: balances, inventory, purchase flow.
- [x] Add tests covering new services (shop utilities, contracts config).

## Milestone 3 – Docs & DX (Day 3)
- [x] Rewrite root `README.md` to reflect Polkadot focus, setup steps, deployment instructions.
- [x] Update `doc/README - polkadot.md` with new narrative + architecture highlights.
- [x] Document testing commands and contribution workflow.
- [x] Prepare demo walkthrough script.

## Optional Stretch
- [ ] Simple Subsquid indexer for leaderboards.
- [ ] Off-chain relayer prototype for auto minting rewards.
- [ ] UI polish for wallet onboarding (Talisman/Polkadot{.js} support).
