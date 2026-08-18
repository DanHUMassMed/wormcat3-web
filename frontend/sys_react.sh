#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"
SYS_UTILS="$SCRIPT_DIR/../scripts/sys_utils.sh"

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
action="$1"
mode="$2"

set_config() {
    PORT="9001"
    if [ "$mode" == "dev" ]; then
        SEARCH_PROCESS="craco"
        PROCESS_NAME="ReactJS (Dev)"
        PROCESS_EXE="${SCRIPT_DIR}/run_react.sh dev"
    else
        SEARCH_PROCESS="node server.js"
        PROCESS_NAME="ReactJS (Prod)"
        PROCESS_EXE="${SCRIPT_DIR}/run_react.sh prod"
    fi
    LOG_PATH="$LOG_DIR"
    LOG_FILE="$LOG_PATH/react.log"
}

set_config
source "$SYS_UTILS"
handle_action "$action"
