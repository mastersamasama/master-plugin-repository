#!/usr/bin/env bash
# example-hook.sh — reference PreToolUse hook for multi-component-plugin
#
# This hook demonstrates the file location and ${CLAUDE_PLUGIN_ROOT} convention.
# It is referenced from hooks/hooks.json. Real hooks should read tool input from
# stdin (JSON), make a decision, and exit 0 to allow or non-zero to deny.

# Pass through (no-op) — print a marker to stderr so the participant can see
# the hook fired during testing, then exit 0.
echo "[multi-component-plugin] example-hook fired" >&2
exit 0
