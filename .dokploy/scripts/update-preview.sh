#!/usr/bin/env bash
set -euo pipefail

#######################################
# Update Preview Deployment in Dokploy
#######################################
# This script updates an existing preview deployment with:
# - Latest docker-compose.yml from repository (picks up any changes)
# - New image tag
# - Updated environment variables
#
# Prerequisites:
# - Preview deployment already created via create-preview.sh
# - New Docker image built and pushed to GHCR
# - API token available
#
# Usage:
#   ./update-preview.sh <PR_NUMBER>
#
# Example:
#   ./update-preview.sh 42
#

# Configuration
DOKPLOY_URL="${DOKPLOY_URL:-https://dokploy.example.com}"
DOKPLOY_API_TOKEN="${DOKPLOY_API_TOKEN:-your-api-token-here}"
PROJECT_ID="${PROJECT_ID:-your-project-id}"
GHCR_IMAGE="${GHCR_IMAGE:-ghcr.io/vleletko/planner}"
APP_BASE_DOMAIN="${APP_BASE_DOMAIN:-preview.example.com}"

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
COMPOSE_APP_NAME="planner-pr-${PR_NUMBER}"
IMAGE_TAG="pr-${PR_NUMBER}"
PREVIEW_URL="pr-${PR_NUMBER}.${APP_BASE_DOMAIN}"

log_info "Updating preview deployment for PR #${PR_NUMBER}"

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
    log_error "Run create-preview.sh first"
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
    log_error "Preview deployment not found: ${COMPOSE_NAME}"
    log_error "Run create-preview.sh first or check the preview name"
    exit 1
fi

log_info "Found compose ID: ${COMPOSE_ID}"

# Step 2: Read compose file from repository
log_info "Step 2: Reading docker-compose.yml from repository..."

COMPOSE_FILE_PATH="../docker-compose.preview.yml"

if [ ! -f "$COMPOSE_FILE_PATH" ]; then
    log_error "Compose file not found: $COMPOSE_FILE_PATH"
    log_error "Expected location: .dokploy/docker-compose.preview.yml"
    exit 1
fi

COMPOSE_FILE=$(cat "$COMPOSE_FILE_PATH")
log_info "Compose file loaded (will pick up any changes from PR)"

# Step 3: Update environment variables with new image tag
log_info "Step 3: Updating IMAGE_TAG to ${IMAGE_TAG}..."

APP_VERSION=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
ENV_VARS=$(cat <<EOF
GHCR_IMAGE=${GHCR_IMAGE}
IMAGE_TAG=${IMAGE_TAG}
APP_NAME=${COMPOSE_APP_NAME}
PREVIEW_DOMAIN=${PREVIEW_URL}
PREVIEW_ID=${PR_NUMBER}
APP_VERSION=${APP_VERSION}
OTEL_SERVICE_NAME=planner-web
DB_PASSWORD=\${environment.DB_PASSWORD}
BETTER_AUTH_SECRET=\${environment.BETTER_AUTH_SECRET}
OTEL_EXPORTER_OTLP_ENDPOINT=\${environment.OTEL_EXPORTER_OTLP_ENDPOINT}
OTEL_EXPORTER_OTLP_HEADERS=\${environment.OTEL_EXPORTER_OTLP_HEADERS}
EOF
)

# Step 4: Update compose configuration
log_info "Step 4: Updating compose configuration..."

UPDATE_PAYLOAD=$(cat <<EOF
{
  "composeId": "${COMPOSE_ID}",
  "composeFile": $(echo "$COMPOSE_FILE" | jq -Rs .),
  "env": $(echo "$ENV_VARS" | jq -Rs .),
  "sourceType": "raw",
  "composeStatus": "idle"
}
EOF
)

UPDATE_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "${DOKPLOY_URL}/api/compose.update" \
  -H "x-api-key: ${DOKPLOY_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${UPDATE_PAYLOAD}")

HTTP_CODE=$(echo "$UPDATE_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$UPDATE_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "200" ]; then
    log_error "Failed to update compose configuration (HTTP ${HTTP_CODE})"
    echo "$RESPONSE_BODY"
    exit 1
fi

log_info "Compose configuration updated"

# Step 5: Redeploy with new image
log_info "Step 5: Redeploying compose stack..."

REDEPLOY_PAYLOAD=$(cat <<EOF
{
  "composeId": "${COMPOSE_ID}"
}
EOF
)

REDEPLOY_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "${DOKPLOY_URL}/api/compose.redeploy" \
  -H "x-api-key: ${DOKPLOY_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${REDEPLOY_PAYLOAD}")

HTTP_CODE=$(echo "$REDEPLOY_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$REDEPLOY_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "200" ]; then
    log_error "Failed to redeploy compose (HTTP ${HTTP_CODE})"
    echo "$RESPONSE_BODY"
    exit 1
fi

log_info "Redeployment initiated"

# Step 6: Wait for redeployment to complete
log_info "Step 6: Waiting for redeployment to complete..."

MAX_WAIT=180  # 3 minutes
WAIT_INTERVAL=10
ELAPSED=0

while [ $ELAPSED -lt $MAX_WAIT ]; do
    sleep $WAIT_INTERVAL
    ELAPSED=$((ELAPSED + WAIT_INTERVAL))

    STATUS_RESPONSE=$(curl -s \
      "${DOKPLOY_URL}/api/compose.one?composeId=${COMPOSE_ID}" \
      -H "x-api-key: ${DOKPLOY_API_TOKEN}")

    if check_jq; then
        STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.composeStatus // "unknown"')
    else
        STATUS=$(echo "$STATUS_RESPONSE" | grep -o '"composeStatus":"[^"]*"' | sed 's/"composeStatus":"\([^"]*\)"/\1/')
    fi

    log_info "Redeployment status: ${STATUS} (${ELAPSED}s elapsed)"

    if [ "$STATUS" = "done" ]; then
        log_info "Redeployment completed successfully!"
        break
    elif [ "$STATUS" = "error" ]; then
        log_error "Redeployment failed"
        log_warn "Check Dokploy UI: ${DOKPLOY_URL}/dashboard/project/${PROJECT_ID}/services/compose/${COMPOSE_ID}?tab=deployments"
        exit 1
    fi
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
    log_warn "Redeployment timeout after ${MAX_WAIT}s"
    log_warn "Check deployment status manually: ${DOKPLOY_URL}"
fi

# Output summary
echo ""
log_info "=========================================="
log_info "Preview Deployment Updated Successfully"
log_info "=========================================="
echo "PR Number:     ${PR_NUMBER}"
echo "Compose ID:    ${COMPOSE_ID}"
echo "Image Tag:     ${GHCR_IMAGE}:${IMAGE_TAG}"
echo "Preview URL:   https://${PREVIEW_URL}"
echo ""
log_info "Preview deployment updated with latest code and image"
echo ""
