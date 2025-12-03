# Gemini CLI リファレンス

> **基幹システムとして採用** - JARVISプロジェクトのメインクライアント

## 概要

| 項目 | 内容 |
|------|------|
| バージョン | 0.17.1 |
| 認証方式 | OAuth (personal) |
| 無料枠 | 60リクエスト/分、1,000リクエスト/日 |
| コンテキストウィンドウ | 1M トークン (Gemini 2.5 Pro) |

## 基本コマンド

```bash
# インタラクティブモード起動
gemini

# 特定モデル指定
gemini -m gemini-2.5-flash

# 非インタラクティブ（スクリプト用）
gemini -p "プロンプト"

# JSON出力
gemini -p "質問" --output-format json

# 複数ディレクトリを含める
gemini --include-directories ../lib,../docs

# セッション再開
gemini --resume latest
gemini --resume 5

# セッション一覧
gemini --list-sessions

# YOLOモード（全ツール自動承認）
gemini -y
# または
gemini --approval-mode yolo
```

## Approval Mode

| モード | 説明 |
|--------|------|
| `default` | ツール実行時に確認プロンプト |
| `auto_edit` | 編集ツールのみ自動承認 |
| `yolo` | 全ツール自動承認（危険） |

---

## モデル設定

### 利用可能なモデル

| モデル | 説明 |
|--------|------|
| `gemini-3-pro-preview` | Gemini 3 Pro (プレビュー) |
| `gemini-2.5-pro` | デフォルト、1Mトークン |
| `gemini-2.5-flash` | 高速版 |
| `gemini-2.5-flash-lite` | 軽量版 |

```bash
# コマンドラインで指定
gemini -m gemini-3-pro-preview

# settings.json で永続化
{
  "model": {
    "name": "gemini-3-pro-preview"
  }
}
```

---

## 組み込みツール制御

### ツールの無効化

```json
{
  "tools": {
    "exclude": ["write_file", "run_shell_command"]
  }
}
```

### 特定ツールのみ有効化（ホワイトリスト）

```json
{
  "tools": {
    "core": ["read_file", "search_file_content", "list_files"]
  }
}
```

### 自動承認するツールを指定

```json
{
  "tools": {
    "allowed": ["run_shell_command(git)", "run_shell_command(npm test)"]
  }
}
```

---

## MCP Server 統合

### 設定ファイル

- **ユーザー設定**: `~/.gemini/settings.json`
- **プロジェクト設定**: `.gemini/settings.json`

### CLIでのMCPサーバー管理

```bash
# サーバー一覧
gemini mcp list

# Stdioサーバー追加（プロジェクトスコープ）
gemini mcp add <name> <command> [args...]

# ユーザースコープで追加
gemini mcp add -s user <name> <command>

# 環境変数付きで追加
gemini mcp add -e API_KEY=xxx my-server python server.py

# HTTPサーバー追加
gemini mcp add --transport http http-server https://api.example.com/mcp/

# SSEサーバー追加
gemini mcp add --transport sse sse-server https://api.example.com/sse/

# 信頼済みサーバー（確認スキップ）
gemini mcp add --trust trusted-server python server.py

# サーバー削除
gemini mcp remove <name>
```

### settings.json 設定例

```json
{
  "mcpServers": {
    "desktop": {
      "command": "uv",
      "args": ["run", "mcp-desktop-server"],
      "cwd": "/path/to/mcp-desktop-server",
      "timeout": 30000,
      "trust": true
    },
    "pythonServer": {
      "command": "python",
      "args": ["-m", "my_server"],
      "env": {
        "API_KEY": "$MY_API_KEY"
      }
    },
    "httpServer": {
      "httpUrl": "http://localhost:3000/mcp",
      "headers": {
        "Authorization": "Bearer token"
      }
    },
    "sseServer": {
      "url": "https://api.example.com/sse"
    }
  },
  "mcp": {
    "allowed": ["desktop", "memory"],
    "excluded": ["experimental"]
  }
}
```

### 設定プロパティ

| プロパティ | 説明 |
|------------|------|
| `command` | Stdioトランスポート用コマンド |
| `args` | コマンド引数 |
| `url` | SSEエンドポイントURL |
| `httpUrl` | HTTPストリーミングURL |
| `env` | 環境変数（`$VAR`で参照可能） |
| `cwd` | 作業ディレクトリ |
| `timeout` | タイムアウト（ミリ秒、デフォルト600,000） |
| `trust` | `true`で確認ダイアログスキップ |
| `includeTools` | 許可するツール（ホワイトリスト） |
| `excludeTools` | 除外するツール（優先） |
| `headers` | HTTPヘッダー |

### インタラクティブ時のMCPコマンド

```
/mcp              # サーバーステータス確認
/mcp auth         # OAuth認証が必要なサーバー一覧
/mcp auth <name>  # 特定サーバーのOAuth認証
```

---

## 拡張機能 (Extensions)

```bash
# 拡張機能一覧
gemini extensions list
gemini --list-extensions

# インストール
gemini extensions install <git-url-or-path>
gemini extensions install https://github.com/user/extension.git

# アンインストール
gemini extensions uninstall <name>

# 更新
gemini extensions update --all
gemini extensions update <name>

# 有効化/無効化
gemini extensions enable <name>
gemini extensions disable <name>

# ローカル開発用リンク
gemini extensions link /path/to/extension

# 新規拡張機能作成
gemini extensions new /path/to/new-extension

# バリデーション
gemini extensions validate /path/to/extension
```

---

## スラッシュコマンド

| コマンド | 説明 |
|----------|------|
| `/help` | ヘルプ表示 |
| `/chat` | 新しいチャット開始 |
| `/mcp` | MCPサーバーステータス |
| `/bug` | バグレポート |

MCPサーバーが定義したプロンプトもスラッシュコマンドとして利用可能：

```
/poem-writer --title="Gemini CLI" --mood="reverent"
```

---

## Context Files (GEMINI.md)

プロジェクトルートに `GEMINI.md` を配置することで、Gemini CLIに永続的なコンテキストを提供。

---

## デバッグ

```bash
# デバッグモード
gemini --debug
gemini -d
```

---

## 組み込みツール

- **File System Operations**: ファイル操作
- **Shell Commands**: シェルコマンド実行
- **Web Fetch & Search**: Web取得・Google検索グラウンディング

---

## JARVIS統合計画

### Phase 1: Desktop Server統合

```bash
# mcp-desktop-server を追加
gemini mcp add --trust desktop uv -- run mcp-desktop-server
```

### settings.json 初期設定

```json
{
  "mcpServers": {
    "desktop": {
      "command": "uv",
      "args": ["run", "mcp-desktop-server"],
      "cwd": "/path/to/mcp-desktop-server",
      "trust": true
    }
  }
}
```

### Phase 2: Brain Server追加

```bash
# mcp-brain-server を追加
gemini mcp add --trust brain uv -- run mcp-brain-server
```

```json
{
  "mcpServers": {
    "desktop": {
      "command": "uv",
      "args": ["run", "mcp-desktop-server"],
      "cwd": "/path/to/mcp-desktop-server",
      "trust": true
    },
    "brain": {
      "command": "uv",
      "args": ["run", "mcp-brain-server"],
      "cwd": "/path/to/mcp-brain-server",
      "trust": true
    }
  }
}
```

---

## リソース

- [公式ドキュメント](https://geminicli.com/docs/)
- [GitHub](https://github.com/google-gemini/gemini-cli)
- [MCP統合ガイド](https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md)

---

## Gemini 3 の制限 — 確認方法と注意点

- 現時点での公式ドキュメントは地域やリリースによって差分があり、直接参照できない場合があります。CLIへ問い合せると一般的な仕様を返しますが、必ずしもアカウントごとのクォータを保証するものではありません。
- CLI での簡易確認（あくまで参考応答）:

```bash
# モデルに直接問い合わせ（あくまで参考応答）
gemini -m gemini-3-pro-preview -p "What is your context window (in tokens) and typical rate limits?" --output-format json
```

- 正確な制限（推奨手順）:
  1. Google Cloud / Generative AI の管理コンソールで該当プロジェクトのクォータを確認（Console → Quotas / Generative AI）。
  2. Gemini API キーや Code Assist ライセンスのプランに応じたレート制限が適用されるため、アカウントの利用規約と料金ページを確認する。
  3. 企業利用や高いスループットが必要な場合は Google の営業やサポートに問い合わせて専用クォータを申請する。

- よくある目安（参考、アカウントや時期で変動）:
  - コンテキストウィンドウ: モデルやプランによって異なる。Gemini 2.5 系は 1M トークンが一般的だが、Gemini 3 系はリリース・プランで変更される可能性がある。
  - レート制限: 無料枠は低め（数十/分）、有料プランは数百〜数千/分のレンジが提示されることが多い。

---
