# UAT

## Scenario

A bounty judge opens the app, sees Veylbase as a live confidential asset portal, scans official Sepolia registry coverage, selects USDC mock, sees faucet availability, previews wrap steps, and sees where confidential balance decryption will happen.

## Result

Passed for Phase 002 preview scope.

## Notes

- The first dashboard-style implementation was rejected because it introduced card soup, oversized hero text, overflow, and implementation-detail leakage.
- The corrected implementation now opens into the product itself: Veylbase top bar, search-first registry, official pair rows, selected-pair action panel, hidden confidential holding, and short activity thread.
- Search, selection, and Reveal tab switching were verified with Playwright against the production server.
- Real wallet execution remains intentionally deferred to Phase 003.
