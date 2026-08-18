#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"
SYS_UTILS="$SCRIPT_DIR/../scripts/sys_utils.sh"

set_config() {
    PORT="NONE"
    SEARCH_PROCESS="celery_worker"
    PROCESS_NAME="Celery Worker"
    PROCESS_EXE="${SCRIPT_DIR}/run_celery.sh"
    LOG_PATH="$LOG_DIR"
    LOG_FILE="$LOG_PATH/celery.log"
}

set_config
source "$SYS_UTILS"
handle_action "$1"
