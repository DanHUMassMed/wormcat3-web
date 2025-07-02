#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_UTILS="$SCRIPT_DIR/../scripts/run_utils.sh"
source "$RUN_UTILS"

ensure_conda_env wormcat3-web

if [ "$1" == "dev" ]; then
    npm run start
else
    npm run build
    node server.js
fi
