/**
 * トリガーから1時間おきに呼ぶ関数
 */
function run() {
  processNewMails_();
  processReplyMails_();
}

/**
 * 1ヶ月以上経過したIDを削除（月1トリガー推奨）
 */
function cleanupProcessedIds() {
  const cutoffTime = new Date().getTime() - 30 * 24 * 60 * 60 * 1000;

  [CONFIG.PROCESSED_IDS_KEY, CONFIG.PROCESSED_REPLY_IDS_KEY].forEach(key => {
    const ids = getProcessedIds_(key);
    for (const id in ids) {
      if (ids[id] < cutoffTime) delete ids[id];
    }
    saveProcessedIds_(key, ids);
  });
}

/**
 * プレビュー（テスト用・Slack送信なし）
 */
function previewTagRequests() {
  const threads = GmailApp.search(CONFIG.NEW_MAIL_QUERY, 0, 5);
  if (!threads.length) { Logger.log('対象メールなし'); return; }

  threads.forEach((thread, i) => {
    const targetMsg = findTargetMessage_(thread, { replyMode: false });
    if (!targetMsg) { Logger.log(`[${i + 1}] 条件一致メールなし`); return; }

    const body = targetMsg.getPlainBody() || '';
    const block = extractMainBlock_(body);

    Logger.log(`========== [${i + 1}件目] ==========`);
    Logger.log('件名: ' + targetMsg.getSubject());

    if (block) {
      const person = extractPerson_(block);
      Logger.log('担当者: ' + person);
      Logger.log('整形結果:\n' + buildBacklogText_(person, block));
    } else {
      Logger.log('⚠️ 囲みブロックなし・手動確認が必要');
    }
  });
}