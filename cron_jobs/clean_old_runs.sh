#!/bin/bash

# This tab entry runs daily at 3:30 AM
# 30 3 * * * /path/to/cleanup_old_runs.sh

set -euo pipefail
IFS=$'\n\t'

# Configuration
TARGET_DIR="/Users/dan/Code/Python/wormcat3-web/frontend/build/dynamic/wormcat_out"
DAYS_OLD=7

# Logging
LOG_FILE="/tmp/cleanup_wormcat_out.log"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
echo "[$TIMESTAMP] Cleanup started for $TARGET_DIR (files/dirs older than $DAYS_OLD days)" >> "$LOG_FILE"

# Sanity check
if [[ ! -d "$TARGET_DIR" ]]; then
  echo "[$TIMESTAMP] ERROR: Target directory does not exist: $TARGET_DIR" >> "$LOG_FILE"
  exit 1
fi

# Compute find-compatible age (N-1)
FIND_AGE="+$((DAYS_OLD - 1))"

# 1. Delete zip files older than DAYS_OLD days
ZIP_FILES=($(find "$TARGET_DIR" -type f -name "*.zip" -mtime "$FIND_AGE"))
ZIP_COUNT=${#ZIP_FILES[@]}
echo "[$TIMESTAMP] Found $ZIP_COUNT .zip file(s) to delete." >> "$LOG_FILE"

if [[ $ZIP_COUNT -gt 0 ]]; then
  printf "%s\n" "${ZIP_FILES[@]}" >> "$LOG_FILE"
  printf "%s\n" "${ZIP_FILES[@]}" | xargs -I{} rm -f "{}"
fi

# 2. Delete matching _12345 directories older than DAYS_OLD days
OLD_DIRS=($(find "$TARGET_DIR" -type d -regex ".*/.*_[0-9]\{5\}$" -mtime "$FIND_AGE"))
DIR_COUNT=${#OLD_DIRS[@]}
echo "[$TIMESTAMP] Found $DIR_COUNT matching _xxxxx directory(ies) to delete." >> "$LOG_FILE"

if [[ $DIR_COUNT -gt 0 ]]; then
  printf "%s\n" "${OLD_DIRS[@]}" >> "$LOG_FILE"
  printf "%s\n" "${OLD_DIRS[@]}" | xargs -I{} rm -rf "{}"
fi

TIMESTAMP_END=$(date "+%Y-%m-%d %H:%M:%S")
echo "[$TIMESTAMP_END] Cleanup complete." >> "$LOG_FILE"