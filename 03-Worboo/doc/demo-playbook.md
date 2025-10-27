# Worboo Demo Playbook

This guide is written for live judging sessions. Follow it to demonstrate the Worboo MVP in under 5 minutes.

---

## 1. Pre-demo Checklist

- [ ] Have a wallet loaded with DEV tokens on **Moonbase Alpha** (use https://faucet.moonbeam.network/).
- [ ] Deploy the contracts and export addresses:
  ```bash
  cd packages/contracts
  npm run deploy:moonbase
  npm run export:addresses > ../../react-wordle/.env.local
  ```
  (Alternatively, copy the output into `react-wordle/.env`.)
- [ ] Run `npm run test` inside `packages/contracts` to show the TDD workflow.
- [ ] Start the frontend with `npm start` inside `react-wordle`.

---

## 2. Demo Flow (Approx. 4 minutes)

### Step 1 – Introduce the Experience (30s)
- Explain that Worboo is a daily word-learning challenge with on-chain incentives.
- Highlight that the repo contains both the React front-end and the Solidity smart contracts deployed on Moonbase Alpha.

### Step 2 – Connect Wallet & Register (45s)
- Open the running React app.
- Click **Connect Wallet** (RainbowKit) and choose MetaMask (or other Moonbase-ready wallet).
- After connecting, the yellow banner will prompt on-chain registration. Click **Register**, confirm the transaction, and point out the emitted `PlayerRegistered` event in the wallet explorer.

### Step 3 – Play a Puzzle (60s)
- Enter a few guesses in the Wordle interface.
- Upon success (or simulated success), mention how `recordGame` logs the play, updates streak counts, and how rewards will be minted via the relayer or manual call.
- Optional: show the Hardhat console call for `recordGame` using `hardhat console --network moonbase`.

### Step 4 – Claim Rewards & Shop (60s)
- Highlight the **WBOO Balance** indicator in the shop modal (navbar → bag icon).
- Demonstrate purchasing an item that costs WBOO (e.g., `Classic Worboo`). The UI will trigger the `purchase` contract call, burn tokens, and add the ERC-1155 item to inventory.
- Equip the newly acquired cosmetic to show the state change.

### Step 5 – Wrap-up (45s)
- Mention the documentation assets (README, Polkadot dossier, architecture notes).
- Outline next milestones: automated reward relayer, ZK proof reintegration, cross-chain engagement.

---

## 3. Troubleshooting Tips

- **No DEV balance**: revisit the Moonbeam faucet. Ensure the wallet network is Moonbase Alpha (chainId 1287).
- **Registration button stuck**: refresh after the transaction confirms; the UI refetches profile data via React Query.
- **Contract addresses incorrect**: rerun `npm run export:addresses` and copy the output back into the frontend `.env`.
- **Tests complaining about `import.meta`**: use `npm test -- --watch=false --testPathPattern=\"(shop|contracts|words).test.ts\"` for the curated suite.

---

## 4. Follow-up Talking Points

- The architecture is deliberately modular: WorbooToken and WorbooShop can be extended for future seasons, cross-chain rewards, and DAO governance.
- Halo2 WASM workers remain in the repo for future “proof-of-play” upgrades once parachain verifier support matures.
- Documentation is ready for investors/mentors—point them to `README.md` and `doc/README - polkadot.md`.

Happy demoing! 🟩🟨⬛
