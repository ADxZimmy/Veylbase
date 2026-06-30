# Plan

## Outcome

Veylbase is live on a public Sepolia URL, every confidential flow is proven on-chain end-to-end, the demo video is recorded, and the submission is filed with the Zama Developer Program before the deadline.

## Scope

Included: Vercel deployment; the funded-wallet UAT run (user-executed, the ship gate); the real-voice demo recording; the bounty submission (public repo, LICENSE, live URL, video, portal filing, optional X post). Excluded: new features — any UAT defect is a scoped follow-up (small fixes inline; larger ones reopen Phase 005).

## Dated critical path & freeze (B3)

Single-owner, serialized. Dates assume "today + N" against the 2026-07-07 23:59 AOE deadline; compress if starting later.

- **Day 1-2:** Phase 005 MUST + deploy (steps A) AND portal registration (step D0) IN PARALLEL.
- **Day 3:** Phase 005 SHOULD (SDK bump → resume-unshield, auto-rehide, error-UX).
- **Day 4:** full funded-wallet UAT (step B).
- **Day 5:** defect fixes + re-UAT. **FREEZE: no new code after Day 5 EOD; remaining UAT FAILs become documented known limitations.**
- **Day 6:** record + caption the demo; finalize repo/README; **submit by Day 6 EOD (≥24h pre-deadline).**
- **Day 7:** buffer only.

**Cut order if behind:** drop NICE (CSP, decimals assertion) → SHOULD #11 retry button → SHOULD #9 resume-unshield (downgrade to a documented known limitation). **NEVER cut:** the decimals UAT gate, LICENSE, the live URL, or the demo video.

## Steps

### D0. Portal registration — Day 1, BLOCKING (B2)
1. Register on the Developer Hub (`zama.org/developer-hub`) / Guild (`guild.xyz/zama/developer-program`) on Day 1 — needs no wallet, deploy, or demo. Surface the submission form (some seasons email a form link of unknown lead time). Capture the EXACT form fields verbatim into UAT.md so nothing is discovered late. **Hard checkpoint:** if the form is not in hand by 2026-07-04, escalate to `developer@zama.org` / `@zama_fhe`. File by 2026-07-06 23:59.

### A. Deploy (no funded wallet needed)
2. Confirm Phase 005 shipped: `engines.node = 24.x`, `.env.example` + RPC decision, `next.config.ts` security headers (no COOP/COEP), `maxDuration` guards, `LICENSE`, SDK 3.2.x (or deliberate 3.1.0), green gate.
3. Provision the dedicated Sepolia RPC chosen in Phase 005. Set Vercel env `NEXT_PUBLIC_SEPOLIA_RPC_URL` (Production + Preview); it is build-time inlined → redeploy to change. (If strict CSP shipped, its `connect-src` must list THIS RPC host + the relayer host confirmed in step 6 — M2.)
4. Import the repo on Vercel. Framework preset = Next.js; defaults (Build `next build`, no `--turbopack` flag, no `webpack` config key, not a static export, root = repo root). Region: leave default `iad1` for a US RPC; match the region if the dedicated RPC is EU/Asia-hosted (N13).
5. Deploy. Record the URL.
6. **Named post-deploy smoke — run BEFORE the funded UAT (M6/M7, discharges the host/CSP triangle):**
   a. `/app` loads (force-dynamic SSR + live registry read works from the serverless function).
   b. Connect wallet → MetaMask popup opens and returns an account.
   c. Network tab → document response has NO `Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy`.
   d. The re-derived `cdn.zama.org/relayer-sdk-js/<version>/relayer-sdk-js.umd.cjs` returns **200**.
   e. **Reveal once on the DEPLOYED origin** (needs the wallet but minimal funds) and confirm the encrypted path completes. Record the ACTUAL RPC host and relayer host from the Network tab. If Reveal fails, triage in order: (a) CDN 200, (b) the actual relayer host responds 200 — **if it is `…zama.cloud` and dead, that is a real blocker, not display-only drift**, (c) only then investigate COOP/COEP/threaded-mode (do NOT add `require-corp`). Feed the observed relayer host into the README §11 value, the `chains.ts` annotation, and any CSP `connect-src`.
7. Pre-warm `/app` once so the SDK caches keys to IndexedDB ahead of the demo.

### B. Funded-wallet UAT — Day 4 (user-executed, the gate)
8. Complete UAT.md §1 preconditions (Sepolia wallet, ~0.1 Sepolia ETH, dedicated RPC, DevTools open, USDC + WETH pairs; if WETH is Restricted, pre-acquire public WETH).
9. Run UAT.md §2 (USDC T01–T08), §3 (WETH decimals gate W01–W05), §4 (errors E01–E06). Record every tx hash, revealed values, the actual relayer host, and screenshots. **During this run also capture the connected-state README assets (M3):** `reveal-shown` (USDC + WETH cards), faucet/shield/unshield activity rows, and the hero `demo.gif` (`****** → value` flip) — this is the only funded-wallet pass that can produce them.
10. Apply UAT.md §5 PASS/FAIL. Any power-of-ten amount error or unrecoverable funds → FAIL → fix (reopen Phase 005) → re-UAT. Reconcile the `chains.ts` relayer/gateway drift from the observed host.

### C. Demo + submit — Day 6
11. Pre-fund/pre-mint the demo wallet. Record the ≤3:00 demo (`docs/DEMO.md`) in your OWN real voice (AI voice/video disqualifies); add burned-in or `.vtt` subtitles; host on YouTube/Loom unlisted (confirm the portal's accepted host at registration); verify the link is publicly playable (N5).
12. Finalize the repo: public, complete, `LICENSE` present, README "Live demo" + screenshots (from step 9) updated with the real URL.
13. Submit via the D0 form: repo + live URL + video + writeup. Optionally post an X thread tagging `@zama_fhe` `#ZamaDeveloperProgram` and link it from the README.
14. Update ROADMAP/STATE to Complete; record outcomes in VERIFICATION.md and UAT.md.

## Verification

- Check: Post-deploy smoke (step 6 a–e) all pass on the DEPLOYED origin before any funded UAT.
  Expected: SSR renders; wallet connects; no COOP/COEP; CDN 200; Reveal completes; both hosts recorded.
- Check: UAT.md §5 gate.
  Expected: PASS — T01–T08 + W01–W05 succeed on-chain with exact (non-power-of-ten) amounts; E01–E06 behave; every error message human-readable; no permanent "Working..." hang.
- Check: Submission artifacts filed.
  Expected: public repo URL, live URL, demo video link, LICENSE, README live-demo section — all in the portal before 2026-07-07 23:59 AOE.

## Rollback

Deployment is non-destructive (delete/redeploy freely; promote a previous Vercel deployment to roll back). No on-chain state is owned by the app. **The live URL is a non-negotiable Builder-Track deliverable (M7): the fallback for a late failure is to FIX the deploy or redeploy the identical build to an alternate host — NOT localhost** (a reviewer cannot open localhost). If a UAT case other than the decimals gate fails and can't be fixed before freeze, ship with that defect recorded as a README known limitation (and the demo avoids that path) rather than a broken URL or a hidden gap.
