#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_PATH="$HOME/var/log"

PORT_IN_USE=`lsof -i :6379 | grep LISTEN|grep IPv4| awk '{print $2}' | xargs`
PROCESS_ID=`ps auxww|grep redis-ser|grep -v grep| awk '{print $2}' | xargs`
PROCESS_NAME="Redis-server"
PROCESS_EXE="${SCRIPT_DIR}/run_redis.sh"
LOG_FILE="$LOG_PATH/redis.log"

LOG_BASE="$(basename "$LOG_FILE" .log)"
TIMESTAMP=$(date +"%Y-%m-%d_%H%M-%S")
#BACKUP_FILE="$LOG_PATH/${LOG_BASE}_$TIMESTAMP.log"
BACKUP_FILE="$LOG_PATH/${LOG_BASE}.log.0"

action=$(echo "$1" | tr '[:lower:]' '[:upper:]')

if [ -z "$action" ]; then
    action="STATUS"
fi

start() {
    if [ -z "${PROCESS_ID}" ]; then
	    if [ -n "${PORT_IN_USE}" ]; then
   	        echo "${PROCESS_NAME} port is in use by PID:[$PORT_IN_USE]."
            echo "Stopping process at ID:[${PORT_IN_USE}]."
            kill -9 ${PORT_IN_USE}
            sleep 5
        fi
        echo "Starting ${PROCESS_NAME} ..."
        mkdir -p "$LOG_PATH"
        if [ -f "$LOG_FILE" ]; then
            mv "$LOG_FILE" "$BACKUP_FILE"
        fi
        nohup ${PROCESS_EXE} > "$LOG_FILE" 2>&1 &
        sleep 5
	     
	else
   	    echo "${PROCESS_NAME} is already running with process ID:[${PROCESS_ID}]"
	fi
}


stop() {
	if [ -n "${PROCESS_ID}" ]; then
   	    echo "Stopping ${PROCESS_NAME} ID:[${PROCESS_ID}]"
		kill -9 ${PROCESS_ID}
	else
   	    echo "${PROCESS_NAME}} is not running."
	    if [ -n "${PORT_IN_USE}" ]; then
   	        echo "However ${PROCESS_NAME} port is blocked Stopping process PID:[${PORT_IN_USE}]"
			kill -9 ${PORT_IN_USE}
       fi
	fi

}

status() {
    if [ -z "${PROCESS_ID}" ]; then
        echo "${PROCESS_NAME} is not running."
        if [ -n "${PORT_IN_USE}" ]; then
            echo "However ${PROCESS_NAME} Port is blocked by PID:$PORT_IN_USE"
            BLOCKING_PROCESS="$(ps -p "${PORT_IN_USE}" -o command)"
            echo "Command: $BLOCKING_PROCESS"
        fi
    else
        echo "${PROCESS_NAME} is running with process ID:[${PROCESS_ID}]."
    fi
}

case "$action" in
    "START")
        start
        ;;
    "RESTART")
		stop
        PORT_IN_USE=""
        PROCESS_ID=""
        sleep 5
        start
        ;;
    "STATUS")
        status
        ;;
    "STOP")
		  stop
        ;;
    *)
        echo "Unknown action: $action"
        echo "Usage $0 [START | STOP | RESTART | STATUS]"
        ;;
esac
