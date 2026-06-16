#!/usr/bin/env bash
# Builds the React SPA and copies the output into the API's wwwroot so a single
# App Service can serve both the API and the UI. Invoked by the azd prepackage hook
# and by the GitHub Actions workflow.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"            # ltl-order-management
FRONTEND="$ROOT/frontend"
WWWROOT="$ROOT/backend/LtlOrderManagement.Api/wwwroot"

echo "==> Building React app in $FRONTEND"
cd "$FRONTEND"
npm ci
npm run build

echo "==> Copying dist into $WWWROOT"
rm -rf "$WWWROOT"
mkdir -p "$WWWROOT"
cp -r dist/. "$WWWROOT/"

echo "==> Frontend bundled into API wwwroot."
