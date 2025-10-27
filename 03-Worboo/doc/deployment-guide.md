# Worboo Deployment Guide (Moonbase Alpha)

This guide walks through the complete setup required to run Worboo end-to-end during the Dot Your Future hackathon. Follow every step to deploy contracts, configure the frontend, and launch the reward relayer.

---

## 1. Prerequisites

| Item | Notes |
| --- | --- |
| Node.js | ≥ 18.x (LTS recommended) |
| npm | ≥ 8.x |
| Git | For cloning this repository |
| Wallet | MetaMask or Moonbeam-compatible wallet with **DEV** tokens |
| RPC Endpoint | `https://rpc.api.moonbase.moonbeam.network` (public) |
| Gas | Moonbase Alpha uses DEV token; request from [Moonbeam faucet](https://faucet.moonbeam.network/) |
| Private Key | Export the private key of your deployment wallet (store securely) |

> ⚠️ Keep your private keys out of version control. `.env` files are gitignored.

---

## 2. Clone & Install

```bash
git clone https://github.com/<your-fork>/worboo.git
cd worboo/03-Worboo

npm install --prefix packages/contracts
npm install --ignore-scripts --prefix react-wordle
npm install --prefix packages/relayer
```

The frontend install uses `--ignore-scripts` to skip husky hooks (the hackathon repo may not be a git repo).

---

## 3. Configure Contract Environment

1. Copy the template:
   ```bash
   cp packages/contracts/.env.example packages/contracts/.env
   ```
2. Fill the values:
   ```ini
   PRIVATE_KEY=0xYOUR_PRIVATE_KEY              # wallet used for deployment
   MOONBASE_RPC=https://rpc.api.moonbase.moonbeam.network
   MOONBEAM_RPC=https://rpc.api.moonbeam.network   # optional mainnet promotion
   ```
3. (Optional) Add [`MNEMONIC`] instead of `PRIVATE_KEY` if you use a seed phrase—Hardhat will prefer `PRIVATE_KEY` when both exist.

---

## 4. Compile & Test Contracts

```bash
cd packages/contracts
npm run compile
npm run test
```

All ten Hardhat tests should pass before deployment.

---

## 5. Deploy to Moonbase Alpha

```bash
# still inside packages/contracts
npx hardhat ignition deploy ./ignition/modules/WorbooModule.ts --network moonbase
```

This deploys the registry, token, and shop contracts, and wires base roles.

### 5.1 Export Addresses for the Frontend

```bash
npm run export:addresses
```

The command prints `REACT_APP_*` lines you can paste into the frontend `.env`. Example output:
```
# Worboo contracts on Moonbase Alpha
REACT_APP_WORBOO_REGISTRY=0x...
REACT_APP_WORBOO_TOKEN=0x...
REACT_APP_WORBOO_SHOP=0x...
```

---

## 6. Configure Frontend

1. Copy the environment template:
   ```bash
   cp react-wordle/.env react-wordle/.env.local   # optional if you prefer a separate file
   ```
2. Set the values from the previous step:
   ```ini
   REACT_APP_WORBOO_REGISTRY=0x...
   REACT_APP_WORBOO_TOKEN=0x...
   REACT_APP_WORBOO_SHOP=0x...
   REACT_APP_RELAYER_HEALTH_URL=http://localhost:8787/healthz
   ```
3. Start the app:
   ```bash
   cd react-wordle
   npm start
   ```
4. Open `http://localhost:3000`, connect your Moonbase wallet, and click **Register** in the yellow banner to emit `PlayerRegistered`.

---

## 7. Grant Relayer Permissions

The relayer needs `GAME_MASTER_ROLE` to mint WBOO on behalf of players.

```bash
cd packages/contracts
npx hardhat run --network moonbase scripts/grantGameMaster.ts <tokenAddress> <relayerWallet>
```

- `<tokenAddress>` – the WorbooToken address (from export step).
- `<relayerWallet>` – the address whose private key you will place in `.env` for the relayer.

Confirm the transaction in block explorers such as https://moonbase.moonscan.io/.

---

## 8. Configure & Run the Reward Relayer (Optional but Recommended)

1. Copy the template:
   ```bash
   cp packages/relayer/.env.example packages/relayer/.env
   ```
2. Fill in the fields:
   ```ini
   RELAYER_RPC_URL=https://rpc.api.moonbase.moonbeam.network
   RELAYER_PRIVATE_KEY=0xRELAYER_PRIVATE_KEY    # wallet with GAME_MASTER_ROLE
   RELAYER_REGISTRY_ADDRESS=0x...
   RELAYER_TOKEN_ADDRESS=0x...
   RELAYER_REWARD_PER_WIN=10                    # optional, defaults to 10 WBOO
   RELAYER_MAX_RETRIES=3                        # optional, defaults to 3 attempts
   RELAYER_BACKOFF_MS=1000                      # optional, base backoff in ms
   RELAYER_CACHE_PATH=.cache/processed-events.jsonl    # optional override
   RELAYER_HEALTH_PATH=.cache/health.json              # optional, used by npm run status
   RELAYER_HEALTH_HOST=0.0.0.0                         # optional, HTTP bind host
   RELAYER_HEALTH_PORT=8787
RELAYER_LOG_FILE=.logs/worboo-relayer.log
RELAYER_LOG_MAX_BYTES=5242880
RELAYER_LOG_BACKUPS=5                            # optional, defaults to 8787
   ```
3. Start the relayer:
   ```bash
   cd packages/relayer
   npm run start
   ```
4. Output example:
   ```
   [relayer] starting Worboo reward listener
    - registry: 0x...
    - token:    0x...
    - reward:   10000000000000000000 wei
    - operator: 0xRELAYER...
    - retries:  3 (backoff 1000ms)
   - cache:    <repo>/.cache/processed-events.jsonl
   ```

When a game win occurs (via `recordGame`), the relayer mints `rewardPerWin` WBOO to the victorious player.

> Processed events are persisted to `.cache/processed-events.jsonl` by default so relayer restarts will not double-mint. Delete the file if you intentionally need to re-run historical events.

Check service health at any time:

```bash
npm run status
```

This prints a JSON snapshot (queue depth, last mint timestamp, processed cache size) using the persisted health file.

The same payload is available over HTTP at `http://localhost:8787/healthz` (adjust host/port via env). Point `REACT_APP_RELAYER_HEALTH_URL` to this endpoint so the navbar can show live queue depth or surface health errors. JSONL logs are written to `.logs/worboo-relayer.log` when `RELAYER_LOG_FILE` is set; rotate/ship them to your logging backend of choice. See [doc/observability.md](observability.md) for Grafana/Prometheus notes.

---

## 9. Frontend Verification

- Connect the same wallet in the UI.
- After registering and winning a puzzle, refresh the shop modal—balance should update once the relayer transaction confirms.
- The navbar now surfaces relayer status: pending wins trigger a banner, and successful mints show `Relayer minted +X WBOO` once the relayer processes the event.
- For manual mint testing, call `mintTo` via Hardhat console:
  ```bash
  npx hardhat console --network moonbase
  > const token = await ethers.getContractAt("WorbooToken", "<tokenAddress>");
  > const role = await token.GAME_MASTER_ROLE();
  > await token.hasRole(role, "<yourRelayer>");
  ```

---

## 10. Test Commands Recap

| Layer | Command |
| --- | --- |
| Contracts | `npm run test` (inside `packages/contracts`) |
| Contracts – coverage | `REPORT_GAS=false npm run coverage` |
| Contracts – gas report | `REPORT_GAS=true npm run gas` |
| Relayer config | `npm run test` (inside `packages/relayer`) |
| Frontend targeted suite | `npm test -- --watch=false --testPathPattern="(shop|contracts|words|RelayerStatusBanner|useRelayerNotifications)"` |

---

## 11. Troubleshooting

| Issue | Fix |
| --- | --- |
| `Error HH8` (network config) | Verify `.env` values, ensure the RPC URL is reachable. |
| Missing balances | Confirm relayer is running, wallet has `GAME_MASTER_ROLE`, and transaction succeeded on Moonscan. |
| CRA Jest errors about `import.meta` | Use the provided test pattern (see section 10) instead of running the full legacy suite. |
| Wallet connection fails | Ensure MetaMask is set to Moonbase Alpha (chainId 1287). |

---

All steps complete—Worboo is now live on Moonbase Alpha with automatic reward minting. Happy hacking! 🟩🟨⬛

