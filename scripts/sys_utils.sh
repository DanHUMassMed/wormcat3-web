#!/bin/bash


rotate_logs() {
    [ -f "$LOG_FILE" ] && mv "$LOG_FILE" "$LOG_FILE.0"
}

get_process_id() {
    local search_process="$1"
    ps auxww | grep "$search_process" | grep -v grep | awk '{print $2}' | xargs
}

get_port_in_use() {
    local port="$1"

    if [ "$port" == "NONE" ]; then
        echo ""
        return 0
    fi

    lsof -i :${port} | grep LISTEN|grep IPv4| awk '{print $2}' | xargs
}

get_command_by_pid() {
    local pid="$1"

    if [ -z "$pid" ]; then
        echo "PID is empty."
        return 1
    fi
 
    ps -p "$pid" -o command
}

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
        rotate_logs

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
            echo "However ${PROCESS_NAME} Port ${PORT} is blocked by PID: $PORT_IN_USE"
            BLOCKING_PROCESS="$(get_command_by_pid "${PORT_IN_USE}")"
            echo "Command: $BLOCKING_PROCESS"
        fi
    else
        echo "${PROCESS_NAME} is running with process ID:[${PROCESS_ID}]."
    fi
}


handle_action() {
    local raw_action="$1"

    if [ -z "$raw_action" ]; then
        raw_action="STATUS"
    fi

    local action
    action=$(echo "$raw_action" | tr '[:lower:]' '[:upper:]')

    case "$action" in
        "START")
            start
            ;;
        "RESTART")
            stop
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
            echo "Usage: $0 [START | STOP | RESTART | STATUS]"
            ;;
    esac
}

PORT_IN_USE=$(get_port_in_use "$PORT")
PROCESS_ID=$(get_process_id "$SEARCH_PROCESS")
PID_FILE="$LOG_PATH/${PROCESS_EXE##*/}.pid"
