#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_UTILS="$SCRIPT_DIR/../scripts/run_utils.sh"
source "$RUN_UTILS"

ensure_uv_env

export WORMCAT_OUT_PATH="${HOME}/Code/Python/wormcat3-web/frontend/build/dynamic/wormcat_out"

# Start Prefect local ephemeral server or worker
prefect server start --host 127.0.0.1 --port 4200
