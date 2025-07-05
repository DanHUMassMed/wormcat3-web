#!/bin/bash

# Rotates the given log file by renaming it to <log_file>.0
rotate_logs() {
    local log_file="$1"

    if [ -z "$log_file" ]; then
        echo "Usage: rotate_logs <log_file_path>"
        return 1
    fi

    if [ -f "$log_file" ]; then
        mv "$log_file" "$log_file.0"
        echo "Rotated Log File: $log_file -> $log_file.0"
    fi
}

# Returns the PID(s) of a running process matching the given search string
get_process_id() {
    local search_process="$1"
    ps auxww | grep "$search_process" | grep -v grep | awk '{print $2}' | xargs
}

# Returns the PID of a process listening on a specific port
get_port_in_use() {
    local port="$1"

    if [ "$port" == "NONE" ]; then
        echo ""
        return 0
    fi

    lsof -i :${port} | grep LISTEN|grep IPv4| awk '{print $2}' | xargs
}

# Prints the full command that was used to start the process with the given PID
get_command_by_pid() {
    local pid="$1"

    if [ -z "$pid" ]; then
        echo "PID is empty."
        return 1
    fi
 
    ps -p "$pid" -o command
}

# Checks that all required environment variables are set
# Required: PORT, SEARCH_PROCESS, PROCESS_NAME, PROCESS_EXE, LOG_PATH, LOG_FILE
check_vars() {
    local missing=0

    for var_name in PORT SEARCH_PROCESS PROCESS_NAME PROCESS_EXE LOG_PATH LOG_FILE; do
        if [ -z "${!var_name}" ]; then
            echo "Error: Required variable $var_name is not set or empty"
            missing=1
        fi
    done

    return $missing
}

# Attempts to kill all provided PIDs safely with SIGKILL
safe_kill() {
    local error=0
    for pid in "$@"; do
        if [ -n "$pid" ]; then
            if kill -0 "$pid" 2>/dev/null; then
                kill -9 "$pid" 2>/dev/null || {
                    echo "Failed to kill PID $pid"
                    error=1
                }
            fi
        fi
    done
    return $error
}

# Starts the process if it's not already running
start() {
    if [ -z "${PROCESS_ID}" ]; then
	    if [ -n "${PORT_IN_USE}" ]; then
   	      echo "${PROCESS_NAME} port is in use by PID:[$PORT_IN_USE]."
            echo "Stopping process at ID:[${PORT_IN_USE}]."
            safe_kill ${PORT_IN_USE}
            sleep 4
        fi
        echo "Starting ${PROCESS_NAME} ..."
        mkdir -p "$LOG_PATH"
        rotate_logs "$LOG_FILE"

        nohup ${PROCESS_EXE} > "$LOG_FILE" 2>&1 &
        sleep 4
	     
	else
   	    echo "${PROCESS_NAME} is already running with process ID:[${PROCESS_ID}]"
	fi
}

# Stops the running process and any process using the same port
stop() {
	if [ -n "${PROCESS_ID}" ]; then
      echo "Stopping ${PROCESS_NAME} with PID:[${PROCESS_ID}]"
		safe_kill ${PROCESS_ID}
		safe_kill ${PORT_IN_USE}
	else
       echo "${PROCESS_NAME} is not running."
	    if [ -n "${PORT_IN_USE}" ]; then
   	    echo "However ${PROCESS_NAME} port is blocked. Stopping blocking process PID:[${PORT_IN_USE}]"
			 safe_kill ${PORT_IN_USE}
       fi
	fi

}

# Displays the current status of the process
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

# Handles the user-supplied action argument (START, STOP, RESTART, STATUS)
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
				PORT_IN_USE=$(get_port_in_use "$PORT")
				PROCESS_ID=$(get_process_id "$SEARCH_PROCESS")
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

# Check that all required variables are set
check_vars || exit 1

# Capture current port usage and process ID
PORT_IN_USE=$(get_port_in_use "$PORT")
PROCESS_ID=$(get_process_id "$SEARCH_PROCESS")
