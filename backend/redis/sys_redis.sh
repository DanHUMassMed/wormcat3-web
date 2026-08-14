#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYS_UTILS="$SCRIPT_DIR/../../scripts/sys_utils.sh"

set_config() {
    PORT="6379"
    SEARCH_PROCESS="redis-ser"
    PROCESS_NAME="Redis-server"
    PROCESS_EXE="${SCRIPT_DIR}/run_redis.sh"
    LOG_PATH="$HOME/var/log"
    LOG_FILE="$LOG_PATH/redis.log"
}

set_config
source "$SYS_UTILS"
handle_action "$1"
