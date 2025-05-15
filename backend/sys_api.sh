#!/bin/bash

PORT_IN_USE=`lsof -i :8000 | grep LISTEN|grep IPv4| awk '{print $2}' | xargs`
PROCESS_ID=`ps auxww|grep gunicorn|grep -v grep| awk '{print $2}' | xargs`
PROCESS_NAME="Fast API"
PROCESS_EXE="./run_api.sh"
#ps -p 53803 -o command


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
        nohup ${PROCESS_EXE} > /dev/null 2>&1 &
	     
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
