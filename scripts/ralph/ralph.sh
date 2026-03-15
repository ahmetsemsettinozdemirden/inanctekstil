#!/bin/bash
# Ralph Wiggum - Autonomous AI agent loop (v2 - adaptive)
# Usage: ./ralph.sh [--tool amp|claude] [--timeout SECONDS] [--dir DIR] [max_iterations]

set -e

# Parse arguments
TOOL="claude"
MAX_ITERATIONS=10
ITERATION_TIMEOUT=3600  # 1 hour default per iteration
STUCK_THRESHOLD=300     # 5 minutes without output = stuck
WORK_DIR=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --tool)
      TOOL="$2"
      shift 2
      ;;
    --tool=*)
      TOOL="${1#*=}"
      shift
      ;;
    --timeout)
      ITERATION_TIMEOUT="$2"
      shift 2
      ;;
    --timeout=*)
      ITERATION_TIMEOUT="${1#*=}"
      shift
      ;;
    --dir)
      WORK_DIR="$2"
      shift 2
      ;;
    --dir=*)
      WORK_DIR="${1#*=}"
      shift
      ;;
    *)
      if [[ "$1" =~ ^[0-9]+$ ]]; then
        MAX_ITERATIONS="$1"
      fi
      shift
      ;;
  esac
done

# Validate tool choice
if [[ "$TOOL" != "amp" && "$TOOL" != "claude" ]]; then
  echo "Error: Invalid tool '$TOOL'. Must be 'amp' or 'claude'."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR/../.."

# WORK_DIR holds prd.json, CLAUDE.md, progress.txt (defaults to SCRIPT_DIR)
if [ -n "$WORK_DIR" ]; then
  WORK_DIR="$(cd "$WORK_DIR" && pwd)"
else
  WORK_DIR="$SCRIPT_DIR"
fi

PRD_FILE="$WORK_DIR/prd.json"
PROGRESS_FILE="$WORK_DIR/progress.txt"
ARCHIVE_DIR="$WORK_DIR/archive"
LAST_BRANCH_FILE="$WORK_DIR/.last-branch"
LIVE_OUTPUT="$WORK_DIR/.live-output"
WATCHDOG_PID_FILE="$WORK_DIR/.watchdog-pid"

# Cleanup function
cleanup() {
  # Kill watchdog if running
  if [ -f "$WATCHDOG_PID_FILE" ]; then
    kill $(cat "$WATCHDOG_PID_FILE") 2>/dev/null || true
    rm -f "$WATCHDOG_PID_FILE"
  fi
  rm -f "$LIVE_OUTPUT"
}
trap cleanup EXIT

# Watchdog function - monitors for stuck processes
watchdog() {
  local pid=$1
  local timeout=$2
  local stuck_threshold=$3
  local output_file=$4
  local start_time=$(date +%s)
  local last_size=0
  local last_change_time=$start_time

  while kill -0 $pid 2>/dev/null; do
    sleep 5
    local now=$(date +%s)
    local elapsed=$((now - start_time))

    # Check total timeout
    if [ $elapsed -ge $timeout ]; then
      echo ""
      echo "WATCHDOG: Iteration timeout ($timeout seconds). Killing process..."
      kill -9 $pid 2>/dev/null || true
      return 1
    fi

    # Check for stuck (no output change)
    if [ -f "$output_file" ]; then
      local current_size=$(stat -f%z "$output_file" 2>/dev/null || stat -c%s "$output_file" 2>/dev/null || echo 0)
      if [ "$current_size" != "$last_size" ]; then
        last_size=$current_size
        last_change_time=$now
      else
        local stuck_time=$((now - last_change_time))
        if [ $stuck_time -ge $stuck_threshold ]; then
          echo ""
          echo "WATCHDOG: No output for $stuck_time seconds. Process may be stuck."
          if [ $stuck_time -ge $((stuck_threshold * 2)) ]; then
            echo "WATCHDOG: Extended stuck period. Force killing..."
            kill -9 $pid 2>/dev/null || true
            return 2
          fi
        fi
      fi
    fi
  done
  return 0
}

# Archive previous run if branch changed
if [ -f "$PRD_FILE" ] && [ -f "$LAST_BRANCH_FILE" ]; then
  CURRENT_BRANCH=$(jq -r '.branchName // empty' "$PRD_FILE" 2>/dev/null || echo "")
  LAST_BRANCH=$(cat "$LAST_BRANCH_FILE" 2>/dev/null || echo "")

  if [ -n "$CURRENT_BRANCH" ] && [ -n "$LAST_BRANCH" ] && [ "$CURRENT_BRANCH" != "$LAST_BRANCH" ]; then
    DATE=$(date +%Y-%m-%d)
    FOLDER_NAME=$(echo "$LAST_BRANCH" | sed 's|^ralph/||')
    ARCHIVE_FOLDER="$ARCHIVE_DIR/$DATE-$FOLDER_NAME"

    echo "Archiving previous run: $LAST_BRANCH"
    mkdir -p "$ARCHIVE_FOLDER"
    [ -f "$PRD_FILE" ] && cp "$PRD_FILE" "$ARCHIVE_FOLDER/"
    [ -f "$PROGRESS_FILE" ] && cp "$PROGRESS_FILE" "$ARCHIVE_FOLDER/"

    echo "# Ralph Progress Log" > "$PROGRESS_FILE"
    echo "Started: $(date)" >> "$PROGRESS_FILE"
    echo "---" >> "$PROGRESS_FILE"
  fi
fi

# Track current branch
if [ -f "$PRD_FILE" ]; then
  CURRENT_BRANCH=$(jq -r '.branchName // empty' "$PRD_FILE" 2>/dev/null || echo "")
  if [ -n "$CURRENT_BRANCH" ]; then
    echo "$CURRENT_BRANCH" > "$LAST_BRANCH_FILE"
  fi
fi

# Initialize progress file
if [ ! -f "$PROGRESS_FILE" ]; then
  echo "# Ralph Progress Log" > "$PROGRESS_FILE"
  echo "Initialized: $(date)" >> "$PROGRESS_FILE"
  echo "---" >> "$PROGRESS_FILE"
fi

echo "Starting Ralph v2 (adaptive)"
echo "   Tool: $TOOL"
echo "   Work dir: $WORK_DIR"
echo "   Max iterations: $MAX_ITERATIONS"
echo "   Iteration timeout: ${ITERATION_TIMEOUT}s"
echo "   Stuck threshold: ${STUCK_THRESHOLD}s"
echo ""

cd "$PROJECT_DIR" || exit 1

for i in $(seq 1 $MAX_ITERATIONS); do
  echo "==============================================================="
  echo "  Ralph Iteration $i of $MAX_ITERATIONS ($TOOL)"
  echo "==============================================================="

  # Clear live output file
  > "$LIVE_OUTPUT"

  # Run the selected tool
  unset CLAUDECODE 2>/dev/null || true
  if [[ "$TOOL" == "amp" ]]; then
    cat "$WORK_DIR/prompt.md" | amp --dangerously-allow-all 2>&1 | tee "$LIVE_OUTPUT" &
    TOOL_PID=$!
  else
    cat "$WORK_DIR/CLAUDE.md" | env -u CLAUDECODE claude --dangerously-skip-permissions --print --verbose --output-format stream-json 2>&1 | \
      tee "$LIVE_OUTPUT.json" | \
      "$SCRIPT_DIR/stream-parser.sh" | \
      tee "$LIVE_OUTPUT" &
    TOOL_PID=$!
  fi

  # Start watchdog in background
  watchdog $TOOL_PID $ITERATION_TIMEOUT $STUCK_THRESHOLD "$LIVE_OUTPUT" &
  WATCHDOG_PID=$!
  echo $WATCHDOG_PID > "$WATCHDOG_PID_FILE"

  # Wait for tool to complete
  wait $TOOL_PID 2>/dev/null
  TOOL_EXIT=$?

  # Kill watchdog
  kill $WATCHDOG_PID 2>/dev/null || true
  rm -f "$WATCHDOG_PID_FILE"

  # Read output
  OUTPUT=$(cat "$LIVE_OUTPUT" 2>/dev/null || echo "")
  OUTPUT_RAW=$(cat "$LIVE_OUTPUT.json" 2>/dev/null || echo "")

  # Check for completion signal
  if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>" || \
     echo "$OUTPUT_RAW" | grep -q "<promise>COMPLETE</promise>"; then
    echo ""
    echo "Ralph completed all tasks!"
    echo "   Completed at iteration $i of $MAX_ITERATIONS"
    exit 0
  fi

  # Check for errors
  if [ $TOOL_EXIT -ne 0 ]; then
    echo ""
    echo "Tool exited with code $TOOL_EXIT"
    if echo "$OUTPUT" | grep -q "WATCHDOG"; then
      echo "   (Killed by watchdog - will retry)"
    fi
  fi

  echo ""
  echo "Iteration $i complete. Checking progress..."

  # Show story status
  if [ -f "$PRD_FILE" ]; then
    PASSED=$(jq '[.userStories[] | select(.passes == true)] | length' "$PRD_FILE" 2>/dev/null || echo "?")
    TOTAL=$(jq '.userStories | length' "$PRD_FILE" 2>/dev/null || echo "?")
    echo "   Stories: $PASSED/$TOTAL passed"
  fi

  sleep 2
done

echo ""
echo "Ralph reached max iterations ($MAX_ITERATIONS)"
echo "   Check $PROGRESS_FILE for status"
exit 1
