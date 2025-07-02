#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYS_UTILS="$SCRIPT_DIR/../scripts/sys_utils.sh"


PORT="NONE"
SEARCH_PROCESS="bin/celery"

PROCESS_NAME="Celery Server"
PROCESS_EXE="${SCRIPT_DIR}/run_celery.sh"

LOG_PATH="$HOME/var/log"
LOG_FILE="$LOG_PATH/celery.log"

source "$SYS_UTILS"

ACTION=$1
handle_action "$ACTION"
