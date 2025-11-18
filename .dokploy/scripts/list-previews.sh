#!/usr/bin/env bash
set -euo pipefail

#######################################
# List Preview Deployments in Dokploy
#######################################
# This script lists all preview deployments in the "preview" environment
# that match the preview deployment naming pattern.
#
# Prerequisites:
# - Dokploy instance running and accessible
# - API token generated from Dokploy settings
#
# Usage:
#   ./list-previews.sh
#
# Example:
#   ./list-previews.sh
#

# Configuration
DOKPLOY_URL="${DOKPLOY_URL:-https://dokploy.example.com}"
DOKPLOY_API_TOKEN="${DOKPLOY_API_TOKEN:-your-api-token-here}"
PROJECT_ID="${PROJECT_ID:-your-project-id}"
APP_BASE_DOMAIN="${APP_BASE_DOMAIN:-preview.example.com}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper functions
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
        log_warn "jq not found, using basic grep/sed parsing (less reliable)"
        return 1
    fi
    return 0
}

# Step 1: Get "preview" environment
log_info "Fetching preview environment..."

ENVIRONMENTS_RESPONSE=$(curl -s \
  "${DOKPLOY_URL}/api/project.one?projectId=${PROJECT_ID}" \
  -H "x-api-key: ${DOKPLOY_API_TOKEN}")

# Find "preview" environment
if check_jq; then
    ENVIRONMENT_ID=$(echo "$ENVIRONMENTS_RESPONSE" | jq -r '.environments[]? | select(.name=="preview") | .environmentId // empty' | head -1)
else
    ENVIRONMENT_ID=$(echo "$ENVIRONMENTS_RESPONSE" | grep -o '"name":"preview"' -A 10 | grep -o '"environmentId":"[^"]*"' | head -1 | sed 's/"environmentId":"\([^"]*\)"/\1/')
fi

if [ -z "$ENVIRONMENT_ID" ]; then
    log_warn "No preview environment found"
    echo "Run create-preview.sh to create the first preview deployment"
    exit 0
fi

log_info "Found preview environment: ${ENVIRONMENT_ID}"

# Step 2: Parse composes from the same API response
log_info "Parsing compose deployments from preview environment..."

# Reuse ENVIRONMENTS_RESPONSE from Step 1 (no need to call API again)
PROJECT_RESPONSE="$ENVIRONMENTS_RESPONSE"

# Extract composes from the preview environment
if check_jq; then
    # Composes are nested: .environments[].compose[] not .composes[]
    COMPOSES=$(echo "$PROJECT_RESPONSE" | jq -r '.environments[] | select(.environmentId=="'"$ENVIRONMENT_ID"'") | .compose[]? | select(.name | startswith("preview-pr-")) | @json')
else
    # Fallback: extract compose objects manually (less reliable)
    COMPOSES=$(echo "$PROJECT_RESPONSE" | grep -o '"compose":\[.*\]' | sed 's/"compose":\[\(.*\)\]/\1/')
fi

if [ -z "$COMPOSES" ]; then
    log_info "No preview deployments found"
    exit 0
fi

# Step 3: Display previews in a table
echo ""
echo "=========================================="
echo "Preview Deployments"
echo "=========================================="
echo ""

# Table header
printf "${CYAN}%-8s${NC} ${BLUE}%-20s${NC} ${GREEN}%-15s${NC} ${YELLOW}%-40s${NC} %-36s\n" \
  "PR #" "Name" "Status" "URL" "Compose ID"
echo "--------------------------------------------------------------------------------------------------------"

# Process each compose
if check_jq; then
    echo "$COMPOSES" | while IFS= read -r compose_json; do
        if [ -z "$compose_json" ]; then
            continue
        fi

        NAME=$(echo "$compose_json" | jq -r '.name // "unknown"')
        COMPOSE_ID=$(echo "$compose_json" | jq -r '.composeId // .id // "unknown"')
        STATUS=$(echo "$compose_json" | jq -r '.composeStatus // "unknown"')
        APP_NAME=$(echo "$compose_json" | jq -r '.appName // "unknown"')

        # Extract PR number from name (preview-pr-42 -> 42)
        if [[ "$NAME" =~ preview-pr-([0-9]+) ]]; then
            PR_NUMBER="${BASH_REMATCH[1]}"
            PREVIEW_URL="https://pr-${PR_NUMBER}.${APP_BASE_DOMAIN}"
        else
            PR_NUMBER="?"
            PREVIEW_URL="unknown"
        fi

        # Color status
        case "$STATUS" in
            "done")
                STATUS_COLORED="${GREEN}${STATUS}${NC}"
                ;;
            "running")
                STATUS_COLORED="${YELLOW}${STATUS}${NC}"
                ;;
            "error")
                STATUS_COLORED="${RED}${STATUS}${NC}"
                ;;
            *)
                STATUS_COLORED="${STATUS}"
                ;;
        esac

        printf "%-8s %-20s ${STATUS_COLORED}%-15s${NC} %-40s %-36s\n" \
          "$PR_NUMBER" "$NAME" "" "$PREVIEW_URL" "$COMPOSE_ID"
    done
else
    # Fallback parsing without jq (basic, may not work perfectly)
    log_warn "Limited output without jq. Install jq for full functionality."

    # Try to extract basic info using grep/sed
    echo "$PROJECT_RESPONSE" | grep -o '"name":"preview-pr-[^"]*"' | sed 's/"name":"preview-pr-\([0-9]*\)"/\1/' | while read -r PR_NUMBER; do
        if [ -z "$PR_NUMBER" ]; then
            continue
        fi

        NAME="preview-pr-${PR_NUMBER}"
        PREVIEW_URL="https://pr-${PR_NUMBER}.${APP_BASE_DOMAIN}"

        printf "%-8s %-20s %-15s %-40s\n" \
          "$PR_NUMBER" "$NAME" "?" "$PREVIEW_URL"
    done
fi

echo ""
echo "Total: $(echo "$COMPOSES" | grep -c "composeId" || echo "0") preview deployment(s)"
echo ""
