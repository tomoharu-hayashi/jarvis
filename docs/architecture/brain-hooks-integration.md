# Claude Code + Brain Server 完全設定ガイド

> **目的**: プロジェクトの完全自動化（自走）

---

## 設定ファイル構成

```
~/.claude/
├── settings.json          # ユーザー設定（全プロジェクト共通）
├── agents/                # ユーザーSubagent
├── commands/              # ユーザースラッシュコマンド
└── CLAUDE.md              # グローバル指示

.claude/
├── settings.json          # プロジェクト設定（チーム共有）
├── settings.local.json    # ローカル設定（gitignore）
├── agents/                # プロジェクトSubagent
├── commands/              # プロジェクトスラッシュコマンド
├── hooks/                 # Hookスクリプト
└── CLAUDE.md              # プロジェクト指示

.mcp.json                  # MCP Server設定
```

---

## 核心コンセプト

```
Brain Server = 統合記憶 (Tool / Agent / Skill / Pattern)
Hooks = イベント駆動の監視・制御
CLAUDE.md = プロジェクトルール・コンテキスト
```

---

## アーキテクチャ

```
┌─────────────────────────────────────────┐
│            Brain Server                  │
│  ・Tool定義 (動的発見)                   │
│  ・Agent定義 (Subagent)                  │
│  ・Skill (手順記憶)                      │
│  ・Pattern (成功/失敗学習)               │
│  ・Task Queue (タスク管理)               │
└─────────────────────────────────────────┘
         ↑ search/get        ↑ create/update
         │                   │
┌────────┴───────────────────┴────────────┐
│               Hooks                      │
│  SessionStart → 関連記憶ロード           │
│  PreToolUse   → 危険操作ブロック         │
│  PostToolUse  → 結果学習                 │
│  PreCompact   → 状態保存 (自動要約)      │
│  Stop         → 次タスク継続判定         │
└─────────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────┐
│            Root Agent                    │
│  ・必要な記憶のみコンテキストに注入      │
│  ・Subagentに委譲                        │
│  ・結果はHooksが自動学習                 │
└─────────────────────────────────────────┘
```

---

## Brain Server: 記憶の種類

| 種類 | 命名規則 | 用途 |
|------|----------|------|
| Tool | `tool-*` | ツール定義 + 使用例 |
| Agent | `agent-*` | Subagent定義 |
| Skill | `skill-*` | 手順記憶 |
| Pattern | `pattern-*` | 成功/失敗パターン |
| Task | `task-queue` | 未完了タスクリスト |

---

## Hooks: 必須の3つ

### 1. PreCompact (状態保存)

```python
# Compact前に現在状態をBrain Serverに保存
# → 次ループで継続可能にする
brain_create(
    name=f"session-{session_id}",
    description="セッション状態",
    instructions="未完了タスク: ..."
)
```

### 2. Stop (継続判定)

```python
# タスク完了時に次タスクを確認
next_task = brain_get("task-queue")

if next_task:
    return {"decision": "block", "reason": f"次: {next_task}"}
else:
    return {}  # 終了許可
```

### 3. PostToolUse (学習)

```python
# 成功/失敗をBrain Serverに記録
if success:
    brain_update("pattern-success", content="...")
else:
    brain_update("pattern-failure", content="...")
```

---

## 自走ループ

```
1. タスク取得: brain_get("task-queue") or GitHub Issues
2. タスク実行: Root Agent + Subagents
3. コンテキスト監視: 80%超過でCompact警告
4. Compact時: PreCompact hookで状態保存
5. Stop時: 次タスク確認 → あれば継続
6. タスクなし: 終了 → 人間が新タスク投入まで待機
```

---

## 安全機構

| 機構 | 実装 |
|------|------|
| 無限ループ防止 | `stop_hook_active`フラグ + ループ回数上限 |
| コスト上限 | 日次$10上限で強制停止 |
| 承認ゲート | 本番デプロイ等は人間確認必須 |

---

## 設定ファイル

`.claude/settings.json`:

```json
{
  "hooks": {
    "PreCompact": [{"hooks": [{"type": "command", "command": ".claude/hooks/pre-compact.py"}]}],
    "Stop": [{"hooks": [{"type": "command", "command": ".claude/hooks/stop-loop.py"}]}],
    "PostToolUse": [{"matcher": ".*", "hooks": [{"type": "command", "command": ".claude/hooks/learn.py"}]}]
  }
}
```

---

## 人間の役割

1. **監視**: 進捗確認
2. **タスク投入**: 新タスクをtask-queueに追加
3. **承認**: 重要操作の許可

**それ以外は全てJARVISが自動実行**

---

## 1. CLAUDE.md (プロジェクト指示)

```markdown
# プロジェクト: JARVIS

## コマンド
- `npm run build`: ビルド
- `npm run test`: テスト実行
- `npm run lint`: Lint

## コードスタイル
- TypeScript使用
- ESModules (import/export)
- 関数型スタイル優先

## ワークフロー
- テスト駆動開発 (TDD)
- PR前にlint + test必須
- コミットはConventional Commits形式

## Brain Server活用
- タスク開始前: `brain_search` で過去経験を確認
- タスク完了後: `brain_create/update` で学習を記録
- Subagent定義: `agent-*` から動的取得
```

---

## 2. settings.json (完全版)

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run:*)",
      "Bash(git diff:*)",
      "Bash(git status:*)",
      "Bash(git log:*)",
      "Read(~/.claude/**)"
    ],
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)",
      "Bash(rm -rf:*)",
      "Bash(sudo:*)"
    ],
    "defaultMode": "default"
  },
  
  "env": {
    "NODE_ENV": "development"
  },
  
  "model": "claude-sonnet-4-5-20250929",
  
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume",
        "hooks": [{
          "type": "command",
          "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/session-start.sh"
        }]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{
          "type": "command",
          "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/validate-bash.py"
        }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": ".*",
        "hooks": [{
          "type": "command",
          "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/context-monitor.py"
        }]
      }
    ],
    "PreCompact": [
      {
        "matcher": "auto|manual",
        "hooks": [{
          "type": "command",
          "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/pre-compact.py",
          "timeout": 120
        }]
      }
    ],
    "Stop": [
      {
        "hooks": [{
          "type": "command",
          "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/stop-loop.py"
        }]
      }
    ]
  },
  
  "includeCoAuthoredBy": true,
  "cleanupPeriodDays": 30
}
```

---

## 3. MCP Server設定 (.mcp.json)

```json
{
  "mcpServers": {
    "brain": {
      "command": "uv",
      "args": ["run", "mcp-brain-server"],
      "env": {
        "BRAIN_DB_PATH": ".brain/memory.db"
      }
    },
    "desktop": {
      "command": "uv",
      "args": ["run", "mcp-desktop-server"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

---

## 4. Subagent定義 (.claude/agents/)

### security-reviewer.md

```markdown
---
name: security-reviewer
description: セキュリティレビュー。認証、入力検証、依存関係の脆弱性チェック。
tools: Read, Grep, Glob, Bash
model: sonnet
---

あなたはセキュリティ専門のコードレビュアーです。

## チェック項目
1. 認証/認可の脆弱性
2. SQLインジェクション
3. XSS
4. 依存関係の脆弱性 (npm audit)
5. シークレット露出

## 出力形式
- CRITICAL: 即修正必須
- WARNING: 修正推奨
- INFO: 検討事項
```

### code-reviewer.md

```markdown
---
name: code-reviewer
description: コード品質レビュー。変更後に自動実行。
tools: Read, Grep, Glob
model: inherit
---

あなたはシニアコードレビュアーです。

## レビュー観点
1. コードの簡潔さ・可読性
2. 命名規則の一貫性
3. 重複コードの排除
4. 適切なエラーハンドリング
5. テストカバレッジ
```

---

## 5. スラッシュコマンド (.claude/commands/)

### fix-issue.md

```markdown
GitHub Issue #$ARGUMENTS を修正してください。

1. `gh issue view $ARGUMENTS` で詳細確認
2. 関連コードを調査
3. 修正を実装
4. テストを実行
5. コミット＆PR作成
```

### daily-tasks.md

```markdown
今日のタスクを処理してください。

1. `brain_get("task-queue")` でタスク確認
2. 優先度順に実行
3. 完了したらtask-queueを更新
4. 全完了まで継続
```

---

## 6. Brain Server: 記憶の種類

| 種類 | 命名規則 | 用途 |
|------|----------|------|
| Tool | `tool-*` | ツール定義 + 使用例 |
| Agent | `agent-*` | Subagent定義 |
| Skill | `skill-*` | 手順記憶 |
| Pattern | `pattern-*` | 成功/失敗パターン |
| Task | `task-queue` | 未完了タスクリスト |

---

## 7. Hooks: 必須の3つ

### PreCompact (状態保存)

```python
#!/usr/bin/env python3
# .claude/hooks/pre-compact.py
import json, sys, subprocess
from datetime import datetime

input_data = json.load(sys.stdin)
session_id = input_data.get("session_id", "unknown")

# 状態をBrain Serverに保存
subprocess.run([
    "mcp-brain", "create",
    "--name", f"session-{session_id[:8]}",
    "--description", f"セッション状態 ({datetime.now().isoformat()})",
    "--instructions", "継続タスク: ..."
])

sys.exit(0)
```

### Stop (継続判定)

```python
#!/usr/bin/env python3
# .claude/hooks/stop-loop.py
import json, sys, subprocess

input_data = json.load(sys.stdin)
if input_data.get("stop_hook_active"):
    sys.exit(0)  # 無限ループ防止

# 次タスク確認
result = subprocess.run(
    ["mcp-brain", "get", "task-queue"],
    capture_output=True, text=True
)

if result.stdout and "未完了" in result.stdout:
    output = {"decision": "block", "reason": "次タスクがあります"}
    print(json.dumps(output))

sys.exit(0)
```

### PostToolUse (コンテキスト監視)

```python
#!/usr/bin/env python3
# .claude/hooks/context-monitor.py
import json, sys, os

input_data = json.load(sys.stdin)
transcript = input_data.get("transcript_path", "")

if os.path.exists(transcript):
    size = os.path.getsize(transcript)
    usage = (size / 4) / 200000 * 100  # 推定使用率
    
    if usage > 80:
        output = {
            "hookSpecificOutput": {
                "hookEventName": "PostToolUse",
                "additionalContext": f"WARNING: コンテキスト {usage:.0f}%"
            }
        }
        print(json.dumps(output))

sys.exit(0)
```

---

## 8. 自走ループ

```
1. タスク取得: brain_get("task-queue") or GitHub Issues
2. タスク実行: Root Agent + Subagents
3. コンテキスト監視: 80%超過でCompact警告
4. Compact時: PreCompact hookで状態保存
5. Stop時: 次タスク確認 → あれば継続
6. タスクなし: 終了
```

---

## 9. 安全機構

| 機構 | 設定場所 | 実装 |
|------|----------|------|
| 危険コマンド拒否 | permissions.deny | `Bash(rm -rf:*)`, `Bash(sudo:*)` |
| 機密ファイル保護 | permissions.deny | `Read(./.env)`, `Read(./secrets/**)` |
| 無限ループ防止 | Stop hook | `stop_hook_active`フラグ確認 |
| コスト上限 | Stop hook | 日次上限チェック |

---

## 10. 環境変数

```bash
# ~/.zshrc or .envrc
export ANTHROPIC_API_KEY="sk-..."
export GITHUB_TOKEN="ghp_..."
export BRAIN_DB_PATH="$HOME/.brain/memory.db"
```

---

## クイックスタート

```bash
# 1. 設定ファイル作成
mkdir -p .claude/hooks .claude/agents .claude/commands

# 2. CLAUDE.md作成
echo "# Project\n\n## Commands\n- npm run build" > CLAUDE.md

# 3. settings.json作成
cp docs/architecture/templates/settings.json .claude/

# 4. Claude Code起動
claude

# 5. 自走開始
> /project:daily-tasks
```

---

## 人間の役割

1. **監視**: 進捗確認
2. **タスク投入**: task-queueに追加
3. **承認**: 重要操作の許可

**それ以外は全てJARVISが自動実行**
