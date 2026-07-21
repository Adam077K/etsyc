#!/usr/bin/env bash
# ============================================================================
# seed-blocks.sh — apply supabase/seed/001_blocks_catalog.sql to the linked
# Supabase project (SUPABASE_PROJECT_REF) via the Management API SQL endpoint.
#
# The seed is a SERVICE-ROLE-ONLY write: `public.blocks` is public-read with
# no client write policy, so this script is the only sanctioned write path.
# It is idempotent — safe to run twice; the upsert leaves the table identical.
#
# Credentials are read from apps/kol/.env.local and are NEVER printed.
# Requires: curl, node (both already required by this repo). No psql needed.
#
# Usage:  ./scripts/seed-blocks.sh
# ============================================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$REPO_ROOT/apps/kol/.env.local"
SEED_FILE="$REPO_ROOT/supabase/seed/001_blocks_catalog.sql"

[[ -f "$ENV_FILE" ]]  || { echo "error: $ENV_FILE not found" >&2; exit 1; }
[[ -f "$SEED_FILE" ]] || { echo "error: $SEED_FILE not found" >&2; exit 1; }

# Load credentials — never echoed. set +x guards against accidental tracing.
set +x
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a
: "${SUPABASE_PROJECT_REF:?SUPABASE_PROJECT_REF missing from apps/kol/.env.local}"
: "${SUPABASE_ACCESS_TOKEN:?SUPABASE_ACCESS_TOKEN missing from apps/kol/.env.local}"

API="https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query"

# JSON-encode a SQL string into the {"query": ...} payload via node (no jq dep).
encode() {
  node -e 'process.stdout.write(JSON.stringify({query: require("fs").readFileSync(process.argv[1], "utf8")}))' "$1"
}

run_sql_literal() { # $1 = raw SQL string; prints response body, fails on non-2xx
  local payload response code body
  payload="$(node -e 'process.stdout.write(JSON.stringify({query: process.argv[1]}))' "$1")"
  response="$(curl -sS -w $'\n%{http_code}' -X POST "$API" \
    -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    --data "$payload")"
  code="${response##*$'\n'}"
  body="${response%$'\n'*}"
  if [[ "$code" != 2* ]]; then
    echo "error: query failed (HTTP $code): $body" >&2
    return 1
  fi
  echo "$body"
}

echo "Applying supabase/seed/001_blocks_catalog.sql to project ${SUPABASE_PROJECT_REF}..."
response="$(curl -sS -w $'\n%{http_code}' -X POST "$API" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  --data "$(encode "$SEED_FILE")")"
code="${response##*$'\n'}"
body="${response%$'\n'*}"
if [[ "$code" != 2* ]]; then
  echo "error: seed apply failed (HTTP $code): $body" >&2
  exit 1
fi
echo "Seed applied (HTTP $code)."

echo "Read-back verification:"
run_sql_literal "select count(*) as total_rows, count(distinct type) as distinct_types from public.blocks;"
echo ""
