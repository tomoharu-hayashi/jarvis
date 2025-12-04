# AI Note

> **インテリジェントノートアプリ**

Markdownでノートを書き、AIが整理を手伝う。

## 機能

- 📝 Markdownノート作成・編集
- 🤖 AI要約生成
- 🏷️ タグ自動提案
- 🔗 関連ノート検索
- 🔍 全文検索

## インストール

```bash
npm install
```

## 使い方

```bash
# ノート作成
ainote create "会議メモ"

# ノート一覧
ainote list

# ノート表示
ainote show <id>

# AI要約
ainote summarize <id>

# タグ提案
ainote suggest-tags <id>

# 関連ノート検索
ainote related <id>
```

## 開発

```bash
npm run dev      # 開発モード
npm run test     # テスト
npm run build    # ビルド
```

## License

MIT
