#!/bin/bash
# .claude/hooks/stop-loop.sh
# Stop hook: タスク継続判定

# 標準入力からJSONを読み取り
INPUT=$(cat)

# task-queue確認 (簡易版: CLAUDE.mdの未完了タスクをチェック)
UNCHECKED=$(grep -c '\[ \]' "$CLAUDE_PROJECT_DIR/CLAUDE.md" 2>/dev/null || echo "0")

if [ "$UNCHECKED" -gt 0 ]; then
  echo '{"decision": "block", "reason": "未完了タスクが '$UNCHECKED' 件あります。継続してください。"}'
else
  echo '{}'
fi
