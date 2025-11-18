#!/usr/bin/env bash
set -euo pipefail

#######################################
# Delete Preview Deployment in Dokploy
#######################################
# This script deletes an existing preview deployment and cleans up resources.
#
# NOTE: Database volumes are NOT automatically deleted and must be cleaned up manually
# via Dokploy UI if needed (Settings > Advanced > Clean unused volumes)
#
# Prerequisites:
# - Preview deployment exists
# - API token available
#
# Usage:
#   ./delete-preview.sh <PR_NUMBER>
#
# Example:
#   ./delete-preview.sh 42
#

# Configuration
DOKPLOY_URL="${DOKPLOY_URL:-https://dokploy.example.com}"
DOKPLOY_API_TOKEN="${DOKPLOY_API_TOKEN:-your-api-token-here}"
PROJECT_ID="${PROJECT_ID:-your-project-id}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

check_jq() {
    if ! command -v jq &> /dev/null; then
        log_warn "jq not found, using basic grep/sed parsing"
        return 1
    fi
    return 0
}

# Validate inputs
if [ $# -lt 1 ]; then
    log_error "Usage: $0 <PR_NUMBER>"
    exit 1
fi

PR_NUMBER="$1"
COMPOSE_NAME="preview-pr-${PR_NUMBER}"

log_info "Deleting preview deployment for PR #${PR_NUMBER}"

# Step 1: Find compose by name in preview environment
log_info "Step 1: Finding compose deployment..."

# Get preview environment and composes
ENVIRONMENTS_RESPONSE=$(curl -s \
  "${DOKPLOY_URL}/api/project.one?projectId=${PROJECT_ID}" \
  -H "x-api-key: ${DOKPLOY_API_TOKEN}")

if check_jq; then
    ENVIRONMENT_ID=$(echo "$ENVIRONMENTS_RESPONSE" | jq -r '.environments[]? | select(.name=="preview") | .environmentId // empty' | head -1)
else
    ENVIRONMENT_ID=$(echo "$ENVIRONMENTS_RESPONSE" | grep -o '"name":"preview"' -A 10 | grep -o '"environmentId":"[^"]*"' | head -1 | sed 's/"environmentId":"\([^"]*\)"/\1/')
fi

if [ -z "$ENVIRONMENT_ID" ]; then
    log_error "Preview environment not found"
    exit 1
fi

# Find compose in preview environment
if check_jq; then
    COMPOSE_ID=$(echo "$ENVIRONMENTS_RESPONSE" | jq -r '.environments[] | select(.environmentId=="'"$ENVIRONMENT_ID"'") | .compose[]? | select(.name=="'"$COMPOSE_NAME"'") | .composeId // empty' | head -1)
else
    # Fallback: try to match by name
    COMPOSE_ID=$(echo "$ENVIRONMENTS_RESPONSE" | grep -o "\"name\":\"${COMPOSE_NAME}\"" -A 20 | grep -o '"composeId":"[^"]*"' | head -1 | sed 's/"composeId":"\([^"]*\)"/\1/')
fi

if [ -z "$COMPOSE_ID" ]; then
    log_warn "Preview deployment not found: ${COMPOSE_NAME}"
    log_info "It may have already been deleted"
    exit 0
fi

log_info "Found compose ID: ${COMPOSE_ID}"

# Step 2: Stop compose stack before deletion
log_info "Step 2: Stopping compose stack..."

STOP_PAYLOAD=$(cat <<EOF
{
  "composeId": "${COMPOSE_ID}"
}
EOF
)

STOP_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "${DOKPLOY_URL}/api/compose.stop" \
  -H "x-api-key: ${DOKPLOY_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${STOP_PAYLOAD}")

STOP_HTTP_CODE=$(echo "$STOP_RESPONSE" | tail -n1)

if [ "$STOP_HTTP_CODE" = "200" ]; then
    log_info "Compose stack stopped"
else
    log_warn "Failed to stop compose stack (HTTP ${STOP_HTTP_CODE}), proceeding with deletion anyway"
fi

# Step 3: Delete compose
log_info "Step 3: Deleting compose deployment..."

DELETE_PAYLOAD=$(cat <<EOF
{
  "composeId": "${COMPOSE_ID}"
}
EOF
)

DELETE_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "${DOKPLOY_URL}/api/compose.delete" \
  -H "x-api-key: ${DOKPLOY_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${DELETE_PAYLOAD}")

HTTP_CODE=$(echo "$DELETE_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$DELETE_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "200" ]; then
    log_error "Failed to delete compose (HTTP ${HTTP_CODE})"
    echo "$RESPONSE_BODY"
    exit 1
fi

log_info "Compose deployment deleted successfully"

# Output summary
echo ""
log_info "=========================================="
log_info "Preview Deployment Deleted Successfully"
log_info "=========================================="
echo "PR Number:     ${PR_NUMBER}"
echo "Compose Name:  ${COMPOSE_NAME}"
echo "Compose ID:    ${COMPOSE_ID}"
echo ""
log_warn "Database volumes are NOT automatically deleted"
log_warn "To clean up volumes, go to Dokploy UI:"
log_warn "  Settings > Advanced > Clean unused volumes"
echo ""
