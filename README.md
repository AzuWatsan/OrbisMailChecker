# gmail-to-slack-notifier

Gmail で受信した特定のメールを検知し、Slack にスレッド形式で通知する Google Apps Script です。

## 機能

- **新規メール通知**：条件に一致する新着メールを検知し、件名でスレッドを立てて整形内容をリプライ
- **返信メール通知**：1時間おきに返信メール（Re:）をまとめてコードブロックで一覧投稿
- **重複防止**：PropertiesService によるメールID管理 ＋ Gmail ラベルの二重チェック
- **自動クリーンアップ**：1ヶ月以上経過した処理済みIDを月次で削除

## ファイル構成

```
config.gs   // 定数・プロパティ取得
slack.gs    // Slack投稿関連
gmail.gs    // Gmail検索・メール処理・整形
main.gs     // エントリーポイント・トリガー関数
```

## セットアップ

### 1. Slack App の準備

1. [Slack API](https://api.slack.com/apps) にアクセスし、既存または新規の App を開く
2. **「OAuth & Permissions」** → **「Bot Token Scopes」** に `chat:write` を追加
3. **「Install to Workspace」** でインストールし、`xoxb-` から始まる Bot Token をコピー
4. 投稿先チャンネルで `/invite @アプリ名` を実行して App を招待

### 2. チャンネル ID の確認

Slack で投稿先チャンネルを右クリック →「チャンネル詳細を表示」→ 最下部に表示される `C` から始まる文字列

### 3. スクリプトプロパティの設定

GAS エディタの「プロジェクトの設定」→「スクリプトプロパティ」に以下を追加：

| プロパティ名 | 値 |
|---|---|
| `SLACK_BOT_TOKEN` | `xoxb-xxxx...` |
| `SLACK_CHANNEL_ID` | `Cxxxxxxxx` |
| `SLACK_WEBHOOK_URL` | （不要になった場合は削除可） |

### 4. 初回セットアップ用スクリプトの実行

トリガーを設定する前に、GAS エディタで `initializeProcessedIds()` を一度手動実行してください。

これにより既存のメールが処理済みとして登録され、初回から大量通知が来るのを防げます。

### 5. トリガーの設定

GAS エディタの「トリガー」から以下を設定：

| 関数 | 種類 | 頻度 |
|---|---|---|
| `run` | 時間ベース | 1時間おき |
| `cleanupProcessedIds` | 時間ベース | 月1回 |

## 検知条件のカスタマイズ

`config.gs` の `CONFIG` を編集してください。

```javascript
const CONFIG = {
  // 新規メールの検索クエリ
  NEW_MAIL_QUERY: 'label:"タグ設置依頼" -label:processed/backlog_exported',

  // 処理済みラベル名
  PROCESSED_LABEL: 'processed/backlog_exported',

  // 一度に処理するスレッドの最大数
  MAX_THREADS: 20,

  // 必須の宛先アドレス
  TARGET_TO: 'reco_desk@mg.opt.ne.jp',

  // 件名に含まれる必須キーワード
  TARGET_SUBJECT: '【タグ設置',
  ...
};
```

## Slack の投稿形式

**新規メール：**
```
📩 *件名*
  └ 整形されたメール本文（スレッド内リプライ）
```

整形できない場合（囲みブロックなし）：
```
📩 *件名*
  └ ⚠️ 手動確認が必要です
```

**返信メール（1時間ごとにまとめて）：**
```
📬 返信メール一覧
  Re: [reco_desk:001] 【タグ設置...
  [reco_desk:002] Re: 【タグ設置...
```

## テスト

`previewTagRequests()` を実行すると、Slack に送信せずに直近5件の整形結果をログで確認できます。

## 注意事項

- GAS の全ファイルはグローバルスコープを共有するため、`CONFIG` などの定数名が重複しないよう注意してください
- `processedIds` は PropertiesService に JSON 形式で保存されます。上限（500KB）に近づいた場合は `cleanupProcessedIds()` を手動実行してください
