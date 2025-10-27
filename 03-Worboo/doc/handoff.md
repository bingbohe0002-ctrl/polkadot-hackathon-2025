# Worboo Handoff Notes (2025-10-27)

## Current Snapshot

- **Contracts**: `WorbooRegistry`, `WorbooToken`, `WorbooShop` deployed via Ignition module with roles wired (`packages/contracts/ignition/modules/WorbooModule.ts`).
- **Frontend**: React app connects to Moonbase Alpha, fetches balances via `useWorbooPlayer`, and triggers purchases through the deployed contracts.
- **Relayer**: `packages/relayer` package listens for `GameRecorded` events and mints WBOO rewards. Config validated by unit tests.
- **Docs**: README, deployment guide, hackathon dossier, demo playbook, and roadmap updated for Moonbase + relayer workflow.

## Gaps Before “Full Flow” Demo

1. **Relayer feedback in UI** – currently console-only; consider adding toasts or a status indicator so users know rewards were minted.
2. **No persistence/indexing** – inventory relies on real-time contract reads. A Subsquid/SubQuery indexer would enable leaderboards and history.
3. **ZK proof integration** – the original Halo2 pipeline is still offline; bringing it back with IPFS + on-chain attestation is a v2 goal.
4. **Security hardening** – contract roles are minimal; add timelocks or multisig before production deployment.
5. **Testing** – CRA’s legacy tests are partially disabled; migrating to Vite/Vitest would simplify the future suite.

## Focus for Next Contributors

- **Short term**: polish relayer UX, add monitoring/log rotation, and document failure recovery. Consider retry queues or a small database for processed events.
- **Medium term**: build the reward relayer into a proper service (Dockerfile, PM2/forever scripts) and integrate an indexer for leaderboards.
- **Long term**: merge ZK proof validation, experiment with PVM/ink! contracts, and design governance/economics for community seasons.

## Reference Commands

| Task | Command |
| --- | --- |
| Deploy contracts | `npx hardhat ignition deploy ./ignition/modules/WorbooModule.ts --network moonbase` |
| Export addresses | `npm run export:addresses` (packages/contracts) |
| Grant relayer role | `npx hardhat run --network moonbase scripts/grantGameMaster.ts <token> <relayer>` |
| Run relayer | `npm run start` (packages/relayer) |
| Frontend tests | `npm test -- --watch=false --testPathPattern="(shop|contracts|words)"` |

## Contacts / Notes

- Keep private keys in `.env` only; never commit.
- DEV faucet: https://faucet.moonbeam.network/
- Block explorer: https://moonbase.moonscan.io/
- For production: consider swapping to Moonbeam RPCs and revisiting gas estimates (Moonbase uses 1 gwei baseline).

Continue iterating, and log major decisions back into this document or the roadmap so future teammates stay aligned. Good luck! 🟩🟨⬛

