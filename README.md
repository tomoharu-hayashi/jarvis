# JARVIS

> **"Just A Rather Very Intelligent System"**

開発プロジェクトの全自動化を目指す自律型AIエージェント。

> **将来展望:** Desktop MCPを通じた全PC作業の自動化。現在はAI精度の制約により開発プロジェクトに特化。

## Philosophy

**「人間は監視に徹し、全ての操作はJARVISが実行する」**

### 背景

AIを使う人間の本質的な仕事は**コンテキスト管理**だった。

- **抽象化**: 目的・背景・制約を構造化しAIに伝達
- **具体化**: AIの出力を現実と照合し次の判断を行う
- **忘却**: 不要な情報を捨て、本質を残す自浄作用

このコンテキスト管理自体をシステムで最適化すれば、人間の介在は「監視」のみとなる。

**それがシンギュラリティへの道筋。**

### 将来対応候補

| 機能 | 説明 | 実装案 |
|------|------|--------|
| 優先順位付け | 何が重要かを判断 | タスクの重み付け |
| 連想・関連付け | 過去の経験と紐づける | Graph DB |
| 中断・再開 | 割り込み対応、後で戻る | セッション管理 |
| メタ認知 | 「今何をしているか」の把握 | 状態の可視化 |

## Target Domains

開発プロジェクトにおける全てのタスク

- コード実装・レビュー・リファクタリング
- テスト作成・実行・修正
- ドキュメント作成・更新
- CI/CD・デプロイ
- Issue管理・PR作成

## Architecture

```
人間（監視）
  │
  └─→ Root Agent
        ├─ 抽象的目標を保持
        ├─ 子エージェントに委譲（spawn）
        ├─ 要約のみ受け取る（自浄）
        └─ 全子孫の停止権（kill）
```

```mermaid
graph TD
    subgraph Clients ["【クライアント】"]
        ClientA["Gemini CLI (基幹)"]
        ClientB["VS Code / Cursor"]
        ClientC["Claude Desktop App"]
    end

    subgraph MCP ["Model Context Protocol"]
        Pipe[JSON-RPC over stdio]
    end

    subgraph Servers ["【MCP Servers】"]
        subgraph Brain ["Brain Server (自作)"]
            EmbeddingSearch["Embedding検索"] --> AutoForget["自動忘却"]
        end
        subgraph Desktop ["Desktop Server (自作)"]
            Vision[Vision] --> Input[Input Control]
        end
        subgraph Memory ["Memory Server (既存活用)"]
            VectorDB[("長期記憶")]
        end
    end

    Clients --> Pipe --> Servers
```

> **設計思想:** エージェントが自己継続し、コンテキストは自浄される。セッションの壁を超えて動作。

## Tech Stack

- **Protocol:** Model Context Protocol (MCP)
- **Runtime:** Python 3.12+ / Node.js
- **Vector DB:** Chroma / SQLite
- **Platform:** macOS (Apple Silicon)

## MCP Servers

| Server | 状態 | リポジトリ |
|--------|------|------------|
| **Desktop** | 自作 | [mcp-desktop-server](https://github.com/tomoharu-hayashi/mcp-desktop-server) |
| **Brain** | 自作 | [mcp-brain-server](https://github.com/tomoharu-hayashi/mcp-brain-server) |
| **Memory** | 既存活用予定 | TBD |

## Project Structure

```
jarvis/
├── README.md
├── docs/
│   └── architecture.md
└── .github/
    └── instructions/       # AI向け指示書
```

## Getting Started

```bash
# 1. Clone
git clone https://github.com/tomoharu-hayashi/jarvis.git
cd jarvis

# 2. Setup (TBD)
```

## License

MIT
