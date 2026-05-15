# Pre-flight Checks

The `agent.sh connect` command runs these checks before it starts the daemon. Read this once per session so you know what failures mean; you do not need to run separate shell commands unless you are debugging.

## 1. npx available

The skill launches the published npm package with `npx -y onchainos-connect@latest`. If the driver reports that `npx` is missing, ask the user to install Node/npm.

## 2. Node ≥ 22

The published agent and WalletKit Node bindings need Node 22+.

If the driver reports Node `< v22`, stop and tell the user to upgrade or activate Node 22, for example `nvm install 22 && nvm use 22`.

## 3. Onchain OS CLI

The daemon calls `onchainos wallet addresses` at boot and refuses to start if the CLI is missing or not logged in.

- CLI missing → ask the user to install it first.
- CLI present but `loggedIn: false` → ask the user to run `onchainos wallet login`, then retry.

## Conservative posture

- If a check is load-bearing (Node version, npx, Onchain OS CLI login), stop with a single-line fix.
- Do not auto-reinstall packages on command failure — report and let the user decide.
