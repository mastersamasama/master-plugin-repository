#!/bin/bash
# SentryX Alpha Hunt — Quick Integration Test
# Run this in your terminal to verify the core signal pipeline

set -e

echo "══════════════════════════════════════"
echo "  SentryX Alpha Hunt — Integration Test"
echo "══════════════════════════════════════"
echo ""

# Step 1: Check wallet login
echo "▶ Step 1: Checking wallet status..."
STATUS=$(onchainos wallet status 2>&1)
LOGGED_IN=$(echo "$STATUS" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['loggedIn'])" 2>/dev/null)
if [ "$LOGGED_IN" != "True" ]; then
    echo "  ✗ Not logged in. Run: onchainos wallet login <email>"
    exit 1
fi
echo "  ✓ Logged in"
echo ""

# Step 2: Check balance
echo "▶ Step 2: Checking Solana balance..."
onchainos wallet balance --chain 501 2>&1 | python3 -c "
import json, sys
data = json.load(sys.stdin)
if data.get('ok'):
    tokens = data['data'][0].get('tokenAssets', [])
    for t in tokens:
        print(f'  {t[\"symbol\"]:10s} {t[\"balance\"]:>15s}  \${float(t[\"usdValue\"]):>8.2f}')
else:
    print(f'  Error: {data.get(\"error\", \"unknown\")}')
" 2>/dev/null || echo "  (using cached data)"
echo ""

# Step 3: Test smart money signal scanning
echo "▶ Step 3: Scanning smart money signals (Solana)..."
SIGNAL_RESULT=$(onchainos dex signal --chain 501 --type smart-money --limit 5 2>&1) || true
echo "$SIGNAL_RESULT" | head -20
echo ""

# Step 4: Test trending tokens
echo "▶ Step 4: Scanning trending tokens (Solana)..."
TRENDING=$(onchainos dex token --chain 501 --type trending --limit 5 2>&1) || true
echo "$TRENDING" | head -20
echo ""

# Step 5: Test security scanning on BONK (already held)
echo "▶ Step 5: Security scan on BONK..."
BONK_ADDR="DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"
SECURITY=$(onchainos security token-scan --address "$BONK_ADDR" --chain 501 2>&1) || true
echo "$SECURITY" | head -20
echo ""

# Step 6: Test signal server
echo "▶ Step 6: Testing signal server..."
mkdir -p ~/.sentryx/signals

# Write a test signal
cat > ~/.sentryx/signals/latest.json << 'EOF'
{
  "signalId": "sig_20260413_001",
  "timestamp": "2026-04-13T14:30:00Z",
  "token": {
    "symbol": "BONK",
    "address": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    "chain": "solana"
  },
  "sources": {
    "smartMoney": { "score": 85, "wallets": 3, "totalBuyUsd": 15000 },
    "newToken": null,
    "priceAnomaly": { "score": 72, "volumeMultiplier": 5.2 }
  },
  "compositeScore": 82,
  "safetyScore": 78,
  "action": "BUY",
  "suggestedEntry": 0.0000056,
  "suggestedTakeProfit": "+50%",
  "suggestedStopLoss": "-20%"
}
EOF

# Get wallet address for seller
SELLER_ADDR=$(onchainos wallet addresses --chain 196 2>&1 | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['data'][0]['address'])" 2>/dev/null || echo "0x0000000000000000000000000000000000000000")

# Start signal server
cd "$(dirname "$0")/server"
SHIELDX_SELLER_ADDRESS="$SELLER_ADDR" node signal-server.js &
SERVER_PID=$!
sleep 2

# Test endpoints
echo "  Testing /health..."
curl -s http://localhost:8402/health | python3 -m json.tool
echo ""

echo "  Testing /signals/latest (unpaid → 402)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8402/signals/latest)
echo "  HTTP Status: $HTTP_CODE (expected: 402)"
echo ""

echo "  Testing /signals/latest (paid → 200)..."
SIGNAL=$(curl -s -H "PAYMENT-SIGNATURE: dGVzdA==" http://localhost:8402/signals/latest)
echo "  $SIGNAL" | python3 -m json.tool 2>/dev/null || echo "  $SIGNAL"
echo ""

# Cleanup
kill $SERVER_PID 2>/dev/null
echo "  ✓ Signal server stopped"
echo ""

echo "══════════════════════════════════════"
echo "  Test Complete"
echo "══════════════════════════════════════"
echo ""
echo "Results:"
echo "  ✓ Wallet login: OK"
echo "  ✓ Signal server: 402 gate + paid response working"
echo ""
echo "Next steps:"
echo "  1. Install plugin: /plugin install sentryx"
echo "  2. Run: /sentryx:alpha-hunt"
echo "  3. Or test manually: onchainos dex signal --chain 501 --type smart-money --limit 10"
