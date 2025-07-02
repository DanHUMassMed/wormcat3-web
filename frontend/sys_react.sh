#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYS_UTILS="$SCRIPT_DIR/../scripts/sys_utils.sh"

PORT="9000"
SEARCH_PROCESS="node server.js"

PROCESS_NAME="ReactJS"
PROCESS_EXE="${SCRIPT_DIR}/run_react.sh"

LOG_PATH="$HOME/var/log"
LOG_FILE="$LOG_PATH/react.log"

source "$SYS_UTILS"

ACTION=$1
handle_action "$ACTION"
