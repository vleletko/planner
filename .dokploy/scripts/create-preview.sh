#!/usr/bin/env bash
set -euo pipefail

#######################################
# Create Preview Deployment in Dokploy
#######################################
# This script creates a new Docker Compose-based preview deployment
# for a specific pull request using the Dokploy API.
#
# Prerequisites:
# - Dokploy instance running and accessible
# - Project already created in Dokploy
# - Docker image pre-built and pushed to GHCR
# - API token generated from Dokploy settings
#
# Usage:
#   ./create-preview.sh <PR_NUMBER>
#
# Example:
#   ./create-preview.sh 42
#

# Configuration - Set these environment variables or update defaults
DOKPLOY_URL="${DOKPLOY_URL:-https://dokploy.example.com}"
DOKPLOY_API_TOKEN="${DOKPLOY_API_TOKEN:-your-api-token-here}"
PROJECT_ID="${PROJECT_ID:-your-project-id}"
SERVER_ID="${SERVER_ID:-}" # Optional: Leave empty for default server
GHCR_IMAGE="${GHCR_IMAGE:-ghcr.io/vleletko/planner}"
APP_BASE_DOMAIN="${APP_BASE_DOMAIN:-preview.example.com}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper function to print colored messages
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Check if jq is installed
check_jq() {
    if ! command -v jq &> /dev/null; then
        log_warn "jq not found, using basic grep/sed parsing (less reliable)"
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

log_info "Creating preview deployment for PR #${PR_NUMBER}"
log_info "Compose name: ${COMPOSE_NAME}"
log_info "Image tag: ${IMAGE_TAG}"
log_info "Preview URL: https://${PREVIEW_URL}"

# Step 1: Get or create "preview" environment
log_info "Step 1: Checking for 'preview' environment..."

# Get all environments for the project
ENVIRONMENTS_RESPONSE=$(curl -s \
  "${DOKPLOY_URL}/api/project.one?projectId=${PROJECT_ID}" \
  -H "x-api-key: ${DOKPLOY_API_TOKEN}")

# Try to find existing "preview" environment
if check_jq; then
    ENVIRONMENT_ID=$(echo "$ENVIRONMENTS_RESPONSE" | jq -r '.environments[]? | select(.name=="preview") | .environmentId // empty' | head -1)
else
    ENVIRONMENT_ID=$(echo "$ENVIRONMENTS_RESPONSE" | grep -o '"name":"preview"' -A 10 | grep -o '"environmentId":"[^"]*"' | head -1 | sed 's/"environmentId":"\([^"]*\)"/\1/')
fi

if [ -z "$ENVIRONMENT_ID" ]; then
    log_info "Preview environment not found, creating..."

    CREATE_ENV_PAYLOAD=$(cat <<EOF
{
  "name": "preview",
  "projectId": "${PROJECT_ID}",
  "description": "Preview deployments for pull requests"
}
EOF
)

    ENV_RESPONSE=$(curl -s -w "\n%{http_code}" \
      -X POST "${DOKPLOY_URL}/api/environment.create" \
      -H "x-api-key: ${DOKPLOY_API_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "${CREATE_ENV_PAYLOAD}")

    ENV_HTTP_CODE=$(echo "$ENV_RESPONSE" | tail -n1)
    ENV_BODY=$(echo "$ENV_RESPONSE" | sed '$d')

    if [ "$ENV_HTTP_CODE" != "200" ]; then
        log_error "Failed to create preview environment (HTTP ${ENV_HTTP_CODE})"
        echo "$ENV_BODY"
        exit 1
    fi

    if check_jq; then
        ENVIRONMENT_ID=$(echo "$ENV_BODY" | jq -r '.environmentId // .id // empty')
    else
        ENVIRONMENT_ID=$(echo "$ENV_BODY" | grep -o '"environmentId":"[^"]*"' | head -1 | sed 's/"environmentId":"\([^"]*\)"/\1/')
        if [ -z "$ENVIRONMENT_ID" ]; then
            ENVIRONMENT_ID=$(echo "$ENV_BODY" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\([^"]*\)"/\1/')
        fi
    fi

    if [ -z "$ENVIRONMENT_ID" ]; then
        log_error "Failed to extract environment ID from response"
        echo "$ENV_BODY"
        exit 1
    fi

    log_info "Preview environment created with ID: ${ENVIRONMENT_ID}"
else
    log_info "Found existing preview environment: ${ENVIRONMENT_ID}"
fi

# Step 2: Create compose configuration
log_info "Step 2: Creating compose configuration..."

CREATE_PAYLOAD=$(cat <<EOF
{
  "name": "${COMPOSE_NAME}",
  "projectId": "${PROJECT_ID}",
  "environmentId": "${ENVIRONMENT_ID}",
  "description": "Preview deployment for PR #${PR_NUMBER}",
  "composeType": "docker-compose",
  "appName": "${COMPOSE_APP_NAME}"$([ -n "$SERVER_ID" ] && echo ",
  \"serverId\": \"${SERVER_ID}\"" || echo "")
}
EOF
)

CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "${DOKPLOY_URL}/api/compose.create" \
  -H "x-api-key: ${DOKPLOY_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${CREATE_PAYLOAD}")

HTTP_CODE=$(echo "$CREATE_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$CREATE_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "200" ]; then
    log_error "Failed to create compose configuration (HTTP ${HTTP_CODE})"
    echo "$RESPONSE_BODY"
    exit 1
fi

# Extract composeId from response
if check_jq; then
    COMPOSE_ID=$(echo "$RESPONSE_BODY" | jq -r '.composeId // .id // empty')
else
    # Fallback to grep/sed if jq not available
    COMPOSE_ID=$(echo "$RESPONSE_BODY" | grep -o '"composeId":"[^"]*"' | head -1 | sed 's/"composeId":"\([^"]*\)"/\1/')
    if [ -z "$COMPOSE_ID" ]; then
        COMPOSE_ID=$(echo "$RESPONSE_BODY" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\([^"]*\)"/\1/')
    fi
fi

if [ -z "$COMPOSE_ID" ]; then
    log_error "Failed to extract composeId from response"
    echo "$RESPONSE_BODY"
    exit 1
fi

log_info "Compose created with ID: ${COMPOSE_ID}"

# Step 2: Read docker-compose.yml from repository
log_info "Step 2: Reading docker-compose.yml from repository..."

# Path to compose file (relative to script location or repository root)
COMPOSE_FILE_PATH="../docker-compose.preview.yml"

# Check if file exists
if [ ! -f "$COMPOSE_FILE_PATH" ]; then
    log_error "Compose file not found: $COMPOSE_FILE_PATH"
    log_error "Expected location: .dokploy/docker-compose.preview.yml"
    exit 1
fi

# Read compose file content
COMPOSE_FILE=$(cat "$COMPOSE_FILE_PATH")

log_info "Compose file loaded from: $COMPOSE_FILE_PATH"

# Step 3: Update compose with docker-compose.yml content and environment variables
log_info "Step 3: Updating compose configuration with docker-compose.yml..."

# Environment variables for this specific preview deployment
# Note: DB_PASSWORD and BETTER_AUTH_SECRET are set at environment level in Dokploy
# and are automatically available to all deployments in that environment
APP_VERSION=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
ENV_VARS=$(cat <<EOF
GHCR_IMAGE=${GHCR_IMAGE}
IMAGE_TAG=${IMAGE_TAG}
APP_NAME=${COMPOSE_APP_NAME}
PREVIEW_DOMAIN=${PREVIEW_URL}
PREVIEW_ID=${PR_NUMBER}
APP_VERSION=${APP_VERSION}
OTEL_SERVICE_NAME=planner-web
DB_PASSWORD=\${{environment.DB_PASSWORD}}
BETTER_AUTH_SECRET=\${{environment.BETTER_AUTH_SECRET}}
OTEL_EXPORTER_OTLP_ENDPOINT=\${{environment.OTEL_EXPORTER_OTLP_ENDPOINT}}
OTEL_EXPORTER_OTLP_HEADERS=\${{environment.OTEL_EXPORTER_OTLP_HEADERS}}
EOF
)

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

log_info "Compose configuration updated successfully"

# Step 4: Deploy the compose
log_info "Step 4: Deploying compose stack..."

DEPLOY_PAYLOAD=$(cat <<EOF
{
  "composeId": "${COMPOSE_ID}"
}
EOF
)

DEPLOY_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "${DOKPLOY_URL}/api/compose.deploy" \
  -H "x-api-key: ${DOKPLOY_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${DEPLOY_PAYLOAD}")

HTTP_CODE=$(echo "$DEPLOY_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$DEPLOY_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "200" ]; then
    log_error "Failed to deploy compose (HTTP ${HTTP_CODE})"
    echo "$RESPONSE_BODY"
    exit 1
fi

log_info "Deployment initiated successfully"

# Step 5: Wait for deployment to complete (poll deployment status)
log_info "Step 5: Waiting for deployment to complete..."

MAX_WAIT=300  # 5 minutes
WAIT_INTERVAL=10
ELAPSED=0

while [ $ELAPSED -lt $MAX_WAIT ]; do
    sleep $WAIT_INTERVAL
    ELAPSED=$((ELAPSED + WAIT_INTERVAL))

    # Check deployment status
    STATUS_RESPONSE=$(curl -s \
      "${DOKPLOY_URL}/api/compose.one?composeId=${COMPOSE_ID}" \
      -H "x-api-key: ${DOKPLOY_API_TOKEN}")

    if check_jq; then
        STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.composeStatus // "unknown"')
    else
        STATUS=$(echo "$STATUS_RESPONSE" | grep -o '"composeStatus":"[^"]*"' | sed 's/"composeStatus":"\([^"]*\)"/\1/')
    fi

    log_info "Deployment status: ${STATUS} (${ELAPSED}s elapsed)"

    if [ "$STATUS" = "done" ]; then
        log_info "Deployment completed successfully!"
        break
    elif [ "$STATUS" = "error" ]; then
        log_error "Deployment failed"

        # Fetch deployment logs for debugging
        log_info "Fetching deployment logs..."

        # Get recent deployments
        DEPLOYMENTS_RESPONSE=$(curl -s \
          "${DOKPLOY_URL}/api/deployment.allByCompose?composeId=${COMPOSE_ID}" \
          -H "x-api-key: ${DOKPLOY_API_TOKEN}")

        # Get the latest deployment ID
        if check_jq; then
            LATEST_DEPLOYMENT_ID=$(echo "$DEPLOYMENTS_RESPONSE" | jq -r '.[0].deploymentId // empty')
        else
            LATEST_DEPLOYMENT_ID=$(echo "$DEPLOYMENTS_RESPONSE" | grep -o '"deploymentId":"[^"]*"' | head -1 | sed 's/"deploymentId":"\([^"]*\)"/\1/')
        fi

        if [ -n "$LATEST_DEPLOYMENT_ID" ]; then
            log_info "Latest deployment ID: ${LATEST_DEPLOYMENT_ID}"

            # Fetch deployment logs (build/deploy process logs, not runtime logs)
            echo ""
            echo "=== Deployment Logs ==="

            # Get deployment details which should include logs
            DEPLOYMENT_DETAILS=$(curl -s \
              "${DOKPLOY_URL}/api/deployment.one?deploymentId=${LATEST_DEPLOYMENT_ID}" \
              -H "x-api-key: ${DOKPLOY_API_TOKEN}" 2>/dev/null || echo "")

            # Extract logs from deployment details
            if check_jq && [ -n "$DEPLOYMENT_DETAILS" ]; then
                LOGS=$(echo "$DEPLOYMENT_DETAILS" | jq -r '.logPath // .logs // empty')

                if [ -n "$LOGS" ] && [ "$LOGS" != "null" ]; then
                    # If logs are a path, try to fetch them
                    if [[ "$LOGS" == /* ]] || [[ "$LOGS" == http* ]]; then
                        log_warn "Logs available at: $LOGS"
                        log_warn "Check Dokploy UI for full deployment logs"
                    else
                        # Logs are inline, display them
                        echo "$LOGS" | tail -50
                    fi
                else
                    # Try to get logs via deployment logs endpoint
                    LOGS=$(curl -s \
                      "${DOKPLOY_URL}/api/deployment.logs?deploymentId=${LATEST_DEPLOYMENT_ID}" \
                      -H "x-api-key: ${DOKPLOY_API_TOKEN}" 2>/dev/null || echo "")

                    if [ -n "$LOGS" ] && [ "$LOGS" != '{"message":"Not found","code":"NOT_FOUND"}' ]; then
                        echo "$LOGS" | tail -50
                    else
                        log_warn "Deployment logs not available via API"
                        log_warn "Check Dokploy UI: ${DOKPLOY_URL}/dashboard/project/${PROJECT_ID}/services/compose/${COMPOSE_ID}?tab=deployments"
                    fi
                fi
            else
                log_warn "Could not fetch deployment details"
                log_warn "Check Dokploy UI: ${DOKPLOY_URL}/dashboard/project/${PROJECT_ID}/services/compose/${COMPOSE_ID}?tab=deployments"
            fi
            echo "======================="
            echo ""
        fi

        exit 1
    fi
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
    log_warn "Deployment timeout after ${MAX_WAIT}s"
    log_warn "Check deployment status manually: ${DOKPLOY_URL}"
fi

# Output summary
echo ""
log_info "=========================================="
log_info "Preview Deployment Created Successfully"
log_info "=========================================="
echo "PR Number:     ${PR_NUMBER}"
echo "Compose ID:    ${COMPOSE_ID}"
echo "Compose Name:  ${COMPOSE_NAME}"
echo "Preview URL:   https://${PREVIEW_URL}"
echo "Image Tag:     ${GHCR_IMAGE}:${IMAGE_TAG}"
echo ""
log_info "Next steps:"
echo "  1. Wait for DNS to propagate (if first deployment)"
echo "  2. Access preview: https://${PREVIEW_URL}"
echo "  3. Update deployment: ./update-preview.sh ${PR_NUMBER}"
echo "  4. Delete preview: ./delete-preview.sh ${PR_NUMBER}"
echo ""
