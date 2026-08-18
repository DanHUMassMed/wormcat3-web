#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"
RUN_UTILS="$SCRIPT_DIR/../scripts/run_utils.sh"
source "$RUN_UTILS"

ensure_uv_env

export WORMCAT_LOG_LEVEL="INFO"
export WORMCAT_LOG_PATH="$LOG_DIR/wormcat3.log"

celery -A celery_worker.celery_app worker -Q wormcat3_web --loglevel=info --concurrency=4

