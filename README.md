# JARVIS

> **"Just A Rather Very Intelligent System"**

自律型AIエージェント。人間は監視に徹し、全ての操作はJARVISが実行する。

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

リアルタイム性を伴わない全てのコンピュータ操作

## Architecture

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
        subgraph Desktop ["Desktop Server (自作)"]
            Vision[Vision] --> Input[Input Control]
        end
        subgraph Memory ["Memory Server (既存活用)"]
            VectorDB[("Vector DB")]
        end
    end

    Clients --> Pipe --> Servers
```

> **設計思想:** Desktop操作が基本。ターミナルもエディタもGUIとして操作する。
> **基幹システム:** Gemini CLI - 無料枠（60req/分、1000req/日）で高性能な1Mトークンコンテキスト

## Tech Stack

- **Protocol:** Model Context Protocol (MCP)
- **Runtime:** Python 3.12+ / Node.js
- **Vector DB:** Chroma / SQLite
- **Platform:** macOS (Apple Silicon)

## MCP Servers

| Server | 状態 | リポジトリ |
|--------|------|------------|
| **Desktop** | 自作 | [mcp-desktop-server](https://github.com/tomoharu-hayashi/mcp-desktop-server) |
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
