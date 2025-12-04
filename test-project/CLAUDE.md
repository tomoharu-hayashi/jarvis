# AI Note

プロジェクト概要は @README.md を参照。

## Commands

```bash
npm run dev        # 開発サーバー起動
npm run build      # ビルド
npm run test       # テスト実行
npm run lint       # Lint
```

## Coding Rules

- YAGNI/KISS原則を厳守
- ライブラリを積極活用、独自実装は最小限
- 可読性重視（命名の一貫性、適切な構造）
- 必要箇所のみ日本語コメント

## Workflow

1. タスク開始前: `brain_search` で過去経験を確認
2. 実装: TDD（テスト先行）
3. 完了後: `brain_create/update` で学習を記録
4. PR前: `npm run lint && npm run test` 必須

## Architecture

```
src/
├── cli.ts              # CLIエントリポイント
├── core/               # ドメインロジック
├── ai/                 # AI機能
└── utils/              # ユーティリティ
```

## Tasks

- [x] プロジェクト初期化
- [x] Noteエンティティ実装
- [x] SQLiteリポジトリ実装
- [x] CLI基本コマンド
- [x] AI要約機能
- [x] タグ自動提案
- [x] 関連ノート検索
- [x] Todo機能
- [x] テスト作成
