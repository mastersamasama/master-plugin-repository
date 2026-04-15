#!/usr/bin/env bash
# ─── SentryX Demo Warmup ───────────────────────────────────────
# Run this BEFORE recording to pre-populate data in Dashboard.
# Usage: DEMO=true bash demo-warmup.sh
# ────────────────────────────────────────────────────────────────

set -e

PORT="${SENTRYX_PORT:-3000}"
BASE="http://localhost:${PORT}"

echo ""
echo "  SentryX Demo Warmup"
echo "  ────────────────────"
echo ""

# 1. Check server is running
if ! curl -s "${BASE}/api/status" > /dev/null 2>&1; then
  echo "  [!] Server not running on port ${PORT}"
  echo "      Start it first:  DEMO=true npm run start"
  exit 1
fi
echo "  [✓] Server running on port ${PORT}"

# 2. Login (demo mode auto-accepts any email/code)
echo "  [→] Logging in..."
curl -s -X POST "${BASE}/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@sentryx.ai"}' > /dev/null

sleep 0.5

curl -s -X POST "${BASE}/api/auth/verify" \
  -H 'Content-Type: application/json' \
  -d '{"code":"000000"}' > /dev/null

echo "  [✓] Logged in as demo@sentryx.ai"

# 3. Run 3 scan cycles to accumulate signals + positions
echo "  [→] Starting strategy (3 warm-up scan cycles)..."
curl -s -X POST "${BASE}/api/strategy/start" \
  -H 'Content-Type: application/json' \
  -d '{"scanIntervalSec":5,"positionSize":5,"chains":["501","8453"]}' > /dev/null

# Wait for 3 cycles (5s interval × 3 + buffer)
for i in 1 2 3; do
  sleep 6
  STATUS=$(curl -s "${BASE}/api/status")
  SCANS=$(echo "$STATUS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('scanCount',0))" 2>/dev/null || echo "?")
  ACTIVE=$(echo "$STATUS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('activePositions',0))" 2>/dev/null || echo "?")
  echo "  [→] Cycle ${i}/3 — Scans: ${SCANS}, Active positions: ${ACTIVE}"
done

# 4. Stop the fast scanning (user will restart manually during demo)
curl -s -X POST "${BASE}/api/strategy/stop" > /dev/null
echo "  [✓] Strategy stopped (ready for manual demo restart)"

# 5. Show summary
echo ""
echo "  ─── Warmup Complete ───"
FINAL=$(curl -s "${BASE}/api/status")
echo "  Scan count:      $(echo "$FINAL" | python3 -c "import sys,json; print(json.load(sys.stdin).get('scanCount',0))" 2>/dev/null)"
echo "  Active positions: $(echo "$FINAL" | python3 -c "import sys,json; print(json.load(sys.stdin).get('activePositions',0))" 2>/dev/null)"
echo ""
SIGNALS=$(curl -s "${BASE}/api/signals" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "?")
echo "  Signals in history: ${SIGNALS}"
echo ""
echo "  Dashboard ready at: ${BASE}"
echo "  Now open the browser and start recording!"
echo ""
