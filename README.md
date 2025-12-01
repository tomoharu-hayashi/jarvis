# JARVIS

> **"Just A Rather Very Intelligent System"**

自律型AIエージェント。人間は監視に徹し、全ての操作はJARVISが実行する。

## Philosophy

**「人間は監視に徹し、全ての操作はJARVISが実行する」**

従来の「人間が作業し、AIが補助する」関係を逆転。ユーザーは監視に集中し、実作業は JARVIS が実行する。

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
