# UAT

## Scenario

Connect a Sepolia wallet, mint public mock tokens, shield some balance, reveal the confidential balance, then unshield/finalize part of it.

## Result

Partially passed.

- Passed: production landing and `/app` render locally; the action UI, mobile layout, and status/activity surfaces are present.
- Not run: real faucet, shield, reveal, and unshield/finalize submissions with a funded Sepolia wallet.

## Notes

Automated checks prove the execution paths compile, bundle, and render. Final acceptance still needs an injected wallet, Sepolia ETH, token mint approval, Zama decryption permit signature, and unshield finalization in a real browser session.
