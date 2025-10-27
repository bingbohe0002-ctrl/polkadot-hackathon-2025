# Worboo Relayer & UX Upgrade Plan

Prepared before implementation to keep the TDD cadence intact and document the intended behaviour for Milestones 4–5.

---

## 1. Objectives

1. **Persist relayer progress** so a restart never double-mints rewards.
2. **Handle transient failures** with retries/backoff and explicit logging.
3. **Surface reward feedback in the UI** without relying on manual balance checks.

---

## 2. Relayer Persistence Strategy

### Storage Approach
- Introduce `ProcessedEventStore` in `packages/relayer/src/store.ts`.
- Use a lightweight JSONL file under `packages/relayer/.cache/processed-events.jsonl` (path configurable via env var).
- Each entry stores `{ key, mintedAt, txHash }`, where `key = <txHash>:<logIndex>`.
- On boot: load unique keys into memory (Set).
- On success: append to file (atomic `fs.appendFile`), flush before resolving handler.
- On failure: do **not** persist key so retries are possible after recovery.

### Retry & Backoff
- Wrap `token.mintTo` call with configurable retries:
  - Defaults: 3 attempts, exponential backoff (1s, 3s, 9s).
  - Environment variables: `RELAYER_MAX_RETRIES`, `RELAYER_BACKOFF_MS`.
- Retry metadata logged with structured messages.

### Tests (Vitest)
1. `store.test.ts`
   - creates temp directory, ensures persistence across instances.
   - verifies duplicate writes are idempotent.
   - confirms corrupted file entries throw and bubble clearly.
2. `relayer.test.ts`
   - mocks ethers contracts (using vi.fn()).
   - ensures retries trigger with matching delays (use fake timers).
   - validates processed keys are persisted only after successful mint.

Tests come first; production code implements the minimum to satisfy them.

---

## 3. Frontend Relayer Feedback

### UX Behaviour
- Listen for `Transfer` events on `WorbooToken` where `from === ZeroAddress` and `to === connected address`.
- When detected:
  - Show toast/banner in navbar: “Relayer minted +{amount} {tokenSymbol}”.
  - Trigger a balance refetch to keep UI in sync.
- Track outstanding wins locally:
  - When `recordGame` is triggered (client emits), start a 45s watchdog timer.
  - If no mint arrives within the window, surface a warning (“Reward pending… relayer may be offline.”).
  - Clear warning on success or manual refresh.

### Implementation Notes
- Add `useRelayerNotifications` hook encapsulating event subscription + timers.
- Hook returns `{ latestSuccess, pendingRewardCount, warning }`.
- Navbar consumes the hook to render inline banner (no new dependency).

### Tests (React Testing Library + Vitest)
1. `useRelayerNotifications.test.tsx`
   - Mocks ethers provider + event emitter.
   - Asserts success toast appears on minted event.
   - Uses fake timers to assert warning after timeout without event.
2. `Navbar.relayerspec.test.tsx`
   - Renders navbar with mocked hook outputs.
   - Ensures banner renders with correct copy and refresh button calls `refresh`.

---

## 4. Execution Order (TDD)

1. Write failing unit tests for `ProcessedEventStore`.
2. Implement store + wire into relayer handler until tests pass.
3. Add retry tests → implement retry logic.
4. Author hook tests for relayer notifications.
5. Build the hook and update navbar component to satisfy tests.
6. Update docs (`deployment-guide.md`, `handoff.md`) with new env vars, storage notes, and UX cues.

---

## 5. Risks & Mitigations
- **File write permissions**: default cache path stays within repo; allow override via env.
- **Large log growth**: for hackathon scale acceptable; document manual truncation.
- **Timer drift**: rely on real-time under 1 min; tests will use fake timers to guarantee determinism.

Ready for implementation once stakeholders approve the above plan.
