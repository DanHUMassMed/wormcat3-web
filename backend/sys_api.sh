#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYS_UTILS="$SCRIPT_DIR/../scripts/sys_utils.sh"

PORT="8000"
SEARCH_PROCESS="gunicorn"

PROCESS_NAME="Fast API"
PROCESS_EXE="${SCRIPT_DIR}/run_api.sh"

LOG_PATH="$HOME/var/log"
LOG_FILE="$LOG_PATH/fast_api.log"

source "$SYS_UTILS"

ACTION=$1
handle_action "$ACTION"
