# Veylbase Phase 005/006 Research Brief

Consolidated from six parallel research agents (sdk-deploy-constraints, vercel-next16-deploy, bounty-submission, code-residual-audit, docs-demo-design, uat-runbook). Scope: author the GSD plan for **Phase 005** (docs, demo script, env/RPC, auto-rehide, error-UX polish) and **Phase 006** (deploy + funded-wallet UAT + bounty submission). Deadline **2026-07-07 23:59 AOE** (today 2026-06-30, ~7 days). Deploy target: **Vercel**.

Where two agents disagreed, the contradiction is flagged inline. Where a fact could not be confirmed from authoritative sources, it is marked **UNVERIFIED**.

---

## TL;DR — biggest risks & decisions

- **COOP/COEP is NOT required and would actively break the app — do NOT add it.** The repo calls `web()` with no `threads` option (`confidential-actions.ts:115`), so the SDK runs **single-threaded** and needs no `SharedArrayBuffer` / cross-origin isolation. Per the SDK's own JSDoc, COOP/COEP is required *only* when you pass `web({ threads: N })`. Worse, enabling `COEP: require-corp` would block the cross-origin `cdn.zama.org` WASM/key fetch (Zama's CDN sends no CORP header you control), and `COOP: same-origin` can sever the `window.opener` relationship MetaMask popups rely on. **Decision: ship without COOP/COEP; keep `web()` argument-less.** (Both deploy agents independently agree on this; it is the single highest-leverage decision.)
- **The real must-haves are a reliable RPC + an un-blocked CDN/relayer path, not headers.** Set `NEXT_PUBLIC_SEPOLIA_RPC_URL` to a dedicated endpoint (Alchemy/Infura/dRPC) before UAT; the default `ethereum-sepolia-rpc.publicnode.com` is shared/rate-limited and is the most likely cause of a confusing "looks like an SDK bug" UAT failure (it backs both the SSR `/app` registry read and every client write/reveal).
- **Five live-flow code paths have never run against a funded wallet + live relayer** (faucet, shield, unshield, reveal, plus the SDK worker/IndexedDB init). Correctness is the heaviest judging criterion — the funded-wallet UAT (§8) is mandatory before submission, and the WETH 18→6-decimal case is the specific gate the decimals fix exists for.
- **The highest-value residual code fix is resume-interrupted-unshield (effort M).** The SDK auto-persists the unwrap and exposes `wrapper.resumeUnshield()` + `loadPendingUnshield()`, but the app never surfaces it. If a tab closes/reloads between unwrap and finalize, public tokens are stranded with no UI path back. This is the resilience fix most likely to matter in a live demo.
- **Bump `@zama-fhe/sdk` + `@zama-fhe/react-sdk` from `^3.1.0` to the latest published `3.2.0`** before submission so judges see the current SDK, then re-run the green quality gate and the live UAT (3.1→3.2 is a minor — check changelog). *(SDK-version currency is a bounty-fit item, not a deploy blocker.)*
- **Bounty deliverables are well-corroborated: public GitHub repo + Sepolia-deployed live URL + clear docs + a ~3-min demo video in your OWN REAL VOICE (AI voice/video disqualifies), subtitles encouraged.** Add a `LICENSE` file (MIT or BSD-3-Clause). Submit via the Developer Hub / Guild portal before the deadline (target 24h early). Judged on six dimensions: coverage, correctness, extensibility, UX, code quality, production-readiness.
- **Config drift to reconcile:** `src/lib/chains.ts` lists `relayerUrl: relayer.testnet.zama.cloud` and `gatewayChainId: 55815`, but the SDK preset uses `relayer.testnet.zama.org/v2` and `gatewayChainId: 10901` — and the repo's values are never passed to `createSdk` (the SDK preset wins). It works today only by accident; correct or annotate the stale fields. **Contradiction flagged: agents disagree on the live relayer host — see §3.**
- **Pin Node 24 in `package.json` `engines`.** Next 16's floor is Node 20.9; Vercel default is already 24.x, but pinning makes the runtime deterministic and matches the `@types/node@24` dev environment.

---

## SDK + deployment constraints (COOP/COEP, relayer/CDN, env, wasm)

### How the SDK actually loads its crypto (the load-bearing mechanism)
Decompiled from the installed dist, the browser `web()` relayer does this on first encrypt/decrypt:
1. `createWorker()` (`dist/esm/web/index.js`) tries a bundler worker runtime; under Next/Turbopack that helper is absent, so it falls back to `URL.createObjectURL(new Blob([workerCode], {type:"application/javascript"}))` — a **blob: Web Worker**.
2. Inside the worker (`dist/esm/relayer-sdk.worker.js`) it runs `importScripts(validatedUrl)` where `validatedUrl = https://cdn.zama.org/relayer-sdk-js/0.4.4/relayer-sdk-js.umd.cjs`, then a **SHA-384 subresource-integrity check** against a pinned digest (`CDN_INTEGRITY = "a50426aae8440e802102c8674dd8451f34fe79…"`). Integrity defaults **on** (`RelayerWebSecurityConfig.integrityCheck` default `true`).
3. The UMD bundle runs `initSDK()` + `createInstance()`, pulling TFHE/KMS WASM (`tfhe_bg.wasm`, `kms_lib_bg.wasm`) + the FHE public key/CRS, caching the multi-MB artifacts in **IndexedDB** (repo passes `storage: indexedDBStorage`).

**Consequence:** in production the dApp does NOT self-host WASM — it fetches the relayer SDK bundle + keys from Zama's CDN/relayer at runtime. That single fact drives the entire header/CSP story and means **no `asyncWebAssembly` / `outputFileTracingIncludes` is needed** in `next.config.ts` (the bundler never touches the WASM). The known "Turbopack can't find `*.wasm`" issue is a *server-side* `createRequire().resolve()` problem and does **not** apply here — Veylbase's FHE WASM is client-side only.

### Runtime endpoints that must be reachable (and CORS-allowed)
| Purpose | Host | Notes |
|---|---|---|
| Relayer SDK UMD bundle + WASM | `https://cdn.zama.org/relayer-sdk-js/0.4.4/relayer-sdk-js.umd.cjs` (+ sibling `*.wasm`) | `importScripts` in a blob worker; SHA-384 integrity-pinned to v0.4.4. Single point of failure (see risks). |
| Relayer (encrypt proof, user-decrypt, public params) | **CONTRADICTION — see below** | SDK Sepolia preset host. |
| Sepolia JSON-RPC | `https://ethereum-sepolia-rpc.publicnode.com` (or `NEXT_PUBLIC_SEPOLIA_RPC_URL`) | viem publicClient AND injected as the FheChain `network`. |
| Gateway chain | `gatewayChainId` — reached via the relayer, no direct browser fetch | Repo `chains.ts:` says `55815`; SDK preset says `10901`. Repo value is display-only/unused by the SDK. |

`cdn.zama.org` and the relayer already serve permissive CORS for browser dApps. Your only job is not to block them (CSP) and not to impose COEP.

> **CONTRADICTION — live relayer host.** The *sdk-deploy-constraints* agent (which decompiled the installed dist) reports the SDK Sepolia preset resolves to **`https://relayer.testnet.zama.org/v2`**, and that the repo's `chains.ts` value `relayer.testnet.zama.cloud` is never passed to `createSdk` so it is dead config. The *vercel-next16-deploy*, *code-residual-audit*, and *docs-demo-design* agents all repeat **`https://relayer.testnet.zama.cloud`** (the repo constant). **Resolution for the plan:** the authoritative runtime host is whatever the installed `@zama-fhe/sdk` preset emits (the decompile says `…zama.org/v2`); the `…zama.cloud` string in `chains.ts` is unused. **The human must confirm at UAT** by watching the Network tab for the actual relayer host the deployed app calls, then correct `chains.ts` to match (or annotate it as display-only). Do not "wire up" the `…zama.cloud` constant — that risks pointing at a dead host.

### Required production env / config
- **`NEXT_PUBLIC_SEPOLIA_RPC_URL`** — the ONLY required env var (`chains.ts` → `resolveSepoliaRpcUrl()`, fallback `ethereum-sepolia-rpc.publicnode.com`). It is `NEXT_PUBLIC_`, so it is **inlined at build time and shipped to the browser** — use a key safe to expose (domain/referrer-restricted) or a same-origin proxy route. **Changing it requires a redeploy, not just a settings save.**
- **No relayer API key needed for testnet** (the testnet relayer is open). The README "proxy the relayer to hide the key" guidance applies to keyed/mainnet relayers only — optional for this bounty.
- Chain ids / contract addresses (acl `0xf0Ffdc93…`, kms `0xbE0E3839…`, registry `0x2f0750Bb…128e`) are baked into the SDK `sepolia` preset — no env needed.

### Header snippet A — `next.config.ts` (RECOMMENDED for the submission; security headers only, NO COOP/COEP)
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  async headers() {
    return [
      {
        source: "/:path*", // every route; matched before the filesystem
        headers: [
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Do NOT add COOP/COEP here — it breaks the cdn.zama.org fetch + MetaMask popups.
        ],
      },
    ];
  },
};

export default nextConfig;
```

### Header snippet B — optional strict CSP (polished submission; must allow blob worker + CDN + relayer + RPC)
A naive CSP white-screens the app. The SDK needs exactly these directives:
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'wasm-unsafe-eval';
  worker-src 'self' blob:;
  connect-src 'self' https://cdn.zama.org https://relayer.testnet.zama.org https://ethereum-sepolia-rpc.publicnode.com;
  img-src 'self' data:;
  style-src 'self' 'unsafe-inline';
```
`worker-src blob:` is mandatory (blob worker); `'wasm-unsafe-eval'` is mandatory (WASM compile); `connect-src` must include `cdn.zama.org` (bundle+keys), the relayer host, and your RPC host. If you front the RPC with a same-origin proxy you can drop the publicnode entry. **Verify each flow in the deployed console for `worker-src`/`connect-src` violations.** *(Caveat: if the live relayer host is actually `…zama.cloud`, add it to `connect-src` — confirm at UAT per the contradiction above.)*

### Header snippet C — `vercel.json` equivalent (only if you prefer platform-level headers)
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ]
}
```
**Prefer snippet A** for a Next app on Vercel (`headers()` is owned by Next, travels with the app, works on `next start` locally too). **No `vercel.json` is required for this app.** Reserve it for things Next can't express.

### Header snippet D — ONLY if you ever enable threads (`web({ threads: 4 })`) — and the cost
```ts
// next.config.ts headers() entry
{ key: "Cross-Origin-Opener-Policy", value: "same-origin" },
{ key: "Cross-Origin-Embedder-Policy", value: "credentialless" }, // NOT require-corp
```
Use `credentialless` (Chrome 96+/FF 119+/Safari 17.4+), **never `require-corp`**: under `require-corp` the cross-origin `cdn.zama.org` assets are blocked unless Zama sends `Cross-Origin-Resource-Policy: cross-origin` (you can't control that); `credentialless` fetches them without credentials so no CORP is needed. **Recommendation: do NOT enable threads for the bounty** — single-thread is simpler, isolation-free, and avoids the COEP blast radius.

### Risk list (SDK/deploy)
1. **(HIGH) Adding COOP/COEP breaks the app.** Mitigation: ship without it (default single-thread).
2. **(HIGH) Version-pinned CDN single point of failure.** `cdn.zama.org/.../0.4.4/...` is integrity-pinned; if it's down/moved, every confidential op fails with an opaque worker error. Mitigation: pre-warm `/app` once (caches keys to IndexedDB), add explicit "relayer/CDN unreachable" error UX, document the dependency in README, confirm the URL returns 200 before the demo.
3. **(HIGH) RPC reliability.** Mitigation: dedicated `NEXT_PUBLIC_SEPOLIA_RPC_URL` before UAT; `.env.example`.
4. **(MEDIUM) Config drift** (`chains.ts` relayer/gateway vs SDK preset). Mitigation: correct or annotate; comment that the SDK preset is authoritative.
5. **(MEDIUM) CSP omission vs over-strictness.** Mitigation: ship the minimal CSP above and verify each flow in the deployed console.
6. **(LOW) First-op cold-cache latency** (multi-MB keys). Mitigation: keep progress callbacks; add a "preparing encryption keys (first run only)" hint.
7. **(LOW) IndexedDB unavailable** (private mode). Mitigation: SDK re-fetches keys — catch and surface, don't treat as fatal.

---

## Vercel + Next 16 deploy checklist

Veylbase deploys with **essentially no custom config**. Current `next.config.ts` (`{ typedRoutes: true }`) is already deploy-ready.

1. **Pin Node 24 in `package.json` (in-repo, not just dashboard):**
   ```jsonc
   "engines": { "node": "24.x" }
   ```
   Also selectable in Project → Settings → Build and Deployment → Node.js Version. Next 16 floor is Node 20.9; 24.x is correct.
2. **Import the repo on Vercel.** Framework Preset auto-detects **Next.js**. Leave defaults:
   - **Build Command:** `next build` (default; Next 16 runs **Turbopack by default** — do NOT add `--turbopack`, and do NOT add a `webpack` key to the config or the Turbopack build hard-fails).
   - **Install Command:** default (lockfile-aware).
   - **Output Directory:** blank/default — this is NOT a static export (force-dynamic SSR + Node API routes).
   - **Root Directory:** repo root.
3. **Set env vars** (Production + Preview): `NEXT_PUBLIC_SEPOLIA_RPC_URL` = dedicated RPC URL. Only env var the code reads. Inlined at build time → **redeploy** after changing. No server secrets required.
4. **Deploy.** First build runs Turbopack; expect success with current config.
5. **How dynamic SSR + API routes run on Vercel:**
   - `/app/page.tsx` is `force-dynamic` and `await`s `getRegistrySnapshot({ live: true })` (dynamic import of `src/server/registry/onchain.ts` → `WrappersRegistry` + viem `http`). Becomes a **Node serverless function** per request. Must be Node (viem + SDK not Edge-compatible) — keep `runtime = "nodejs"` on all API routes (`/api/registry`, `/registry/validate`, `/faucet`, `/transactions/plan`); do NOT switch to `edge`.
   - **Timeout guard:** the live registry read makes several sequential Sepolia RPC round-trips. Default `maxDuration` is generous (Hobby 300s / Pro 800s), so it won't 504, but a slow public RPC makes `/app` feel slow. Add Route Segment Config `export const maxDuration = 30;` in `src/app/app/page.tsx` and the API route files so a hung RPC fails fast. The service already catches a failed live read and falls back to the static snapshot (`service.ts` try/catch) — keep that.
   - **Region:** pick a single region near the RPC provider's edge (default `iad1` US-East is fine for publicnode / Alchemy / Infura US). Multi-region not needed for a testnet demo.
6. **Heavy SDK already code-split** — `confidential-actions.ts` (client) and `onchain.ts` (server) are dynamically imported off the `/app` initial bundle. Keep that pattern. Vercel handles serverless function packaging (output file tracing) automatically; no `outputFileTracingIncludes` needed.
7. **Post-deploy smoke test (before funded-wallet UAT):**
   - Load `/app` → confirms force-dynamic SSR + live registry read works from the serverless function.
   - DevTools console → click **Connect wallet** → MetaMask popup opens and account returns (this is what COOP/COEP would break).
   - Network tab → confirm **no** `Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy` headers on the document response.

### Files to add for deploy
- `package.json`: `"engines": { "node": "24.x" }`.
- `.env.example` (new): `NEXT_PUBLIC_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY`
- `next.config.ts`: optionally add the security-header `headers()` block (snippet A) **without** COOP/COEP.
- No `vercel.json` required.

---

## Bounty submission requirements & judging

**Program:** Zama Developer Program — **Builder Track** ("build dApp demos / real-world use cases on the Zama Protocol"). The legacy `github.com/zama-ai/bounty-program` repo is superseded. Three tracks exist (Builder / Bounty / Startup); Veylbase fits Builder.

**Deadline (sanity check passes):** A Mainnet Season 3 program page states **Submission Deadline: "July 07, 2026 (23:59 AOE)"** — exactly the project's stated deadline. AOE = UTC-12, so it is effectively **2026-07-08 11:59 UTC**. **Target submission 24h early.**

### Required deliverables (Builder Track) — corroborated across program page, Season posts, and community forum
1. **Public GitHub repository** with full source (smart contract + frontend), linked in the submission. (Veylbase is a frontend over an existing on-chain registry/wrapper contracts — ensure the repo is public and complete.)
2. **Deployed / live application URL** anyone can open (Vercel).
3. **Deployment on Sepolia testnet or Ethereum mainnet.** Sepolia is explicitly acceptable and a first-class `@zama-fhe/sdk/chains` preset — Veylbase's chainId 11155111 setup is compliant.
4. **Clear documentation** explaining the project (README: what/why, architecture, the 4 flows, Sepolia addresses, run + env instructions).
5. **Demo / pitch video** — binding forum guidance from the Zama team:
   - **Real-person pitch only — "AI-generated video or voice will not be considered."** Use your **own real voice**.
   - "It doesn't need to be perfect English at all" — non-native English is fine.
   - **Subtitles strongly encouraged.**
   - Length: a Mainnet Season page specifies a **~3-minute video pitch**. Aim ≤3 min, showing setup, the key flows, and a live execution.
6. **Submit via the official portal** — **Developer Hub** (`zama.org/developer-hub#developer-program`) / **Guild** (`guild.xyz/zama/developer-program`). Some seasons route the final upload through a form whose link arrives by confirmation email after you register on Guild. Contact: `developer@zama.org` or `@zama_fhe` on X.

### Judging — six dimensions (most explicit official rubric)
- **Coverage** — breadth/completeness of the use case.
- **Correctness** — works on-chain end to end (why the live UAT matters: faucet → shield → reveal → unshield must demonstrably succeed). **Heaviest criterion.**
- **Extensibility** — clean, composable design. (Season 3 theme: "composable privacy is the key" — a *registry* of wrapper pairs aligns very well.)
- **UX** — usability/polish (auto-rehide, relayer/decrypt error UX, mobile).
- **Code quality** — clean, typed, tested (green typecheck/lint/test/build supports this).
- **Production-readiness** — env config, RPC, error handling, deploy hygiene.

### Specific rules to comply with
- **SDK:** use the current default `@zama-fhe/sdk` (Veylbase does; legacy `@zama-fhe/relayer-sdk` is deprecated). **Latest published is 3.2.0; repo pins `^3.1.0`.** Action: bump both `@zama-fhe/sdk` and `@zama-fhe/react-sdk` to `^3.2.0`, re-run the quality gate + a live UAT (minor bump — check changelog).
- **Network:** Sepolia is fine (no mainnet requirement for Builder Track).
- **License:** public repo required; OSI license expected. **No single mandated license string found** — add an explicit `LICENSE` (MIT or BSD-3-Clause; Zama's own libs use BSD-3-Clause-Clear, so either is judge-friendly). Do not ship without a LICENSE.
- **Social/tagging (soft):** not a hard code-judging gate, but encouraged — post an X thread/short article tagging **@zama_fhe** with **#ZamaDeveloperProgram**, linked from the README.
- **Originality/fit:** emphasize the confidential angle (ERC-7984 wrappers, real encrypted balances, user-decryption reveal) and composable privacy.

### Caveats on certainty
Exact current-month deliverable list and **reward split vary by season** and are gated behind the authenticated Developer Hub / Guild flow + a confirmation-email form (several public pages returned 404/403). Reward figures seen across seasons (treat as **UNVERIFIED / season-dependent**, confirm on the live Hub when you register): "$2,000 × top 5", "$5,000/season", "$7,000/month", and a Season-3 7,000-cUSDT pool split 2,500 / 1,750 / 1,250 / 1,000 / 500. **Well-corroborated and safe to plan against:** the deliverables list, the real-voice video rule, Sepolia eligibility, the six judging dimensions, the SDK requirement, and the 2026-07-07 23:59 AOE deadline.

---

## Code residual-risk & should-do fixes (with file:line + effort)

All execution lives in `src/app/confidential-actions.ts`, driven by `runAction` in `veylbase-app-shell.tsx:488-630`. **No execution path has run against a funded wallet + live relayer.** No `TODO/FIXME/XXX/HACK` and no `console.*` anywhere in `src/` (grep clean).

### Unverified live code paths (ranked by surprise risk)
| Path | Code | Where surprises are likely |
|---|---|---|
| **Faucet mint** | `executeFaucetMint` `confidential-actions.ts:122-171` | Lowest risk — raw `writeContract` of `mint(to,amount)` vs hard-coded `faucetAbi:70-81`. Surprise only if a token's faucet isn't a public `mint(address,uint256)` (signature mismatch → revert). Amount uses `selectedPair.decimals` (`shell:559-567`) — correct (underlying). |
| **Shield (approve+wrap)** | `executeShield` `confidential-actions.ts:173-234` via `wrapper.shield(amount,{approvalStrategy:"exact",to,...})` | Two wallet prompts (approve then shield) the user may not expect; `onApprovalSubmitted`/`onShieldSubmitted` (`:190-203`) untested vs real SDK event timing. Amount underlying-decimals (`shell:562`). FHE keypair/relayer init happens here on first `createSdk`. |
| **Unshield (request+finalize)** | `executeUnshield` `confidential-actions.ts:236-303` via `wrapper.unshield(amount,...)` | **Highest risk.** One call spans encrypt → unwrap tx → wait for public decryption → finalize tx. Comment `:281-282` asserts the SDK pre-validates confidential balance via permit (unverified). Amount uses `confidentialDecimals` (`shell:560-561`) — different from shield. If the tab closes/errors between unwrap and finalize, funds are stranded (see resume fix). |
| **Reveal (decrypt permit)** | `revealConfidentialBalance` `confidential-actions.ts:305-341` via `token.balanceOf(account)` | EIP-712 permit signature + transport keypair + relayer user-decryption round-trip, all untested live. Revealed value formatted with `confidentialDecimals ?? 6` (`shell:536-538`); if a pair's confidential decimals ≠ 6 and the snapshot omits them, the fallback mis-formats. |

Cross-cutting: `createSdk` (`:101-120`) overrides `fheSepolia.network` with the RPC URL and wires `relayers:{[chain.id]:web()}` + `storage:indexedDBStorage`; the relayer worker + IndexedDB path has never run in a real browser session here. Every flow calls `sdk.terminate()` in `finally` (`:232, :301, :339`) → a fresh SDK + fresh keypair/permit per action, **no permit caching** → expect a wallet signature on **every** reveal and **every** unshield during UAT (note this in the runbook so it doesn't look broken).

### Should-do fixes (effort tagged)
1. **Auto-rehide revealed balance after ~8s (S).** Design re-hides; not wired. State `privateBalances` declared `shell:167`, written only in reveal success `shell:539-542`; already cleared on disconnect `:231`, `accountsChanged` `:262`, `chainChanged` `:272`; render gate `is-revealed` at `shell:751, :1000-1002` (CSS `globals.css:706-712`). Add an effect near the balance-refresh effect (after `shell:305`), keyed on the revealed entry + account + chain:
   ```ts
   useEffect(() => {
     if (!privateBalance) return;
     const id = selectedPair.id;
     const timer = setTimeout(() => {
       setPrivateBalances((current) => {
         const next = { ...current };
         delete next[id];
         return next;
       });
     }, 8000);
     return () => clearTimeout(timer);
   }, [privateBalance, selectedPair.id, account, chainId]);
   ```
   `privateBalance` is already derived at `shell:178`. Cleanup clears the timer on unmount / pair switch / account-network change. Re-revealing restarts the 8s window (new object reference) — desired. No new state.
2. **`.env.example` + dedicated RPC (S).** Confirmed: no `.env*` anywhere; only env-driven value is the Sepolia RPC. `chains.ts:20` `rpcEnvKey: "NEXT_PUBLIC_SEPOLIA_RPC_URL"`, `resolveSepoliaRpcUrl()` `:25-27`, fallback `:19`. Used by `confidential-actions.ts:88,102` + `chain-reads.ts`. The relayer URL (`chains.ts:21`) is NOT env-readable and the SDK uses `web()` not that constant (can't be overridden — note it). `.env.example`:
   ```
   # Optional: dedicated Sepolia RPC (Alchemy/Infura/etc). Falls back to a public node.
   NEXT_PUBLIC_SEPOLIA_RPC_URL=
   ```
   Strongly provide a real dedicated RPC for UAT — the public node will likely rate-limit the burst of balance reads + SDK public-client reads.
3. **Typed error mapping + better relayer/decrypt copy (S–M).** `execution-errors.ts:6-33` is **string-matching only** (`"user rejected"`, `"insufficient"`, `"relayer"`, `"decrypt"`, `"chain mismatch"`) and passes raw messages through. The SDK ships typed errors never used: `RelayerRequestFailedError`, `DecryptionFailedError`, `InsufficientConfidentialBalanceError`, `ChainMismatchError`, `SigningRejectedError`, `NoCiphertextError`, `BalanceCheckUnavailableError`. `instanceof`/code matching is far more robust — but `execution-errors.ts` is deliberately SDK-import-free for bundling (`:1-5`), so typed handling must live in the dynamically-imported `confidential-actions.ts`, mapping known errors to stable codes before they reach the string matcher. Add "the Zama relayer may be temporarily unavailable, try again" copy (S) and a retry button (M).
4. **Resume interrupted unshield — the real hole (M, HIGHEST VALUE).** The SDK auto-persists the unwrap to `indexedDBStorage` (already wired in `createConfig`, `confidential-actions.ts:116`) and exposes `wrapper.resumeUnshield(unwrapTxHash, callbacks?)` plus `loadPendingUnshield(storage, wrapperAddress)` / `loadPendingUnshieldRequest` / `clearPendingUnshield` (SDK type defs `index-DMv-qtTr.d.ts:19880-19895, 20290-20340`; doc: "resume an interrupted unshield after page reload"). Today `executeUnshield` runs unwrap+finalize in one call and `terminate()`s in `finally` (`:300-302`) — so if finalize is interrupted (reload, network blip, closed tab), the unwrap is on-chain, public tokens are NOT released, and **nothing in the UI offers a way back**. Plan: on connect / pair-select call `loadPendingUnshield(storage, wrapper)`; if a pending hash exists, render a "Resume pending unshield" banner that calls a new `resumeUnshield` wrapper around `wrapper.resumeUnshield(hash)`. Single most important resilience fix for a live demo.
5. **Running-state soft timeout (M).** `execution.status === "running"` (`shell:179`) has no max duration. If the relayer hangs during reveal or the unshield finalize wait, the primary button stays `"Working..."` (`:646-648`) indefinitely with no escape. Add a soft timeout that flips to an actionable error.
6. **Minor / document-only:** silent catch swallows balance read errors (`shell:298-300`) → a dead RPC shows `"..."` forever (intentional "honest placeholder"; worth a one-line UAT-debug note). `confidentialDecimals ?? 6` (`shell:537` + the `?? 6` unshield path) is the only magic-number assumption — fine for the known WETH 18/6 split, but a registry pair with non-6 confidential decimals + a null snapshot would mis-format (S to assert/derive instead of default). Wrong-network mid-flow: pre-flight guard exists (`runAction:493-496` → `switchToSepolia`) but a chain switch *during* a long unshield isn't guarded; `chainChanged` (`:268-275`) clears execution state and could orphan an in-flight tx — document as a known limitation.

**Effort summary:** auto-rehide **S** · `.env.example`+RPC **S** · typed error copy **S–M** · resume-unshield **M (highest value)** · running-state timeout **M**.

---

## Docs plan + 3-minute demo script (timed beats)

### Full-dApp README outline
Current `README.md` is backend-foundation-focused (Backend Architecture, API, Local Config, Scripts, Sources). Restructure to dApp-first. **KEEP** = verbatim/near · **REPLACE** = rewrite · **ADD** = new.

1. **Title + tagline + badges** *(REPLACE)* — "Veylbase — The confidential wrapper registry for Zama." Badges (Next.js 16, viem, @zama-fhe/sdk 3.x, Sepolia, license). One-paragraph pitch from landing copy.
2. **Live demo** *(ADD)* — deployed URL placeholder (`https://veylbase.vercel.app` TBD) → "Enter dApp" → `/app`; "requires an EVM wallet + Sepolia ETH".
3. **Screenshots / demo GIF** *(ADD)* — hero GIF + 7 stills (image table).
4. **What is Veylbase** *(ADD)* — wallet-first UI over Zama ERC-20↔ERC-7984 wrapper pairs on Sepolia; balances encrypted on-chain by default; reveal is an intentional client-side permit signature.
5. **Features** *(ADD)* — **Browse** (live on-chain registry), **Faucet** (mint mock test tokens, ≤1,000,000/call), **Shield** (wrap public→confidential, exact-approval), **Reveal** (decrypt your own balance via signed permit, no tx), **Unshield** (two-step unwrap→finalize). Note the developer plan drawer (judge-friendly step breakdown).
6. **Architecture** *(REPLACE "Backend Architecture")* — keep file bullets + add front-of-house; label three subsystems: (a) **Registry service** — `src/server/registry/{onchain,service}.ts` + `official-sepolia.ts`, merged snapshot, `/app` force-dynamic live read; (b) **Planner** — `src/server/transactions/planner.ts`, intents `claimFaucet|wrap|unwrap|finalizeUnwrap|decryptBalance`, via `POST /api/transactions/plan` + plan drawer; (c) **confidential-actions bridge** — `src/app/confidential-actions.ts`, browser-only, lazy-loaded, wraps `@zama-fhe/sdk`. Small diagram: wallet → planner (server) → bridge (browser) → Zama relayer/registry.
7. **API** *(KEEP)* — `/api/registry`, `/api/registry/validate`, `/api/faucet`, `/api/transactions/plan` (5 intents). Keep base-unit-string note.
8. **Run locally** *(ADD)* — prereqs (Node 24, npm, EVM wallet, Sepolia ETH), `npm install`, `npm run dev` → `http://localhost:3000`, then `typecheck/lint/test/build` *(KEEP script block)*.
9. **Environment variables** *(ADD)* — table: `NEXT_PUBLIC_SEPOLIA_RPC_URL` (optional; default publicnode; recommend dedicated key). Relayer URL + registry address are constants in `src/lib/chains.ts`, not env. Ship `.env.example`.
10. **Add a pair (local dev)** *(REPLACE/expand "Local Config")* — short pointer to the full guide, keep the copy-to-`registry.local.json` instruction.
11. **Sepolia & Zama notes** *(ADD)* — chainId 11155111, gatewayChainId 55815 *(or 10901 per SDK — see §3 contradiction)*, relayer URL, registry `0x2f0750…128e`, explorer `https://sepolia.etherscan.io`; ERC-7984 confidential-decimals caveat (WETH 18→6, refund of remainder).
12. **Security model** *(ADD)* — non-custodial: all writes/decryption in the user's wallet/browser; Veylbase never holds keys or funds; reveal is a local permit (no broadcast, no on-chain trace); server only reads public registry data + builds plans. Testnet-only mock faucet.
13. **License** *(ADD)* — currently none; add MIT or BSD-3-Clause + LICENSE file.
14. **Sources** *(KEEP)* — the three Zama doc URLs.

### 3-minute demo script (~175s; privacy story is the spine — `******` by default, reveal is deliberate)
Labels are exact strings from `veylbase-app-shell.tsx`; bridge phases from `confidential-actions.ts`.

| # | ~sec | On-screen action | Narration beat |
|---|------|------------------|----------------|
| 1 | 0–12 | Landing `/`. Hover hero: USDC "Visible" → cUSDC "••••••". | "Veylbase — the confidential wrapper registry for Zama. Public in, private out. Reveal only when you decide." |
| 2 | 12–22 | "Enter dApp" → `/app`. USDC selected, Shield tab active. | "Reads Zama's live on-chain wrapper registry — each asset is a public ERC-20 paired with a confidential ERC-7984." |
| 3 | 22–34 | "Connect wallet" → MetaMask approve. Topbar shows short address + green Sepolia dot. | "Non-custodial — never holds your keys or funds; everything is signed in your wallet." |
| 4 | 34–44 *(conditional)* | If wrong network: red banner "Veylbase runs on Sepolia" → "Switch to Sepolia". | "We're on Sepolia testnet — chain 11155111. One click switches networks." |
| 5 | 44–60 | "Test tokens" tab → amount → "Get test tokens" → confirm mint → activity row "Test tokens received" + explorer link. | "First I mint mock test tokens from the faucet — up to a million per call, Sepolia only." |
| 6 | 60–84 | "Shield" tab. Amount → preview "You shield … / You receive c…". "Shield balance". Wallet: approval then shield. Status: "Approval submitted" → "Shield submitted" → "Balance shielded". | "The privacy step. Shielding wraps the public balance 1:1 into a confidential token. Note the exact-approval. After confirmation the amount and balance are encrypted on-chain." |
| 7 | 84–96 | Asset row still shows Private `******`. Point at it. | "My confidential balance is hidden by default — even from a block explorer. On-chain it's ciphertext." |
| 8 | 96–120 | "Reveal" tab → `******`, "Hidden by default — encrypted on-chain". "Sign & reveal" → permit signature popup → value appears, hint "Revealed in this session". | "Reveal is intentional. I sign a permit — not a transaction. Nothing broadcast, no on-chain trace. Decrypted to my wallet only, this session." |
| 9 | 120–150 | "Unshield" tab → amount → "Unshield balance". Status: "Unshield request submitted" → "Finalizing unshield" → "Finalize submitted" → "Balance unshielded". Activity rows + explorer links. | "To go public I unshield — two steps: the SDK submits the encrypted unwrap, then finalizes to release the public tokens." |
| 10 | 150–165 | Topbar "Developer plan" drawer → scroll numbered steps with contract signatures + targets. | "For judges: every action has a transparent plan — ordered steps, contract calls, the registry address — built by the Veylbase planner from Zama's wrapper docs." |
| 11 | 165–175 | Back to landing / repo + live URL card. | "Public tokens, private balances, reveal on your terms. Links to the live dApp and source below." |

**Recorder notes:** beat 4 is conditional (skip if already on Sepolia; redistribute ~10s to beats 6/9, the slowest on a live relayer). Beats 6 and 9 are highest-risk for live timing — **pre-fund the wallet and pre-mint before recording** so beat 5 is a quick re-mint. **Use your own real voice + subtitles** (AI voice disqualifies — see §5).

### "Add a pair (local dev)" guide outline (grounded in `config/registry.local.example.json`)
Example file: one `pairs[]` entry with `id`, `assetKey`, `mock`, `valid`, an `underlying` block (`address/name/symbol/decimals` + `mint:{mode:"public",perCallLimitTokens,note}`), a `confidential` block (`address/name/symbol/decimals`), and `notes[]`. Local pairs merge **after** the official snapshot and are **dropped if they duplicate an official underlying address**.
1. **When to use** — add a dev-only pair without touching `official-sepolia.ts`.
2. **Copy the example** — `cp config/registry.local.example.json config/registry.local.json` (gitignore it; don't commit real addresses).
3. **Fill `underlying`** — real deployed Sepolia ERC-20 (`address/name/symbol/decimals`); `mint.mode:"public"` makes it appear under the Test tokens filter; `perCallLimitTokens` (UI caps ≤1,000,000 via `FAUCET_PER_CALL_LIMIT`).
4. **Fill `confidential`** — deployed ERC-7984 wrapper (`address/name/symbol/decimals`); decimals caveat: if confidential < underlying, shielding floors to confidential precision and refunds the remainder (UI shows a refund row).
5. **Top-level flags** — unique `id` (e.g. `local-<symbol>-sepolia`), uppercase `assetKey` (grouping/default; `usdc` is default), `mock:true`, `valid:true`, optional `testOnly` for the "Test only" tag.
6. **Verify** — `npm run dev`, `/app` asset sheet shows the pair; `GET /api/registry?live=true` + `GET /api/registry/validate?live=true` confirm merge/validation; generate a plan via the developer drawer.
7. **Gotchas** — addresses must be real & checksummable (`getAddress`); duplicate-underlying pairs are silently skipped; wrong decimals break amount math/refunds; don't commit real addresses into the example file.

### Screenshots / GIFs to capture (desktop ~1440px + mobile ~390px)
1. `landing.png` — `/` hero (USDC → cUSDC "••••••") + "Enter dApp".
2. `app-shield-idle.png` — `/app` Shield tab, USDC selected, connected on Sepolia (green dot + short address).
3. `asset-sheet.png` — "Choose an asset" dialog: search, All/Test tokens/Private filters, pair rows with Test/Restricted/Test-only tags.
4. `reveal-hidden.png` — Reveal tab, `******` + "Hidden by default — encrypted on-chain", "Sign & reveal".
5. `reveal-shown.png` — same card decrypted: plaintext + "Revealed in this session". (4+5 side-by-side tell the privacy story.)
6. `plan-drawer.png` — Developer plan drawer: network/registry meta, numbered steps with signatures + short targets.
7. `mobile.png` — narrow `/app` Shield view (validates the mobile-clipping fix), asset sheet as bottom sheet.
8. `demo.gif` (hero) — 10–15s loop: connect → shield → reveal (the `******` → value flip is the money shot).
Optional: faucet activity row with explorer link, wrong-network banner, unshield two-step status sequence.

---

## Funded-wallet UAT runbook (ordered, with WETH decimals case)

A non-author can follow this top to bottom. UI labels are exact strings from `veylbase-app-shell.tsx`; execution semantics from `confidential-actions.ts`.

### How the UI is wired (read once)
- Four action tabs: **Shield**, **Unshield**, **Reveal**, **Test tokens** (internal keys `wrap`, `unwrap`, `decryptBalance`, `claimFaucet`).
- The big bottom button is the **primary** button and doubles as connect / switch-network: no wallet → "Connect & shield / & mint / & unshield / & reveal" (opens MetaMask connect); connected on wrong network → triggers `wallet_switchEthereumChain` to Sepolia; connected + on Sepolia → runs the action.
- Asset selector (top row `SYMBOL / cSYMBOL`, public·private balances, "Change") opens the "Choose an asset" sheet (search + All/Test tokens/Private filters).
- Balance row: **Public · Private**. Public shows `Connect` / `Wrong network` / `...` / value. Private shows `******` until you Reveal in this session.
- Progress + errors render in **ExecutionStatus** inside the card and as **Activity** rows below; confirmed writes get a "View" link to `explorerUrl/tx/<hash>`.
- **Test tokens** tab is disabled for any pair where `faucet` is false; selecting a non-faucet pair on the faucet tab silently switches to **Shield**.

### 1. Preconditions (complete ALL first)
1.1 **Wallet:** MetaMask / any injected EIP-1193 (`window.ethereum`) in desktop Chromium/Firefox. No WalletConnect.
1.2 **Network:** add/select **Sepolia** (chainId `11155111` / hex `0xaa36a7`; guard compares to `SEPOLIA_HEX_CHAIN_ID`).
1.3 **Sepolia ETH for gas** (~5+ signed txs: faucet mint, shield approval+shield, unshield unwrap+finalize). Fund **~0.1 Sepolia ETH** (Google Cloud Web3 / Alchemy / Infura Sepolia faucet). Confirm in MetaMask first.
1.4 **App URL:** deployed Vercel URL if Phase 006 deploy is done; else `npm run build && npm run start` (NOT `next dev` — test the production bundle) → `http://localhost:3000/app`. Record the URL.
1.5 **RPC insurance:** default `https://ethereum-sepolia-rpc.publicnode.com`. If you see RPC errors / slow balance reads / `waitForTransactionReceipt` stalls, set `NEXT_PUBLIC_SEPOLIA_RPC_URL` (Alchemy/Infura) and rebuild/redeploy. No `.env.example` yet — set in Vercel env vars or `.env.local`. Record whether it was set.
1.6 **SDK / COOP-COEP check:** before the encrypted path, DevTools → Console → confirm **no `SharedArrayBuffer is not defined` / cross-origin-isolation errors** when you click Reveal/Shield. `next.config.ts` is minimal (no COOP/COEP). **Per §3, the default single-thread path should NOT need these headers.** If Reveal/Shield throws a SharedArrayBuffer/threads error, that is a real blocker — but the expected fix per the deploy research is NOT to add `require-corp` (it breaks the CDN fetch); investigate whether the SDK was inadvertently put in threaded mode. Record whether any header change was needed.
1.7 **Pick test pairs** from the live registry (`0x2f0750…128e`): one **6-decimal** faucet pair (**USDC / cUSDC**) and one **non-6 underlying** pair (**WETH = 18 underlying / 6 confidential**) to validate the decimals fix. Substitute closest equivalents if symbols differ; note it.
1.8 **DevTools open** (Console + Network) for the whole run, to capture relayer/decrypt failures, the actual relayer host (resolve the §3 contradiction), and tx hashes.

### 2. Happy path — USDC (6-decimal)
Record every tx hash from Activity "View" links.

- **T01 Connect wallet** — Click **Connect wallet**, approve. Expect: top-right shows `0x1234…abcd` + green dot; Activity "Wallet connected · 0x…"; no error banner.
- **T02 Network = Sepolia** — Ensure MetaMask on Sepolia. If red banner "Your wallet is on the wrong network. Veylbase runs on Sepolia." → "Switch to Sepolia" + approve. Expect: no banner; chain chip shows Sepolia; public balance resolves to a number/`0` (not "Wrong network").
- **T03 Select USDC** — Click asset row → sheet → optional "Test tokens" filter → search `USDC` → select. Expect: header `USDC / cUSDC`; **Test tokens** tab enabled (confirms `faucet=true`).
- **T04 Faucet mint** — "Test tokens" tab → amount `1000` (or **MAX** = `1000000`) → **Get test tokens** → approve mint. Expect: "Confirm mint in wallet" → "Mint submitted" → "Test tokens received"; Activity success row + **View**; public balance increases after refresh. **Record mint tx hash.**
- **T05 Shield (partial)** — "Shield" tab → e.g. `400` (< public balance). Preview "You shield 400 USDC" / "You receive 400 cUSDC" (no refund row for 6-dec USDC). **Shield balance** → approve **two** prompts (exact ERC-20 approval, then shield). Expect: "Confirm shield flow" → "Approval submitted" → "Shield submitted" → "Balance shielded"; public USDC drops 400. **Record approval + shield hashes.**
- **T06 Reveal** — "Reveal" tab → card `******` → **Sign & reveal** → approve **signature** (EIP-712 permit, NO gas, NO tx). Expect: card flips `******` → **`400` cUSDC**; Activity "Private balance revealed · 400 cUSDC". **Record revealed value = shielded amount.**
- **T07 Unshield (partial)** — "Unshield" tab → e.g. `150` (≤ revealed; MAX disabled by design). Preview "You unshield 150 cUSDC" / "You receive 150 USDC" / "Two-step: request then finalize." **Unshield balance** → approve unwrap, then (after `onFinalizing`) finalize. Expect: "Confirm unshield flow" → "Unshield request submitted" → "Finalizing unshield" → "Finalize submitted" → "Balance unshielded"; public USDC +~150. **Record unwrap + finalize hashes.**
- **T08 Reveal again** — "Reveal" → **Sign & reveal** → approve. Expect: **`250` cUSDC** (400 − 150). Confirms decrease == unshielded amount. Closes the loop.

### 3. WETH (18 underlying / 6 confidential) — the decimals-fix gate
Bug class: off-by-`10^(18−6)=10^12`. Code under test: shield parses in **18** (`selectedPair.decimals`), unshield parses in **6** (`confidentialDecimals`), reveal formats in **6** (`confidentialDecimals`).

- **W01 Select WETH + fund** — Asset sheet → WETH / cWETH. If faucet (Test tokens enabled): mint e.g. `2` WETH. If **Restricted** (Test tokens greyed): acquire/wrap public WETH on Sepolia externally. **PASS check:** public balance reads as human units (e.g. `2`), NOT `2,000,000,000,000` or `0.000000000002`.
- **W02 Shield fractional** — "Shield" → `1.5` → preview "You shield 1.5 WETH" / "You receive 1.5 cWETH". Also once enter `1.1234567` to confirm the **refund** row appears ("Refunded — exceeds the wrapper's 6-decimal precision", capped receive `1.123456 cWETH`). Use `1.5` for the gate → approve approval + shield. Expect: public WETH drops by shielded amount; values stay human.
- **W03 Reveal (THE off-by-10^12 check)** — "Reveal" → **Sign & reveal** → approve. **PASS:** **`1.5` cWETH**. **FAIL** if `1500000000000` (×10^12), `1500000` (raw 6-dec unformatted), or `0.0000000000015`.
- **W04 Unshield fractional** — "Unshield" → `0.5` → preview "You unshield 0.5 cWETH" / "You receive 0.5 WETH" → approve unwrap + finalize. **PASS:** public WETH +~`0.5`. **FAIL** if `0.0000000000005` or `500000000000`.
- **W05 Reveal again** — **Sign & reveal** → approve. **PASS:** **`1.0` cWETH** (1.5 − 0.5), exact, no 10^12/10^6 factor.

### 4. Error / edge cases
- **E01 Reject a signature/tx** — Reject in MetaMask on any action. Expect: ExecutionStatus error "Action did not complete" (via `executionErrorMessage`); neutral Activity row; app stays usable; no stuck "Working...".
- **E02 Wrong network → switch** — Switch MetaMask to Mainnet → red banner + public "Wrong network" → "Switch to Sepolia" + approve → banner clears, balances re-resolve (`chainChanged` clears cached balances/plan).
- **E03 Insufficient balance (client guard)** — Shield amount > public balance → inline "Exceeds your public USDC balance." + primary **disabled** (no prompt). Unshield > revealed private → "Exceeds your revealed private cUSDC balance." (guard applies only after reveal; if not revealed, the SDK pre-flight in `unshield` should reject an over-amount — confirm it errors cleanly, not hangs).
- **E04 Faucet over-limit** — Test tokens amount `2000000` → inline "Faucet mints up to 1,000,000 tokens per call." + disabled. MAX fills exactly `1000000` and is accepted.
- **E05 Relayer / decrypt failure** — Force via DevTools Network (throttle/block the relayer host) then Reveal/Shield. Expect: error ExecutionStatus with a readable message (not raw stack), neutral Activity row, button returns from "Working...". **Record the exact message** — if opaque/raw, flag as a Phase 005 error-UX follow-up (does not by itself fail the ship gate if the app recovers).
- **E06 Reload mid-unshield** — Start unshield (T07/W04); after **unwrap submitted** but **before finalize**, reload (F5). After reload: reconnect if needed, re-select pair, re-run the same Unshield. The SDK is designed to find the pending unwrap and finalize it (`onFinalizing`: "found the unwrap request and is preparing the finalize transaction"). Confirm funds release and private balance reflects the unshield **exactly once** (no double-spend). Record pre-reload unwrap + post-reload finalize hashes. **If finalize can't recover, that is a real defect to log** — and it is exactly the gap the resume-unshield fix (§6, fix #4) closes.

### 5. PASS / FAIL gate
**PASS only if ALL hold:**
1. T01–T08 complete with on-chain confirmations; revealed values exact (400 → 400 → unshield 150 → 250).
2. W01–W05 complete and **no value off by 10^12 or 10^6** at any step (shield input, revealed, unshield input, public delta all human units). **Mandatory decimals-fix sign-off.**
3. E01–E04 behave as specified; app never stuck in "Working..."; every error path returns usable.
4. No COOP/COEP/SharedArrayBuffer console error blocked the encrypted path.

**FAIL (do not ship) if any of:** a revealed/transferred amount wrong by any power-of-ten; the encrypted path can't run due to SDK/relayer/COEP errors unfixable in time; the primary button hangs permanently on "Working..." after a failure; or E06 leaves funds unrecoverable.

**Record per case:** PASS/FAIL + timestamp; app URL + test wallet address + whether `NEXT_PUBLIC_SEPOLIA_RPC_URL` was set; every tx hash + Etherscan-Sepolia link (T04 mint; T05 approval+shield; T07 unwrap+finalize; W01 mint/approval; W02 approval+shield; W04 unwrap+finalize; E06 unwrap+post-reload finalize); the revealed plaintext values (USDC T06=400, T08=250; WETH W03=1.5, W05=1.0) as screenshots of the flipped card; screenshots of connected top bar, faucet success, shield two-step, revealed USDC + WETH cards, wrong-network banner, each inline amount error, any error ExecutionStatus; any raw/opaque error message (E05 → Phase 005 follow-up); whether any header change was needed (1.6).

---

## Open questions / unknowns the human must resolve

1. **Live relayer host — `…zama.org/v2` vs `…zama.cloud`** *(CONTRADICTION, §3).* The decompiled SDK preset says `relayer.testnet.zama.org/v2`; `chains.ts` says `relayer.testnet.zama.cloud` (unused). **Confirm at UAT** via the Network tab, then correct/annotate `chains.ts` and the CSP `connect-src`. Do not wire up the `…zama.cloud` constant.
2. **Gateway chainId — `10901` (SDK) vs `55815` (`chains.ts`).** Repo value is display-only/unused. Confirm which to show in the README/UI; treat the SDK preset as authoritative.
3. **Does this SDK version (3.1.x / 3.2.0) ever require cross-origin isolation on the default path?** All evidence says **no** (single-thread, no `SharedArrayBuffer`). **UNVERIFIED until the live UAT** proves Reveal/Shield run on a plain Vercel HTTPS origin with no COOP/COEP. If a SharedArrayBuffer error appears, investigate threaded mode — do NOT reflexively add `require-corp`.
4. **Exact current-month bounty deliverable list + reward split.** Gated behind the authenticated Developer Hub / Guild flow + a confirmation-email form (public pages 404/403). Reward figures vary by season (**UNVERIFIED**). Register on the Hub to confirm the precise list before submitting.
5. **License choice** — MIT vs BSD-3-Clause (no single mandated string found). Pick one and add a `LICENSE` file.
6. **Dedicated RPC provider + key** — which provider (Alchemy/Infura/dRPC), and whether to expose the keyed URL via `NEXT_PUBLIC_` (domain-restricted) or split a private server-only key for `onchain.ts` (small code change). Decide before UAT/deploy.
7. **SDK 3.1 → 3.2 bump** — read the changelog/migration notes; confirm no breaking changes in `shield/unshield/balanceOf` before re-running the gate + UAT.
8. **WETH faucet availability** — is the WETH pair a public-mint faucet in the live registry, or **Restricted** (requiring externally-acquired public WETH for W01)? Confirm at UAT so the tester pre-funds correctly.
9. **Deployed URL / custom domain** — final Vercel URL (and whether a custom domain is wanted) for the README "Live demo" section and the demo video.
10. **Demo video logistics** — recording tool, real-voice narration + subtitles, and pre-funding/pre-minting the wallet so the live-relayer beats (6 and 9) don't stall on camera.
