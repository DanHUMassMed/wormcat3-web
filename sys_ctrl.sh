#!/bin/bash

action=$(echo "$1" | tr '[:upper:]' '[:lower:]')
mode=$(echo "$2" | tr '[:upper:]' '[:lower:]')

if [ -z "$action" ]; then
    action="status"
fi

case "$action" in
    start|stop|status)
        (
            cd ./backend || exit
            ./redis/sys_redis.sh "$action"
            ./sys_celery.sh "$action"
            ./sys_api.sh "$action"
        )
        (
            cd ./frontend || exit
            ./sys_react.sh "$action" "$mode"
        )
        ;;
    *)
        echo "Invalid action: $action"
        echo "Usage: manage {start|stop|status} [dev|prod]"
        return 1
        ;;
esac
