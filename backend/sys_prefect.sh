#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYS_UTILS="$SCRIPT_DIR/../scripts/sys_utils.sh"

set_config() {
    PORT="4200"
    SEARCH_PROCESS="run_prefect.sh"
    PROCESS_NAME="Prefect Server"
    PROCESS_EXE="${SCRIPT_DIR}/run_prefect.sh"
    LOG_PATH="$HOME/var/log"
    LOG_FILE="$LOG_PATH/prefect.log"
}

set_config
source "$SYS_UTILS"
handle_action "$1"
