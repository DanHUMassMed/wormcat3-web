#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_UTILS="$SCRIPT_DIR/../scripts/run_utils.sh"
source "$RUN_UTILS"

ensure_conda_env wormcat3-web

export WORMCAT_OUT_PATH="${HOME}/Code/Python/wormcat3-web/frontend/build/dynamic/wormcat_out"

celery -A celery_worker.celery worker --loglevel=info --concurrency=4
#celery -A celery_worker.celery worker --loglevel=info