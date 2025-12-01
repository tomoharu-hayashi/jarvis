---
applyTo: "**"
---
# JARVIS - 自律型AIエージェント

## コンセプト
「人間はコンテキスト（文脈）の支配に徹し、実行はAIが担う」

## 対象領域
- **Engineering:** コーディング、環境構築、テスト、Git管理、デプロイ
- **Creative:** 素材収集、動画編集（DaVinci Resolve等）、レンダリング

## アーキテクチャ
**Desktop First:** 全ての操作はGUIを通じて行う

### MCP Servers
| Server | 状態 | 備考 |
|--------|------|------|
| Desktop | 自作 | [mcp-desktop-server](https://github.com/tomoharu-hayashi/mcp-desktop-server) |
| Memory | 既存活用 | 調査中 |


## Tech Stack
- Protocol: Model Context Protocol (MCP)
- Platform: macOS (Apple Silicon)
