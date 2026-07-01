# UAT — Funded-Wallet Ship Gate

The make-or-break acceptance test. A non-author can follow this top to bottom. UI labels are the exact strings in `veylbase-app-shell.tsx`; execution semantics are from `confidential-actions.ts`. This is the gate: **do not submit until §5 PASSes**, with the WETH decimals case (§3) as a mandatory sign-off.

## Result

In progress. Local gate passed and the public GitHub repo exists. Vercel deploy and funded-wallet UAT are not run yet.

## Submission form fields (capture at Day-1 portal registration — B2)

Fill this in when registering on the Developer Hub / Guild, BEFORE deploy/UAT, so no field is discovered late:

- Public entry point: `https://www.zama.org/developer-hub#developer-program-section`
- Required fields visible on public Developer Hub page: `GITHUB USER`, `Project`, `CODE`, `DESCRIPTION`, `DEMO`.
- Accepted demo-video host(s): not specified publicly; confirm after authenticated registration.
- Repo / license requirements stated: public source is available at `https://github.com/ADxZimmy/Veylbase` (transferred from NnazimuzoO; NnazimuzoO retains write access as a collaborator); MIT `LICENSE` is present.
- Confirmation-email lead time observed: not observed; authenticated registration still required.
- Hard filing checkpoint: by 2026-07-06 23:59 (escalate to developer@zama.org / @zama_fhe if the form is not in hand by 2026-07-04).

## How the UI is wired (read once)

- Four action tabs: **Shield**, **Unshield**, **Reveal**, **Test tokens** (internal keys `wrap`, `unwrap`, `decryptBalance`, `claimFaucet`).
- The big bottom button is the **primary** and doubles as connect / switch-network: no wallet → "Connect & shield / & mint / & unshield / & reveal"; connected but wrong network → triggers a switch to Sepolia; connected on Sepolia → runs the action.
- Asset selector (top row `SYMBOL / cSYMBOL`, public·private balances, "Change") opens the "Choose an asset" sheet (search + All / Test tokens / Private filters).
- Balance row **Public · Private**: Public shows `Connect` / `Wrong network` / `...` / a number; Private shows `******` until you Reveal this session.
- Progress + errors render in **ExecutionStatus** in the card and as **Activity** rows below; confirmed writes get a "View" link to `sepolia.etherscan.io/tx/<hash>`.
- Expect a wallet signature on **every** reveal and **every** unshield (no permit caching — the SDK is re-created per action). This is normal, not a bug.

## 1. Preconditions (complete ALL first)

1.1 **Wallet:** MetaMask / any injected EIP-1193 (`window.ethereum`) in desktop Chromium or Firefox. No WalletConnect.
1.2 **Network:** add/select **Sepolia** (chainId `11155111` / hex `0xaa36a7`).
1.3 **Gas:** fund ~**0.1 Sepolia ETH** (Google Cloud Web3 / Alchemy / Infura Sepolia faucet) — ~5+ signed txs ahead. Confirm in MetaMask.
1.4 **App URL:** the deployed Vercel URL (preferred) or a local **production** build (`npm run build && npm run start`, NOT `next dev`) → `http://localhost:3000/app`. Record it.
1.5 **RPC insurance:** if you see RPC errors / slow balance reads / `waitForTransactionReceipt` stalls, set `NEXT_PUBLIC_SEPOLIA_RPC_URL` to a dedicated endpoint and rebuild/redeploy. Record whether it was set.
1.6 **SDK / cross-origin check:** open DevTools → Console. Before the encrypted path, confirm NO `SharedArrayBuffer is not defined` / cross-origin-isolation errors when clicking Reveal/Shield. The default single-thread path should NOT need COOP/COEP. If such an error appears, that is a real blocker — but the fix is NOT to add `require-corp` (it breaks the `cdn.zama.org` fetch); investigate whether the SDK was put in threaded mode. Record any header change needed.
1.7 **Test pairs** from the live registry (`0x2f0750…128e`): one **6-decimal** faucet pair (**USDC / cUSDC**) and one **non-6 underlying** pair (**WETH = 18 underlying / 6 confidential**) for the decimals gate. Substitute the closest equivalents if symbols differ; note it.
1.8 **WETH funding (check before the run):** look at the WETH pair's tab — if **Test tokens** is enabled, mint via the faucet (W01). If it is **Restricted** (greyed), pre-acquire ~**2 public Sepolia WETH** before starting: wrap Sepolia ETH via the canonical WETH9 contract or swap on a Sepolia DEX. Note which case applied.
1.9 **DevTools open** (Console + Network) for the whole run — capture relayer/decrypt failures, the actual relayer host (resolve the `chains.ts` drift), and tx hashes.

## 2. Happy path — USDC (6-decimal)

Record every tx hash from Activity "View" links.

- **T01 Connect wallet** — Click **Connect wallet**, approve. Expect: top-right `0x1234…abcd` + green dot; Activity "Wallet connected · 0x…"; no error banner.
- **T02 Network = Sepolia** — If red banner "Your wallet is on the wrong network. Veylbase runs on Sepolia." → "Switch to Sepolia" + approve. Expect: banner clears; Sepolia chip; public balance resolves to a number/`0` (not "Wrong network").
- **T03 Select USDC** — Asset row → sheet → optional "Test tokens" filter → search `USDC` → select. Expect: header `USDC / cUSDC`; **Test tokens** tab enabled (faucet=true).
- **T04 Faucet mint** — "Test tokens" tab → amount `1000` (or **MAX** = `1000000`) → **Get test tokens** → approve. Expect: "Confirm mint in wallet" → "Mint submitted" → "Test tokens received"; Activity success + **View**; public balance increases. **Record mint hash.**
- **T05 Shield (partial)** — "Shield" tab → `400` (< public). Preview "You shield 400 USDC" / "You receive 400 cUSDC" (no refund row for 6-dec). **Shield balance** → approve **two** prompts (exact ERC-20 approval, then shield). Expect: "Confirm shield flow" → "Approval submitted" → "Shield submitted" → "Balance shielded"; public USDC −400. **Record approval + shield hashes.**
- **T06 Reveal** — "Reveal" tab → `******` → **Sign & reveal** → approve **signature** (EIP-712 permit, NO gas, NO tx). Expect: card flips `******` → **`400` cUSDC**; Activity "Private balance revealed · 400 cUSDC". Confirm it re-hides to `******` after ~8s (if auto-rehide shipped). **Record revealed value = shielded amount.**
- **T07 Unshield (partial)** — "Unshield" tab → `150` (≤ revealed; MAX disabled by design). Preview "You unshield 150 cUSDC" / "You receive 150 USDC" / "Two-step…". **Unshield balance** → approve unwrap, then (after "Finalizing unshield") finalize. Expect: "Unshield request submitted" → "Finalizing unshield" → "Finalize submitted" → "Balance unshielded"; public USDC +~150. **Record unwrap + finalize hashes.**
- **T08 Reveal again** — "Reveal" → **Sign & reveal** → approve. Expect: **`250` cUSDC** (400 − 150). Confirms decrease == unshielded. Loop closed.

## 3. WETH (18 underlying / 6 confidential) — decimals-fix gate

Bug class: off by `10^(18−6)=10^12`. Shield parses in **18** (`selectedPair.decimals`); unshield parses in **6** (`confidentialDecimals`); reveal formats in **6**.

- **W01 Select WETH + fund** — Asset sheet → WETH / cWETH. If faucet: mint `2` WETH. If **Restricted** (Test tokens greyed): acquire/wrap public WETH on Sepolia externally. **PASS:** public balance reads as human units (`2`), NOT `2,000,000,000,000` or `0.000000000002`.
- **W02 Shield fractional** — "Shield" → `1.5` → preview "You shield 1.5 WETH" / "You receive 1.5 cWETH". Separately type `1.1234567` once to confirm the **refund** row ("Refunded — exceeds the wrapper's 6-decimal precision", receive capped `1.123456 cWETH`). Use `1.5` for the gate → approve approval + shield. Expect: public WETH −1.5; values human.
- **W03 Reveal (the off-by-10^12 check)** — "Reveal" → **Sign & reveal** → approve. **PASS: `1.5` cWETH.** **FAIL** if `1500000000000`, `1500000`, or `0.0000000000015`.
- **W04 Unshield fractional** — "Unshield" → `0.5` → preview "You unshield 0.5 cWETH" / "You receive 0.5 WETH" → approve unwrap + finalize. **PASS:** public WETH +~`0.5`. **FAIL** if `0.0000000000005` or `500000000000`.
- **W05 Reveal again** — **Sign & reveal** → approve. **PASS: `1.0` cWETH** (1.5 − 0.5), exact.

## 4. Error / edge cases

- **E01 Reject** — Reject any action in MetaMask. Expect: ExecutionStatus "Action did not complete"; neutral Activity row; app usable; no stuck "Working...".
- **E02 Wrong network → switch** — Switch MetaMask to Mainnet → red banner + public "Wrong network" → "Switch to Sepolia" + approve → banner clears, balances re-resolve.
- **E03 Insufficient balance** — Shield > public → inline "Exceeds your public USDC balance." + primary **disabled**. Unshield > revealed private → "Exceeds your revealed private cUSDC balance." (If not revealed, the SDK pre-flight should reject an over-amount cleanly — confirm it errors, not hangs.)
- **E04 Faucet over-limit** — Test tokens amount `2000000` → inline "Faucet mints up to 1,000,000 tokens per call." + disabled. MAX fills exactly `1000000` and is accepted.
- **E05 Relayer / decrypt failure** — DevTools Network: throttle/block the relayer host, then Reveal/Shield. Expect: readable error ExecutionStatus (not a raw stack), neutral Activity row, button returns from "Working...". **Record the exact message;** if opaque, flag as a Phase 005 error-UX follow-up (does not by itself fail the gate if the app recovers).
- **E06 Reload mid-unshield** — Start an unshield (T07/W04); after **unwrap submitted** but **before finalize**, reload (F5). Reconnect, re-select pair. If the "Resume pending unshield" banner shipped, use it; otherwise re-run Unshield. Confirm funds release and the private balance reflects the unshield **exactly once** (no double-spend). Record pre-reload unwrap + post-reload finalize hashes. **If finalize can't recover, that is a real defect** — exactly the gap the resume-unshield fix closes.

## 5. PASS / FAIL gate

**PASS only if ALL hold:**
1. T01–T08 complete with on-chain confirmations; revealed values exact (400 → 400 → unshield 150 → 250).
2. W01–W05 complete with **no value off by 10^12 or 10^6** at any step (shield input, revealed, unshield input, public delta — all human units). **Mandatory decimals sign-off.**
3. E01–E04 behave as specified; app never stuck in "Working..."; every error path returns usable.
4. **Every surfaced error message is human-readable** (no raw stack / opaque code). Record E05's exact message; if opaque, apply the same-day copy fix (Phase 005 SHOULD #11) before sign-off.
5. No COOP/COEP/SharedArrayBuffer console error blocked the encrypted path.
6. **E06 (reload-mid-unshield):** if resume-unshield SHIPPED → E06 must PASS (funds recover exactly once, no double-spend). If resume-unshield was CUT → E06 is **recorded as a known FAIL** and documented in the README "Known limitations" section, and demo beat 9 omits the reload — it is disclosed, never silently dropped (judges reward honest disclosure over a hidden gap).

**FAIL (do not ship) if any of:** a revealed/transferred amount wrong by any power of ten; the encrypted path can't run due to SDK/relayer/COEP errors unfixable in time; the primary button hangs permanently on "Working..." after a failure; or E06 leaves funds unrecoverable with resume-unshield shipped.

## Record per case

These screenshots double as the connected-state README assets and the hero `demo.gif` (006 PLAN step 9 / M3) — capture them once here, since this is the only funded-wallet pass that can.

PASS/FAIL + timestamp; app URL + test wallet address + whether `NEXT_PUBLIC_SEPOLIA_RPC_URL` was set; every tx hash + Etherscan-Sepolia link (T04 mint; T05 approval+shield; T07 unwrap+finalize; W01 mint/approval; W02 approval+shield; W04 unwrap+finalize; E06 unwrap+post-reload finalize); revealed plaintext values as screenshots of the flipped card (USDC T06=400, T08=250; WETH W03=1.5, W05=1.0); screenshots of connected top bar, faucet success, shield two-step, revealed USDC + WETH cards, wrong-network banner, each inline amount error, any error ExecutionStatus; the actual relayer host seen in the Network tab (to reconcile `chains.ts`); whether any header change was needed (1.6).
