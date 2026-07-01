# Demo Script

Target length: about 3 minutes. Use your own real voice and add subtitles. Pre-fund the wallet with Sepolia ETH and pre-mint test tokens before recording so the live relayer steps do not stall on camera.

| Beat | Time | Screen | Voiceover |
| --- | ---: | --- | --- |
| 1 | 0-8s | Landing hero. | "This is Veylbase: a simple interface for moving from public ERC-20 tokens into Zama confidential wrapper balances." |
| 2 | 8-22s | Click **Enter dApp**. USDC selected, Shield active. | "The app reads Zama's wrapper registry. Each row pairs a public token with its confidential ERC-7984 wrapper." |
| 3 | 22-34s | Connect wallet. | "It is non-custodial. Veylbase never holds keys or funds; every action is signed in my wallet." |
| 4 | 34-44s | Conditional wrong-network banner, then switch. | "If the wallet is on the wrong network, the app asks for Sepolia and keeps the main flow clean." |
| 5 | 44-60s | Test tokens tab, mint, activity link. | "For the demo I mint mock public tokens, so I have something to shield." |
| 6 | 60-84s | Shield tab, amount, approval, shield progress. | "Shielding wraps the public balance one-to-one into a confidential token. After confirmation, the balance is encrypted on-chain." |
| 7 | 84-96s | Asset row and Reveal tab show `******`. | "The private side is hidden by default. A block explorer sees ciphertext, not my balance." |
| 8 | 96-120s | Reveal, signature, value appears. | "Reveal is intentional. I sign a permit, no transaction is broadcast, and the plaintext is shown only in this session." |
| 9 | 120-150s | Unshield tab, request and finalize. | "To return public, unshield runs two steps: submit the encrypted unwrap request, then finalize the release." |
| 10 | 150-165s | Developer plan drawer. | "For judges, the plan drawer shows the ordered SDK and contract calls behind each action." |
| 11 | 165-180s | Landing, live URL, repository. | "Veylbase gives public tokens a private balance layer, with reveal on the user's terms." |

## Recorder Notes

- Skip beat 4 if the wallet is already on Sepolia and give that time to shield/unshield confirmations.
- Keep DevTools closed unless you are recording a judge-facing debug clip.
- Capture a clean desktop pass and a short mobile pass after Phase 006 deployment.
- Record every transaction hash during UAT before the final take.
