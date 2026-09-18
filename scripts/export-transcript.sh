#!/usr/bin/env bash
# Auto-export the current agent session transcript into prompts/, then
# refresh the auto-index in PROMPTS.md (scripts/index-prompts.py).
#
# Wired as:
#   Claude Code — Stop + SessionEnd in .claude/settings.json
#   Cursor      — stop + sessionEnd in .cursor/hooks.json
#
# Non-fatal by design: any failure exits 0 so it can never interrupt your work.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
dest_dir="$repo_root/prompts"

payload="$(cat || true)"

read_field() {
  local key="$1"
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$payload" | jq -r --arg k "$key" '.[$k] // empty'
  elif command -v python3 >/dev/null 2>&1; then
    printf '%s' "$payload" | python3 -c \
      "import sys,json; print(json.load(sys.stdin).get('$key',''))" 2>/dev/null
  else
    printf '%s' "$payload" \
      | grep -o "\"$key\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" \
      | head -1 | sed 's/.*:[[:space:]]*"\([^"]*\)"/\1/'
  fi
}

transcript_path="$(read_field transcript_path)"
session_id="$(read_field session_id)"
[ -n "$session_id" ] || session_id="$(read_field conversation_id)"
[ -n "$session_id" ] || session_id="unknown"

if [ -n "$transcript_path" ] && [ -f "$transcript_path" ]; then
  mkdir -p "$dest_dir"
  cp "$transcript_path" "$dest_dir/raw-session-$session_id.jsonl"
fi

if command -v python3 >/dev/null 2>&1; then
  python3 "$repo_root/scripts/index-prompts.py" >/dev/null 2>&1 || true
fi

exit 0
