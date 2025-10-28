# Worboo Relayer & UX Upgrade Plan

Prepared before implementation to keep the TDD cadence intact and document the intended behaviour for Milestones 4–5.

_Status update (2025-10-27): persistence, retry/backoff, and navbar banner are live; telemetry/logging polish remains in Milestone 5._

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

---

## 6. Next Telemetry Increment (Milestone 5 extension)

### Goals
- Expose *relayer heartbeat* and *queue depth* so operators can see liveness without tailing raw logs.
- Provide both a CLI endpoint (`npm run status`) and an HTTP endpoint (`/healthz`) that report `status`, `lastEventAt`, `pendingRewards`, and `processedCacheSize`.
- Emit structured log lines (`relayer.event`, `relayer.health`) to simplify parsing in external log tools.
- Surface queue depth / heartbeat in the React navbar (e.g., "Relayer idle" vs "Relayer processing 2 wins").

_Status update (2025-10-27): `/healthz`, CLI snapshot, structured logs, and navbar integration are live; next focus on external dashboards and long-term metrics retention._

### Testing Strategy
1. `status.test.ts` — unit tests for the `collectHealthSnapshot` helper (existing coverage), plus HTTP server tests that hit `/healthz` and verify payload/headers.
2. `logger.test.ts` — ensure structured logger formats (`JSON.parse(line)`) contain mandatory keys.
3. Extend `handler.test.ts` to assert successful mints update the heartbeat timestamp and queue depth counter used by the new status command.
4. `useRelayerHealth.test.tsx` — React hook test mocking `fetch` to ensure the navbar renders queue depth + last heartbeat.

Implementation sequence follows TDD:
1. Author failing tests for the snapshot helper, HTTP server, and React hook.
2. Implement helpers (`src/health.ts`, `src/logger.ts`), wire into relayer entrypoint, and stand up the HTTP server (configurable port).
3. Add bin script `npm run status` that invokes `collectHealthSnapshot` and prints JSON (done).
4. Build `useRelayerHealth` hook + navbar wiring, satisfy React tests.
5. Update docs with operational instructions (CLI, HTTP, UI indicators).

Open question: persist heartbeat metadata to the cache file or keep in-memory with optional rehydration. Default path will be in-memory; if we need persistence we can append a heartbeat JSONL entry (stretch goal).
