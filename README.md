# trello-cli

Bun で動作するシンプルな Trello CLI ツール。

## セットアップ

1. [Trello Power-Ups Admin](https://trello.com/power-ups/admin) で API キーを取得
2. API キーのページからトークンを生成
3. 環境変数を設定:

```bash
export TRELLO_KEY="your-api-key"
export TRELLO_TOKEN="your-token"
```

## インストール

```bash
# グローバルに使えるようにする
bun link
# または直接実行
bun run trello.ts
```

## 使い方

```bash
# ボード一覧
trello boards

# リスト一覧
trello lists <board-id>

# カード一覧
trello cards <board-id>

# カード詳細（JSON）
trello card <card-id>

# カード検索
trello search <キーワード>
```

## Tips

fzf と組み合わせて使う:

```bash
# ボードを選んでカード一覧を表示
trello boards | fzf | cut -f1 | xargs trello cards
```
