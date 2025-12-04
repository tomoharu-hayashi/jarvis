# JARVIS Architecture

## ビジョン

**最終目標:** Desktop MCPを通じた、ファイル編集機能を持たない親エージェントからの全PC作業の自動化

```
将来:
  人間（監視）
    └─→ Root Agent（Desktop MCPのみ）
          └─→ あらゆるPC作業を自動化

現在（AI精度に合わせた制約）:
  人間（監視）
    └─→ Root Agent（開発プロジェクト単位）
          └─→ 開発ワークフローの自動化
```

現状のAI精度では汎用GUI操作の信頼性に限界があるため、スコープを「開発プロジェクト」に絞っている。これは技術的制約による一時的な措置であり、アーキテクチャ自体は上位互換を維持。

## 設計原則

1. **スケーラブル設計:** 現在は開発プロジェクト特化、将来は全PC作業へ拡張可能
2. **エージェントツリー:** 親子関係を持つエージェント構造。親は子孫の生殺与奪権を持つ
3. **自己継続:** エージェントは自分自身を再起動し、セッションの壁を超える
4. **コンテキスト自浄:** 子エージェント終了時、詳細は消え要約だけが親に残る
5. **クライアント非依存:** LLMクライアントは交換可能。コスト・性能に応じて選択
6. **既存資産活用:** 車輪の再発明を避け、既存のMCPサーバーを積極的に活用

## システム構成

```
┌─────────────────────────────────────────────────────────┐
│                    LLM Clients                          │
│  ┌─────────────┐ ┌─────────────┐                       │
│  │   Claude    │ │  VS Code /  │                       │
│  │    Code     │ │   Cursor    │                       │
│  └──────┬──────┘ └──────┬──────┘                       │
└─────────┼───────────────┼───────────────────────────────┘
          │               │
          └───────┬───────┘
                  │
      ┌───────────▼───────────┐
      │   MCP (JSON-RPC)      │
      │   stdio transport     │
      └───────────┬───────────┘
                  │
┌─────────────────┼─────────────────────────────────────┐
│             MCP Servers                                │
│  ┌──────────────┼──────────────────────────────────┐  │
│  │    ┌─────────┴───┐ ┌─────────┐                  │  │
│  │    │    Brain    │ │ Desktop │                  │  │
│  │    │    (自作)   │ │  (自作) │                  │  │
│  │    └──────┬──────┘ └────┬────┘                  │  │
│  │           │              │                      │  │
│  │    ┌──────▼──────┐ ┌────▼─────┐                 │  │
│  │    │  Embedding  │ │  macOS   │                 │  │
│  │    │  + GraphDB  │ │Automation│                 │  │
│  │    │ + N-hop検索 │ └──────────┘                 │  │
│  │    └─────────────┘                              │  │
│  └─────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

## エージェントツリー

セッションの壁を超え、継続的に動作するための中核アーキテクチャ。

```
人間（監視）
  │
  └─→ Root Agent
        │ 抽象的な目標
        │
        ├─spawn→ Sub Agent A ──spawn→ Sub Agent A-1
        │           │                    │
        │           └─report─────────────┘
        │              (要約のみ = 自浄)
        │
        └─spawn→ Sub Agent B
                    │
                    └─report→ 要約のみ返す
```

### 制御プロトコル

Claude Code Subagent機能を活用:

| 操作 | Claude Code機能 |
|------|----------------|
| 子エージェント生成 | `.claude/agents/*.md` で定義、Root Agentが自動召喚 |
| エージェント停止 | Claude Code内蔵の停止機構 |
| 要約報告 | Subagentの出力をRoot Agentが統合 |
| タスク管理 | Claude Codeのデフォルトタスク機能 |

### 自己継続プロトコル

```
セッション終了時:
  → Claude Compact機能で要約保存
  → GitHub Projectsでタスク状態を永続化
  → 次のセッションで復元

セッション開始時:
  → Claude Compactから要約を読み込み
  → GitHub Projectsから未完了タスクを取得
```

### コンテキスト自浄

子エージェントの詳細な作業ログは子と共に消える。親には要約だけが残る。

```
親 → 子: 抽象的な指示 + 必要最小限のコンテキスト
子 → 親: 結果の要約（具体詳細は破棄 = 自浄作用）
```

### 安全装置

| 制約 | 理由 |
|------|------|
| 最大深度 | 無限再帰防止 |
| 予算制限 | コスト爆発防止 |
| タイムアウト | ハング防止 |
| 人間エスカレ条件 | 判断不能時の脱出口 |

---

## MCP Servers

### Desktop Server (自作)

**リポジトリ:** [mcp-desktop-server](https://github.com/tomoharu-hayashi/mcp-desktop-server)

開発ツールのGUI操作を補助。E2Eテストやスクリーンショット検証などに活用。

**責務:**

- 画面キャプチャ・解析（Vision）
- マウス・キーボード入力
- アプリケーション状態の認識

**技術:**

- pyautogui / macOS Accessibility API
- OCR / Vision LLM

**注意:** 汎用GUI操作は精度に限界あり。開発ワークフローの補助ツールとして使用。

### Brain Server (自作)

**リポジトリ:** [mcp-brain-server](https://github.com/tomoharu-hayashi/mcp-brain-server)

JARVISの「記憶」。手順・事実・学習すべてを統合管理し、自動忘却機能を持つ高度な記憶サーバー。

**責務:**

- 知識の保存・意味検索・取得
- プロジェクト単位での知識分離
- 失敗からの学習を追記
- 関連知識のN-hop検索による連想記憶
- 自動忘却による記憶の最適化

**技術:**

- Embedding + ベクトル検索（意味検索）
- Graph DB（知識間の関連付け、N-hop検索）
- 自動忘却アルゴリズム

**データ構造:**

```
knowledge/
  ├── global/           # 汎用知識（全プロジェクト共通）
  └── projects/
      ├── jarvis/       # プロジェクト固有の知識
      ├── other-app/
      └── ...
```

**設計判断:** 当初「Skills」と「Memory」を分離する案があったが、どちらもEmbeddingで検索する以上、分ける意味がない。KISS原則に従い統合し、Brain Serverとして実装。Graph DBによる関連付けとN-hop検索により、AIが過去の経験から学び、同じ文脈で関連知識を想起できる。

---

## Agent to Agent (A2A) Protocol

**状態:** 不採用（独自実装で対応）

### 概要

GoogleがLinux Foundation傘下で開発するエージェント間通信プロトコル。

### 結論

JARVISではClaude Code Subagent機構を採用。理由：

- Claude Codeの `.claude/agents/*.md` でSubagent定義
- Hooks (`.claude/settings.json`) でイベント駆動制御
- 独自のAgent Serverは不要（Claude Code機能を活用）

## データフロー

```mermaid
sequenceDiagram
    participant User as 人間（監視）
    participant Root as Root Agent
    participant Sub as Claude Code Subagent
    participant Brain as Brain Server
    participant GH as GitHub Projects

    User->>GH: タスク投入
    Root->>GH: 未完了タスク取得
    Root->>Brain: 関連知識を検索
    Brain-->>Root: 関連知識（意味検索+N-hop）
    Root->>Sub: Subagent召喚（具体的タスク）
    Sub->>Brain: 既存知識を検索
    Brain-->>Sub: 手順・事実+関連記憶
    Sub->>Sub: タスク実行
    Sub->>Brain: 学んだ知識を保存
    Sub-->>Root: 要約のみ返却
    Note over Root,Sub: 詳細は破棄（自浄）
    Root->>GH: タスク状態更新
    Root-->>User: 完了報告
```

## 設計判断

### なぜDesktop Serverを汎用GUI操作に使わないか

- 汎用GUI操作は精度に限界がある（OCR誤認識、レイアウト変化等）
- 開発ツール（IDE、ターミナル）はAPI/CLIで直接操作する方が確実
- Desktop Serverはテスト・検証など限定的な用途で活用

### なぜエージェントツリーか

- セッションの壁を超える自己継続が必要
- コンテキスト肥大化を防ぐ自浄作用が必要
- 人間は根本で「監視」するだけ

## 今後の拡張

### Phase 1: 開発プロジェクト自動化（現在）

- **Claude Code Subagent活用:** `.claude/agents/*.md` による専門エージェント定義
- **Brain Server機能拡張:** 自動忘却アルゴリズムの最適化、N-hop検索の精度向上
- **状態永続化:** Claude Compact機能 + GitHub Projects連携

### Phase 2: 汎用PC作業への拡張（将来）

- **Desktop MCP精度向上:** Vision LLMの進化に追従
- **親エージェントの抽象化:** ファイル編集機能を持たない純粋な指揮者へ
- **対象領域拡大:** ブラウザ操作、Office作業、その他あらゆるGUIアプリケーション
