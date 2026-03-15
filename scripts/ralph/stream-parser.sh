#!/bin/bash
# Parse Claude Code stream-json output and extract human-readable content
# Usage: claude ... --output-format stream-json | ./stream-parser.sh

while IFS= read -r line; do
  # Skip empty lines
  [[ -z "$line" ]] && continue

  # Extract type
  type=$(echo "$line" | jq -r '.type // empty' 2>/dev/null)

  case "$type" in
    system)
      subtype=$(echo "$line" | jq -r '.subtype // empty' 2>/dev/null)
      if [[ "$subtype" == "init" ]]; then
        echo "Claude Code initialized"
      fi
      ;;
    assistant)
      # Extract text content from assistant messages
      text=$(echo "$line" | jq -r '.message.content[]? | select(.type == "text") | .text // empty' 2>/dev/null)
      if [[ -n "$text" ]]; then
        echo "$text"
      fi
      # Extract tool use
      tool=$(echo "$line" | jq -r '.message.content[]? | select(.type == "tool_use") | "\(.name): \(.input.command // .input.file_path // .input.pattern // "...")"' 2>/dev/null)
      if [[ -n "$tool" ]]; then
        echo "TOOL: $tool"
      fi
      ;;
    user)
      # Tool results - show abbreviated
      result=$(echo "$line" | jq -r '.tool_use_result.stdout // empty' 2>/dev/null | head -c 200)
      if [[ -n "$result" ]]; then
        echo "[output: ${#result} chars]"
      fi
      ;;
    result)
      subtype=$(echo "$line" | jq -r '.subtype // empty' 2>/dev/null)
      duration=$(echo "$line" | jq -r '.duration_ms // 0' 2>/dev/null)
      cost=$(echo "$line" | jq -r '.total_cost_usd // 0' 2>/dev/null)
      if [[ "$subtype" == "success" ]]; then
        echo "Completed in ${duration}ms (\$${cost})"
      else
        echo "Failed: $subtype"
      fi
      ;;
  esac
done
