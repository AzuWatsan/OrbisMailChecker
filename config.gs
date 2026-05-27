const CONFIG = {
  // 新規メール
  NEW_MAIL_QUERY: 'label:"タグ設置依頼" -label:processed/backlog_exported',
  PROCESSED_LABEL: 'processed/backlog_exported',
  MAX_THREADS: 20,
  TARGET_TO: 'reco_desk@mg.opt.ne.jp',
  TARGET_SUBJECT: '【タグ設置',

  // 返信メール
  REPLY_MAIL_QUERY: 'label:"タグ設置依頼" newer_than:1h',
  PROCESSED_REPLY_IDS_KEY: 'processedReplyIds',
  PROCESSED_IDS_KEY: 'processedIds',

  SLACK_CHANNEL_ID_KEY: 'SLACK_CHANNEL_ID',
  SLACK_BOT_TOKEN_KEY: 'SLACK_BOT_TOKEN',
};

function getSlackToken_() {
  return PropertiesService.getScriptProperties().getProperty(CONFIG.SLACK_BOT_TOKEN_KEY);
}

function getSlackChannelId_() {
  return PropertiesService.getScriptProperties().getProperty(CONFIG.SLACK_CHANNEL_ID_KEY);
}

function getProcessedIds_(key) {
  const str = PropertiesService.getScriptProperties().getProperty(key);
  return str ? JSON.parse(str) : {};
}

function saveProcessedIds_(key, ids) {
  PropertiesService.getScriptProperties().setProperty(key, JSON.stringify(ids));
}