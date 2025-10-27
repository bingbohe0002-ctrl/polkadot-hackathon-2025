# Worboo Polkadot MVP Architecture (No-ZK v1)

## Goals

1. Deliver a playable Worboo experience on Polkadot using Moonbase Alpha (REVM) with minimal friction for existing users.
2. Replace mocked balances/shop inventory with verifiable on-chain state.
3. Establish a TDD-first workflow across contracts, services, and frontend that we can iterate on during the hackathon.

## On-Chain Contracts

| Contract | Responsibility | Key Functions | Notes |
| --- | --- | --- | --- |
| `WorbooRegistry` | Player identity + streak tracking | `register`, `recordGame(uint8 guesses, bytes32 wordHash, bool victory)` | Stores daily game submissions (word hash stored off-chain/IPFS for now). Emits `GameRecorded` events consumed by the UI/indexer. |
| `WorbooToken` (ERC20) | Reward currency for learning quests | `mintTo(address player, uint256 amount)`, `spend(address player, uint256 amount)` | Simple mint/burn model controlled by `GameMaster` role. Built with OpenZeppelin library to reduce risk. |
| `WorbooShop` (ERC1155) | Cosmetic assets + treasure chests | `adminMint`, `purchase(uint256 itemId)`, `openChest(uint256 chestId)` | Accepts `WorbooToken` as payment; maintains drop tables for chest openings. |

### Data Flow

1. Player completes a Wordle round in the browser.
2. UI calls `recordGame` with the day’s salted hash and number of guesses. (For MVP we trust the client; a relayer service can validate later.)
3. `GameRecorded` event triggers token mint via front-end or optional relayer calling `mintTo`.
4. Player spends tokens in `WorbooShop` to acquire cosmetics. Inventory changes are reflected through events.

## Off-Chain Components (Optional for Demo Day)

- **Reward Relayer**: Listens to `GameRecorded`, validates submission business logic, and calls `WorbooToken.mintTo`. MVP can run this manually.
- **Indexer**: Subsquid/SubQuery schema to power leaderboards and history views (stretch goal).

## Frontend Updates

- Replace `wagmi` chain config with Moonbase Alpha connection (standard RPC endpoint + faucet instructions).
- Add a lightweight service layer (`src/services/contracts.ts`) wrapping ethers.js contract instances.
- Introduce React Query hooks for balances, inventory, and game submissions.
- Update Navbar shop flows to call `purchase`/`openChest`.
- Provide fallback for users without wallets (read-only mode + invite to connect).

## TDD Matrix

| Layer | Tooling | Focus Tests | Coverage Targets |
| --- | --- | --- | --- |
| Contracts | Hardhat + Foundry (forge) | Unit tests for each function, property/invariant tests (e.g., token supply, shop pricing), fuzz tests on chest randomness bounds | 90%+ branch; CI gating |
| Frontend | Vitest/Jest + React Testing Library | Hook tests for contract service, component tests for shop flows, integration test simulating record + purchase (using ethers.js mock provider) | Critical paths covered |
| Off-chain (if added) | Jest + supertest | API handler tests, event listener mocks, failure injection | 80% branch |
| End-to-End | Playwright | Wallet connect (Mocked), submit game, buy cosmetic | Smoke per PR |

Test-first discipline: write failing tests for each contract endpoint before implementation. Enforce via lint-staged hook and CI pipeline.

## Security & Operational Notes

- Roles: deployer as `Admin`, delegated `GameMaster` for mint/burn. Use OpenZeppelin `AccessControl`.
- Emergency pause: `WorbooShop` implements `Pausable` to handle mispriced loot boxes.
- Upgrade strategy: use simple deployment for hackathon; document migration path to proxies if needed post-event.

## Post-MVP Enhancements

- Integrate Halo2 proofs via relayer once verifier options mature.
- Explore PVM/ink! modules for mini-games or governance.
- Implement on-chain seasonal leaderboards leveraging Substrate pallets or off-chain workers.

