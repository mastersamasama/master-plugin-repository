#!/usr/bin/env bash
# onchainos-connect skill driver.
#
# Subcommands:
#   connect <wc-uri>     pair with a dApp (auto-spawns the daemon if needed)
#   disconnect <name>    disconnect the session whose dApp metadata.name matches
#   disconnect <topic>   disconnect a session by WalletConnect topic
#   disconnect all       disconnect every active session
#   list                 list active sessions
#   status               print daemon health + active sessions
#   stop                 ask the daemon to shut down right now (it auto-exits otherwise)

set -euo pipefail

DATA_DIR="${WC_AGENT_DATA_DIR:-$HOME/.onchainos-connect}"
DAEMON_FILE="$DATA_DIR/daemon.json"
DAEMON_LOG="$DATA_DIR/daemon.log"
NPM_PACKAGE="${ONCHAINOS_CONNECT_NPM_PACKAGE:-onchainos-connect@latest}"

mkdir -p "$DATA_DIR"

# ---- preflight --------------------------------------------------------------

preflight() {
  if ! command -v npx >/dev/null 2>&1; then
    echo "[onchainos-connect] npx is required. Install Node/npm first." >&2
    exit 1
  fi

  local node_version node_major
  node_version="$(node -v 2>/dev/null || true)"
  node_major="${node_version#v}"
  node_major="${node_major%%.*}"
  if [[ -z "$node_major" || ! "$node_major" =~ ^[0-9]+$ || "$node_major" -lt 22 ]]; then
    echo "[onchainos-connect] Node.js >=22 is required; current version is ${node_version:-missing}." >&2
    exit 1
  fi

  if ! command -v onchainos >/dev/null 2>&1; then
    echo "[onchainos-connect] onchainos CLI is required. Install it and run onchainos wallet login." >&2
    exit 1
  fi

  local status logged_in
  status="$(onchainos wallet status 2>/dev/null)" || {
    echo "[onchainos-connect] onchainos wallet status failed. Run onchainos wallet login, then retry." >&2
    exit 1
  }
  logged_in="$(printf '%s' "$status" | python3 -c 'import json,sys; print(str(json.load(sys.stdin).get("data",{}).get("loggedIn", False)).lower())' 2>/dev/null || true)"
  if [[ "$logged_in" != "true" ]]; then
    echo "[onchainos-connect] onchainos is not logged in. Run onchainos wallet login, then retry." >&2
    exit 1
  fi
}

# ---- daemon.json helpers ---------------------------------------------------

read_json_field() {
  local field="$1"
  [[ -f "$DAEMON_FILE" ]] || return 1
  python3 -c "import json,sys; print(json.load(open('$DAEMON_FILE')).get('$field',''))" 2>/dev/null \
    || grep -oE "\"$field\"[[:space:]]*:[[:space:]]*[\"0-9a-zA-Z_.-]+" "$DAEMON_FILE" \
       | head -1 | sed -E "s/.*\"$field\"[[:space:]]*:[[:space:]]*\"?([^\",}]+)\"?.*/\1/"
}

daemon_pid()  { read_json_field pid; }
daemon_port() { read_json_field port || echo 3748; }

daemon_process_alive() {
  local pid
  pid="$(daemon_pid)" || return 1
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

daemon_healthy() {
  [[ -f "$DAEMON_FILE" ]] || return 1
  daemon_process_alive || return 1
  curl -fsS --max-time 2 "$(daemon_url)/health" >/dev/null 2>&1
}

clear_stale_daemon_file() {
  [[ -f "$DAEMON_FILE" ]] || return 0
  if ! daemon_healthy; then
    rm -f "$DAEMON_FILE"
  fi
}

daemon_url() {
  local port
  port="$(daemon_port)"
  printf 'http://127.0.0.1:%s' "$port"
}

# ---- spawn / wait ----------------------------------------------------------

spawn_daemon() {
  rm -f "$DAEMON_FILE"
  nohup npx -y "$NPM_PACKAGE" >"$DAEMON_LOG" 2>&1 & disown
}

wait_for_daemon() {
  for _ in $(seq 1 90); do
    if daemon_healthy; then
      return 0
    fi
    sleep 1
  done
  echo "[onchainos-connect] daemon failed to start within 90s." >&2
  echo "[onchainos-connect] tail: tail -f $DAEMON_LOG" >&2
  return 1
}

ensure_daemon() {
  preflight
  clear_stale_daemon_file
  if daemon_healthy; then
    return 0
  fi
  spawn_daemon
  wait_for_daemon
}

# ---- subcommands -----------------------------------------------------------

cmd_connect() {
  local uri="${1:-}"
  if [[ -z "$uri" ]]; then
    echo "Usage: onchainos-connect connect <wc-uri>" >&2
    exit 2
  fi
  if [[ "$uri" != wc:* ]]; then
    echo "Not a WalletConnect URI (must start with 'wc:'): $uri" >&2
    exit 2
  fi
  ensure_daemon

  local body
  body=$(printf '{"uri":%s}' "$(python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$uri")")

  local response
  response=$(curl -fsS -X POST "$(daemon_url)/connect" \
    -H 'content-type: application/json' \
    --data "$body" 2>&1) || {
      echo "$response" >&2
      exit 1
    }
  echo "$response"
}

cmd_disconnect() {
  local target="${1:-}"
  if [[ -z "$target" ]]; then
    echo "Usage: onchainos-connect disconnect <dapp-name|topic|all>" >&2
    exit 2
  fi
  clear_stale_daemon_file
  if ! daemon_healthy; then
    echo "[onchainos-connect] daemon is not running — no active sessions." >&2
    exit 1
  fi
  if [[ "${target,,}" == "all" ]]; then
    local topics
    topics="$(curl -fsS "$(daemon_url)/sessions" | python3 -c 'import json,sys; print("\n".join(s["topic"] for s in json.load(sys.stdin).get("sessions", [])))')"
    if [[ -z "$topics" ]]; then
      echo '{"ok":true,"disconnected":[]}'
      return 0
    fi
    while IFS= read -r topic; do
      [[ -n "$topic" ]] || continue
      local body
      body=$(printf '{"topic":%s}' "$(python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$topic")")
      curl -fsS -X POST "$(daemon_url)/disconnect" \
        -H 'content-type: application/json' \
        --data "$body"
      echo
    done <<< "$topics"
    return 0
  fi

  local body
  if [[ "$target" =~ ^[0-9a-fA-F]{64}$ ]]; then
    body=$(printf '{"topic":%s}' "$(python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$target")")
  else
    body=$(printf '{"name":%s}' "$(python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$target")")
  fi
  curl -fsS -X POST "$(daemon_url)/disconnect" \
    -H 'content-type: application/json' \
    --data "$body"
  echo
}

cmd_list() {
  clear_stale_daemon_file
  if ! daemon_healthy; then
    echo "[onchainos-connect] daemon not running."
    return 0
  fi
  curl -fsS "$(daemon_url)/sessions"
  echo
}

cmd_status() {
  clear_stale_daemon_file
  if ! daemon_healthy; then
    echo "[onchainos-connect] daemon not running."
    return 0
  fi
  echo "[onchainos-connect] daemon pid=$(daemon_pid) port=$(daemon_port)"
  curl -fsS "$(daemon_url)/state"
  echo
}

cmd_stop() {
  clear_stale_daemon_file
  if ! daemon_healthy; then
    echo "[onchainos-connect] daemon not running."
    return 0
  fi
  curl -fsS -X POST "$(daemon_url)/shutdown" || true
  echo
}

# ---- dispatch --------------------------------------------------------------

cmd="${1:-status}"
shift || true

case "$cmd" in
  connect)    cmd_connect "$@" ;;
  disconnect) cmd_disconnect "$@" ;;
  list)       cmd_list "$@" ;;
  status)     cmd_status "$@" ;;
  stop)       cmd_stop "$@" ;;
  *)
    echo "Unknown subcommand: $cmd" >&2
    echo "Usage: onchainos-connect {connect <uri> | disconnect <name|topic|all> | list | status | stop}" >&2
    exit 2 ;;
esac
