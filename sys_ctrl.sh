#!/bin/bash

action=$(echo "$1" | tr '[:upper:]' '[:lower:]')

if [ -z "$action" ]; then
    action="status"
fi

case "$action" in
    start|stop|status)
        (
            cd ./backend || exit
            ./sys_prefect.sh "$action"
            ./sys_api.sh "$action"
        )
        (
            cd ./frontend || exit
            ./sys_react.sh "$action"
        )
        ;;
    *)
        echo "Invalid action: $action"
        echo "Usage: manage {start|stop|status}"
        return 1
        ;;
esac
