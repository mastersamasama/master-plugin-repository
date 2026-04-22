---
name: claim-bounty
description: This skill should be used when the user wants to claim a bounty for a merged GitHub pull request, says "claim my bounty", "my PR got merged, pay me", "submit PR for USDC payment", or provides a GitHub PR URL and asks to get paid. Verifies the PR is merged and sends USDC to the wallet address the PR author posted in their own PR comment.
---

# claim-bounty

Claim USDC for a merged GitHub PR using BountyClaim.

## Steps

1. Ask the user for their GitHub PR URL if not provided
2. Confirm the bounty amount in USDC
3. Remind the user to comment `@bountyclaim 0xYourWalletAddress` on their PR if they haven't already
4. Call the BountyClaim API at `http://localhost:5001/api/claim` with the PR URL and amount
5. Return the result: PR info, wallet address confirmed, TX hash

## Security model

Only the PR author's own comment is accepted as a valid wallet address source. No one else can claim on the author's behalf.

## Example

User: "Claim 50 USDC for https://github.com/owner/repo/pull/42"

Response: Verify PR → confirm author comment → send USDC → show TX hash on Basescan.
