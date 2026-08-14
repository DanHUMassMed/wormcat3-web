#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

if command -v redis-server >/dev/null 2>&1; then
    exec redis-server
elif [ -x "/opt/homebrew/bin/redis-server" ]; then
    exec /opt/homebrew/bin/redis-server
elif [ -x "/usr/local/bin/redis-server" ]; then
    exec /usr/local/bin/redis-server
elif [ -x "$SCRIPT_DIR/redis-stable/src/redis-server" ]; then
    exec "$SCRIPT_DIR/redis-stable/src/redis-server"
else
    echo "Downloading and compiling local redis-stable..."
    if [ ! -d "redis-stable/src" ]; then
        curl -O http://download.redis.io/redis-stable.tar.gz
        tar xvzf redis-stable.tar.gz
        rm -f redis-stable.tar.gz
    fi
    cd redis-stable || exit 1
    make -j4
    exec src/redis-server
fi
