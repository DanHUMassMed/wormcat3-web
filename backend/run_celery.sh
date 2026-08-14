#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_UTILS="$SCRIPT_DIR/../scripts/run_utils.sh"
source "$RUN_UTILS"

ensure_uv_env

export WORMCAT_LOG_LEVEL="INFO"
export WORMCAT_LOG_PATH="${HOME}/var/log/wormcat3.log"

celery -A celery_worker.celery_app worker --loglevel=info --concurrency=4
