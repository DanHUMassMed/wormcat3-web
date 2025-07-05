#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYS_UTILS="$SCRIPT_DIR/../../scripts/sys_utils.sh"

#------------------------------------------------------------------------------
# set_config
#
# Sets environment-specific configuration variables required by sys_utils.sh
# These include:
#   - SEARCH_PROCESS: Substring used to identify the running process in ps auxww output
#   - PROCESS_NAME: Friendly name used in logs and print output
#   - PORT: Port the process listens on
#   - PROCESS_EXE: Path to the script used to start process
#   - LOG_PATH: Directory where logs will be stored
#   - LOG_FILE: Full path to the log file
#
# This function allows the script to encapsulate configuration cleanly
#------------------------------------------------------------------------------
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

