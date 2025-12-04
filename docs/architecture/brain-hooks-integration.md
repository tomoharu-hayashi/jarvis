# Claude Code + Brain Server 統合設計

> **目的**: プロジェクトの完全自動化（自走）

---

## コンポーネント概要

| コンポーネント | 役割 | 設定場所 |
|---------------|------|----------|
| **Brain Server** | 統合記憶（経験・手順・パターン） | `.mcp.json` |
| **Hooks** | イベント駆動の監視・制御 | `.claude/settings.json` |
| **Subagents** | Claude Code Subagentによる専門タスク委譲 | `.claude/agents/*.md` |
| **Commands** | カスタムスラッシュコマンド | `.claude/commands/*.md` |
| **CLAUDE.md** | プロジェクトルール | `CLAUDE.md` |
| **GitHub Projects** | タスク管理・状態永続化 | GitHub |
| **Compact** | コンテキスト要約・復元 | Claude Code内蔵 |

---

## アーキテクチャ

```
Brain Server ←── search/get ──┐
     │                        │
     └── create/update ──→ Hooks ──→ Root Agent ──→ Subagents
                                          │
                                          └──→ GitHub Projects (タスク永続化)
```

---

## Brain Server: 記憶の種類

| 種類 | 命名規則 | 用途 |
|------|----------|------|
| Skill | `skill-*` | 手順記憶 |
| Pattern | `pattern-*` | 成功/失敗パターン |

> **タスク管理**: Claude Codeデフォルトのタスク機能 + GitHub Projectsで永続化

---

## Hooks: 必須3つ

| Hook | タイミング | 役割 |
|------|-----------|------|
| **PreCompact** | コンテキスト要約前 | 状態をBrainに保存 |
| **Stop** | タスク完了時 | 次タスク確認→継続判定 |
| **PostToolUse** | ツール実行後 | コンテキスト監視・学習 |

---

## 自走ループ

```
GitHub Projectsからタスク取得 → 実行 → コンテキスト監視 → Compact → 次タスク確認 → 継続/終了
```

### 状態永続化

| 対象 | 方法 |
|------|------|
| タスク状態 | GitHub Projectsを頻繁に更新 |
| コンテキスト | Claude Compact機能 |
| 経験・学習 | Brain Server |

---

## 安全機構

| 機構 | 実装 |
|------|------|
| 無限ループ防止 | `stop_hook_active`フラグ |
| コスト上限 | 日次上限で強制停止 |
| 承認ゲート | 本番操作は人間確認 |

---

## 人間の役割

- **監視**: 進捗確認
- **タスク投入**: task-queueに追加  
- **承認**: 重要操作の許可

**それ以外は全てJARVISが自動実行**
